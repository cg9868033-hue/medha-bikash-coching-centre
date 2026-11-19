import React, { useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Award, CheckCircle2, FileSearch, Search, ShieldCheck } from 'lucide-react';
import {
  CertificateRecord,
  ClassBatch,
  Examination,
  Language,
  ResultRecord,
  SiteSettings,
} from '../types/madrasa';
import { t } from '../i18n/translations';
import { lookupPublishedResults, verifyCertificateByNumber } from '../services/firestoreService';
import { CertificateCard } from './DigitalIdAndCertificate';
import { MarksheetCard } from './MarksheetCard';
import { IslamicPatternBackground } from './IslamicGraphics';

interface ResultLookupPageProps {
  settings: SiteSettings;
  classes: ClassBatch[];
  exams: Examination[];
  lang: Language;
  onBackHome: () => void;
}

export const ResultLookupPage: React.FC<ResultLookupPageProps> = ({
  settings,
  classes,
  exams,
  lang,
  onBackHome,
}) => {
  const [mode, setMode] = useState<'result' | 'certificate'>('result');
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classId, setClassId] = useState('');
  const [session, setSession] = useState('2026');
  const [examId, setExamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRecord[] | null>(null);

  const [certNo, setCertNo] = useState('');
  const [certResult, setCertResult] = useState<CertificateRecord | null | undefined>(undefined);

  // Client-side rate limiter (max 12 searches per minute)
  const searchTimestampsRef = useRef<number[]>([]);

  const checkRateLimit = () => {
    const now = Date.now();
    searchTimestampsRef.current = searchTimestampsRef.current.filter((ts) => now - ts < 60000);
    if (searchTimestampsRef.current.length >= 12) {
      return false;
    }
    searchTimestampsRef.current.push(now);
    return true;
  };

  const handleSearchResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!admissionNo.trim() && !rollNo.trim()) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে ভর্তি নম্বর অথবা রোল নম্বর লিখুন।'
          : 'Please enter at least an Admission Number or Roll Number.'
      );
      return;
    }

    if (!checkRateLimit()) {
      setErrorMsg('Too many lookup attempts. Please wait a minute before searching again.');
      return;
    }

    setLoading(true);
    try {
      const found = await lookupPublishedResults({
        admissionNo,
        rollNo,
        classId: classId || undefined,
        session: session || undefined,
        examId: examId || undefined,
      });
      setResults(found);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to search published results.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!certNo.trim()) {
      setErrorMsg('Please enter a certificate verification number.');
      return;
    }
    if (!checkRateLimit()) {
      setErrorMsg('Too many verification requests. Please wait a minute.');
      return;
    }
    setLoading(true);
    try {
      const cert = await verifyCertificateByNumber(certNo);
      setCertResult(cert);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      {/* Deep Navy Header Banner */}
      <div className="no-print relative overflow-hidden bg-[#061224] text-white py-10 px-4 sm:px-6 border-b border-[#D4AF37]/40">
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

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {t(lang, 'resultLookupTitle')}
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                {t(lang, 'resultLookupSubtitle')}
              </p>
            </div>

            <div className="inline-flex p-1 rounded-xl bg-[#0D213F] border border-[#244778] shrink-0">
              <button
                type="button"
                onClick={() => setMode('result')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'result'
                    ? 'bg-[#D4AF37] text-[#071426]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'bn' ? 'পরীক্ষার ফলাফল' : 'Exam Results'}
              </button>
              <button
                type="button"
                onClick={() => setMode('certificate')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'certificate'
                    ? 'bg-[#D4AF37] text-[#071426]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t(lang, 'verifyCertificate')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8">
        {mode === 'result' ? (
          <>
            <form
              onSubmit={handleSearchResult}
              className="no-print bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t(lang, 'admissionNo')}
                  </label>
                  <input
                    type="text"
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    placeholder="e.g. 2026/001"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#123466]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t(lang, 'rollNo')}
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="e.g. 001"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#123466]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t(lang, 'selectClass')}
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#123466]"
                  >
                    <option value="">All Classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t(lang, 'session')}
                  </label>
                  <input
                    type="text"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    placeholder="2026"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#123466]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t(lang, 'selectExam')}
                  </label>
                  <select
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#123466]"
                  >
                    <option value="">All Published Exams</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? 'শুধুমাত্র অনুমোদিত ও প্রকাশিত ফলাফল প্রদর্শিত হয়'
                      : 'Privacy Protected · Only officially approved & published marksheets appear'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  <Search className="w-4 h-4 text-[#F2D06B]" />
                  {loading ? 'Searching...' : t(lang, 'searchResult')}
                </button>
              </div>
            </form>

            {errorMsg && (
              <div className="no-print mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="mt-8 space-y-8">
              {results === null && (
                <div className="no-print rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <FileSearch className="w-10 h-10 text-[#123466]/60 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">
                    {lang === 'bn'
                      ? 'মার্কশিট দেখতে তথ্য দিয়ে অনুসন্ধান করুন'
                      : 'Enter Student Credentials to Retrieve Official Marksheet'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    {lang === 'bn'
                      ? 'ভর্তি নম্বর বা রোল নম্বর লিখে সার্চ বাটনে ক্লিক করুন।'
                      : 'Search with Admission No. or Roll No. Once found, you can download an A4 PDF or print directly.'}
                  </p>
                </div>
              )}

              {results !== null && results.length === 0 && (
                <div className="no-print rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
                  <AlertCircle className="w-9 h-9 text-amber-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-amber-900">
                    {lang === 'bn' ? 'কোনো প্রকাশিত ফলাফল পাওয়া যায়নি' : 'No Published Result Found'}
                  </h3>
                  <p className="text-sm text-amber-800 mt-1">
                    {lang === 'bn'
                      ? 'ভর্তি নম্বর, রোল নম্বর বা শিক্ষাবর্ষ যাচাই করে পুনরায় চেষ্টা করুন।'
                      : 'Please verify your Admission No., Roll No., and Session. Unpublished draft marks are withheld until official publication.'}
                  </p>
                </div>
              )}

              {results &&
                results.map((res) => (
                  <MarksheetCard key={res.id} result={res} settings={settings} lang={lang} />
                ))}
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <form
              onSubmit={handleVerifyCert}
              className="no-print bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t(lang, 'certificateNo')}
                </label>
                <input
                  type="text"
                  value={certNo}
                  onChange={(e) => setCertNo(e.target.value)}
                  placeholder="e.g. MDSM-CERT-2026-001"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-[#123466]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Award className="w-4 h-4 text-[#F2D06B]" />
                {t(lang, 'verifyCertificate')}
              </button>
            </form>

            {certResult === null && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800">
                No active certificate matched verification number <strong>{certNo}</strong>.
              </div>
            )}

            {certResult && (
              <div className="space-y-4">
                <div className="no-print rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Certificate verified authentic in official Madrasah registry.</span>
                </div>
                <CertificateCard certificate={certResult} settings={settings} lang={lang} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
