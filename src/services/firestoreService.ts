import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  AdmissionApplication,
  AssignmentRecord,
  AttendanceRecord,
  AuditLogRecord,
  CertificateRecord,
  ClassBatch,
  Course,
  DEFAULT_GRADING_RULES,
  Examination,
  FeeRecord,
  LessonRecord,
  LiveClassRecord,
  NoticeRecord,
  NotificationRecord,
  PublicTeacher,
  ResultRecord,
  SiteSettings,
  StudentRecord,
  StudyMaterialRecord,
  Subject,
  SubmissionRecord,
  TeacherRecord,
  UserProfile,
  UserRole,
} from '../types/madrasa';

export function clampStr(val: string | undefined | null, maxLen: number): string {
  return (val || '').trim().slice(0, maxLen);
}

export function cleanOptionalStr(val: string | undefined | null, maxLen: number): string | undefined {
  const s = (val || '').trim().slice(0, maxLen);
  return s.length > 0 ? s : undefined;
}

export function clearableStr(val: string | undefined | null, maxLen: number): string | undefined {
  if (val === undefined || val === null) return undefined;
  return val.trim().slice(0, maxLen);
}

const PLACEHOLDER_USER_NAMES = new Set(['unknown', 'unknown user', 'user', 'n/a', 'na', 'null', 'undefined', 'anonymous']);

export function isPlaceholderDisplayName(val?: string | null): boolean {
  const normalized = (val || '').trim().toLowerCase();
  return !normalized || PLACEHOLDER_USER_NAMES.has(normalized);
}

export function resolveUserDisplayName(
  candidate?: string | null,
  email?: string | null,
  role?: UserRole | string
): string {
  const cleaned = (candidate || '').trim();
  if (!isPlaceholderDisplayName(cleaned)) {
    return cleaned.slice(0, 120);
  }
  const emailPrefix = (email || '').split('@')[0]?.trim();
  if (emailPrefix && !isPlaceholderDisplayName(emailPrefix)) {
    return emailPrefix.slice(0, 120);
  }
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'Super Admin';
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.TEACHER:
      return 'Teacher';
    case UserRole.PARENT:
      return 'Parent / Guardian';
    case UserRole.STUDENT:
      return 'Student';
    default:
      return 'Madrasah Member';
  }
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  madrasaName: 'MEDER DHAR SHISHU MADRASAH',
  madrasaNameBn: 'মেদের ধার শিশু মাদ্রাসা',
  tagline: 'KNOWLEDGE · FAITH · SUCCESS',
  taglineBn: 'জ্ঞান · ঈমান · সাফল্য',
  establishedYear: '2002',
  motto: 'EDUCATION FOR A BETTER TOMORROW',
  heroTitle: 'Nurturing Faith, Character & Modern Islamic Scholarship',
  heroTitleBn: 'দ্বীনি শিক্ষা, নৈতিক চরিত্র ও আধুনিক জ্ঞানের সমন্বিত পাঠশালা',
  heroSubtitle:
    'Guided by qualified Islamic scholars, Meder Dhar Shishu Madrasah unites Quranic mastery, Arabic fluency, and contemporary academic excellence.',
  heroSubtitleBn:
    'অভিজ্ঞ আলেম ও শিক্ষকমণ্ডলীর তত্ত্বাবধানে কুরআন তাজবীদ, হিফজ, আরবি এবং আধুনিক সাধারণ শিক্ষার নির্ভরযোগ্য প্রতিষ্ঠান।',
  welcomeTitle: 'Welcome to Meder Dhar Shishu Madrasah',
  welcomeText:
    'Since 2002, our institution has served families with authentic Islamic education, moral discipline, and structured academic preparation from Noorani to Class X.',
  welcomeTextBn:
    '২০০২ সাল থেকে আমাদের মাদ্রাসা নূরানী থেকে দশম শ্রেণি পর্যন্ত দ্বীনি ও আধুনিক শিক্ষার মাধ্যমে আদর্শ মানুষ গড়ার লক্ষ্যে কাজ করে যাচ্ছে।',
  aboutText:
    'Meder Dhar Shishu Madrasah provides a balanced curriculum covering Quran Nazera & Hifz, Tajweed, Hadith, Fiqh, Arabic, Bengali, English, and Mathematics in both campus and online modes.',
  aboutTextBn:
    'মেদের ধার শিশু মাদ্রাসায় কুরআন নাযেরা ও হিফজ, তাজবীদ, হাদিস, ফিকহ, আরবি, বাংলা, ইংরেজি ও গণিতের সমন্বিত পাঠদান করা হয়।',
  principalName: 'Mawlana Abdur Rahman Al-Azhari',
  principalNameBn: 'মাওলানা আবদুর রহমান আল-আযহারী',
  principalTitle: 'Principal & Head Scholar',
  principalMessage:
    'True education illuminates both the heart and the intellect. Our commitment is to raise confident, God-conscious youth equipped for both Deen and Dunya.',
  principalMessageBn:
    'প্রকৃত শিক্ষা অন্তর ও মেধা উভয়কে আলোকিত করে। দ্বীন ও দুনিয়ার কল্যাণে যোগ্য, চরিত্রবান প্রজন্ম গড়ে তোলাই আমাদের অঙ্গীকার।',
  admissionOpen: true,
  admissionBannerText: 'Online Admissions Open for 2026 Academic Session — Noorani, Hifz & Class I–X',
  admissionBannerTextBn: '২০২৬ শিক্ষাবর্ষে নূরানী, হিফজ ও ১ম–১০ম শ্রেণিতে অনলাইন ভর্তি চলছে',
  address: 'Meder Dhar Madrasah Campus, Post Office Road, Bangladesh',
  addressBn: 'মেদের ধার মাদ্রাসা ক্যাম্পাস, পোস্ট অফিস রোড, বাংলাদেশ',
  phone: '+880 1700-000000',
  email: 'info@mederdharmadrasah.edu',
  socialLinks: {
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    whatsapp: 'https://wa.me/8801700000000',
  },
  gradingRules: DEFAULT_GRADING_RULES,
  passPercentage: 33,
  superAdminInitialized: false,
};

export async function logAudit(
  action: string,
  targetCollection: string,
  summary: string,
  targetId?: string,
  actorRole?: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  try {
    await addDoc(
      collection(db, 'auditLogs'),
      stripUndefined({
        actorUid: user.uid,
        actorEmail: clampStr(user.email, 160),
        actorRole: cleanOptionalStr(actorRole, 40),
        action: clampStr(action, 80),
        targetCollection: clampStr(targetCollection, 60),
        targetId: cleanOptionalStr(targetId, 128),
        summary: clampStr(summary, 400),
        createdAt: serverTimestamp(),
      })
    );
  } catch (err) {
    console.warn('Audit log write skipped:', err);
  }
}

export function subscribeSiteSettings(
  onData: (settings: SiteSettings) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'settings', 'main'),
    (snap) => {
      if (snap.exists()) {
        onData({ id: snap.id, ...DEFAULT_SITE_SETTINGS, ...(snap.data() as SiteSettings) });
      } else {
        onData(DEFAULT_SITE_SETTINGS);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, 'settings/main')
  );
}

export async function saveSiteSettings(
  settings: Partial<SiteSettings>,
  isCreate = false
): Promise<void> {
  const ref = doc(db, 'settings', 'main');
  const payload = stripUndefined({
    madrasaName: clampStr(settings.madrasaName || DEFAULT_SITE_SETTINGS.madrasaName, 140),
    madrasaNameBn: cleanOptionalStr(settings.madrasaNameBn, 140),
    tagline: cleanOptionalStr(settings.tagline, 200),
    taglineBn: cleanOptionalStr(settings.taglineBn, 200),
    establishedYear: clampStr(settings.establishedYear || '2002', 20),
    motto: cleanOptionalStr(settings.motto, 160),
    heroTitle: cleanOptionalStr(settings.heroTitle, 200),
    heroTitleBn: cleanOptionalStr(settings.heroTitleBn, 200),
    heroSubtitle: cleanOptionalStr(settings.heroSubtitle, 400),
    heroSubtitleBn: cleanOptionalStr(settings.heroSubtitleBn, 400),
    welcomeTitle: cleanOptionalStr(settings.welcomeTitle, 200),
    welcomeText: cleanOptionalStr(settings.welcomeText, 1500),
    welcomeTextBn: cleanOptionalStr(settings.welcomeTextBn, 1500),
    aboutText: cleanOptionalStr(settings.aboutText, 2000),
    aboutTextBn: cleanOptionalStr(settings.aboutTextBn, 2000),
    principalName: cleanOptionalStr(settings.principalName, 120),
    principalNameBn: cleanOptionalStr(settings.principalNameBn, 120),
    principalTitle: cleanOptionalStr(settings.principalTitle, 120),
    principalMessage: cleanOptionalStr(settings.principalMessage, 1500),
    principalMessageBn: cleanOptionalStr(settings.principalMessageBn, 1500),
    principalPhotoUrl: clearableStr(settings.principalPhotoUrl, 500),
    principalPhotoPublicId: clearableStr(settings.principalPhotoPublicId, 240),
    logoUrl: clearableStr(settings.logoUrl, 500),
    logoPublicId: clearableStr(settings.logoPublicId, 240),
    heroBannerUrl: clearableStr(settings.heroBannerUrl, 500),
    heroBannerPublicId: clearableStr(settings.heroBannerPublicId, 240),
    admissionBannerUrl: clearableStr(settings.admissionBannerUrl, 500),
    admissionBannerPublicId: clearableStr(settings.admissionBannerPublicId, 240),
    certificateSealUrl: clearableStr(settings.certificateSealUrl, 500),
    certificateSealPublicId: clearableStr(settings.certificateSealPublicId, 240),
    cloudinaryImageUrl: clearableStr(settings.cloudinaryImageUrl, 500),
    cloudinaryPublicId: clearableStr(settings.cloudinaryPublicId, 240),
    uploadedAt: clearableStr(settings.uploadedAt, 60),
    admissionOpen: settings.admissionOpen ?? true,
    admissionBannerText: cleanOptionalStr(settings.admissionBannerText, 300),
    admissionBannerTextBn: cleanOptionalStr(settings.admissionBannerTextBn, 300),
    address: cleanOptionalStr(settings.address, 300),
    addressBn: cleanOptionalStr(settings.addressBn, 300),
    phone: cleanOptionalStr(settings.phone, 50),
    email: cleanOptionalStr(settings.email, 140),
    socialLinks: settings.socialLinks,
    gradingRules: settings.gradingRules,
    passPercentage: settings.passPercentage,
    superAdminInitialized: settings.superAdminInitialized,
    updatedByUid: auth.currentUser?.uid,
    updatedAt: serverTimestamp(),
  });
  try {
    if (isCreate) {
      await setDoc(ref, payload);
    } else {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, payload);
      } else {
        await setDoc(ref, payload);
      }
    }
    await logAudit('UPDATE_SETTINGS', 'settings', 'Updated Madrasah website settings and branding', 'main');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/main');
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const raw = snap.data() as UserProfile;
      onData({
        id: snap.id,
        ...raw,
        displayName: resolveUserDisplayName(raw.displayName, raw.email, raw.role),
      });
    },
    (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
  );
}

export async function getOrCreateUserProfile(
  uid: string,
  email: string,
  displayName: string,
  requestedRole: UserRole = UserRole.STUDENT,
  photoUrl?: string
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid);
  const safePhoto = cleanOptionalStr(photoUrl, 500);
  const isOwnerEmail = email.trim().toLowerCase() === 'cg9868033@gmail.com';

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existing = { id: snap.id, ...(snap.data() as UserProfile) };
      const resolvedName = resolveUserDisplayName(
        !isPlaceholderDisplayName(existing.displayName) ? existing.displayName : displayName,
        existing.email || email,
        isOwnerEmail ? UserRole.SUPER_ADMIN : existing.role
      );

      const patch: Record<string, unknown> = {};
      if (isPlaceholderDisplayName(existing.displayName) || existing.displayName !== resolvedName) {
        if (isPlaceholderDisplayName(existing.displayName)) {
          patch.displayName = resolvedName;
        }
      }
      if (!existing.photoUrl && safePhoto) {
        patch.photoUrl = safePhoto;
        if (safePhoto.includes('res.cloudinary.com') && !existing.cloudinaryImageUrl) {
          patch.cloudinaryImageUrl = safePhoto;
        }
      }
      if (isOwnerEmail && (existing.role !== UserRole.SUPER_ADMIN || existing.status !== 'active')) {
        patch.role = UserRole.SUPER_ADMIN;
        patch.status = 'active';
        patch.permissions = ['all', 'publish_results'];
      }

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = serverTimestamp();
        await updateDoc(userRef, patch);
        const refreshed = await getDoc(userRef);
        const refreshedData = refreshed.data() as UserProfile;
        return {
          id: refreshed.id,
          ...refreshedData,
          displayName: resolveUserDisplayName(refreshedData.displayName, refreshedData.email, refreshedData.role),
        };
      }

      return {
        ...existing,
        displayName: resolveUserDisplayName(existing.displayName, existing.email, existing.role),
      };
    }

    const role: UserRole = isOwnerEmail
      ? UserRole.SUPER_ADMIN
      : requestedRole === UserRole.SUPER_ADMIN || requestedRole === UserRole.ADMIN
        ? UserRole.STUDENT
        : requestedRole;
    const status = role === UserRole.TEACHER ? 'pending' : 'active';
    const resolvedName = resolveUserDisplayName(displayName, email, role);

    const profilePayload = stripUndefined({
      uid,
      email: clampStr(email, 160),
      displayName: clampStr(resolvedName, 120),
      role,
      status,
      photoUrl: safePhoto,
      cloudinaryImageUrl: safePhoto && safePhoto.includes('res.cloudinary.com') ? safePhoto : undefined,
      permissions: role === UserRole.SUPER_ADMIN ? ['all', 'publish_results'] : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(userRef, profilePayload);

    if (role === UserRole.TEACHER) {
      const teacherRef = doc(db, 'teachers', uid);
      await setDoc(
        teacherRef,
        stripUndefined({
          userId: uid,
          teacherCode: `TCH-${uid.slice(0, 6).toUpperCase()}`,
          fullName: clampStr(resolvedName, 120),
          qualification: 'Pending Verification',
          email: clampStr(email, 160),
          photoUrl: safePhoto,
          cloudinaryImageUrl: safePhoto && safePhoto.includes('res.cloudinary.com') ? safePhoto : undefined,
          status: 'pending',
          canPublishResults: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    }

    const createdSnap = await getDoc(userRef);
    const createdData = createdSnap.data() as UserProfile;
    return {
      id: createdSnap.id,
      ...createdData,
      displayName: resolveUserDisplayName(createdData.displayName, createdData.email, createdData.role),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export function subscribeCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  constraints: Parameters<typeof query>[1][] = []
): Unsubscribe {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      onData(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, collectionName)
  );
}

export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: T,
  customId?: string
): Promise<string> {
  try {
    const payload = stripUndefined({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (customId) {
      await setDoc(doc(db, collectionName, customId), payload);
      return customId;
    }
    const ref = await addDoc(collection(db, collectionName), payload);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  try {
    await updateDoc(
      doc(db, collectionName, id),
      stripUndefined({
        ...data,
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

export async function lookupPublishedResults(filters: {
  admissionNo?: string;
  rollNo?: string;
  classId?: string;
  session?: string;
  examId?: string;
}): Promise<ResultRecord[]> {
  try {
    const clauses = [where('approvalStatus', '==', 'published')];
    if (filters.session) clauses.push(where('session', '==', filters.session));
    if (filters.classId) clauses.push(where('classId', '==', filters.classId));
    if (filters.examId) clauses.push(where('examId', '==', filters.examId));

    const snap = await getDocs(query(collection(db, 'results'), ...clauses));
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResultRecord);

    if (filters.admissionNo && filters.admissionNo.trim()) {
      const needle = filters.admissionNo.trim().toLowerCase();
      items = items.filter((r) => r.admissionNo.toLowerCase() === needle);
    }
    if (filters.rollNo && filters.rollNo.trim()) {
      const needle = filters.rollNo.trim().toLowerCase();
      items = items.filter((r) => r.rollNo.toLowerCase() === needle);
    }
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'results');
  }
}

export async function verifyCertificateByNumber(
  verificationNo: string
): Promise<CertificateRecord | null> {
  try {
    const q = query(
      collection(db, 'certificates'),
      where('status', '==', 'active'),
      where('verificationNo', '==', verificationNo.trim())
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as CertificateRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'certificates');
  }
}

export async function initializeMadrasahPlatform(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in as Super Admin to initialize.');

  await saveSiteSettings(
    {
      ...DEFAULT_SITE_SETTINGS,
      superAdminInitialized: true,
    },
    true
  );

  const batch = writeBatch(db);

  const classes: Omit<ClassBatch, 'id'>[] = [
    { name: 'Noorani', nameBn: 'নূরানী বিভাগ', code: 'NRN', session: '2026', batchName: 'Morning Batch A', capacity: 45 },
    { name: 'Hifz-ul-Quran', nameBn: 'হিফজুল কুরআন', code: 'HFZ', session: '2026', batchName: 'Hifz A', capacity: 30 },
    { name: 'Class V', nameBn: 'পঞ্চম শ্রেণি', code: 'V', session: '2026', batchName: 'Section A', capacity: 40 },
    { name: 'Class X', nameBn: 'দশম শ্রেণি', code: 'X', session: '2026', batchName: 'Alim Prep', capacity: 40 },
  ];
  const classIds: string[] = [];
  for (const c of classes) {
    const ref = doc(collection(db, 'classes'));
    classIds.push(ref.id);
    batch.set(ref, stripUndefined({ ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  }

  const subjects: Omit<Subject, 'id'>[] = [
    { name: 'বাংলা (Bangla)', nameBn: 'বাংলা', code: 'BN-101', classId: classIds[3], fullMarks: 100, passMarks: 33 },
    { name: 'English', nameBn: 'ইংরেজি', code: 'EN-102', classId: classIds[3], fullMarks: 100, passMarks: 33 },
    { name: 'আরবি (Arabic)', nameBn: 'আরবি', code: 'AR-103', classId: classIds[3], fullMarks: 100, passMarks: 33 },
    { name: 'গণিত (Mathematics)', nameBn: 'গণিত', code: 'MT-104', classId: classIds[3], fullMarks: 100, passMarks: 33 },
    { name: 'Quran Tajweed', nameBn: 'কুরআন তাজবীদ', code: 'QT-105', classId: classIds[0], fullMarks: 100, passMarks: 40 },
    { name: 'Fiqh & Aqeedah', nameBn: 'ফিকহ ও আকীদা', code: 'FQ-106', classId: classIds[2], fullMarks: 100, passMarks: 33 },
  ];
  for (const s of subjects) {
    const ref = doc(collection(db, 'subjects'));
    batch.set(ref, stripUndefined({ ...s, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  }

  const courses: Omit<Course, 'id'>[] = [
    {
      title: 'Noorani & Qaida Foundation',
      titleBn: 'নূরানী ও কায়দা শিক্ষা',
      category: 'Noorani Education',
      categoryBn: 'নূরানী শিক্ষা',
      description: 'Foundational Arabic phonetics, Makharij mastery, and essential daily duas for young learners.',
      descriptionBn: 'শিশুদের জন্য বিশুদ্ধ মাখরাজ, আরবি হরফ এবং দৈনন্দিন প্রয়োজনীয় দোয়া শিক্ষা।',
      level: 'Beginner',
      duration: '1 Year',
      featured: true,
      status: 'active',
    },
    {
      title: 'Quran Tajweed Mastery',
      titleBn: 'বিশুদ্ধ কুরআন তাজবীদ',
      category: 'Quran Tajweed',
      categoryBn: 'কুরআন তাজবীদ',
      description: 'Structured recitation rules covering Madd, Idgham, Ikhfa, and Sifaat with live scholar correction.',
      descriptionBn: 'মাদ্দ, ইদগাম, ইখফা ও সিফাতসহ বিশুদ্ধ তিলাওয়াতের ব্যবহারিক প্রশিক্ষণ।',
      level: 'Intermediate',
      duration: '6 Months',
      featured: true,
      status: 'active',
    },
    {
      title: 'Hifz-ul-Quran Program',
      titleBn: 'হিফজুল কুরআন বিভাগ',
      category: 'Hifz',
      categoryBn: 'হিফজ',
      description: 'Supervised complete memorization of the Noble Quran with daily Sabak, Sabqi, and Manzil tracking.',
      descriptionBn: 'সবক, সবকী ও মনযিলের নিবিড় তত্ত্বাবধানে পূর্ণ কুরআন হিফজ কার্যক্রম।',
      level: 'Full Track',
      duration: '3 Years',
      featured: true,
      status: 'active',
    },
    {
      title: 'Hadith & Sunnah Studies',
      titleBn: 'হাদিস ও সুন্নাহ শিক্ষা',
      category: 'Hadith',
      categoryBn: 'হাদিস',
      description: 'Study of Arbaeen Nawawi, Riyadus Saliheen, and practical prophetic character.',
      descriptionBn: 'আরবাঈন নববী, রিয়াদুস সালেহীন ও সুন্নাহভিত্তিক আদব-আখলাক পাঠ।',
      level: 'Intermediate',
      duration: '1 Year',
      featured: true,
      status: 'active',
    },
    {
      title: 'Fiqh & Islamic Jurisprudence',
      titleBn: 'ফিকহ ও ইসলামী আইনশাস্ত্র',
      category: 'Fiqh',
      categoryBn: 'ফিকহ',
      description: 'Practical jurisprudence covering Taharah, Salah, Sawm, Zakah, and contemporary Islamic ethics.',
      descriptionBn: 'পবিত্রতা, সালাত, সিয়াম, যাকাত ও সমসাময়িক মাসআলা-মাসায়েল শিক্ষা।',
      level: 'Intermediate',
      duration: '1 Year',
      featured: false,
      status: 'active',
    },
    {
      title: 'Classical & Spoken Arabic',
      titleBn: 'আরবি ভাষা ও সাহিত্য',
      category: 'Arabic Language',
      categoryBn: 'আরবি ভাষা',
      description: 'Nahw, Sarf, and conversational Arabic enabling direct comprehension of Islamic texts.',
      descriptionBn: 'নাহু, সরফ এবং ব্যবহারিক আরবি কথোপকথন প্রশিক্ষণ।',
      level: 'All Levels',
      duration: '1 Year',
      featured: true,
      status: 'active',
    },
  ];
  for (const c of courses) {
    const ref = doc(collection(db, 'courses'));
    batch.set(ref, stripUndefined({ ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  }

  const publicTeachers: Omit<PublicTeacher, 'id'>[] = [
    {
      name: 'Mawlana Abdur Rahman',
      nameBn: 'মাওলানা আবদুর রহমান',
      title: 'Principal & Shaykhul Hadith',
      titleBn: 'অধ্যক্ষ ও শায়খুল হাদিস',
      qualification: 'Dawra-e-Hadith, Kamil (Hadith)',
      qualificationBn: 'দাওরায়ে হাদিস, কামিল (হাদিস)',
      experienceYears: 18,
      bio: 'Dedicated to nurturing Quranic scholarship and ethical excellence for nearly two decades.',
      bioBn: 'দীর্ঘ ১৮ বছর ধরে দ্বীনি শিক্ষা ও নৈতিক চরিত্র গঠনে নিবেদিতপ্রাণ।',
      subjects: ['Hadith', 'Fiqh', 'Arabic'],
      featured: true,
      order: 1,
    },
    {
      name: 'Qari Hafiz Tariqul Islam',
      nameBn: 'কারী হাফেজ তারিকুল ইসলাম',
      title: 'Senior Hifz & Tajweed Ustadh',
      titleBn: 'প্রধান হিফজ ও তাজবীদ উস্তাদ',
      qualification: 'Hafiz-ul-Quran, Sanad in Qiraat',
      qualificationBn: 'হাফেজে কুরআন, কিরাত সনদপ্রাপ্ত',
      experienceYears: 12,
      bio: 'Trained over 120 Huffaz with distinction in national Qiraat competitions.',
      bioBn: 'জাতীয় পর্যায়ের কিরাত প্রতিযোগিতায় অংশগ্রহণকারী ১২০+ হাফেজদের প্রশিক্ষক।',
      subjects: ['Hifz', 'Quran Tajweed'],
      featured: true,
      order: 2,
    },
    {
      name: 'Ustadha Maryam Siddiqa',
      nameBn: 'উস্তাদা মারইয়াম সিদ্দিকা',
      title: 'Noorani & General Studies Lead',
      titleBn: 'নূরানী ও সাধারণ শিক্ষা সমন্বয়ক',
      qualification: 'Kamil (Tafsir), B.Ed',
      qualificationBn: 'কামিল (তাফসীর), বি.এড',
      experienceYears: 9,
      bio: 'Specializes in early childhood Noorani pedagogy, Bangla, and English foundations.',
      bioBn: 'শিশুদের নূরানী পদ্ধতিতে কুরআন শিক্ষা ও বাংলা-ইংরেজি ভিত্তি গঠনে বিশেষজ্ঞ।',
      subjects: ['Noorani', 'Bangla', 'English'],
      featured: true,
      order: 3,
    },
  ];
  for (const pt of publicTeachers) {
    const ref = doc(collection(db, 'publicTeachers'));
    batch.set(ref, stripUndefined({ ...pt, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  }

  const notices: Omit<NoticeRecord, 'id'>[] = [
    {
      title: '2026 Academic Session Online Admissions Open',
      titleBn: '২০২৬ শিক্ষাবর্ষের অনলাইন ভর্তি কার্যক্রম শুরু',
      content:
        'Applications are now open for Noorani, Nazera, Hifz, and Classes I–X. Guardians may submit applications online via the Admission Portal.',
      contentBn:
        'নূরানী, নাযেরা, হিফজ এবং ১ম–১০ম শ্রেণিতে ভর্তি আবেদন চলছে। অভিভাবকগণ অনলাইন ভর্তি পোর্টাল থেকে আবেদন করতে পারবেন।',
      category: 'Admission',
      priority: 'important',
      targetRole: 'all',
      published: true,
      authorUid: user.uid,
      authorName: user.displayName || 'Madrasah Administration',
    },
    {
      title: 'Annual Examination Schedule & Marksheet Verification',
      titleBn: 'বার্ষিক পরীক্ষার সময়সূচি ও ডিজিটাল মার্কশিট',
      content:
        'Published examination results can be checked anytime from the Official Result Lookup portal using your Admission No. and Roll No.',
      contentBn:
        'প্রকাশিত পরীক্ষার ফলাফল ও পিডিএফ মার্কশিট ভর্তি নম্বর ও রোল নম্বর ব্যবহার করে রেজাল্ট পোর্টাল থেকে ডাউনলোড করা যাবে।',
      category: 'Examination',
      priority: 'normal',
      targetRole: 'all',
      published: true,
      authorUid: user.uid,
      authorName: user.displayName || 'Controller of Examinations',
    },
  ];
  for (const n of notices) {
    const ref = doc(collection(db, 'notices'));
    batch.set(ref, stripUndefined({ ...n, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  }

  const liveClasses: Omit<LiveClassRecord, 'id'>[] = [
    {
      title: 'Surah Al-Mulk Tajweed & Makharij Workshop',
      titleBn: 'সূরা মুলক তাজবীদ ও মাখরাজ কর্মশালা',
      courseTitle: 'Quran Tajweed Mastery',
      classId: classIds[0],
      className: 'Noorani',
      teacherUid: user.uid,
      teacherName: 'Qari Hafiz Tariqul Islam',
      scheduledAt: 'Daily · 08:00 AM (GMT+6)',
      durationMinutes: 45,
      provider: 'Jitsi',
      meetingUrl: 'https://meet.jit.si/MederDharShishuMadrasahTajweed',
      status: 'scheduled',
    },
    {
      title: 'Arabic Grammar (Nahw) Live Interactive Session',
      titleBn: 'আরবি ব্যাকরণ (নাহু) লাইভ ক্লাস',
      courseTitle: 'Classical & Spoken Arabic',
      classId: classIds[3],
      className: 'Class X',
      teacherUid: user.uid,
      teacherName: 'Mawlana Abdur Rahman',
      scheduledAt: 'Sun & Tue · 04:30 PM (GMT+6)',
      durationMinutes: 60,
      provider: 'Google Meet',
      meetingUrl: 'https://meet.google.com',
      status: 'scheduled',
    },
  ];
  for (const lc of liveClasses) {
    const ref = doc(collection(db, 'liveClasses'));
    batch.set(ref, stripUndefined({ ...lc, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  }

  await batch.commit();
  await logAudit('INITIALIZE_PLATFORM', 'settings', 'Initialized Madrasah classes, subjects, courses, faculty, and notices', 'main', 'super_admin');
}

export type {
  AdmissionApplication,
  AssignmentRecord,
  AttendanceRecord,
  AuditLogRecord,
  CertificateRecord,
  ClassBatch,
  Course,
  Examination,
  FeeRecord,
  LessonRecord,
  LiveClassRecord,
  NoticeRecord,
  NotificationRecord,
  PublicTeacher,
  ResultRecord,
  SiteSettings,
  StudentRecord,
  StudyMaterialRecord,
  Subject,
  SubmissionRecord,
  TeacherRecord,
  UserProfile,
};
