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
    <section
      id="faculty"
      className="border-b border-[#D4DFEB] bg-[#FFFFFF] py-16 dark:border-[#1E334D] dark:bg-[#081322] sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] dark:text-[#60A5FA] uppercase">
              {t.faculty.kicker}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] sm:text-4xl [text-wrap:balance]">
              {t.faculty.heading}
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.faculty.searchPlaceholder}
                aria-label={t.faculty.searchPlaceholder}
                className="h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] pr-3 pl-9 text-sm text-[#0B2E50] placeholder:text-[#64748B] focus:border-[#1769AA] focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] sm:w-56"
              />
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Filter faculty by department"
          className="mt-6 inline-flex flex-wrap gap-1.5 rounded-lg border border-[#D4DFEB] bg-[#EDF4FA] p-1.5 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
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
                className={`min-h-[40px] rounded-md px-3.5 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                  isActive
                    ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                    : 'text-[#334155] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                }`}
              >
                {dept === 'All Staff' ? t.faculty.allStaff : localizeCategory(dept)}
              </button>
            );
          })}
        </div>

        {filteredFaculty.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-8 text-center dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <p className="text-sm font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
              {t.faculty.emptyResult}
            </p>
            <button
              type="button"
              onClick={() => {
                setDepartment('All Staff');
                setQuery('');
              }}
              className="mt-3 inline-flex items-center justify-center rounded-md border border-[#CBD8E6] px-4 py-2 text-xs font-medium text-[#123D68] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:text-[#93C5FD] dark:hover:bg-[#13253D] cursor-pointer"
            >
              {t.faculty.resetFilters}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredFaculty.map((member) => (
              <article
                key={member.id}
                className="flex flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#F8FAFD] p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#CBD8E6] bg-[#EDF4FA] font-display text-sm font-semibold text-[#123D68] dark:border-[#3B82F6]/40 dark:bg-[#13253D] dark:text-[#93C5FD]"
                      >
                        {member.initials}
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                          {member.name}
                        </h3>
                        <p className="text-xs font-medium text-[#1769AA] dark:text-[#60A5FA]">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-[#475569] dark:text-[#94A3B8]">
                    <span>{localizeCategory(member.department)}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-figures">{member.yearsAtSchool} {t.faculty.yearsSuffix}</span>
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                    {member.bio}
                  </p>
                </div>

                <p className="mt-5 border-t border-[#D4DFEB] pt-3.5 text-xs font-medium text-[#475569] dark:border-[#1E334D] dark:text-[#94A3B8]">
                  {t.faculty.focusLabel}{' '}
                  <span className="text-[#0B2E50] dark:text-[#E7EFF8]">{member.subjects}</span>
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
