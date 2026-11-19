import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Library,
  Pencil,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import { orderBy, where } from 'firebase/firestore';
import { auth } from '../../firebase';
import {
  AdmissionApplication,
  AttendanceRecord,
  AuditLogRecord,
  calculateMarksheetTotals,
  CertificateRecord,
  ClassBatch,
  Course,
  DEFAULT_GRADING_RULES,
  Examination,
  FeeRecord,
  GradingRule,
  Language,
  LiveClassRecord,
  NoticeRecord,
  PublicTeacher,
  ResultRecord,
  SiteSettings,
  StudentRecord,
  StudyMaterialRecord,
  Subject,
  SubjectMark,
  TeacherRecord,
  UserProfile,
  UserRole,
} from '../../types/madrasa';
import {
  clampStr,
  createDocument,
  deleteDocument,
  initializeMadrasahPlatform,
  logAudit,
  resolveUserDisplayName,
  saveSiteSettings,
  subscribeCollection,
  updateDocument,
} from '../../services/firestoreService';
import { deleteMadrasahPhotoByUrl, sanitizePersistedPhotoUrl } from '../../services/storageService';
import { DashboardShell, NavTab } from '../DashboardShell';
import { CertificateCard, DigitalIdCard } from '../DigitalIdAndCertificate';
import { ImageUploader, UploadedCloudinaryAsset } from '../ImageUploader';
import { ScholarAvatar } from '../IslamicGraphics';
import { MarksheetCard } from '../MarksheetCard';

interface SuperAdminPortalProps {
  profile: UserProfile;
  settings: SiteSettings;
  lang: Language;
  onToggleLang: () => void;
  onBackHome: () => void;
  onSignOut: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  profile,
  settings,
  lang,
  onToggleLang,
  onBackHome,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [publicTeachers, setPublicTeachers] = useState<PublicTeacher[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionApplication[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [materials, setMaterials] = useState<StudyMaterialRecord[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  const [initializing, setInitializing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      subscribeCollection<StudentRecord>('students', setStudents),
      subscribeCollection<TeacherRecord>('teachers', setTeachers),
      subscribeCollection<PublicTeacher>('publicTeachers', setPublicTeachers, [orderBy('order', 'asc')]),
      subscribeCollection<UserProfile>('users', setUsers),
      subscribeCollection<ClassBatch>('classes', setClasses),
      subscribeCollection<Subject>('subjects', setSubjects),
      subscribeCollection<Course>('courses', setCourses),
      subscribeCollection<AdmissionApplication>('admissions', setAdmissions),
      subscribeCollection<Examination>('examinations', setExams),
      subscribeCollection<ResultRecord>('results', setResults),
      subscribeCollection<AttendanceRecord>('attendance', setAttendance),
      subscribeCollection<StudyMaterialRecord>('studyMaterials', setMaterials),
      subscribeCollection<LiveClassRecord>('liveClasses', setLiveClasses),
      subscribeCollection<CertificateRecord>('certificates', setCertificates),
      subscribeCollection<FeeRecord>('feeRecords', setFees),
      subscribeCollection<NoticeRecord>('notices', setNotices),
      subscribeCollection<AuditLogRecord>('auditLogs', setAuditLogs),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const isSuper = profile.role === UserRole.SUPER_ADMIN;

  const tabs: NavTab[] = [
    { id: 'overview', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Overview', icon: LayoutDashboard },
    { id: 'students', label: lang === 'bn' ? 'শিক্ষার্থী' : 'Students', icon: Users },
    { id: 'teachers', label: lang === 'bn' ? 'শিক্ষক ও গ্যালারি' : 'Teachers & Gallery', icon: UserCheck },
    { id: 'admissions', label: lang === 'bn' ? 'ভর্তি আবেদন' : 'Admissions', icon: ClipboardList },
    { id: 'academics', label: lang === 'bn' ? 'শ্রেণি, বিষয় ও কোর্স' : 'Classes & Courses', icon: BookOpen },
    { id: 'results', label: lang === 'bn' ? 'পরীক্ষা ও মার্কশিট' : 'Exams & Results', icon: FileSpreadsheet },
    { id: 'attendance', label: lang === 'bn' ? 'উপস্থিতি' : 'Attendance', icon: CalendarCheck },
    { id: 'digital', label: lang === 'bn' ? 'লাইব্রেরি ও লাইভ ক্লাস' : 'Library & Live', icon: Library },
    { id: 'certificates', label: lang === 'bn' ? 'সনদ ও আইডি কার্ড' : 'Certificates & IDs', icon: Award },
    { id: 'fees', label: lang === 'bn' ? 'ফি ও হিসাব' : 'Fees & Finance', icon: CreditCard },
    { id: 'notices', label: lang === 'bn' ? 'নোটিশ ও বার্তা' : 'Notices', icon: Bell },
    { id: 'users', label: lang === 'bn' ? 'অ্যাডমিন ও পারমিশন' : 'Admins & RBAC', icon: Shield },
    { id: 'settings', label: lang === 'bn' ? 'ব্র্যান্ডিং ও সেটিংস' : 'Branding & Grading', icon: Settings },
  ];

  const notify = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 5000);
  };

  const handleBootstrap = async () => {
    setInitializing(true);
    try {
      await initializeMadrasahPlatform();
      notify('Madrasah platform initialized with classes, subjects, courses, faculty, and notices!');
    } finally {
      setInitializing(false);
    }
  };

  // --- Form states ---
  // 1. Add & Edit Student
  const [stName, setStName] = useState('');
  const [stFather, setStFather] = useState('');
  const [stAdmNo, setStAdmNo] = useState('');
  const [stRoll, setStRoll] = useState('');
  const [stClassId, setStClassId] = useState('');
  const [stSession, setStSession] = useState('2026');
  const [stPhone, setStPhone] = useState('');
  const [stPhoto, setStPhoto] = useState('');
  const [stPhotoPublicId, setStPhotoPublicId] = useState('');
  const [stPhotoUploadedAt, setStPhotoUploadedAt] = useState('');
  const [stPhotoUploading, setStPhotoUploading] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [stUserId, setStUserId] = useState('');
  const [stParentUid, setStParentUid] = useState('');

  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editStName, setEditStName] = useState('');
  const [editStFather, setEditStFather] = useState('');
  const [editStAdmNo, setEditStAdmNo] = useState('');
  const [editStRoll, setEditStRoll] = useState('');
  const [editStClassId, setEditStClassId] = useState('');
  const [editStSession, setEditStSession] = useState('2026');
  const [editStPhone, setEditStPhone] = useState('');
  const [editStPhoto, setEditStPhoto] = useState('');
  const [editStPhotoPublicId, setEditStPhotoPublicId] = useState('');
  const [editStPhotoUploadedAt, setEditStPhotoUploadedAt] = useState('');
  const [editStPhotoUploading, setEditStPhotoUploading] = useState(false);
  const [savingEditStudent, setSavingEditStudent] = useState(false);
  const [editStUserId, setEditStUserId] = useState('');
  const [editStParentUid, setEditStParentUid] = useState('');
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<StudentRecord | null>(null);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stPhotoUploading || savingStudent) return;
    const cls = classes.find((c) => c.id === stClassId) || classes[0];
    if (!cls?.id) return notify('Create at least one class first.');
    setSavingStudent(true);
    try {
      const safePhoto = sanitizePersistedPhotoUrl(stPhoto);
      const id = await createDocument('students', {
        userId: clampStr(stUserId, 128) || undefined,
        admissionNo: clampStr(stAdmNo, 40),
        rollNo: clampStr(stRoll, 20),
        fullName: clampStr(stName, 120),
        fatherName: clampStr(stFather, 120),
        guardianPhone: clampStr(stPhone, 32) || undefined,
        photoUrl: safePhoto || undefined,
        cloudinaryImageUrl: safePhoto || undefined,
        cloudinaryPublicId: clampStr(stPhotoPublicId, 240) || undefined,
        uploadedAt: clampStr(stPhotoUploadedAt, 60) || undefined,
        classId: cls.id,
        className: cls.name,
        session: clampStr(stSession, 30),
        status: 'active',
        parentUserIds: stParentUid.trim() ? [stParentUid.trim()] : [],
      });
      await logAudit('CREATE_STUDENT', 'students', `Added student ${stName} (${stAdmNo})`, id, profile.role);
      setStName('');
      setStFather('');
      setStAdmNo('');
      setStRoll('');
      setStPhone('');
      setStPhoto('');
      setStPhotoPublicId('');
      setStPhotoUploadedAt('');
      setStUserId('');
      setStParentUid('');
      notify('Student record created.');
    } finally {
      setSavingStudent(false);
    }
  };

  const startEditStudent = (st: StudentRecord) => {
    setEditingStudent(st);
    setEditStName(st.fullName);
    setEditStFather(st.fatherName);
    setEditStAdmNo(st.admissionNo);
    setEditStRoll(st.rollNo);
    setEditStClassId(st.classId);
    setEditStSession(st.session);
    setEditStPhone(st.guardianPhone || '');
    setEditStPhoto(st.cloudinaryImageUrl || st.photoUrl || '');
    setEditStPhotoPublicId(st.cloudinaryPublicId || '');
    setEditStPhotoUploadedAt(st.uploadedAt || '');
    setEditStUserId(st.userId || '');
    setEditStParentUid((st.parentUserIds || [])[0] || '');
  };

  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.id || editStPhotoUploading || savingEditStudent) return;
    const cls = classes.find((c) => c.id === editStClassId) || classes[0];
    if (!cls?.id) return notify('Select a valid class.');
    setSavingEditStudent(true);
    try {
      const nextPhoto = sanitizePersistedPhotoUrl(editStPhoto);
      const nextPublicId = nextPhoto ? clampStr(editStPhotoPublicId, 240) : '';
      const nextUploadedAt = nextPhoto ? clampStr(editStPhotoUploadedAt, 60) : '';
      const oldPhoto = editingStudent.cloudinaryImageUrl || editingStudent.photoUrl || '';
      const oldPublicId = editingStudent.cloudinaryPublicId || '';
      const nextName = clampStr(editStName, 120);
      const nextFather = clampStr(editStFather, 120);
      const nextAdmNo = clampStr(editStAdmNo, 40);
      const nextRoll = clampStr(editStRoll, 20);
      const nextSession = clampStr(editStSession, 30);

      await updateDocument('students', editingStudent.id, {
        userId: clampStr(editStUserId, 128),
        admissionNo: nextAdmNo,
        rollNo: nextRoll,
        fullName: nextName,
        fatherName: nextFather,
        guardianPhone: clampStr(editStPhone, 32),
        photoUrl: nextPhoto,
        cloudinaryImageUrl: nextPhoto,
        cloudinaryPublicId: nextPublicId,
        uploadedAt: nextUploadedAt,
        classId: cls.id,
        className: cls.name,
        session: nextSession,
        parentUserIds: editStParentUid.trim() ? [editStParentUid.trim()] : [],
      });

      // Keep linked result marksheets synced with updated student photo & core details
      const linkedResults = results.filter((r) => r.studentId === editingStudent.id && r.id);
      await Promise.all(
        linkedResults.map((r) =>
          updateDocument('results', r.id!, {
            photoUrl: nextPhoto,
            cloudinaryImageUrl: nextPhoto,
            cloudinaryPublicId: nextPublicId,
            uploadedAt: nextUploadedAt,
            studentName: nextName,
            fatherName: nextFather,
            admissionNo: nextAdmNo,
            rollNo: nextRoll,
            classId: cls.id,
            className: cls.name,
            session: nextSession,
          })
        )
      );

      if ((oldPhoto || oldPublicId) && (oldPhoto !== nextPhoto || (oldPublicId && oldPublicId !== nextPublicId))) {
        void deleteMadrasahPhotoByUrl(oldPhoto, oldPublicId);
      }

      if (selectedStudentProfile?.id === editingStudent.id) {
        setSelectedStudentProfile({
          ...editingStudent,
          fullName: nextName,
          fatherName: nextFather,
          admissionNo: nextAdmNo,
          rollNo: nextRoll,
          classId: cls.id,
          className: cls.name,
          session: nextSession,
          guardianPhone: clampStr(editStPhone, 32),
          photoUrl: nextPhoto,
          cloudinaryImageUrl: nextPhoto,
          cloudinaryPublicId: nextPublicId,
          uploadedAt: nextUploadedAt,
        });
      }

      await logAudit(
        'UPDATE_STUDENT',
        'students',
        `Updated student ${nextName} (${nextAdmNo})`,
        editingStudent.id,
        profile.role
      );
      setEditingStudent(null);
      notify('Student record and photo updated.');
    } finally {
      setSavingEditStudent(false);
    }
  };

  // 2. Public Teacher Gallery add & edit + registered teacher photo edit
  const [ptName, setPtName] = useState('');
  const [ptTitle, setPtTitle] = useState('');
  const [ptQual, setPtQual] = useState('');
  const [ptExp, setPtExp] = useState(5);
  const [ptSubjects, setPtSubjects] = useState('');
  const [ptPhoto, setPtPhoto] = useState('');
  const [ptPhotoPublicId, setPtPhotoPublicId] = useState('');
  const [ptPhotoUploadedAt, setPtPhotoUploadedAt] = useState('');
  const [ptPhotoUploading, setPtPhotoUploading] = useState(false);
  const [savingPublicTeacher, setSavingPublicTeacher] = useState(false);

  const [editingPublicTeacher, setEditingPublicTeacher] = useState<PublicTeacher | null>(null);
  const [editPtName, setEditPtName] = useState('');
  const [editPtTitle, setEditPtTitle] = useState('');
  const [editPtQual, setEditPtQual] = useState('');
  const [editPtExp, setEditPtExp] = useState(5);
  const [editPtSubjects, setEditPtSubjects] = useState('');
  const [editPtPhoto, setEditPtPhoto] = useState('');
  const [editPtPhotoPublicId, setEditPtPhotoPublicId] = useState('');
  const [editPtPhotoUploadedAt, setEditPtPhotoUploadedAt] = useState('');
  const [editPtPhotoUploading, setEditPtPhotoUploading] = useState(false);
  const [savingEditPublicTeacher, setSavingEditPublicTeacher] = useState(false);

  const [editingTeacherPhoto, setEditingTeacherPhoto] = useState<TeacherRecord | null>(null);
  const [editTchPhoto, setEditTchPhoto] = useState('');
  const [editTchPhotoPublicId, setEditTchPhotoPublicId] = useState('');
  const [editTchPhotoUploadedAt, setEditTchPhotoUploadedAt] = useState('');
  const [editTchPhotoUploading, setEditTchPhotoUploading] = useState(false);
  const [savingTchPhoto, setSavingTchPhoto] = useState(false);

  const handleAddPublicTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ptPhotoUploading || savingPublicTeacher) return;
    setSavingPublicTeacher(true);
    try {
      const safePhoto = sanitizePersistedPhotoUrl(ptPhoto);
      await createDocument('publicTeachers', {
        name: clampStr(ptName, 120),
        title: clampStr(ptTitle, 120),
        qualification: clampStr(ptQual, 200),
        experienceYears: Number(ptExp) || 1,
        subjects: ptSubjects.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20),
        photoUrl: safePhoto || undefined,
        cloudinaryImageUrl: safePhoto || undefined,
        cloudinaryPublicId: clampStr(ptPhotoPublicId, 240) || undefined,
        uploadedAt: clampStr(ptPhotoUploadedAt, 60) || undefined,
        featured: true,
        order: publicTeachers.length + 1,
      });
      setPtName('');
      setPtTitle('');
      setPtQual('');
      setPtSubjects('');
      setPtPhoto('');
      setPtPhotoPublicId('');
      setPtPhotoUploadedAt('');
      notify('Added scholar to public Teacher Gallery.');
    } finally {
      setSavingPublicTeacher(false);
    }
  };

  const startEditPublicTeacher = (pt: PublicTeacher) => {
    setEditingPublicTeacher(pt);
    setEditPtName(pt.name);
    setEditPtTitle(pt.title);
    setEditPtQual(pt.qualification);
    setEditPtExp(pt.experienceYears);
    setEditPtSubjects((pt.subjects || []).join(', '));
    setEditPtPhoto(pt.cloudinaryImageUrl || pt.photoUrl || '');
    setEditPtPhotoPublicId(pt.cloudinaryPublicId || '');
    setEditPtPhotoUploadedAt(pt.uploadedAt || '');
  };

  const handleSaveEditPublicTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPublicTeacher?.id || editPtPhotoUploading || savingEditPublicTeacher) return;
    setSavingEditPublicTeacher(true);
    try {
      const nextPhoto = sanitizePersistedPhotoUrl(editPtPhoto);
      const nextPublicId = nextPhoto ? clampStr(editPtPhotoPublicId, 240) : '';
      const nextUploadedAt = nextPhoto ? clampStr(editPtPhotoUploadedAt, 60) : '';
      const oldPhoto = editingPublicTeacher.cloudinaryImageUrl || editingPublicTeacher.photoUrl || '';
      const oldPublicId = editingPublicTeacher.cloudinaryPublicId || '';
      await updateDocument('publicTeachers', editingPublicTeacher.id, {
        name: clampStr(editPtName, 120),
        title: clampStr(editPtTitle, 120),
        qualification: clampStr(editPtQual, 200),
        experienceYears: Number(editPtExp) || 1,
        subjects: editPtSubjects.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20),
        photoUrl: nextPhoto,
        cloudinaryImageUrl: nextPhoto,
        cloudinaryPublicId: nextPublicId,
        uploadedAt: nextUploadedAt,
      });
      if ((oldPhoto || oldPublicId) && (oldPhoto !== nextPhoto || (oldPublicId && oldPublicId !== nextPublicId))) {
        void deleteMadrasahPhotoByUrl(oldPhoto, oldPublicId);
      }
      setEditingPublicTeacher(null);
      notify('Scholar gallery profile and photo updated.');
    } finally {
      setSavingEditPublicTeacher(false);
    }
  };

  // 3. Class / Subject / Course creation & editing
  const [clsName, setClsName] = useState('');
  const [clsCode, setClsCode] = useState('');
  const [clsSession, setClsSession] = useState('2026');
  const [clsBatch, setClsBatch] = useState('Section A');

  const [subName, setSubName] = useState('');
  const [subNameBn, setSubNameBn] = useState('');
  const [subClassId, setSubClassId] = useState('');
  const [subFull, setSubFull] = useState(100);
  const [subPass, setSubPass] = useState(33);

  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('Quran Tajweed');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseThumbUrl, setCourseThumbUrl] = useState('');
  const [courseThumbPublicId, setCourseThumbPublicId] = useState('');
  const [courseThumbUploadedAt, setCourseThumbUploadedAt] = useState('');
  const [courseThumbUploading, setCourseThumbUploading] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseCategory, setEditCourseCategory] = useState('Quran Tajweed');
  const [editCourseDesc, setEditCourseDesc] = useState('');
  const [editCourseThumbUrl, setEditCourseThumbUrl] = useState('');
  const [editCourseThumbPublicId, setEditCourseThumbPublicId] = useState('');
  const [editCourseThumbUploadedAt, setEditCourseThumbUploadedAt] = useState('');
  const [editCourseThumbUploading, setEditCourseThumbUploading] = useState(false);
  const [savingEditCourse, setSavingEditCourse] = useState(false);

  // 4. Examination & Result / Marksheet Builder
  const [examTitle, setExamTitle] = useState('');
  const [examClassId, setExamClassId] = useState('');
  const [examSession, setExamSession] = useState('2026');
  const [examType, setExamType] = useState<'written' | 'mcq' | 'combined'>('written');
  const [examDuration, setExamDuration] = useState(60);

  const [resExamId, setResExamId] = useState('');
  const [resStudentId, setResStudentId] = useState('');
  const [resTeacherRemarks, setResTeacherRemarks] = useState('MEDER DHAR SHISHU MADRASAH');
  const [resClassTeacher, setResClassTeacher] = useState('');
  const [resHeadTeacher, setResHeadTeacher] = useState(settings.principalName || '');
  const [subjectRows, setSubjectRows] = useState<SubjectMark[]>([
    { subjectName: 'বাংলা', subjectNameBn: 'বাংলা', obtainedMarks: 80, fullMarks: 100, passMarks: 33 },
    { subjectName: 'English', subjectNameBn: 'ইংরেজি', obtainedMarks: 85, fullMarks: 100, passMarks: 33 },
    { subjectName: 'আরবি', subjectNameBn: 'আরবি', obtainedMarks: 76, fullMarks: 100, passMarks: 33 },
    { subjectName: 'গণিত', subjectNameBn: 'গণিত', obtainedMarks: 95, fullMarks: 100, passMarks: 33 },
  ]);
  const [previewResult, setPreviewResult] = useState<ResultRecord | null>(null);

  const calculatedPreview = useMemo(
    () =>
      calculateMarksheetTotals(
        subjectRows,
        settings.gradingRules || DEFAULT_GRADING_RULES,
        settings.passPercentage ?? 33
      ),
    [subjectRows, settings.gradingRules, settings.passPercentage]
  );

  const handleCreateResult = async (publishNow: boolean) => {
    const exam = exams.find((e) => e.id === resExamId) || exams[0];
    const student = students.find((s) => s.id === resStudentId);
    if (!exam || !student) {
      notify('Select both an examination and a student record.');
      return;
    }
    const uid = auth.currentUser?.uid || profile.uid;
    const payload = {
      examId: exam.id!,
      examTitle: exam.title,
      examTitleBn: exam.titleBn,
      session: exam.session,
      classId: student.classId,
      className: student.className,
      studentId: student.id!,
      studentUid: student.userId,
      parentUserIds: student.parentUserIds || [],
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      studentName: student.fullName,
      fatherName: student.fatherName,
      photoUrl: student.cloudinaryImageUrl || student.photoUrl,
      cloudinaryImageUrl: student.cloudinaryImageUrl || student.photoUrl,
      cloudinaryPublicId: student.cloudinaryPublicId,
      uploadedAt: student.uploadedAt,
      subjects: calculatedPreview.subjects,
      totalObtained: calculatedPreview.totalObtained,
      totalFull: calculatedPreview.totalFull,
      percentage: calculatedPreview.percentage,
      grade: calculatedPreview.grade,
      passed: calculatedPreview.passed,
      performanceRemark: calculatedPreview.performanceRemark,
      teacherRemarks: clampStr(resTeacherRemarks, 400),
      classTeacherName: clampStr(resClassTeacher, 120) || undefined,
      headTeacherName: clampStr(resHeadTeacher, 120) || undefined,
      submittedByUid: uid,
      approvalStatus: publishNow ? 'published' : 'approved',
      publishedAt: publishNow ? new Date().toISOString().slice(0, 10) : undefined,
    };
    const id = await createDocument('results', payload);
    await logAudit(
      publishNow ? 'PUBLISH_RESULT' : 'APPROVE_RESULT',
      'results',
      `Created marksheet for ${student.fullName} (${exam.title})`,
      id,
      profile.role
    );
    notify(publishNow ? 'Marksheet created and published!' : 'Marksheet saved in approved state.');
  };

  // 5. Attendance quick marker
  const [attClassId, setAttClassId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));

  const markAttendance = async (
    student: StudentRecord,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    await createDocument('attendance', {
      date: attDate,
      classId: student.classId,
      className: student.className,
      studentId: student.id!,
      studentUid: student.userId,
      parentUserIds: student.parentUserIds || [],
      studentName: student.fullName,
      rollNo: student.rollNo,
      status,
      markedByUid: auth.currentUser?.uid || profile.uid,
    });
    notify(`Marked ${student.fullName} as ${status} for ${attDate}.`);
  };

  // 6. Certificate & Fee creation
  const [certStudentId, setCertStudentId] = useState('');
  const [certType, setCertType] = useState<'course_completion' | 'academic' | 'achievement'>('course_completion');
  const [certTitle, setCertTitle] = useState('Quran Tajweed & Islamic Studies');
  const [certAssetUrl, setCertAssetUrl] = useState('');
  const [certAssetPublicId, setCertAssetPublicId] = useState('');
  const [certAssetUploadedAt, setCertAssetUploadedAt] = useState('');
  const [certAssetUploading, setCertAssetUploading] = useState(false);
  const [savingCert, setSavingCert] = useState(false);

  const [feeStudentId, setFeeStudentId] = useState('');
  const [feeCategory, setFeeCategory] = useState('Monthly Tuition Fee');
  const [feeAmount, setFeeAmount] = useState(1000);
  const [feePaid, setFeePaid] = useState(1000);

  // 7. Notice creation
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [noticeImageUrl, setNoticeImageUrl] = useState('');
  const [noticeImagePublicId, setNoticeImagePublicId] = useState('');
  const [noticeImageUploadedAt, setNoticeImageUploadedAt] = useState('');
  const [noticeImageUploading, setNoticeImageUploading] = useState(false);
  const [savingNotice, setSavingNotice] = useState(false);

  // 8. Website Settings editor state
  const [editSettings, setEditSettings] = useState<SiteSettings>(settings);
  const [logoUploading, setLogoUploading] = useState(false);
  const [principalPhotoUploading, setPrincipalPhotoUploading] = useState(false);
  const [heroBannerUploading, setHeroBannerUploading] = useState(false);
  const [admissionBannerUploading, setAdmissionBannerUploading] = useState(false);
  const [certSealUploading, setCertSealUploading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setEditSettings(settings);
  }, [settings]);

  const anySettingsUploading =
    logoUploading ||
    principalPhotoUploading ||
    heroBannerUploading ||
    admissionBannerUploading ||
    certSealUploading;

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (anySettingsUploading || savingSettings) return;
    setSavingSettings(true);
    try {
      const cleanupPairs: Array<{ oldUrl?: string; oldPid?: string; nextUrl?: string; nextPid?: string }> = [
        {
          oldUrl: settings.logoUrl,
          oldPid: settings.logoPublicId,
          nextUrl: editSettings.logoUrl,
          nextPid: editSettings.logoPublicId,
        },
        {
          oldUrl: settings.principalPhotoUrl,
          oldPid: settings.principalPhotoPublicId,
          nextUrl: editSettings.principalPhotoUrl,
          nextPid: editSettings.principalPhotoPublicId,
        },
        {
          oldUrl: settings.heroBannerUrl,
          oldPid: settings.heroBannerPublicId,
          nextUrl: editSettings.heroBannerUrl,
          nextPid: editSettings.heroBannerPublicId,
        },
        {
          oldUrl: settings.admissionBannerUrl,
          oldPid: settings.admissionBannerPublicId,
          nextUrl: editSettings.admissionBannerUrl,
          nextPid: editSettings.admissionBannerPublicId,
        },
        {
          oldUrl: settings.certificateSealUrl,
          oldPid: settings.certificateSealPublicId,
          nextUrl: editSettings.certificateSealUrl,
          nextPid: editSettings.certificateSealPublicId,
        },
      ];

      await saveSiteSettings(editSettings);

      for (const item of cleanupPairs) {
        if ((item.oldUrl || item.oldPid) && (item.oldUrl !== item.nextUrl || (item.oldPid && item.oldPid !== item.nextPid))) {
          void deleteMadrasahPhotoByUrl(item.oldUrl, item.oldPid);
        }
      }
      notify('Website branding, banners, content, and grading policy saved!');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings,
      students,
      teachers,
      courses,
      classes,
      subjects,
      exams,
      results,
      notices,
      certificates,
      fees,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MDSM_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApproveAdmission = async (app: AdmissionApplication) => {
    const admNo = `${app.session}/${String(students.length + 1).padStart(3, '0')}`;
    const roll = String(students.filter((s) => s.classId === app.classId).length + 1).padStart(3, '0');
    const photo = app.cloudinaryImageUrl || app.photoUrl;
    await createDocument('students', {
      userId: app.submittedByUid,
      admissionNo: admNo,
      rollNo: roll,
      fullName: app.studentName,
      fatherName: app.fatherName,
      motherName: app.motherName,
      dob: app.dob,
      gender: app.gender,
      address: app.address,
      guardianPhone: app.guardianContact,
      classId: app.classId,
      className: app.className,
      session: app.session,
      photoUrl: photo,
      cloudinaryImageUrl: photo,
      cloudinaryPublicId: app.cloudinaryPublicId,
      uploadedAt: app.uploadedAt,
      status: 'active',
    });
    await updateDocument('admissions', app.id!, {
      status: 'approved',
      generatedStudentId: admNo,
      reviewNote: `Approved and enrolled with Admission No. ${admNo}`,
    });
    await logAudit('APPROVE_ADMISSION', 'admissions', `Approved ${app.studentName} -> ${admNo}`, app.id, profile.role);
    notify(`Approved ${app.studentName}! Generated Admission No: ${admNo}`);
  };

  return (
    <DashboardShell
      profile={profile}
      settings={settings}
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      lang={lang}
      onToggleLang={onToggleLang}
      onBackHome={onBackHome}
      onSignOut={onSignOut}
    >
      {statusBanner && (
        <div className="no-print mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* INITIAL SETUP BANNER */}
      {!settings.superAdminInitialized && isSuper && (
        <div className="mb-6 rounded-2xl bg-[#071426] text-white border border-[#D4AF37]/60 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#F2D06B]">
              Initial Super Admin Platform Setup
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Initialize the Madrasah database with editable classes, subjects, courses, faculty showcase,
              live classes, and default grading scale so your site and portals go live immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBootstrap}
            disabled={initializing}
            className="rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-[#071426] px-5 py-2.5 text-xs font-bold whitespace-nowrap shrink-0"
          >
            {initializing ? 'Initializing...' : 'Initialize Madrasah Data'}
          </button>
        </div>
      )}

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', val: students.length, sub: 'Enrolled records' },
              { label: 'Teachers & Faculty', val: teachers.length || publicTeachers.length, sub: 'Staff & scholars' },
              { label: 'Active Courses', val: courses.length, sub: 'Published programs' },
              { label: 'Pending Admissions', val: admissions.filter((a) => a.status === 'pending').length, sub: `${admissions.length} total` },
              { label: 'Published Results', val: results.filter((r) => r.approvalStatus === 'published').length, sub: `${results.length} total` },
              { label: 'Attendance Logged', val: attendance.length, sub: 'Total records' },
              { label: 'Live Classes', val: liveClasses.length, sub: 'Scheduled links' },
              { label: 'Total Fees Collected', val: `৳${fees.reduce((s, f) => s + (f.paidAmount || 0), 0)}`, sub: `${fees.length} invoices` },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-white border border-slate-200 p-4">
                <div className="text-xs font-medium text-slate-500">{kpi.label}</div>
                <div className="text-2xl font-extrabold text-[#123466] font-mono-num mt-1">
                  {kpi.val}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Recent Audit Logs</h3>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123466] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON Backup
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500">No audit entries yet.</p>
                ) : (
                  auditLogs.slice(0, 12).map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{log.action}</span>
                        <span className="text-[11px] text-slate-500">{log.actorEmail}</span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{log.summary}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Pending Admissions Queue</h3>
              <div className="space-y-2">
                {admissions.filter((a) => a.status === 'pending').length === 0 ? (
                  <p className="text-xs text-slate-500">No pending admissions.</p>
                ) : (
                  admissions
                    .filter((a) => a.status === 'pending')
                    .slice(0, 5)
                    .map((app) => (
                      <div
                        key={app.id}
                        className="rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{app.studentName}</div>
                          <div className="text-slate-500">
                            {app.applicationNo} · {app.className}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApproveAdmission(app)}
                          className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 font-semibold"
                        >
                          Approve
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddStudent}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#123466]" />
              Add Student Record
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                required
                placeholder="Student Full Name *"
                value={stName}
                onChange={(e) => setStName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Father's Name *"
                value={stFather}
                onChange={(e) => setStFather(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Admission No. (e.g. 2026/001) *"
                value={stAdmNo}
                onChange={(e) => setStAdmNo(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Roll No. (e.g. 001) *"
                value={stRoll}
                onChange={(e) => setStRoll(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={stClassId}
                onChange={(e) => setStClassId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Session (2026)"
                value={stSession}
                onChange={(e) => setStSession(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Guardian Phone"
                value={stPhone}
                onChange={(e) => setStPhone(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Student User UID (Optional)"
                value={stUserId}
                onChange={(e) => setStUserId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Parent User UID (Link Parent)"
                value={stParentUid}
                onChange={(e) => setStParentUid(e.target.value)}
                className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <ImageUploader
              folder="students"
              label="Student Photo / ছাত্রের ছবি"
              value={stPhoto}
              publicId={stPhotoPublicId}
              onChange={setStPhoto}
              onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                setStPhotoPublicId(asset?.cloudinaryPublicId || '');
                setStPhotoUploadedAt(asset?.uploadedAt || '');
              }}
              onUploadingChange={setStPhotoUploading}
              lang={lang}
              disabled={savingStudent}
            />

            <button
              type="submit"
              disabled={stPhotoUploading || savingStudent}
              className="rounded-lg bg-[#123466] text-white px-5 py-2.5 text-xs font-semibold hover:bg-[#19478A] disabled:opacity-60"
            >
              {stPhotoUploading
                ? 'Waiting for Photo Upload...'
                : savingStudent
                  ? 'Saving Student...'
                  : 'Save Student'}
            </button>
          </form>

          {/* Edit Student Record & Photo Replacement Panel */}
          {editingStudent && (
            <form
              onSubmit={handleSaveEditStudent}
              className="rounded-2xl bg-[#071426]/[0.03] border-2 border-[#D4AF37] p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#123466] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#B8860B]" />
                  <span>
                    Edit Student Record: {editingStudent.fullName} ({editingStudent.admissionNo})
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
                  aria-label="Close Edit Student"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  required
                  placeholder="Student Full Name *"
                  value={editStName}
                  onChange={(e) => setEditStName(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  required
                  placeholder="Father's Name *"
                  value={editStFather}
                  onChange={(e) => setEditStFather(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  required
                  placeholder="Admission No. *"
                  value={editStAdmNo}
                  onChange={(e) => setEditStAdmNo(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  required
                  placeholder="Roll No. *"
                  value={editStRoll}
                  onChange={(e) => setEditStRoll(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <select
                  value={editStClassId}
                  onChange={(e) => setEditStClassId(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Session"
                  value={editStSession}
                  onChange={(e) => setEditStSession(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  placeholder="Guardian Phone"
                  value={editStPhone}
                  onChange={(e) => setEditStPhone(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  placeholder="Student User UID"
                  value={editStUserId}
                  onChange={(e) => setEditStUserId(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  placeholder="Parent User UID"
                  value={editStParentUid}
                  onChange={(e) => setEditStParentUid(e.target.value)}
                  className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
              </div>

              <ImageUploader
                folder="students"
                label="Student Photo / ছাত্রের ছবি"
                value={editStPhoto}
                publicId={editStPhotoPublicId}
                persistedUrl={editingStudent.cloudinaryImageUrl || editingStudent.photoUrl}
                persistedPublicId={editingStudent.cloudinaryPublicId}
                onChange={setEditStPhoto}
                onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                  setEditStPhotoPublicId(asset?.cloudinaryPublicId || '');
                  setEditStPhotoUploadedAt(asset?.uploadedAt || '');
                }}
                onUploadingChange={setEditStPhotoUploading}
                lang={lang}
                disabled={savingEditStudent}
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={editStPhotoUploading || savingEditStudent}
                  className="rounded-lg bg-[#123466] text-white px-5 py-2 text-xs font-semibold hover:bg-[#19478A] disabled:opacity-60"
                >
                  {editStPhotoUploading
                    ? 'Uploading Photo...'
                    : savingEditStudent
                      ? 'Updating...'
                      : 'Update Student'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-lg border border-slate-300 bg-white text-slate-700 px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Student Profile & Digital ID View */}
          {selectedStudentProfile && (
            <div className="rounded-2xl bg-white border border-[#D4AF37] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-[#123466]">
                  Student Profile &amp; Digital ID — {selectedStudentProfile.fullName}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedStudentProfile(null)}
                  className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
                  aria-label="Close Student Profile"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <ScholarAvatar
                      photoUrl={selectedStudentProfile.cloudinaryImageUrl || selectedStudentProfile.photoUrl}
                      name={selectedStudentProfile.fullName}
                      className="w-20 h-24"
                    />
                    <div className="text-xs space-y-1">
                      <div className="text-base font-extrabold text-slate-900">
                        {selectedStudentProfile.fullName}
                      </div>
                      <div className="text-slate-600">
                        Father: <strong className="text-slate-800">{selectedStudentProfile.fatherName}</strong>
                      </div>
                      <div className="text-slate-600">
                        Admission No:{' '}
                        <strong className="font-mono-num text-[#123466]">
                          {selectedStudentProfile.admissionNo}
                        </strong>{' '}
                        · Roll:{' '}
                        <strong className="font-mono-num text-[#123466]">
                          {selectedStudentProfile.rollNo}
                        </strong>
                      </div>
                      <div className="text-slate-600">
                        Class: <strong>{selectedStudentProfile.className}</strong> (Session{' '}
                        {selectedStudentProfile.session})
                      </div>
                      {selectedStudentProfile.guardianPhone && (
                        <div className="text-slate-600 font-mono-num">
                          Phone: {selectedStudentProfile.guardianPhone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditStudent(selectedStudentProfile)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#123466] text-white px-3.5 py-2 text-xs font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#F2D06B]" />
                      Edit Record &amp; Photo
                    </button>
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <DigitalIdCard
                    type="student"
                    student={selectedStudentProfile}
                    settings={settings}
                    lang={lang}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <th className="p-3">Photo</th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Roll</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Father</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <ScholarAvatar
                        photoUrl={st.cloudinaryImageUrl || st.photoUrl}
                        name={st.fullName}
                        className="w-10 h-10 text-xs"
                      />
                    </td>
                    <td className="p-3 font-mono-num font-bold">{st.admissionNo}</td>
                    <td className="p-3 font-mono-num">{st.rollNo}</td>
                    <td className="p-3 font-semibold text-slate-900">{st.fullName}</td>
                    <td className="p-3">{st.fatherName}</td>
                    <td className="p-3">{st.className}</td>
                    <td className="p-3 uppercase font-semibold">{st.status}</td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentProfile(st)}
                        className="inline-flex items-center gap-1 text-[#123466] font-semibold hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditStudent(st)}
                        className="inline-flex items-center gap-1 text-sky-700 font-semibold hover:underline"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDocument('students', st.id!, {
                            status: st.status === 'active' ? 'suspended' : 'active',
                          })
                        }
                        className="text-amber-700 font-semibold hover:underline"
                      >
                        {st.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      {isSuper && (
                        <button
                          type="button"
                          onClick={async () => {
                            const oldUrl = st.cloudinaryImageUrl || st.photoUrl;
                            await deleteDocument('students', st.id!);
                            if (oldUrl || st.cloudinaryPublicId) {
                              void deleteMadrasahPhotoByUrl(oldUrl, st.cloudinaryPublicId);
                            }
                            if (editingStudent?.id === st.id) setEditingStudent(null);
                            if (selectedStudentProfile?.id === st.id) setSelectedStudentProfile(null);
                          }}
                          className="text-rose-600 font-semibold hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEACHERS & PUBLIC GALLERY */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Registered Teacher Accounts & Approvals
            </h3>
            {teachers.length === 0 ? (
              <p className="text-xs text-slate-500">No teacher applications yet.</p>
            ) : (
              <div className="space-y-3">
                {teachers.map((tch) => (
                  <div
                    key={tch.id}
                    className="rounded-xl border border-slate-200 p-4 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ScholarAvatar
                          photoUrl={tch.cloudinaryImageUrl || tch.photoUrl}
                          name={tch.fullName}
                          className="w-11 h-11 text-sm"
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            {tch.fullName} ({tch.teacherCode})
                          </div>
                          <div className="text-slate-600">
                            {tch.email} · {tch.qualification} · Status:{' '}
                            <strong className="uppercase">{tch.status}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (editingTeacherPhoto?.id === tch.id) {
                              setEditingTeacherPhoto(null);
                            } else {
                              setEditingTeacherPhoto(tch);
                              setEditTchPhoto(tch.cloudinaryImageUrl || tch.photoUrl || '');
                              setEditTchPhotoPublicId(tch.cloudinaryPublicId || '');
                              setEditTchPhotoUploadedAt(tch.uploadedAt || '');
                            }
                          }}
                          className="rounded-lg border border-[#123466]/30 text-[#123466] px-3 py-1.5 font-semibold"
                        >
                          {editingTeacherPhoto?.id === tch.id ? 'Close Photo' : 'Photo'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await updateDocument('teachers', tch.id!, { status: 'active' });
                            await updateDocument('users', tch.userId, { status: 'active', role: 'teacher' });
                            notify(`Approved teacher ${tch.fullName}`);
                          }}
                          className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 font-semibold"
                        >
                          Approve Active
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await updateDocument('teachers', tch.id!, {
                              canPublishResults: !tch.canPublishResults,
                            });
                            notify('Toggled result publishing authorization.');
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold"
                        >
                          {tch.canPublishResults ? 'Revoke Publish Auth' : 'Grant Publish Auth'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await updateDocument('teachers', tch.id!, { status: 'suspended' });
                            await updateDocument('users', tch.userId, { status: 'suspended' });
                            notify('Teacher suspended.');
                          }}
                          className="rounded-lg text-rose-700 border border-rose-200 px-3 py-1.5 font-semibold"
                        >
                          Suspend
                        </button>
                      </div>
                    </div>

                    {editingTeacherPhoto?.id === tch.id && (
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <ImageUploader
                          folder="teachers"
                          label="Upload Teacher Photo / শিক্ষকের ছবি"
                          chooseButtonLabel="Choose Teacher Photo / শিক্ষকের ছবি নির্বাচন করুন"
                          value={editTchPhoto}
                          publicId={editTchPhotoPublicId}
                          persistedUrl={tch.cloudinaryImageUrl || tch.photoUrl}
                          persistedPublicId={tch.cloudinaryPublicId}
                          onChange={setEditTchPhoto}
                          onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                            setEditTchPhotoPublicId(asset?.cloudinaryPublicId || '');
                            setEditTchPhotoUploadedAt(asset?.uploadedAt || '');
                          }}
                          onUploadingChange={setEditTchPhotoUploading}
                          lang={lang}
                          disabled={savingTchPhoto}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={editTchPhotoUploading || savingTchPhoto}
                            onClick={async () => {
                              setSavingTchPhoto(true);
                              try {
                                const nextUrl = sanitizePersistedPhotoUrl(editTchPhoto);
                                const nextPid = nextUrl ? clampStr(editTchPhotoPublicId, 240) : '';
                                const nextAt = nextUrl ? clampStr(editTchPhotoUploadedAt, 60) : '';
                                const oldUrl = tch.cloudinaryImageUrl || tch.photoUrl || '';
                                const oldPid = tch.cloudinaryPublicId || '';
                                await updateDocument('teachers', tch.id!, {
                                  photoUrl: nextUrl,
                                  cloudinaryImageUrl: nextUrl,
                                  cloudinaryPublicId: nextPid,
                                  uploadedAt: nextAt,
                                });
                                if ((oldUrl || oldPid) && (oldUrl !== nextUrl || (oldPid && oldPid !== nextPid))) {
                                  void deleteMadrasahPhotoByUrl(oldUrl, oldPid);
                                }
                                setEditingTeacherPhoto(null);
                                notify(`Updated photo for ${tch.fullName}`);
                              } finally {
                                setSavingTchPhoto(false);
                              }
                            }}
                            className="rounded-lg bg-[#123466] text-white px-4 py-1.5 font-semibold disabled:opacity-60"
                          >
                            {editTchPhotoUploading
                              ? 'Uploading...'
                              : savingTchPhoto
                                ? 'Saving...'
                                : 'Save Teacher Photo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={handleAddPublicTeacher}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">
              Add Scholar to Homepage Gallery
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                required
                placeholder="Scholar Name"
                value={ptName}
                onChange={(e) => setPtName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Designation / Title"
                value={ptTitle}
                onChange={(e) => setPtTitle(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Qualification"
                value={ptQual}
                onChange={(e) => setPtQual(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Years Experience"
                value={ptExp}
                onChange={(e) => setPtExp(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Subjects (comma separated)"
                value={ptSubjects}
                onChange={(e) => setPtSubjects(e.target.value)}
                className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <ImageUploader
              folder="teachers"
              label="Upload Teacher Photo / শিক্ষকের ছবি"
              chooseButtonLabel="Choose Teacher Photo / শিক্ষকের ছবি নির্বাচন করুন"
              value={ptPhoto}
              publicId={ptPhotoPublicId}
              onChange={setPtPhoto}
              onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                setPtPhotoPublicId(asset?.cloudinaryPublicId || '');
                setPtPhotoUploadedAt(asset?.uploadedAt || '');
              }}
              onUploadingChange={setPtPhotoUploading}
              lang={lang}
              disabled={savingPublicTeacher}
            />

            <button
              type="submit"
              disabled={ptPhotoUploading || savingPublicTeacher}
              className="rounded-lg bg-[#123466] text-white px-5 py-2.5 text-xs font-semibold hover:bg-[#19478A] disabled:opacity-60"
            >
              {ptPhotoUploading
                ? 'Waiting for Photo Upload...'
                : savingPublicTeacher
                  ? 'Adding Scholar...'
                  : 'Add to Public Gallery'}
            </button>
          </form>

          {/* Edit Existing Homepage Gallery Scholar */}
          {editingPublicTeacher && (
            <form
              onSubmit={handleSaveEditPublicTeacher}
              className="rounded-2xl bg-[#071426]/[0.03] border-2 border-[#D4AF37] p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#123466] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#B8860B]" />
                  <span>Edit Scholar: {editingPublicTeacher.name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPublicTeacher(null)}
                  className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
                  aria-label="Close Edit Scholar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  required
                  placeholder="Scholar Name"
                  value={editPtName}
                  onChange={(e) => setEditPtName(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  required
                  placeholder="Designation / Title"
                  value={editPtTitle}
                  onChange={(e) => setEditPtTitle(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  required
                  placeholder="Qualification"
                  value={editPtQual}
                  onChange={(e) => setEditPtQual(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  type="number"
                  placeholder="Years Experience"
                  value={editPtExp}
                  onChange={(e) => setEditPtExp(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  placeholder="Subjects (comma separated)"
                  value={editPtSubjects}
                  onChange={(e) => setEditPtSubjects(e.target.value)}
                  className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
              </div>

              <ImageUploader
                folder="teachers"
                label="Upload Teacher Photo / শিক্ষকের ছবি"
                chooseButtonLabel="Choose Teacher Photo / শিক্ষকের ছবি নির্বাচন করুন"
                value={editPtPhoto}
                publicId={editPtPhotoPublicId}
                persistedUrl={editingPublicTeacher.cloudinaryImageUrl || editingPublicTeacher.photoUrl}
                persistedPublicId={editingPublicTeacher.cloudinaryPublicId}
                onChange={setEditPtPhoto}
                onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                  setEditPtPhotoPublicId(asset?.cloudinaryPublicId || '');
                  setEditPtPhotoUploadedAt(asset?.uploadedAt || '');
                }}
                onUploadingChange={setEditPtPhotoUploading}
                lang={lang}
                disabled={savingEditPublicTeacher}
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editPtPhotoUploading || savingEditPublicTeacher}
                  className="rounded-lg bg-[#123466] text-white px-5 py-2 text-xs font-semibold hover:bg-[#19478A] disabled:opacity-60"
                >
                  {editPtPhotoUploading
                    ? 'Uploading Photo...'
                    : savingEditPublicTeacher
                      ? 'Saving...'
                      : 'Update Scholar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPublicTeacher(null)}
                  className="rounded-lg border border-slate-300 bg-white text-slate-700 px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Published Homepage Teacher Gallery List */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Published Homepage Teacher Gallery ({publicTeachers.length})
            </h3>
            {publicTeachers.length === 0 ? (
              <p className="text-xs text-slate-500">No scholars added to public gallery yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {publicTeachers.map((pt) => (
                  <div
                    key={pt.id}
                    className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ScholarAvatar
                        photoUrl={pt.cloudinaryImageUrl || pt.photoUrl}
                        name={pt.name}
                        className="w-12 h-14"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{pt.name}</div>
                        <div className="text-[#123466] font-medium truncate">{pt.title}</div>
                        <div className="text-slate-500 truncate">
                          {pt.qualification} · {pt.experienceYears} yrs
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditPublicTeacher(pt)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold text-[#123466] hover:bg-slate-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const oldUrl = pt.cloudinaryImageUrl || pt.photoUrl;
                          await deleteDocument('publicTeachers', pt.id!);
                          if (oldUrl || pt.cloudinaryPublicId) {
                            void deleteMadrasahPhotoByUrl(oldUrl, pt.cloudinaryPublicId);
                          }
                          if (editingPublicTeacher?.id === pt.id) setEditingPublicTeacher(null);
                          notify('Removed scholar from public gallery.');
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMISSIONS */}
      {activeTab === 'admissions' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Online Admission Applications</h3>
          {admissions.length === 0 ? (
            <p className="text-xs text-slate-500">No applications submitted yet.</p>
          ) : (
            admissions.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">
                    {app.studentName} · <span className="font-mono-num">{app.applicationNo}</span>
                  </div>
                  <div className="text-slate-600">
                    Father: {app.fatherName} · Class: {app.className} ({app.session}) · Contact:{' '}
                    {app.guardianContact}
                  </div>
                  <div className="text-slate-500">
                    Status: <strong className="uppercase">{app.status}</strong>
                    {app.generatedStudentId && ` · Student ID: ${app.generatedStudentId}`}
                  </div>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveAdmission(app)}
                      className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 font-semibold"
                    >
                      Approve &amp; Enroll
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateDocument('admissions', app.id!, {
                          status: 'rejected',
                          reviewNote: 'Application declined after review.',
                        })
                      }
                      className="rounded-lg border border-rose-300 text-rose-700 px-3 py-1.5 font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* CLASSES, SUBJECTS & COURSES */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await createDocument('classes', {
                  name: clampStr(clsName, 80),
                  code: clampStr(clsCode, 30),
                  session: clampStr(clsSession, 30),
                  batchName: clampStr(clsBatch, 60),
                });
                setClsName('');
                setClsCode('');
                notify('Class & Batch created.');
              }}
              className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900">Create Class / Batch</h3>
              <input
                required
                placeholder="Class Name (e.g. Class X)"
                value={clsName}
                onChange={(e) => setClsName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Code (e.g. X)"
                value={clsCode}
                onChange={(e) => setClsCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Session (2026)"
                value={clsSession}
                onChange={(e) => setClsSession(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Batch Name"
                value={clsBatch}
                onChange={(e) => setClsBatch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#123466] text-white py-2 text-xs font-semibold"
              >
                Add Class ({classes.length})
              </button>
            </form>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const cid = subClassId || classes[0]?.id;
                if (!cid) return notify('Create a class first.');
                await createDocument('subjects', {
                  name: clampStr(subName, 100),
                  nameBn: clampStr(subNameBn, 100) || undefined,
                  classId: cid,
                  fullMarks: Number(subFull) || 100,
                  passMarks: Number(subPass) || 33,
                });
                setSubName('');
                setSubNameBn('');
                notify('Subject created.');
              }}
              className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900">Create Subject</h3>
              <input
                required
                placeholder="Subject Name (e.g. English)"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Bengali Name (e.g. ইংরেজি)"
                value={subNameBn}
                onChange={(e) => setSubNameBn(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={subClassId}
                onChange={(e) => setSubClassId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Full Marks"
                  value={subFull}
                  onChange={(e) => setSubFull(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Pass Marks"
                  value={subPass}
                  onChange={(e) => setSubPass(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#123466] text-white py-2 text-xs font-semibold"
              >
                Add Subject ({subjects.length})
              </button>
            </form>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (courseThumbUploading || savingCourse) return;
                setSavingCourse(true);
                try {
                  const safeThumb = sanitizePersistedPhotoUrl(courseThumbUrl);
                  await createDocument('courses', {
                    title: clampStr(courseTitle, 140),
                    category: clampStr(courseCategory, 80),
                    description: clampStr(courseDesc, 1200),
                    thumbnailUrl: safeThumb || undefined,
                    cloudinaryImageUrl: safeThumb || undefined,
                    cloudinaryPublicId: clampStr(courseThumbPublicId, 240) || undefined,
                    uploadedAt: clampStr(courseThumbUploadedAt, 60) || undefined,
                    featured: true,
                    status: 'active',
                  });
                  setCourseTitle('');
                  setCourseDesc('');
                  setCourseThumbUrl('');
                  setCourseThumbPublicId('');
                  setCourseThumbUploadedAt('');
                  notify('Course published.');
                } finally {
                  setSavingCourse(false);
                }
              }}
              className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900">Create Course</h3>
              <input
                required
                placeholder="Course Title"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={courseCategory}
                onChange={(e) => setCourseCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {[
                  'Quran Learning',
                  'Quran Tajweed',
                  'Hifz',
                  'Hadith',
                  'Fiqh',
                  'Arabic Language',
                  'Noorani Education',
                  'Islamic Studies',
                  'Aalimiyat',
                ].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <textarea
                required
                rows={2}
                placeholder="Course description..."
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <ImageUploader
                folder="courses"
                aspect="landscape"
                label="Course Thumbnail / কোর্সের থাম্বনেইল"
                value={courseThumbUrl}
                publicId={courseThumbPublicId}
                onChange={setCourseThumbUrl}
                onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                  setCourseThumbPublicId(asset?.cloudinaryPublicId || '');
                  setCourseThumbUploadedAt(asset?.uploadedAt || '');
                }}
                onUploadingChange={setCourseThumbUploading}
                lang={lang}
                disabled={savingCourse}
              />
              <button
                type="submit"
                disabled={courseThumbUploading || savingCourse}
                className="w-full rounded-lg bg-[#123466] text-white py-2 text-xs font-semibold hover:bg-[#19478A] disabled:opacity-60"
              >
                {courseThumbUploading
                  ? 'Uploading Thumbnail...'
                  : savingCourse
                    ? 'Publishing Course...'
                    : `Add Course (${courses.length})`}
              </button>
            </form>
          </div>

          {editingCourse && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingCourse.id || editCourseThumbUploading || savingEditCourse) return;
                setSavingEditCourse(true);
                try {
                  const nextThumb = sanitizePersistedPhotoUrl(editCourseThumbUrl);
                  const nextPid = nextThumb ? clampStr(editCourseThumbPublicId, 240) : '';
                  const nextAt = nextThumb ? clampStr(editCourseThumbUploadedAt, 60) : '';
                  const oldThumb = editingCourse.thumbnailUrl || editingCourse.cloudinaryImageUrl || '';
                  const oldPid = editingCourse.cloudinaryPublicId || '';
                  await updateDocument('courses', editingCourse.id, {
                    title: clampStr(editCourseTitle, 140),
                    category: clampStr(editCourseCategory, 80),
                    description: clampStr(editCourseDesc, 1200),
                    thumbnailUrl: nextThumb,
                    cloudinaryImageUrl: nextThumb,
                    cloudinaryPublicId: nextPid,
                    uploadedAt: nextAt,
                  });
                  if ((oldThumb || oldPid) && (oldThumb !== nextThumb || (oldPid && oldPid !== nextPid))) {
                    void deleteMadrasahPhotoByUrl(oldThumb, oldPid);
                  }
                  setEditingCourse(null);
                  notify('Course and thumbnail updated.');
                } finally {
                  setSavingEditCourse(false);
                }
              }}
              className="rounded-2xl bg-[#071426]/[0.03] border-2 border-[#D4AF37] p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#123466] flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#B8860B]" />
                  <span>Edit Course: {editingCourse.title}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
                  aria-label="Close Edit Course"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Course Title"
                  value={editCourseTitle}
                  onChange={(e) => setEditCourseTitle(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
                <input
                  required
                  placeholder="Category"
                  value={editCourseCategory}
                  onChange={(e) => setEditCourseCategory(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
              </div>
              <textarea
                required
                rows={2}
                placeholder="Course description..."
                value={editCourseDesc}
                onChange={(e) => setEditCourseDesc(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              />
              <ImageUploader
                folder="courses"
                aspect="landscape"
                label="Course Thumbnail / কোর্সের থাম্বনেইল"
                value={editCourseThumbUrl}
                publicId={editCourseThumbPublicId}
                persistedUrl={editingCourse.thumbnailUrl || editingCourse.cloudinaryImageUrl}
                persistedPublicId={editingCourse.cloudinaryPublicId}
                onChange={setEditCourseThumbUrl}
                onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                  setEditCourseThumbPublicId(asset?.cloudinaryPublicId || '');
                  setEditCourseThumbUploadedAt(asset?.uploadedAt || '');
                }}
                onUploadingChange={setEditCourseThumbUploading}
                lang={lang}
                disabled={savingEditCourse}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editCourseThumbUploading || savingEditCourse}
                  className="rounded-lg bg-[#123466] text-white px-5 py-2 text-xs font-semibold hover:bg-[#19478A] disabled:opacity-60"
                >
                  {editCourseThumbUploading
                    ? 'Uploading Thumbnail...'
                    : savingEditCourse
                      ? 'Saving...'
                      : 'Update Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="rounded-lg border border-slate-300 bg-white text-slate-700 px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Published Courses Management */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Published Madrasah Courses ({courses.length})
            </h3>
            {courses.length === 0 ? (
              <p className="text-xs text-slate-500">No courses published yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {courses.map((course) => {
                  const thumb = course.thumbnailUrl || course.cloudinaryImageUrl;
                  return (
                    <div
                      key={course.id}
                      className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-12 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={course.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-5 h-5 text-[#123466]/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{course.title}</div>
                          <div className="text-[#123466] font-medium truncate">{course.category}</div>
                          <div className="text-slate-500 line-clamp-1">{course.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCourse(course);
                            setEditCourseTitle(course.title);
                            setEditCourseCategory(course.category);
                            setEditCourseDesc(course.description);
                            setEditCourseThumbUrl(thumb || '');
                            setEditCourseThumbPublicId(course.cloudinaryPublicId || '');
                            setEditCourseThumbUploadedAt(course.uploadedAt || '');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 font-semibold text-[#123466] hover:bg-slate-50"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteDocument('courses', course.id!);
                            if (thumb || course.cloudinaryPublicId) {
                              void deleteMadrasahPhotoByUrl(thumb, course.cloudinaryPublicId);
                            }
                            if (editingCourse?.id === course.id) setEditingCourse(null);
                            notify('Course removed.');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXAMS & RESULTS / MARKSHEET BUILDER */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Create Examination */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const cls = classes.find((c) => c.id === examClassId) || classes[0];
              if (!cls?.id) return notify('Create a class first.');
              await createDocument('examinations', {
                title: clampStr(examTitle, 140),
                session: clampStr(examSession, 30),
                classId: cls.id,
                className: cls.name,
                examType,
                durationMinutes: Number(examDuration) || 60,
                status: 'active',
                createdByUid: auth.currentUser?.uid || profile.uid,
              });
              setExamTitle('');
              notify('Examination created.');
            }}
            className="no-print rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">1. Create Examination</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                required
                placeholder="Exam Title (e.g. 2026 Examination Result)"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="lg:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={examClassId}
                onChange={(e) => setExamClassId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Session (2026)"
                value={examSession}
                onChange={(e) => setExamSession(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as 'written' | 'mcq' | 'combined')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="written">Written Exam</option>
                <option value="mcq">Online MCQ</option>
                <option value="combined">Combined</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold"
            >
              Create Examination
            </button>
          </form>

          {/* Marksheet Generator (Unlimited Subjects, Automatic Calculation) */}
          <div className="no-print rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              2. Generate &amp; Publish Academic Marksheet (Auto-Calculated)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={resExamId}
                onChange={(e) => setResExamId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Select Examination</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.className})
                  </option>
                ))}
              </select>
              <select
                value={resStudentId}
                onChange={(e) => setResStudentId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Select Student</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.admissionNo})
                  </option>
                ))}
              </select>
              <input
                placeholder="Class Teacher Name"
                value={resClassTeacher}
                onChange={(e) => setResClassTeacher(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Head Teacher Name"
                value={resHeadTeacher}
                onChange={(e) => setResHeadTeacher(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Subject-Wise Marks ({subjectRows.length} subjects)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSubjectRows([
                      ...subjectRows,
                      { subjectName: '', obtainedMarks: 0, fullMarks: 100, passMarks: 33 },
                    ])
                  }
                  className="text-xs font-semibold text-[#123466] hover:underline"
                >
                  + Add Subject Row
                </button>
              </div>
              {subjectRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    placeholder="Subject (English / বাংলা)"
                    value={row.subjectName}
                    onChange={(e) => {
                      const copy = [...subjectRows];
                      copy[idx] = { ...copy[idx], subjectName: e.target.value };
                      setSubjectRows(copy);
                    }}
                    className="col-span-5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Obtained"
                    value={row.obtainedMarks}
                    onChange={(e) => {
                      const copy = [...subjectRows];
                      copy[idx] = { ...copy[idx], obtainedMarks: Number(e.target.value) };
                      setSubjectRows(copy);
                    }}
                    className="col-span-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono-num"
                  />
                  <input
                    type="number"
                    placeholder="Full"
                    value={row.fullMarks}
                    onChange={(e) => {
                      const copy = [...subjectRows];
                      copy[idx] = { ...copy[idx], fullMarks: Number(e.target.value) };
                      setSubjectRows(copy);
                    }}
                    className="col-span-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono-num"
                  />
                  <input
                    type="number"
                    placeholder="Pass"
                    value={row.passMarks}
                    onChange={(e) => {
                      const copy = [...subjectRows];
                      copy[idx] = { ...copy[idx], passMarks: Number(e.target.value) };
                      setSubjectRows(copy);
                    }}
                    className="col-span-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono-num"
                  />
                  <button
                    type="button"
                    onClick={() => setSubjectRows(subjectRows.filter((_, i) => i !== idx))}
                    className="col-span-1 text-rose-600 flex justify-center"
                    aria-label="Remove Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                Auto Summary: <strong className="font-mono-num">{calculatedPreview.totalObtained}/{calculatedPreview.totalFull}</strong> ·{' '}
                <strong className="font-mono-num">{calculatedPreview.percentage}%</strong> · Grade{' '}
                <strong>{calculatedPreview.grade}</strong> ·{' '}
                <strong className={calculatedPreview.passed ? 'text-emerald-700' : 'text-rose-700'}>
                  {calculatedPreview.passed ? 'PASS' : 'FAIL'}
                </strong>
              </div>
              <input
                placeholder="Teacher's Remarks"
                value={resTeacherRemarks}
                onChange={(e) => setResTeacherRemarks(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs w-full sm:w-64"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCreateResult(true)}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-xs font-semibold hover:bg-emerald-700"
              >
                Create &amp; Publish Official Result
              </button>
              <button
                type="button"
                onClick={() => handleCreateResult(false)}
                className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold hover:bg-[#19478A]"
              >
                Save as Approved (Unpublished)
              </button>
            </div>
          </div>

          {/* Results List & Publication Control */}
          <div className="no-print rounded-2xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <th className="p-3">Student</th>
                  <th className="p-3">Exam</th>
                  <th className="p-3">Marks</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="p-3 font-semibold text-slate-900">
                      {r.studentName} ({r.admissionNo})
                    </td>
                    <td className="p-3">{r.examTitle}</td>
                    <td className="p-3 font-mono-num">
                      {r.totalObtained}/{r.totalFull} ({r.percentage}%)
                    </td>
                    <td className="p-3 font-bold">
                      {r.grade} ({r.passed ? 'PASS' : 'FAIL'})
                    </td>
                    <td className="p-3 uppercase font-bold">{r.approvalStatus}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewResult(r)}
                        className="text-[#123466] font-semibold hover:underline"
                      >
                        View / PDF
                      </button>
                      {r.approvalStatus !== 'published' ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateDocument('results', r.id!, {
                              approvalStatus: 'published',
                              publishedAt: new Date().toISOString().slice(0, 10),
                            })
                          }
                          className="text-emerald-700 font-semibold hover:underline"
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateDocument('results', r.id!, { approvalStatus: 'approved' })
                          }
                          className="text-amber-700 font-semibold hover:underline"
                        >
                          Unpublish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewResult && (
            <div className="pt-4">
              <div className="no-print flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-900">Marksheet Preview &amp; Print</h4>
                <button
                  type="button"
                  onClick={() => setPreviewResult(null)}
                  className="text-xs font-semibold text-slate-600 hover:underline"
                >
                  Close Preview
                </button>
              </div>
              <MarksheetCard result={previewResult} settings={settings} lang={lang} />
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-wrap gap-3 items-center">
            <select
              value={attClassId}
              onChange={(e) => setAttClassId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <th className="p-3">Roll</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Class</th>
                  <th className="p-3 text-right">Mark Attendance ({attDate})</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((s) => !attClassId || s.classId === attClassId)
                  .map((st) => (
                    <tr key={st.id} className="border-b border-slate-100">
                      <td className="p-3 font-mono-num">{st.rollNo}</td>
                      <td className="p-3 font-semibold">{st.fullName}</td>
                      <td className="p-3">{st.className}</td>
                      <td className="p-3 text-right space-x-1.5">
                        {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => markAttendance(st, status)}
                            className="px-2.5 py-1 rounded border border-slate-300 hover:bg-[#123466] hover:text-white capitalize font-semibold"
                          >
                            {status}
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIGITAL LIBRARY & LIVE CLASSES */}
      {activeTab === 'digital' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-[#123466]" />
              Scheduled Live Classes ({liveClasses.length})
            </h3>
            <div className="space-y-2.5 text-xs">
              {liveClasses.map((lc) => (
                <div key={lc.id} className="rounded-lg border border-slate-200 p-3 flex justify-between gap-3">
                  <div>
                    <div className="font-bold">{lc.title}</div>
                    <div className="text-slate-500">
                      {lc.provider} · {lc.scheduledAt}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteDocument('liveClasses', lc.id!)}
                    className="text-rose-600 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Digital Library Materials ({materials.length})
            </h3>
            <div className="space-y-2.5 text-xs">
              {materials.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-200 p-3 flex justify-between gap-3">
                  <div>
                    <div className="font-bold">{m.title}</div>
                    <div className="text-slate-500 uppercase">
                      {m.type} · {m.category}
                    </div>
                  </div>
                  <a href={m.resourceUrl} target="_blank" rel="noreferrer" className="text-[#123466] font-semibold">
                    Open
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATES & ID CARDS */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (certAssetUploading || savingCert) return;
              const st = students.find((s) => s.id === certStudentId);
              if (!st) return notify('Select a student first.');
              setSavingCert(true);
              try {
                const safeAsset = sanitizePersistedPhotoUrl(certAssetUrl);
                const vNo = `MDSM-CERT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
                await createDocument('certificates', {
                  verificationNo: vNo,
                  type: certType,
                  studentId: st.id!,
                  studentUid: st.userId,
                  parentUserIds: st.parentUserIds || [],
                  studentName: st.fullName,
                  fatherName: st.fatherName,
                  className: st.className,
                  session: st.session,
                  title: clampStr(certTitle, 160),
                  issueDate: new Date().toISOString().slice(0, 10),
                  issuedByUid: auth.currentUser?.uid || profile.uid,
                  assetUrl: safeAsset || undefined,
                  cloudinaryImageUrl: safeAsset || undefined,
                  cloudinaryPublicId: clampStr(certAssetPublicId, 240) || undefined,
                  uploadedAt: clampStr(certAssetUploadedAt, 60) || undefined,
                  status: 'active',
                });
                setCertAssetUrl('');
                setCertAssetPublicId('');
                setCertAssetUploadedAt('');
                notify(`Issued verifiable certificate ${vNo}`);
              } finally {
                setSavingCert(false);
              }
            }}
            className="no-print rounded-2xl bg-white border border-slate-200 p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">Issue Official Certificate</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={certStudentId}
                onChange={(e) => setCertStudentId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Select Student</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.admissionNo})
                  </option>
                ))}
              </select>
              <select
                value={certType}
                onChange={(e) =>
                  setCertType(e.target.value as 'course_completion' | 'academic' | 'achievement')
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="course_completion">Course Completion</option>
                <option value="academic">Academic Certificate</option>
                <option value="achievement">Achievement Certificate</option>
              </select>
              <input
                required
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="Certificate Title"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <ImageUploader
              folder="certificates"
              aspect="square"
              label="Certificate Seal / Emblem (Optional) / সনদের সিল"
              value={certAssetUrl}
              publicId={certAssetPublicId}
              onChange={setCertAssetUrl}
              onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                setCertAssetPublicId(asset?.cloudinaryPublicId || '');
                setCertAssetUploadedAt(asset?.uploadedAt || '');
              }}
              onUploadingChange={setCertAssetUploading}
              lang={lang}
              disabled={savingCert}
            />

            <button
              type="submit"
              disabled={certAssetUploading || savingCert}
              className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold hover:bg-[#19478A] disabled:opacity-60"
            >
              {certAssetUploading
                ? 'Uploading Certificate Asset...'
                : savingCert
                  ? 'Generating Certificate...'
                  : 'Generate Verifiable Certificate'}
            </button>
          </form>

          {students[0] && (
            <div>
              <h4 className="no-print text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Student Digital ID Card Sample
              </h4>
              <DigitalIdCard type="student" student={students[0]} settings={settings} lang={lang} />
            </div>
          )}

          {certificates.map((cert) => (
            <div key={cert.id} className="space-y-2">
              {isSuper && cert.id && (
                <div className="no-print flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      const oldUrl = cert.assetUrl || cert.cloudinaryImageUrl;
                      await deleteDocument('certificates', cert.id!);
                      if (oldUrl || cert.cloudinaryPublicId) {
                        void deleteMadrasahPhotoByUrl(oldUrl, cert.cloudinaryPublicId);
                      }
                      notify(`Removed certificate ${cert.verificationNo}`);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Certificate
                  </button>
                </div>
              )}
              <CertificateCard certificate={cert} settings={settings} lang={lang} />
            </div>
          ))}
        </div>
      )}

      {/* FEES & FINANCE */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const st = students.find((s) => s.id === feeStudentId);
              if (!st) return notify('Select a student.');
              const amt = Number(feeAmount) || 0;
              const paid = Number(feePaid) || 0;
              const due = Math.max(0, amt - paid);
              const status = due === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
              await createDocument('feeRecords', {
                receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
                studentId: st.id!,
                studentUid: st.userId,
                parentUserIds: st.parentUserIds || [],
                studentName: st.fullName,
                admissionNo: st.admissionNo,
                className: st.className,
                category: clampStr(feeCategory, 80),
                amount: amt,
                paidAmount: paid,
                dueAmount: due,
                status,
                paymentDate: new Date().toISOString().slice(0, 10),
                recordedByUid: auth.currentUser?.uid || profile.uid,
              });
              notify('Fee record & receipt created.');
            }}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">Record Fee / Payment Receipt</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={feeStudentId}
                onChange={(e) => setFeeStudentId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Select Student</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.admissionNo})
                  </option>
                ))}
              </select>
              <input
                value={feeCategory}
                onChange={(e) => setFeeCategory(e.target.value)}
                placeholder="Fee Category"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={feeAmount}
                onChange={(e) => setFeeAmount(Number(e.target.value))}
                placeholder="Total Amount"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={feePaid}
                onChange={(e) => setFeePaid(Number(e.target.value))}
                placeholder="Paid Amount"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold"
            >
              Save Fee Receipt
            </button>
          </form>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                  <th className="p-3">Receipt</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id} className="border-b border-slate-100">
                    <td className="p-3 font-mono-num font-bold">{f.receiptNo}</td>
                    <td className="p-3">{f.studentName}</td>
                    <td className="p-3">{f.category}</td>
                    <td className="p-3 font-mono-num">৳{f.amount}</td>
                    <td className="p-3 font-mono-num text-emerald-700">৳{f.paidAmount}</td>
                    <td className="p-3 font-mono-num text-rose-700">৳{f.dueAmount}</td>
                    <td className="p-3 uppercase font-bold">{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NOTICES */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (noticeImageUploading || savingNotice) return;
              setSavingNotice(true);
              try {
                const safeImg = sanitizePersistedPhotoUrl(noticeImageUrl);
                await createDocument('notices', {
                  title: clampStr(noticeTitle, 160),
                  content: clampStr(noticeContent, 2500),
                  priority: noticePriority,
                  targetRole: 'all',
                  published: true,
                  imageUrl: safeImg || undefined,
                  cloudinaryImageUrl: safeImg || undefined,
                  cloudinaryPublicId: clampStr(noticeImagePublicId, 240) || undefined,
                  uploadedAt: clampStr(noticeImageUploadedAt, 60) || undefined,
                  authorUid: auth.currentUser?.uid || profile.uid,
                  authorName: resolveUserDisplayName(profile.displayName, profile.email, profile.role),
                });
                setNoticeTitle('');
                setNoticeContent('');
                setNoticeImageUrl('');
                setNoticeImagePublicId('');
                setNoticeImageUploadedAt('');
                notify('Notice published.');
              } finally {
                setSavingNotice(false);
              }
            }}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">Publish Official Notice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                required
                placeholder="Notice Headline"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={noticePriority}
                onChange={(e) =>
                  setNoticePriority(e.target.value as 'normal' | 'important' | 'urgent')
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Notice details..."
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <ImageUploader
              folder="notices"
              aspect="landscape"
              label="Notice Image (Optional) / নোটিশের ছবি"
              value={noticeImageUrl}
              publicId={noticeImagePublicId}
              onChange={setNoticeImageUrl}
              onUploadedAsset={(asset: UploadedCloudinaryAsset | null) => {
                setNoticeImagePublicId(asset?.cloudinaryPublicId || '');
                setNoticeImageUploadedAt(asset?.uploadedAt || '');
              }}
              onUploadingChange={setNoticeImageUploading}
              lang={lang}
              disabled={savingNotice}
            />
            <button
              type="submit"
              disabled={noticeImageUploading || savingNotice}
              className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold hover:bg-[#19478A] disabled:opacity-60"
            >
              {noticeImageUploading
                ? 'Uploading Notice Image...'
                : savingNotice
                  ? 'Publishing Notice...'
                  : 'Publish Notice'}
            </button>
          </form>

          <div className="space-y-2.5">
            {notices.map((n) => {
              const img = n.imageUrl || n.cloudinaryImageUrl;
              return (
                <div
                  key={n.id}
                  className="rounded-xl bg-white border border-slate-200 p-4 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {img && (
                      <img
                        src={img}
                        alt={n.title}
                        referrerPolicy="no-referrer"
                        className="w-20 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">{n.title}</div>
                      <div className="text-slate-600 mt-1">{n.content}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteDocument('notices', n.id!);
                      if (img || n.cloudinaryPublicId) {
                        void deleteMadrasahPhotoByUrl(img, n.cloudinaryPublicId);
                      }
                    }}
                    className="text-rose-600 font-semibold shrink-0"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* USERS & ADMIN RBAC */}
      {activeTab === 'users' && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">UID (for Parent Linking)</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                {isSuper && <th className="p-3 text-right">Manage RBAC</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="p-3 font-semibold">{resolveUserDisplayName(u.displayName, u.email, u.role)}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 font-mono-num text-[11px]">{u.uid}</td>
                  <td className="p-3 uppercase font-bold">{u.role}</td>
                  <td className="p-3 uppercase">{u.status}</td>
                  {isSuper && (
                    <td className="p-3 text-right space-x-2">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateDocument('users', u.id!, { role: e.target.value as UserRole })
                        }
                        className="rounded border border-slate-300 px-2 py-1 bg-white"
                      >
                        <option value="student">student</option>
                        <option value="parent">parent</option>
                        <option value="teacher">teacher</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          updateDocument('users', u.id!, {
                            status: u.status === 'active' ? 'suspended' : 'active',
                          })
                        }
                        className="text-[#123466] font-semibold hover:underline"
                      >
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WEBSITE BRANDING & GRADING EDITOR */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveBranding}
          className="rounded-2xl bg-white border border-slate-200 p-6 space-y-5"
        >
          <h3 className="text-base font-bold text-slate-900">
            Website Branding, Content &amp; Grading Policy Editor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Madrasa Name (English)
              </label>
              <input
                value={editSettings.madrasaName}
                onChange={(e) => setEditSettings({ ...editSettings, madrasaName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Madrasa Name (Bengali)
              </label>
              <input
                value={editSettings.madrasaNameBn || ''}
                onChange={(e) => setEditSettings({ ...editSettings, madrasaNameBn: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Established Year
              </label>
              <input
                value={editSettings.establishedYear}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, establishedYear: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Principal Name
              </label>
              <input
                value={editSettings.principalName || ''}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, principalName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hero Title (English)
              </label>
              <input
                value={editSettings.heroTitle || ''}
                onChange={(e) => setEditSettings({ ...editSettings, heroTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Principal Message
              </label>
              <textarea
                rows={2}
                value={editSettings.principalMessage || ''}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, principalMessage: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                value={editSettings.phone || ''}
                onChange={(e) => setEditSettings({ ...editSettings, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Pass Percentage (%)
              </label>
              <input
                type="number"
                value={editSettings.passPercentage ?? 33}
                onChange={(e) =>
                  setEditSettings({ ...editSettings, passPercentage: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono-num"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase">
              Cloudinary Branding, Banners &amp; Official Seal Assets
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ImageUploader
                folder="branding"
                aspect="square"
                label="Madrasa Logo / মাদ্রাসার লোগো"
                value={editSettings.logoUrl || ''}
                publicId={editSettings.logoPublicId}
                persistedUrl={settings.logoUrl}
                persistedPublicId={settings.logoPublicId}
                onChange={(url) =>
                  setEditSettings((prev) => ({
                    ...prev,
                    logoUrl: url,
                    ...(url ? {} : { logoPublicId: '' }),
                  }))
                }
                onUploadedAsset={(asset: UploadedCloudinaryAsset | null) =>
                  setEditSettings((prev) => ({
                    ...prev,
                    logoPublicId: asset?.cloudinaryPublicId || '',
                  }))
                }
                onUploadingChange={setLogoUploading}
                lang={lang}
                disabled={savingSettings}
              />

              <ImageUploader
                folder="teachers"
                aspect="portrait"
                label="Principal Photo / অধ্যক্ষের ছবি"
                chooseButtonLabel="Choose Teacher Photo / শিক্ষকের ছবি নির্বাচন করুন"
                value={editSettings.principalPhotoUrl || ''}
                publicId={editSettings.principalPhotoPublicId}
                persistedUrl={settings.principalPhotoUrl}
                persistedPublicId={settings.principalPhotoPublicId}
                onChange={(url) =>
                  setEditSettings((prev) => ({
                    ...prev,
                    principalPhotoUrl: url,
                    ...(url ? {} : { principalPhotoPublicId: '' }),
                  }))
                }
                onUploadedAsset={(asset: UploadedCloudinaryAsset | null) =>
                  setEditSettings((prev) => ({
                    ...prev,
                    principalPhotoPublicId: asset?.cloudinaryPublicId || '',
                  }))
                }
                onUploadingChange={setPrincipalPhotoUploading}
                lang={lang}
                disabled={savingSettings}
              />

              <ImageUploader
                folder="banners"
                aspect="landscape"
                maxDimension={1600}
                label="Homepage Hero Banner / হোমপেজ ব্যানার"
                value={editSettings.heroBannerUrl || ''}
                publicId={editSettings.heroBannerPublicId}
                persistedUrl={settings.heroBannerUrl}
                persistedPublicId={settings.heroBannerPublicId}
                onChange={(url) =>
                  setEditSettings((prev) => ({
                    ...prev,
                    heroBannerUrl: url,
                    ...(url ? {} : { heroBannerPublicId: '' }),
                  }))
                }
                onUploadedAsset={(asset: UploadedCloudinaryAsset | null) =>
                  setEditSettings((prev) => ({
                    ...prev,
                    heroBannerPublicId: asset?.cloudinaryPublicId || '',
                  }))
                }
                onUploadingChange={setHeroBannerUploading}
                lang={lang}
                disabled={savingSettings}
              />

              <ImageUploader
                folder="banners"
                aspect="landscape"
                maxDimension={1400}
                label="Online Admission Banner / ভর্তি ব্যানার"
                value={editSettings.admissionBannerUrl || ''}
                publicId={editSettings.admissionBannerPublicId}
                persistedUrl={settings.admissionBannerUrl}
                persistedPublicId={settings.admissionBannerPublicId}
                onChange={(url) =>
                  setEditSettings((prev) => ({
                    ...prev,
                    admissionBannerUrl: url,
                    ...(url ? {} : { admissionBannerPublicId: '' }),
                  }))
                }
                onUploadedAsset={(asset: UploadedCloudinaryAsset | null) =>
                  setEditSettings((prev) => ({
                    ...prev,
                    admissionBannerPublicId: asset?.cloudinaryPublicId || '',
                  }))
                }
                onUploadingChange={setAdmissionBannerUploading}
                lang={lang}
                disabled={savingSettings}
              />

              <div className="lg:col-span-2">
                <ImageUploader
                  folder="certificates"
                  aspect="square"
                  label="Default Certificate Seal / সনদের অফিসিয়াল সিল"
                  value={editSettings.certificateSealUrl || ''}
                  publicId={editSettings.certificateSealPublicId}
                  persistedUrl={settings.certificateSealUrl}
                  persistedPublicId={settings.certificateSealPublicId}
                  onChange={(url) =>
                    setEditSettings((prev) => ({
                      ...prev,
                      certificateSealUrl: url,
                      ...(url ? {} : { certificateSealPublicId: '' }),
                    }))
                  }
                  onUploadedAsset={(asset: UploadedCloudinaryAsset | null) =>
                    setEditSettings((prev) => ({
                      ...prev,
                      certificateSealPublicId: asset?.cloudinaryPublicId || '',
                    }))
                  }
                  onUploadingChange={setCertSealUploading}
                  lang={lang}
                  disabled={savingSettings}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">
              Configurable Grade Scale
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(editSettings.gradingRules || DEFAULT_GRADING_RULES).map((rule: GradingRule, i: number) => (
                <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs space-y-1">
                  <div className="font-bold text-[#123466]">Grade {rule.grade}</div>
                  <div className="flex items-center gap-2">
                    <span>Min %:</span>
                    <input
                      type="number"
                      value={rule.minPercentage}
                      onChange={(e) => {
                        const rules = [...(editSettings.gradingRules || DEFAULT_GRADING_RULES)];
                        rules[i] = { ...rules[i], minPercentage: Number(e.target.value) };
                        setEditSettings({ ...editSettings, gradingRules: rules });
                      }}
                      className="w-16 rounded border border-slate-300 px-1.5 py-0.5 font-mono-num"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={anySettingsUploading || savingSettings}
            className="rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {anySettingsUploading
              ? 'Waiting for Asset Upload...'
              : savingSettings
                ? 'Saving Configuration...'
                : 'Save Website & Grading Configuration'}
          </button>
        </form>
      )}
    </DashboardShell>
  );
};
