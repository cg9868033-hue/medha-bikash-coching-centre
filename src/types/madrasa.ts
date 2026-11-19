export type Language = 'en' | 'bn';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
}

export type AccountStatus = 'active' | 'pending' | 'suspended';

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  displayNameBn?: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string;
  photoUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  permissions?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface GradingRule {
  grade: string;
  minPercentage: number;
  point: number;
  remark: string;
}

export interface SiteSettings {
  id?: string;
  madrasaName: string;
  madrasaNameBn?: string;
  tagline?: string;
  taglineBn?: string;
  establishedYear: string;
  motto?: string;
  heroTitle?: string;
  heroTitleBn?: string;
  heroSubtitle?: string;
  heroSubtitleBn?: string;
  welcomeTitle?: string;
  welcomeText?: string;
  welcomeTextBn?: string;
  aboutText?: string;
  aboutTextBn?: string;
  principalName?: string;
  principalNameBn?: string;
  principalTitle?: string;
  principalMessage?: string;
  principalMessageBn?: string;
  principalPhotoUrl?: string;
  principalPhotoPublicId?: string;
  logoUrl?: string;
  logoPublicId?: string;
  heroBannerUrl?: string;
  heroBannerPublicId?: string;
  admissionBannerUrl?: string;
  admissionBannerPublicId?: string;
  certificateSealUrl?: string;
  certificateSealPublicId?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  admissionOpen?: boolean;
  admissionBannerText?: string;
  admissionBannerTextBn?: string;
  address?: string;
  addressBn?: string;
  phone?: string;
  email?: string;
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    whatsapp?: string;
  };
  gradingRules?: GradingRule[];
  passPercentage?: number;
  superAdminInitialized?: boolean;
  updatedByUid?: string;
  updatedAt?: unknown;
}

export interface PublicTeacher {
  id?: string;
  name: string;
  nameBn?: string;
  title: string;
  titleBn?: string;
  qualification: string;
  qualificationBn?: string;
  experienceYears: number;
  bio?: string;
  bioBn?: string;
  subjects?: string[];
  photoUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  featured: boolean;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TeacherRecord {
  id?: string;
  userId: string;
  teacherCode: string;
  fullName: string;
  fullNameBn?: string;
  qualification: string;
  bio?: string;
  experience?: string;
  subjects?: string[];
  assignedCourseIds?: string[];
  assignedClassIds?: string[];
  assignedBatches?: string[];
  email?: string;
  phone?: string;
  photoUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  status: AccountStatus;
  canPublishResults: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudentRecord {
  id?: string;
  userId?: string;
  admissionNo: string;
  rollNo: string;
  fullName: string;
  fullNameBn?: string;
  fatherName: string;
  fatherNameBn?: string;
  motherName?: string;
  dob?: string;
  gender?: 'male' | 'female';
  address?: string;
  guardianPhone?: string;
  classId: string;
  className: string;
  batchName?: string;
  session: string;
  photoUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  status: 'active' | 'pending' | 'suspended' | 'graduated';
  enrolledCourseIds?: string[];
  parentUserIds?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Course {
  id?: string;
  title: string;
  titleBn?: string;
  category: string;
  categoryBn?: string;
  description: string;
  descriptionBn?: string;
  level?: string;
  duration?: string;
  teacherId?: string;
  teacherName?: string;
  classId?: string;
  thumbnailUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  featured: boolean;
  status: 'active' | 'draft' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClassBatch {
  id?: string;
  name: string;
  nameBn?: string;
  code: string;
  session: string;
  batchName?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  capacity?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Subject {
  id?: string;
  name: string;
  nameBn?: string;
  code?: string;
  classId: string;
  fullMarks: number;
  passMarks: number;
  teacherId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdmissionApplication {
  id?: string;
  applicationNo: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: 'male' | 'female';
  address: string;
  guardianContact: string;
  previousEducation?: string;
  classId: string;
  className: string;
  session: string;
  photoUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  documentsNote?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedByUid: string;
  generatedStudentId?: string;
  reviewNote?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  marks: number;
}

export interface Examination {
  id?: string;
  title: string;
  titleBn?: string;
  session: string;
  classId: string;
  className: string;
  examType: 'written' | 'mcq' | 'combined';
  durationMinutes: number;
  startDate?: string;
  status: 'draft' | 'active' | 'completed' | 'published';
  questions?: MCQQuestion[];
  createdByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SubjectMark {
  subjectId?: string;
  subjectName: string;
  subjectNameBn?: string;
  obtainedMarks: number;
  fullMarks: number;
  passMarks: number;
  passed?: boolean;
}

export interface ResultRecord {
  id?: string;
  examId: string;
  examTitle: string;
  examTitleBn?: string;
  session: string;
  classId: string;
  className: string;
  studentId: string;
  studentUid?: string;
  parentUserIds?: string[];
  admissionNo: string;
  rollNo: string;
  studentName: string;
  fatherName: string;
  photoUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  subjects: SubjectMark[];
  totalObtained: number;
  totalFull: number;
  percentage: number;
  grade: string;
  passed: boolean;
  performanceRemark?: string;
  teacherRemarks?: string;
  classTeacherName?: string;
  headTeacherName?: string;
  submittedByUid: string;
  approvalStatus: 'draft' | 'submitted' | 'approved' | 'published';
  publishedAt?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AttendanceRecord {
  id?: string;
  date: string;
  classId: string;
  className: string;
  subjectName?: string;
  studentId: string;
  studentUid?: string;
  parentUserIds?: string[];
  studentName: string;
  rollNo: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedByUid: string;
  remarks?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AssignmentRecord {
  id?: string;
  title: string;
  titleBn?: string;
  description: string;
  courseId?: string;
  classId: string;
  className?: string;
  teacherUid: string;
  teacherName: string;
  dueDate: string;
  maxMarks: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SubmissionRecord {
  id?: string;
  targetType: 'assignment' | 'exam';
  targetId: string;
  targetTitle?: string;
  studentUid: string;
  studentId?: string;
  studentName: string;
  content?: string;
  attachmentUrl?: string;
  answers?: number[];
  score?: number;
  maxScore?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LiveClassRecord {
  id?: string;
  title: string;
  titleBn?: string;
  courseTitle?: string;
  classId?: string;
  className?: string;
  teacherUid: string;
  teacherName: string;
  scheduledAt: string;
  durationMinutes: number;
  provider: 'Zoom' | 'Google Meet' | 'Jitsi' | 'YouTube Live';
  meetingUrl: string;
  status: 'scheduled' | 'live' | 'completed';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LessonRecord {
  id?: string;
  title: string;
  titleBn?: string;
  category: string;
  classId?: string;
  className?: string;
  teacherUid: string;
  teacherName: string;
  videoUrl: string;
  duration?: string;
  description?: string;
  completedByUids?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudyMaterialRecord {
  id?: string;
  title: string;
  titleBn?: string;
  type: 'pdf' | 'notes' | 'audio' | 'video';
  category: string;
  subjectName?: string;
  classId?: string;
  resourceUrl: string;
  description?: string;
  downloadAllowed: boolean;
  uploadedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CertificateRecord {
  id?: string;
  verificationNo: string;
  type: 'course_completion' | 'academic' | 'achievement';
  studentId: string;
  studentUid?: string;
  parentUserIds?: string[];
  studentName: string;
  fatherName?: string;
  className?: string;
  session?: string;
  title: string;
  titleBn?: string;
  issueDate: string;
  issuedByUid: string;
  assetUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  status: 'active' | 'revoked';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NoticeRecord {
  id?: string;
  title: string;
  titleBn?: string;
  content: string;
  contentBn?: string;
  category?: string;
  priority: 'normal' | 'important' | 'urgent';
  targetRole: 'all' | 'teacher' | 'student' | 'parent';
  published: boolean;
  imageUrl?: string;
  cloudinaryImageUrl?: string;
  cloudinaryPublicId?: string;
  uploadedAt?: string;
  authorUid: string;
  authorName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NotificationRecord {
  id?: string;
  recipientUid: string;
  senderUid: string;
  senderName: string;
  title: string;
  message: string;
  type: 'announcement' | 'message' | 'reminder' | 'result' | 'admission';
  read: boolean;
  createdAt?: unknown;
}

export interface FeeRecord {
  id?: string;
  receiptNo: string;
  studentId: string;
  studentUid?: string;
  parentUserIds?: string[];
  studentName: string;
  admissionNo?: string;
  className?: string;
  category: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  paymentDate?: string;
  remarks?: string;
  recordedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AuditLogRecord {
  id?: string;
  actorUid: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetCollection: string;
  targetId?: string;
  summary: string;
  createdAt?: unknown;
}

export const DEFAULT_GRADING_RULES: GradingRule[] = [
  { grade: 'A+', minPercentage: 80, point: 5.0, remark: 'EXCELLENT' },
  { grade: 'A', minPercentage: 70, point: 4.0, remark: 'GOOD WORK' },
  { grade: 'A-', minPercentage: 60, point: 3.5, remark: 'VERY GOOD' },
  { grade: 'B', minPercentage: 50, point: 3.0, remark: 'SATISFACTORY' },
  { grade: 'C', minPercentage: 40, point: 2.0, remark: 'NEEDS EFFORT' },
  { grade: 'D', minPercentage: 33, point: 1.0, remark: 'MARGINAL PASS' },
  { grade: 'F', minPercentage: 0, point: 0.0, remark: 'FAILED' },
];

export function calculateMarksheetTotals(
  subjects: SubjectMark[],
  gradingRules: GradingRule[] = DEFAULT_GRADING_RULES,
  passPercentage = 33
) {
  let totalObtained = 0;
  let totalFull = 0;
  let allSubjectsPassed = subjects.length > 0;

  const computedSubjects = subjects.map((s) => {
    const obtained = Math.max(0, Number(s.obtainedMarks) || 0);
    const full = Math.max(1, Number(s.fullMarks) || 100);
    const pass = Math.max(0, Number(s.passMarks) ?? Math.ceil(full * (passPercentage / 100)));
    const subjectPassed = obtained >= pass;
    if (!subjectPassed) {
      allSubjectsPassed = false;
    }
    totalObtained += obtained;
    totalFull += full;
    return {
      ...s,
      obtainedMarks: obtained,
      fullMarks: full,
      passMarks: pass,
      passed: subjectPassed,
    };
  });

  const percentage = totalFull > 0 ? Number(((totalObtained / totalFull) * 100).toFixed(1)) : 0;
  const overallPassed = allSubjectsPassed && percentage >= passPercentage;

  const sortedRules = [...gradingRules].sort((a, b) => b.minPercentage - a.minPercentage);
  let grade = 'F';
  let performanceRemark = 'FAILED';

  if (overallPassed) {
    const matched = sortedRules.find((r) => percentage >= r.minPercentage && r.grade !== 'F');
    if (matched) {
      grade = matched.grade;
      performanceRemark = matched.remark;
    } else {
      grade = 'D';
      performanceRemark = 'PASSED';
    }
  }

  return {
    subjects: computedSubjects,
    totalObtained,
    totalFull,
    percentage,
    grade,
    passed: overallPassed,
    performanceRemark,
  };
}
