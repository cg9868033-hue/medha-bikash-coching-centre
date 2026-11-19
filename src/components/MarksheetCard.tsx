import React, { useEffect, useRef, useState } from 'react';
import { Award, CheckCircle2, Download, Grid3X3, Pencil, PieChart, Printer, Star, Trophy, XCircle } from 'lucide-react';
import { Language, ResultRecord, SiteSettings } from '../types/madrasa';
import { t } from '../i18n/translations';
import { downloadElementAsPdf, printDocumentElement } from '../utils/pdfExport';
import { MadrasahLogo, OfficialResultSeal } from './IslamicGraphics';

interface MarksheetCardProps {
  result: ResultRecord;
  settings: SiteSettings;
  lang: Language;
  showActions?: boolean;
}

export const MarksheetCard: React.FC<MarksheetCardProps> = ({
  result,
  settings,
  lang,
  showActions = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  const studentPhoto = result.cloudinaryImageUrl || result.photoUrl || '';

  useEffect(() => {
    setPhotoError(false);
  }, [result.cloudinaryImageUrl, result.photoUrl]);

  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setPdfError(null);
    try {
      const safeAdmission = result.admissionNo.replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadElementAsPdf(
        cardRef.current,
        `MDSM_Marksheet_${safeAdmission}_${result.session}.pdf`
      );
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF export failed');
    } finally {
      setDownloading(false);
    }
  };

  const madrasaTitle =
    lang === 'bn' && settings.madrasaNameBn
      ? settings.madrasaNameBn
      : settings.madrasaName || 'MEDER DHAR SHISHU MADRASAH';

  const taglineText =
    lang === 'bn' && settings.taglineBn
      ? settings.taglineBn
      : settings.tagline || 'KNOWLEDGE · FAITH · SUCCESS';

  const footerMotto =
    lang === 'bn'
      ? t('bn', 'footerTagline')
      : settings.motto || 'EDUCATION FOR A BETTER TOMORROW';

  return (
    <div className="w-full max-w-[680px] mx-auto">
      {/* Screen & Printable Marksheet Frame matching the uploaded reference screenshots */}
      <div
        ref={cardRef}
        className="print-only-container relative overflow-hidden rounded-2xl bg-[#071426] text-white p-3 sm:p-5 shadow-2xl border border-[#1E3A63]"
        style={{
          background: 'linear-gradient(180deg, #091B36 0%, #061224 55%, #081830 100%)',
        }}
      >
        {/* Outer Thin Golden Inner Border */}
        <div className="relative rounded-xl border border-[#C9A227]/75 p-4 sm:p-6">
          {/* Header Block */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <MadrasahLogo className="w-14 h-14 sm:w-16 sm:h-16" logoUrl={settings.logoUrl} />
              <div>
                <p className="text-[11px] sm:text-xs font-bold tracking-[0.22em] text-[#E5C158] uppercase">
                  {lang === 'bn'
                    ? `প্রতিষ্ঠিত · ${settings.establishedYear || '২০০২'}`
                    : `ESTABLISHED · ${settings.establishedYear || '2002'}`}
                </p>
                <h2 className="font-display text-lg sm:text-2xl font-extrabold tracking-wide text-white leading-tight mt-0.5">
                  {madrasaTitle}
                </h2>
                <p className="text-[10px] sm:text-xs font-semibold tracking-[0.18em] text-sky-200/80 uppercase mt-1">
                  {taglineText}
                </p>
              </div>
            </div>

            {/* Subtle Top-Right Golden Crescent */}
            <svg
              viewBox="0 0 36 36"
              className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 text-[#E5C158]"
              aria-hidden="true"
            >
              <path
                d="M21 6 A11 11 0 1 0 30 24 A9 9 0 1 1 21 6 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          {/* Center Golden Ribbon Banner */}
          <div className="mt-5 flex flex-col items-center">
            <div
              className="px-7 sm:px-10 py-2 text-center font-extrabold tracking-[0.12em] text-xs sm:text-sm text-[#071426] uppercase shadow-md"
              style={{
                background: 'linear-gradient(90deg, #D4AF37 0%, #F5D77F 50%, #D4AF37 100%)',
                clipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)',
              }}
            >
              {t(lang, 'marksheetBanner')} · {result.session}
            </div>
            <p className="mt-2.5 text-sm sm:text-base font-bold text-white tracking-wide text-center">
              {lang === 'bn' && result.examTitleBn ? result.examTitleBn : result.examTitle}
            </p>
          </div>

          {/* Student Information Card */}
          <div className="mt-5 rounded-xl bg-[#0D213F]/90 border border-[#244778] p-3.5 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
              {/* Portrait Frame with attached Roll No gold badge */}
              <div className="w-28 sm:w-32 shrink-0 flex flex-col">
                <div className="w-full h-32 sm:h-36 rounded-t-xl overflow-hidden border-2 border-[#3B76D1] bg-[#081529] flex items-center justify-center">
                  {studentPhoto.trim().length > 0 && !photoError ? (
                    <img
                      src={studentPhoto}
                      alt={result.studentName}
                      referrerPolicy="no-referrer"
                      onError={() => setPhotoError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-sky-200/70">
                      <span className="font-display text-2xl font-bold text-[#E5C158]">
                        {result.studentName
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')}
                      </span>
                      <span className="text-[10px] tracking-wider uppercase mt-1">Student</span>
                    </div>
                  )}
                </div>
                <div
                  className="w-full py-1.5 px-2 rounded-b-xl text-center text-[#071426] font-extrabold leading-tight"
                  style={{
                    background: 'linear-gradient(180deg, #F5D77F 0%, #D4AF37 100%)',
                  }}
                >
                  <div className="text-[9px] tracking-wider uppercase">{t(lang, 'rollNo')}</div>
                  <div className="text-xs font-mono-num">{result.rollNo}</div>
                </div>
              </div>

              {/* 2-Column Student Metadata Tiles */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="rounded-lg bg-[#08162B] border border-[#1B3A66] px-3 py-2">
                  <div className="text-[10px] font-bold tracking-wider text-sky-300/75 uppercase">
                    {t(lang, 'studentName')}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5 truncate">
                    {result.studentName}
                  </div>
                </div>

                <div className="rounded-lg bg-[#08162B] border border-[#1B3A66] px-3 py-2">
                  <div className="text-[10px] font-bold tracking-wider text-sky-300/75 uppercase">
                    {t(lang, 'fatherName')}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5 truncate">
                    {result.fatherName}
                  </div>
                </div>

                <div className="rounded-lg bg-[#08162B] border border-[#1B3A66] px-3 py-2">
                  <div className="text-[10px] font-bold tracking-wider text-sky-300/75 uppercase">
                    {t(lang, 'admissionNo')}
                  </div>
                  <div className="text-sm font-bold text-white font-mono-num mt-0.5">
                    {result.admissionNo}
                  </div>
                </div>

                <div className="rounded-lg bg-[#08162B] border border-[#1B3A66] px-3 py-2">
                  <div className="text-[10px] font-bold tracking-wider text-sky-300/75 uppercase">
                    {t(lang, 'selectClass')}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">{result.className}</div>
                </div>

                <div className="rounded-lg bg-[#08162B] border border-[#1B3A66] px-3 py-2 sm:col-span-2">
                  <div className="text-[10px] font-bold tracking-wider text-sky-300/75 uppercase">
                    {t(lang, 'session')}
                  </div>
                  <div className="text-sm font-bold text-white font-mono-num mt-0.5">
                    {result.session}
                  </div>
                </div>
              </div>
            </div>

            {/* Trophy & Performance Remark Bar */}
            <div className="mt-3.5 pt-3 border-t border-[#1D3B68] flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-[#F5D77F] font-extrabold text-sm tracking-wide">
                <Trophy className="w-5 h-5 text-[#F5D77F]" />
                <span>{result.performanceRemark || (result.passed ? 'GOOD WORK' : 'NEEDS EFFORT')}</span>
              </div>
              <span className="text-[10px] tracking-[0.16em] text-sky-200/75 uppercase">
                {t(lang, 'academicPerformance')}
              </span>
            </div>
          </div>

          {/* Subject-Wise Marks Header */}
          <div className="mt-6 mb-3 flex items-center justify-center gap-3">
            <span className="text-[#F2C94C] text-sm" aria-hidden="true">✦</span>
            <h3 className="text-sm sm:text-base font-extrabold tracking-[0.14em] text-white uppercase">
              {t(lang, 'subjectWiseMarks')}
            </h3>
            <span className="text-[#F2C94C] text-sm" aria-hidden="true">✦</span>
          </div>

          {/* Subject-Wise Marks Table */}
          <div className="overflow-hidden rounded-xl border border-[#C9A227]/65 bg-[#091A33]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#0E2649] border-b border-[#254B80] text-[10px] sm:text-xs font-extrabold tracking-wider text-sky-100 uppercase">
                  <th className="py-2.5 px-3 sm:px-4 border-r border-[#1F406E]">
                    {t(lang, 'subjectCol')}
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-[#1F406E] w-28 sm:w-36">
                    {t(lang, 'obtainedMarksCol')}
                  </th>
                  <th className="py-2.5 px-3 text-center w-24 sm:w-32">
                    {t(lang, 'fullMarksCol')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.subjects.map((sub, idx) => {
                  const serial = String(idx + 1).padStart(2, '0');
                  const subName =
                    lang === 'bn' && sub.subjectNameBn ? sub.subjectNameBn : sub.subjectName;
                  const subPassed =
                    typeof sub.passed === 'boolean'
                      ? sub.passed
                      : sub.obtainedMarks >= (sub.passMarks || 33);

                  return (
                    <tr
                      key={`${sub.subjectName}-${idx}`}
                      className="border-b last:border-b-0 border-[#1B3A66] hover:bg-[#0D2344]/60 transition-colors"
                    >
                      <td className="py-2.5 px-3 sm:px-4 border-r border-[#1B3A66]">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F2C94C] text-[#071426] text-[11px] font-extrabold font-mono-num shrink-0">
                            {serial}
                          </span>
                          <span className="text-sm font-medium text-white">{subName}</span>
                        </div>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-center border-r border-[#1B3A66] font-bold font-mono-num text-sm sm:text-base ${
                          subPassed ? 'text-white' : 'text-rose-400'
                        }`}
                      >
                        {sub.obtainedMarks}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium font-mono-num text-sm text-sky-100/90">
                        {sub.fullMarks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 3 Jewel-Toned Result Summary Cards */}
          <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4">
            <div
              className="rounded-xl p-3 sm:p-4 text-center border border-emerald-400/50 shadow-lg"
              style={{ background: 'linear-gradient(180deg, #0FA968 0%, #057A4B 100%)' }}
            >
              <Grid3X3 className="w-5 h-5 mx-auto text-white/95 mb-1.5" />
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider text-emerald-50 uppercase">
                {t(lang, 'totalMarks')}
              </div>
              <div className="text-base sm:text-xl font-extrabold text-white font-mono-num mt-0.5">
                {result.totalObtained}/{result.totalFull}
              </div>
            </div>

            <div
              className="rounded-xl p-3 sm:p-4 text-center border border-violet-400/50 shadow-lg"
              style={{ background: 'linear-gradient(180deg, #8B3DFF 0%, #5B21B6 100%)' }}
            >
              <PieChart className="w-5 h-5 mx-auto text-white/95 mb-1.5" />
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider text-violet-100 uppercase">
                {t(lang, 'percentage')}
              </div>
              <div className="text-base sm:text-xl font-extrabold text-white font-mono-num mt-0.5">
                {result.percentage.toFixed(1)}%
              </div>
            </div>

            <div
              className="rounded-xl p-3 sm:p-4 text-center border border-amber-300/60 shadow-lg"
              style={{ background: 'linear-gradient(180deg, #E59A1A 0%, #B45309 100%)' }}
            >
              <Star className="w-5 h-5 mx-auto text-white fill-white mb-1.5" />
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider text-amber-50 uppercase">
                {t(lang, 'grade')}
              </div>
              <div className="text-base sm:text-xl font-extrabold text-white font-mono-num mt-0.5">
                {result.grade}
              </div>
            </div>
          </div>

          {/* Pass / Fail Status Banner */}
          <div className="mt-4">
            <div
              className={`w-full rounded-full py-2.5 px-5 flex items-center justify-center gap-2.5 border-2 shadow-md font-extrabold tracking-wider text-sm sm:text-base ${
                result.passed
                  ? 'bg-[#16A34A] border-emerald-200/80 text-white'
                  : 'bg-[#DC2626] border-rose-200/80 text-white'
              }`}
            >
              {result.passed ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <span>
                {t(lang, 'resultStatus')} : {result.passed ? t(lang, 'pass') : t(lang, 'fail')}
              </span>
            </div>
          </div>

          {/* Teacher's Remarks */}
          <div className="mt-4 rounded-xl bg-[#0A1C37] border border-[#224778] px-4 py-3 flex items-start gap-3">
            <Pencil className="w-5 h-5 text-[#E5C158] shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold tracking-wider text-[#E5C158] uppercase">
                {t(lang, 'teacherRemarks')}
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                {result.teacherRemarks || settings.madrasaName || 'MEDER DHAR SHISHU MADRASAH'}
              </p>
            </div>
          </div>

          {/* Signatures & Official Result Seal */}
          <div className="mt-6 pt-3 border-t border-[#1D3B68] flex items-center justify-between gap-2">
            <div className="flex-1 text-center pt-4">
              {result.classTeacherName && (
                <div className="text-xs text-sky-200/85 font-medium mb-1">
                  {result.classTeacherName}
                </div>
              )}
              <div className="border-t border-[#2E548A] pt-1.5 text-[10px] sm:text-xs font-extrabold tracking-wider text-white uppercase">
                {t(lang, 'classTeacher')}
              </div>
            </div>

            <OfficialResultSeal label={t(lang, 'officialResult')} />

            <div className="flex-1 text-center pt-4">
              {result.headTeacherName && (
                <div className="text-xs text-sky-200/85 font-medium mb-1">
                  {result.headTeacherName}
                </div>
              )}
              <div className="border-t border-[#2E548A] pt-1.5 text-[10px] sm:text-xs font-extrabold tracking-wider text-white uppercase">
                {t(lang, 'headTeacher')}
              </div>
            </div>
          </div>

          {/* Publication Date & Bottom Motto */}
          <div className="mt-4 pt-3 border-t border-[#1A355D] text-center">
            {result.publishedAt && (
              <p className="text-[11px] text-sky-200/70 font-mono-num mb-1.5">
                {lang === 'bn' ? 'প্রকাশের তারিখ:' : 'Published:'} {result.publishedAt} ·{' '}
                {result.approvalStatus.toUpperCase()}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm italic text-slate-200 tracking-wide">
              <span className="text-[#F2C94C] not-italic" aria-hidden="true">✦</span>
              <span>{footerMotto}</span>
              <span className="text-[#F2C94C] not-italic" aria-hidden="true">✦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Below Marksheet (No-Print) */}
      {showActions && (
        <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-[#F2D06B]" />
              {downloading ? 'Generating PDF...' : t(lang, 'downloadPdf')}
            </button>
            <button
              type="button"
              onClick={printDocumentElement}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-[#123466]" />
              {t(lang, 'printA4')}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span>A4 Print-Ready · Bilingual Script</span>
          </div>
        </div>
      )}

      {pdfError && (
        <p className="no-print mt-2 text-xs text-rose-600 font-medium">{pdfError}</p>
      )}
    </div>
  );
};
