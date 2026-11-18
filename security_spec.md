# Security Specification — ResolveLoop Firestore Rules

## 1. Data Invariants
1. **User PII Isolation**: A `UserProfile` document at `/users/{userId}` can only be read, created, or updated by the verified authenticated owner (`request.auth.uid == userId`).
2. **Complaint Ownership & Immutability**: Every `Complaint` at `/complaints/{complaintId}` must have `userId == request.auth.uid`. `userId`, `ticketCode`, and `createdAt` are immutable after creation.
3. **Subcollection Master Gate**: Every `ComplaintEvent` at `/complaints/{complaintId}/events/{eventId}` belongs to the owner of the parent complaint (`get(/databases/$(database)/documents/complaints/$(complaintId)).data.userId == request.auth.uid`) and carries `userId == request.auth.uid` for zero-lookup `list` enforcement.
4. **Terminal State Lock**: Once a complaint reaches `status == 'Resolved'`, further updates are blocked.
5. **Temporal Integrity**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
6. **Strict Key & Size Bounds**: Every write validates `keys().hasAll(...) && keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, and explicit `.size()` bounds on all strings and lists.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Cross-User Profile Read**: User B attempts `get(/users/userA)`.
2. **Identity Spoofing on Complaint Create**: User B attempts to create a complaint with `userId: "userA"`.
3. **Shadow Field Injection on Create**: User A submits a complaint with extra undeclared key `isAdminOverride: true`.
4. **Oversized ID Poisoning**: User A writes to `/complaints/${'a'.repeat(300)}`.
5. **Invalid Timestamp Spoofing**: User A creates a complaint with client-forged `createdAt` instead of `request.time`.
6. **Immortal Field Tampering**: User A updates a complaint attempting to change `userId` or `createdAt`.
7. **Post-Resolution Mutation**: User A updates a complaint whose `existing().status == 'Resolved'`.
8. **Unauthenticated List Query**: Unauthenticated client calls `getDocs(collection(db, 'complaints'))`.
9. **Cross-User Event Injection**: User B attempts to create an event under User A's `/complaints/{id}/events/{eventId}`.
10. **Array Flood**: User A submits a complaint with 25 attachment strings (limit 10).
11. **Unverified Email Write**: Token with `email_verified: false` attempts a write.
12. **Blanket Notification Scrape**: User B queries `notifications` without `where('userId', '==', userB.uid)`.
