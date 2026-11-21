import { useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CheckSquare,
  GraduationCap,
  Image as ImageIcon,
  Phone,
  Plus,
  Settings,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import { DEFAULT_SCHOOL_SETTINGS, SCHOOL_IMAGES } from './data/schoolData';
import { HERO_BG_PRESETS } from './data/portalCatalog';
import { SchoolDataProvider, useSchoolData } from './context/SchoolDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { PortalFeaturesProvider, usePortalFeatures } from './context/PortalFeaturesContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { LanguageBar } from './components/LanguageBar';
import { CircleAvatar } from './components/CircleAvatar';
import { CircleProfileModal } from './components/CircleProfileModal';
import { ResilientImage } from './components/ResilientImage';
import { PostsSection } from './components/PostsSection';
import { SubjectLibrarySection } from './components/SubjectLibrarySection';
import { AiLessonStudioSection } from './components/AiLessonStudioSection';
import { PerformanceAnalyticsSection } from './components/PerformanceAnalyticsSection';
import { SportsEntertainmentSection } from './components/SportsEntertainmentSection';
import { AcademicsSection } from './components/AcademicsSection';
import { OnlineExamSection } from './components/OnlineExamSection';
import { CampusSpacesSection } from './components/CampusSpacesSection';
import { FacultySection } from './components/FacultySection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CalendarSection } from './components/CalendarSection';
import { DocumentsSection } from './components/DocumentsSection';
import { AdmissionsSection } from './components/AdmissionsSection';
import { OwnerLoginModal } from './components/OwnerLoginModal';
import { OwnerStudioModal, type StudioTab } from './components/OwnerStudioModal';

function SchoolWebsiteContent() {
  const { settings, user, isAdmin, posts, inquiries, examSubmissions } = useSchoolData();
  const { userProfile, libraryItems, sportsItems } = usePortalFeatures();
  const { t, portal } = useLanguage();
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<StudioTab>('posts');

  const openStudioAt = (tab: StudioTab) => {
    setStudioTab(tab);
    setStudioOpen(true);
  };

  const handleProfileButtonClick = () => {
    setProfileOpen(true);
  };

  const scrollToAdmissions = () => {
    const el = document.getElementById('admissions');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 450);
    }
  };

  const scrollToAcademics = () => {
    const el = document.getElementById('academics');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToExam = () => {
    const el = document.getElementById('exam');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const newInquiriesCount = inquiries.filter((i) => i.status === 'new').length;
  const pendingApprovalsCount =
    posts.filter((p) => p.approvalStatus === 'pending').length +
    libraryItems.filter((l) => l.approvalStatus === 'pending').length +
    sportsItems.filter((s) => s.approvalStatus === 'pending').length;

  const phoneHref = `tel:${settings.phoneNumber.replace(/\s+/g, '').replace(/^0/, '+250')}`;
  const pillarBarColors = ['bg-[#123D68] dark:bg-[#3B82F6]', 'bg-[#1769AA] dark:bg-[#60A5FA]', 'bg-[#14532D] dark:bg-[#34D399]'];

  // Dynamic Hero Background resolution (Owner Background Customizer)
  const bgMode = settings.heroBgMode || 'default';
  const presetMatch = HERO_BG_PRESETS.find((p) => p.id === bgMode);
  const resolvedHeroImage =
    bgMode === 'custom'
      ? settings.heroBgImage?.trim() || ''
      : presetMatch?.imageUrl || '';
  const hasPhotoBackdrop = Boolean(resolvedHeroImage);
  const isLakeSunset = bgMode === 'lake_sunset';
  const isRichHero = hasPhotoBackdrop || isLakeSunset;
  const overlayOpacity = Math.max(0.15, Math.min(0.92, (settings.heroBgOverlay ?? 62) / 100));

  return (
    <div id="top" className="min-h-screen bg-[#F6F9FC] text-[#0F1E33] dark:bg-[#07111E] dark:text-[#E7EFF8]">
      <Header onProfileButtonClick={handleProfileButtonClick} />

      {/* Owner Quick-Control Ribbon (Visible ONLY to authenticated Owner / Co-Admin) */}
      {isAdmin && (
        <div className="border-b border-[#C5D5E8] bg-[#E8F0F8] px-5 py-2.5 dark:border-[#1E334D] dark:bg-[#0B1728] sm:px-8">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2.5 text-left text-xs font-medium text-[#0B2E50] hover:underline dark:text-[#E7EFF8] cursor-pointer"
            >
              <CircleAvatar
                name={userProfile?.displayName || user?.displayName || user?.email || 'Owner'}
                avatarType={userProfile?.avatarType}
                avatarValue={userProfile?.avatarValue}
                photoDataUrl={userProfile?.photoDataUrl}
                size="xs"
              />
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#1769AA] dark:text-[#60A5FA]" aria-hidden="true" />
              <span>
                Owner Mode Active ({user?.email}) — Click to customize Circle Profile or edit live site
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openStudioAt('posts')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-[#123D68] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0B2E50] dark:bg-[#1769AA] whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Post on Website</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('approvals')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#1769AA] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#123D68] hover:bg-[#EDF4FA] dark:border-[#3B82F6] dark:bg-[#13253D] dark:text-[#93C5FD] whitespace-nowrap cursor-pointer"
              >
                <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Approvals ({pendingApprovalsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('roster')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#123D68] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#123D68] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Roster &amp; Marks</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('background')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#123D68] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#123D68] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Home BG</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('files')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#123D68] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#123D68] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('exams')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#1769AA] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#1769AA] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#60A5FA] whitespace-nowrap cursor-pointer"
              >
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Exams ({examSubmissions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('profile')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#CBD8E6] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                <span>All Data</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('inquiries')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#CBD8E6] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap cursor-pointer"
              >
                <span>Inquiries ({newInquiriesCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        <LanguageBar />

        {/* Hero Split & Operational Ribbon (with Owner Home Background Customizer) */}
        <section
          className={`relative overflow-hidden border-b border-[#D4DFEB] pt-10 pb-12 dark:border-[#1E334D] sm:pt-14 sm:pb-16 ${
            isLakeSunset
              ? 'bg-gradient-to-br from-[#061A2E] via-[#0F355C] to-[#1769AA] text-white'
              : hasPhotoBackdrop
                ? 'bg-[#08223C] text-white'
                : 'bg-gradient-to-b from-[#EDF4FA]/65 via-[#F6F9FC] to-[#FFFFFF] dark:from-[#0B1728] dark:via-[#081322] dark:to-[#07111E]'
          }`}
        >
          {hasPhotoBackdrop && (
            <>
              <img
                src={resolvedHeroImage}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: `rgba(8, 34, 60, ${overlayOpacity})` }}
              />
            </>
          )}

          <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="flex flex-col justify-between lg:col-span-6 lg:py-4">
                <div>
                  <p
                    className={`text-xs font-semibold tracking-wider uppercase ${
                      isRichHero ? 'text-[#F2B544]' : 'text-[#1769AA] dark:text-[#60A5FA]'
                    }`}
                  >
                    {settings.tagline === DEFAULT_SCHOOL_SETTINGS.tagline
                      ? t.hero.tagline
                      : settings.tagline}
                  </p>

                  <h1
                    className={`mt-4 font-display text-[clamp(2.25rem,4vw,3.6rem)] leading-[1.08] font-medium tracking-tight [text-wrap:balance] ${
                      isRichHero ? 'text-white' : 'text-[#0B2E50] dark:text-[#EAF1F8]'
                    }`}
                  >
                    {settings.heroTitle === DEFAULT_SCHOOL_SETTINGS.heroTitle
                      ? t.hero.title
                      : settings.heroTitle}
                  </h1>

                  <p
                    className={`mt-5 max-w-xl text-base leading-relaxed sm:text-[17px] ${
                      isRichHero ? 'text-[#E2EDF8]' : 'text-[#334155] dark:text-[#CBD5E1]'
                    }`}
                  >
                    {settings.heroSubtitle === DEFAULT_SCHOOL_SETTINGS.heroSubtitle
                      ? t.hero.subtitle
                      : settings.heroSubtitle}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={scrollToAdmissions}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#123D68] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#0B2E50] dark:bg-[#1769AA] dark:hover:bg-[#125387] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
                    >
                      <span>{t.hero.ctaVisit}</span>
                      <ArrowRight className="h-4 w-4 text-[#F2B544]" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={scrollToExam}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[#1769AA] bg-[#EDF4FA] px-4 py-2.5 text-sm font-semibold text-[#0B2E50] transition-colors duration-150 hover:bg-[#1769AA] hover:text-white dark:border-[#3B82F6] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
                    >
                      <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                      <span>{t.nav.exam}</span>
                    </button>

                    <button
                      type="button"
                      onClick={scrollToAcademics}
                      className="inline-flex min-h-[44px] items-center rounded-md border border-[#CBD8E6] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#0B2E50] transition-colors duration-150 hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:text-[#E7EFF8] dark:hover:bg-[#13253D] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
                    >
                      {t.hero.ctaCurriculum}
                    </button>
                  </div>
                </div>

                <p
                  className={`mt-10 border-t pt-4 text-xs ${
                    isRichHero
                      ? 'border-white/25 text-[#DCEAF7]'
                      : 'border-[#D4DFEB] text-[#475569] dark:border-[#1E334D] dark:text-[#94A3B8]'
                  }`}
                >
                  {settings.historyNote === DEFAULT_SCHOOL_SETTINGS.historyNote
                    ? t.hero.historyNote
                    : settings.historyNote}
                </p>
              </div>

              <div className="lg:col-span-6">
                <figure className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-[#CBD8E6] bg-[#EDF4FA] shadow-xs dark:border-[#1E334D] dark:bg-[#0D1B2D]">
                  <ResilientImage
                    src={resolvedHeroImage || SCHOOL_IMAGES.heroCampus}
                    alt="Students in blue uniforms walking along the sunlit stone courtyard of EP Saint Pierre Nkombo overlooking Lake Kivu"
                    fallbackTitle={settings.schoolName}
                    className="h-full w-full object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08223C]/90 via-[#08223C]/50 to-transparent px-5 pt-12 pb-4 font-serif text-xs italic text-white/95">
                    {t.hero.figCaption}
                  </figcaption>
                </figure>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 divide-y divide-[#D4DFEB] rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] text-[#0F1E33] shadow-xs dark:divide-[#1E334D] dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:text-[#E7EFF8] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              <div className="p-5">
                <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{t.hero.gradesLabel}</p>
                <p className="mt-1 text-sm font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">
                  {settings.gradesServed}
                </p>
                <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8] tabular-figures">{t.hero.gradesSub}</p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{t.hero.languagesLabel}</p>
                <p className="mt-1 text-sm font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">{settings.languages}</p>
                <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">{t.hero.languagesSub}</p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{t.hero.hoursLabel}</p>
                <p className="mt-1 font-mono text-sm font-medium text-[#0B2E50] dark:text-[#EAF1F8] tabular-figures">
                  {settings.schoolHours}
                </p>
                <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">{t.hero.hoursSub}</p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{t.hero.contactLabel}</p>
                <div className="mt-1 flex flex-col gap-0.5">
                  <a
                    href={phoneHref}
                    className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-[#123D68] hover:text-[#1769AA] hover:underline dark:text-[#93C5FD] tabular-figures"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#1769AA] dark:text-[#60A5FA]" aria-hidden="true" />
                    <span>{settings.phoneNumber}</span>
                  </a>
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-xs font-medium text-[#14532D] hover:underline dark:text-[#6EE7B7]"
                  >
                    {settings.contactEmail}
                  </a>
                </div>
                <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">{settings.locationLabel}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Three Core School Pillars */}
        <section className="border-b border-[#D4DFEB] bg-[#FFFFFF] py-12 dark:border-[#1E334D] dark:bg-[#081322] sm:py-16">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wider text-[#1769AA] dark:text-[#60A5FA] uppercase">
                {portal.pillars.kicker}
              </p>
              <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] sm:text-3xl [text-wrap:balance]">
                {portal.pillars.heading}
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {portal.pillars.items.map((item, idx) => (
                <article
                  key={item.title}
                  className="overflow-hidden rounded-xl border border-[#D4DFEB] bg-[#F8FAFD] dark:border-[#1E334D] dark:bg-[#0D1B2D]"
                >
                  <div className={`h-1.5 w-full ${pillarBarColors[idx] ?? 'bg-[#123D68]'}`} />
                  <div className="p-6">
                    <span className="font-mono text-xs font-semibold text-[#1769AA] dark:text-[#60A5FA] tabular-figures">
                      {item.index}
                    </span>
                    <h3 className="mt-2 font-display text-xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                      {item.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <PostsSection onNewPostClick={() => openStudioAt('posts')} />
        <SubjectLibrarySection />
        <AiLessonStudioSection />
        <PerformanceAnalyticsSection onOpenRosterUploader={() => openStudioAt('roster')} />
        <SportsEntertainmentSection />
        <AcademicsSection />
        <OnlineExamSection />
        <CampusSpacesSection />
        <FacultySection />
        <TestimonialsSection onAddTestimonialClick={() => openStudioAt('testimonials')} />
        <CalendarSection />
        <DocumentsSection onUploadFileClick={() => openStudioAt('files')} />
        <AdmissionsSection nameInputRef={nameInputRef} />
      </main>

      <footer className="border-t border-[#123D68] bg-[#0B2E50] py-12 text-white dark:border-[#1E334D] dark:bg-[#050C17]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-white">
              {settings.schoolName}
            </p>
            <p className="mt-1.5 text-xs text-[#DCEAF7]">
              {settings.campusAddress}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#BBD5EE]">
              <a href={phoneHref} className="font-mono font-medium text-[#F2B544] hover:underline">
                {settings.phoneNumber}
              </a>
              <span aria-hidden="true">·</span>
              <a href={`mailto:${settings.contactEmail}`} className="underline hover:text-[#F2B544]">
                {settings.contactEmail}
              </a>
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#DCEAF7]"
          >
            <a href="#updates" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.updates}
            </a>
            <a href="#library" className="hover:text-[#F2B544] whitespace-nowrap">
              Subject Library
            </a>
            <a href="#ai-studio" className="hover:text-[#F2B544] whitespace-nowrap">
              AI &amp; REB/NESA
            </a>
            <a href="#performance" className="hover:text-[#F2B544] whitespace-nowrap">
              Performance
            </a>
            <a href="#sports" className="hover:text-[#F2B544] whitespace-nowrap">
              Sports &amp; Arts
            </a>
            <a href="#academics" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.academics}
            </a>
            <a href="#exam" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.exam}
            </a>
            <a href="#campus" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.campus}
            </a>
            <a href="#faculty" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.faculty}
            </a>
            <a href="#testimonials" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.testimonials}
            </a>
            <a href="#calendar" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.calendar}
            </a>
            <a href="#documents" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.documents}
            </a>
            <a href="#admissions" className="hover:text-[#F2B544] whitespace-nowrap">
              {t.nav.admissions}
            </a>
            <button
              type="button"
              onClick={handleProfileButtonClick}
              className="text-left font-semibold text-[#F2B544] hover:underline whitespace-nowrap cursor-pointer"
            >
              {isAdmin ? t.nav.ownerStudio : user ? 'Circle Profile & Settings' : 'Circle Profile / Sign In'}
            </button>
          </nav>

          <p className="text-xs text-[#BBD5EE]">
            © 2026 {settings.schoolName}
          </p>
        </div>
      </footer>

      <CircleProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onOpenOwnerStudio={() => {
          setProfileOpen(false);
          openStudioAt('posts');
        }}
      />

      <OwnerLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onOpenStudio={() => openStudioAt('posts')}
      />

      <OwnerStudioModal
        open={studioOpen}
        initialTab={studioTab}
        onClose={() => setStudioOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <SchoolDataProvider>
            <PortalFeaturesProvider>
              <SchoolWebsiteContent />
            </PortalFeaturesProvider>
          </SchoolDataProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
