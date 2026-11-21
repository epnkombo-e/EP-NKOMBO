import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import { ResilientImage } from './ResilientImage';

export function AcademicsSection() {
  const { academics, settings, campusSpaces } = useSchoolData();
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState(academics[0]?.id ?? 'lower-primary');

  useEffect(() => {
    if (academics.length > 0 && !academics.some((d) => d.id === activeId)) {
      setActiveId(academics[0].id);
    }
  }, [academics, activeId]);

  const current = academics.find((d) => d.id === activeId) ?? academics[0];
  if (!current) return null;

  const outcomeMetrics = [
    {
      value: settings.plePassRate,
      label: t.academics.metrics.passRateLabel,
      context: t.academics.metrics.passRateContext,
    },
    {
      value: '1 : 28',
      label: t.academics.metrics.ratioLabel,
      context: t.academics.metrics.ratioContext,
    },
    {
      value: '320+',
      label: t.academics.metrics.booksLabel,
      context: t.academics.metrics.booksContext,
    },
    {
      value: String(campusSpaces.length + 14),
      label: t.academics.metrics.spacesLabel,
      context: t.academics.metrics.spacesContext,
    },
  ];

  return (
    <section
      id="academics"
      className="border-b border-[#D4DFEB] bg-[#FFFFFF] py-16 dark:border-[#1E334D] dark:bg-[#081322] sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] dark:text-[#60A5FA] uppercase">
              {t.academics.kicker}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] sm:text-4xl [text-wrap:balance]">
              {t.academics.heading}
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="School academic divisions"
            className="flex flex-wrap gap-1.5 rounded-lg border border-[#D4DFEB] bg-[#EDF4FA] p-1.5 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
          >
            {academics.map((division) => {
              const isSelected = division.id === activeId;
              return (
                <button
                  key={division.id}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => setActiveId(division.id)}
                  className={`min-h-[40px] rounded-md px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                    isSelected
                      ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                      : 'text-[#334155] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                  }`}
                >
                  {division.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8] tabular-figures">
                <span className="font-medium text-[#14532D] dark:text-[#6EE7B7]">{current.grades}</span>
                <span aria-hidden="true">·</span>
                <span>{current.ageRange}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {current.weeklyHours} {t.academics.hoursPerWeekLong}
                </span>
                <span aria-hidden="true">·</span>
                <span>{current.classSize}</span>
              </div>

              <h3 className="mt-3 font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8] sm:text-3xl [text-wrap:balance]">
                {current.headline}
              </h3>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                {current.summary}
              </p>

              <div className="mt-8 divide-y divide-[#D4DFEB] border-y border-[#D4DFEB] dark:divide-[#1E334D] dark:border-[#1E334D]">
                {current.subjects.map((subject) => (
                  <div
                    key={subject.title}
                    className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-12 sm:items-baseline sm:gap-4"
                  >
                    <div className="flex items-baseline gap-3 sm:col-span-5">
                      <span className="font-mono text-xs font-medium text-[#1769AA] dark:text-[#60A5FA] tabular-figures">
                        {subject.index}
                      </span>
                      <h4 className="text-sm font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">
                        {subject.title}
                      </h4>
                    </div>
                    <p className="text-sm leading-relaxed text-[#475569] dark:text-[#CBD5E1] sm:col-span-5">
                      {subject.detail}
                    </p>
                    <div className="font-mono text-xs text-[#475569] dark:text-[#94A3B8] tabular-figures sm:col-span-2 sm:text-right">
                      {subject.hoursPerWeek} {t.academics.hoursShort}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold tracking-wide text-[#475569] dark:text-[#94A3B8]">
                {t.academics.milestonesHeading}
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {current.milestones.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-lg border border-[#D4DFEB] bg-[#F8FAFD] p-3.5 text-xs leading-relaxed text-[#334155] dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:text-[#CBD5E1]"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#14532D] dark:text-[#6EE7B7]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col lg:col-span-5">
            <figure className="flex h-full flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-3 dark:border-[#1E334D] dark:bg-[#0D1B2D]">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#EDF4FA] dark:bg-[#13253D] lg:aspect-auto lg:h-full lg:min-h-[380px]">
                <ResilientImage
                  src={current.image}
                  alt={current.imageAlt}
                  fallbackTitle={current.label}
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="mt-3 px-1 font-serif text-xs italic text-[#475569] dark:text-[#94A3B8]">
                {current.figureCaption}
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 divide-y divide-[#D4DFEB] rounded-xl border border-[#D4DFEB] bg-[#EDF4FA]/65 dark:divide-[#1E334D] dark:border-[#1E334D] dark:bg-[#0D1B2D] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {outcomeMetrics.map((metric) => (
            <div key={metric.label} className="p-6">
              <p className="font-display text-3xl font-semibold text-[#123D68] dark:text-[#F2B544] tabular-figures">
                {metric.value}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">
                {metric.label}
              </p>
              <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">{metric.context}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
