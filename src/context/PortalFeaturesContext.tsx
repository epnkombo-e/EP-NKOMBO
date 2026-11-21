import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
  DEFAULT_CLASS_SUMMARIES,
  DEFAULT_LIBRARY_ITEMS,
  DEFAULT_SPORTS_ENTERTAINMENT,
  SCHOOL_CLASSES,
  type AccountKind,
  type ApprovalStatus,
  type AvatarType,
  type ClassPerformanceSummaryRecord,
  type DirectMessageRecord,
  type LibraryItemRecord,
  type LibraryItemType,
  type LibrarySubject,
  type NotificationRecord,
  type OnlineTestSubmissionRecord,
  type PublicProfileBadge,
  type QuizQuestionItem,
  type SportsActivityType,
  type SportsEntertainmentRecord,
  type StoryChapter,
  type StudentRosterRecord,
  type UserProfileRecord,
} from '../data/portalCatalog';
import { PRIMARY_OWNER_EMAIL } from '../data/schoolData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useSchoolData } from './SchoolDataContext';
import { useTheme } from './ThemeContext';

export interface SaveLibraryItemPayload {
  title: string;
  itemType: LibraryItemType;
  subject: LibrarySubject;
  gradeLevel: string;
  description: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sourceType: LibraryItemRecord['sourceType'];
  fileUrl?: string;
  fileData?: string;
  storyChapters?: StoryChapter[];
  quizQuestions?: QuizQuestionItem[];
}

export interface SaveSportsPayload {
  title: string;
  activityType: SportsActivityType;
  eventDate: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  highlights: string[];
}

export interface SaveStudentPayload {
  studentName: string;
  className: string;
  gender: 'Female' | 'Male';
  studentCode?: string;
  term1Avg: number;
  term2Avg: number;
  term3Avg: number;
  pleAvg: number;
  subjectScores: Record<string, number>;
}

interface PortalFeaturesContextValue {
  userProfile: UserProfileRecord | null;
  publicProfiles: PublicProfileBadge[];
  messages: DirectMessageRecord[];
  notifications: NotificationRecord[];
  unreadNotificationsCount: number;
  libraryItems: LibraryItemRecord[];
  onlineTestSubmissions: OnlineTestSubmissionRecord[];
  sportsItems: SportsEntertainmentRecord[];
  studentRecords: StudentRosterRecord[];
  classSummaries: ClassPerformanceSummaryRecord[];

  saveUserProfile: (next: Omit<UserProfileRecord, 'uid' | 'email'>) => Promise<void>;
  sendDirectMessage: (recipientUid: string, subject: string, body: string) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  deleteDirectMessage: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  saveLibraryItem: (payload: SaveLibraryItemPayload, existingId?: string) => Promise<void>;
  approveLibraryItem: (id: string) => Promise<void>;
  rejectLibraryItem: (id: string) => Promise<void>;
  deleteLibraryItem: (id: string) => Promise<void>;

  submitOnlineTest: (payload: {
    testId: string;
    testTitle: string;
    subject: string;
    studentName: string;
    className: string;
    score: number;
    totalQuestions: number;
    percentage: number;
  }) => Promise<void>;

  saveSportsItem: (payload: SaveSportsPayload, existingId?: string) => Promise<void>;
  approveSportsItem: (id: string) => Promise<void>;
  rejectSportsItem: (id: string) => Promise<void>;
  deleteSportsItem: (id: string) => Promise<void>;

  saveStudentRecord: (payload: SaveStudentPayload, existingId?: string) => Promise<void>;
  bulkImportStudents: (rows: SaveStudentPayload[]) => Promise<number>;
  deleteStudentRecord: (id: string) => Promise<void>;
}

const PortalFeaturesContext = createContext<PortalFeaturesContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseTs(ts: unknown): { ms: number; label: string } {
  if (ts instanceof Timestamp) {
    const d = ts.toDate();
    return {
      ms: d.getTime(),
      label: d.toLocaleDateString('en-GB', {
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

function isPermissionDenied(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return code === 'permission-denied' || msg.includes('permission');
}

function computeSummaryForClass(
  className: string,
  records: StudentRosterRecord[],
  order: number,
): Omit<ClassPerformanceSummaryRecord, 'id'> {
  const inClass = records.filter((r) => r.className === className);
  const totalStudents = inClass.length;
  const females = inClass.filter((r) => r.gender === 'Female');
  const males = inClass.filter((r) => r.gender === 'Male');

  const avgOf = (list: number[]): number =>
    list.length > 0 ? Number((list.reduce((a, b) => a + b, 0) / list.length).toFixed(1)) : 0;

  const term1Avg = avgOf(inClass.map((r) => r.term1Avg));
  const term2Avg = avgOf(inClass.map((r) => r.term2Avg));
  const term3Avg = avgOf(inClass.map((r) => r.term3Avg));
  const pleScores = inClass.map((r) => r.pleAvg).filter((n) => n > 0);
  const pleAvg = avgOf(pleScores);

  const overallPerStudent = inClass.map((r) => {
    const terms = [r.term1Avg, r.term2Avg, r.term3Avg].filter((n) => n > 0);
    return terms.length > 0 ? terms.reduce((a, b) => a + b, 0) / terms.length : 0;
  });
  const passingCount = overallPerStudent.filter((score) => score >= 50).length;
  const passRatePct =
    totalStudents > 0 ? Number(((passingCount / totalStudents) * 100).toFixed(1)) : 0;

  const femaleAvg = avgOf(
    females.map((r) => {
      const vals = [r.term1Avg, r.term2Avg, r.term3Avg].filter((n) => n > 0);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }),
  );
  const maleAvg = avgOf(
    males.map((r) => {
      const vals = [r.term1Avg, r.term2Avg, r.term3Avg].filter((n) => n > 0);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }),
  );

  const subjectBuckets: Record<string, number[]> = {};
  for (const r of inClass) {
    for (const [subj, val] of Object.entries(r.subjectScores || {})) {
      if (typeof val === 'number' && !Number.isNaN(val)) {
        if (!subjectBuckets[subj]) subjectBuckets[subj] = [];
        subjectBuckets[subj].push(val);
      }
    }
  }
  const subjectAverages: Record<string, number> = {};
  for (const [subj, nums] of Object.entries(subjectBuckets)) {
    subjectAverages[subj] = avgOf(nums);
  }

  return {
    className,
    order,
    totalStudents,
    femaleCount: females.length,
    maleCount: males.length,
    term1Avg,
    term2Avg,
    term3Avg,
    pleAvg,
    passRatePct,
    femaleAvg,
    maleAvg,
    subjectAverages,
  };
}

export function PortalFeaturesProvider({ children }: { children: ReactNode }) {
  const { user, authReady, isAdmin } = useSchoolData();
  const { setTheme } = useTheme();

  const [userProfile, setUserProfile] = useState<UserProfileRecord | null>(null);
  const [publicProfiles, setPublicProfiles] = useState<PublicProfileBadge[]>([]);
  const [messages, setMessages] = useState<DirectMessageRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [dbLibrary, setDbLibrary] = useState<LibraryItemRecord[] | null>(null);
  const [onlineTestSubmissions, setOnlineTestSubmissions] = useState<OnlineTestSubmissionRecord[]>([]);
  const [dbSports, setDbSports] = useState<SportsEntertainmentRecord[] | null>(null);
  const [studentRecords, setStudentRecords] = useState<StudentRosterRecord[]>([]);
  const [dbClassSummaries, setDbClassSummaries] = useState<ClassPerformanceSummaryRecord[] | null>(null);

  // Load user's own profile when authenticated
  useEffect(() => {
    if (!authReady || !user?.emailVerified) {
      setUserProfile(null);
      return;
    }

    const ref = doc(db, 'userProfiles', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const profile: UserProfileRecord = {
            uid: String(d.uid ?? user.uid),
            email: String(d.email ?? user.email ?? ''),
            displayName: String(d.displayName ?? user.displayName ?? user.email ?? 'Member'),
            accountKind: (d.accountKind ?? 'teacher') as AccountKind,
            avatarType: (d.avatarType ?? 'avatar') as AvatarType,
            avatarValue: String(d.avatarValue ?? 'avatar-scholar'),
            photoDataUrl: d.photoDataUrl ? String(d.photoDataUrl) : undefined,
            phone: d.phone ? String(d.phone) : '',
            classOrSubject: d.classOrSubject ? String(d.classOrSubject) : '',
            bio: d.bio ? String(d.bio) : '',
            themeMode: d.themeMode === 'dark' ? 'dark' : 'light',
            privacyShowEmail: Boolean(d.privacyShowEmail),
            privacyShowPhone: Boolean(d.privacyShowPhone),
            privacyAllowMessages: d.privacyAllowMessages !== false,
            privacyPublicCircle: d.privacyPublicCircle !== false,
          };
          setUserProfile(profile);
          setTheme(profile.themeMode);
        } else {
          const fallback: UserProfileRecord = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'School Member',
            accountKind: isAdmin ? 'teacher' : 'parent',
            avatarType: user.photoURL ? 'avatar' : 'avatar',
            avatarValue: isAdmin ? 'avatar-teacher' : 'avatar-scholar',
            phone: '',
            classOrSubject: isAdmin ? 'School Administration' : '',
            bio: '',
            themeMode: 'light',
            privacyShowEmail: false,
            privacyShowPhone: false,
            privacyAllowMessages: true,
            privacyPublicCircle: true,
          };
          setUserProfile(fallback);
        }
      },
      (err) => {
        if (!isPermissionDenied(err)) {
          console.warn('User profile listener warning:', err);
        }
      },
    );
    return () => unsub();
  }, [authReady, user, isAdmin, setTheme]);

  // Public circular badge profiles
  useEffect(() => {
    void getDocs(query(collection(db, 'publicProfiles'), where('showPublicly', '==', true)))
      .then((snap) => {
        setPublicProfiles(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              displayName: String(data.displayName ?? ''),
              roleLabel: String(data.roleLabel ?? 'Member'),
              avatarType: (data.avatarType ?? 'avatar') as AvatarType,
              avatarValue: String(data.avatarValue ?? 'avatar-scholar'),
              photoDataUrl: data.photoDataUrl ? String(data.photoDataUrl) : undefined,
              classOrSubject: data.classOrSubject ? String(data.classOrSubject) : undefined,
              showPublicly: Boolean(data.showPublicly),
            };
          }),
        );
      })
      .catch(() => {
        // Non-blocking
      });
  }, [userProfile]);

  // Public + own + admin Library items
  useEffect(() => {
    if (!authReady) return;

    const mapLib = (docs: { id: string; data: () => Record<string, unknown> }[]): LibraryItemRecord[] =>
      docs
        .map((d) => {
          const data = d.data();
          const t = parseTs(data.createdAt);
          return {
            id: d.id,
            title: String(data.title ?? ''),
            itemType: (data.itemType ?? 'Book') as LibraryItemType,
            subject: (data.subject ?? 'OTHER BOOKS') as LibrarySubject,
            gradeLevel: String(data.gradeLevel ?? 'All Grades'),
            description: String(data.description ?? ''),
            fileName: String(data.fileName ?? 'resource.txt'),
            mimeType: String(data.mimeType ?? 'text/plain'),
            sizeBytes: Math.max(0, Math.round(Number(data.sizeBytes ?? 0))),
            sourceType: (data.sourceType ?? 'upload') as LibraryItemRecord['sourceType'],
            fileUrl: data.fileUrl ? String(data.fileUrl) : undefined,
            fileData: data.fileData ? String(data.fileData) : undefined,
            storyChapters: Array.isArray(data.storyChapters)
              ? (data.storyChapters as StoryChapter[])
              : undefined,
            quizQuestions: Array.isArray(data.quizQuestions)
              ? (data.quizQuestions as QuizQuestionItem[])
              : undefined,
            approvalStatus: (data.approvalStatus ?? 'approved') as ApprovalStatus,
            submittedByUid: String(data.submittedByUid ?? 'system'),
            submittedByName: String(data.submittedByName ?? 'Teacher'),
            submittedByEmail: String(data.submittedByEmail ?? PRIMARY_OWNER_EMAIL),
            createdAtMs: t.ms,
            displayDate: t.label,
          };
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs);

    if (isAdmin) {
      return onSnapshot(
        collection(db, 'libraryItems'),
        (snap) => setDbLibrary(snap.empty ? null : mapLib(snap.docs)),
        (err) => {
          if (!isPermissionDenied(err)) console.warn('Library listener warning:', err);
        },
      );
    }

    const loadNonAdmin = async () => {
      try {
        const approvedSnap = await getDocs(
          query(collection(db, 'libraryItems'), where('approvalStatus', '==', 'approved')),
        );
        const byId = new Map<string, { id: string; data: () => Record<string, unknown> }>();
        approvedSnap.docs.forEach((d) => byId.set(d.id, d));

        if (user?.emailVerified) {
          const ownSnap = await getDocs(
            query(collection(db, 'libraryItems'), where('submittedByUid', '==', user.uid)),
          );
          ownSnap.docs.forEach((d) => byId.set(d.id, d));
        }

        const merged = Array.from(byId.values());
        setDbLibrary(merged.length > 0 ? mapLib(merged) : null);
      } catch (err) {
        if (!isPermissionDenied(err)) console.warn('Library fetch warning:', err);
      }
    };

    void loadNonAdmin();
  }, [authReady, isAdmin, user]);

  // Public + own + admin Sports & Entertainment
  useEffect(() => {
    if (!authReady) return;

    const mapSports = (
      docs: { id: string; data: () => Record<string, unknown> }[],
    ): SportsEntertainmentRecord[] =>
      docs
        .map((d) => {
          const data = d.data();
          const t = parseTs(data.createdAt);
          return {
            id: d.id,
            title: String(data.title ?? ''),
            activityType: (data.activityType ?? 'Sports') as SportsActivityType,
            eventDate: String(data.eventDate ?? ''),
            description: String(data.description ?? ''),
            imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
            videoUrl: data.videoUrl ? String(data.videoUrl) : undefined,
            highlights: Array.isArray(data.highlights)
              ? data.highlights.map((h) => String(h))
              : [],
            approvalStatus: (data.approvalStatus ?? 'approved') as ApprovalStatus,
            submittedByUid: String(data.submittedByUid ?? 'system'),
            submittedByName: String(data.submittedByName ?? 'School Staff'),
            createdAtMs: t.ms,
            displayDate: t.label,
          };
        })
        .sort((a, b) => b.createdAtMs - a.createdAtMs);

    if (isAdmin) {
      return onSnapshot(
        collection(db, 'sportsEntertainment'),
        (snap) => setDbSports(snap.empty ? null : mapSports(snap.docs)),
        () => {},
      );
    }

    const loadNonAdmin = async () => {
      try {
        const approvedSnap = await getDocs(
          query(collection(db, 'sportsEntertainment'), where('approvalStatus', '==', 'approved')),
        );
        const byId = new Map<string, { id: string; data: () => Record<string, unknown> }>();
        approvedSnap.docs.forEach((d) => byId.set(d.id, d));

        if (user?.emailVerified) {
          const ownSnap = await getDocs(
            query(collection(db, 'sportsEntertainment'), where('submittedByUid', '==', user.uid)),
          );
          ownSnap.docs.forEach((d) => byId.set(d.id, d));
        }

        const merged = Array.from(byId.values());
        setDbSports(merged.length > 0 ? mapSports(merged) : null);
      } catch {
        // Non-blocking fallback
      }
    };

    void loadNonAdmin();
  }, [authReady, isAdmin, user]);

  // Class performance summaries (public read)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'classPerformanceSummaries'),
      (snap) => {
        if (snap.empty) {
          setDbClassSummaries(null);
          return;
        }
        const rows = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              className: String(data.className ?? d.id),
              order: Number(data.order ?? 1),
              totalStudents: Number(data.totalStudents ?? 0),
              femaleCount: Number(data.femaleCount ?? 0),
              maleCount: Number(data.maleCount ?? 0),
              term1Avg: Number(data.term1Avg ?? 0),
              term2Avg: Number(data.term2Avg ?? 0),
              term3Avg: Number(data.term3Avg ?? 0),
              pleAvg: Number(data.pleAvg ?? 0),
              passRatePct: Number(data.passRatePct ?? 0),
              femaleAvg: Number(data.femaleAvg ?? 0),
              maleAvg: Number(data.maleAvg ?? 0),
              subjectAverages: (data.subjectAverages as Record<string, number>) || {},
            } as ClassPerformanceSummaryRecord;
          })
          .sort((a, b) => a.order - b.order);
        setDbClassSummaries(rows);
      },
      () => {},
    );
    return () => unsub();
  }, []);

  // Signed-in Notifications & Messages + Admin-only Online Test Submissions & Student Roster
  useEffect(() => {
    if (!authReady) return;

    const unsubs: (() => void)[] = [];

    // Broadcast + personal notifications
    const loadNotifs = async () => {
      try {
        const allSnap = await getDocs(
          query(collection(db, 'notifications'), where('recipientUid', '==', 'ALL')),
        );
        const byId = new Map<string, { id: string; data: () => Record<string, unknown> }>();
        allSnap.docs.forEach((d) => byId.set(d.id, d));

        if (user?.emailVerified) {
          const mineSnap = await getDocs(
            query(collection(db, 'notifications'), where('recipientUid', '==', user.uid)),
          );
          mineSnap.docs.forEach((d) => byId.set(d.id, d));
        }
        if (isAdmin) {
          const adminSnap = await getDocs(
            query(collection(db, 'notifications'), where('recipientUid', '==', 'ADMINS')),
          );
          adminSnap.docs.forEach((d) => byId.set(d.id, d));
        }

        const mapped = Array.from(byId.values())
          .map((d) => {
            const data = d.data();
            const t = parseTs(data.createdAt);
            return {
              id: d.id,
              recipientUid: String(data.recipientUid ?? 'ALL'),
              title: String(data.title ?? ''),
              body: String(data.body ?? ''),
              kind: (data.kind ?? 'announcement') as NotificationRecord['kind'],
              read: Boolean(data.read),
              createdAtMs: t.ms,
              displayDate: t.label,
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);

        setNotifications(mapped);
      } catch {
        // Non-blocking
      }
    };
    void loadNotifs();

    if (user?.emailVerified) {
      if (isAdmin) {
        unsubs.push(
          onSnapshot(
            collection(db, 'messages'),
            (snap) => {
              const rows = snap.docs
                .map((d) => {
                  const data = d.data();
                  const t = parseTs(data.createdAt);
                  return {
                    id: d.id,
                    senderUid: String(data.senderUid ?? ''),
                    senderName: String(data.senderName ?? ''),
                    senderEmail: String(data.senderEmail ?? ''),
                    recipientUid: String(data.recipientUid ?? 'SCHOOL_OFFICE'),
                    subject: String(data.subject ?? ''),
                    body: String(data.body ?? ''),
                    read: Boolean(data.read),
                    createdAtMs: t.ms,
                    displayDate: t.label,
                  };
                })
                .sort((a, b) => b.createdAtMs - a.createdAtMs);
              setMessages(rows);
            },
            () => {},
          ),
        );

        unsubs.push(
          onSnapshot(
            collection(db, 'onlineTestSubmissions'),
            (snap) => {
              setOnlineTestSubmissions(
                snap.docs
                  .map((d) => {
                    const data = d.data();
                    const t = parseTs(data.createdAt);
                    return {
                      id: d.id,
                      testId: String(data.testId ?? ''),
                      testTitle: String(data.testTitle ?? ''),
                      subject: String(data.subject ?? ''),
                      studentName: String(data.studentName ?? ''),
                      className: String(data.className ?? ''),
                      score: Number(data.score ?? 0),
                      totalQuestions: Number(data.totalQuestions ?? 1),
                      percentage: Number(data.percentage ?? 0),
                      createdAtMs: t.ms,
                      createdAtLabel: t.label,
                    };
                  })
                  .sort((a, b) => b.createdAtMs - a.createdAtMs),
              );
            },
            () => {},
          ),
        );

        unsubs.push(
          onSnapshot(
            collection(db, 'studentRecords'),
            (snap) => {
              setStudentRecords(
                snap.docs
                  .map((d) => {
                    const data = d.data();
                    const t = parseTs(data.updatedAt);
                    return {
                      id: d.id,
                      studentName: String(data.studentName ?? ''),
                      className: String(data.className ?? 'P1'),
                      gender: (data.gender === 'Male' ? 'Male' : 'Female') as 'Female' | 'Male',
                      studentCode: data.studentCode ? String(data.studentCode) : undefined,
                      term1Avg: Number(data.term1Avg ?? 0),
                      term2Avg: Number(data.term2Avg ?? 0),
                      term3Avg: Number(data.term3Avg ?? 0),
                      pleAvg: Number(data.pleAvg ?? 0),
                      subjectScores: (data.subjectScores as Record<string, number>) || {},
                      updatedAtLabel: t.label,
                    };
                  })
                  .sort((a, b) => a.className.localeCompare(b.className) || a.studentName.localeCompare(b.studentName)),
              );
            },
            () => {},
          ),
        );
      } else {
        const loadUserMessages = async () => {
          try {
            const [sentSnap, recvSnap] = await Promise.all([
              getDocs(query(collection(db, 'messages'), where('senderUid', '==', user.uid))),
              getDocs(query(collection(db, 'messages'), where('recipientUid', '==', user.uid))),
            ]);
            const byId = new Map<string, { id: string; data: () => Record<string, unknown> }>();
            sentSnap.docs.forEach((d) => byId.set(d.id, d));
            recvSnap.docs.forEach((d) => byId.set(d.id, d));

            setMessages(
              Array.from(byId.values())
                .map((d) => {
                  const data = d.data();
                  const t = parseTs(data.createdAt);
                  return {
                    id: d.id,
                    senderUid: String(data.senderUid ?? ''),
                    senderName: String(data.senderName ?? ''),
                    senderEmail: String(data.senderEmail ?? ''),
                    recipientUid: String(data.recipientUid ?? 'SCHOOL_OFFICE'),
                    subject: String(data.subject ?? ''),
                    body: String(data.body ?? ''),
                    read: Boolean(data.read),
                    createdAtMs: t.ms,
                    displayDate: t.label,
                  };
                })
                .sort((a, b) => b.createdAtMs - a.createdAtMs),
            );
          } catch {
            // Ignore
          }
        };
        void loadUserMessages();
        setOnlineTestSubmissions([]);
        setStudentRecords([]);
      }
    } else {
      setMessages([]);
      setOnlineTestSubmissions([]);
      setStudentRecords([]);
    }

    return () => unsubs.forEach((u) => u());
  }, [authReady, isAdmin, user]);

  const saveUserProfile = async (next: Omit<UserProfileRecord, 'uid' | 'email'>) => {
    if (!user?.emailVerified) throw new Error('Please sign in with Google first.');
    const uid = user.uid;
    const ref = doc(db, 'userProfiles', uid);
    try {
      const existingSnap = await getDoc(ref);
      const privPayload: Record<string, unknown> = {
        uid,
        email: (user.email ?? '').slice(0, 120),
        displayName: next.displayName.trim().slice(0, 100) || 'School Member',
        accountKind: next.accountKind,
        avatarType: next.avatarType,
        avatarValue: next.avatarValue.slice(0, 80),
        phone: (next.phone ?? '').trim().slice(0, 40),
        classOrSubject: (next.classOrSubject ?? '').trim().slice(0, 100),
        bio: (next.bio ?? '').trim().slice(0, 400),
        themeMode: next.themeMode,
        privacyShowEmail: Boolean(next.privacyShowEmail),
        privacyShowPhone: Boolean(next.privacyShowPhone),
        privacyAllowMessages: Boolean(next.privacyAllowMessages),
        privacyPublicCircle: Boolean(next.privacyPublicCircle),
        createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (next.photoDataUrl?.trim()) {
        privPayload.photoDataUrl = next.photoDataUrl.trim().slice(0, 250000);
      }

      const pubPayload: Record<string, unknown> = {
        uid,
        displayName: next.displayName.trim().slice(0, 100) || 'School Member',
        roleLabel: isAdmin
          ? 'School Owner / Admin'
          : next.accountKind === 'teacher'
            ? 'Teacher'
            : next.accountKind === 'student'
              ? 'Student'
              : 'Parent / Guardian',
        avatarType: next.avatarType,
        avatarValue: next.avatarValue.slice(0, 80),
        classOrSubject: (next.classOrSubject ?? '').trim().slice(0, 100),
        showPublicly: Boolean(next.privacyPublicCircle),
        updatedAt: serverTimestamp(),
      };
      if (next.photoDataUrl?.trim()) {
        pubPayload.photoDataUrl = next.photoDataUrl.trim().slice(0, 250000);
      }

      await Promise.all([
        setDoc(ref, privPayload),
        setDoc(doc(db, 'publicProfiles', uid), pubPayload),
      ]);
      setTheme(next.themeMode);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `userProfiles/${uid}`);
    }
  };

  const sendDirectMessage = async (recipientUid: string, subject: string, body: string) => {
    if (!user?.emailVerified) throw new Error('Sign in with Google to send messages.');
    const id = makeId('msg');
    const path = `messages/${id}`;
    const cleanRecipient = recipientUid.trim() || 'SCHOOL_OFFICE';
    try {
      await setDoc(doc(db, 'messages', id), {
        senderUid: user.uid,
        senderName: (userProfile?.displayName || user.displayName || user.email || 'Member').slice(0, 100),
        senderEmail: (user.email || '').slice(0, 120),
        recipientUid: cleanRecipient,
        subject: subject.trim().slice(0, 140),
        body: body.trim().slice(0, 2000),
        read: false,
        createdAt: serverTimestamp(),
      });

      if (!isAdmin) {
        setMessages((prev) => [
          {
            id,
            senderUid: user.uid,
            senderName: userProfile?.displayName || user.displayName || 'Member',
            senderEmail: user.email || '',
            recipientUid: cleanRecipient,
            subject: subject.trim(),
            body: body.trim(),
            read: false,
            createdAtMs: Date.now(),
            displayDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
          },
          ...prev,
        ]);
      }

      // Notify ADMINS or target user if admin
      if (isAdmin && cleanRecipient !== 'SCHOOL_OFFICE' && cleanRecipient !== 'ADMINS') {
        await setDoc(doc(db, 'notifications', makeId('notif')), {
          recipientUid: cleanRecipient,
          title: `New Message: ${subject.trim().slice(0, 90)}`,
          body: body.trim().slice(0, 250),
          kind: 'message',
          read: false,
          createdAt: serverTimestamp(),
        });
      } else if (!isAdmin) {
        await setDoc(doc(db, 'notifications', makeId('notif')), {
          recipientUid: 'ADMINS',
          title: `Inbox Message from ${userProfile?.displayName || user.email}`,
          body: `${subject.trim().slice(0, 90)} — ${body.trim().slice(0, 180)}`,
          kind: 'message',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const markMessageRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: true });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `messages/${id}`);
    }
  };

  const deleteDirectMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `messages/${id}`);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      const target = notifications.find((n) => n.id === id);
      if (target && target.recipientUid !== 'ALL') {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      }
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.read && n.recipientUid !== 'ALL');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(
      unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {})),
    );
  };

  const ensureLibrarySeeded = async () => {
    if (dbLibrary || !isAdmin) return;
    const batch = writeBatch(db);
    for (const item of DEFAULT_LIBRARY_ITEMS) {
      const payload: Record<string, unknown> = {
        title: item.title,
        itemType: item.itemType,
        subject: item.subject,
        gradeLevel: item.gradeLevel,
        description: item.description,
        fileName: item.fileName,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        sourceType: item.sourceType,
        approvalStatus: item.approvalStatus,
        submittedByUid: 'system-owner',
        submittedByName: item.submittedByName,
        submittedByEmail: item.submittedByEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (item.fileUrl) payload.fileUrl = item.fileUrl;
      if (item.fileData) payload.fileData = item.fileData;
      if (item.storyChapters) payload.storyChapters = item.storyChapters;
      if (item.quizQuestions) payload.quizQuestions = item.quizQuestions;
      batch.set(doc(db, 'libraryItems', item.id), payload);
    }
    await batch.commit();
  };

  const saveLibraryItem = async (payload: SaveLibraryItemPayload, existingId?: string) => {
    if (!user?.emailVerified) {
      throw new Error('Please sign in with Google to upload or submit library resources.');
    }
    const id = existingId || makeId('lib');
    const path = `libraryItems/${id}`;
    try {
      await ensureLibrarySeeded();
      const existingDoc = existingId ? await getDoc(doc(db, 'libraryItems', id)) : null;

      const writeBody: Record<string, unknown> = {
        title: payload.title.trim().slice(0, 160),
        itemType: payload.itemType,
        subject: payload.subject,
        gradeLevel: payload.gradeLevel.trim().slice(0, 60) || 'All Grades',
        description: payload.description.trim().slice(0, 600),
        fileName: payload.fileName.trim().slice(0, 180) || 'resource.txt',
        mimeType: payload.mimeType.trim().slice(0, 120) || 'text/plain',
        sizeBytes: Math.max(0, Math.min(104857600, Math.round(Number(payload.sizeBytes) || 0))),
        sourceType: payload.sourceType,
        approvalStatus: isAdmin ? 'approved' : 'pending',
        submittedByUid: user.uid,
        submittedByName: (userProfile?.displayName || user.displayName || user.email || 'Teacher').slice(0, 100),
        submittedByEmail: (user.email || PRIMARY_OWNER_EMAIL).slice(0, 120),
        updatedAt: serverTimestamp(),
      };
      if (payload.fileUrl?.trim()) {
        writeBody.fileUrl = payload.fileUrl.trim().slice(0, 1000);
      }
      if (payload.fileData?.trim()) {
        if (payload.fileData.trim().length > 700000) {
          throw new Error('File exceeds 500 KB direct upload cap. Use an external file URL instead.');
        }
        writeBody.fileData = payload.fileData.trim();
      }
      if (payload.storyChapters && payload.storyChapters.length > 0) {
        writeBody.storyChapters = payload.storyChapters.slice(0, 20);
      }
      if (payload.quizQuestions && payload.quizQuestions.length > 0) {
        writeBody.quizQuestions = payload.quizQuestions.slice(0, 30);
      }

      if (existingDoc && existingDoc.exists()) {
        writeBody.createdAt = existingDoc.data().createdAt;
        await setDoc(doc(db, 'libraryItems', id), writeBody);
      } else {
        writeBody.createdAt = serverTimestamp();
        await setDoc(doc(db, 'libraryItems', id), writeBody);
      }

      if (!isAdmin) {
        await setDoc(doc(db, 'notifications', makeId('notif')), {
          recipientUid: 'ADMINS',
          title: `New ${payload.itemType} Awaiting Approval`,
          body: `${userProfile?.displayName || user.email} uploaded "${payload.title}" (${payload.subject}).`,
          kind: 'approval',
          read: false,
          createdAt: serverTimestamp(),
        });
        setDbLibrary((prev) => {
          const item: LibraryItemRecord = {
            id,
            title: String(writeBody.title),
            itemType: payload.itemType,
            subject: payload.subject,
            gradeLevel: String(writeBody.gradeLevel),
            description: String(writeBody.description),
            fileName: String(writeBody.fileName),
            mimeType: String(writeBody.mimeType),
            sizeBytes: Number(writeBody.sizeBytes),
            sourceType: payload.sourceType,
            fileUrl: payload.fileUrl,
            fileData: payload.fileData,
            storyChapters: payload.storyChapters,
            quizQuestions: payload.quizQuestions,
            approvalStatus: 'pending',
            submittedByUid: user.uid,
            submittedByName: String(writeBody.submittedByName),
            submittedByEmail: String(writeBody.submittedByEmail),
            createdAtMs: Date.now(),
            displayDate: 'Just now',
          };
          return [item, ...(prev ?? DEFAULT_LIBRARY_ITEMS)];
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const approveLibraryItem = async (id: string) => {
    try {
      await ensureLibrarySeeded();
      const snap = await getDoc(doc(db, 'libraryItems', id));
      if (!snap.exists()) return;
      const d = snap.data();
      await updateDoc(doc(db, 'libraryItems', id), {
        approvalStatus: 'approved',
        updatedAt: serverTimestamp(),
      });
      if (d.submittedByUid && d.submittedByUid !== 'system-owner') {
        await setDoc(doc(db, 'notifications', makeId('notif')), {
          recipientUid: String(d.submittedByUid),
          title: 'Resource Approved by Owner',
          body: `Your ${String(d.itemType ?? 'resource')} "${String(d.title ?? '')}" is now live in the Subject Library.`,
          kind: 'approval',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `libraryItems/${id}`);
    }
  };

  const rejectLibraryItem = async (id: string) => {
    try {
      await ensureLibrarySeeded();
      const snap = await getDoc(doc(db, 'libraryItems', id));
      if (!snap.exists()) return;
      const d = snap.data();
      await updateDoc(doc(db, 'libraryItems', id), {
        approvalStatus: 'rejected',
        updatedAt: serverTimestamp(),
      });
      if (d.submittedByUid && d.submittedByUid !== 'system-owner') {
        await setDoc(doc(db, 'notifications', makeId('notif')), {
          recipientUid: String(d.submittedByUid),
          title: 'Resource Needs Revision',
          body: `Owner marked "${String(d.title ?? '')}" as rejected. Please review and re-submit.`,
          kind: 'approval',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `libraryItems/${id}`);
    }
  };

  const deleteLibraryItem = async (id: string) => {
    try {
      await ensureLibrarySeeded();
      await deleteDoc(doc(db, 'libraryItems', id));
      if (!isAdmin) {
        setDbLibrary((prev) => (prev ? prev.filter((item) => item.id !== id) : null));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `libraryItems/${id}`);
    }
  };

  const submitOnlineTest = async (payload: {
    testId: string;
    testTitle: string;
    subject: string;
    studentName: string;
    className: string;
    score: number;
    totalQuestions: number;
    percentage: number;
  }) => {
    const id = makeId('quizsub');
    const path = `onlineTestSubmissions/${id}`;
    try {
      const total = Math.max(1, Math.min(100, Math.round(payload.totalQuestions)));
      const score = Math.max(0, Math.min(total, Math.round(payload.score)));
      const percentage = Math.max(0, Math.min(100, Math.round(payload.percentage)));
      await setDoc(doc(db, 'onlineTestSubmissions', id), {
        testId: payload.testId.slice(0, 128),
        testTitle: payload.testTitle.slice(0, 160),
        subject: payload.subject.slice(0, 60),
        studentName: payload.studentName.trim().slice(0, 100),
        className: payload.className.trim().slice(0, 40),
        score,
        totalQuestions: total,
        percentage,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const ensureSportsSeeded = async () => {
    if (dbSports || !isAdmin) return;
    const batch = writeBatch(db);
    for (const s of DEFAULT_SPORTS_ENTERTAINMENT) {
      const payload: Record<string, unknown> = {
        title: s.title,
        activityType: s.activityType,
        eventDate: s.eventDate,
        description: s.description,
        highlights: s.highlights,
        approvalStatus: s.approvalStatus,
        submittedByUid: 'system-owner',
        submittedByName: s.submittedByName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (s.imageUrl) payload.imageUrl = s.imageUrl;
      if (s.videoUrl) payload.videoUrl = s.videoUrl;
      batch.set(doc(db, 'sportsEntertainment', s.id), payload);
    }
    await batch.commit();
  };

  const saveSportsItem = async (payload: SaveSportsPayload, existingId?: string) => {
    if (!user?.emailVerified) {
      throw new Error('Sign in with Google to submit a Sports or Entertainment update.');
    }
    const id = existingId || makeId('sport');
    const path = `sportsEntertainment/${id}`;
    try {
      await ensureSportsSeeded();
      const existingDoc = existingId ? await getDoc(doc(db, 'sportsEntertainment', id)) : null;

      const writeBody: Record<string, unknown> = {
        title: payload.title.trim().slice(0, 160),
        activityType: payload.activityType,
        eventDate: payload.eventDate.trim().slice(0, 40),
        description: payload.description.trim().slice(0, 1200),
        highlights: payload.highlights.map((h) => h.trim()).filter(Boolean).slice(0, 8),
        approvalStatus: isAdmin ? 'approved' : 'pending',
        submittedByUid: user.uid,
        submittedByName: (userProfile?.displayName || user.displayName || user.email || 'Teacher').slice(0, 100),
        updatedAt: serverTimestamp(),
      };
      if (payload.imageUrl?.trim()) writeBody.imageUrl = payload.imageUrl.trim().slice(0, 250000);
      if (payload.videoUrl?.trim()) writeBody.videoUrl = payload.videoUrl.trim().slice(0, 500);

      if (existingDoc && existingDoc.exists()) {
        writeBody.createdAt = existingDoc.data().createdAt;
        await setDoc(doc(db, 'sportsEntertainment', id), writeBody);
      } else {
        writeBody.createdAt = serverTimestamp();
        await setDoc(doc(db, 'sportsEntertainment', id), writeBody);
      }

      if (!isAdmin) {
        await setDoc(doc(db, 'notifications', makeId('notif')), {
          recipientUid: 'ADMINS',
          title: 'Sports & Entertainment Post Pending',
          body: `${writeBody.submittedByName} submitted "${payload.title}" for approval.`,
          kind: 'approval',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const approveSportsItem = async (id: string) => {
    try {
      await ensureSportsSeeded();
      const snap = await getDoc(doc(db, 'sportsEntertainment', id));
      if (!snap.exists()) return;
      const d = snap.data();
      await updateDoc(doc(db, 'sportsEntertainment', id), {
        approvalStatus: 'approved',
        updatedAt: serverTimestamp(),
      });
      if (d.submittedByUid && d.submittedByUid !== 'system-owner') {
        await setDoc(doc(db, 'notifications', makeId('notif')), {
          recipientUid: String(d.submittedByUid),
          title: 'Sports / Entertainment Activity Approved',
          body: `Owner approved "${String(d.title ?? '')}" on the public campus portal.`,
          kind: 'approval',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sportsEntertainment/${id}`);
    }
  };

  const rejectSportsItem = async (id: string) => {
    try {
      await ensureSportsSeeded();
      await updateDoc(doc(db, 'sportsEntertainment', id), {
        approvalStatus: 'rejected',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sportsEntertainment/${id}`);
    }
  };

  const deleteSportsItem = async (id: string) => {
    try {
      await ensureSportsSeeded();
      await deleteDoc(doc(db, 'sportsEntertainment', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `sportsEntertainment/${id}`);
    }
  };

  const syncClassSummariesFromRecords = async (allRecords: StudentRosterRecord[]) => {
    const batch = writeBatch(db);
    let hasUpdates = false;
    SCHOOL_CLASSES.forEach((cls, idx) => {
      const recordsForClass = allRecords.filter((r) => r.className === cls);
      if (recordsForClass.length > 0) {
        hasUpdates = true;
        const summary = computeSummaryForClass(cls, allRecords, idx + 1);
        batch.set(doc(db, 'classPerformanceSummaries', cls), {
          ...summary,
          updatedAt: serverTimestamp(),
        });
      }
    });
    if (hasUpdates) {
      await batch.commit();
    }
  };

  const saveStudentRecord = async (payload: SaveStudentPayload, existingId?: string) => {
    const id = existingId || makeId('stu');
    const path = `studentRecords/${id}`;
    try {
      const cleanRecord: StudentRosterRecord = {
        id,
        studentName: payload.studentName.trim().slice(0, 100),
        className: payload.className.trim().slice(0, 20),
        gender: payload.gender,
        studentCode: payload.studentCode?.trim().slice(0, 40) || undefined,
        term1Avg: Math.max(0, Math.min(100, Number(payload.term1Avg) || 0)),
        term2Avg: Math.max(0, Math.min(100, Number(payload.term2Avg) || 0)),
        term3Avg: Math.max(0, Math.min(100, Number(payload.term3Avg) || 0)),
        pleAvg: Math.max(0, Math.min(100, Number(payload.pleAvg) || 0)),
        subjectScores: payload.subjectScores || {},
      };

      const docBody: Record<string, unknown> = {
        studentName: cleanRecord.studentName,
        className: cleanRecord.className,
        gender: cleanRecord.gender,
        term1Avg: cleanRecord.term1Avg,
        term2Avg: cleanRecord.term2Avg,
        term3Avg: cleanRecord.term3Avg,
        pleAvg: cleanRecord.pleAvg,
        subjectScores: cleanRecord.subjectScores,
        updatedAt: serverTimestamp(),
      };
      if (cleanRecord.studentCode) docBody.studentCode = cleanRecord.studentCode;

      await setDoc(doc(db, 'studentRecords', id), docBody);

      const updatedList = existingId
        ? studentRecords.map((r) => (r.id === id ? cleanRecord : r))
        : [...studentRecords, cleanRecord];
      await syncClassSummariesFromRecords(updatedList);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const bulkImportStudents = async (rows: SaveStudentPayload[]): Promise<number> => {
    if (rows.length === 0) return 0;
    try {
      const batch = writeBatch(db);
      const nextRecords = [...studentRecords];
      for (const row of rows.slice(0, 150)) {
        const id = makeId('stu');
        const cleanRecord: StudentRosterRecord = {
          id,
          studentName: row.studentName.trim().slice(0, 100),
          className: row.className.trim().slice(0, 20),
          gender: row.gender,
          studentCode: row.studentCode?.trim().slice(0, 40) || undefined,
          term1Avg: Math.max(0, Math.min(100, Number(row.term1Avg) || 0)),
          term2Avg: Math.max(0, Math.min(100, Number(row.term2Avg) || 0)),
          term3Avg: Math.max(0, Math.min(100, Number(row.term3Avg) || 0)),
          pleAvg: Math.max(0, Math.min(100, Number(row.pleAvg) || 0)),
          subjectScores: row.subjectScores || {},
        };
        const docBody: Record<string, unknown> = {
          studentName: cleanRecord.studentName,
          className: cleanRecord.className,
          gender: cleanRecord.gender,
          term1Avg: cleanRecord.term1Avg,
          term2Avg: cleanRecord.term2Avg,
          term3Avg: cleanRecord.term3Avg,
          pleAvg: cleanRecord.pleAvg,
          subjectScores: cleanRecord.subjectScores,
          updatedAt: serverTimestamp(),
        };
        if (cleanRecord.studentCode) docBody.studentCode = cleanRecord.studentCode;
        batch.set(doc(db, 'studentRecords', id), docBody);
        nextRecords.push(cleanRecord);
      }
      await batch.commit();
      await syncClassSummariesFromRecords(nextRecords);
      return Math.min(150, rows.length);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'studentRecords/bulk');
    }
  };

  const deleteStudentRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'studentRecords', id));
      const remaining = studentRecords.filter((r) => r.id !== id);
      await syncClassSummariesFromRecords(remaining);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `studentRecords/${id}`);
    }
  };

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const classSummaries = useMemo(() => {
    if (!dbClassSummaries) return DEFAULT_CLASS_SUMMARIES;
    // Merge Firestore summaries on top of default classes so every class row displays
    const byClass = new Map<string, ClassPerformanceSummaryRecord>();
    DEFAULT_CLASS_SUMMARIES.forEach((s) => byClass.set(s.className, s));
    dbClassSummaries.forEach((s) => byClass.set(s.className, s));
    return Array.from(byClass.values()).sort((a, b) => a.order - b.order);
  }, [dbClassSummaries]);

  const value = useMemo<PortalFeaturesContextValue>(
    () => ({
      userProfile,
      publicProfiles,
      messages,
      notifications,
      unreadNotificationsCount,
      libraryItems: dbLibrary ?? DEFAULT_LIBRARY_ITEMS,
      onlineTestSubmissions,
      sportsItems: dbSports ?? DEFAULT_SPORTS_ENTERTAINMENT,
      studentRecords,
      classSummaries,
      saveUserProfile,
      sendDirectMessage,
      markMessageRead,
      deleteDirectMessage,
      markNotificationRead,
      markAllNotificationsRead,
      saveLibraryItem,
      approveLibraryItem,
      rejectLibraryItem,
      deleteLibraryItem,
      submitOnlineTest,
      saveSportsItem,
      approveSportsItem,
      rejectSportsItem,
      deleteSportsItem,
      saveStudentRecord,
      bulkImportStudents,
      deleteStudentRecord,
    }),
    [
      userProfile,
      publicProfiles,
      messages,
      notifications,
      unreadNotificationsCount,
      dbLibrary,
      onlineTestSubmissions,
      dbSports,
      studentRecords,
      classSummaries,
    ],
  );

  return <PortalFeaturesContext.Provider value={value}>{children}</PortalFeaturesContext.Provider>;
}

export function usePortalFeatures(): PortalFeaturesContextValue {
  const ctx = useContext(PortalFeaturesContext);
  if (!ctx) throw new Error('usePortalFeatures must be used inside PortalFeaturesProvider');
  return ctx;
}
