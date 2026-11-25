import React, { useState } from 'react';
import { Briefcase, Video } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button, Input, Modal, Textarea } from '@/src/components/ui/primitives';
import type { UserRole } from '@/src/types/marketplace';

interface AuthModalProps {
  open: boolean;
  initialMode: 'login' | 'signup';
  initialRole?: UserRole;
  onClose: () => void;
}

export function AuthModal({
  open,
  initialMode,
  initialRole = 'creator',
  onClose,
}: AuthModalProps) {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail, sendResetEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setRole(initialRole);
      setError('');
      setNotice('');
    }
  }, [open, initialMode, initialRole]);

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle(mode === 'signup' ? role : undefined);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'forgot') {
        await sendResetEmail(email.trim());
        setNotice('Password reset instructions have been sent to your email.');
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Please enter your name or studio name.');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(email.trim(), password, displayName.trim(), role);
        setNotice('Account created. Check your inbox to verify your email, or continue with Google sign-in.');
      } else {
        await signInWithEmail(email.trim(), password);
        onClose();
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Authentication failed.';
      if (raw.includes('operation-not-allowed')) {
        setError(
          'Email/password login is not enabled on this Firebase project yet. Use Google Sign-In below for instant access, or enable Email/Password in your Firebase Console.'
        );
      } else {
        setError(raw.replace('Firebase: ', ''));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        mode === 'signup'
          ? 'Create your Keyframe account'
          : mode === 'forgot'
            ? 'Reset your password'
            : 'Sign in to Keyframe'
      }
      subtitle={
        mode === 'signup'
          ? 'Select your role to personalize your studio workspace.'
          : mode === 'forgot'
            ? 'Enter your email address to receive a password reset link.'
            : 'Access your projects, orders, messages, and earnings.'
      }
    >
      <div className="space-y-5">
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#141418] border border-[#2A2A32] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-[#E8F553] text-[#131316]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'signup' ? 'bg-[#E8F553] text-[#131316]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              I am joining as a
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('creator')}
                className={`p-3.5 text-left rounded-lg border transition-colors cursor-pointer ${
                  role === 'creator'
                    ? 'border-[#E8F553] bg-[#E8F553]/10 text-white'
                    : 'border-[#2E2E38] hover:border-zinc-500 text-zinc-300'
                }`}
              >
                <Video className="w-4 h-4 text-[#E8F553] mb-1.5" />
                <div className="text-sm font-semibold">Content Creator</div>
                <div className="text-xs text-zinc-400 mt-0.5">Hire editors & post briefs</div>
              </button>
              <button
                type="button"
                onClick={() => setRole('freelancer')}
                className={`p-3.5 text-left rounded-lg border transition-colors cursor-pointer ${
                  role === 'freelancer'
                    ? 'border-[#E8F553] bg-[#E8F553]/10 text-white'
                    : 'border-[#2E2E38] hover:border-zinc-500 text-zinc-300'
                }`}
              >
                <Briefcase className="w-4 h-4 text-[#E8F553] mb-1.5" />
                <div className="text-sm font-semibold">Freelancer</div>
                <div className="text-xs text-zinc-400 mt-0.5">Offer services & bid</div>
              </button>
            </div>
          </div>
        )}

        {mode !== 'forgot' && (
          <>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleGoogle}
              disabled={submitting}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              Continue with Google
            </Button>
            <div className="relative flex items-center justify-center text-xs text-zinc-500">
              <span className="w-full border-t border-[#2A2A32]" />
              <span className="px-3 bg-[#1C1C21] whitespace-nowrap">or continue with email</span>
              <span className="w-full border-t border-[#2A2A32]" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name or Studio</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Rivera or Northbound Studio"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              required
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                    }}
                    className="text-xs text-[#E8F553] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </p>
          )}
          {notice && (
            <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              {notice}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Create Account'
                : mode === 'forgot'
                  ? 'Send Reset Link'
                  : 'Sign In'}
          </Button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-xs text-zinc-400 hover:text-white py-1 cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </Modal>
  );
}

export function OnboardingModal() {
  const { firebaseUser, needsOnboarding, pendingRoleChoice, completeOnboarding, logout } = useAuth();
  const [role, setRole] = useState<UserRole>(pendingRoleChoice);
  const [displayName, setDisplayName] = useState(firebaseUser?.displayName || '');
  const [channelName, setChannelName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    setRole(pendingRoleChoice);
    if (firebaseUser?.displayName) setDisplayName(firebaseUser.displayName);
  }, [pendingRoleChoice, firebaseUser]);

  if (!needsOnboarding || !firebaseUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await completeOnboarding(role, displayName.trim(), channelName.trim() || undefined, bio.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={true}
      onClose={() => void logout()}
      title="Complete your Keyframe profile"
      subtitle="Choose your primary workspace role to unlock your dashboard."
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`p-3.5 text-left rounded-lg border transition-colors cursor-pointer ${
              role === 'creator'
                ? 'border-[#E8F553] bg-[#E8F553]/10 text-white'
                : 'border-[#2E2E38] hover:border-zinc-500 text-zinc-300'
            }`}
          >
            <Video className="w-4 h-4 text-[#E8F553] mb-1.5" />
            <div className="text-sm font-semibold">Content Creator</div>
            <div className="text-xs text-zinc-400 mt-0.5">Post projects & hire talent</div>
          </button>
          <button
            type="button"
            onClick={() => setRole('freelancer')}
            className={`p-3.5 text-left rounded-lg border transition-colors cursor-pointer ${
              role === 'freelancer'
                ? 'border-[#E8F553] bg-[#E8F553]/10 text-white'
                : 'border-[#2E2E38] hover:border-zinc-500 text-zinc-300'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#E8F553] mb-1.5" />
            <div className="text-sm font-semibold">Freelancer</div>
            <div className="text-xs text-zinc-400 mt-0.5">Showcase portfolio & earn</div>
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            {role === 'creator' ? 'Channel or Brand Name (Optional)' : 'Primary Specialty (Optional)'}
          </label>
          <Input
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder={role === 'creator' ? 'e.g. Northbound Studio' : 'e.g. Documentary Video Editor'}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">Short Bio (Optional)</label>
          <Textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Describe your content style or production focus..."
          />
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => void logout()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Enter Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
