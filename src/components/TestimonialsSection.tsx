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
    <section id="testimonials" className="border-b border-[#E5DFD3] bg-[#FFFFFF]/65 py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Section Header & Filter Controls */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wider text-[#57534E]">
              {t.testimonials.kickerPrefix} ·{' '}
              <span className="tabular-figures">{countByType('Parent')} {t.testimonials.parentLabel}</span> &amp;{' '}
              <span className="tabular-figures">{countByType('Student')} {t.testimonials.studentLabel}</span>{' '}
              {t.testimonials.voicesWord}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#1C1917] sm:text-4xl [text-wrap:balance]">
              {t.testimonials.heading}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#44403C]">
              {t.testimonials.intro}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={onAddTestimonialClick}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0F3F22] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.testimonials.addNew}</span>
              </button>
            )}

            <div
              role="tablist"
              aria-label="Filter parent and student testimonials"
              className="flex flex-wrap gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#F3EFE7] p-1.5"
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
                    className={`min-h-[40px] rounded-md px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D] ${
                      active
                        ? 'bg-[#FFFFFF] text-[#14532D] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
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
          <div className="mt-10 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-10 text-center">
            <p className="text-sm font-medium text-[#57534E]">
              {t.testimonials.loading}
            </p>
          </div>
        ) : visibleTestimonials.length === 0 ? (
          <div className="mt-10 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-10 text-center">
            <p className="text-sm font-medium text-[#1C1917]">
              {t.testimonials.empty}
            </p>
            <p className="mt-1 text-xs text-[#57534E]">
              {isAdmin ? t.testimonials.emptyHintAdmin : t.testimonials.emptyHintPublic}
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {/* Featured Editorial Pull-Quote Row */}
            {featuredQuotes.length > 0 && (
              <div className="grid grid-cols-1 gap-8 border-y border-[#E5DFD3] py-10 lg:grid-cols-2 lg:gap-12">
                {featuredQuotes.map((item) => (
                  <blockquote
                    key={item.id}
                    className="flex flex-col justify-between gap-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                        <span className="font-semibold text-[#14532D]">
                          {item.voiceType === 'Parent'
                            ? t.testimonials.parentVoiceTag
                            : t.testimonials.studentVoiceTag}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.gradeContext}</span>
                        {!item.published && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-[#B91C1C]">{t.posts.draftOwnerOnly}</span>
                          </>
                        )}
                      </div>

                      <p className="mt-4 font-display text-xl leading-relaxed italic text-[#1C1917] sm:text-2xl">
                        “{item.quote}”
                      </p>
                    </div>

                    <footer className="flex items-center justify-between gap-4 border-t border-[#E5DFD3]/70 pt-4 text-xs text-[#57534E]">
                      <div>
                        <span className="font-semibold text-[#1C1917]">{item.authorName}</span>
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
                    className="flex flex-col justify-between rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
                        <p className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#14532D]">
                            {localizeCategory(item.voiceType)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.gradeContext}</span>
                          {!item.published && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-[#B91C1C]">{t.posts.draftShort}</span>
                            </>
                          )}
                        </p>
                        <Quote className="h-4 w-4 shrink-0 text-[#D6CEBE]" aria-hidden="true" />
                      </div>

                      <blockquote className="mt-4 font-display text-base leading-relaxed text-[#1C1917]">
                        “{item.quote}”
                      </blockquote>
                    </div>

                    <footer className="mt-6 border-t border-[#E5DFD3] pt-4 text-xs text-[#57534E]">
                      <p className="font-semibold text-[#1C1917]">{item.authorName}</p>
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
