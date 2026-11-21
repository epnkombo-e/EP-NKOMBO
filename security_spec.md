# Firestore Security Specification — EP Saint Pierre Nkombo

## 1. Data Invariants
1. **Primary Owner Authority**: Only verified accounts matching `epnkombo@gmail.com` (primary owner) or listed in `/adminEmails/{email}` (co-admins granted access by the primary owner) can create, update, or delete school profile settings, academics, campus spaces, faculty records, calendar events, daily schedule rows, posts, and testimonials.
2. **Co-Admin Delegation Boundary**: Only the primary verified owner (`epnkombo@gmail.com`) can add or remove entries in `/adminEmails/{emailId}`. Co-admins cannot grant admin access to others.
3. **Draft Isolation on Posts & Testimonials**: Unpublished posts (`published == false`) and unpublished testimonials (`published == false`) are readable only by admins; public visitors can only read and list records where `published == true`.
4. **PII Isolation on Admissions Inquiries**: Public visitors may create a new inquiry only with `status == 'new'` and `createdAt == request.time`, but can never `get`, `list`, `update`, or `delete` any inquiry document. Only verified school admins can read or manage inquiries.
5. **Temporal & Schema Integrity**: Every write validates field types, string length bounds, bounded arrays, strict `keys().hasAll(...)` / `keys().hasOnly(...)`, and server timestamps (`request.time`).

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated `setDoc` on `/schoolSettings/main` attempting to change `schoolName`.
2. Unauthenticated `create` on `/posts/fake1` attempting to publish a fake announcement.
3. Authenticated non-owner (`email: "other@gmail.com"`, `email_verified: true`) attempting `create` on `/faculty/f99` or `/testimonials/t99`.
4. Spoofed owner (`email: "epnkombo@gmail.com"`, `email_verified: false`) attempting `update` on `/schoolSettings/main`.
5. Public visitor attempting `get` or `list` on `/inquiries`.
6. Public visitor submitting an inquiry to `/inquiries/inq1` with pre-approved `status: "scheduled"` instead of `"new"`.
7. Public visitor injecting a shadow field (`isAdmin: true`) into `/inquiries/inq2` on create.
8. Public visitor attempting to `list` unpublished draft posts or testimonials without `where('published', '==', true)`.
9. Malicious oversized document ID (>128 chars or containing `/`) on `/posts/{postId}` or `/testimonials/{testimonialId}`.
10. Co-admin attempting to add themselves or another user to `/adminEmails/{emailId}` (restricted to primary owner).
11. Client attempting to forge `createdAt` with a past timestamp instead of `request.time` on `/posts/{postId}` or `/testimonials/{testimonialId}`.
12. Oversized 10KB string injected into `faculty/{memberId}.name` or invalid `voiceType` enum on `/testimonials/{testimonialId}`.
