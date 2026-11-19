/**
 * Payload-First Security TDD specification checks for Meder Dhar Shishu Madrasah.
 * Verifies Dirty Dozen attack payloads against firestore.rules constraints.
 */
export interface DirtyDozenScenario {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  rationale: string;
}

export const DIRTY_DOZEN_SCENARIOS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Self-Promotion on Sign-Up',
    collection: 'users',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'Users cannot create profile with role super_admin or admin or active teacher.'
  },
  {
    id: 2,
    name: 'Shadow Ghost Field on Profile Update',
    collection: 'users',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'affectedKeys().hasOnly() restricts owner edits to display fields & Cloudinary image metadata while blocking role, status, permissions, and ghost fields.'
  },
  {
    id: 3,
    name: 'Email Spoofing Without Verification',
    collection: 'settings',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'isVerified() mandates request.auth.token.email_verified == true.'
  },
  {
    id: 4,
    name: 'Unpublished Result Leak',
    collection: 'results',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    rationale: 'Public reads require resource.data.approvalStatus == published.'
  },
  {
    id: 5,
    name: 'Unauthorized Result Publication',
    collection: 'results',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'Only verified Admin/Super Admin can set approvalStatus to published.'
  },
  {
    id: 6,
    name: 'Student Score Tampering',
    collection: 'submissions',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'Students cannot create graded submissions or modify score/feedback/status.'
  },
  {
    id: 7,
    name: 'Student Attendance Forgery',
    collection: 'attendance',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'Only verified teachers and admins can write attendance records.'
  },
  {
    id: 8,
    name: 'Parent Cross-Student Snooping',
    collection: 'students',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    rationale: 'Parents can only read student documents where auth.uid is in parentUserIds.'
  },
  {
    id: 9,
    name: 'Path ID Poisoning',
    collection: 'notices',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'isValidId() rejects IDs over 128 chars or outside ^[a-zA-Z0-9_\\-]+$.'
  },
  {
    id: 10,
    name: 'Oversized String & Cloudinary Metadata Poisoning',
    collection: 'notices',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'isValidNotice() enforces content.size() <= 2500, imageUrl/cloudinaryImageUrl <= 500, and cloudinaryPublicId <= 240.'
  },
  {
    id: 11,
    name: 'Audit Log Tampering',
    collection: 'auditLogs',
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
    rationale: 'auditLogs are strictly immutable (allow update, delete: if false).'
  },
  {
    id: 12,
    name: 'Site Branding & Banner Hijack',
    collection: 'settings',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'Only Super Admin or authorized Admin can modify /settings/{settingId} including logos, banners, seals, and branding.'
  }
];
