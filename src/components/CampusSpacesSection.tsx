import { useEffect, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { CampusSpace } from '../data/schoolData';
import { ResilientImage } from './ResilientImage';

export function CampusSpacesSection() {
  const { campusSpaces } = useSchoolData();
  const { t, portal } = useLanguage();
  const [selectedSpace, setSelectedSpace] = useState<CampusSpace | null>(null);

  useEffect(() => {
    if (!selectedSpace) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSpace(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSpace]);

  const featuredSpace = campusSpaces[0];
  const secondarySpaces = campusSpaces.slice(1, 3);
  const panoramicSpace = campusSpaces[3];
  const extraSpaces = campusSpaces.slice(4);

  return (
    <section
      id="campus"
      className="border-b border-[#D4DFEB] bg-[#EDF4FA]/50 py-16 dark:border-[#1E334D] dark:bg-[#0B1728]/70 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-[#1769AA] dark:text-[#60A5FA] uppercase">
            {t.campus.kicker}
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] sm:text-4xl [text-wrap:balance]">
            {t.campus.heading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
            {t.campus.intro}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {featuredSpace && (
            <button
              type="button"
              onClick={() => setSelectedSpace(featuredSpace)}
              className="group flex flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-4 text-left transition-colors duration-150 hover:border-[#1769AA]/50 dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:hover:border-[#60A5FA]/50 lg:col-span-7 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#EDF4FA] dark:bg-[#13253D]">
                <ResilientImage
                  src={featuredSpace.image}
                  alt={featuredSpace.imageAlt}
                  fallbackTitle={featuredSpace.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="mt-5 flex flex-col gap-2 px-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    {featuredSpace.indexLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769AA] dark:text-[#60A5FA] whitespace-nowrap shrink-0">
                    {t.campus.viewDetails}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                  {featuredSpace.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                  {featuredSpace.description}
                </p>
              </div>
            </button>
          )}

          {secondarySpaces.length > 0 && (
            <div className="flex flex-col gap-6 lg:col-span-5">
              {secondarySpaces.map((space) => (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => setSelectedSpace(space)}
                  className="group flex flex-1 flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-4 text-left transition-colors duration-150 hover:border-[#1769AA]/50 dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:hover:border-[#60A5FA]/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#EDF4FA] dark:bg-[#13253D] sm:col-span-5">
                      <ResilientImage
                        src={space.image}
                        alt={space.imageAlt}
                        fallbackTitle={space.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        {space.indexLabel}
                      </p>
                      <h3 className="mt-1.5 font-display text-xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                        {space.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                        {space.description}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                        {t.campus.inspectSpace}
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {panoramicSpace && (
            <button
              type="button"
              onClick={() => setSelectedSpace(panoramicSpace)}
              className="group grid grid-cols-1 items-stretch gap-6 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-4 text-left transition-colors duration-150 hover:border-[#1769AA]/50 dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:hover:border-[#60A5FA]/50 lg:col-span-12 lg:grid-cols-12 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-[#EDF4FA] dark:bg-[#13253D] lg:col-span-7 lg:aspect-[16/8]">
                <ResilientImage
                  src={panoramicSpace.image}
                  alt={panoramicSpace.imageAlt}
                  fallbackTitle={panoramicSpace.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-col justify-center px-1 py-2 lg:col-span-5 lg:px-4">
                <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                  {panoramicSpace.indexLabel}
                </p>
                <h3 className="mt-2 font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                  {panoramicSpace.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                  {panoramicSpace.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                  {panoramicSpace.highlights.map((item, idx) => (
                    <span key={item} className="inline-flex items-center gap-3">
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                  {t.campus.viewDetails}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            </button>
          )}

          {extraSpaces.map((space) => (
            <button
              key={space.id}
              type="button"
              onClick={() => setSelectedSpace(space)}
              className="group flex flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-4 text-left transition-colors duration-150 hover:border-[#1769AA]/50 dark:border-[#1E334D] dark:bg-[#0D1B2D] lg:col-span-6 cursor-pointer"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#EDF4FA] dark:bg-[#13253D]">
                <ResilientImage
                  src={space.image}
                  alt={space.imageAlt}
                  fallbackTitle={space.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                  {space.indexLabel}
                </p>
                <h3 className="mt-1 font-display text-xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                  {space.title}
                </h3>
                <p className="mt-2 text-sm text-[#475569] dark:text-[#CBD5E1]">
                  {space.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-[#475569] dark:text-[#94A3B8]">
          {portal.contact.photoConsentNote}
        </p>
      </div>

      {selectedSpace && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="space-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08223C]/70 p-4 backdrop-blur-xs"
          onClick={() => setSelectedSpace(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-[#CBD8E6] bg-[#FFFFFF] shadow-xl dark:border-[#1E334D] dark:bg-[#0D1B2D]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D4DFEB] px-6 py-4 dark:border-[#1E334D]">
              <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                {selectedSpace.figureNumber} · {selectedSpace.subtitle}
              </p>
              <button
                type="button"
                aria-label="Close space details"
                onClick={() => setSelectedSpace(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#CBD8E6] bg-[#FFFFFF] text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:hover:bg-[#1A3150] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#EDF4FA] dark:bg-[#13253D]">
                <ResilientImage
                  src={selectedSpace.image}
                  alt={selectedSpace.imageAlt}
                  fallbackTitle={selectedSpace.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <h3
                id="space-modal-title"
                className="mt-5 font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]"
              >
                {selectedSpace.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                {selectedSpace.description}
              </p>

              <div className="mt-5 border-t border-[#D4DFEB] pt-4 dark:border-[#1E334D]">
                <p className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
                  {t.campus.highlightsTitle}
                </p>
                <ul className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {selectedSpace.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="rounded-md border border-[#D4DFEB] bg-[#F8FAFD] px-3 py-2 text-xs text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
