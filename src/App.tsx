import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { orderBy, where } from 'firebase/firestore';
import { auth } from './firebase';
import {
  ClassBatch,
  Course,
  Examination,
  Language,
  LiveClassRecord,
  NoticeRecord,
  PublicTeacher,
  SiteSettings,
  UserProfile,
  UserRole,
} from './types/madrasa';
import {
  DEFAULT_SITE_SETTINGS,
  getOrCreateUserProfile,
  resolveUserDisplayName,
  subscribeCollection,
  subscribeSiteSettings,
  subscribeUserProfile,
} from './services/firestoreService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MadrasahLoadingScreen } from './components/IslamicGraphics';
import { OfflineIndicator } from './components/PWAInstallButton';
import { PublicHome } from './components/PublicHome';
import { ResultLookupPage } from './components/ResultLookupPage';
import { AdmissionPortal } from './components/AdmissionPortal';
import { AuthPortal } from './components/AuthPortal';
import { SuperAdminPortal } from './components/portals/SuperAdminPortal';
import { TeacherPortal } from './components/portals/TeacherPortal';
import { StudentPortal } from './components/portals/StudentPortal';
import { ParentPortal } from './components/portals/ParentPortal';

type AppView = 'home' | 'results' | 'admission' | 'auth' | 'dashboard';

function AppInner() {
  const [view, setView] = useState<AppView>('home');
  const [lang, setLang] = useState<Language>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mdsm_lang') : null;
    return saved === 'bn' ? 'bn' : 'en';
  });

  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<PublicTeacher[]>([]);
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassRecord[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);

  const toggleLang = () => {
    const next: Language = lang === 'en' ? 'bn' : 'en';
    setLang(next);
    localStorage.setItem('mdsm_lang', next);
  };

  useEffect(() => {
    const unsubSettings = subscribeSiteSettings(setSettings);
    const unsubCourses = subscribeCollection<Course>('courses', setCourses, [
      where('status', '==', 'active'),
    ]);
    const unsubTeachers = subscribeCollection<PublicTeacher>('publicTeachers', setTeachers, [
      where('order', '>=', 0),
      orderBy('order', 'asc'),
    ]);
    const unsubClasses = subscribeCollection<ClassBatch>('classes', setClasses, [
      where('name', '!=', ''),
    ]);
    const unsubNotices = subscribeCollection<NoticeRecord>('notices', setNotices, [
      where('published', '==', true),
      where('targetRole', '==', 'all'),
    ]);
    const unsubLive = subscribeCollection<LiveClassRecord>('liveClasses', setLiveClasses, [
      where('status', 'in', ['scheduled', 'live', 'completed']),
    ]);

    return () => {
      unsubSettings();
      unsubCourses();
      unsubTeachers();
      unsubClasses();
      unsubNotices();
      unsubLive();
    };
  }, []);

  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      setExams([]);
      return;
    }
    const unsubExams = subscribeCollection<Examination>('examinations', setExams, [
      where('status', 'in', ['active', 'completed', 'published']),
    ]);
    return () => unsubExams();
  }, [firebaseUser]);

  const syncUserProfile = async (
    user: User,
    requestedRole?: UserRole,
    preferredName?: string
  ) => {
    if (!user.emailVerified || !user.email) {
      setUserProfile(null);
      return;
    }
    const resolvedName = resolveUserDisplayName(
      preferredName || user.displayName,
      user.email,
      requestedRole
    );
    const profile = await getOrCreateUserProfile(
      user.uid,
      user.email,
      resolvedName,
      requestedRole,
      user.photoURL || undefined
    );
    setUserProfile(profile);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && user.emailVerified) {
        try {
          await syncUserProfile(user);
        } catch (err) {
          console.error('Failed to sync profile:', err);
        }
      } else {
        setUserProfile(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      return;
    }
    const unsubProfile = subscribeUserProfile(firebaseUser.uid, (liveProfile) => {
      if (liveProfile) {
        setUserProfile(liveProfile);
      }
    });
    return () => unsubProfile();
  }, [firebaseUser?.uid, firebaseUser?.emailVerified]);

  const handleAuthenticated = async (requestedRole?: UserRole, preferredName?: string) => {
    if (!auth.currentUser) return;
    await syncUserProfile(auth.currentUser, requestedRole, preferredName);
    setView('dashboard');
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUserProfile(null);
    setView('home');
  };

  if (!authReady) {
    return <MadrasahLoadingScreen />;
  }

  return (
    <>
      {view === 'home' && (
        <PublicHome
          settings={settings}
          courses={courses}
          teachers={teachers}
          notices={notices}
          liveClasses={liveClasses}
          lang={lang}
          onToggleLang={toggleLang}
          userProfile={userProfile}
          onOpenAuth={() => setView('auth')}
          onOpenDashboard={() => setView('dashboard')}
          onOpenResults={() => setView('results')}
          onOpenAdmission={() => setView('admission')}
        />
      )}

      {view === 'results' && (
        <ResultLookupPage
          settings={settings}
          classes={classes}
          exams={exams}
          lang={lang}
          onBackHome={() => setView('home')}
        />
      )}

      {view === 'admission' && (
        <AdmissionPortal
          user={firebaseUser}
          classes={classes}
          settings={settings}
          lang={lang}
          onBackHome={() => setView('home')}
          onRequestAuth={() => setView('auth')}
        />
      )}

      {view === 'auth' && (
        <AuthPortal
          lang={lang}
          currentUser={firebaseUser}
          onAuthenticated={handleAuthenticated}
          onBackHome={() => setView('home')}
        />
      )}

      {view === 'dashboard' && userProfile && (
        <>
          {(userProfile.role === UserRole.SUPER_ADMIN || userProfile.role === UserRole.ADMIN) && (
            <SuperAdminPortal
              profile={userProfile}
              settings={settings}
              lang={lang}
              onToggleLang={toggleLang}
              onBackHome={() => setView('home')}
              onSignOut={handleSignOut}
            />
          )}

          {userProfile.role === UserRole.TEACHER && (
            <TeacherPortal
              profile={userProfile}
              settings={settings}
              lang={lang}
              onToggleLang={toggleLang}
              onBackHome={() => setView('home')}
              onSignOut={handleSignOut}
            />
          )}

          {userProfile.role === UserRole.STUDENT && (
            <StudentPortal
              profile={userProfile}
              settings={settings}
              lang={lang}
              onToggleLang={toggleLang}
              onBackHome={() => setView('home')}
              onSignOut={handleSignOut}
            />
          )}

          {userProfile.role === UserRole.PARENT && (
            <ParentPortal
              profile={userProfile}
              settings={settings}
              lang={lang}
              onToggleLang={toggleLang}
              onBackHome={() => setView('home')}
              onSignOut={handleSignOut}
            />
          )}
        </>
      )}

      {view === 'dashboard' && !userProfile && (
        <AuthPortal
          lang={lang}
          currentUser={firebaseUser}
          onAuthenticated={handleAuthenticated}
          onBackHome={() => setView('home')}
        />
      )}

      <OfflineIndicator lang={lang} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
