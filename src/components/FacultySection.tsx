import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';

type DepartmentFilter = 'All Staff' | 'Administration' | 'Lower Primary' | 'Upper Primary & STEM';

const DEPARTMENTS: DepartmentFilter[] = [
  'All Staff',
  'Administration',
  'Lower Primary',
  'Upper Primary & STEM',
];

export function FacultySection() {
  const { faculty } = useSchoolData();
  const { t, localizeCategory } = useLanguage();
  const [department, setDepartment] = useState<DepartmentFilter>('All Staff');
  const [query, setQuery] = useState('');

  const filteredFaculty = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faculty.filter((member) => {
      const matchesDept = department === 'All Staff' || member.department === department;
      const matchesQuery =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q) ||
        member.subjects.toLowerCase().includes(q);
      return matchesDept && matchesQuery;
    });
  }, [faculty, department, query]);

  return (
    <section id="faculty" className="border-b border-[#E5DFD3] py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wider text-[#57534E]">
              {t.faculty.kicker}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#1C1917] sm:text-4xl [text-wrap:balance]">
              {t.faculty.heading}
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#57534E]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.faculty.searchPlaceholder}
                aria-label={t.faculty.searchPlaceholder}
                className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FFFFFF] pr-3 pl-9 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#14532D] focus:outline-none sm:w-56"
              />
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Filter faculty by department"
          className="mt-6 inline-flex flex-wrap gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#F3EFE7] p-1.5"
        >
          {DEPARTMENTS.map((dept) => {
            const isActive = department === dept;
            return (
              <button
                key={dept}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setDepartment(dept)}
                className={`min-h-[40px] rounded-md px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D] ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#14532D] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {dept === 'All Staff' ? t.faculty.allStaff : localizeCategory(dept)}
              </button>
            );
          })}
        </div>

        {filteredFaculty.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-8 text-center">
            <p className="text-sm font-medium text-[#1C1917]">
              {t.faculty.emptyResult}
            </p>
            <button
              type="button"
              onClick={() => {
                setDepartment('All Staff');
                setQuery('');
              }}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-[#E5DFD3] px-4 py-2 text-xs font-medium text-[#14532D] hover:bg-[#F3EFE7] cursor-pointer"
            >
              {t.faculty.resetFilters}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredFaculty.map((member) => (
              <article
                key={member.id}
                className="flex flex-col justify-between rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D6CEBE] bg-[#F3EFE7] font-display text-sm font-semibold text-[#14532D]"
                      >
                        {member.initials}
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-medium text-[#1C1917]">
                          {member.name}
                        </h3>
                        <p className="text-xs font-medium text-[#14532D]">{member.role}</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-[#57534E]">
                    <span>{localizeCategory(member.department)}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-figures">{member.yearsAtSchool} {t.faculty.yearsSuffix}</span>
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-[#44403C]">{member.bio}</p>
                </div>

                <p className="mt-5 border-t border-[#E5DFD3] pt-3.5 text-xs font-medium text-[#57534E]">
                  {t.faculty.focusLabel} <span className="text-[#1C1917]">{member.subjects}</span>
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
