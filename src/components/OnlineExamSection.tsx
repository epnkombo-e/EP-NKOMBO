import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Grid2x2,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import {
  EXAM_TOPICS,
  P6_SET_EXAM_META,
  P6_SET_QUESTIONS,
  type ExamTopic,
} from '../data/examQuestions';

type ExamFilter = 'ALL' | 'UNANSWERED' | ExamTopic;

interface GradedResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  unansweredNumbers: number[];
  elapsedSeconds: number;
  submittedAtLabel: string;
  referenceCode: string | null;
  savedToFirestore: boolean;
  saveError: string | null;
  topicBreakdown: {
    topic: ExamTopic;
    correct: number;
    total: number;
    percentage: number;
  }[];
  questionOutcomes: {
    number: number;
    topic: ExamTopic;
    selected: number[];
    correctIndices: number[];
    isCorrect: boolean;
  }[];
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function isQuestionAnswered(questionNumber: number, selected: number[] | undefined): boolean {
  if (!selected) return false;
  return questionNumber === 2 ? selected.length === 2 : selected.length === 1;
}

export function OnlineExamSection() {
  const { settings, submitExamAttempt } = useSchoolData();
  const { portal } = useLanguage();
  const tExam = portal.exam;
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Student & school metadata
  const [district, setDistrict] = useState('Rusizi');
  const [sector, setSector] = useState('Nkombo');
  const [schoolName, setSchoolName] = useState(settings.schoolName || 'EP Saint Pierre Nkombo');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [candidateNumber, setCandidateNumber] = useState('');
  const [examDate, setExamDate] = useState(todayIsoDate);

  // Exam state
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [topicFilter, setTopicFilter] = useState<ExamFilter>('ALL');
  const [showMap, setShowMap] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Validation, submission & results
  const [q2Warning, setQ2Warning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gradedResult, setGradedResult] = useState<GradedResult | null>(null);

  useEffect(() => {
    if (!timerActive || gradedResult) return;
    const handle = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(handle);
  }, [timerActive, gradedResult]);

  const answeredCount = useMemo(() => {
    return P6_SET_QUESTIONS.reduce((acc, q) => {
      return isQuestionAnswered(q.number, answers[q.number]) ? acc + 1 : acc;
    }, 0);
  }, [answers]);

  const progressPercent = Math.round((answeredCount / P6_SET_EXAM_META.totalQuestions) * 100);

  const visibleQuestions = useMemo(() => {
    if (topicFilter === 'ALL') return P6_SET_QUESTIONS;
    if (topicFilter === 'UNANSWERED') {
      return P6_SET_QUESTIONS.filter((q) => !isQuestionAnswered(q.number, answers[q.number]));
    }
    return P6_SET_QUESTIONS.filter((q) => q.topic === topicFilter);
  }, [topicFilter, answers]);

  const handleSelectSingle = (qNum: number, optionIndex: number) => {
    if (!timerActive && !gradedResult) setTimerActive(true);
    setFormError(null);
    setAnswers((prev) => ({ ...prev, [qNum]: [optionIndex] }));
  };

  const handleToggleMultiQ2 = (optionIndex: number) => {
    if (!timerActive && !gradedResult) setTimerActive(true);
    setFormError(null);
    const current = answers[2] ?? [];
    if (current.includes(optionIndex)) {
      setQ2Warning(false);
      setAnswers((prev) => ({
        ...prev,
        2: current.filter((idx) => idx !== optionIndex),
      }));
      return;
    }
    if (current.length >= 2) {
      setQ2Warning(true);
      return;
    }
    setQ2Warning(false);
    setAnswers((prev) => ({
      ...prev,
      2: [...current, optionIndex].sort((a, b) => a - b),
    }));
  };

  const jumpToQuestion = (qNum: number) => {
    setTopicFilter('ALL');
    window.setTimeout(() => {
      const el = document.getElementById(`exam-question-${qNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 40);
  };

  const handleReset = () => {
    setAnswers({});
    setGradedResult(null);
    setFormError(null);
    setQ2Warning(false);
    setTimerActive(false);
    setElapsedSeconds(0);
    setTopicFilter('ALL');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      district.trim().length < 2 ||
      sector.trim().length < 2 ||
      schoolName.trim().length < 2 ||
      studentName.trim().length < 2 ||
      className.trim().length < 1 ||
      !examDate
    ) {
      setFormError(tExam.errMissingFields);
      return;
    }

    let score = 0;
    const unansweredNumbers: number[] = [];
    const topicStats = new Map<ExamTopic, { correct: number; total: number }>();

    for (const topic of EXAM_TOPICS) {
      topicStats.set(topic, { correct: 0, total: 0 });
    }

    const questionOutcomes = P6_SET_QUESTIONS.map((q) => {
      const selected = answers[q.number] ?? [];
      if (selected.length === 0) {
        unansweredNumbers.push(q.number);
      }
      const isCorrect =
        selected.length === q.correctIndices.length &&
        q.correctIndices.every((keyIdx) => selected.includes(keyIdx));

      const stat = topicStats.get(q.topic)!;
      stat.total += 1;
      if (isCorrect) {
        score += 1;
        stat.correct += 1;
      }

      return {
        number: q.number,
        topic: q.topic,
        selected,
        correctIndices: q.correctIndices,
        isCorrect,
      };
    });

    const totalQuestions = P6_SET_EXAM_META.totalQuestions;
    const percentage = Math.round((score / totalQuestions) * 100);
    const topicBreakdown = EXAM_TOPICS.map((topic) => {
      const st = topicStats.get(topic)!;
      return {
        topic,
        correct: st.correct,
        total: st.total,
        percentage: st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0,
      };
    });

    setSubmitting(true);
    setTimerActive(false);

    let referenceCode: string | null = null;
    let savedToFirestore = false;
    let saveError: string | null = null;

    try {
      referenceCode = await submitExamAttempt({
        examTitle: `${P6_SET_EXAM_META.title} · ${P6_SET_EXAM_META.subject}`,
        district: district.trim(),
        sector: sector.trim(),
        schoolName: schoolName.trim(),
        studentName: studentName.trim(),
        className: className.trim(),
        candidateNumber: candidateNumber.trim() || undefined,
        examDate,
        score,
        totalQuestions,
        percentage,
        unansweredCount: unansweredNumbers.length,
        elapsedSeconds,
      });
      savedToFirestore = true;
    } catch (err) {
      saveError =
        err instanceof Error
          ? err.message
          : 'Graded on this device. Unable to sync to the school server while offline.';
    }

    setGradedResult({
      score,
      totalQuestions,
      percentage,
      unansweredNumbers,
      elapsedSeconds,
      submittedAtLabel: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      referenceCode,
      savedToFirestore,
      saveError,
      topicBreakdown,
      questionOutcomes,
    });
    setSubmitting(false);

    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const outcomeByQuestion = useMemo(() => {
    if (!gradedResult) return null;
    return new Map(gradedResult.questionOutcomes.map((o) => [o.number, o]));
  }, [gradedResult]);

  return (
    <section
      id="exam"
      className="border-b border-[#D4DFEB] bg-gradient-to-b from-[#EDF4FA] via-[#F7FAFD] to-[#FFFFFF] py-16 dark:border-[#1E334D] dark:from-[#0B1728] dark:via-[#081322] dark:to-[#07111E] sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Vibrant Navy & Cobalt Institutional Exam Banner */}
        <div className="overflow-hidden rounded-2xl border border-[#123D68]/20 bg-gradient-to-br from-[#0B2E50] via-[#123D68] to-[#1769AA] p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#F2B544] uppercase">
                <BookOpenCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{tExam.kicker}</span>
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl [text-wrap:balance]">
                {tExam.heading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#DCEAF7] sm:text-base">
                {tExam.intro}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-xl border border-white/15 bg-[#08223C]/70 p-4 backdrop-blur-xs">
              <div>
                <p className="text-[11px] font-medium text-[#BBD5EE]">Questions</p>
                <p className="mt-0.5 font-display text-2xl font-semibold text-white tabular-figures">
                  50
                </p>
              </div>
              <div className="border-l border-white/15 pl-3">
                <p className="text-[11px] font-medium text-[#BBD5EE]">Answered</p>
                <p className="mt-0.5 font-display text-2xl font-semibold text-[#F2B544] tabular-figures">
                  {answeredCount}/50
                </p>
              </div>
              <div className="border-l border-white/15 pl-3">
                <p className="text-[11px] font-medium text-[#BBD5EE]">{tExam.timerLabel}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-lg font-semibold text-white tabular-figures">
                  <Clock className="h-4 w-4 text-[#F2B544]" aria-hidden="true" />
                  <span>{formatDuration(elapsedSeconds)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#DCEAF7]">
              <span className="font-medium tabular-figures">
                {answeredCount} {tExam.answeredOf} ({progressPercent}%)
              </span>
              <button
                type="button"
                onClick={() => setShowMap((prev) => !prev)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 whitespace-nowrap cursor-pointer"
              >
                <Grid2x2 className="h-3.5 w-3.5 text-[#F2B544]" aria-hidden="true" />
                <span>{showMap ? tExam.exitFocusBtn : tExam.startFocusBtn}</span>
              </button>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-md bg-white/15">
              <div
                className="h-full rounded-md bg-[#F2B544] transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Collapsible 1–50 Question Navigator Grid */}
          {showMap && (
            <div className="mt-5 rounded-xl border border-white/15 bg-[#08223C]/85 p-4">
              <p className="mb-3 text-xs font-medium text-[#DCEAF7]">
                Click any number below to jump straight to that question:
              </p>
              <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-12 md:grid-cols-[repeat(25,minmax(0,1fr))]">
                {P6_SET_QUESTIONS.map((q) => {
                  const done = isQuestionAnswered(q.number, answers[q.number]);
                  const outcome = outcomeByQuestion?.get(q.number);
                  let cellClass =
                    'border-white/20 bg-white/10 text-white hover:bg-white/25';
                  if (outcome) {
                    cellClass = outcome.isCorrect
                      ? 'border-[#34D399] bg-[#14532D] text-white'
                      : 'border-[#FCA5A5] bg-[#991B1B] text-white';
                  } else if (done) {
                    cellClass = 'border-[#F2B544] bg-[#F2B544] text-[#0B2E50] font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => jumpToQuestion(q.number)}
                      className={`flex h-8 items-center justify-center rounded border font-mono text-xs tabular-figures transition-colors cursor-pointer ${cellClass}`}
                    >
                      {q.number}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Form Wrapping Metadata & Questions */}
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
          {/* Student & School Identification Card */}
          <div className="rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-6 shadow-xs dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <div className="flex flex-col gap-2 border-b border-[#E5ECF4] pb-4 dark:border-[#1E334D] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-display text-xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                  {tExam.studentDeckTitle}
                </h3>
                <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                  <strong className="text-[#0B2E50] dark:text-[#E7EFF8]">{tExam.instructionsTitle}:</strong>{' '}
                  {tExam.instructionsBody}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="exam-district"
                  className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]"
                >
                  {tExam.districtLabel} *
                </label>
                <input
                  id="exam-district"
                  type="text"
                  required
                  maxLength={80}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0F1E33] focus:border-[#1769AA] focus:bg-white focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:focus:bg-[#13253D]"
                />
              </div>

              <div>
                <label htmlFor="exam-sector" className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                  {tExam.sectorLabel} *
                </label>
                <input
                  id="exam-sector"
                  type="text"
                  required
                  maxLength={80}
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0F1E33] focus:border-[#1769AA] focus:bg-white focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:focus:bg-[#13253D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="exam-school" className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                  {tExam.schoolLabel} *
                </label>
                <input
                  id="exam-school"
                  type="text"
                  required
                  maxLength={120}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0F1E33] focus:border-[#1769AA] focus:bg-white focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:focus:bg-[#13253D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="exam-student-name"
                  className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]"
                >
                  {tExam.studentNameLabel} *
                </label>
                <input
                  id="exam-student-name"
                  type="text"
                  required
                  maxLength={100}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={tExam.studentPlaceholder}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0F1E33] placeholder:text-[#64748B] focus:border-[#1769AA] focus:bg-white focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:focus:bg-[#13253D]"
                />
              </div>

              <div>
                <label htmlFor="exam-class" className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                  {tExam.classLabel} *
                </label>
                <input
                  id="exam-class"
                  type="text"
                  required
                  maxLength={40}
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder={tExam.classPlaceholder}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0F1E33] placeholder:text-[#64748B] focus:border-[#1769AA] focus:bg-white focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:focus:bg-[#13253D]"
                />
              </div>

              <div>
                <label
                  htmlFor="exam-candidate"
                  className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]"
                >
                  {tExam.candidateLabel}
                </label>
                <input
                  id="exam-candidate"
                  type="text"
                  maxLength={60}
                  value={candidateNumber}
                  onChange={(e) => setCandidateNumber(e.target.value)}
                  placeholder={tExam.candidatePlaceholder}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0F1E33] placeholder:text-[#64748B] focus:border-[#1769AA] focus:bg-white focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:focus:bg-[#13253D]"
                />
              </div>

              <div>
                <label htmlFor="exam-date" className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                  {tExam.examDateLabel} *
                </label>
                <input
                  id="exam-date"
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0F1E33] focus:border-[#1769AA] focus:bg-white focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:focus:bg-[#13253D]"
                />
              </div>
            </div>
          </div>

          {/* Topic Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Filter exam questions by science topic"
              className="flex flex-wrap gap-1.5 rounded-lg border border-[#D4DFEB] bg-[#EDF4FA] p-1.5 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
            >
              <button
                role="tab"
                aria-selected={topicFilter === 'ALL'}
                type="button"
                onClick={() => setTopicFilter('ALL')}
                className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  topicFilter === 'ALL'
                    ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                    : 'text-[#334155] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                }`}
              >
                {tExam.filterAll}
              </button>
              <button
                role="tab"
                aria-selected={topicFilter === 'UNANSWERED'}
                type="button"
                onClick={() => setTopicFilter('UNANSWERED')}
                className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  topicFilter === 'UNANSWERED'
                    ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                    : 'text-[#334155] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                }`}
              >
                {tExam.filterUnanswered} ({50 - answeredCount})
              </button>
              {EXAM_TOPICS.map((topic) => (
                <button
                  key={topic}
                  role="tab"
                  aria-selected={topicFilter === topic}
                  type="button"
                  onClick={() => setTopicFilter(topic)}
                  className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    topicFilter === topic
                      ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                      : 'text-[#334155] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          {visibleQuestions.length === 0 ? (
            <div className="rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-8 text-center dark:border-[#1E334D] dark:bg-[#0D1B2D]">
              <p className="text-sm font-medium text-[#14532D] dark:text-[#6EE7B7]">{tExam.allAnsweredNote}</p>
              <button
                type="button"
                onClick={() => setTopicFilter('ALL')}
                className="mt-3 inline-flex min-h-[38px] items-center rounded-md border border-[#1769AA] px-4 py-1.5 text-xs font-medium text-[#1769AA] hover:bg-[#EDF4FA] dark:border-[#60A5FA] dark:text-[#60A5FA] cursor-pointer"
              >
                {tExam.filterAll}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visibleQuestions.map((q) => {
                const selected = answers[q.number] ?? [];
                const outcome = outcomeByQuestion?.get(q.number);
                const isQ2 = q.multiSelect === 2;

                return (
                  <article
                    key={q.id}
                    id={`exam-question-${q.number}`}
                    className={`flex flex-col justify-between rounded-xl border bg-[#FFFFFF] p-5 transition-colors dark:bg-[#0D1B2D] ${
                      outcome
                        ? outcome.isCorrect
                          ? 'border-[#14532D]/40 bg-[#F4FAF6] dark:border-[#16A34A]/50 dark:bg-[#0B251B]'
                          : 'border-[#B91C1C]/40 bg-[#FEF7F7] dark:border-[#DC2626]/50 dark:bg-[#2A1015]'
                        : isQuestionAnswered(q.number, selected)
                          ? 'border-[#1769AA]/50 dark:border-[#3B82F6]/60'
                          : 'border-[#D4DFEB] dark:border-[#1E334D]'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                        <span className="font-mono font-semibold text-[#1769AA] dark:text-[#60A5FA] tabular-figures">
                          Q{String(q.number).padStart(2, '0')} · {q.topic}
                        </span>
                        {outcome && (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              outcome.isCorrect ? 'text-[#14532D]' : 'text-[#B91C1C]'
                            }`}
                          >
                            {outcome.isCorrect ? (
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            <span>
                              {outcome.isCorrect ? tExam.correctLabel : tExam.incorrectLabel}
                            </span>
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2.5 text-sm leading-snug font-semibold text-[#0B2E50] dark:text-[#EAF1F8] sm:text-[15px]">
                        {q.number}. {q.prompt}
                      </h4>

                      {isQ2 && (
                        <p className="mt-1.5 text-xs font-medium text-[#9A5B00] dark:text-[#F2B544]">
                          {tExam.q2Rule}
                        </p>
                      )}

                      {isQ2 && q2Warning && (
                        <p className="mt-2 flex items-center gap-1.5 rounded-md border border-[#F59E0B] bg-[#FFFBEB] px-3 py-2 text-xs font-medium text-[#92400E]">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{tExam.errQ2Limit}</span>
                        </p>
                      )}

                      <div className="mt-3.5 space-y-2">
                        {q.options.map((optText, optIndex) => {
                          const checked = selected.includes(optIndex);
                          const isKey = q.correctIndices.includes(optIndex);

                          let optionBorder =
                            'border-[#E2E8F0] bg-[#F8FAFD] text-[#0F1E33] hover:border-[#1769AA]/50 hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:hover:bg-[#1A3150]';
                          if (outcome) {
                            if (isKey) {
                              optionBorder = 'border-[#14532D] bg-[#E8F5EC] text-[#0F3F22] dark:border-[#16A34A] dark:bg-[#0D3322] dark:text-[#86EFAC]';
                            } else if (checked && !isKey) {
                              optionBorder = 'border-[#B91C1C] bg-[#FEE2E2] text-[#7F1D1D] dark:border-[#DC2626] dark:bg-[#3A1219] dark:text-[#FCA5A5]';
                            }
                          } else if (checked) {
                            optionBorder = 'border-[#1769AA] bg-[#EDF4FA] text-[#0B2E50] dark:border-[#60A5FA] dark:bg-[#1B3A61] dark:text-white';
                          }

                          return (
                            <label
                              key={optIndex}
                              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${optionBorder}`}
                            >
                              <input
                                type={isQ2 ? 'checkbox' : 'radio'}
                                name={`exam-q-${q.number}`}
                                checked={checked}
                                onChange={() =>
                                  isQ2
                                    ? handleToggleMultiQ2(optIndex)
                                    : handleSelectSingle(q.number, optIndex)
                                }
                                className="mt-0.5 h-4 w-4 shrink-0 accent-[#1769AA] cursor-pointer"
                              />
                              <span className="leading-snug">
                                <strong className="font-mono text-xs text-[#123D68] dark:text-[#93C5FD]">
                                  {OPTION_LETTERS[optIndex]})
                                </strong>{' '}
                                {optText}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {outcome && !outcome.isCorrect && (
                      <p className="mt-3 border-t border-[#E2E8F0] pt-2.5 text-xs font-medium text-[#14532D] dark:border-[#1E334D] dark:text-[#6EE7B7]">
                        {tExam.correctKeyPrefix}{' '}
                        {q.correctIndices.map((idx) => `${OPTION_LETTERS[idx]}) ${q.options[idx]}`).join(' & ')}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* Error & Action Controls */}
          {formError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs font-medium text-[#B91C1C]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-5 dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8] tabular-figures">
              {answeredCount} {tExam.answeredOf} ·{' '}
              <span className="font-mono text-[#0B2E50] dark:text-[#E7EFF8]">{formatDuration(elapsedSeconds)}</span>
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-4 py-2.5 text-sm font-medium text-[#0B2E50] transition-colors hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{tExam.resetBtn}</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#123D68] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0B2E50] disabled:opacity-60 dark:bg-[#1769AA] whitespace-nowrap cursor-pointer"
              >
                <Send className="h-4 w-4 text-[#F2B544]" aria-hidden="true" />
                <span>{submitting ? tExam.submittingBtn : tExam.submitBtn}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Instant Graded Scorecard, Central Save Confirmation & Full Review */}
        {gradedResult && (
          <div
            ref={resultRef}
            aria-live="polite"
            className="mt-10 overflow-hidden rounded-2xl border-2 border-[#123D68] bg-[#FFFFFF] shadow-lg dark:border-[#3B82F6] dark:bg-[#0D1B2D]"
          >
            <div className="border-b border-[#D4DFEB] bg-gradient-to-r from-[#0B2E50] to-[#1769AA] px-6 py-5 text-white dark:border-[#1E334D]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Award className="h-7 w-7 text-[#F2B544]" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-2xl font-medium">{tExam.resultHeading}</h3>
                    <p className="text-xs text-[#DCEAF7]">
                      {studentName} · {className} · {schoolName} ({district}, {sector})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-[#F2B544] px-4 py-2 text-xs font-semibold text-[#0B2E50] transition-colors hover:bg-[#E5A024] whitespace-nowrap cursor-pointer"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span>{tExam.printBtn}</span>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Top Metric Strip */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#D4DFEB] bg-[#F8FAFD] p-5 dark:border-[#1E334D] dark:bg-[#13253D] lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{tExam.scoreLabel}</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-[#123D68] dark:text-[#EAF1F8] tabular-figures">
                    {gradedResult.score} / {gradedResult.totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{tExam.accuracyLabel}</p>
                  <p
                    className={`mt-1 font-display text-3xl font-semibold tabular-figures ${
                      gradedResult.percentage >= 70 ? 'text-[#14532D] dark:text-[#6EE7B7]' : 'text-[#B45309] dark:text-[#FBBF24]'
                    }`}
                  >
                    {gradedResult.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{tExam.timeSpentLabel}</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[#0B2E50] dark:text-[#EAF1F8] tabular-figures">
                    {formatDuration(gradedResult.elapsedSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{tExam.refCodeLabel}</p>
                  <p className="mt-1 font-mono text-base font-semibold text-[#14532D] dark:text-[#6EE7B7]">
                    {gradedResult.referenceCode ?? 'LOCAL-ONLY'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#475569] dark:text-[#94A3B8]">{gradedResult.submittedAtLabel}</p>
                </div>
              </div>

              {gradedResult.savedToFirestore ? (
                <p className="mt-4 flex items-center gap-2 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-2.5 text-xs font-medium text-[#14532D]">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tExam.savedToOfficeNote}</span>
                </p>
              ) : (
                gradedResult.saveError && (
                  <p className="mt-4 flex items-center gap-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-2.5 text-xs font-medium text-[#92400E]">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{gradedResult.saveError}</span>
                  </p>
                )
              )}

              <p className="mt-3 text-xs text-[#475569] dark:text-[#94A3B8]">
                {gradedResult.unansweredNumbers.length === 0
                  ? tExam.allAnsweredNote
                  : `${tExam.unansweredListPrefix} ${gradedResult.unansweredNumbers.join(', ')}`}
              </p>

              {/* Topic Breakdown */}
              <div className="mt-6">
                <h4 className="text-xs font-semibold tracking-wider text-[#0B2E50] dark:text-[#EAF1F8] uppercase">
                  {tExam.topicBreakdownTitle}
                </h4>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {gradedResult.topicBreakdown.map((tb) => (
                    <div
                      key={tb.topic}
                      className="rounded-lg border border-[#D4DFEB] bg-[#F8FAFD] p-3.5 dark:border-[#1E334D] dark:bg-[#13253D]"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">
                        <span>{tb.topic}</span>
                        <span className="font-mono text-[#1769AA] dark:text-[#60A5FA] tabular-figures">
                          {tb.correct}/{tb.total} ({tb.percentage}%)
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-[#DCE6F2] dark:bg-[#0B1728]">
                        <div
                          className={`h-full rounded ${
                            tb.percentage >= 70 ? 'bg-[#14532D] dark:bg-[#34D399]' : 'bg-[#1769AA] dark:bg-[#60A5FA]'
                          }`}
                          style={{ width: `${tb.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact 50-Question Review Grid */}
              <div className="mt-7 border-t border-[#D4DFEB] pt-6 dark:border-[#1E334D]">
                <h4 className="text-xs font-semibold tracking-wider text-[#0B2E50] dark:text-[#EAF1F8] uppercase">
                  {tExam.answerReviewTitle}
                </h4>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {gradedResult.questionOutcomes.map((item) => {
                    const qObj = P6_SET_QUESTIONS[item.number - 1];
                    return (
                      <div
                        key={item.number}
                        className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                          item.isCorrect
                            ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#14532D]'
                            : 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-bold tabular-figures">
                            Q{item.number}:
                          </span>{' '}
                          <span className="font-semibold">
                            {item.isCorrect ? tExam.correctLabel : tExam.incorrectLabel}
                          </span>
                          <p className="mt-0.5 truncate text-[11px] opacity-85">
                            {item.correctIndices
                              .map((idx) => `${OPTION_LETTERS[idx]}) ${qObj.options[idx]}`)
                              .join(' & ')}
                          </p>
                        </div>
                        {item.isCorrect ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
