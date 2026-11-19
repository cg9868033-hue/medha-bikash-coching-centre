import React, { useEffect, useState } from 'react';
import {
  Bell,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  MessageSquare,
  Users,
} from 'lucide-react';
import { where } from 'firebase/firestore';
import { auth } from '../../firebase';
import {
  AttendanceRecord,
  FeeRecord,
  Language,
  NoticeRecord,
  NotificationRecord,
  ResultRecord,
  SiteSettings,
  StudentRecord,
  UserProfile,
} from '../../types/madrasa';
import { subscribeCollection } from '../../services/firestoreService';
import { DashboardShell, NavTab } from '../DashboardShell';
import { ScholarAvatar } from '../IslamicGraphics';
import { MarksheetCard } from '../MarksheetCard';

interface ParentPortalProps {
  profile: UserProfile;
  settings: SiteSettings;
  lang: Language;
  onToggleLang: () => void;
  onBackHome: () => void;
  onSignOut: () => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  profile,
  settings,
  lang,
  onToggleLang,
  onBackHome,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [linkedStudents, setLinkedStudents] = useState<StudentRecord[]>([]);
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const uid = auth.currentUser?.uid || profile.uid;

  useEffect(() => {
    const unsubs = [
      subscribeCollection<StudentRecord>('students', setLinkedStudents, [
        where('parentUserIds', 'array-contains', uid),
      ]),
      subscribeCollection<ResultRecord>('results', setResults, [
        where('parentUserIds', 'array-contains', uid),
      ]),
      subscribeCollection<AttendanceRecord>('attendance', setAttendance, [
        where('parentUserIds', 'array-contains', uid),
      ]),
      subscribeCollection<FeeRecord>('feeRecords', setFees, [
        where('parentUserIds', 'array-contains', uid),
      ]),
      subscribeCollection<NoticeRecord>('notices', setNotices, [where('published', '==', true)]),
      subscribeCollection<NotificationRecord>('notifications', setNotifications, [
        where('recipientUid', '==', uid),
      ]),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  const tabs: NavTab[] = [
    { id: 'overview', label: lang === 'bn' ? 'সন্তানদের প্রোফাইল' : 'Linked Students', icon: LayoutDashboard },
    { id: 'results', label: lang === 'bn' ? 'পরীক্ষার ফলাফল' : 'Exam Results', icon: FileSpreadsheet },
    { id: 'attendance', label: lang === 'bn' ? 'উপস্থিতি রিপোর্ট' : 'Attendance Reports', icon: CalendarCheck },
    { id: 'fees', label: lang === 'bn' ? 'বেতন ও ফি' : 'Fee Records', icon: CreditCard },
    { id: 'notices', label: lang === 'bn' ? 'নোটিশ ও বার্তা' : 'Notices & Alerts', icon: Bell },
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#123466]" />
              Officially Linked Student Profiles ({linkedStudents.length})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Your Parent UID for Admin linking: <code className="font-mono-num bg-slate-100 px-2 py-0.5 rounded">{uid}</code>
            </p>
            {linkedStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                No students are linked to your parent account yet. Share your Parent UID above with the Madrasah Admin to securely link your child&apos;s profile.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedStudents.map((st) => (
                  <div key={st.id} className="rounded-xl border border-slate-200 p-4 flex items-center gap-3.5 text-xs">
                    <ScholarAvatar
                      photoUrl={st.cloudinaryImageUrl || st.photoUrl}
                      name={st.fullName}
                      className="w-14 h-16 text-sm"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{st.fullName}</div>
                      <div>
                        Admission No: <strong className="font-mono-num">{st.admissionNo}</strong> · Roll:{' '}
                        <strong className="font-mono-num">{st.rollNo}</strong>
                      </div>
                      <div>
                        Class: <strong>{st.className}</strong> · Session {st.session}
                      </div>
                      <div className="text-emerald-700 font-semibold uppercase">{st.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-6">
          {results.filter((r) => r.approvalStatus === 'published').length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-500">
              No published results found for linked students.
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
                <th className="p-3">Student</th>
                <th className="p-3">Class</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="p-3 font-mono-num">{a.date}</td>
                  <td className="p-3 font-semibold">{a.studentName}</td>
                  <td className="p-3">{a.className}</td>
                  <td className="p-3 uppercase font-bold">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                <th className="p-3">Receipt</th>
                <th className="p-3">Student</th>
                <th className="p-3">Category</th>
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
                  <td className="p-3 font-mono-num text-emerald-700">৳{f.paidAmount}</td>
                  <td className="p-3 font-mono-num text-rose-700">৳{f.dueAmount}</td>
                  <td className="p-3 uppercase font-bold">{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Madrasah Notices</h3>
            {notices.map((n) => (
              <div key={n.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                <div className="font-bold text-slate-900">{n.title}</div>
                <div className="text-slate-600 mt-1">{n.content}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#123466]" />
              Notifications
            </h3>
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500">No direct messages yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                  <div className="font-bold">{n.title}</div>
                  <div className="text-slate-600">{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
};
