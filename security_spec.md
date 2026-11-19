# Security Specification & Payload-First Security TDD — Meder Dhar Shishu Madrasah

## 1. Data Invariants
1. **Role Integrity**: No user may self-assign `super_admin`, `admin`, or active `teacher` privilege upon account creation or profile update. Only a verified `super_admin` (including the bootstrapped project owner `cg9868033@gmail.com` with `email_verified == true`) can promote users to `admin` or approve `teacher` accounts.
2. **PII Isolation**: Private user records (`/users/{userId}`), student records (`/students/{studentId}`), admissions (`/admissions/{admissionId}`), and fee records (`/feeRecords/{feeId}`) cannot be read in bulk by unauthenticated visitors or unrelated students/parents.
3. **Result Publication Gate**: Official marksheets in `/results/{resultId}` are strictly unreadable to the public unless `approvalStatus == 'published'`. Students can only read their own results; teachers can only submit/edit marks in `draft` or `submitted` state and cannot independently transition `approvalStatus` to `published` unless granted explicit `canPublishResults` or `admin`/`super_admin` status.
4. **Attendance & Submission Integrity**: Students cannot create, update, or delete `/attendance/{attendanceId}` records, nor modify teacher-graded `score` or `status: 'graded'` on `/submissions/{submissionId}`.
5. **Audit Log Immutability**: `/auditLogs/{logId}` is append-only; no user (not even admins) may update or delete historical audit entries.
6. **Temporal & Volumetric Integrity**: Every document ID path variable conforms to `^[a-zA-Z0-9_\-]+$` (max 128 chars), every string enforces explicit `.size()` bounds (image URLs `<= 500`, `cloudinaryPublicId <= 240`, `uploadedAt <= 60`), and every array enforces `.size() <= MAX`.
7. **Media Asset & Deletion Integrity**: Direct browser uploads target only restricted unsigned Cloudinary presets, never expose API secrets in client code, and delete replaced/removed `madrasa/*` assets strictly through authenticated server-side `/api/cloudinary/delete`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Self-Promotion on Sign-Up (`/users/{uid}`)**: `{ "uid": "attacker1", "email": "a@b.com", "displayName": "Attacker", "role": "super_admin", "status": "active", "createdAt": ..., "updatedAt": ... }` -> MUST be `PERMISSION_DENIED`.
2. **Shadow Ghost Field on Profile Update (`/users/{uid}`)**: Updating `displayName` while injecting `"permissions": ["all"]` or `"isAdmin": true` -> MUST be `PERMISSION_DENIED`.
3. **Email Spoofing Without Verification**: Request with `auth.token.email == "cg9868033@gmail.com"` and `auth.token.email_verified == false` attempting admin write -> MUST be `PERMISSION_DENIED`.
4. **Unpublished Result Leak (`/results/{id}`)**: Unauthenticated or unrelated student `get` or `list` on `/results` where `approvalStatus != 'published'` -> MUST be `PERMISSION_DENIED`.
5. **Teacher Unauthorized Result Publication (`/results/{id}`)**: Teacher without `canPublishResults` attempting to update `approvalStatus` to `'published'` -> MUST be `PERMISSION_DENIED`.
6. **Student Score Tampering (`/results/{id}` or `/submissions/{id}`)**: Student attempting to update `totalObtained`, `grade`, or `score` -> MUST be `PERMISSION_DENIED`.
7. **Student Attendance Forgery (`/attendance/{id}`)**: Student attempting to create or update their own attendance to `'present'` -> MUST be `PERMISSION_DENIED`.
8. **Parent Cross-Student Snooping (`/students/{otherStudentId}`)**: Parent attempting to read a student record where `request.auth.uid` is NOT in `parentUserIds` -> MUST be `PERMISSION_DENIED`.
9. **Path ID Poisoning (`/notices/../../etc/passwd` or 500-char ID)**: Invalid document ID failing `^[a-zA-Z0-9_\-]+$` -> MUST be `PERMISSION_DENIED`.
10. **Oversized String DoS (`/notices/{id}`)**: Notice `content` exceeding 2500 characters or `cloudinaryPublicId` exceeding 240 chars -> MUST be `PERMISSION_DENIED`.
11. **Audit Log Tampering (`/auditLogs/{id}`)**: Attempting `update` or `delete` on an existing audit log -> MUST be `PERMISSION_DENIED`.
12. **Site Branding Hijack (`/settings/main`)**: Non-admin authenticated user attempting to overwrite `madrasaName`, `heroBannerUrl`, `logoUrl`, or `gradingRules` -> MUST be `PERMISSION_DENIED`.
