import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ACADEMIC_DIVISIONS,
  CALENDAR_EVENTS,
  CAMPUS_SPACES,
  DAILY_SCHEDULE,
  DEFAULT_POSTS,
  DEFAULT_SCHOOL_SETTINGS,
  DEFAULT_TESTIMONIALS,
  FACULTY_MEMBERS,
  PRIMARY_OWNER_EMAIL,
  type AcademicDivision,
  type AdminEmailRecord,
  type AdmissionsInquiryRecord,
  type CalendarEvent,
  type CampusSpace,
  type DailyScheduleRow,
  type FacultyMember,
  type PostCategory,
  type SchoolPost,
  type SchoolSettings,
  type SchoolTestimonial,
  type TestimonialVoiceType,
} from '../data/schoolData';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

export interface NewPostPayload {
  title: string;
  category: PostCategory;
  summary: string;
  body: string;
  authorName: string;
  published: boolean;
  pinned: boolean;
  imageUrl?: string;
}

export interface NewInquiryPayload {
  parentName: string;
  contact: string;
  gradeLevel: string;
  inquiryType: string;
  message: string;
}

export interface NewTestimonialPayload {
  authorName: string;
  roleLabel: string;
  voiceType: TestimonialVoiceType;
  gradeContext: string;
  quote: string;
  featured: boolean;
  published: boolean;
}

interface SchoolDataContextValue {
  user: User | null;
  authReady: boolean;
  isPrimaryOwner: boolean;
  isAdmin: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;

  settings: SchoolSettings;
  posts: SchoolPost[];
  academics: AcademicDivision[];
  campusSpaces: CampusSpace[];
  faculty: FacultyMember[];
  testimonials: SchoolTestimonial[];
  testimonialsLoading: boolean;
  calendarEvents: CalendarEvent[];
  dailySchedule: DailyScheduleRow[];
  inquiries: AdmissionsInquiryRecord[];
  adminEmails: AdminEmailRecord[];
  hasSyncedFromDb: boolean;

  saveSchoolSettings: (next: SchoolSettings) => Promise<void>;
  savePost: (payload: NewPostPayload, existingId?: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  saveAcademicDivision: (division: AcademicDivision) => Promise<void>;
  deleteAcademicDivision: (id: string) => Promise<void>;
  saveCampusSpace: (space: CampusSpace) => Promise<void>;
  deleteCampusSpace: (id: string) => Promise<void>;
  saveFacultyMember: (member: Omit<FacultyMember, 'id'>, existingId?: string) => Promise<void>;
  deleteFacultyMember: (id: string) => Promise<void>;
  saveTestimonial: (payload: NewTestimonialPayload, existingId?: string) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  saveCalendarEvent: (event: Omit<CalendarEvent, 'id'>, existingId?: string) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  saveDailyScheduleSlot: (slot: Omit<DailyScheduleRow, 'id'>, existingId?: string) => Promise<void>;
  deleteDailyScheduleSlot: (id: string) => Promise<void>;
  submitInquiry: (payload: NewInquiryPayload) => Promise<string>;
  updateInquiryStatus: (
    id: string,
    status: AdmissionsInquiryRecord['status'],
    ownerNotes: string,
  ) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  addCoAdminEmail: (email: string, label: string) => Promise<void>;
  removeCoAdminEmail: (email: string) => Promise<void>;
  seedAllDefaultsToFirestore: () => Promise<void>;
}

const SchoolDataContext = createContext<SchoolDataContextValue | null>(null);

function makeSlugId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

function formatDateFromTimestamp(ts: unknown): { ms: number; label: string } {
  if (ts instanceof Timestamp) {
    const date = ts.toDate();
    return {
      ms: date.getTime(),
      label: date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
  }
  return {
    ms: Date.now(),
    label: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  };
}

export function SchoolDataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isCoAdmin, setIsCoAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [dbSettings, setDbSettings] = useState<SchoolSettings | null>(null);
  const [dbPosts, setDbPosts] = useState<SchoolPost[] | null>(null);
  const [dbAcademics, setDbAcademics] = useState<AcademicDivision[] | null>(null);
  const [dbSpaces, setDbSpaces] = useState<CampusSpace[] | null>(null);
  const [dbFaculty, setDbFaculty] = useState<FacultyMember[] | null>(null);
  const [dbTestimonials, setDbTestimonials] = useState<SchoolTestimonial[] | null>(null);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [dbEvents, setDbEvents] = useState<CalendarEvent[] | null>(null);
  const [dbSchedule, setDbSchedule] = useState<DailyScheduleRow[] | null>(null);
  const [inquiries, setInquiries] = useState<AdmissionsInquiryRecord[]>([]);
  const [adminEmails, setAdminEmails] = useState<AdminEmailRecord[]>([]);

  const isPrimaryOwner = Boolean(
    user?.emailVerified && user.email?.toLowerCase() === PRIMARY_OWNER_EMAIL,
  );
  const isAdmin = isPrimaryOwner || isCoAdmin;

  // Auth listener & co-admin verification
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setIsCoAdmin(false);

      if (nextUser?.emailVerified && nextUser.email) {
        const lower = nextUser.email.toLowerCase();
        if (lower !== PRIMARY_OWNER_EMAIL) {
          try {
            const snap = await getDoc(doc(db, 'adminEmails', lower));
            setIsCoAdmin(snap.exists());
          } catch (error) {
            console.error('Co-admin lookup failed:', error);
            setIsCoAdmin(false);
          }
        }
      }

      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  const isPermissionError = (err: unknown): boolean => {
    const code = (err as { code?: string })?.code;
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    return code === 'permission-denied' || msg.includes('permission');
  };

  const refreshPublicCatalog = async () => {
    try {
      const [settingsSnap, academicsSnap, spacesSnap, facultySnap, eventsSnap, scheduleSnap] =
        await Promise.all([
          getDoc(doc(db, 'schoolSettings', 'main')),
          getDocs(collection(db, 'academics')),
          getDocs(collection(db, 'campusSpaces')),
          getDocs(collection(db, 'faculty')),
          getDocs(collection(db, 'calendarEvents')),
          getDocs(collection(db, 'dailySchedule')),
        ]);

      if (settingsSnap.exists()) {
        const d = settingsSnap.data();
        setDbSettings({
          schoolName: String(d.schoolName ?? DEFAULT_SCHOOL_SETTINGS.schoolName),
          tagline: String(d.tagline ?? DEFAULT_SCHOOL_SETTINGS.tagline),
          locationLabel: String(d.locationLabel ?? DEFAULT_SCHOOL_SETTINGS.locationLabel),
          heroTitle: String(d.heroTitle ?? DEFAULT_SCHOOL_SETTINGS.heroTitle),
          heroSubtitle: String(d.heroSubtitle ?? DEFAULT_SCHOOL_SETTINGS.heroSubtitle),
          gradesServed: String(d.gradesServed ?? DEFAULT_SCHOOL_SETTINGS.gradesServed),
          languages: String(d.languages ?? DEFAULT_SCHOOL_SETTINGS.languages),
          schoolHours: String(d.schoolHours ?? DEFAULT_SCHOOL_SETTINGS.schoolHours),
          contactEmail: String(d.contactEmail ?? DEFAULT_SCHOOL_SETTINGS.contactEmail),
          campusAddress: String(d.campusAddress ?? DEFAULT_SCHOOL_SETTINGS.campusAddress),
          officeHours: String(d.officeHours ?? DEFAULT_SCHOOL_SETTINGS.officeHours),
          historyNote: String(d.historyNote ?? DEFAULT_SCHOOL_SETTINGS.historyNote),
          plePassRate: String(d.plePassRate ?? DEFAULT_SCHOOL_SETTINGS.plePassRate),
        });
      } else {
        setDbSettings(null);
      }

      if (academicsSnap.empty) {
        setDbAcademics(null);
      } else {
        setDbAcademics(
          academicsSnap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                order: Number(data.order ?? 1),
                label: String(data.label ?? ''),
                grades: String(data.grades ?? ''),
                ageRange: String(data.ageRange ?? ''),
                headline: String(data.headline ?? ''),
                summary: String(data.summary ?? ''),
                image: String(data.image ?? ''),
                imageAlt: String(data.imageAlt ?? ''),
                figureCaption: String(data.figureCaption ?? ''),
                weeklyHours: Number(data.weeklyHours ?? 20),
                classSize: String(data.classSize ?? ''),
                subjects: Array.isArray(data.subjects) ? data.subjects : [],
                milestones: Array.isArray(data.milestones) ? data.milestones : [],
              } as AcademicDivision;
            })
            .sort((a, b) => a.order - b.order),
        );
      }

      if (spacesSnap.empty) {
        setDbSpaces(null);
      } else {
        setDbSpaces(
          spacesSnap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                order: Number(data.order ?? 1),
                indexLabel: String(data.indexLabel ?? ''),
                title: String(data.title ?? ''),
                subtitle: String(data.subtitle ?? ''),
                description: String(data.description ?? ''),
                highlights: Array.isArray(data.highlights) ? data.highlights : [],
                image: String(data.image ?? ''),
                imageAlt: String(data.imageAlt ?? ''),
                figureNumber: String(data.figureNumber ?? ''),
                featured: Boolean(data.featured),
              } as CampusSpace;
            })
            .sort((a, b) => a.order - b.order),
        );
      }

      if (facultySnap.empty) {
        setDbFaculty(null);
      } else {
        setDbFaculty(
          facultySnap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                name: String(data.name ?? ''),
                initials: String(data.initials ?? ''),
                role: String(data.role ?? ''),
                department: data.department,
                subjects: String(data.subjects ?? ''),
                yearsAtSchool: Number(data.yearsAtSchool ?? 1),
                bio: String(data.bio ?? ''),
              } as FacultyMember;
            })
            .sort((a, b) => b.yearsAtSchool - a.yearsAtSchool),
        );
      }

      if (eventsSnap.empty) {
        setDbEvents(null);
      } else {
        setDbEvents(
          eventsSnap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                dateISO: String(data.dateISO ?? ''),
                displayDate: String(data.displayDate ?? ''),
                monthLabel: String(data.monthLabel ?? ''),
                dayNumber: String(data.dayNumber ?? ''),
                timeRange: String(data.timeRange ?? ''),
                category: data.category,
                title: String(data.title ?? ''),
                location: String(data.location ?? ''),
                description: String(data.description ?? ''),
              } as CalendarEvent;
            })
            .sort((a, b) => a.dateISO.localeCompare(b.dateISO)),
        );
      }

      if (scheduleSnap.empty) {
        setDbSchedule(null);
      } else {
        setDbSchedule(
          scheduleSnap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                order: Number(data.order ?? 1),
                time: String(data.time ?? ''),
                activity: String(data.activity ?? ''),
                notes: String(data.notes ?? ''),
              } as DailyScheduleRow;
            })
            .sort((a, b) => a.order - b.order),
        );
      }
    } catch (err) {
      if (isPermissionError(err)) {
        handleFirestoreError(err, OperationType.LIST, 'public-catalog');
      }
      console.warn('Using bundled default school content while Firestore is unreachable:', err);
    }
  };

  // Load public catalog on initial mount
  useEffect(() => {
    void refreshPublicCatalog();
  }, []);

  // Load posts (one-shot for public visitors, live onSnapshot when signed in as admin)
  useEffect(() => {
    if (!authReady) return;

    const mapPosts = (docs: { id: string; data: () => Record<string, unknown> }[]): SchoolPost[] =>
      docs
        .map((d) => {
          const data = d.data();
          const parsedTime = formatDateFromTimestamp(data.createdAt);
          return {
            id: d.id,
            title: String(data.title ?? ''),
            category: (data.category ?? 'Announcements') as PostCategory,
            summary: String(data.summary ?? ''),
            body: String(data.body ?? ''),
            authorName: String(data.authorName ?? 'School Office'),
            authorEmail: String(data.authorEmail ?? PRIMARY_OWNER_EMAIL),
            published: Boolean(data.published),
            pinned: Boolean(data.pinned),
            imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
            createdAtMs: parsedTime.ms,
            displayDate: parsedTime.label,
          } as SchoolPost;
        })
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.createdAtMs - a.createdAtMs;
        });

    if (!isAdmin) {
      void getDocs(query(collection(db, 'posts'), where('published', '==', true)))
        .then((snap) => {
          setDbPosts(snap.empty ? null : mapPosts(snap.docs));
        })
        .catch((err) => {
          if (isPermissionError(err)) {
            handleFirestoreError(err, OperationType.LIST, 'posts');
          }
          console.warn('Using bundled default posts while Firestore is unreachable:', err);
        });
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'posts'),
      (snap) => {
        setDbPosts(snap.empty ? null : mapPosts(snap.docs));
      },
      (err) => {
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.LIST, 'posts');
        }
        console.warn('Posts live listener warning:', err);
      },
    );

    return () => unsub();
  }, [authReady, isAdmin]);

  // Load parent & student testimonials (one-shot for public visitors, live onSnapshot when signed in as admin)
  useEffect(() => {
    if (!authReady) return;

    const mapTestimonials = (
      docs: { id: string; data: () => Record<string, unknown> }[],
    ): SchoolTestimonial[] =>
      docs
        .map((d) => {
          const data = d.data();
          const parsedTime = formatDateFromTimestamp(data.createdAt);
          return {
            id: d.id,
            authorName: String(data.authorName ?? ''),
            roleLabel: String(data.roleLabel ?? ''),
            voiceType: (data.voiceType === 'Student' ? 'Student' : 'Parent') as TestimonialVoiceType,
            gradeContext: String(data.gradeContext ?? ''),
            quote: String(data.quote ?? ''),
            featured: Boolean(data.featured),
            published: Boolean(data.published),
            createdAtMs: parsedTime.ms,
            displayDate: parsedTime.label,
          };
        })
        .sort((a, b) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return b.createdAtMs - a.createdAtMs;
        });

    if (!isAdmin) {
      setTestimonialsLoading(true);
      void getDocs(query(collection(db, 'testimonials'), where('published', '==', true)))
        .then((snap) => {
          setDbTestimonials(snap.empty ? null : mapTestimonials(snap.docs));
        })
        .catch((err) => {
          if (isPermissionError(err)) {
            handleFirestoreError(err, OperationType.LIST, 'testimonials');
          }
          console.warn('Using bundled default testimonials while Firestore is unreachable:', err);
        })
        .finally(() => {
          setTestimonialsLoading(false);
        });
      return;
    }

    setTestimonialsLoading(true);
    const unsub = onSnapshot(
      collection(db, 'testimonials'),
      (snap) => {
        setDbTestimonials(snap.empty ? null : mapTestimonials(snap.docs));
        setTestimonialsLoading(false);
      },
      (err) => {
        setTestimonialsLoading(false);
        if (isPermissionError(err)) {
          handleFirestoreError(err, OperationType.LIST, 'testimonials');
        }
        console.warn('Testimonials live listener warning:', err);
      },
    );

    return () => unsub();
  }, [authReady, isAdmin]);

  // Admin-only listeners for PII inquiries & co-admin emails
  useEffect(() => {
    if (!authReady || !isAdmin) {
      setInquiries([]);
      setAdminEmails([]);
      return;
    }

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        collection(db, 'inquiries'),
        (snap) => {
          const rows = snap.docs
            .map((d) => {
              const data = d.data();
              const t = formatDateFromTimestamp(data.createdAt);
              return {
                id: d.id,
                referenceCode: String(data.referenceCode ?? ''),
                parentName: String(data.parentName ?? ''),
                contact: String(data.contact ?? ''),
                gradeLevel: String(data.gradeLevel ?? ''),
                inquiryType: String(data.inquiryType ?? ''),
                message: String(data.message ?? ''),
                status: (data.status ?? 'new') as AdmissionsInquiryRecord['status'],
                ownerNotes: String(data.ownerNotes ?? ''),
                createdAtLabel: t.label,
              };
            })
            .sort((a, b) => b.referenceCode.localeCompare(a.referenceCode));
          setInquiries(rows);
        },
        (err) => {
          if (isPermissionError(err)) {
            handleFirestoreError(err, OperationType.LIST, 'inquiries');
          }
          console.warn('Inquiries listener warning:', err);
        },
      ),
    );

    if (isPrimaryOwner) {
      unsubs.push(
        onSnapshot(
          collection(db, 'adminEmails'),
          (snap) => {
            const rows = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                email: String(data.email ?? d.id),
                label: String(data.label ?? 'Co-Administrator'),
                addedBy: String(data.addedBy ?? PRIMARY_OWNER_EMAIL),
              };
            });
            setAdminEmails(rows);
          },
          (err) => {
            if (isPermissionError(err)) {
              handleFirestoreError(err, OperationType.LIST, 'adminEmails');
            }
            console.warn('Admin emails listener warning:', err);
          },
        ),
      );
    }

    return () => unsubs.forEach((u) => u());
  }, [authReady, isAdmin, isPrimaryOwner]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to complete sign-in.';
      setAuthError(msg);
      throw error;
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  // Seed default content if missing when owner writes for the first time
  const seedAllDefaultsToFirestore = async () => {
    const batch = writeBatch(db);
    const updaterEmail = user?.email ?? PRIMARY_OWNER_EMAIL;

    if (!dbSettings) {
      batch.set(doc(db, 'schoolSettings', 'main'), {
        ...DEFAULT_SCHOOL_SETTINGS,
        updatedAt: serverTimestamp(),
        updatedBy: updaterEmail,
      });
    }

    if (!dbPosts) {
      for (const p of DEFAULT_POSTS) {
        const payload: Record<string, unknown> = {
          title: p.title,
          category: p.category,
          summary: p.summary,
          body: p.body,
          authorName: p.authorName,
          authorEmail: p.authorEmail,
          published: p.published,
          pinned: p.pinned,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (p.imageUrl) payload.imageUrl = p.imageUrl;
        batch.set(doc(db, 'posts', p.id), payload);
      }
    }

    if (!dbAcademics) {
      for (const div of ACADEMIC_DIVISIONS) {
        const { id, ...rest } = div;
        batch.set(doc(db, 'academics', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (!dbSpaces) {
      for (const sp of CAMPUS_SPACES) {
        const { id, ...rest } = sp;
        batch.set(doc(db, 'campusSpaces', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (!dbFaculty) {
      for (const f of FACULTY_MEMBERS) {
        const { id, ...rest } = f;
        batch.set(doc(db, 'faculty', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (!dbEvents) {
      for (const ev of CALENDAR_EVENTS) {
        const { id, ...rest } = ev;
        batch.set(doc(db, 'calendarEvents', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (!dbSchedule) {
      for (const s of DAILY_SCHEDULE) {
        const { id, ...rest } = s;
        batch.set(doc(db, 'dailySchedule', id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (!dbTestimonials) {
      for (const t of DEFAULT_TESTIMONIALS) {
        batch.set(doc(db, 'testimonials', t.id), {
          authorName: t.authorName,
          roleLabel: t.roleLabel,
          voiceType: t.voiceType,
          gradeContext: t.gradeContext,
          quote: t.quote,
          featured: t.featured,
          published: t.published,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    try {
      await batch.commit();
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
    }
  };

  const ensureCollectionSeeded = async (collectionName: string) => {
    const batch = writeBatch(db);
    let hasWrites = false;

    if (collectionName === 'academics' && !dbAcademics) {
      hasWrites = true;
      for (const div of ACADEMIC_DIVISIONS) {
        const { id, ...rest } = div;
        batch.set(doc(db, 'academics', id), { ...rest, updatedAt: serverTimestamp() });
      }
    } else if (collectionName === 'campusSpaces' && !dbSpaces) {
      hasWrites = true;
      for (const sp of CAMPUS_SPACES) {
        const { id, ...rest } = sp;
        batch.set(doc(db, 'campusSpaces', id), { ...rest, updatedAt: serverTimestamp() });
      }
    } else if (collectionName === 'faculty' && !dbFaculty) {
      hasWrites = true;
      for (const f of FACULTY_MEMBERS) {
        const { id, ...rest } = f;
        batch.set(doc(db, 'faculty', id), { ...rest, updatedAt: serverTimestamp() });
      }
    } else if (collectionName === 'calendarEvents' && !dbEvents) {
      hasWrites = true;
      for (const ev of CALENDAR_EVENTS) {
        const { id, ...rest } = ev;
        batch.set(doc(db, 'calendarEvents', id), { ...rest, updatedAt: serverTimestamp() });
      }
    } else if (collectionName === 'dailySchedule' && !dbSchedule) {
      hasWrites = true;
      for (const s of DAILY_SCHEDULE) {
        const { id, ...rest } = s;
        batch.set(doc(db, 'dailySchedule', id), { ...rest, updatedAt: serverTimestamp() });
      }
    } else if (collectionName === 'posts' && !dbPosts) {
      hasWrites = true;
      for (const p of DEFAULT_POSTS) {
        const payload: Record<string, unknown> = {
          title: p.title,
          category: p.category,
          summary: p.summary,
          body: p.body,
          authorName: p.authorName,
          authorEmail: p.authorEmail,
          published: p.published,
          pinned: p.pinned,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (p.imageUrl) payload.imageUrl = p.imageUrl;
        batch.set(doc(db, 'posts', p.id), payload);
      }
    } else if (collectionName === 'testimonials' && !dbTestimonials) {
      hasWrites = true;
      for (const t of DEFAULT_TESTIMONIALS) {
        batch.set(doc(db, 'testimonials', t.id), {
          authorName: t.authorName,
          roleLabel: t.roleLabel,
          voiceType: t.voiceType,
          gradeContext: t.gradeContext,
          quote: t.quote,
          featured: t.featured,
          published: t.published,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (hasWrites) {
      await batch.commit();
    }
  };

  const saveSchoolSettings = async (next: SchoolSettings) => {
    const path = 'schoolSettings/main';
    try {
      await setDoc(doc(db, 'schoolSettings', 'main'), {
        schoolName: next.schoolName.trim().slice(0, 120),
        tagline: next.tagline.trim().slice(0, 160),
        locationLabel: next.locationLabel.trim().slice(0, 140),
        heroTitle: next.heroTitle.trim().slice(0, 200),
        heroSubtitle: next.heroSubtitle.trim().slice(0, 600),
        gradesServed: next.gradesServed.trim().slice(0, 80),
        languages: next.languages.trim().slice(0, 120),
        schoolHours: next.schoolHours.trim().slice(0, 80),
        contactEmail: next.contactEmail.trim().slice(0, 120),
        campusAddress: next.campusAddress.trim().slice(0, 160),
        officeHours: next.officeHours.trim().slice(0, 120),
        historyNote: next.historyNote.trim().slice(0, 200),
        plePassRate: next.plePassRate.trim().slice(0, 20),
        updatedAt: serverTimestamp(),
        updatedBy: user?.email ?? PRIMARY_OWNER_EMAIL,
      });
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const savePost = async (payload: NewPostPayload, existingId?: string) => {
    const id = existingId || makeSlugId('post');
    const path = `posts/${id}`;
    try {
      await ensureCollectionSeeded('posts');
      const existingDoc = existingId ? await getDoc(doc(db, 'posts', id)) : null;

      const writeBody: Record<string, unknown> = {
        title: payload.title.trim().slice(0, 160),
        category: payload.category,
        summary: payload.summary.trim().slice(0, 320),
        body: payload.body.trim().slice(0, 5000),
        authorName: payload.authorName.trim().slice(0, 100),
        authorEmail: user?.email ?? PRIMARY_OWNER_EMAIL,
        published: payload.published,
        pinned: payload.pinned,
        updatedAt: serverTimestamp(),
      };
      if (payload.imageUrl?.trim()) {
        writeBody.imageUrl = payload.imageUrl.trim().slice(0, 500);
      }

      if (existingDoc && existingDoc.exists()) {
        writeBody.createdAt = existingDoc.data().createdAt;
        await setDoc(doc(db, 'posts', id), writeBody);
      } else {
        writeBody.createdAt = serverTimestamp();
        await setDoc(doc(db, 'posts', id), writeBody);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deletePost = async (id: string) => {
    const path = `posts/${id}`;
    try {
      await ensureCollectionSeeded('posts');
      await deleteDoc(doc(db, 'posts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const saveAcademicDivision = async (division: AcademicDivision) => {
    const path = `academics/${division.id}`;
    try {
      await ensureCollectionSeeded('academics');
      const { id, ...rest } = division;
      await setDoc(doc(db, 'academics', id), {
        ...rest,
        updatedAt: serverTimestamp(),
      });
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteAcademicDivision = async (id: string) => {
    const path = `academics/${id}`;
    try {
      await ensureCollectionSeeded('academics');
      await deleteDoc(doc(db, 'academics', id));
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const saveCampusSpace = async (space: CampusSpace) => {
    const id = space.id || makeSlugId('space');
    const path = `campusSpaces/${id}`;
    try {
      await ensureCollectionSeeded('campusSpaces');
      const { id: _ignored, ...rest } = space;
      await setDoc(doc(db, 'campusSpaces', id), {
        ...rest,
        updatedAt: serverTimestamp(),
      });
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteCampusSpace = async (id: string) => {
    const path = `campusSpaces/${id}`;
    try {
      await ensureCollectionSeeded('campusSpaces');
      await deleteDoc(doc(db, 'campusSpaces', id));
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const saveFacultyMember = async (member: Omit<FacultyMember, 'id'>, existingId?: string) => {
    const id = existingId || makeSlugId('fac');
    const path = `faculty/${id}`;
    try {
      await ensureCollectionSeeded('faculty');
      await setDoc(doc(db, 'faculty', id), {
        name: member.name.trim().slice(0, 100),
        initials: member.initials.trim().slice(0, 4).toUpperCase(),
        role: member.role.trim().slice(0, 100),
        department: member.department,
        subjects: member.subjects.trim().slice(0, 140),
        yearsAtSchool: Math.max(0, Math.min(70, Math.round(Number(member.yearsAtSchool) || 0))),
        bio: member.bio.trim().slice(0, 600),
        updatedAt: serverTimestamp(),
      });
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteFacultyMember = async (id: string) => {
    const path = `faculty/${id}`;
    try {
      await ensureCollectionSeeded('faculty');
      await deleteDoc(doc(db, 'faculty', id));
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const saveTestimonial = async (payload: NewTestimonialPayload, existingId?: string) => {
    const id = existingId || makeSlugId('test');
    const path = `testimonials/${id}`;
    try {
      await ensureCollectionSeeded('testimonials');
      const existingDoc = existingId ? await getDoc(doc(db, 'testimonials', id)) : null;

      const writeBody: Record<string, unknown> = {
        authorName: payload.authorName.trim().slice(0, 100),
        roleLabel: payload.roleLabel.trim().slice(0, 120),
        voiceType: payload.voiceType === 'Student' ? 'Student' : 'Parent',
        gradeContext: payload.gradeContext.trim().slice(0, 80),
        quote: payload.quote.trim().slice(0, 800),
        featured: Boolean(payload.featured),
        published: Boolean(payload.published),
        updatedAt: serverTimestamp(),
      };

      if (existingDoc && existingDoc.exists()) {
        writeBody.createdAt = existingDoc.data().createdAt;
        await setDoc(doc(db, 'testimonials', id), writeBody);
      } else {
        writeBody.createdAt = serverTimestamp();
        await setDoc(doc(db, 'testimonials', id), writeBody);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteTestimonial = async (id: string) => {
    const path = `testimonials/${id}`;
    try {
      await ensureCollectionSeeded('testimonials');
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const saveCalendarEvent = async (event: Omit<CalendarEvent, 'id'>, existingId?: string) => {
    const id = existingId || makeSlugId('ev');
    const path = `calendarEvents/${id}`;
    try {
      await ensureCollectionSeeded('calendarEvents');
      await setDoc(doc(db, 'calendarEvents', id), {
        dateISO: event.dateISO.trim().slice(0, 32),
        displayDate: event.displayDate.trim().slice(0, 40),
        monthLabel: event.monthLabel.trim().slice(0, 10).toUpperCase(),
        dayNumber: event.dayNumber.trim().slice(0, 4),
        timeRange: event.timeRange.trim().slice(0, 40),
        category: event.category,
        title: event.title.trim().slice(0, 140),
        location: event.location.trim().slice(0, 120),
        description: event.description.trim().slice(0, 600),
        updatedAt: serverTimestamp(),
      });
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteCalendarEvent = async (id: string) => {
    const path = `calendarEvents/${id}`;
    try {
      await ensureCollectionSeeded('calendarEvents');
      await deleteDoc(doc(db, 'calendarEvents', id));
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const saveDailyScheduleSlot = async (
    slot: Omit<DailyScheduleRow, 'id'>,
    existingId?: string,
  ) => {
    const id = existingId || makeSlugId('slot');
    const path = `dailySchedule/${id}`;
    try {
      await ensureCollectionSeeded('dailySchedule');
      await setDoc(doc(db, 'dailySchedule', id), {
        order: Math.round(Number(slot.order) || 1),
        time: slot.time.trim().slice(0, 40),
        activity: slot.activity.trim().slice(0, 140),
        notes: slot.notes.trim().slice(0, 120),
        updatedAt: serverTimestamp(),
      });
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteDailyScheduleSlot = async (id: string) => {
    const path = `dailySchedule/${id}`;
    try {
      await ensureCollectionSeeded('dailySchedule');
      await deleteDoc(doc(db, 'dailySchedule', id));
      await refreshPublicCatalog();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const submitInquiry = async (payload: NewInquiryPayload): Promise<string> => {
    const id = makeSlugId('inq');
    const path = `inquiries/${id}`;
    const referenceCode = `EPN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await setDoc(doc(db, 'inquiries', id), {
        referenceCode,
        parentName: payload.parentName.trim().slice(0, 100),
        contact: payload.contact.trim().slice(0, 120),
        gradeLevel: payload.gradeLevel.trim().slice(0, 60),
        inquiryType: payload.inquiryType.trim().slice(0, 80),
        message: payload.message.trim().slice(0, 2000),
        status: 'new',
        ownerNotes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return referenceCode;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateInquiryStatus = async (
    id: string,
    status: AdmissionsInquiryRecord['status'],
    ownerNotes: string,
  ) => {
    const path = `inquiries/${id}`;
    try {
      await updateDoc(doc(db, 'inquiries', id), {
        status,
        ownerNotes: ownerNotes.trim().slice(0, 1000),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteInquiry = async (id: string) => {
    const path = `inquiries/${id}`;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const addCoAdminEmail = async (email: string, label: string) => {
    const normalized = email.trim().toLowerCase();
    const path = `adminEmails/${normalized}`;
    try {
      await setDoc(doc(db, 'adminEmails', normalized), {
        email: normalized,
        label: label.trim().slice(0, 100),
        addedBy: user?.email ?? PRIMARY_OWNER_EMAIL,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const removeCoAdminEmail = async (email: string) => {
    const normalized = email.trim().toLowerCase();
    const path = `adminEmails/${normalized}`;
    try {
      await deleteDoc(doc(db, 'adminEmails', normalized));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const value = useMemo<SchoolDataContextValue>(
    () => ({
      user,
      authReady,
      isPrimaryOwner,
      isAdmin,
      authError,
      signInWithGoogle,
      signOutUser,
      settings: dbSettings ?? DEFAULT_SCHOOL_SETTINGS,
      posts: dbPosts ?? DEFAULT_POSTS,
      academics: dbAcademics ?? ACADEMIC_DIVISIONS,
      campusSpaces: dbSpaces ?? CAMPUS_SPACES,
      faculty: dbFaculty ?? FACULTY_MEMBERS,
      testimonials: dbTestimonials ?? DEFAULT_TESTIMONIALS,
      testimonialsLoading,
      calendarEvents: dbEvents ?? CALENDAR_EVENTS,
      dailySchedule: dbSchedule ?? DAILY_SCHEDULE,
      inquiries,
      adminEmails,
      hasSyncedFromDb: Boolean(
        dbSettings ||
          dbPosts ||
          dbAcademics ||
          dbSpaces ||
          dbFaculty ||
          dbTestimonials ||
          dbEvents ||
          dbSchedule,
      ),
      saveSchoolSettings,
      savePost,
      deletePost,
      saveAcademicDivision,
      deleteAcademicDivision,
      saveCampusSpace,
      deleteCampusSpace,
      saveFacultyMember,
      deleteFacultyMember,
      saveTestimonial,
      deleteTestimonial,
      saveCalendarEvent,
      deleteCalendarEvent,
      saveDailyScheduleSlot,
      deleteDailyScheduleSlot,
      submitInquiry,
      updateInquiryStatus,
      deleteInquiry,
      addCoAdminEmail,
      removeCoAdminEmail,
      seedAllDefaultsToFirestore,
    }),
    [
      user,
      authReady,
      isPrimaryOwner,
      isAdmin,
      authError,
      dbSettings,
      dbPosts,
      dbAcademics,
      dbSpaces,
      dbFaculty,
      dbTestimonials,
      testimonialsLoading,
      dbEvents,
      dbSchedule,
      inquiries,
      adminEmails,
    ],
  );

  return <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData(): SchoolDataContextValue {
  const ctx = useContext(SchoolDataContext);
  if (!ctx) {
    throw new Error('useSchoolData must be used inside SchoolDataProvider');
  }
  return ctx;
}
