# Security Specification — Creator–Freelancer Collaboration Marketplace

## 1. Data Invariants
1. **Identity Isolation**: Every user document in `/users/{userId}` contains PII (`email`) and is readable/writable strictly by `request.auth.uid == userId` or `isAdmin()`.
2. **No Self-Assigned Admin Privileges**: `/users/{userId}.role` is strictly restricted to `'creator'` or `'freelancer'`. Admin privileges are verified only via `request.auth.token.email == 'iamberlin17@gmail.com'` (with `email_verified == true`) or `/admins/{uid}`.
3. **Proposal Privacy**: Proposals in `/proposals/{proposalId}` are readable (`get` and `list`) exclusively by the submitting `freelancerUid`, the project's `creatorUid`, or `isAdmin()`.
4. **Order Workflow & Terminal State Locking**: Orders in `/orders/{orderId}` transition along creator/freelancer actions (`ordered` -> `in_progress` -> `delivered` -> `revision_requested` -> `completed`). Once `status` is `completed` or `cancelled`, non-admin updates are locked.
5. **Conversation Participant Gate**: Conversations and `/conversations/{conversationId}/messages/{messageId}` are readable and writable strictly by users listed in `participantUids` (size 2).
6. **Temporal & Structural Integrity**: `createdAt` and `updatedAt` are validated against `request.time`; `hasAll` and `hasOnly` enforce strict schema keys on creation; `affectedKeys().hasOnly(...)` guards every update branch.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation**: `POST /users/{uid}` with `{ role: "admin" }` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection**: `POST /freelancers/{id}` with extra `{ isFeatured: true }` -> `PERMISSION_DENIED`.
3. **PII Blanket Read**: `GET /users/{otherUid}` as non-owner non-admin -> `PERMISSION_DENIED`.
4. **Unauthorized Proposal List**: `LIST /proposals` without matching `freelancerUid` or `creatorUid` -> `PERMISSION_DENIED`.
5. **Proposal Price Tampering**: `PATCH /proposals/{id}` by creator attempting to lower `proposedPrice` -> `PERMISSION_DENIED`.
6. **Order Terminal State Bypass**: `PATCH /orders/{id}` when existing `status == 'completed'` -> `PERMISSION_DENIED`.
7. **Unauthorized Order Payout Release**: Freelancer marking own order `completed` directly -> `PERMISSION_DENIED`.
8. **Chat Eavesdropping**: `GET /conversations/{id}/messages/{msgId}` by non-participant UID -> `PERMISSION_DENIED`.
9. **Spoofed Message Sender**: `POST /conversations/{id}/messages/{msgId}` with `senderUid != request.auth.uid` -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Document ID > 128 chars or containing spaces/slashes -> `PERMISSION_DENIED`.
11. **Oversized Payload**: `freelancer.bio` > 2000 chars or `skills` array > 10 items -> `PERMISSION_DENIED`.
12. **Fake Timestamp Injection**: `createdAt != request.time` on document creation -> `PERMISSION_DENIED`.
