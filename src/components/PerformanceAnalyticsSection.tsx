import { useMemo, useState } from 'react';
import { Award, BarChart3, Upload, Users } from 'lucide-react';
import { LIBRARY_SUBJECTS, SCHOOL_CLASSES } from '../data/portalCatalog';
import { useSchoolData } from '../context/SchoolDataContext';
import { usePortalFeatures } from '../context/PortalFeaturesContext';

type TermView = 'term1' | 'term2' | 'term3' | 'ple';

interface PerformanceAnalyticsSectionProps {
  onOpenRosterUploader: () => void;
}

export function PerformanceAnalyticsSection({
  onOpenRosterUploader,
}: PerformanceAnalyticsSectionProps) {
  const { isAdmin, settings } = useSchoolData();
  const { classSummaries } = usePortalFeatures();

  const [termView, setTermView] = useState<TermView>('term3');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  const filteredClasses = useMemo(() => {
    if (selectedClass === 'ALL') return classSummaries;
    return classSummaries.filter((c) => c.className === selectedClass);
  }, [classSummaries, selectedClass]);

  const totals = useMemo(() => {
    const totalStudents = filteredClasses.reduce((s, c) => s + c.totalStudents, 0);
    const totalFemale = filteredClasses.reduce((s, c) => s + c.femaleCount, 0);
    const totalMale = filteredClasses.reduce((s, c) => s + c.maleCount, 0);

    const scoreField =
      termView === 'term1'
        ? 'term1Avg'
        : termView === 'term2'
          ? 'term2Avg'
          : termView === 'ple'
            ? 'pleAvg'
            : 'term3Avg';

    const validForTerm = filteredClasses.filter((c) => c[scoreField] > 0);
    const avgScore =
      validForTerm.length > 0
        ? (validForTerm.reduce((s, c) => s + c[scoreField], 0) / validForTerm.length).toFixed(1)
        : '—';

    const avgPassRate =
      filteredClasses.length > 0
        ? (
            filteredClasses.reduce((s, c) => s + c.passRatePct, 0) / filteredClasses.length
          ).toFixed(1)
        : '0.0';

    const p6 = classSummaries.find((c) => c.className === 'P6');

    return {
      totalStudents,
      totalFemale,
      totalMale,
      avgScore,
      avgPassRate,
      pleRate: p6?.pleAvg ? `${p6.pleAvg}%` : settings.plePassRate,
    };
  }, [filteredClasses, classSummaries, termView, settings.plePassRate]);

  const subjectMatrix = useMemo(() => {
    const rows: { subject: string; avg: number }[] = [];
    for (const subj of LIBRARY_SUBJECTS) {
      const vals = filteredClasses
        .map((c) => c.subjectAverages[subj.id])
        .filter((v): v is number => typeof v === 'number' && v > 0);
      if (vals.length > 0) {
        rows.push({
          subject: subj.shortLabel,
          avg: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)),
        });
      }
    }
    return rows;
  }, [filteredClasses]);

  const getScoreForClass = (c: (typeof classSummaries)[number]) => {
    if (termView === 'term1') return c.term1Avg;
    if (termView === 'term2') return c.term2Avg;
    if (termView === 'ple') return c.pleAvg;
    return c.term3Avg;
  };

  return (
    <section
      id="performance"
      className="border-b border-[#D4DFEB] bg-[#FFFFFF] py-16 dark:border-[#1E334D] dark:bg-[#0B1728] sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] uppercase dark:text-[#60A5FA]">
              Academic Performance Analytics · Terms I–III & National PLE
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-white sm:text-4xl [text-wrap:balance]">
              Student Progress by Class, Gender & National Examination
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1] sm:text-base">
              Live school-wide class performance updates automatically whenever the Owner records or imports Term 1, Term 2, Term 3, or Primary Leaving National Examination marks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenRosterUploader}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#14532D] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0F3F22] whitespace-nowrap cursor-pointer"
              >
                <Upload className="h-4 w-4 text-[#F2B544]" />
                <span>Upload Student List & Record Marks</span>
              </button>
            )}
          </div>
        </div>

        {/* Term & Class Controls */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#CBD8E6] bg-[#F6F9FC] p-1.5 dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            {[
              { id: 'term1', label: 'Term 1' },
              { id: 'term2', label: 'Term 2' },
              { id: 'term3', label: 'Term 3' },
              { id: 'ple', label: 'National Exam (PLE)' },
            ].map((tv) => (
              <button
                key={tv.id}
                type="button"
                onClick={() => setTermView(tv.id as TermView)}
                className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  termView === tv.id
                    ? 'bg-[#123D68] text-white dark:bg-[#1769AA]'
                    : 'text-[#475569] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                }`}
              >
                {tv.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="perf-class-filter" className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              Filter Class:
            </label>
            <select
              id="perf-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="h-9 rounded-lg border border-[#CBD8E6] bg-white px-3 text-xs font-semibold text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-white cursor-pointer"
            >
              <option value="ALL">All Classes (N1 – P6)</option>
              {SCHOOL_CLASSES.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Metric Grid */}
        <div className="mt-6 grid grid-cols-1 divide-y divide-[#D4DFEB] rounded-2xl border border-[#D4DFEB] bg-[#F8FAFD] dark:divide-[#1E334D] dark:border-[#1E334D] dark:bg-[#0D1B2D] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          <div className="p-5">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              Enrolled Students ({selectedClass === 'ALL' ? 'School-wide' : selectedClass})
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-[#0B2E50] dark:text-white tabular-figures">
              {totals.totalStudents}
            </p>
            <p className="mt-1 flex items-center gap-2 text-xs text-[#475569] dark:text-[#CBD5E1] tabular-figures">
              <Users className="h-3.5 w-3.5 text-[#1769AA]" />
              <span>
                Girls: {totals.totalFemale} · Boys: {totals.totalMale}
              </span>
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              Selected Period Mean Score
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-[#1769AA] dark:text-[#60A5FA] tabular-figures">
              {totals.avgScore === '—' ? '—' : `${totals.avgScore}%`}
            </p>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#CBD5E1]">
              {termView === 'ple' ? 'P6 PLE National Candidates' : 'Continuous Tests & Term Exams'}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              Class Promotion Pass Rate
            </p>
            <p className="mt-1.5 font-mono text-2xl font-bold text-[#14532D] dark:text-[#4ADE80] tabular-figures">
              {totals.avgPassRate}%
            </p>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#CBD5E1]">
              Learners scoring &ge; 50% threshold
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              P6 National Examination (PLE)
            </p>
            <p className="mt-1.5 flex items-center gap-2 font-mono text-2xl font-bold text-[#92400E] dark:text-[#F2B544] tabular-figures">
              <Award className="h-5 w-5" />
              <span>{totals.pleRate}</span>
            </p>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#CBD5E1]">
              Division I & II Readiness Benchmark
            </p>
          </div>
        </div>

        {/* Two-column Analytics: Class Bars & Subject Performance */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Class-by-Class Table + Bars */}
          <div className="rounded-2xl border border-[#D4DFEB] bg-[#F8FAFD] p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D] lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#D4DFEB] pb-3 dark:border-[#1E334D]">
              <h3 className="flex items-center gap-2 font-display text-lg font-medium text-[#0B2E50] dark:text-white">
                <BarChart3 className="h-4 w-4 text-[#1769AA]" />
                <span>Class & Gender Performance Breakdown</span>
              </h3>
              <span className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8]">
                T1 · T2 · T3 · PLE
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {filteredClasses.map((cls) => {
                const score = getScoreForClass(cls);
                const widthPct = Math.min(100, Math.max(0, score));
                return (
                  <div
                    key={cls.className}
                    className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-7 w-9 items-center justify-center rounded bg-[#123D68] font-mono text-xs font-bold text-white dark:bg-[#1769AA]">
                          {cls.className}
                        </span>
                        <span className="font-medium text-[#0B2E50] dark:text-white tabular-figures">
                          {cls.totalStudents} pupils ({cls.femaleCount}F / {cls.maleCount}M)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-xs tabular-figures">
                        <span className="text-[#475569] dark:text-[#94A3B8]">
                          Girls {cls.femaleAvg}% · Boys {cls.maleAvg}%
                        </span>
                        <span className="font-bold text-[#14532D] dark:text-[#4ADE80]">
                          {score > 0 ? `${score}%` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1E334D]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#123D68] via-[#1769AA] to-[#16A34A] transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject Performance & Term Growth */}
          <div className="rounded-2xl border border-[#D4DFEB] bg-[#F8FAFD] p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D] lg:col-span-5">
            <h3 className="border-b border-[#D4DFEB] pb-3 font-display text-lg font-medium text-[#0B2E50] dark:text-white dark:border-[#1E334D]">
              Subject Mastery Overview
            </h3>

            <div className="mt-4 space-y-3">
              {subjectMatrix.map((row) => (
                <div key={row.subject}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0F1E33] dark:text-[#E2E8F0]">
                      {row.subject}
                    </span>
                    <span className="font-mono font-semibold text-[#1769AA] dark:text-[#60A5FA] tabular-figures">
                      {row.avg}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1E334D]">
                    <div
                      className="h-full rounded-full bg-[#1769AA] dark:bg-[#60A5FA]"
                      style={{ width: `${Math.min(100, row.avg)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-[#CBD8E6] bg-white p-4 dark:border-[#1E334D] dark:bg-[#0A1626]">
              <p className="text-xs font-semibold text-[#14532D] uppercase dark:text-[#86EFAC]">
                National Examination (PLE) & Term Growth
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#475569] dark:text-[#CBD5E1]">
                Consistent progression from Term 1 through Term 3 equips P6 candidates for Division I distinction in Mathematics, SET, English, French, Ikinyarwanda, and SRE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
