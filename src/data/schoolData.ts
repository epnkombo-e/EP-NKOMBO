export interface SchoolSettings {
  schoolName: string;
  tagline: string;
  locationLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  gradesServed: string;
  languages: string;
  schoolHours: string;
  contactEmail: string;
  campusAddress: string;
  officeHours: string;
  historyNote: string;
  plePassRate: string;
}

export type PostCategory = 'Announcements' | 'Academics' | 'Community & Events' | 'Achievements';

export interface SchoolPost {
  id: string;
  title: string;
  category: PostCategory;
  summary: string;
  body: string;
  authorName: string;
  authorEmail: string;
  published: boolean;
  pinned: boolean;
  imageUrl?: string;
  createdAtMs: number;
  displayDate: string;
}

export interface AcademicDivision {
  id: string;
  order: number;
  label: string;
  grades: string;
  ageRange: string;
  headline: string;
  summary: string;
  image: string;
  imageAlt: string;
  figureCaption: string;
  weeklyHours: number;
  classSize: string;
  subjects: {
    index: string;
    title: string;
    detail: string;
    hoursPerWeek: number;
  }[];
  milestones: string[];
}

export interface CampusSpace {
  id: string;
  order: number;
  indexLabel: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  image: string;
  imageAlt: string;
  figureNumber: string;
  featured: boolean;
}

export interface FacultyMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: 'Administration' | 'Lower Primary' | 'Upper Primary & STEM';
  subjects: string;
  yearsAtSchool: number;
  bio: string;
}

export interface CalendarEvent {
  id: string;
  dateISO: string;
  displayDate: string;
  monthLabel: string;
  dayNumber: string;
  timeRange: string;
  category: 'Academic Dates' | 'Parent Meetings' | 'Athletics & Clubs';
  title: string;
  location: string;
  description: string;
}

export interface DailyScheduleRow {
  id: string;
  order: number;
  time: string;
  activity: string;
  notes: string;
}

export interface AdmissionsInquiryRecord {
  id: string;
  referenceCode: string;
  parentName: string;
  contact: string;
  gradeLevel: string;
  inquiryType: string;
  message: string;
  status: 'new' | 'reviewed' | 'scheduled' | 'archived';
  ownerNotes: string;
  createdAtLabel: string;
}

export interface AdminEmailRecord {
  id: string;
  email: string;
  label: string;
  addedBy: string;
}

export type TestimonialVoiceType = 'Parent' | 'Student';

export interface SchoolTestimonial {
  id: string;
  authorName: string;
  roleLabel: string;
  voiceType: TestimonialVoiceType;
  gradeContext: string;
  quote: string;
  featured: boolean;
  published: boolean;
  createdAtMs: number;
  displayDate: string;
}

export const PRIMARY_OWNER_EMAIL = 'epnkombo@gmail.com';

export const SCHOOL_IMAGES = {
  heroCampus: '/src/assets/images/hero_nkombo_campus_1795249682645.jpg',
  classroomLiteracy: '/src/assets/images/classroom_literacy_nkombo_1795249684536.jpg',
  scienceGarden: '/src/assets/images/science_garden_nkombo_1795249684654.jpg',
  libraryReading: '/src/assets/images/library_reading_nkombo_1795249684980.jpg',
  sportsCourtyard: '/src/assets/images/sports_courtyard_nkombo_1795249684637.jpg',
};

export const BUILTIN_IMAGE_OPTIONS = [
  { label: 'Main Campus Courtyard', url: SCHOOL_IMAGES.heroCampus },
  { label: 'Morning Literacy Classroom', url: SCHOOL_IMAGES.classroomLiteracy },
  { label: 'Hillside Science Garden', url: SCHOOL_IMAGES.scienceGarden },
  { label: 'Nkombo Reading Room', url: SCHOOL_IMAGES.libraryReading },
  { label: 'Lakeside Football Pitch', url: SCHOOL_IMAGES.sportsCourtyard },
];

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'EP Saint Pierre Nkombo',
  tagline: 'École Primaire Saint Pierre Nkombo · Lake Kivu, Rwanda',
  locationLabel: 'Nkombo Island, Rusizi District',
  heroTitle: 'Rooted on Nkombo Island, nurturing curious minds for tomorrow.',
  heroSubtitle:
    'EP Saint Pierre Nkombo provides Nursery and Primary 1–6 education grounded in multilingual literacy, hands-on lakeside environmental science, and strong community stewardship in Rusizi District.',
  gradesServed: 'Nursery & Primary 1–6',
  languages: 'Kinyarwanda, English & French',
  schoolHours: 'Mon–Fri · 07:30 – 15:30',
  contactEmail: 'epnkombo@gmail.com',
  campusAddress: 'Nkombo Sector, Rusizi District, Western Province, Rwanda',
  officeHours: 'Monday – Friday, 07:30 – 16:00',
  historyNote: 'Nkombo Sector · Rusizi District · Western Province · Serving Island Families Since 1964',
  plePassRate: '98.4%',
};

export const DEFAULT_POSTS: SchoolPost[] = [
  {
    id: 'post-term-two-admissions',
    title: 'Term II Admissions & Open Morning for Nursery and P1–P6 Families',
    category: 'Announcements',
    summary:
      'Registration is open for the upcoming term on Nkombo Island. Families are invited to visit classrooms, meet teachers, and tour the reading room.',
    body: 'EP Saint Pierre Nkombo warmly welcomes parents and guardians across Nkombo Sector and Rusizi District to our upcoming Admissions Open Morning.\n\nFamilies may bring birth records and previous school reports directly to the administration office between 08:30 and 12:00, or submit an online visit inquiry at the bottom of this page. Our teaching team will conduct friendly reading and numeracy placement introductions so every pupil starts the term with confidence.',
    authorName: 'Jean Bosco Habimana',
    authorEmail: 'epnkombo@gmail.com',
    published: true,
    pinned: true,
    imageUrl: SCHOOL_IMAGES.heroCampus,
    createdAtMs: 1795200000000,
    displayDate: '21 Nov 2026',
  },
  {
    id: 'post-science-garden-harvest',
    title: 'Primary 5 Agroecology Harvest Supports Mid-Morning School Nutrition',
    category: 'Academics',
    summary:
      'Students harvested climbing beans (ibishyimbo) and leafy greens from twelve terraced beds while recording weekly soil moisture data.',
    body: 'Over the past ten weeks, Primary 5 learners partnered with Science Lead Emmanuel Niyonzima to measure rainfall, test compost ratios, and chart plant height across our Hillside Science Garden.\n\nThis week’s harvest yielded fresh climbing beans and greens prepared right in our campus kitchen, connecting classroom mathematics and plant biology directly to daily life on Lake Kivu.',
    authorName: 'Emmanuel Niyonzima',
    authorEmail: 'epnkombo@gmail.com',
    published: true,
    pinned: false,
    imageUrl: SCHOOL_IMAGES.scienceGarden,
    createdAtMs: 1794800000000,
    displayDate: '16 Nov 2026',
  },
  {
    id: 'post-reading-room-books',
    title: 'New Kinyarwanda, English & French Storybooks Added to the Reading Room',
    category: 'Community & Events',
    summary:
      'Forty-five newly catalogued picture atlases and bilingual readers are now available for weekly pupil borrowing and peer reading circles.',
    body: 'Thanks to parents, alumni, and our reading ambassadors in Primary 6, the Nkombo Reading & Atlas Room now houses over 320 leveled titles across Kinyarwanda, English, and French.\n\nEvery Friday afternoon, P5 and P6 Reading Ambassadors pair with Lower Primary pupils for thirty minutes of shared storytelling around our oak reading tables.',
    authorName: 'Diane Uwimana',
    authorEmail: 'epnkombo@gmail.com',
    published: true,
    pinned: false,
    imageUrl: SCHOOL_IMAGES.libraryReading,
    createdAtMs: 1794200000000,
    displayDate: '09 Nov 2026',
  },
];

export const ACADEMIC_DIVISIONS: AcademicDivision[] = [
  {
    id: 'lower-primary',
    order: 1,
    label: 'Lower Primary (P1–P3)',
    grades: 'Primary 1 to Primary 3',
    ageRange: 'Ages 7–9',
    headline: 'Foundational Literacy, Numeracy & Joyful Curiosity',
    summary:
      'In Lower Primary, pupils build fluent reading and writing habits in Kinyarwanda while steadily developing spoken and written English and French alongside hands-on arithmetic.',
    image: SCHOOL_IMAGES.classroomLiteracy,
    imageAlt:
      'Lower primary pupils at EP Saint Pierre Nkombo reading storybooks together with their teacher in a sunlit classroom',
    figureCaption: 'Fig. 2 — Morning Kinyarwanda and bilingual literacy block in Classroom Wing B',
    weeklyHours: 28,
    classSize: '26 pupils avg.',
    subjects: [
      {
        index: '01.',
        title: 'Kinyarwanda Literacy & Storytelling',
        detail: 'Phonics mastery, expressive oral reading, handwriting, and local oral heritage.',
        hoursPerWeek: 7,
      },
      {
        index: '02.',
        title: 'English & French Foundations',
        detail: 'Daily conversational songs, picture-book comprehension, and foundational vocabulary.',
        hoursPerWeek: 7,
      },
      {
        index: '03.',
        title: 'Concrete Mathematics',
        detail: 'Place value, mental arithmetic, Lake Kivu measurement projects, and spatial reasoning.',
        hoursPerWeek: 6,
      },
      {
        index: '04.',
        title: 'Social & Environmental Studies',
        detail: 'Nkombo Island geography, hygiene, road and water safety, and school garden care.',
        hoursPerWeek: 8,
      },
    ],
    milestones: [
      'Fluent independent reading in Kinyarwanda by end of P2',
      'Multiplication & division mastery with tangible manipulatives',
      'Weekly library borrowing circle in the Nkombo Reading Room',
    ],
  },
  {
    id: 'upper-primary',
    order: 2,
    label: 'Upper Primary (P4–P6)',
    grades: 'Primary 4 to Primary 6',
    ageRange: 'Ages 10–12',
    headline: 'Analytical Inquiry & National Exam Readiness',
    summary:
      'Upper Primary transitions instruction into English across mathematics, science, and social studies, preparing P6 candidates with deep conceptual confidence for secondary school.',
    image: SCHOOL_IMAGES.scienceGarden,
    imageAlt:
      'Upper primary students examining ibishyimbo bean seedlings and soil moisture with their science teacher overlooking Lake Kivu',
    figureCaption: 'Fig. 2 — P5 agroecology & soil observation lab in the Lakeside Science Garden',
    weeklyHours: 32,
    classSize: '28 pupils avg.',
    subjects: [
      {
        index: '01.',
        title: 'Mathematics & Logical Problem Solving',
        detail: 'Fractions, ratios, geometry, proportional reasoning, and multi-step word problems.',
        hoursPerWeek: 8,
      },
      {
        index: '02.',
        title: 'Science & Elementary Technology',
        detail: 'Plant biology, clean water filtration, simple machines, and Lake Kivu ecosystem studies.',
        hoursPerWeek: 7,
      },
      {
        index: '03.',
        title: 'English, French & Kinyarwanda Composition',
        detail: 'Structured essays, debate circles, reading comprehension, and bilingual presentation skills.',
        hoursPerWeek: 9,
      },
      {
        index: '04.',
        title: 'Social Studies & Civic Leadership',
        detail: 'Rwandan history, East African geography, environmental stewardship, and peer mentorship.',
        hoursPerWeek: 8,
      },
    ],
    milestones: [
      'P6 National Primary Leaving Examination (PLE) mentorship & mock clinics',
      'Student-led botanical observation journals in the school garden',
      'Bilingual debate & public speaking assemblies each term',
    ],
  },
  {
    id: 'nursery',
    order: 3,
    label: 'Nursery & Early Years',
    grades: 'Nursery 1 to Nursery 3',
    ageRange: 'Ages 4–6',
    headline: 'Play-Based Discovery & Early Social Confidence',
    summary:
      'Our Nursery classrooms welcome Nkombo Island’s youngest learners into a warm, structured rhythm of storytelling, rhythmic music, sensory counting, and outdoor play.',
    image: SCHOOL_IMAGES.libraryReading,
    imageAlt:
      'Young pupils gathered around wooden tables in the sunlit EP Saint Pierre Nkombo reading room exploring picture atlases and storybooks',
    figureCaption: 'Fig. 2 — Early-years illustrated reading circle in the Nkombo Reading Room',
    weeklyHours: 20,
    classSize: '22 pupils avg.',
    subjects: [
      {
        index: '01.',
        title: 'Oral Language & Picture Books',
        detail: 'Interactive read-alouds, rhythm games, and attentive listening in Kinyarwanda and English.',
        hoursPerWeek: 6,
      },
      {
        index: '02.',
        title: 'Pre-Numeracy & Pattern Play',
        detail: 'Sorting shells, stones, and seeds by shape, weight, and sequence.',
        hoursPerWeek: 5,
      },
      {
        index: '03.',
        title: 'Creative Movement, Art & Song',
        detail: 'Drawing, clay modeling, choral singing, and fine motor coordination.',
        hoursPerWeek: 5,
      },
      {
        index: '04.',
        title: 'Kindness & Outdoor Discovery',
        detail: 'Sharing, personal care routines, and guided nature walks on the school grounds.',
        hoursPerWeek: 4,
      },
    ],
    milestones: [
      'Confident letter-sound recognition and pencil grip readiness',
      'Gentle transition into Primary 1 classroom routines',
      'Mid-morning nutritious porridge program every school day',
    ],
  },
  {
    id: 'clubs',
    order: 4,
    label: 'Co-Curricular Clubs',
    grades: 'All Primary Grades',
    ageRange: 'Afternoons · 14:30–15:30',
    headline: 'Stewardship, Choir, Athletics & Island Craft',
    summary:
      'Learning at EP Saint Pierre Nkombo extends beyond the chalkboard into choral arts, lakeside environmental stewardship, reading mentorship, and team football.',
    image: SCHOOL_IMAGES.sportsCourtyard,
    imageAlt:
      'Students playing football on the green courtyard pitch at EP Saint Pierre Nkombo overlooking Lake Kivu',
    figureCaption: 'Fig. 2 — Afternoon athletics and club period on the lakeside courtyard pitch',
    weeklyHours: 5,
    classSize: 'Mixed-grade clubs',
    subjects: [
      {
        index: '01.',
        title: 'Lake Kivu Environment & Garden Club',
        detail: 'Composting, tree-nursery propagation, and shoreline clean-up initiatives.',
        hoursPerWeek: 2,
      },
      {
        index: '02.',
        title: 'Saint Pierre School Choir & Traditional Dance',
        detail: 'Vocal harmony, traditional Rwandan drumming, and community celebration performances.',
        hoursPerWeek: 1.5,
      },
      {
        index: '03.',
        title: 'Football, Netball & Track Athletics',
        detail: 'Team sportsmanship, agility drills, and friendly Rusizi sector matches.',
        hoursPerWeek: 1.5,
      },
      {
        index: '04.',
        title: 'Peer Reading Ambassadors',
        detail: 'P5 and P6 pupils paired weekly with P1 learners for guided reading sessions.',
        hoursPerWeek: 1,
      },
    ],
    milestones: [
      'Annual Nkombo Island Inter-School Youth Cup & Cultural Day',
      'Over 140 indigenous shade and fruit seedlings planted by pupils',
      'Student-run book repair and library cataloguing team',
    ],
  },
];

export const CAMPUS_SPACES: CampusSpace[] = [
  {
    id: 'garden',
    order: 1,
    indexLabel: 'Space 01 · Hands-On Agroecology',
    title: 'The Hillside Science & School Garden',
    subtitle: 'Overlooking Lake Kivu',
    description:
      'Terraced wooden beds cultivate ibishyimbo (climbing beans), sweet potatoes, and kitchen greens. Upper Primary pupils log rainfall, test compost enrichment, and apply mathematics to real harvest yields that supplement school lunches.',
    highlights: ['12 raised botanical study beds', 'Rainwater harvesting cistern', 'Weekly P4–P6 science practicums'],
    image: SCHOOL_IMAGES.scienceGarden,
    imageAlt: 'Students and teacher inspecting bean seedlings in raised garden beds overlooking Lake Kivu',
    figureNumber: 'Fig. 3',
    featured: true,
  },
  {
    id: 'library',
    order: 2,
    indexLabel: 'Space 02 · Quiet Inquiry',
    title: 'Nkombo Reading & Atlas Room',
    subtitle: 'Trilingual Collection',
    description:
      'Stocked with illustrated storybooks, East African atlases, and science primers, the reading room hosts daily quiet reading blocks and peer buddy sessions.',
    highlights: ['320+ catalogued books', 'Afternoon homework supervision'],
    image: SCHOOL_IMAGES.libraryReading,
    imageAlt: 'Children reading illustrated books and maps around oak tables in the school library',
    figureNumber: 'Fig. 4',
    featured: false,
  },
  {
    id: 'classrooms',
    order: 3,
    indexLabel: 'Space 03 · Core Instruction',
    title: 'Sunlit Timber-Window Classrooms',
    subtitle: 'Natural Ventilation & Acoustics',
    description:
      'Brick-and-mortar classrooms with wide louvered timber windows capture breezes off Lake Kivu, keeping morning literacy and mathematics sessions bright and focused.',
    highlights: ['Chalkboard & visual chart walls', 'Dual-desk cooperative seating'],
    image: SCHOOL_IMAGES.classroomLiteracy,
    imageAlt: 'Primary school pupils engaged in a sunlit classroom lesson',
    figureNumber: 'Fig. 5',
    featured: false,
  },
  {
    id: 'courtyard',
    order: 4,
    indexLabel: 'Space 04 · Athletics & Assembly',
    title: 'Lakeside Football Pitch & Courtyard',
    subtitle: 'Community Gathering Grounds',
    description:
      'Framed by terraced hills and panoramic views of Lake Kivu, our green pitch hosts daily recess, inter-school football and netball fixtures, morning assembly, and term-end parent days.',
    highlights: ['Regulation youth football pitch', 'Shaded stone courtyard walkways', 'Weekend community sports clinics'],
    image: SCHOOL_IMAGES.sportsCourtyard,
    imageAlt: 'Green school football pitch and brick buildings overlooking Lake Kivu at sunset',
    figureNumber: 'Fig. 6',
    featured: true,
  },
];

export const FACULTY_MEMBERS: FacultyMember[] = [
  {
    id: 'f1',
    name: 'Jean Bosco Habimana',
    initials: 'JH',
    role: 'Head Teacher',
    department: 'Administration',
    subjects: 'School Leadership & Civic Education',
    yearsAtSchool: 14,
    bio: 'Leads academic standards, parent-teacher collaboration, and island educational outreach across Rusizi District.',
  },
  {
    id: 'f2',
    name: 'Marie Claire Mukamana',
    initials: 'MM',
    role: 'Deputy Head of Academics',
    department: 'Administration',
    subjects: 'Curriculum Coordination & P6 Readiness',
    yearsAtSchool: 11,
    bio: 'Oversees teacher mentorship, bilingual literacy benchmarks, and national examination preparation.',
  },
  {
    id: 'f3',
    name: 'Chantal Nyiransengiyumva',
    initials: 'CN',
    role: 'Senior Teacher · P1 & P2',
    department: 'Lower Primary',
    subjects: 'Kinyarwanda Phonics & Early Numeracy',
    yearsAtSchool: 9,
    bio: 'Specializes in early reading intervention and joyful cooperative learning for first-year primary pupils.',
  },
  {
    id: 'f4',
    name: 'Emmanuel Niyonzima',
    initials: 'EN',
    role: 'Mathematics & Science Lead',
    department: 'Upper Primary & STEM',
    subjects: 'Upper Primary Mathematics & Agroecology',
    yearsAtSchool: 8,
    bio: 'Coordinates the Hillside Science Garden experiments and P6 Mathematics problem-solving clinics.',
  },
  {
    id: 'f5',
    name: 'Diane Uwimana',
    initials: 'DU',
    role: 'Languages & Library Coordinator',
    department: 'Upper Primary & STEM',
    subjects: 'English, French & Reading Room',
    yearsAtSchool: 6,
    bio: 'Guides the trilingual reading room collection and coaches the Saint Pierre debate and storytelling teams.',
  },
  {
    id: 'f6',
    name: 'Patrick Hakizimana',
    initials: 'PH',
    role: 'Lower Primary & Athletics Teacher',
    department: 'Lower Primary',
    subjects: 'Primary 3 Social Studies & Physical Education',
    yearsAtSchool: 7,
    bio: 'Directs morning physical education, football and netball teams, and inter-school sports exchanges.',
  },
];

export const DEFAULT_TESTIMONIALS: SchoolTestimonial[] = [
  {
    id: 'test-agnes-parent',
    authorName: 'Agnès Mukandayisenga',
    roleLabel: 'Parent of P3 & P5 Pupils · Nkombo Sector',
    voiceType: 'Parent',
    gradeContext: 'Primary 3 & Primary 5',
    quote:
      'Knowing my two children walk safely along the stone path, read confidently in Kinyarwanda and English, and bring home what they learn in the hillside school garden has changed our whole household.',
    featured: true,
    published: true,
    createdAtMs: 1795180000000,
    displayDate: '19 Nov 2026',
  },
  {
    id: 'test-aline-student',
    authorName: 'Aline Uwase',
    roleLabel: 'Primary 6 Student & Reading Ambassador',
    voiceType: 'Student',
    gradeContext: 'Primary 6',
    quote:
      'In our Reading Room, older students help Primary 1 pupils sound out their first English and Kinyarwanda books. Measuring bean growth in the science garden made fractions my favorite subject.',
    featured: true,
    published: true,
    createdAtMs: 1795000000000,
    displayDate: '17 Nov 2026',
  },
  {
    id: 'test-fidèle-parent',
    authorName: 'Fidèle Ndayambaje',
    roleLabel: 'Parent Committee Treasurer · Kamagugu Cell',
    voiceType: 'Parent',
    gradeContext: 'Nursery 3 & Primary 4',
    quote:
      'Every term-end meeting gives us real reading portfolios and honest guidance from teachers who know every child by name. We trust EP Saint Pierre Nkombo deeply.',
    featured: false,
    published: true,
    createdAtMs: 1794600000000,
    displayDate: '12 Nov 2026',
  },
  {
    id: 'test-eric-student',
    authorName: 'Éric Habakurama',
    roleLabel: 'Primary 5 Student & Environment Club Lead',
    voiceType: 'Student',
    gradeContext: 'Primary 5',
    quote:
      'After morning lessons we test soil moisture in our terraced beds and play football overlooking Lake Kivu. Our teachers push us to ask why and help our classmates succeed.',
    featured: false,
    published: true,
    createdAtMs: 1794300000000,
    displayDate: '08 Nov 2026',
  },
  {
    id: 'test-solange-parent',
    authorName: 'Solange Nyiramana',
    roleLabel: 'Parent of P2 Pupil · Nkombo Island',
    voiceType: 'Parent',
    gradeContext: 'Primary 2',
    quote:
      'My daughter joined Nursery shy and quiet. Now in Primary 2 she reads aloud to her younger brother every evening and looks forward to morning assembly.',
    featured: false,
    published: true,
    createdAtMs: 1793900000000,
    displayDate: '02 Nov 2026',
  },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev1',
    dateISO: '20261204T083000',
    displayDate: '04 Dec 2026',
    monthLabel: 'DEC',
    dayNumber: '04',
    timeRange: '08:30 – 12:00',
    category: 'Parent Meetings',
    title: 'Term I Parent-Teacher Academic Review',
    location: 'Main Courtyard & Classrooms',
    description:
      'Individual pupil progress conferences, reading portfolio walkthroughs, and term nutrition garden showcase.',
  },
  {
    id: 'ev2',
    dateISO: '20261211T140000',
    displayDate: '11 Dec 2026',
    monthLabel: 'DEC',
    dayNumber: '11',
    timeRange: '14:00 – 16:30',
    category: 'Athletics & Clubs',
    title: 'Nkombo Lakeside Youth Football & Choir Showcase',
    location: 'Lakeside Pitch & Courtyard',
    description:
      'Friendly matches with neighboring Rusizi sector primary schools followed by the Saint Pierre Choir recital.',
  },
  {
    id: 'ev3',
    dateISO: '20270112T073000',
    displayDate: '12 Jan 2027',
    monthLabel: 'JAN',
    dayNumber: '12',
    timeRange: '07:30 – 15:30',
    category: 'Academic Dates',
    title: 'Term II Opening Assembly & Orientation',
    location: 'School Flagpole Courtyard',
    description:
      'Welcome assembly for returning students and newly enrolled Nursery & Primary 1 families.',
  },
  {
    id: 'ev4',
    dateISO: '20270122T090000',
    displayDate: '22 Jan 2027',
    monthLabel: 'JAN',
    dayNumber: '22',
    timeRange: '09:00 – 11:30',
    category: 'Parent Meetings',
    title: 'Admissions Open Morning & Campus Tour',
    location: 'Administration Office & Reading Room',
    description:
      'Prospective families are invited to meet classroom teachers, tour learning spaces, and complete placement registration.',
  },
  {
    id: 'ev5',
    dateISO: '20270206T100000',
    displayDate: '06 Feb 2027',
    monthLabel: 'FEB',
    dayNumber: '06',
    timeRange: '10:00 – 13:00',
    category: 'Academic Dates',
    title: 'Bilingual Literacy & Science Fair Day',
    location: 'Reading Room & Hillside Garden',
    description:
      'P4–P6 pupils present botanical soil journals, solar drying models, and trilingual reading recitations.',
  },
];

export const DAILY_SCHEDULE: DailyScheduleRow[] = [
  { id: 'ds1', order: 1, time: '07:30 – 07:55', activity: 'Morning Assembly & Courtyard Welcome', notes: 'All grades' },
  { id: 'ds2', order: 2, time: '08:00 – 10:00', activity: 'Core Block I: Literacy & Languages', notes: 'Kinyarwanda / English / French' },
  { id: 'ds3', order: 3, time: '10:00 – 10:30', activity: 'Morning Recess & Nutrition Break', notes: 'Courtyard & porridge hall' },
  { id: 'ds4', order: 4, time: '10:30 – 12:30', activity: 'Core Block II: Mathematics & Inquiry', notes: 'Classroom & numeracy manipulatives' },
  { id: 'ds5', order: 5, time: '12:30 – 13:30', activity: 'Midday Lunch & Rest', notes: 'School dining pavilion' },
  { id: 'ds6', order: 6, time: '13:30 – 14:30', activity: 'Science, Garden Practicum & Social Studies', notes: 'Hillside beds & reading room' },
  { id: 'ds7', order: 7, time: '14:30 – 15:30', activity: 'Co-Curricular Clubs & Dismissal', notes: 'Choir, football, peer reading' },
];
