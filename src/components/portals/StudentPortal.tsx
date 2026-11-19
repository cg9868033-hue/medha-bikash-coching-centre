import React, { useEffect, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  Library,
  Video,
} from 'lucide-react';
import { where } from 'firebase/firestore';
import { auth } from '../../firebase';
import {
  AssignmentRecord,
  AttendanceRecord,
  CertificateRecord,
  Course,
  Examination,
  FeeRecord,
  Language,
  LessonRecord,
  LiveClassRecord,
  NotificationRecord,
  ResultRecord,
  SiteSettings,
  StudentRecord,
  StudyMaterialRecord,
  SubmissionRecord,
  UserProfile,
} from '../../types/madrasa';
import {
  clampStr,
  createDocument,
  resolveUserDisplayName,
  subscribeCollection,
  updateDocument,
} from '../../services/firestoreService';
import { DashboardShell, NavTab } from '../DashboardShell';
import { CertificateCard, DigitalIdCard } from '../DigitalIdAndCertificate';
import { ScholarAvatar } from '../IslamicGraphics';
import { MarksheetCard } from '../MarksheetCard';

interface StudentPortalProps {
  profile: UserProfile;
  settings: SiteSettings;
  lang: Language;
  onToggleLang: () => void;
  onBackHome: () => void;
  onSignOut: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  profile,
  settings,
  lang,
  onToggleLang,
  onBackHome,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [studentDoc, setStudentDoc] = useState<StudentRecord | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassRecord[]>([]);
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [materials, setMaterials] = useState<StudyMaterialRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [submissionText, setSubmissionText] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const uid = auth.currentUser?.uid || profile.uid;
  const safeDisplayName = resolveUserDisplayName(profile.displayName, profile.email, profile.role);

  useEffect(() => {
    const unsubs = [
      subscribeCollection<StudentRecord>('students', (list) => setStudentDoc(list[0] || null), [
        where('userId', '==', uid),
      ]),
      subscribeCollection<Course>('courses', setCourses, [where('status', '==', 'active')]),
      subscribeCollection<LiveClassRecord>('liveClasses', setLiveClasses, [
        where('status', 'in', ['scheduled', 'live', 'completed']),
      ]),
      subscribeCollection<LessonRecord>('lessons', setLessons, [where('title', '!=', '')]),
      subscribeCollection<StudyMaterialRecord>('studyMaterials', setMaterials, [
        where('title', '!=', ''),
      ]),
      subscribeCollection<AssignmentRecord>('assignments', setAssignments, [
        where('title', '!=', ''),
      ]),
      subscribeCollection<SubmissionRecord>('submissions', setSubmissions, [
        where('studentUid', '==', uid),
      ]),
      subscribeCollection<Examination>('examinations', setExams, [
        where('status', 'in', ['active', 'completed', 'published']),
      ]),
      subscribeCollection<ResultRecord>('results', setResults, [where('studentUid', '==', uid)]),
      subscribeCollection<AttendanceRecord>('attendance', setAttendance, [
        where('studentUid', '==', uid),
      ]),
      subscribeCollection<CertificateRecord>('certificates', setCertificates, [
        where('studentUid', '==', uid),
      ]),
      subscribeCollection<FeeRecord>('feeRecords', setFees, [where('studentUid', '==', uid)]),
      subscribeCollection<NotificationRecord>('notifications', setNotifications, [
        where('recipientUid', '==', uid),
      ]),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const notify = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 4000);
  };

  const completedLessonsCount = lessons.filter((l) => (l.completedByUids || []).includes(uid)).length;
  const progressPct =
    lessons.length > 0 ? Math.round((completedLessonsCount / lessons.length) * 100) : 0;

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const attPct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

  const tabs: NavTab[] = [
    { id: 'overview', label: lang === 'bn' ? 'প্রোফাইল ও আইডি' : 'Profile & ID Card', icon: LayoutDashboard },
    { id: 'learning', label: lang === 'bn' ? 'কোর্স ও ভিডিও ক্লাস' : 'Courses & Lessons', icon: Video },
    { id: 'assignments', label: lang === 'bn' ? 'অ্যাসাইনমেন্ট ও পরীক্ষা' : 'Assignments & Exams', icon: ClipboardList },
    { id: 'results', label: lang === 'bn' ? 'ফলাফল ও মার্কশিট' : 'Results & Marksheet', icon: FileSpreadsheet },
    { id: 'attendance', label: lang === 'bn' ? 'উপস্থিতি' : 'Attendance', icon: CalendarCheck },
    { id: 'library', label: lang === 'bn' ? 'ডিজিটাল লাইব্রেরি' : 'Digital Library', icon: Library },
    { id: 'certificates', label: lang === 'bn' ? 'সনদ ও ফি' : 'Certificates & Fees', icon: Award },
    { id: 'notifications', label: lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications', icon: Bell },
  ];

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
              <div className="text-xs text-slate-500">Learning Progress</div>
              <div className="text-2xl font-extrabold text-[#123466] font-mono-num mt-1">
                {progressPct}%
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37]" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Attendance Rate</div>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono-num mt-1">
                {attPct}%
              </div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Published Results</div>
              <div className="text-2xl font-extrabold text-[#123466] font-mono-num mt-1">
                {results.filter((r) => r.approvalStatus === 'published').length}
              </div>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Certificates Earned</div>
              <div className="text-2xl font-extrabold text-[#B8860B] font-mono-num mt-1">
                {certificates.length}
              </div>
            </div>
          </div>

          {studentDoc ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <ScholarAvatar
                    photoUrl={studentDoc.cloudinaryImageUrl || studentDoc.photoUrl}
                    name={studentDoc.fullName}
                    className="w-20 h-24"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#B8860B]">
                      {lang === 'bn' ? 'শিক্ষার্থীর প্রোফাইল' : 'Student Profile'}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5 truncate">
                      {studentDoc.fullName}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {lang === 'bn' ? 'ভর্তি নং:' : 'Admission No:'}{' '}
                      <strong className="font-mono-num text-[#123466]">{studentDoc.admissionNo}</strong>
                      {' · '}
                      {lang === 'bn' ? 'রোল:' : 'Roll:'}{' '}
                      <strong className="font-mono-num text-[#123466]">{studentDoc.rollNo}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-slate-500">Father&apos;s Name</div>
                    <div className="font-bold text-slate-900 mt-0.5">{studentDoc.fatherName}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-slate-500">Class &amp; Session</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {studentDoc.className} ({studentDoc.session})
                    </div>
                  </div>
                  {studentDoc.guardianPhone && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="text-slate-500">Guardian Contact</div>
                      <div className="font-bold text-slate-900 font-mono-num mt-0.5">
                        {studentDoc.guardianPhone}
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-slate-500">Enrollment Status</div>
                    <div className="font-bold text-emerald-700 uppercase mt-0.5">
                      {studentDoc.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <DigitalIdCard type="student" student={studentDoc} settings={settings} lang={lang} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-600">
              Your user account (UID: <span className="font-mono-num">{uid}</span>) is active. Ask your Madrasah Admin to link your User UID to your enrolled Student Record to unlock your Student Digital ID Card and personal marksheets.
            </div>
          )}
        </div>
      )}

      {activeTab === 'learning' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Live Class Timetable</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveClasses.map((lc) => (
                <div key={lc.id} className="rounded-xl border border-slate-200 p-4 flex justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{lc.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {lc.scheduledAt} · {lc.provider} · {lc.teacherName}
                    </div>
                  </div>
                  <a
                    href={lc.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-[#123466] text-white px-3.5 py-2 text-xs font-semibold h-fit"
                  >
                    Join
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Recorded Video Lessons</h3>
            <div className="space-y-3">
              {lessons.map((les) => {
                const done = (les.completedByUids || []).includes(uid);
                return (
                  <div key={les.id} className="rounded-xl border border-slate-200 p-4 flex flex-wrap justify-between gap-3 items-center">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{les.title}</div>
                      <div className="text-xs text-slate-500">
                        {les.category} · {les.duration || 'Lesson'} · {les.teacherName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={les.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                      >
                        Watch Video
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          const existing = les.completedByUids || [];
                          const next = done
                            ? existing.filter((u) => u !== uid)
                            : [...existing, uid];
                          await updateDocument('lessons', les.id!, { completedByUids: next });
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          done
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {done ? 'Completed' : 'Mark Complete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Assignments</h3>
            {assignments.map((asg) => {
              const existingSub = submissions.find((s) => s.targetId === asg.id);
              return (
                <div key={asg.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{asg.title}</div>
                    <div className="text-xs text-slate-600 mt-1">{asg.description}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Due: {asg.dueDate} · Max Marks: {asg.maxMarks}
                    </div>
                  </div>
                  {existingSub ? (
                    <div className="text-xs text-emerald-700 font-semibold">
                      Submitted ({existingSub.status})
                      {typeof existingSub.score === 'number' && ` · Score: ${existingSub.score}`}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        placeholder="Write your assignment response or link..."
                        value={submissionText[asg.id!] || ''}
                        onChange={(e) =>
                          setSubmissionText({ ...submissionText, [asg.id!]: e.target.value })
                        }
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await createDocument('submissions', {
                            targetType: 'assignment',
                            targetId: asg.id!,
                            targetTitle: asg.title,
                            studentUid: uid,
                            studentId: studentDoc?.id,
                            studentName: studentDoc?.fullName || safeDisplayName,
                            content: clampStr(submissionText[asg.id!] || '', 4000),
                            status: 'submitted',
                          });
                          notify('Assignment submitted!');
                        }}
                        className="rounded-lg bg-[#123466] text-white px-4 py-1.5 text-xs font-semibold"
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Active Examinations ({exams.length})</h3>
            <div className="space-y-2 text-xs">
              {exams.map((ex) => (
                <div key={ex.id} className="rounded-lg border border-slate-200 p-3 flex justify-between">
                  <span className="font-bold">{ex.title}</span>
                  <span className="text-slate-500 uppercase">
                    {ex.examType} · {ex.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-6">
          {results.filter((r) => r.approvalStatus === 'published').length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
              No published marksheets linked to your student account yet. You can also search with Admission No. in the Public Result Lookup.
            </div>
          ) : (
            results
              .filter((r) => r.approvalStatus === 'published')
              .map((res) => (
                <MarksheetCard key={res.id} result={res} settings={settings} lang={lang} />
              ))
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                <th className="p-3">Date</th>
                <th className="p-3">Class</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="p-3 font-mono-num">{a.date}</td>
                  <td className="p-3">{a.className}</td>
                  <td className="p-3 uppercase font-bold">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((m) => (
            <div key={m.id} className="rounded-xl bg-white border border-slate-200 p-4 flex justify-between items-center gap-3">
              <div>
                <div className="font-bold text-sm text-slate-900">{m.title}</div>
                <div className="text-xs text-slate-500 uppercase">
                  {m.type} · {m.category}
                </div>
              </div>
              <a
                href={m.resourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-[#123466] text-white px-3.5 py-1.5 text-xs font-semibold"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} settings={settings} lang={lang} />
          ))}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#123466]" />
              Fee &amp; Payment History
            </h3>
            {fees.length === 0 ? (
              <p className="text-xs text-slate-500">No fee records found.</p>
            ) : (
              fees.map((f) => (
                <div key={f.id} className="rounded-lg border border-slate-200 p-3 text-xs flex justify-between">
                  <span>
                    {f.receiptNo} · {f.category}
                  </span>
                  <span className="font-mono-num font-bold">
                    Paid ৳{f.paidAmount} / ৳{f.amount} ({f.status})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                <div className="font-bold">{n.title}</div>
                <div className="text-slate-600 mt-0.5">{n.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </DashboardShell>
  );
};
