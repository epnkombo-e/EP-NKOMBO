import { useRef, useState } from 'react';
import { ArrowRight, Plus, Settings, ShieldCheck } from 'lucide-react';
import { DEFAULT_SCHOOL_SETTINGS, SCHOOL_IMAGES } from './data/schoolData';
import { SchoolDataProvider, useSchoolData } from './context/SchoolDataContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { LanguageBar } from './components/LanguageBar';
import { ResilientImage } from './components/ResilientImage';
import { PostsSection } from './components/PostsSection';
import { AcademicsSection } from './components/AcademicsSection';
import { CampusSpacesSection } from './components/CampusSpacesSection';
import { FacultySection } from './components/FacultySection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CalendarSection } from './components/CalendarSection';
import { AdmissionsSection } from './components/AdmissionsSection';
import { OwnerLoginModal } from './components/OwnerLoginModal';
import { OwnerStudioModal, type StudioTab } from './components/OwnerStudioModal';

function SchoolWebsiteContent() {
  const { settings, user, isAdmin, inquiries } = useSchoolData();
  const { t } = useLanguage();
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [loginOpen, setLoginOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<StudioTab>('posts');

  const openStudioAt = (tab: StudioTab) => {
    setStudioTab(tab);
    setStudioOpen(true);
  };

  const handleHeaderOwnerClick = () => {
    if (isAdmin) {
      openStudioAt('posts');
    } else {
      setLoginOpen(true);
    }
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

  const newInquiriesCount = inquiries.filter((i) => i.status === 'new').length;

  return (
    <div id="top" className="min-h-screen bg-[#FBF9F5] text-[#1C1917]">
      <Header onOwnerButtonClick={handleHeaderOwnerClick} />

      {/* Owner Quick-Control Ribbon (Visible ONLY to authenticated Owner / Co-Admin) */}
      {isAdmin && (
        <div className="border-b border-[#D6CEBE] bg-[#F3EFE7] px-5 py-2.5 sm:px-8">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-[#14532D]">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Owner Mode Active ({user?.email}) — All changes publish live to the website
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openStudioAt('posts')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-[#14532D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0F3F22] whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Post on Website</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('testimonials')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#14532D] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#14532D] hover:bg-[#FBF9F5] whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add New Testimonial</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('profile')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#CFC6B4] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:bg-[#FBF9F5] whitespace-nowrap cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit All Data</span>
              </button>
              <button
                type="button"
                onClick={() => openStudioAt('inquiries')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[#CFC6B4] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:bg-[#FBF9F5] whitespace-nowrap cursor-pointer"
              >
                <span>Inquiries ({newInquiriesCount} new)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        <LanguageBar />

        {/* Hero Split & Full-Width Operational Ribbon */}
        <section className="border-b border-[#E5DFD3] pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="flex flex-col justify-between lg:col-span-6 lg:py-4">
                <div>
                  <p className="text-xs font-medium tracking-wider text-[#57534E]">
                    {settings.tagline === DEFAULT_SCHOOL_SETTINGS.tagline
                      ? t.hero.tagline
                      : settings.tagline}
                  </p>

                  <h1 className="mt-4 font-display text-[clamp(2.25rem,4vw,3.6rem)] leading-[1.08] font-medium tracking-tight text-[#1C1917] [text-wrap:balance]">
                    {settings.heroTitle === DEFAULT_SCHOOL_SETTINGS.heroTitle
                      ? t.hero.title
                      : settings.heroTitle}
                  </h1>

                  <p className="mt-5 max-w-xl text-base leading-relaxed text-[#44403C] sm:text-[17px]">
                    {settings.heroSubtitle === DEFAULT_SCHOOL_SETTINGS.heroSubtitle
                      ? t.hero.subtitle
                      : settings.heroSubtitle}
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={scrollToAdmissions}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#0F3F22] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
                    >
                      <span>{t.hero.ctaVisit}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={scrollToAcademics}
                      className="inline-flex min-h-[44px] items-center rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-5 py-2.5 text-sm font-medium text-[#1C1917] transition-colors duration-150 hover:bg-[#F3EFE7] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
                    >
                      {t.hero.ctaCurriculum}
                    </button>
                  </div>
                </div>

                <p className="mt-10 border-t border-[#E5DFD3] pt-4 text-xs text-[#57534E]">
                  {settings.historyNote === DEFAULT_SCHOOL_SETTINGS.historyNote
                    ? t.hero.historyNote
                    : settings.historyNote}
                </p>
              </div>

              <div className="lg:col-span-6">
                <figure className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-[#E5DFD3] bg-[#F3EFE7]">
                  <ResilientImage
                    src={SCHOOL_IMAGES.heroCampus}
                    alt="Students in blue uniforms walking along the sunlit stone courtyard of EP Saint Pierre Nkombo overlooking Lake Kivu"
                    fallbackTitle={settings.schoolName}
                    className="h-full w-full object-cover"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pt-12 pb-4 font-serif text-xs italic text-white/95">
                    {t.hero.figCaption}
                  </figcaption>
                </figure>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 divide-y divide-[#E5DFD3] rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              <div className="p-5">
                <p className="text-xs font-medium text-[#57534E]">{t.hero.gradesLabel}</p>
                <p className="mt-1 text-sm font-semibold text-[#1C1917]">
                  {settings.gradesServed}
                </p>
                <p className="mt-0.5 text-xs text-[#57534E] tabular-figures">{t.hero.gradesSub}</p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-[#57534E]">{t.hero.languagesLabel}</p>
                <p className="mt-1 text-sm font-semibold text-[#1C1917]">{settings.languages}</p>
                <p className="mt-0.5 text-xs text-[#57534E]">{t.hero.languagesSub}</p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-[#57534E]">{t.hero.hoursLabel}</p>
                <p className="mt-1 font-mono text-sm font-medium text-[#1C1917] tabular-figures">
                  {settings.schoolHours}
                </p>
                <p className="mt-0.5 text-xs text-[#57534E]">{t.hero.hoursSub}</p>
              </div>

              <div className="p-5">
                <p className="text-xs font-medium text-[#57534E]">{t.hero.contactLabel}</p>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="mt-1 block text-sm font-semibold text-[#14532D] hover:underline"
                >
                  {settings.contactEmail}
                </a>
                <p className="mt-0.5 text-xs text-[#57534E]">{settings.locationLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <PostsSection onNewPostClick={() => openStudioAt('posts')} />
        <AcademicsSection />
        <CampusSpacesSection />
        <FacultySection />
        <TestimonialsSection onAddTestimonialClick={() => openStudioAt('testimonials')} />
        <CalendarSection />
        <AdmissionsSection nameInputRef={nameInputRef} />
      </main>

      <footer className="border-t border-[#E5DFD3] bg-[#F3EFE7]/60 py-12">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-[#1C1917]">
              {settings.schoolName}
            </p>
            <p className="mt-1 text-xs text-[#57534E]">
              {settings.campusAddress} ·{' '}
              <a href={`mailto:${settings.contactEmail}`} className="underline hover:text-[#1C1917]">
                {settings.contactEmail}
              </a>
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-[#57534E]"
          >
            <a href="#updates" className="hover:text-[#1C1917] whitespace-nowrap">
              {t.nav.updates}
            </a>
            <a href="#academics" className="hover:text-[#1C1917] whitespace-nowrap">
              {t.nav.academics}
            </a>
            <a href="#campus" className="hover:text-[#1C1917] whitespace-nowrap">
              {t.nav.campus}
            </a>
            <a href="#faculty" className="hover:text-[#1C1917] whitespace-nowrap">
              {t.nav.faculty}
            </a>
            <a href="#testimonials" className="hover:text-[#1C1917] whitespace-nowrap">
              {t.nav.testimonials}
            </a>
            <a href="#calendar" className="hover:text-[#1C1917] whitespace-nowrap">
              {t.nav.calendar}
            </a>
            <a href="#admissions" className="hover:text-[#1C1917] whitespace-nowrap">
              {t.nav.admissions}
            </a>
            <button
              type="button"
              onClick={handleHeaderOwnerClick}
              className="text-left font-semibold text-[#14532D] hover:underline whitespace-nowrap cursor-pointer"
            >
              {isAdmin ? t.nav.ownerStudio : t.nav.ownerLoginDetails}
            </button>
          </nav>

          <p className="text-xs text-[#57534E]">
            © 2026 {settings.schoolName}
          </p>
        </div>
      </footer>

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
      <LanguageProvider>
        <SchoolDataProvider>
          <SchoolWebsiteContent />
        </SchoolDataProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
