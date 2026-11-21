import { useMemo, useState } from 'react';
import { Plus, Quote } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { TestimonialVoiceType } from '../data/schoolData';

type VoiceFilter = 'All Voices' | 'Parents' | 'Students';

const VOICE_FILTERS: VoiceFilter[] = ['All Voices', 'Parents', 'Students'];

interface TestimonialsSectionProps {
  onAddTestimonialClick: () => void;
}

export function TestimonialsSection({ onAddTestimonialClick }: TestimonialsSectionProps) {
  const { testimonials, testimonialsLoading, isAdmin } = useSchoolData();
  const { t, localizeCategory } = useLanguage();
  const [filter, setFilter] = useState<VoiceFilter>('All Voices');

  const visibleTestimonials = useMemo(() => {
    const base = isAdmin ? testimonials : testimonials.filter((item) => item.published);
    if (filter === 'Parents') {
      return base.filter((item) => item.voiceType === 'Parent');
    }
    if (filter === 'Students') {
      return base.filter((item) => item.voiceType === 'Student');
    }
    return base;
  }, [testimonials, isAdmin, filter]);

  const featuredQuotes = useMemo(
    () => visibleTestimonials.filter((item) => item.featured).slice(0, 2),
    [visibleTestimonials],
  );

  const featuredIds = useMemo(
    () => new Set(featuredQuotes.map((item) => item.id)),
    [featuredQuotes],
  );

  const remainingQuotes = useMemo(
    () => visibleTestimonials.filter((item) => !featuredIds.has(item.id)),
    [visibleTestimonials, featuredIds],
  );

  const countByType = (voiceType: TestimonialVoiceType) => {
    const base = isAdmin ? testimonials : testimonials.filter((item) => item.published);
    return base.filter((item) => item.voiceType === voiceType).length;
  };

  return (
    <section
      id="testimonials"
      className="border-b border-[#D4DFEB] bg-[#EDF4FA]/35 py-16 dark:border-[#1E334D] dark:bg-[#0B1728]/70 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Section Header & Filter Controls */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] dark:text-[#60A5FA] uppercase">
              {t.testimonials.kickerPrefix} ·{' '}
              <span className="tabular-figures">{countByType('Parent')} {t.testimonials.parentLabel}</span> &amp;{' '}
              <span className="tabular-figures">{countByType('Student')} {t.testimonials.studentLabel}</span>{' '}
              {t.testimonials.voicesWord}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] sm:text-4xl [text-wrap:balance]">
              {t.testimonials.heading}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
              {t.testimonials.intro}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={onAddTestimonialClick}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#123D68] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0B2E50] dark:bg-[#1769AA] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.testimonials.addNew}</span>
              </button>
            )}

            <div
              role="tablist"
              aria-label="Filter parent and student testimonials"
              className="flex flex-wrap gap-1.5 rounded-lg border border-[#D4DFEB] bg-[#FFFFFF] p-1.5 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
            >
              {VOICE_FILTERS.map((voice) => {
                const active = filter === voice;
                const voiceLabel =
                  voice === 'All Voices'
                    ? t.testimonials.filterAll
                    : voice === 'Parents'
                      ? t.testimonials.filterParents
                      : t.testimonials.filterStudents;
                return (
                  <button
                    key={voice}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setFilter(voice)}
                    className={`min-h-[40px] rounded-md px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                      active
                        ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                        : 'text-[#334155] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                    }`}
                  >
                    {voiceLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty / Syncing States */}
        {testimonialsLoading && visibleTestimonials.length === 0 ? (
          <div className="mt-10 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-10 text-center dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <p className="text-sm font-medium text-[#475569] dark:text-[#94A3B8]">
              {t.testimonials.loading}
            </p>
          </div>
        ) : visibleTestimonials.length === 0 ? (
          <div className="mt-10 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-10 text-center dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <p className="text-sm font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
              {t.testimonials.empty}
            </p>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
              {isAdmin ? t.testimonials.emptyHintAdmin : t.testimonials.emptyHintPublic}
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {/* Featured Editorial Pull-Quote Row */}
            {featuredQuotes.length > 0 && (
              <div className="grid grid-cols-1 gap-8 border-y border-[#D4DFEB] py-10 dark:border-[#1E334D] lg:grid-cols-2 lg:gap-12">
                {featuredQuotes.map((item) => (
                  <blockquote
                    key={item.id}
                    className="flex flex-col justify-between gap-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                        <span className="font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                          {item.voiceType === 'Parent'
                            ? t.testimonials.parentVoiceTag
                            : t.testimonials.studentVoiceTag}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.gradeContext}</span>
                        {!item.published && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-[#B91C1C] dark:text-[#FCA5A5]">{t.posts.draftOwnerOnly}</span>
                          </>
                        )}
                      </div>

                      <p className="mt-4 font-display text-xl leading-relaxed italic text-[#0B2E50] dark:text-[#EAF1F8] sm:text-2xl">
                        “{item.quote}”
                      </p>
                    </div>

                    <footer className="flex items-center justify-between gap-4 border-t border-[#D4DFEB]/70 pt-4 text-xs text-[#475569] dark:border-[#1E334D] dark:text-[#94A3B8]">
                      <div>
                        <span className="font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">{item.authorName}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.roleLabel}</span>
                      </div>
                      <span className="shrink-0 tabular-figures">{item.displayDate}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>
            )}

            {/* Full Quote Archive Grid */}
            {remainingQuotes.length > 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {remainingQuotes.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                        <p className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                            {localizeCategory(item.voiceType)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.gradeContext}</span>
                          {!item.published && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-[#B91C1C] dark:text-[#FCA5A5]">{t.posts.draftShort}</span>
                            </>
                          )}
                        </p>
                        <Quote className="h-4 w-4 shrink-0 text-[#CBD8E6] dark:text-[#1E334D]" aria-hidden="true" />
                      </div>

                      <blockquote className="mt-4 font-display text-base leading-relaxed text-[#0B2E50] dark:text-[#E7EFF8]">
                        “{item.quote}”
                      </blockquote>
                    </div>

                    <footer className="mt-6 border-t border-[#D4DFEB] pt-4 text-xs text-[#475569] dark:border-[#1E334D] dark:text-[#94A3B8]">
                      <p className="font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">{item.authorName}</p>
                      <p className="mt-0.5 flex items-center justify-between gap-2">
                        <span>{item.roleLabel}</span>
                        <span className="shrink-0 tabular-figures">{item.displayDate}</span>
                      </p>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
