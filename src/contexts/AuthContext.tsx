import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleAuthProvider } from '@/src/lib/firebase';
import { upsertUserAccount } from '@/src/lib/firestoreService';
import type { UserAccount, UserRole } from '@/src/types/marketplace';

const PRIMARY_ADMIN_EMAIL = 'iamberlin17@gmail.com';

interface AuthContextValue {
  firebaseUser: User | null;
  userAccount: UserAccount | null;
  loading: boolean;
  needsOnboarding: boolean;
  isAdmin: boolean;
  pendingRoleChoice: UserRole;
  setPendingRoleChoice: (role: UserRole) => void;
  signInWithGoogle: (selectedRole?: UserRole) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  completeOnboarding: (role: UserRole, displayName: string, channelName?: string, bio?: string) => Promise<void>;
  updateAccountProfile: (updates: { displayName: string; role: UserRole; channelName?: string; bio?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [isAdminDoc, setIsAdminDoc] = useState(false);
  const [pendingRoleChoice, setPendingRoleChoice] = useState<UserRole>('creator');

  useEffect(() => {
    let unsubAccount: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (unsubAccount) {
        unsubAccount();
        unsubAccount = null;
      }

      if (!user) {
        setUserAccount(null);
        setIsAdminDoc(false);
        setAccountLoaded(true);
        setLoading(false);
        return;
      }

      setAccountLoaded(false);
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        setIsAdminDoc(adminSnap.exists());
      } catch {
        setIsAdminDoc(false);
      }

      unsubAccount = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          if (snap.exists()) {
            setUserAccount(snap.data() as UserAccount);
          } else {
            setUserAccount(null);
          }
          setAccountLoaded(true);
          setLoading(false);
        },
        () => {
          setUserAccount(null);
          setAccountLoaded(true);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubAccount) unsubAccount();
    };
  }, []);

  const signInWithGoogle = async (selectedRole?: UserRole) => {
    if (selectedRole) setPendingRoleChoice(selectedRole);
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists() && selectedRole) {
      await upsertUserAccount({
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'Creator',
        role: selectedRole,
        avatarUrl: cred.user.photoURL || undefined,
      });
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => {
    setPendingRoleChoice(role);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Verification email is best-effort if provider restricts
    }
    if (cred.user.emailVerified) {
      await upsertUserAccount({
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName,
        role,
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const completeOnboarding = async (
    role: UserRole,
    displayName: string,
    channelName?: string,
    bio?: string
  ) => {
    if (!firebaseUser) return;
    await upsertUserAccount({
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName,
      role,
      avatarUrl: firebaseUser.photoURL || undefined,
      channelName,
      bio,
    });
  };

  const updateAccountProfile = async (updates: {
    displayName: string;
    role: UserRole;
    channelName?: string;
    bio?: string;
  }) => {
    if (!firebaseUser) return;
    await upsertUserAccount({
      uid: firebaseUser.uid,
      email: firebaseUser.email || userAccount?.email || '',
      displayName: updates.displayName,
      role: updates.role,
      avatarUrl: firebaseUser.photoURL || userAccount?.avatarUrl,
      channelName: updates.channelName,
      bio: updates.bio,
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = Boolean(
    firebaseUser &&
      firebaseUser.emailVerified &&
      (firebaseUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL || isAdminDoc)
  );

  const needsOnboarding = Boolean(firebaseUser && accountLoaded && !userAccount);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userAccount,
        loading,
        needsOnboarding,
        isAdmin,
        pendingRoleChoice,
        setPendingRoleChoice,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        sendResetEmail,
        completeOnboarding,
        updateAccountProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
