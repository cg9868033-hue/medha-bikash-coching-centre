import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award, Download, Printer, ShieldCheck } from 'lucide-react';
import { CertificateRecord, Language, SiteSettings, StudentRecord, TeacherRecord } from '../types/madrasa';
import { downloadElementAsPdf, printDocumentElement } from '../utils/pdfExport';
import { IslamicPatternBackground, MadrasahLogo, OfficialResultSeal } from './IslamicGraphics';

export const DigitalIdCard: React.FC<{
  type: 'student' | 'teacher';
  student?: StudentRecord;
  teacher?: TeacherRecord;
  settings: SiteSettings;
  lang: Language;
}> = ({ type, student, teacher, settings, lang }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const name = type === 'student' ? student?.fullName || '' : teacher?.fullName || '';
  const code = type === 'student' ? student?.admissionNo || '' : teacher?.teacherCode || '';
  const photo =
    type === 'student'
      ? student?.cloudinaryImageUrl || student?.photoUrl
      : teacher?.cloudinaryImageUrl || teacher?.photoUrl;
  const qrVal = `MDSM-${type.toUpperCase()}-${code}`;

  useEffect(() => {
    setPhotoError(false);
  }, [photo]);

  const handleDownload = async () => {
    if (!ref.current) return;
    setExporting(true);
    try {
      await downloadElementAsPdf(ref.current, `MDSM_${type}_ID_${code}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-sm">
      <div
        ref={ref}
        className="print-only-container relative overflow-hidden rounded-2xl bg-[#071426] text-white border border-[#D4AF37]/70 p-5 shadow-xl"
      >
        <IslamicPatternBackground opacity={0.07} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 pb-3 border-b border-[#1E3A63]">
            <MadrasahLogo className="w-11 h-11" logoUrl={settings.logoUrl} />
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#E5C158] uppercase">
                {lang === 'bn' ? 'ডিজিটাল পরিচয়পত্র' : `${type.toUpperCase()} IDENTITY CARD`}
              </p>
              <h4 className="font-display text-sm font-bold text-white leading-snug">
                {settings.madrasaName}
              </h4>
            </div>
          </div>

          <div className="mt-4 flex gap-4 items-center">
            <div className="w-20 h-24 rounded-xl border-2 border-[#D4AF37] bg-[#0D213F] overflow-hidden flex items-center justify-center shrink-0">
              {photo && photo.trim().length > 0 && !photoError ? (
                <img
                  src={photo}
                  alt={name}
                  referrerPolicy="no-referrer"
                  onError={() => setPhotoError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-xl font-bold text-[#E5C158]">
                  {name
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="text-base font-bold text-white truncate">{name}</div>
              {type === 'student' && student ? (
                <>
                  <div className="text-xs text-sky-200/80">
                    Admission: <span className="font-mono-num text-white font-semibold">{student.admissionNo}</span>
                  </div>
                  <div className="text-xs text-sky-200/80">
                    Class: <span className="text-white font-semibold">{student.className}</span> · Roll:{' '}
                    <span className="font-mono-num text-[#F2D06B] font-bold">{student.rollNo}</span>
                  </div>
                  <div className="text-xs text-sky-200/80 truncate">Father: {student.fatherName}</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-sky-200/80">
                    Teacher ID: <span className="font-mono-num text-[#F2D06B] font-semibold">{teacher?.teacherCode}</span>
                  </div>
                  <div className="text-xs text-sky-200/80 truncate">{teacher?.qualification}</div>
                  <div className="text-xs text-sky-200/80 truncate">
                    Subjects: {(teacher?.subjects || []).join(', ') || 'Islamic Studies'}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E3A63] flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-sky-300/75 uppercase tracking-wider">
                Session {type === 'student' ? student?.session || '2026' : '2026'}
              </div>
              <div className="text-[11px] font-semibold text-[#E5C158] mt-0.5">
                Verified Institutional ID
              </div>
            </div>
            <div className="p-1.5 bg-white rounded-lg">
              <QRCodeSVG value={qrVal} size={48} level="M" />
            </div>
          </div>
        </div>
      </div>

      <div className="no-print mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#123466] text-white px-3.5 py-2 text-xs font-semibold hover:bg-[#1A4688] transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[#F2D06B]" />
          {exporting ? 'Exporting...' : 'Download ID PDF'}
        </button>
        <button
          type="button"
          onClick={printDocumentElement}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>
    </div>
  );
};

export const CertificateCard: React.FC<{
  certificate: CertificateRecord;
  settings: SiteSettings;
  lang: Language;
}> = ({ certificate, settings, lang }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [sealError, setSealError] = useState(false);

  const sealAssetUrl =
    certificate.assetUrl || certificate.cloudinaryImageUrl || settings.certificateSealUrl || '';

  useEffect(() => {
    setSealError(false);
  }, [sealAssetUrl]);

  const handleDownload = async () => {
    if (!ref.current) return;
    setExporting(true);
    try {
      await downloadElementAsPdf(
        ref.current,
        `MDSM_Certificate_${certificate.verificationNo}.pdf`
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        ref={ref}
        className="print-only-container relative overflow-hidden rounded-2xl bg-[#071426] text-white p-5 sm:p-8 border-2 border-[#D4AF37]"
      >
        <IslamicPatternBackground opacity={0.07} />
        <div className="relative z-10 rounded-xl border border-[#D4AF37]/60 p-5 sm:p-7 text-center">
          <div className="flex flex-col items-center">
            <MadrasahLogo className="w-16 h-16 mb-3" logoUrl={settings.logoUrl} />
            <p className="text-[11px] font-bold tracking-[0.22em] text-[#E5C158] uppercase">
              ESTABLISHED · {settings.establishedYear || '2002'}
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white mt-1">
              {settings.madrasaName}
            </h3>
            <p className="text-xs tracking-[0.18em] text-sky-200/75 uppercase mt-1">
              {settings.tagline || 'KNOWLEDGE · FAITH · SUCCESS'}
            </p>
          </div>

          <div
            className="mt-5 inline-block px-8 py-2 text-xs sm:text-sm font-extrabold tracking-[0.14em] text-[#071426] uppercase"
            style={{
              background: 'linear-gradient(90deg, #D4AF37 0%, #F5D77F 50%, #D4AF37 100%)',
              clipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)',
            }}
          >
            {certificate.type.replace('_', ' ')} CERTIFICATE
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-sky-200/80">
            {lang === 'bn' ? 'এই মর্মে প্রত্যয়ন করা যাচ্ছে যে' : 'THIS IS PROUDLY PRESENTED TO'}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5D77F] mt-2">
            {certificate.studentName}
          </h2>
          {certificate.fatherName && (
            <p className="text-xs text-sky-200/80 mt-1">
              Son / Daughter of <span className="text-white font-semibold">{certificate.fatherName}</span>
            </p>
          )}

          <p className="mt-5 text-sm sm:text-base text-slate-200 max-w-lg mx-auto leading-relaxed">
            for successfully completing{' '}
            <strong className="text-white">
              {lang === 'bn' && certificate.titleBn ? certificate.titleBn : certificate.title}
            </strong>
            {certificate.className ? ` in ${certificate.className}` : ''}
            {certificate.session ? ` (Session ${certificate.session})` : ''}.
          </p>

          <div className="mt-8 pt-4 border-t border-[#1D3B68] flex flex-wrap items-center justify-between gap-4">
            <div className="text-left">
              <div className="text-[10px] text-sky-300/75 uppercase tracking-wider">
                Verification No.
              </div>
              <div className="text-xs font-mono-num font-bold text-[#F5D77F]">
                {certificate.verificationNo}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">Issued: {certificate.issueDate}</div>
            </div>

            {sealAssetUrl.trim().length > 0 && !sealError ? (
              <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37]/80 bg-[#0D213F] overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={sealAssetUrl}
                  alt="Official Seal"
                  referrerPolicy="no-referrer"
                  onError={() => setSealError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <OfficialResultSeal label="VERIFIED" />
            )}

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-white border-t border-[#2E548A] pt-1.5 uppercase">
                  {settings.principalName || 'Principal'}
                </div>
                <div className="text-[10px] text-sky-200/75 uppercase">Head of Institution</div>
              </div>
              <div className="p-1.5 bg-white rounded-lg">
                <QRCodeSVG value={`MDSM-CERT-${certificate.verificationNo}`} size={46} level="M" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#123466] text-white px-4 py-2 text-xs font-semibold hover:bg-[#19478A] transition-colors"
          >
            <Download className="w-4 h-4 text-[#F2D06B]" />
            {exporting ? 'Generating PDF...' : 'Download Certificate PDF'}
          </button>
          <button
            type="button"
            onClick={printDocumentElement}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white text-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print A4
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>{certificate.status === 'active' ? 'Active & Verified' : 'Revoked'}</span>
        </div>
      </div>
    </div>
  );
};

export const AchievementBadgeIcon: React.FC = () => (
  <Award className="w-5 h-5 text-[#D4AF37]" />
);
