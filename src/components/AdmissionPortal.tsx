import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, Lock, Send } from 'lucide-react';
import { User } from 'firebase/auth';
import { where } from 'firebase/firestore';
import { AdmissionApplication, ClassBatch, Language, SiteSettings } from '../types/madrasa';
import { clampStr, createDocument, subscribeCollection } from '../services/firestoreService';
import { sanitizePersistedPhotoUrl } from '../services/cloudinaryService';
import { ImageUploader } from './ImageUploader';
import { IslamicPatternBackground } from './IslamicGraphics';

interface AdmissionPortalProps {
  user: User | null;
  classes: ClassBatch[];
  settings: SiteSettings;
  lang: Language;
  onBackHome: () => void;
  onRequestAuth: () => void;
}

export const AdmissionPortal: React.FC<AdmissionPortalProps> = ({
  user,
  classes,
  settings,
  lang,
  onBackHome,
  onRequestAuth,
}) => {
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [address, setAddress] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [previousEducation, setPreviousEducation] = useState('');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [session, setSession] = useState('2026');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPublicId, setPhotoPublicId] = useState('');
  const [photoUploadedAt, setPhotoUploadedAt] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [documentsNote, setDocumentsNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedAppNo, setSubmittedAppNo] = useState<string | null>(null);
  const [myApps, setMyApps] = useState<AdmissionApplication[]>([]);

  useEffect(() => {
    if (!classId && classes.length > 0 && classes[0].id) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      setMyApps([]);
      return;
    }
    const unsub = subscribeCollection<AdmissionApplication>(
      'admissions',
      setMyApps,
      [where('submittedByUid', '==', user.uid)]
    );
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.emailVerified) {
      onRequestAuth();
      return;
    }
    if (photoUploading || submitting) return;
    setError(null);
    const selectedClass = classes.find((c) => c.id === classId);
    if (!selectedClass) {
      setError('Please select a target class.');
      return;
    }

    setSubmitting(true);
    try {
      const appNo = `MDSM-${session}-${Math.floor(1000 + Math.random() * 9000)}`;
      const safePhoto = sanitizePersistedPhotoUrl(photoUrl);
      await createDocument('admissions', {
        applicationNo: appNo,
        studentName: clampStr(studentName, 120),
        fatherName: clampStr(fatherName, 120),
        motherName: clampStr(motherName, 120),
        dob: clampStr(dob, 30),
        gender,
        address: clampStr(address, 300),
        guardianContact: clampStr(guardianContact, 32),
        previousEducation: clampStr(previousEducation, 200) || undefined,
        classId: selectedClass.id,
        className: selectedClass.name,
        session: clampStr(session, 30),
        photoUrl: safePhoto || undefined,
        cloudinaryImageUrl: safePhoto || undefined,
        cloudinaryPublicId: clampStr(photoPublicId, 240) || undefined,
        uploadedAt: clampStr(photoUploadedAt, 60) || undefined,
        documentsNote: clampStr(documentsNote, 500) || undefined,
        status: 'pending',
        submittedByUid: user.uid,
      });
      setSubmittedAppNo(appNo);
      setStudentName('');
      setFatherName('');
      setMotherName('');
      setDob('');
      setAddress('');
      setGuardianContact('');
      setPreviousEducation('');
      setPhotoUrl('');
      setPhotoPublicId('');
      setPhotoUploadedAt('');
      setDocumentsNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      <div className="relative overflow-hidden bg-[#061224] text-white py-10 px-4 sm:px-6 border-b border-[#D4AF37]/40">
        <IslamicPatternBackground opacity={0.08} />
        <div className="relative z-10 max-w-5xl mx-auto">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#F2D06B] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Homepage'}
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {lang === 'bn' ? 'অনলাইন ভর্তি আবেদন ফরম' : 'Online Admission Portal'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl">
            {lang === 'bn' && settings.admissionBannerTextBn
              ? settings.admissionBannerTextBn
              : settings.admissionBannerText}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {!user || !user.emailVerified ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#123466]/10 text-[#123466] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'bn'
                  ? 'আবেদন জমা দিতে আপনার অ্যাকাউন্টে সাইন-ইন করুন'
                  : 'Verified Sign-In Required to Submit Admission'}
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                {lang === 'bn'
                  ? 'আবেদন নম্বর সংরক্ষণ এবং ভর্তির অবস্থা লাইভ ট্র্যাক করতে গুগল বা ইমেইল দিয়ে লগইন করুন।'
                  : 'Sign in with Google or a verified email account so you can track your application number and receive your Student ID upon approval.'}
              </p>
              <button
                type="button"
                onClick={onRequestAuth}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#123466] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#19478A] transition-colors"
              >
                {lang === 'bn' ? 'লগইন / নিবন্ধন করুন' : 'Sign In / Register to Apply'}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5"
            >
              {submittedAppNo && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      Application Submitted Successfully
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Your Application Number is{' '}
                      <strong className="font-mono-num">{submittedAppNo}</strong>. Track review status on the right panel.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father&apos;s Name *
                  </label>
                  <input
                    required
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mother&apos;s Name *
                  </label>
                  <input
                    required
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    required
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="male">Male (ছাত্র)</option>
                    <option value="female">Female (ছাত্রী)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Contact Phone *
                  </label>
                  <input
                    required
                    value={guardianContact}
                    onChange={(e) => setGuardianContact(e.target.value)}
                    placeholder="+8801..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class / Program Selection *
                  </label>
                  <select
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.session})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Session *</label>
                  <input
                    required
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address *
                </label>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Previous Education / Madrasah
                </label>
                <input
                  value={previousEducation}
                  onChange={(e) => setPreviousEducation(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <ImageUploader
                folder="admissions"
                label="Student Photo / ছাত্রের ছবি"
                value={photoUrl}
                publicId={photoPublicId}
                onChange={setPhotoUrl}
                onUploadedAsset={(asset) => {
                  setPhotoPublicId(asset?.cloudinaryPublicId || '');
                  setPhotoUploadedAt(asset?.uploadedAt || '');
                }}
                onUploadingChange={setPhotoUploading}
                lang={lang}
                disabled={submitting}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Documents Reference (Birth Certificate / Transfer Note)
                </label>
                <textarea
                  rows={2}
                  value={documentsNote}
                  onChange={(e) => setDocumentsNote(e.target.value)}
                  placeholder="Provide birth registration number or document links..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={photoUploading || submitting || classes.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4 text-[#F2D06B]" />
                {photoUploading
                  ? 'Waiting for Photo Upload...'
                  : submitting
                    ? 'Submitting Application...'
                    : 'Submit Admission Application'}
              </button>
            </form>
          )}
        </div>

        {/* Track Submitted Applications */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="w-5 h-5 text-[#123466]" />
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'bn' ? 'আপনার আবেদনসমূহ' : 'Your Submitted Applications'}
              </h3>
            </div>
            {myApps.length === 0 ? (
              <p className="text-xs text-slate-500">
                {user
                  ? 'No admission applications submitted from your account yet.'
                  : 'Sign in to view your submitted admission applications.'}
              </p>
            ) : (
              <div className="space-y-3">
                {myApps.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-num font-bold text-[#123466]">
                        {app.applicationNo}
                      </span>
                      <span
                        className={`font-bold uppercase ${
                          app.status === 'approved'
                            ? 'text-emerald-700'
                            : app.status === 'rejected'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900">{app.studentName}</div>
                    <div className="text-slate-600">
                      Class: {app.className} · Session {app.session}
                    </div>
                    {app.generatedStudentId && (
                      <div className="text-emerald-800 font-semibold pt-1">
                        Admission ID: <span className="font-mono-num">{app.generatedStudentId}</span>
                      </div>
                    )}
                    {app.reviewNote && (
                      <div className="text-slate-600 italic">Note: {app.reviewNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#071426] text-white border border-[#D4AF37]/40 p-5">
            <div className="flex items-center gap-2 text-[#F2D06B] text-sm font-bold mb-2">
              <FileText className="w-4 h-4" />
              <span>Required Documents</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Student Birth Certificate copy</li>
              <li>2 Passport-size photographs</li>
              <li>Guardian NID &amp; active phone number</li>
              <li>Previous academic transfer certificate (if applicable)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
