import { useMemo, useState } from 'react';
import { CalendarPlus, Clock } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { CalendarEvent } from '../data/schoolData';

type EventCategory = 'All Notices' | 'Academic Dates' | 'Parent Meetings' | 'Athletics & Clubs';

const CATEGORIES: EventCategory[] = [
  'All Notices',
  'Academic Dates',
  'Parent Meetings',
  'Athletics & Clubs',
];

function downloadIcsEvent(event: CalendarEvent) {
  const start = event.dateISO;
  const endHour = String(Number(start.slice(9, 11)) + 2).padStart(2, '0');
  const end = `${start.slice(0, 9)}${endHour}${start.slice(11)}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EP Saint Pierre Nkombo//School Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@epnkombo.rw`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title} — EP Saint Pierre Nkombo`,
    `LOCATION:${event.location}, Nkombo Island, Rusizi`,
    `DESCRIPTION:${event.description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${event.id}-ep-saint-pierre-nkombo.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function CalendarSection() {
  const { calendarEvents, dailySchedule } = useSchoolData();
  const { t, localizeCategory } = useLanguage();
  const [category, setCategory] = useState<EventCategory>('All Notices');
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    if (category === 'All Notices') return calendarEvents;
    return calendarEvents.filter((item) => item.category === category);
  }, [calendarEvents, category]);

  const handleDownload = (event: CalendarEvent) => {
    downloadIcsEvent(event);
    setSavedNoticeId(event.id);
    window.setTimeout(() => {
      setSavedNoticeId((prev) => (prev === event.id ? null : prev));
    }, 3000);
  };

  return (
    <section id="calendar" className="border-b border-[#E5DFD3] bg-[#F3EFE7]/45 py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wider text-[#57534E]">
              {t.calendar.kicker}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#1C1917] sm:text-4xl [text-wrap:balance]">
              {t.calendar.heading}
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter calendar events"
            className="flex flex-wrap gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#F3EFE7] p-1.5"
          >
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[40px] rounded-md px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D] ${
                    isSelected
                      ? 'bg-[#FFFFFF] text-[#14532D] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {cat === 'All Notices' ? t.calendar.filterAll : localizeCategory(cat)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="divide-y divide-[#E5DFD3] rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] lg:col-span-7">
            {filteredEvents.map((ev) => (
              <article
                key={ev.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-[#E5DFD3] bg-[#FBF9F5] py-2 text-center">
                    <span className="font-mono text-[11px] font-medium text-[#14532D]">
                      {ev.monthLabel}
                    </span>
                    <span className="font-display text-xl font-semibold text-[#1C1917] tabular-figures">
                      {ev.dayNumber}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-[#57534E] tabular-figures">
                      <span className="font-medium text-[#14532D]">{localizeCategory(ev.category)}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{ev.timeRange}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{ev.location}</span>
                    </p>
                    <h3 className="mt-1 font-display text-lg font-medium text-[#1C1917]">
                      {ev.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#44403C]">
                      {ev.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 sm:pt-1">
                  <button
                    type="button"
                    onClick={() => handleDownload(ev)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 py-2 text-xs font-medium text-[#1C1917] transition-colors duration-150 hover:border-[#14532D] hover:text-[#14532D] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{savedNoticeId === ev.id ? t.calendar.savedIcs : t.calendar.addToCalendar}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-6 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
                <div>
                  <h3 className="font-display text-xl font-medium text-[#1C1917]">
                    {t.calendar.bellTitle}
                  </h3>
                  <p className="mt-1 text-xs text-[#57534E]">
                    {t.calendar.bellSubtitle}
                  </p>
                </div>
                <Clock className="h-5 w-5 text-[#14532D]" aria-hidden="true" />
              </div>

              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sr-only">
                    <tr>
                      <th>Time</th>
                      <th>Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFD3]">
                    {dailySchedule.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 pr-4 align-top font-mono text-xs font-medium text-[#14532D] whitespace-nowrap tabular-figures">
                          {row.time}
                        </td>
                        <td className="py-3 align-top">
                          <p className="text-sm font-medium text-[#1C1917]">{row.activity}</p>
                          <p className="text-xs text-[#57534E]">{row.notes}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-5 border-t border-[#E5DFD3] pt-4 text-xs leading-relaxed text-[#57534E]">
              {t.calendar.bellNoteBefore}{' '}
              <span className="font-mono text-[#1C1917] tabular-figures">07:00</span>{' '}
              {t.calendar.bellNoteMiddle}{' '}
              <span className="font-mono text-[#1C1917] tabular-figures">12:30</span>
              {t.calendar.bellNoteAfter}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
