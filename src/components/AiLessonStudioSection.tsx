import { useState, type FormEvent } from 'react';
import {
  BookMarked,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Save,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  LIBRARY_SUBJECTS,
  RWANDA_EDUCATION_LINKS,
  SCHOOL_CLASSES,
  type LibrarySubject,
} from '../data/portalCatalog';
import { useSchoolData } from '../context/SchoolDataContext';
import { usePortalFeatures } from '../context/PortalFeaturesContext';
import { utf8ToBase64DataUrl } from '../lib/fileUtils';

interface GroundingLink {
  title: string;
  uri: string;
}

export function AiLessonStudioSection() {
  const { settings, isAdmin, user, saveSchoolSettings, signInWithGoogle } = useSchoolData();
  const { saveLibraryItem } = usePortalFeatures();

  const [activeTab, setActiveTab] = useState<'reb-search' | 'lesson-trainer'>('reb-search');

  // 1. REB & NESA Web Search Assistant state
  const [question, setQuestion] = useState('');
  const [searchSubject, setSearchSubject] = useState('All Primary Subjects');
  const [searchGrade, setSearchGrade] = useState('Primary 6 (PLE)');
  const [searchLang, setSearchLang] = useState('English');
  const [searchAnswer, setSearchAnswer] = useState('');
  const [searchSources, setSearchSources] = useState<GroundingLink[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  // 2. Trainable Lesson Plan Studio state
  const [trainerNotes, setTrainerNotes] = useState(settings.aiLessonTrainerNotes || '');
  const [lpSubject, setLpSubject] = useState<LibrarySubject>('MATHEMATICS');
  const [lpGrade, setLpGrade] = useState('P5');
  const [lpTopic, setLpTopic] = useState('');
  const [lpDuration, setLpDuration] = useState(40);
  const [lpLanguage, setLpLanguage] = useState('English');
  const [lpWebGrounding, setLpWebGrounding] = useState(true);
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [planSources, setPlanSources] = useState<GroundingLink[]>([]);
  const [planBusy, setPlanBusy] = useState(false);
  const [planStatus, setPlanStatus] = useState('');

  const handleRebSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSearchBusy(true);
    setSearchErr('');
    try {
      const resp = await fetch('/api/ai/reb-nesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          subject: searchSubject,
          gradeLevel: searchGrade,
          language: searchLang,
        }),
      });
      const data = (await resp.json()) as {
        answer?: string;
        sources?: GroundingLink[];
        error?: string;
      };
      if (!resp.ok) throw new Error(data.error || 'AI Assistant could not respond.');
      setSearchAnswer(data.answer || '');
      setSearchSources(data.sources || []);
    } catch (err) {
      setSearchErr(err instanceof Error ? err.message : 'Network error calling AI assistant.');
    } finally {
      setSearchBusy(false);
    }
  };

  const handleGenerateLessonPlan = async (e: FormEvent) => {
    e.preventDefault();
    if (!lpTopic.trim()) return;
    setPlanBusy(true);
    setPlanStatus('');
    try {
      const resp = await fetch('/api/ai/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: lpSubject,
          gradeLevel: lpGrade,
          topic: lpTopic,
          durationMinutes: lpDuration,
          language: lpLanguage,
          trainerNotes: trainerNotes || settings.aiLessonTrainerNotes,
          useWebGrounding: lpWebGrounding,
        }),
      });
      const data = (await resp.json()) as {
        lessonPlan?: string;
        sources?: GroundingLink[];
        error?: string;
      };
      if (!resp.ok) throw new Error(data.error || 'Unable to generate lesson plan.');
      setGeneratedPlan(data.lessonPlan || '');
      setPlanSources(data.sources || []);
    } catch (err) {
      setPlanStatus(err instanceof Error ? err.message : 'Lesson plan error.');
    } finally {
      setPlanBusy(false);
    }
  };

  const handleSaveTrainerRules = async () => {
    if (!isAdmin) {
      setPlanStatus('Only the School Owner can permanently save default school-wide training rules. Your notes still apply live to your generated lesson plans!');
      return;
    }
    try {
      await saveSchoolSettings({
        ...settings,
        aiLessonTrainerNotes: trainerNotes,
      });
      setPlanStatus('Saved school-wide AI lesson training style for all EP Saint Pierre Nkombo teachers.');
    } catch (err) {
      setPlanStatus(err instanceof Error ? err.message : 'Unable to save training rules.');
    }
  };

  const handlePublishLessonPlanToLibrary = async () => {
    if (!generatedPlan) return;
    if (!user?.emailVerified) {
      await signInWithGoogle();
      return;
    }
    try {
      await saveLibraryItem({
        title: `${lpGrade} ${lpSubject}: ${lpTopic}`,
        itemType: 'Lesson Plan',
        subject: lpSubject,
        gradeLevel: lpGrade,
        description: `AI-trained Rwanda CBC lesson plan (${lpDuration} min, ${lpLanguage}) generated for EP Saint Pierre Nkombo.`,
        fileName: `${lpGrade}-${lpSubject}-${lpTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`,
        mimeType: 'text/plain',
        sizeBytes: generatedPlan.length,
        sourceType: 'ai_generated',
        fileData: utf8ToBase64DataUrl('text/plain', generatedPlan),
      });
      setPlanStatus(
        isAdmin
          ? 'Lesson plan published directly to the Subject Library!'
          : 'Lesson plan submitted to Subject Library for Owner approval!',
      );
    } catch (err) {
      setPlanStatus(err instanceof Error ? err.message : 'Unable to save lesson plan.');
    }
  };

  const downloadLessonPlanTxt = () => {
    if (!generatedPlan) return;
    const blob = new Blob([generatedPlan], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lesson-Plan-${lpGrade}-${lpSubject}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="ai-studio"
      className="border-b border-[#D4DFEB] bg-[#EDF4FA]/45 py-16 dark:border-[#1E334D] dark:bg-[#081322] sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] uppercase dark:text-[#60A5FA]">
              Smart Rwanda Education AI · REB & NESA Web Access · Trainable Lesson Planner
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-white sm:text-4xl [text-wrap:balance]">
              REB / NESA AI Teaching Assistant & CBC Lesson Plan Trainer
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1] sm:text-base">
              Query official REB, NESA, and Karame Beruro curriculum materials using live web grounding, or train the AI with EP Saint Pierre Nkombo teaching rules to craft ready-to-teach CBC lesson plans.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#CBD8E6] bg-white p-1.5 dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <button
              type="button"
              onClick={() => setActiveTab('reb-search')}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'reb-search'
                  ? 'bg-[#123D68] text-white dark:bg-[#1769AA]'
                  : 'text-[#475569] hover:text-[#0B2E50] dark:text-[#94A3B8] dark:hover:text-white'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>REB & NESA Web Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lesson-trainer')}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'lesson-trainer'
                  ? 'bg-[#14532D] text-white'
                  : 'text-[#475569] hover:text-[#0B2E50] dark:text-[#94A3B8] dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Lesson Plan Trainer</span>
            </button>
          </div>
        </div>

        {/* PANEL 1: REB & NESA WEB GROUNDED ASSISTANT */}
        {activeTab === 'reb-search' && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form
              onSubmit={handleRebSearch}
              className="space-y-4 rounded-2xl border border-[#D4DFEB] bg-white p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D] lg:col-span-5"
            >
              <h3 className="font-display text-xl font-medium text-[#0B2E50] dark:text-white">
                Search REB & NESA Curriculum Resources
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    Subject
                  </label>
                  <select
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    <option value="All Primary Subjects">All Primary Subjects</option>
                    {LIBRARY_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.label}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    value={searchGrade}
                    onChange={(e) => setSearchGrade(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                  Response Language
                </label>
                <select
                  value={searchLang}
                  onChange={(e) => setSearchLang(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                >
                  <option value="English">English</option>
                  <option value="Ikinyarwanda">Ikinyarwanda</option>
                  <option value="French">Français (French)</option>
                  <option value="Kiswahili">Kiswahili</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                  Ask about REB syllabus, NESA P6 exam structure, CAMIS or teaching notes
                </label>
                <textarea
                  rows={4}
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What are the key REB P6 Science & Elementary Technology competencies tested by NESA, and what practical activities fit Lake Kivu schools?"
                  className="mt-1 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] p-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                />
              </div>

              <button
                type="submit"
                disabled={searchBusy}
                className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-[#123D68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2E50] disabled:opacity-60 dark:bg-[#1769AA] cursor-pointer"
              >
                <Search className="h-4 w-4 text-[#F2B544]" />
                <span>{searchBusy ? 'Searching REB & NESA Web...' : 'Search REB & NESA Resources'}</span>
              </button>
            </form>

            <div className="flex flex-col justify-between rounded-2xl border border-[#D4DFEB] bg-white p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D] lg:col-span-7">
              {searchErr && (
                <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-xs font-medium text-[#B91C1C]">
                  {searchErr}
                </div>
              )}

              {!searchAnswer ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <BookMarked className="h-9 w-9 text-[#1769AA] dark:text-[#60A5FA]" />
                  <p className="mt-3 font-display text-lg font-medium text-[#0B2E50] dark:text-white">
                    Live REB & NESA Knowledge Response
                  </p>
                  <p className="mt-1 max-w-md text-xs text-[#475569] dark:text-[#94A3B8]">
                    Responses include direct grounded links to official Rwandan education portals (REB, NESA, eLearning, CAMIS) whenever available.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[
                      'REB P5 Mathematics Unit 4 fractions objectives',
                      'NESA P6 PLE timetable & exam preparation tips',
                      'Karame Beruro Kinyarwanda reading fluency techniques',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQuestion(preset)}
                        className="rounded-full border border-[#CBD8E6] bg-[#F6F9FC] px-3 py-1.5 text-[11px] font-medium text-[#123D68] hover:border-[#1769AA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#93C5FD] cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#1E334D]">
                    <span className="text-xs font-semibold text-[#14532D] uppercase dark:text-[#86EFAC]">
                      Grounded Curriculum Guidance
                    </span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(searchAnswer)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#1769AA] hover:underline dark:text-[#60A5FA] cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Answer</span>
                    </button>
                  </div>

                  <div className="max-h-[380px] space-y-2 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[#1E293B] dark:text-[#E2E8F0]">
                    {searchAnswer}
                  </div>

                  {searchSources.length > 0 && (
                    <div className="border-t border-[#E2E8F0] pt-3 dark:border-[#1E334D]">
                      <p className="text-[11px] font-semibold text-[#475569] uppercase dark:text-[#94A3B8]">
                        Verified Web Sources
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {searchSources.map((src) => (
                          <a
                            key={src.uri}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-[#CBD8E6] bg-[#F6F9FC] px-3 py-1 text-[11px] font-medium text-[#123D68] hover:border-[#1769AA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#93C5FD]"
                          >
                            <span className="max-w-[200px] truncate">{src.title}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: TRAINABLE AI LESSON PLAN STUDIO */}
        {activeTab === 'lesson-trainer' && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form
              onSubmit={handleGenerateLessonPlan}
              className="space-y-4 rounded-2xl border border-[#D4DFEB] bg-white p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D] lg:col-span-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-medium text-[#0B2E50] dark:text-white">
                  Train & Generate CBC Lesson Plan
                </h3>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#14532D] dark:text-[#86EFAC]">
                    Train AI Teaching Style & Nkombo Rules
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => void handleSaveTrainerRules()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1769AA] hover:underline dark:text-[#60A5FA] cursor-pointer"
                    >
                      <Save className="h-3 w-3" />
                      <span>Save Default Rules</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={trainerNotes}
                  onChange={(e) => setTrainerNotes(e.target.value)}
                  placeholder="Train the AI: e.g. Always start with a 5-minute Lake Kivu warm-up, include pair work, and end with 4 formative check questions..."
                  className="mt-1 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] p-2.5 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">Subject</label>
                  <select
                    value={lpSubject}
                    onChange={(e) => setLpSubject(e.target.value as LibrarySubject)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    {LIBRARY_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium">Class</label>
                  <select
                    value={lpGrade}
                    onChange={(e) => setLpGrade(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    {SCHOOL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium">Lesson Topic / Unit Name</label>
                <input
                  type="text"
                  required
                  value={lpTopic}
                  onChange={(e) => setLpTopic(e.target.value)}
                  placeholder="e.g. Clean Water Filtration / Multiplication of Fractions"
                  className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={20}
                    max={120}
                    value={lpDuration}
                    onChange={(e) => setLpDuration(Number(e.target.value) || 40)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Language</label>
                  <select
                    value={lpLanguage}
                    onChange={(e) => setLpLanguage(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    <option value="English">English</option>
                    <option value="Ikinyarwanda">Ikinyarwanda</option>
                    <option value="French">Français (French)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#CBD5E1] cursor-pointer">
                <input
                  type="checkbox"
                  checked={lpWebGrounding}
                  onChange={(e) => setLpWebGrounding(e.target.checked)}
                />
                <span>Check live REB / NESA curriculum standards via Google Search</span>
              </label>

              <button
                type="submit"
                disabled={planBusy}
                className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[#F2B544]" />
                <span>{planBusy ? 'Generating Trained Lesson Plan...' : 'Generate CBC Lesson Plan'}</span>
              </button>
            </form>

            <div className="flex flex-col justify-between rounded-2xl border border-[#D4DFEB] bg-white p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D] lg:col-span-7">
              {planStatus && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-2.5 text-xs font-medium text-[#14532D]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{planStatus}</span>
                </div>
              )}

              {!generatedPlan ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-9 w-9 text-[#14532D] dark:text-[#86EFAC]" />
                  <p className="mt-3 font-display text-lg font-medium">
                    Ready-to-Teach Rwanda CBC Lesson Plan Output
                  </p>
                  <p className="mt-1 max-w-md text-xs text-[#475569] dark:text-[#94A3B8]">
                    Includes competences, cross-cutting issues, timed teacher & learner steps, and formative questions — ready to download or save to the School Library.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3 dark:border-[#1E334D]">
                    <span className="text-xs font-semibold text-[#14532D] uppercase dark:text-[#86EFAC]">
                      {lpGrade} · {lpSubject} Lesson Plan
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={downloadLessonPlanTxt}
                        className="inline-flex items-center gap-1 rounded-full border border-[#CBD8E6] px-3 py-1 text-xs font-medium hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:hover:bg-[#13253D] cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download .txt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handlePublishLessonPlanToLibrary()}
                        className="inline-flex items-center gap-1 rounded-full bg-[#123D68] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#0B2E50] cursor-pointer"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{isAdmin ? 'Save to Library' : 'Submit for Owner Approval'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg bg-[#F6F9FC] p-4 font-sans text-xs leading-relaxed text-[#0F1E33] dark:bg-[#0A1626] dark:text-[#E2E8F0]">
                    {generatedPlan}
                  </div>

                  {planSources.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {planSources.map((src) => (
                        <a
                          key={src.uri}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-[#CBD8E6] px-2.5 py-1 text-[11px] text-[#1769AA] dark:border-[#1E334D] dark:text-[#60A5FA]"
                        >
                          <span className="max-w-[180px] truncate">{src.title}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RWANDA EDUCATION OFFICIAL PORTAL LINKS HUB */}
        <div className="mt-12 rounded-2xl border border-[#CBD8E6] bg-white p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#1769AA] uppercase dark:text-[#60A5FA]">
                Connected National Education Updates
              </p>
              <h3 className="mt-1 font-display text-xl font-medium text-[#0B2E50] dark:text-white">
                Rwanda Education Portals: KARAME BERURO, CAMIS, REB eLearning & NESA
              </h3>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RWANDA_EDUCATION_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#F6F9FC] p-4 transition-colors hover:border-[#1769AA] hover:bg-white dark:border-[#1E334D] dark:bg-[#0A1626] dark:hover:border-[#60A5FA]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold tracking-wide text-[#14532D] uppercase dark:text-[#86EFAC]">
                      {link.badge}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-[#1769AA] transition-transform group-hover:translate-x-0.5 dark:text-[#60A5FA]" />
                  </div>
                  <h4 className="mt-1.5 font-display text-base font-semibold text-[#0B2E50] dark:text-white">
                    {link.name}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                    {link.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
