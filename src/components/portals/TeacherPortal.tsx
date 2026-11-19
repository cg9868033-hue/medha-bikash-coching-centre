import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileSpreadsheet,
  LayoutDashboard,
  Library,
  Plus,
  Send,
  Trash2,
  UserCheck,
  Video,
} from 'lucide-react';
import { where } from 'firebase/firestore';
import { auth } from '../../firebase';
import {
  AssignmentRecord,
  AttendanceRecord,
  calculateMarksheetTotals,
  ClassBatch,
  Course,
  DEFAULT_GRADING_RULES,
  Examination,
  Language,
  LessonRecord,
  LiveClassRecord,
  NotificationRecord,
  ResultRecord,
  SiteSettings,
  StudentRecord,
  StudyMaterialRecord,
  SubjectMark,
  SubmissionRecord,
  TeacherRecord,
  UserProfile,
} from '../../types/madrasa';
import {
  clampStr,
  createDocument,
  logAudit,
  resolveUserDisplayName,
  subscribeCollection,
  updateDocument,
} from '../../services/firestoreService';
import { DashboardShell, NavTab } from '../DashboardShell';
import { DigitalIdCard } from '../DigitalIdAndCertificate';

interface TeacherPortalProps {
  profile: UserProfile;
  settings: SiteSettings;
  lang: Language;
  onToggleLang: () => void;
  onBackHome: () => void;
  onSignOut: () => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  profile,
  settings,
  lang,
  onToggleLang,
  onBackHome,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [teacherDoc, setTeacherDoc] = useState<TeacherRecord | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassRecord[]>([]);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [materials, setMaterials] = useState<StudyMaterialRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const teacherDisplayName = resolveUserDisplayName(profile.displayName, profile.email, profile.role);

  const notify = (m: string) => {
    setBanner(m);
    setTimeout(() => setBanner(null), 4000);
  };

  useEffect(() => {
    const uid = auth.currentUser?.uid || profile.uid;
    const unsubs = [
      subscribeCollection<TeacherRecord>('teachers', (list) => setTeacherDoc(list[0] || null), [
        where('userId', '==', uid),
      ]),
      subscribeCollection<ClassBatch>('classes', setClasses),
      subscribeCollection<Course>('courses', setCourses),
      subscribeCollection<NotificationRecord>('notifications', setNotifications, [
        where('recipientUid', '==', uid),
      ]),
    ];

    if (profile.status === 'active') {
      unsubs.push(
        subscribeCollection<StudentRecord>('students', setStudents),
        subscribeCollection<LiveClassRecord>('liveClasses', setLiveClasses),
        subscribeCollection<LessonRecord>('lessons', setLessons),
        subscribeCollection<StudyMaterialRecord>('studyMaterials', setMaterials),
        subscribeCollection<AssignmentRecord>('assignments', setAssignments),
        subscribeCollection<SubmissionRecord>('submissions', setSubmissions),
        subscribeCollection<Examination>('examinations', setExams),
        subscribeCollection<AttendanceRecord>('attendance', setAttendance)
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [profile.uid, profile.status]);

  // Forms
  const [lcTitle, setLcTitle] = useState('');
  const [lcSchedule, setLcSchedule] = useState('Tomorrow · 09:00 AM');
  const [lcProvider, setLcProvider] = useState<'Zoom' | 'Google Meet' | 'Jitsi' | 'YouTube Live'>('Jitsi');
  const [lcUrl, setLcUrl] = useState('https://meet.jit.si/MederDharLiveClass');
  const [lcClassId, setLcClassId] = useState('');

  const [lesTitle, setLesTitle] = useState('');
  const [lesCategory, setLesCategory] = useState('Quran Tajweed');
  const [lesUrl, setLesUrl] = useState('');
  const [lesDuration, setLesDuration] = useState('25 min');

  const [matTitle, setMatTitle] = useState('');
  const [matType, setMatType] = useState<'pdf' | 'notes' | 'audio' | 'video'>('pdf');
  const [matCat, setMatCat] = useState('Arabic Language');
  const [matUrl, setMatUrl] = useState('');

  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgClassId, setAsgClassId] = useState('');
  const [asgDue, setAsgDue] = useState('');

  const [examId, setExamId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [marksRows, setMarksRows] = useState<SubjectMark[]>([
    { subjectName: 'বাংলা', obtainedMarks: 78, fullMarks: 100, passMarks: 33 },
    { subjectName: 'English', obtainedMarks: 82, fullMarks: 100, passMarks: 33 },
  ]);

  const autoCalc = useMemo(
    () =>
      calculateMarksheetTotals(
        marksRows,
        settings.gradingRules || DEFAULT_GRADING_RULES,
        settings.passPercentage ?? 33
      ),
    [marksRows, settings]
  );

  const tabs: NavTab[] = [
    { id: 'overview', label: lang === 'bn' ? 'ড্যাশবোর্ড ও প্রোফাইল' : 'Dashboard & Profile', icon: LayoutDashboard },
    { id: 'live', label: lang === 'bn' ? 'লাইভ ও ভিডিও ক্লাস' : 'Live & Recorded', icon: Video },
    { id: 'library', label: lang === 'bn' ? 'স্টাডি ম্যাটেরিয়াল' : 'Study Library', icon: Library },
    { id: 'assignments', label: lang === 'bn' ? 'অ্যাসাইনমেন্ট' : 'Assignments', icon: ClipboardList },
    { id: 'marks', label: lang === 'bn' ? 'নম্বর জমা দিন' : 'Submit Marks', icon: FileSpreadsheet },
    { id: 'attendance', label: lang === 'bn' ? 'উপস্থিতি নিন' : 'Take Attendance', icon: CalendarCheck },
    { id: 'messages', label: lang === 'bn' ? 'নোটিফিকেশন ও বার্তা' : 'Notifications', icon: Bell },
  ];

  if (profile.status !== 'active') {
    return (
      <DashboardShell
        profile={profile}
        settings={settings}
        tabs={[tabs[0]]}
        activeTab="overview"
        onSelectTab={() => {}}
        lang={lang}
        onToggleLang={onToggleLang}
        onBackHome={onBackHome}
        onSignOut={onSignOut}
      >
        <div className="max-w-xl mx-auto rounded-2xl bg-white border border-amber-200 p-8 text-center">
          <Clock className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Teacher Account Pending Approval</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your teacher profile ({profile.email}) is currently <strong>{profile.status}</strong>.
            Once approved by the Super Admin, all class, attendance, live session, and marks submission tools unlock automatically.
          </p>
        </div>
      </DashboardShell>
    );
  }

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
      {banner && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{banner}</span>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Assigned Students</div>
              <div className="text-2xl font-extrabold text-[#123466] font-mono-num mt-1">
                {students.length}
              </div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Active Courses</div>
              <div className="text-2xl font-extrabold text-[#123466] font-mono-num mt-1">
                {courses.length}
              </div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Scheduled Live Classes</div>
              <div className="text-2xl font-extrabold text-[#123466] font-mono-num mt-1">
                {liveClasses.length}
              </div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Pending Submissions</div>
              <div className="text-2xl font-extrabold text-amber-600 font-mono-num mt-1">
                {submissions.filter((s) => s.status === 'submitted').length}
              </div>
            </div>
          </div>

          {teacherDoc && (
            <DigitalIdCard
              type="teacher"
              teacher={teacherDoc}
              settings={settings}
              lang={lang}
            />
          )}
        </div>
      )}

      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const cls = classes.find((c) => c.id === lcClassId);
              await createDocument('liveClasses', {
                title: clampStr(lcTitle, 140),
                classId: cls?.id,
                className: cls?.name || 'All Classes',
                teacherUid: auth.currentUser?.uid || profile.uid,
                teacherName: teacherDisplayName,
                scheduledAt: clampStr(lcSchedule, 50),
                durationMinutes: 45,
                provider: lcProvider,
                meetingUrl: clampStr(lcUrl, 500),
                status: 'scheduled',
              });
              setLcTitle('');
              notify('Live class scheduled!');
            }}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">Schedule Live Class</h3>
            <input
              required
              placeholder="Live Session Title"
              value={lcTitle}
              onChange={(e) => setLcTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={lcClassId}
                onChange={(e) => setLcClassId(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={lcProvider}
                onChange={(e) =>
                  setLcProvider(
                    e.target.value as 'Zoom' | 'Google Meet' | 'Jitsi' | 'YouTube Live'
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="Jitsi">Jitsi Meet</option>
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="YouTube Live">YouTube Live</option>
              </select>
            </div>
            <input
              required
              placeholder="Schedule (e.g. Mon 08:30 AM)"
              value={lcSchedule}
              onChange={(e) => setLcSchedule(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              required
              type="url"
              placeholder="Approved Meeting Link (https://...)"
              value={lcUrl}
              onChange={(e) => setLcUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold"
            >
              Publish Live Schedule
            </button>
          </form>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createDocument('lessons', {
                title: clampStr(lesTitle, 140),
                category: clampStr(lesCategory, 80),
                teacherUid: auth.currentUser?.uid || profile.uid,
                teacherName: teacherDisplayName,
                videoUrl: clampStr(lesUrl, 500),
                duration: clampStr(lesDuration, 30),
                completedByUids: [],
              });
              setLesTitle('');
              setLesUrl('');
              notify('Recorded video lesson added!');
            }}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">Upload Recorded Video Lesson</h3>
            <input
              required
              placeholder="Lesson Title"
              value={lesTitle}
              onChange={(e) => setLesTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="Category"
                value={lesCategory}
                onChange={(e) => setLesCategory(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Duration (e.g. 25 min)"
                value={lesDuration}
                onChange={(e) => setLesDuration(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <input
              required
              type="url"
              placeholder="Video URL (YouTube / Drive / Vimeo)"
              value={lesUrl}
              onChange={(e) => setLesUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold"
            >
              Add Video Lesson ({lessons.length})
            </button>
          </form>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createDocument('studyMaterials', {
                title: clampStr(matTitle, 140),
                type: matType,
                category: clampStr(matCat, 80),
                resourceUrl: clampStr(matUrl, 500),
                downloadAllowed: true,
                uploadedByUid: auth.currentUser?.uid || profile.uid,
              });
              setMatTitle('');
              setMatUrl('');
              notify('Study material uploaded to Digital Library.');
            }}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">Upload PDF / Study Material</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                required
                placeholder="Material Title"
                value={matTitle}
                onChange={(e) => setMatTitle(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={matType}
                onChange={(e) => setMatType(e.target.value as 'pdf' | 'notes' | 'audio' | 'video')}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="pdf">PDF Book / Sheet</option>
                <option value="notes">Study Notes</option>
                <option value="audio">Audio Recitation</option>
                <option value="video">Video</option>
              </select>
              <input
                required
                placeholder="Subject / Category"
                value={matCat}
                onChange={(e) => setMatCat(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                type="url"
                placeholder="Resource URL"
                value={matUrl}
                onChange={(e) => setMatUrl(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold"
            >
              Publish to Digital Library ({materials.length})
            </button>
          </form>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const cls = classes.find((c) => c.id === asgClassId) || classes[0];
              if (!cls?.id) return notify('No class available.');
              await createDocument('assignments', {
                title: clampStr(asgTitle, 140),
                description: clampStr(asgDesc, 1500),
                classId: cls.id,
                className: cls.name,
                teacherUid: auth.currentUser?.uid || profile.uid,
                teacherName: teacherDisplayName,
                dueDate: asgDue || '2026-12-01',
                maxMarks: 100,
              });
              setAsgTitle('');
              setAsgDesc('');
              notify('Assignment created.');
            }}
            className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900">Create Assignment ({assignments.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                required
                placeholder="Assignment Title"
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={asgClassId}
                onChange={(e) => setAsgClassId(e.target.value)}
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
                type="date"
                value={asgDue}
                onChange={(e) => setAsgDue(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              required
              rows={2}
              placeholder="Assignment instructions..."
              value={asgDesc}
              onChange={(e) => setAsgDesc(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold"
            >
              Publish Assignment
            </button>
          </form>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Review Student Submissions</h3>
            {submissions.length === 0 ? (
              <p className="text-xs text-slate-500">No submissions yet.</p>
            ) : (
              submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {sub.studentName} · {sub.targetTitle}
                    </div>
                    <div className="text-slate-600 mt-0.5">{sub.content}</div>
                    <div className="text-slate-500 mt-1">
                      Status: <strong className="uppercase">{sub.status}</strong>
                      {typeof sub.score === 'number' && ` · Score: ${sub.score}/${sub.maxScore || 100}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateDocument('submissions', sub.id!, {
                        score: 90,
                        maxScore: 100,
                        status: 'graded',
                        feedback: 'Well structured submission.',
                      })
                    }
                    className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 font-semibold"
                  >
                    Mark 90/100 Graded
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'marks' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Submit Examination Marks (Requires Admin Approval to Publish)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
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
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">Select Student</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.admissionNo})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {marksRows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  value={row.subjectName}
                  onChange={(e) => {
                    const next = [...marksRows];
                    next[i] = { ...next[i], subjectName: e.target.value };
                    setMarksRows(next);
                  }}
                  placeholder="Subject"
                  className="col-span-5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                />
                <input
                  type="number"
                  value={row.obtainedMarks}
                  onChange={(e) => {
                    const next = [...marksRows];
                    next[i] = { ...next[i], obtainedMarks: Number(e.target.value) };
                    setMarksRows(next);
                  }}
                  className="col-span-3 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono-num"
                />
                <input
                  type="number"
                  value={row.fullMarks}
                  onChange={(e) => {
                    const next = [...marksRows];
                    next[i] = { ...next[i], fullMarks: Number(e.target.value) };
                    setMarksRows(next);
                  }}
                  className="col-span-3 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono-num"
                />
                <button
                  type="button"
                  onClick={() => setMarksRows(marksRows.filter((_, idx) => idx !== i))}
                  className="col-span-1 text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setMarksRows([
                  ...marksRows,
                  { subjectName: '', obtainedMarks: 0, fullMarks: 100, passMarks: 33 },
                ])
              }
              className="text-xs font-semibold text-[#123466] hover:underline"
            >
              + Add Subject
            </button>
          </div>

          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            Calculated: <strong>{autoCalc.totalObtained}/{autoCalc.totalFull}</strong> ({autoCalc.percentage}%) · Grade <strong>{autoCalc.grade}</strong>
          </div>

          <button
            type="button"
            onClick={async () => {
              const ex = exams.find((x) => x.id === examId) || exams[0];
              const st = students.find((x) => x.id === studentId);
              if (!ex || !st) return notify('Select exam and student.');
              await createDocument('results', {
                examId: ex.id!,
                examTitle: ex.title,
                session: ex.session,
                classId: st.classId,
                className: st.className,
                studentId: st.id!,
                studentUid: st.userId,
                parentUserIds: st.parentUserIds || [],
                admissionNo: st.admissionNo,
                rollNo: st.rollNo,
                studentName: st.fullName,
                fatherName: st.fatherName,
                photoUrl: st.cloudinaryImageUrl || st.photoUrl,
                cloudinaryImageUrl: st.cloudinaryImageUrl || st.photoUrl,
                cloudinaryPublicId: st.cloudinaryPublicId,
                uploadedAt: st.uploadedAt,
                subjects: autoCalc.subjects,
                totalObtained: autoCalc.totalObtained,
                totalFull: autoCalc.totalFull,
                percentage: autoCalc.percentage,
                grade: autoCalc.grade,
                passed: autoCalc.passed,
                performanceRemark: autoCalc.performanceRemark,
                teacherRemarks: 'Submitted by Subject/Class Teacher',
                classTeacherName: teacherDisplayName,
                submittedByUid: auth.currentUser?.uid || profile.uid,
                approvalStatus: 'submitted',
              });
              await logAudit('SUBMIT_MARKS', 'results', `Submitted marks for ${st.fullName}`, st.id, 'teacher');
              notify('Marks submitted for Admin review and official publication.');
            }}
            className="rounded-lg bg-[#123466] text-white px-5 py-2.5 text-xs font-semibold"
          >
            Submit Marks for Approval
          </button>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                <th className="p-3">Roll</th>
                <th className="p-3">Student</th>
                <th className="p-3">Class</th>
                <th className="p-3 text-right">Today ({new Date().toISOString().slice(0, 10)})</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id} className="border-b border-slate-100">
                  <td className="p-3 font-mono-num">{st.rollNo}</td>
                  <td className="p-3 font-semibold">{st.fullName}</td>
                  <td className="p-3">{st.className}</td>
                  <td className="p-3 text-right space-x-1.5">
                    {(['present', 'absent', 'late'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={async () => {
                          await createDocument('attendance', {
                            date: new Date().toISOString().slice(0, 10),
                            classId: st.classId,
                            className: st.className,
                            studentId: st.id!,
                            studentUid: st.userId,
                            parentUserIds: st.parentUserIds || [],
                            studentName: st.fullName,
                            rollNo: st.rollNo,
                            status,
                            markedByUid: auth.currentUser?.uid || profile.uid,
                          });
                          notify(`Marked ${st.fullName}: ${status}`);
                        }}
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
      )}

      {activeTab === 'messages' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Teacher Notifications Inbox</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500">No notifications received yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                <div className="font-bold text-slate-900">{n.title}</div>
                <div className="text-slate-600 mt-0.5">{n.message}</div>
                <div className="text-[11px] text-slate-400 mt-1">From: {n.senderName}</div>
              </div>
            ))
          )}
        </div>
      )}
    </DashboardShell>
  );
};
