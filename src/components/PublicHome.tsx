import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Globe,
  GraduationCap,
  Home,
  Mail,
  MapPin,
  Menu,
  Phone,
  Quote,
  Search,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import {
  Course,
  Language,
  LiveClassRecord,
  NoticeRecord,
  PublicTeacher,
  SiteSettings,
  UserProfile,
} from '../types/madrasa';
import { t } from '../i18n/translations';
import {
  IslamicPatternBackground,
  MadrasahLogo,
  MosqueHeroArtwork,
  ScholarAvatar,
} from './IslamicGraphics';
import { PWAInstallButton } from './PWAInstallButton';

interface PublicHomeProps {
  settings: SiteSettings;
  courses: Course[];
  teachers: PublicTeacher[];
  notices: NoticeRecord[];
  liveClasses: LiveClassRecord[];
  lang: Language;
  onToggleLang: () => void;
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
  onOpenResults: () => void;
  onOpenAdmission: () => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  settings,
  courses,
  teachers,
  notices,
  liveClasses,
  lang,
  onToggleLang,
  userProfile,
  onOpenAuth,
  onOpenDashboard,
  onOpenResults,
  onOpenAdmission,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [heroBannerErr, setHeroBannerErr] = useState(false);
  const [admBannerErr, setAdmBannerErr] = useState(false);

  React.useEffect(() => {
    setHeroBannerErr(false);
  }, [settings.heroBannerUrl]);

  React.useEffect(() => {
    setAdmBannerErr(false);
  }, [settings.admissionBannerUrl]);

  const madrasaName =
    lang === 'bn' && settings.madrasaNameBn ? settings.madrasaNameBn : settings.madrasaName;
  const heroTitle =
    lang === 'bn' && settings.heroTitleBn
      ? settings.heroTitleBn
      : settings.heroTitle || t(lang, 'heroDefaultTitle');
  const heroSubtitle =
    lang === 'bn' && settings.heroSubtitleBn
      ? settings.heroSubtitleBn
      : settings.heroSubtitle || t(lang, 'heroDefaultSubtitle');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)));
    return ['ALL', ...unique];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (selectedCategory === 'ALL') return courses;
    return courses.filter((c) => c.category === selectedCategory);
  }, [courses, selectedCategory]);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="home" className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-0">
      {/* 1. & 2. Professional Header — Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#061224]/95 backdrop-blur border-b border-[#D4AF37]/30 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#home"
            className="flex items-center gap-3 font-display text-sm sm:text-base font-bold tracking-wide text-white whitespace-nowrap shrink-0"
          >
            <MadrasahLogo className="w-9 h-9" logoUrl={settings.logoUrl} />
            <span>{madrasaName}</span>
          </a>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-200">
            <a
              href="#courses"
              className="hover:text-[#F2D06B] transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'navCourses')}
            </a>
            <a
              href="#teachers"
              className="hover:text-[#F2D06B] transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'navTeachers')}
            </a>
            <button
              type="button"
              onClick={onOpenResults}
              className="hover:text-[#F2D06B] transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'navResults')}
            </button>
            <button
              type="button"
              onClick={onOpenAdmission}
              className="hover:text-[#F2D06B] transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'navAdmission')}
            </button>
            <a
              href="#contact"
              className="hover:text-[#F2D06B] transition-colors whitespace-nowrap shrink-0"
            >
              {t(lang, 'navContact')}
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            {userProfile ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#071426] text-xs font-bold hover:bg-[#E5C158] transition-colors whitespace-nowrap shrink-0"
              >
                {t(lang, 'openDashboard')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#071426] text-xs font-bold hover:bg-[#E5C158] transition-colors whitespace-nowrap shrink-0"
              >
                {t(lang, 'portalLogin')}
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg text-slate-200 hover:bg-[#123466] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Hamburger Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#091A33] border-t border-[#1E3A63] px-4 py-4 space-y-2">
            <button
              type="button"
              onClick={() => scrollTo('about')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#123466]"
            >
              {t(lang, 'aboutHeading')}
            </button>
            <button
              type="button"
              onClick={() => scrollTo('courses')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#123466]"
            >
              {t(lang, 'navCourses')}
            </button>
            <button
              type="button"
              onClick={() => scrollTo('teachers')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#123466]"
            >
              {t(lang, 'navTeachers')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenResults();
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#F2D06B] hover:bg-[#123466]"
            >
              {t(lang, 'navResults')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmission();
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#123466]"
            >
              {t(lang, 'navAdmission')}
            </button>
            <button
              type="button"
              onClick={() => scrollTo('contact')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-[#123466]"
            >
              {t(lang, 'navContact')}
            </button>
          </div>
        )}
      </header>

      {/* 3. Hero Section with Islamic Graphics + Utility Bar (Language & PWA Install) */}
      <section className="relative overflow-hidden bg-[#061224] text-white border-b border-[#D4AF37]/30">
        <IslamicPatternBackground opacity={0.07} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-14 lg:py-16">
          {/* Sub-header Utility Controls: Language Switcher & PWA Install */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-8 border-b border-[#1A355D]">
            <div className="text-xs font-semibold tracking-[0.16em] text-[#E5C158] uppercase">
              {t(lang, 'established')} <span aria-hidden="true">·</span> {t(lang, 'motto')}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleLang}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#284E85] bg-[#0D213F] px-3 py-1.5 text-xs font-semibold text-white hover:border-[#D4AF37] transition-colors whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 text-[#F2D06B]" />
                <span>{lang === 'en' ? 'বাংলা ভাষা' : 'English'}</span>
              </button>
              <PWAInstallButton lang={lang} variant="dark" />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-bold tracking-[0.18em] text-[#F2D06B] uppercase">
                {t(lang, 'heroBadge')}
              </p>
              <h1
                className="font-display font-bold text-white leading-[1.15] text-balance"
                style={{ fontSize: 'clamp(2rem, 3.8vw, 3.4rem)' }}
              >
                {heroTitle}
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                {heroSubtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={onOpenAdmission}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-[#071426] px-6 py-3 text-sm font-bold shadow-lg transition-colors whitespace-nowrap"
                >
                  <GraduationCap className="w-4 h-4" />
                  {t(lang, 'applyAdmission')}
                </button>
                <button
                  type="button"
                  onClick={onOpenResults}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#3563A8] bg-[#0E2240] hover:bg-[#14315B] text-white px-6 py-3 text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Search className="w-4 h-4 text-[#F2D06B]" />
                  {t(lang, 'checkResults')}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              {settings.heroBannerUrl && settings.heroBannerUrl.trim().length > 0 && !heroBannerErr ? (
                <div className="w-full max-w-md rounded-2xl overflow-hidden border-2 border-[#D4AF37]/60 bg-[#0B1E3B] shadow-2xl aspect-[4/3]">
                  <img
                    src={settings.heroBannerUrl}
                    alt={madrasaName}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroBannerErr(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <MosqueHeroArtwork className="w-full max-w-md drop-shadow-2xl" />
              )}
            </div>
          </div>

          {/* 4-column Institutional KPI Strip */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8 border-t border-[#1A355D]">
            <div className="rounded-xl bg-[#0B1E3B]/90 border border-[#1E3D6B] p-4">
              <div className="text-2xl font-extrabold text-[#F2D06B] font-mono-num">
                {settings.establishedYear || '2002'}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {lang === 'bn' ? 'প্রতিষ্ঠার বছর' : 'Year Established'}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B1E3B]/90 border border-[#1E3D6B] p-4">
              <div className="text-2xl font-extrabold text-white font-mono-num">
                {courses.length > 0 ? courses.length : 9}+
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {lang === 'bn' ? 'ইসলামী ও সাধারণ কোর্স' : 'Islamic & Academic Tracks'}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B1E3B]/90 border border-[#1E3D6B] p-4">
              <div className="text-2xl font-extrabold text-white font-mono-num">
                {teachers.length > 0 ? teachers.length : 12}+
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {lang === 'bn' ? 'অভিজ্ঞ আলেম ও শিক্ষক' : 'Qualified Scholars'}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B1E3B]/90 border border-[#1E3D6B] p-4">
              <div className="text-2xl font-extrabold text-emerald-400 font-mono-num">
                100%
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {lang === 'bn' ? 'ডিজিটাল মার্কশিট ও পোর্টাল' : 'Digital Result Verification'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. & 5. Welcome Message & Online Admission Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">
        {settings.admissionOpen !== false && (
          <div className="rounded-2xl bg-gradient-to-r from-[#123466] to-[#0A1F3D] border border-[#D4AF37]/60 p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {settings.admissionBannerUrl &&
              settings.admissionBannerUrl.trim().length > 0 &&
              !admBannerErr ? (
                <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border border-[#D4AF37]/60 bg-[#091A33] shrink-0">
                  <img
                    src={settings.admissionBannerUrl}
                    alt="Online Admission"
                    referrerPolicy="no-referrer"
                    onError={() => setAdmBannerErr(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#F2D06B] shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#F2D06B]">
                  {lang === 'bn' ? 'অনলাইন ভর্তি বিজ্ঞপ্তি' : 'Online Admission Open'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                  {lang === 'bn' && settings.admissionBannerTextBn
                    ? settings.admissionBannerTextBn
                    : settings.admissionBannerText}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAdmission}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] text-[#071426] px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
            >
              <span>{t(lang, 'applyAdmission')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* 6. Welcome & About the Madrasa */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-bold tracking-[0.16em] text-[#123466] uppercase">
              {t(lang, 'welcomeHeading')}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {t(lang, 'aboutHeading')}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {lang === 'bn' && settings.welcomeTextBn
                ? settings.welcomeTextBn
                : settings.welcomeText}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === 'bn' && settings.aboutTextBn ? settings.aboutTextBn : settings.aboutText}
            </p>
          </div>

          {/* 7. Academic Programs Summary Grid */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                num: '01',
                title: lang === 'bn' ? 'নূরানী ও কুরআন তাজবীদ' : 'Noorani & Quran Tajweed',
                desc:
                  lang === 'bn'
                    ? 'বিশুদ্ধ মাখরাজ ও তিলাওয়াত প্রশিক্ষণ'
                    : 'Foundational Arabic literacy & Makharij mastery.',
              },
              {
                num: '02',
                title: lang === 'bn' ? 'হিফজুল কুরআন' : 'Hifz-ul-Quran Track',
                desc:
                  lang === 'bn'
                    ? 'দৈনিক সবক ও মনযিল তত্ত্বাবধানে পূর্ণ হিফজ'
                    : 'Guided memorization with daily Sabak & Manzil.',
              },
              {
                num: '03',
                title: lang === 'bn' ? 'হাদিস, ফিকহ ও আরবি' : 'Hadith, Fiqh & Arabic',
                desc:
                  lang === 'bn'
                    ? 'প্রামাণিক দ্বীনি ইলম ও আমলি তরবিয়াত'
                    : 'Authentic Islamic jurisprudence and classical Arabic.',
              },
              {
                num: '04',
                title: lang === 'bn' ? 'আধুনিক সাধারণ শিক্ষা' : 'Bangla, English & Math',
                desc:
                  lang === 'bn'
                    ? '১ম থেকে ১০ম শ্রেণির সমন্বিত একাডেমিক পাঠদান'
                    : 'Structured modern curriculum up to Class X.',
              },
            ].map((prog) => (
              <div
                key={prog.num}
                className="rounded-xl bg-white border border-slate-200 p-5 hover:border-[#D4AF37] transition-colors"
              >
                <div className="text-xs font-mono-num font-bold text-[#B8860B] mb-2">
                  {prog.num}.
                </div>
                <h3 className="text-base font-bold text-slate-900">{prog.title}</h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{prog.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Featured Courses Catalog */}
      <section id="courses" className="bg-white border-y border-slate-200 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-[#B8860B] uppercase">
                Curriculum
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                {t(lang, 'programsHeading')}
              </h2>
            </div>

            {/* Functional Interactive Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#123466] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'ALL' ? t(lang, 'allCategories') : cat}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              {t(lang, 'noRecords')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const thumb = course.thumbnailUrl || course.cloudinaryImageUrl;
                return (
                <article
                  key={course.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col justify-between hover:border-[#123466]/50 transition-colors"
                >
                  <div>
                    {thumb && thumb.trim().length > 0 && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/9]">
                        <img
                          src={thumb}
                          alt={course.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-[#123466]">
                        {lang === 'bn' && course.categoryBn ? course.categoryBn : course.category}
                      </span>
                      {course.level && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{course.level}</span>
                        </>
                      )}
                      {course.duration && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{course.duration}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {lang === 'bn' && course.titleBn ? course.titleBn : course.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      {lang === 'bn' && course.descriptionBn
                        ? course.descriptionBn
                        : course.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      {course.teacherName || 'Madrasah Faculty'}
                    </span>
                    <button
                      type="button"
                      onClick={onOpenAdmission}
                      className="font-bold text-[#123466] hover:text-[#B8860B] inline-flex items-center gap-1"
                    >
                      <span>{t(lang, 'applyAdmission')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 9. Teacher and Scholar Gallery */}
      <section id="teachers" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#B8860B] uppercase">
            Faculty
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {t(lang, 'teachersHeading')}
          </h2>
        </div>

        {teachers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            {t(lang, 'noRecords')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col gap-4 hover:border-[#D4AF37] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <ScholarAvatar
                    photoUrl={teacher.cloudinaryImageUrl || teacher.photoUrl}
                    name={teacher.name}
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {lang === 'bn' && teacher.nameBn ? teacher.nameBn : teacher.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#123466] mt-0.5">
                      {lang === 'bn' && teacher.titleBn ? teacher.titleBn : teacher.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {lang === 'bn' && teacher.qualificationBn
                        ? teacher.qualificationBn
                        : teacher.qualification}
                    </p>
                  </div>
                </div>

                {teacher.bio && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'bn' && teacher.bioBn ? teacher.bioBn : teacher.bio}
                  </p>
                )}

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {teacher.experienceYears} {lang === 'bn' ? 'বছরের অভিজ্ঞতা' : 'Years Experience'}
                  </span>
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">
                    {(teacher.subjects || []).join(' · ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 10. Principal's Desk & 11. Academic Achievements */}
      <section className="bg-[#061224] text-white py-14 sm:py-16 relative overflow-hidden">
        <IslamicPatternBackground opacity={0.06} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 rounded-2xl bg-[#0B1E3B]/95 border border-[#D4AF37]/40 p-6 sm:p-8">
            <p className="text-xs font-bold tracking-[0.16em] text-[#F2D06B] uppercase mb-2">
              {t(lang, 'principalHeading')}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <ScholarAvatar
                photoUrl={settings.principalPhotoUrl}
                name={settings.principalName || 'Principal'}
                className="w-24 h-24"
              />
              <div>
                <Quote className="w-6 h-6 text-[#D4AF37]/60 mb-2" />
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {lang === 'bn' && settings.principalMessageBn
                    ? settings.principalMessageBn
                    : settings.principalMessage}
                </p>
                <div className="mt-4 pt-3 border-t border-[#1D3B68]">
                  <div className="text-sm font-bold text-[#F2D06B]">
                    {lang === 'bn' && settings.principalNameBn
                      ? settings.principalNameBn
                      : settings.principalName}
                  </div>
                  <div className="text-xs text-sky-200/75">{settings.principalTitle}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-display text-xl font-bold text-white">
              {t(lang, 'achievementsHeading')}
            </h3>
            <div className="space-y-3">
              {[
                {
                  icon: Award,
                  title: lang === 'bn' ? '১২০+ হাফেজে কুরআন তৈরি' : '120+ Huffaz Graduated Since 2002',
                  sub: 'Structured daily Sabak, Sabqi, and Manzil evaluation.',
                },
                {
                  icon: UserCheck,
                  title: lang === 'bn' ? '৯৮% বোর্ড ও অভ্যন্তরীণ পাসের হার' : '98% Examination Pass Record',
                  sub: 'Consistent distinction in Arabic, Tajweed & Mathematics.',
                },
                {
                  icon: BookOpen,
                  title: lang === 'bn' ? 'ডিজিটাল লাইব্রেরি ও অনলাইন ক্লাস' : 'Hybrid Campus & Live Online Learning',
                  sub: 'Recorded video archive, digital PDF library, and verified marksheets.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl bg-[#0C2242] border border-[#1E4073] p-4 flex items-start gap-3.5"
                >
                  <item.icon className="w-5 h-5 text-[#F2D06B] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-white">{item.title}</div>
                    <div className="text-xs text-slate-300 mt-0.5">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 12. Latest Notices & 13. Upcoming Live Classes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {t(lang, 'noticesHeading')}
            </h2>
            <Calendar className="w-5 h-5 text-[#123466]" />
          </div>

          <div className="space-y-3.5">
            {notices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                {t(lang, 'noRecords')}
              </div>
            ) : (
              notices.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl bg-white border border-slate-200 p-5 hover:border-[#123466]/40 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span
                      className={`font-bold uppercase ${
                        n.priority === 'urgent'
                          ? 'text-rose-700'
                          : n.priority === 'important'
                            ? 'text-amber-700'
                            : 'text-[#123466]'
                      }`}
                    >
                      {n.priority}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{n.category || 'General'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{n.authorName}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'bn' && n.titleBn ? n.titleBn : n.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                    {lang === 'bn' && n.contentBn ? n.contentBn : n.content}
                  </p>
                  {(n.imageUrl || n.cloudinaryImageUrl) && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={n.imageUrl || n.cloudinaryImageUrl}
                        alt={n.title}
                        referrerPolicy="no-referrer"
                        className="w-full max-h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {t(lang, 'liveClassesHeading')}
            </h2>
            <Video className="w-5 h-5 text-[#123466]" />
          </div>

          <div className="space-y-3.5">
            {liveClasses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                {t(lang, 'noRecords')}
              </div>
            ) : (
              liveClasses.slice(0, 5).map((lc) => (
                <div
                  key={lc.id}
                  className="rounded-xl bg-white border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-[#123466]">{lc.provider}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lc.className || lc.courseTitle}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lc.durationMinutes} min</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === 'bn' && lc.titleBn ? lc.titleBn : lc.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span>
                        {lc.scheduledAt} · {lc.teacherName}
                      </span>
                    </div>
                  </div>

                  <a
                    href={lc.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5 text-[#F2D06B]" />
                    {t(lang, 'joinClass')}
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 14. Student & Parent Testimonials */}
      <section className="bg-slate-100 border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-8">
            {t(lang, 'testimonialsHeading')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'My son began in the Noorani section unable to read Arabic letters, and within 14 months he recites fluently with Tajweed rules.',
                author: 'Haji Md. Kamrul Islam',
                role: 'Parent of Class V Student',
              },
              {
                quote:
                  'The bilingual online marksheet and attendance tracker allow our family to monitor exam progress immediately from home.',
                author: 'Fatema Begum',
                role: 'Guardian, Hifz Section',
              },
              {
                quote:
                  'Studying Fiqh, Arabic, and Mathematics side by side prepared me confidently for both religious scholarship and board exams.',
                author: 'Soukat Ali',
                role: 'Class X Student',
              },
            ].map((item) => (
              <div
                key={item.author}
                className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between"
              >
                <p className="text-sm text-slate-700 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-sm font-bold text-slate-900">{item.author}</div>
                  <div className="text-xs text-slate-500">{item.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 15. Contact Information */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {t(lang, 'contactHeading')}
            </h2>
            <p className="text-sm text-slate-600">
              Reach out to our administrative office for campus visits, admission counseling, or guardian support.
            </p>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#123466] shrink-0 mt-0.5" />
                <span>{lang === 'bn' && settings.addressBn ? settings.addressBn : settings.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#123466] shrink-0" />
                <span className="font-mono-num">{settings.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#123466] shrink-0" />
                <span>{settings.email}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setContactSubmitted(true);
              }}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'অফিসে বার্তা পাঠান' : 'Send an Inquiry'}
              </h3>
              {contactSubmitted && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                  Thank you! For official student/guardian inquiries, you may also sign in to the Portal to message teachers directly.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder={lang === 'bn' ? 'আপনার নাম' : 'Your Full Name'}
                  className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <input
                  required
                  type="tel"
                  placeholder={lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                  className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
              </div>
              <textarea
                required
                rows={3}
                placeholder={lang === 'bn' ? 'আপনার প্রশ্ন বা বার্তা লিখুন...' : 'Write your message or admission question...'}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#123466] hover:bg-[#19478A] text-white px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                {t(lang, 'submit')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 16. Footer */}
      <footer className="bg-[#061224] text-slate-300 border-t border-[#D4AF37]/30 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <MadrasahLogo className="w-10 h-10" logoUrl={settings.logoUrl} />
            <div>
              <div className="font-display text-sm font-bold text-white">{madrasaName}</div>
              <div className="text-xs text-[#E5C158]">{t(lang, 'footerTagline')}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-xs">
            <button type="button" onClick={onOpenAdmission} className="hover:text-white">
              {t(lang, 'navAdmission')}
            </button>
            <button type="button" onClick={onOpenResults} className="hover:text-white">
              {t(lang, 'navResults')}
            </button>
            <button type="button" onClick={onOpenAuth} className="hover:text-white">
              {t(lang, 'portalLogin')}
            </button>
            <a href="#courses" className="hover:text-white">
              {t(lang, 'navCourses')}
            </a>
          </div>

          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} {settings.madrasaName}. Est. {settings.establishedYear}.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation (Home, Courses, Teachers, Contact + Results) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#061224] border-t border-[#D4AF37]/40 text-slate-200 grid grid-cols-5 h-16"
      >
        <button
          type="button"
          onClick={() => scrollTo('home')}
          className="flex flex-col items-center justify-center gap-1 text-[11px] hover:text-[#F2D06B]"
        >
          <Home className="w-4 h-4" />
          <span>{t(lang, 'navHome')}</span>
        </button>
        <button
          type="button"
          onClick={() => scrollTo('courses')}
          className="flex flex-col items-center justify-center gap-1 text-[11px] hover:text-[#F2D06B]"
        >
          <BookOpen className="w-4 h-4" />
          <span>{t(lang, 'navCourses')}</span>
        </button>
        <button
          type="button"
          onClick={() => scrollTo('teachers')}
          className="flex flex-col items-center justify-center gap-1 text-[11px] hover:text-[#F2D06B]"
        >
          <Users className="w-4 h-4" />
          <span>{t(lang, 'navTeachers')}</span>
        </button>
        <button
          type="button"
          onClick={onOpenResults}
          className="flex flex-col items-center justify-center gap-1 text-[11px] text-[#F2D06B]"
        >
          <Search className="w-4 h-4" />
          <span>{t(lang, 'navResults')}</span>
        </button>
        <button
          type="button"
          onClick={() => scrollTo('contact')}
          className="flex flex-col items-center justify-center gap-1 text-[11px] hover:text-[#F2D06B]"
        >
          <Phone className="w-4 h-4" />
          <span>{t(lang, 'navContact')}</span>
        </button>
      </nav>
    </div>
  );
};
