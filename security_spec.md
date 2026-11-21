# Firestore Security Specification — EP Saint Pierre Nkombo

## 1. Data Invariants
1. **Primary Owner Authority**: Only verified accounts matching `epnkombo@gmail.com` or listed in `/adminEmails/{email}` can directly modify school settings (including home background & AI lesson trainer notes), academics, faculty, calendar, schedule, rosters, class summaries, or approve/reject teacher content.
2. **Co-Admin Delegation Boundary**: Only `epnkombo@gmail.com` can add or remove entries in `/adminEmails/{emailId}`.
3. **Draft & Approval Isolation**: Posts, Library Items, and Sports/Entertainment entries uploaded by non-admin verified teachers start with `approvalStatus: 'pending'` (`published: false` on posts) and remain invisible to public visitors until `isAdmin()` transitions them to `'approved'`. Non-admins cannot self-approve (`approvalStatus == 'approved'`).
4. **Split Collection PII Isolation on Profiles**:
   - `/userProfiles/{uid}` contains PII (`email`, `phone`) and is readable/writable strictly by `request.auth.uid == uid` or `isAdmin()`. Users cannot self-assign `accountKind: 'owner'`.
   - `/publicProfiles/{uid}` contains ONLY non-PII circular display attributes (`displayName`, `avatarType`, `avatarValue`, `photoDataUrl`, `showPublicly`).
5. **Admissions Inquiries, Student Rosters & Exam Results PII Isolation**:
   - `/inquiries`, `/examSubmissions`, `/onlineTestSubmissions` accept verified/public create once, while `get`/`list`/`delete` are strictly `isAdmin()`.
   - `/studentRecords` (individual student names, gender, marks) is strictly `isAdmin()` read/write; only aggregated anonymous stats in `/classPerformanceSummaries` are publicly readable.
6. **Direct Messaging & Notifications Isolation**:
   - `/messages/{messageId}` can be created only with `senderUid == request.auth.uid`, and listed/read only by `senderUid == request.auth.uid`, `recipientUid == request.auth.uid`, or `isAdmin()`.
   - `/notifications/{notifId}` restricts `get`/`list` to `recipientUid == 'ALL'`, `recipientUid == request.auth.uid`, or `isAdmin()`.
7. **Temporal, Size & Schema Integrity**: Every write enforces `isValidId()`, `keys().hasAll(...)` & `keys().hasOnly(...)`, string length bounds, numeric ranges, and `request.time`.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated `setDoc` on `/schoolSettings/main` attempting to replace `heroBgImage`.
2. Verified non-owner teacher creating `/libraryItems/lib1` with `approvalStatus: 'approved'` (skipping owner approval).
3. Verified non-owner teacher updating another teacher's `/libraryItems/lib2` or self-approving a `pending` item.
4. Verified user reading `/userProfiles/someoneElseUid` (`get` or `list`) to harvest emails or phone numbers.
5. Verified user reading `/studentRecords` (`list` or `get`) to scrape individual pupil names and marks.
6. Authenticated user creating `/messages/m1` with `senderUid` set to another user's UID (identity spoofing).
7. Unverified email user (`email_verified: false`) attempting to write to `/publicProfiles/{uid}` or `/posts/{postId}`.
8. Unauthenticated user injecting shadow field `isAdmin: true` into `/onlineTestSubmissions/t1`.
9. Client forging `createdAt` with past timestamp instead of `request.time` on `/sportsEntertainment/s1`.
10. Non-admin attempting to write or delete `/classPerformanceSummaries/P6`.
11. Malicious oversized 1KB doc ID on `/libraryItems/{id}` or `/notifications/{id}`.
12. Co-admin attempting to write `/adminEmails/attacker@gmail.com`.
