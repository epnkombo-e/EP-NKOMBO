import { SCHOOL_IMAGES, PRIMARY_OWNER_EMAIL } from './schoolData';
import { utf8ToBase64DataUrl } from '../lib/fileUtils';

export type LibrarySubject =
  | 'IKINYARWANDA'
  | 'MATHEMATICS'
  | 'SET'
  | 'SRE'
  | 'CREATIVE ARTS'
  | 'FRENCH'
  | 'ENGLISH'
  | 'PHYSICAL EDUCATION'
  | 'RELIGIOUS'
  | 'OTHER BOOKS';

export const LIBRARY_SUBJECTS: { id: LibrarySubject; label: string; shortLabel: string }[] = [
  { id: 'IKINYARWANDA', label: 'Ikinyarwanda', shortLabel: 'Ikinyarwanda' },
  { id: 'MATHEMATICS', label: 'Mathematics', shortLabel: 'Mathematics' },
  { id: 'SET', label: 'SET (Science & Tech)', shortLabel: 'SET' },
  { id: 'SRE', label: 'SRE (Social & Religious)', shortLabel: 'SRE' },
  { id: 'CREATIVE ARTS', label: 'Creative Arts', shortLabel: 'Creative Arts' },
  { id: 'FRENCH', label: 'French (Français)', shortLabel: 'French' },
  { id: 'ENGLISH', label: 'English', shortLabel: 'English' },
  { id: 'PHYSICAL EDUCATION', label: 'Physical Education', shortLabel: 'Phys. Ed.' },
  { id: 'RELIGIOUS', label: 'Religious Studies', shortLabel: 'Religious' },
  { id: 'OTHER BOOKS', label: 'Other Books & Bookstories', shortLabel: 'Storybooks & Other' },
];

export type LibraryItemType = 'Book' | 'Exam' | 'Test' | 'Lesson Plan' | 'Storybook';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface StoryChapter {
  title: string;
  body: string;
}

export interface QuizQuestionItem {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface LibraryItemRecord {
  id: string;
  title: string;
  itemType: LibraryItemType;
  subject: LibrarySubject;
  gradeLevel: string;
  description: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sourceType: 'upload' | 'url' | 'storybook' | 'ai_generated' | 'quiz';
  fileUrl?: string;
  fileData?: string;
  storyChapters?: StoryChapter[];
  quizQuestions?: QuizQuestionItem[];
  approvalStatus: ApprovalStatus;
  submittedByUid: string;
  submittedByName: string;
  submittedByEmail: string;
  createdAtMs: number;
  displayDate: string;
}

export interface OnlineTestSubmissionRecord {
  id: string;
  testId: string;
  testTitle: string;
  subject: string;
  studentName: string;
  className: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAtMs: number;
  createdAtLabel: string;
}

export type SportsActivityType = 'Sports' | 'Entertainment' | 'Club & Culture';

export interface SportsEntertainmentRecord {
  id: string;
  title: string;
  activityType: SportsActivityType;
  eventDate: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  highlights: string[];
  approvalStatus: ApprovalStatus;
  submittedByUid: string;
  submittedByName: string;
  createdAtMs: number;
  displayDate: string;
}

export const SCHOOL_CLASSES = ['N1', 'N2', 'N3', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'] as const;
export type SchoolClassName = (typeof SCHOOL_CLASSES)[number];

export interface StudentRosterRecord {
  id: string;
  studentName: string;
  className: string;
  gender: 'Female' | 'Male';
  studentCode?: string;
  term1Avg: number;
  term2Avg: number;
  term3Avg: number;
  pleAvg: number;
  subjectScores: Record<string, number>;
  updatedAtLabel?: string;
}

export interface ClassPerformanceSummaryRecord {
  id: string;
  className: string;
  order: number;
  totalStudents: number;
  femaleCount: number;
  maleCount: number;
  term1Avg: number;
  term2Avg: number;
  term3Avg: number;
  pleAvg: number;
  passRatePct: number;
  femaleAvg: number;
  maleAvg: number;
  subjectAverages: Record<string, number>;
}

export type AvatarType = 'photo' | 'sticker' | 'avatar';
export type AccountKind = 'student' | 'parent' | 'teacher';

export interface UserProfileRecord {
  uid: string;
  email: string;
  displayName: string;
  accountKind: AccountKind;
  avatarType: AvatarType;
  avatarValue: string;
  photoDataUrl?: string;
  phone?: string;
  classOrSubject?: string;
  bio?: string;
  themeMode: 'light' | 'dark';
  privacyShowEmail: boolean;
  privacyShowPhone: boolean;
  privacyAllowMessages: boolean;
  privacyPublicCircle: boolean;
}

export interface PublicProfileBadge {
  uid: string;
  displayName: string;
  roleLabel: string;
  avatarType: AvatarType;
  avatarValue: string;
  photoDataUrl?: string;
  classOrSubject?: string;
  showPublicly: boolean;
}

export interface DirectMessageRecord {
  id: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  recipientUid: string;
  subject: string;
  body: string;
  read: boolean;
  createdAtMs: number;
  displayDate: string;
}

export interface NotificationRecord {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  kind: 'approval' | 'message' | 'exam' | 'announcement' | 'performance';
  read: boolean;
  createdAtMs: number;
  displayDate: string;
}

export type HeroBgMode =
  | 'default'
  | 'campus_courtyard'
  | 'science_garden'
  | 'library'
  | 'sports_pitch'
  | 'lake_sunset'
  | 'custom';

export const HERO_BG_PRESETS: {
  id: HeroBgMode;
  label: string;
  description: string;
  imageUrl?: string;
}[] = [
  {
    id: 'default',
    label: 'Lake Kivu Slate & Sky (Default)',
    description: 'Clean academic slate light/dark gradient backdrop',
  },
  {
    id: 'campus_courtyard',
    label: 'Main Campus Courtyard',
    description: 'Sunlit stone courtyard overlooking Lake Kivu',
    imageUrl: SCHOOL_IMAGES.heroCampus,
  },
  {
    id: 'science_garden',
    label: 'Hillside Science Garden',
    description: 'Terraced agroecology beds above Lake Kivu',
    imageUrl: SCHOOL_IMAGES.scienceGarden,
  },
  {
    id: 'library',
    label: 'Nkombo Reading Room',
    description: 'Oak study tables and bilingual book shelves',
    imageUrl: SCHOOL_IMAGES.libraryReading,
  },
  {
    id: 'sports_pitch',
    label: 'Lakeside Football Courtyard',
    description: 'Green pitch and athletics grounds at sunset',
    imageUrl: SCHOOL_IMAGES.sportsCourtyard,
  },
  {
    id: 'lake_sunset',
    label: 'Kivu Deep Navy Sunrise',
    description: 'Rich deep lake-horizon gradient band',
  },
];

export interface EducationPortalLink {
  id: string;
  name: string;
  badge: string;
  url: string;
  description: string;
}

export const RWANDA_EDUCATION_LINKS: EducationPortalLink[] = [
  {
    id: 'karame-beruro',
    name: 'KARAME BERURO Program',
    badge: 'Literacy & Early Reading',
    url: 'https://www.reb.gov.rw',
    description:
      'Rwanda early-grade Kinyarwanda literacy, fluency coaching, and community reading support resources.',
  },
  {
    id: 'camis',
    name: 'CAMIS Portal',
    badge: 'Assessment & Marks',
    url: 'https://camis.reb.rw',
    description:
      'Comprehensive Assessment Management Information System for term marks, learner records, and school progression.',
  },
  {
    id: 'reb-elearning',
    name: 'REB eLearning Platform',
    badge: 'Digital Textbooks & CBC',
    url: 'https://elearning.reb.rw',
    description:
      'Official Rwanda Basic Education Board digital textbooks, teacher guides, and interactive primary lessons.',
  },
  {
    id: 'nesa',
    name: 'NESA Portal',
    badge: 'National Exams & PLE',
    url: 'https://www.nesa.gov.rw',
    description:
      'National Examination and School Inspection Authority updates, P6 PLE timetables, and inspection standards.',
  },
  {
    id: 'reb-main',
    name: 'REB Official Website',
    badge: 'Curriculum & Circulars',
    url: 'https://www.reb.gov.rw',
    description:
      'Competence-Based Curriculum frameworks, subject syllabi, and national teaching announcements.',
  },
  {
    id: 'mineduc',
    name: 'MINEDUC Rwanda',
    badge: 'Ministry of Education',
    url: 'https://www.mineduc.gov.rw',
    description:
      'Official school calendar decrees, national education policy updates, and academic term dates.',
  },
];

export const STICKER_OPTIONS = [
  { id: 'sticker-owl', label: 'Reading Owl', bg: '#123D68', accent: '#F2B544' },
  { id: 'sticker-wave', label: 'Lake Kivu Wave', bg: '#1769AA', accent: '#BAE6FD' },
  { id: 'sticker-leaf', label: 'Science Garden', bg: '#14532D', accent: '#86EFAC' },
  { id: 'sticker-star', label: 'PLE Honor Star', bg: '#92400E', accent: '#FDE68A' },
  { id: 'sticker-ball', label: 'Campus Sports', bg: '#0F766E', accent: '#CCFBF1' },
  { id: 'sticker-harp', label: 'Choir & Arts', bg: '#5B21B6', accent: '#DDD6FE' },
];

export const AVATAR_OPTIONS = [
  { id: 'avatar-scholar', label: 'Scholar Crest', bg: '#0B2E50', ring: '#F2B544' },
  { id: 'avatar-teacher', label: 'Educator Shield', bg: '#14532D', ring: '#6EE7B7' },
  { id: 'avatar-scientist', label: 'STEM Explorer', bg: '#1D4ED8', ring: '#93C5FD' },
  { id: 'avatar-artist', label: 'Creative Muse', bg: '#9A3412', ring: '#FDBA74' },
  { id: 'avatar-captain', label: 'House Captain', bg: '#0F766E', ring: '#5EEAD4' },
  { id: 'avatar-sun', label: 'Nkombo Sunrise', bg: '#7C2D12', ring: '#FCD34D' },
];

const SAMPLE_MATH_LESSON = `EP SAINT PIERRE NKOMBO — REB CBC LESSON PLAN (PRIMARY 5 MATHEMATICS)
Unit 4: Fractions, Decimals & Percentages in Everyday Lake Kivu Life
Duration: 40 Minutes

1. Instructional Objective:
By the end of this lesson, using beans from the school garden and fraction strips, P5 learners will accurately compare equivalent fractions and convert simple halves, quarters, and fifths into percentages (at least 4/5 problems correct).

2. Lesson Steps:
- Introduction (5 min): Warm-up mental count & Lake Kivu fishing net sharing problem.
- Development (20 min): Cooperative groups fold paper strips and weigh ibishyimbo bean portions.
- Application (10 min): Word problems solved on chalkboard and notebooks.
- Conclusion & Homework (5 min): Quick exit check + ask parents to share 1 household measurement fraction.`;

export const DEFAULT_LIBRARY_ITEMS: LibraryItemRecord[] = [
  {
    id: 'lib-kinyarwanda-p3-book',
    title: 'Gusoma no Kwandika Ikinyarwanda — P3 Primer',
    itemType: 'Book',
    subject: 'IKINYARWANDA',
    gradeLevel: 'Primary 3',
    description:
      'Foundational Kinyarwanda reading stories, proverbs (imigani), and grammar comprehension exercises aligned with REB lower primary standards.',
    fileName: 'Ikinyarwanda-P3-Reading-Guide.txt',
    mimeType: 'text/plain',
    sizeBytes: 640,
    sourceType: 'ai_generated',
    fileData: utf8ToBase64DataUrl(
      'text/plain',
      'IKINYARWANDA P3 READING & PROVERBS GUIDE\n\n1. Umugani: "Ubumwe ni imbaraga."\n2. Inkuru ngufi: Urugendo ku Nkombo...\n3. Ibibazo byo kumva umwandiko...',
    ),
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Chantal Nyiransengiyumva',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1795220000000,
    displayDate: '21 Nov 2026',
  },
  {
    id: 'lib-math-p5-lesson-plan',
    title: 'P5 CBC Lesson Plan: Fractions & Bean Harvest Ratios',
    itemType: 'Lesson Plan',
    subject: 'MATHEMATICS',
    gradeLevel: 'Primary 5',
    description:
      'Approved Rwanda Competence-Based Curriculum lesson plan integrating Nkombo garden harvest measurements with fractions and percentages.',
    fileName: 'P5-Math-Fractions-CBC-LessonPlan.txt',
    mimeType: 'text/plain',
    sizeBytes: SAMPLE_MATH_LESSON.length,
    sourceType: 'ai_generated',
    fileData: utf8ToBase64DataUrl('text/plain', SAMPLE_MATH_LESSON),
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Emmanuel Niyonzima',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1795180000000,
    displayDate: '20 Nov 2026',
  },
  {
    id: 'lib-math-p6-test',
    title: 'Primary 6 Term II Online Mathematics Practice Test',
    itemType: 'Test',
    subject: 'MATHEMATICS',
    gradeLevel: 'Primary 6',
    description:
      'Interactive self-marking online mathematics test covering ratios, percentages, area, and speed for P6 PLE preparation.',
    fileName: 'P6-Mathematics-Online-Test.txt',
    mimeType: 'text/plain',
    sizeBytes: 420,
    sourceType: 'quiz',
    quizQuestions: [
      {
        question: 'What is 3/4 expressed as a percentage?',
        options: ['25%', '50%', '75%', '80%'],
        correctIndex: 2,
      },
      {
        question: 'A rectangular school garden bed is 8m long and 3m wide. What is its area?',
        options: ['11 m²', '22 m²', '24 m²', '48 m²'],
        correctIndex: 2,
      },
      {
        question: 'If 4 exercise books cost 1,600 RWF, how much do 7 exercise books cost?',
        options: ['2,400 RWF', '2,800 RWF', '3,000 RWF', '3,200 RWF'],
        correctIndex: 1,
      },
      {
        question: 'Solve for x: 3x + 7 = 28',
        options: ['x = 5', 'x = 6', 'x = 7', 'x = 9'],
        correctIndex: 2,
      },
    ],
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Emmanuel Niyonzima',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1795150000000,
    displayDate: '19 Nov 2026',
  },
  {
    id: 'lib-set-p6-exam-guide',
    title: 'P6 SET Ecosystem & Clean Water Filtration Revision Pack',
    itemType: 'Exam',
    subject: 'SET',
    gradeLevel: 'Primary 6',
    description:
      'Revision exam worksheet covering solar energy, simple machines, human anatomy, and Lake Kivu water filtration.',
    fileName: 'P6-SET-Revision-Exam.txt',
    mimeType: 'text/plain',
    sizeBytes: 512,
    sourceType: 'quiz',
    quizQuestions: [
      {
        question: 'Which part of a bean plant absorbs water and mineral salts from the soil?',
        options: ['Leaves', 'Stem', 'Roots', 'Flowers'],
        correctIndex: 2,
      },
      {
        question: 'Which simple machine is used to raise the school flag on a flagpole?',
        options: ['Inclined plane', 'Pulley', 'Wedge', 'Screw'],
        correctIndex: 1,
      },
      {
        question: 'Boiling drinking water from Lake Kivu primarily helps to:',
        options: ['Add oxygen', 'Kill harmful microbes', 'Change color', 'Increase saltiness'],
        correctIndex: 1,
      },
    ],
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Emmanuel Niyonzima',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1795110000000,
    displayDate: '18 Nov 2026',
  },
  {
    id: 'lib-sre-p5-notes',
    title: 'Social & Religious Studies — Rwanda Civic Values & Lake Kivu Geography',
    itemType: 'Book',
    subject: 'SRE',
    gradeLevel: 'Primary 5',
    description:
      'Comprehensive study notes on Western Province geography, Rwandan unity, peace values, and community Umuganda.',
    fileName: 'P5-SRE-Rwanda-Geography-Values.txt',
    mimeType: 'text/plain',
    sizeBytes: 480,
    sourceType: 'ai_generated',
    fileData: utf8ToBase64DataUrl(
      'text/plain',
      'P5 SOCIAL & RELIGIOUS STUDIES (SRE)\n\nTopic: Rusizi District & Nkombo Island Geography\n- Nkombo is Rwanda’s largest island in Lake Kivu.\n- Core Civic Values: Ubumwe, Umurimo, Gukunda Igihugu.',
    ),
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Jean Bosco Habimana',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1795080000000,
    displayDate: '17 Nov 2026',
  },
  {
    id: 'lib-creative-arts-guide',
    title: 'Imigongo Patterns, Choir Rhythm & Visual Sketching Workbook',
    itemType: 'Book',
    subject: 'CREATIVE ARTS',
    gradeLevel: 'Primary 1–6',
    description:
      'Step-by-step Rwandan geometric Imigongo motif lessons, solfa notation songs, and clay sculpting prompts.',
    fileName: 'Creative-Arts-Imigongo-Workbook.txt',
    mimeType: 'text/plain',
    sizeBytes: 390,
    sourceType: 'ai_generated',
    fileData: utf8ToBase64DataUrl(
      'text/plain',
      'CREATIVE ARTS WORKBOOK\n1. Geometric Imigongo motifs using triangular grids\n2. Traditional Rwandan 6/8 drumming & Saint Pierre Choir warm-up scales.',
    ),
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Diane Uwimana',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1795040000000,
    displayDate: '16 Nov 2026',
  },
  {
    id: 'lib-french-p4-reader',
    title: 'Le Français au Quotidien — Cahier de Dialogue (P4–P6)',
    itemType: 'Test',
    subject: 'FRENCH',
    gradeLevel: 'Primary 4–6',
    description:
      'French vocabulary dialogues, verb conjugation practice, and an interactive quick grammar quiz.',
    fileName: 'Francais-Dialogue-P4-P6.txt',
    mimeType: 'text/plain',
    sizeBytes: 380,
    sourceType: 'quiz',
    quizQuestions: [
      {
        question: 'Complétez : "Nous _____ à l’école EP Saint Pierre Nkombo."',
        options: ['vais', 'vas', 'allons', 'allez'],
        correctIndex: 2,
      },
      {
        question: 'Que signifie "Le cahier" en anglais ?',
        options: ['The chalkboard', 'The notebook', 'The library', 'The garden'],
        correctIndex: 1,
      },
      {
        question: 'Choisissez la bonne réponse : "Bonjour Monsieur, _____ ?"',
        options: ['comment allez-vous', 'quel âge est-il', 'où mangent-ils', 'quelle heure'],
        correctIndex: 0,
      },
    ],
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Diane Uwimana',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1795000000000,
    displayDate: '15 Nov 2026',
  },
  {
    id: 'lib-english-nkombo-storybook',
    title: 'Storybook: The Young Botanist of Bugarura Hill',
    itemType: 'Storybook',
    subject: 'ENGLISH',
    gradeLevel: 'Primary 2–5',
    description:
      'Interactive 4-chapter bilingual-inspired illustrated story following Aline as she discovers how rainwater and compost help Nkombo gardens flourish.',
    fileName: 'The-Young-Botanist-of-Bugarura.txt',
    mimeType: 'text/plain',
    sizeBytes: 980,
    sourceType: 'storybook',
    storyChapters: [
      {
        title: 'Chapter 1 · Morning Mist Over Lake Kivu',
        body: 'At 07:15, pale morning sunlight shimmered across Lake Kivu as Aline walked the stone path toward EP Saint Pierre Nkombo. Inside her satchel sat a small notebook tied with blue twine—her first Science Garden Observation Journal.',
      },
      {
        title: 'Chapter 2 · Twelve Terraced Beds',
        body: 'Teacher Emmanuel showed Primary 4 pupils twelve raised garden beds filled with rich volcanic soil and compost. "Every bean seed holds energy," he explained. "Our job is to observe patiently, measure carefully, and share what grows."',
      },
      {
        title: 'Chapter 3 · Measuring the Rain',
        body: 'Week after week, Aline and her classmates checked the rainwater cistern gauge and counted sprouting green leaves. When a dry afternoon arrived, they mulched the soil with banana leaves to keep moisture safely underground.',
      },
      {
        title: 'Chapter 4 · Harvest Assembly',
        body: 'By term end, baskets of shiny ibishyimbo beans fed the whole school during mid-morning break. Aline stood before her friends and read her field notes aloud—learning that curiosity and care can nourish an entire island community.',
      },
    ],
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Diane Uwimana',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1794960000000,
    displayDate: '14 Nov 2026',
  },
  {
    id: 'lib-pe-athletics-plan',
    title: 'Primary Physical Education: Agility, Football & Warm-Up Circuits',
    itemType: 'Lesson Plan',
    subject: 'PHYSICAL EDUCATION',
    gradeLevel: 'All Grades',
    description:
      'Structured 40-minute courtyard warm-ups, cooperative relay games, and youth football passing drills.',
    fileName: 'PE-Athletics-Lesson-Plan.txt',
    mimeType: 'text/plain',
    sizeBytes: 420,
    sourceType: 'ai_generated',
    fileData: utf8ToBase64DataUrl(
      'text/plain',
      'PHYSICAL EDUCATION COURTYARD PLAN\n- 8 min Dynamic stretching\n- 15 min Triangle passing & agility cones\n- 12 min Friendly small-sided team play\n- 5 min Cool-down breathing & hydration check.',
    ),
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Patrick Hakizimana',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1794900000000,
    displayDate: '13 Nov 2026',
  },
  {
    id: 'lib-religious-ethics-book',
    title: 'Christian & Moral Values: Kindness, Peace & Service on Nkombo',
    itemType: 'Book',
    subject: 'RELIGIOUS',
    gradeLevel: 'Primary 1–6',
    description:
      'Values education guide emphasizing compassion, honesty, reconciliation, and neighborly service at school and home.',
    fileName: 'Religious-Moral-Values-Guide.txt',
    mimeType: 'text/plain',
    sizeBytes: 410,
    sourceType: 'ai_generated',
    fileData: utf8ToBase64DataUrl(
      'text/plain',
      'RELIGIOUS & MORAL EDUCATION\nUnit 1: Respecting parents, teachers & classmates\nUnit 2: Caring for Lake Kivu and sharing with those in need.',
    ),
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Marie Claire Mukamana',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1794850000000,
    displayDate: '12 Nov 2026',
  },
  {
    id: 'lib-other-umugani-storybook',
    title: "Umugani w'Inshuti ku Kiyaga cya Kivu (Kinyarwanda Storybook)",
    itemType: 'Storybook',
    subject: 'OTHER BOOKS',
    gradeLevel: 'Nursery – P4',
    description:
      'Interactive Kinyarwanda storybook teaching friendship, teamwork, and wisdom on Lake Kivu — complete with chapter-by-chapter reading.',
    fileName: 'Umugani-Inshuti-Kivu.txt',
    mimeType: 'text/plain',
    sizeBytes: 750,
    sourceType: 'storybook',
    storyChapters: [
      {
        title: 'Igice cya 1 · Mu gitondo ku Nkombo',
        body: 'Mu gitondo cyiza ku kirwa cya Nkombo, abana babiri ari bo Keza na Mugisha bazindukiye ku ishuri bafite ibitabo byabo byo gusoma. Bagendaga baganira ku nyoni nziza ziguruka hejuru y’amazi y’Ikiyaga cya Kivu.',
      },
      {
        title: 'Igice cya 2 · Gufashanya mu isomero',
        body: 'Bageze mu isomero ry’ishuri, basanze murumuna wabo wo mu mwaka wa mbere ataramenya gusoma amagambo maremare. Keza na Mugisha bicaye hamwe na we bamwereka uko basoma ijambo ku rindi.',
      },
      {
        title: 'Igice cya 3 · Ubumwe ni imbaraga',
        body: 'Nyuma y’icyumweru kimwe gusa, wa mwana yashoboye gusoma inkuru ye ya mbere imbere y’ishuri ryose! Mwarimu yarabasimye ati: "Ubumwe, ubufatanye n’urukundo rwo kwiga ni byo bizamura Nkombo yacu."',
      },
    ],
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Chantal Nyiransengiyumva',
    submittedByEmail: PRIMARY_OWNER_EMAIL,
    createdAtMs: 1794800000000,
    displayDate: '10 Nov 2026',
  },
];

export const DEFAULT_SPORTS_ENTERTAINMENT: SportsEntertainmentRecord[] = [
  {
    id: 'sp-inter-school-cup',
    title: 'Rusizi Sector Inter-Primary Football & Netball Friendly Cup',
    activityType: 'Sports',
    eventDate: '11 Dec 2026 · 14:00',
    description:
      'EP Saint Pierre Nkombo U-12 boys and girls football and netball teams host neighboring Nkombo Sector primary schools on our lakeside courtyard pitch.',
    imageUrl: SCHOOL_IMAGES.sportsCourtyard,
    highlights: ['U-12 Boys & Girls Football', 'Girls Netball Friendly', 'Fair Play Trophy Ceremony'],
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Patrick Hakizimana',
    createdAtMs: 1795200000000,
    displayDate: '20 Nov 2026',
  },
  {
    id: 'sp-choir-cultural-day',
    title: 'Saint Pierre Choir, Intore Dance & Trilingual Poetry Showcase',
    activityType: 'Entertainment',
    eventDate: '04 Dec 2026 · 11:00',
    description:
      'Parents and community elders gather in the stone courtyard for traditional Rwandan drumming, choral harmony, and student-written poems in Kinyarwanda, English, and French.',
    imageUrl: SCHOOL_IMAGES.heroCampus,
    highlights: ['60-Voice School Choir', 'Traditional Rwandan Dance', 'Bilingual Drama Sketch'],
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Diane Uwimana',
    createdAtMs: 1795100000000,
    displayDate: '16 Nov 2026',
  },
  {
    id: 'sp-eco-reading-club',
    title: 'Friday Reading Ambassadors & Lake Kivu Agroecology Quiz',
    activityType: 'Club & Culture',
    eventDate: 'Every Friday · 14:30',
    description:
      'P5 and P6 club leaders host riddle games, Imigongo geometric drawing tables, and quick courtyard athletics relays to celebrate a strong week of learning.',
    imageUrl: SCHOOL_IMAGES.libraryReading,
    highlights: ['Peer Reading Circles', 'Imigongo Art Table', 'House Relay Races'],
    approvalStatus: 'approved',
    submittedByUid: 'system-owner',
    submittedByName: 'Emmanuel Niyonzima',
    createdAtMs: 1794950000000,
    displayDate: '12 Nov 2026',
  },
];

export const DEFAULT_CLASS_SUMMARIES: ClassPerformanceSummaryRecord[] = [
  {
    id: 'N1',
    className: 'N1',
    order: 1,
    totalStudents: 24,
    femaleCount: 13,
    maleCount: 11,
    term1Avg: 81.4,
    term2Avg: 84.2,
    term3Avg: 86.8,
    pleAvg: 0,
    passRatePct: 95.8,
    femaleAvg: 87.2,
    maleAvg: 86.3,
    subjectAverages: { IKINYARWANDA: 89, MATHEMATICS: 85, ENGLISH: 82, 'CREATIVE ARTS': 91 },
  },
  {
    id: 'N2',
    className: 'N2',
    order: 2,
    totalStudents: 26,
    femaleCount: 14,
    maleCount: 12,
    term1Avg: 82.0,
    term2Avg: 85.1,
    term3Avg: 87.5,
    pleAvg: 0,
    passRatePct: 96.2,
    femaleAvg: 88.1,
    maleAvg: 86.8,
    subjectAverages: { IKINYARWANDA: 88, MATHEMATICS: 86, ENGLISH: 84, 'CREATIVE ARTS': 92 },
  },
  {
    id: 'N3',
    className: 'N3',
    order: 3,
    totalStudents: 28,
    femaleCount: 15,
    maleCount: 13,
    term1Avg: 83.2,
    term2Avg: 86.0,
    term3Avg: 88.9,
    pleAvg: 0,
    passRatePct: 96.4,
    femaleAvg: 89.4,
    maleAvg: 88.3,
    subjectAverages: { IKINYARWANDA: 90, MATHEMATICS: 88, ENGLISH: 86, 'CREATIVE ARTS': 91 },
  },
  {
    id: 'P1',
    className: 'P1',
    order: 4,
    totalStudents: 32,
    femaleCount: 17,
    maleCount: 15,
    term1Avg: 78.6,
    term2Avg: 81.8,
    term3Avg: 84.7,
    pleAvg: 0,
    passRatePct: 93.8,
    femaleAvg: 85.3,
    maleAvg: 84.0,
    subjectAverages: { IKINYARWANDA: 87, MATHEMATICS: 84, SET: 82, ENGLISH: 81, FRENCH: 79, SRE: 86 },
  },
  {
    id: 'P2',
    className: 'P2',
    order: 5,
    totalStudents: 30,
    femaleCount: 16,
    maleCount: 14,
    term1Avg: 79.4,
    term2Avg: 82.5,
    term3Avg: 85.2,
    pleAvg: 0,
    passRatePct: 94.0,
    femaleAvg: 85.9,
    maleAvg: 84.4,
    subjectAverages: { IKINYARWANDA: 88, MATHEMATICS: 85, SET: 83, ENGLISH: 82, FRENCH: 80, SRE: 86 },
  },
  {
    id: 'P3',
    className: 'P3',
    order: 6,
    totalStudents: 31,
    femaleCount: 16,
    maleCount: 15,
    term1Avg: 80.1,
    term2Avg: 83.4,
    term3Avg: 86.0,
    pleAvg: 0,
    passRatePct: 95.2,
    femaleAvg: 86.6,
    maleAvg: 85.3,
    subjectAverages: { IKINYARWANDA: 88, MATHEMATICS: 86, SET: 85, ENGLISH: 83, FRENCH: 81, SRE: 87 },
  },
  {
    id: 'P4',
    className: 'P4',
    order: 7,
    totalStudents: 29,
    femaleCount: 15,
    maleCount: 14,
    term1Avg: 77.8,
    term2Avg: 81.2,
    term3Avg: 84.6,
    pleAvg: 0,
    passRatePct: 93.1,
    femaleAvg: 85.1,
    maleAvg: 84.1,
    subjectAverages: { MATHEMATICS: 84, SET: 85, ENGLISH: 83, IKINYARWANDA: 88, FRENCH: 80, SRE: 86 },
  },
  {
    id: 'P5',
    className: 'P5',
    order: 8,
    totalStudents: 28,
    femaleCount: 15,
    maleCount: 13,
    term1Avg: 80.5,
    term2Avg: 83.9,
    term3Avg: 87.2,
    pleAvg: 0,
    passRatePct: 96.4,
    femaleAvg: 87.8,
    maleAvg: 86.5,
    subjectAverages: { MATHEMATICS: 87, SET: 88, ENGLISH: 85, IKINYARWANDA: 89, FRENCH: 82, SRE: 88 },
  },
  {
    id: 'P6',
    className: 'P6',
    order: 9,
    totalStudents: 34,
    femaleCount: 18,
    maleCount: 16,
    term1Avg: 83.4,
    term2Avg: 86.8,
    term3Avg: 90.6,
    pleAvg: 98.4,
    passRatePct: 98.4,
    femaleAvg: 91.2,
    maleAvg: 89.9,
    subjectAverages: { MATHEMATICS: 90, SET: 92, ENGLISH: 88, IKINYARWANDA: 93, FRENCH: 86, SRE: 91 },
  },
];
