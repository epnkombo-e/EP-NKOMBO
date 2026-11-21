import { useMemo, useState, type FormEvent } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  FilePlus2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  LIBRARY_SUBJECTS,
  SCHOOL_CLASSES,
  type LibraryItemRecord,
  type LibraryItemType,
  type LibrarySubject,
  type QuizQuestionItem,
  type StoryChapter,
} from '../data/portalCatalog';
import { useSchoolData } from '../context/SchoolDataContext';
import { usePortalFeatures } from '../context/PortalFeaturesContext';
import {
  MAX_DIRECT_FILE_BYTES,
  MAX_ENCODED_DATA_LENGTH,
  formatFileSize,
  readFileAsDataUrl,
  triggerSchoolFileDownload,
  utf8ToBase64DataUrl,
} from '../lib/fileUtils';

const ITEM_TYPES: LibraryItemType[] = ['Book', 'Lesson Plan', 'Exam', 'Test', 'Storybook'];

export function SubjectLibrarySection() {
  const { user, isAdmin, signInWithGoogle } = useSchoolData();
  const {
    libraryItems,
    userProfile,
    saveLibraryItem,
    approveLibraryItem,
    rejectLibraryItem,
    deleteLibraryItem,
    submitOnlineTest,
  } = usePortalFeatures();

  const [subjectFilter, setSubjectFilter] = useState<'ALL' | LibrarySubject>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LibraryItemType>('ALL');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Storybook reader state
  const [activeStory, setActiveStory] = useState<LibraryItemRecord | null>(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  // Interactive online quiz modal state
  const [activeQuiz, setActiveQuiz] = useState<LibraryItemRecord | null>(null);
  const [quizStudentName, setQuizStudentName] = useState('');
  const [quizClassName, setQuizClassName] = useState('P6');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    percentage: number;
  } | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Upload / Create resource modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [upTitle, setUpTitle] = useState('');
  const [upType, setUpType] = useState<LibraryItemType>('Book');
  const [upSubject, setUpSubject] = useState<LibrarySubject>('IKINYARWANDA');
  const [upGrade, setUpGrade] = useState('Primary 5');
  const [upDesc, setUpDesc] = useState('');
  const [upMode, setUpMode] = useState<'file' | 'url' | 'storybook' | 'quiz'>('file');
  const [upFileName, setUpFileName] = useState('');
  const [upMime, setUpMime] = useState('text/plain');
  const [upSize, setUpSize] = useState(0);
  const [upFileData, setUpFileData] = useState('');
  const [upFileUrl, setUpFileUrl] = useState('');
  const [upChaptersText, setUpChaptersText] = useState(
    'Chapter 1: Morning on Lake Kivu\nWrite chapter text here...\n\nChapter 2: Teamwork at School\nWrite chapter text here...',
  );
  const [upQuizText, setUpQuizText] = useState(
    'What is 6 x 7? | 36 | 42 | 48 | 54 | 2\nWhich district is Nkombo Island in? | Rubavu | Karongi | Rusizi | Nyamasheke | 3',
  );
  const [upMsg, setUpMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [upBusy, setUpBusy] = useState(false);

  const visibleItems = useMemo(() => {
    return libraryItems.filter((item) => {
      if (!isAdmin && item.approvalStatus !== 'approved' && item.submittedByUid !== user?.uid) {
        return false;
      }
      if (subjectFilter !== 'ALL' && item.subject !== subjectFilter) return false;
      if (typeFilter !== 'ALL' && item.itemType !== typeFilter) return false;
      return true;
    });
  }, [libraryItems, isAdmin, user?.uid, subjectFilter, typeFilter]);

  const handleDownload = (item: LibraryItemRecord) => {
    const ok = triggerSchoolFileDownload({
      fileName: item.fileName,
      sourceType: item.sourceType === 'url' ? 'url' : 'upload',
      fileUrl: item.fileUrl,
      fileData:
        item.fileData ||
        (item.storyChapters
          ? utf8ToBase64DataUrl(
              'text/plain',
              item.storyChapters.map((c) => `${c.title}\n\n${c.body}`).join('\n\n---\n\n'),
            )
          : utf8ToBase64DataUrl('text/plain', `${item.title}\n\n${item.description}`)),
    });
    if (ok) {
      setDownloadedId(item.id);
      window.setTimeout(() => setDownloadedId((prev) => (prev === item.id ? null : prev)), 2000);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  const toggleReadAloud = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      stopSpeech();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const openQuizModal = (item: LibraryItemRecord) => {
    setActiveQuiz(item);
    setQuizStudentName(userProfile?.displayName || '');
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleQuizSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeQuiz?.quizQuestions?.length) return;
    const total = activeQuiz.quizQuestions.length;
    let score = 0;
    activeQuiz.quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) score += 1;
    });
    const percentage = Math.round((score / total) * 100);
    setQuizResult({ score, total, percentage });
    setQuizSubmitting(true);
    try {
      await submitOnlineTest({
        testId: activeQuiz.id,
        testTitle: activeQuiz.title,
        subject: activeQuiz.subject,
        studentName: quizStudentName.trim() || 'Student',
        className: quizClassName,
        score,
        totalQuestions: total,
        percentage,
      });
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_DIRECT_FILE_BYTES) {
      setUpMsg({
        type: 'err',
        text: 'Direct upload limit is 500 KB. Please choose a smaller PDF/Doc or switch to External Link mode.',
      });
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl.length > MAX_ENCODED_DATA_LENGTH) {
      setUpMsg({ type: 'err', text: 'File encoding too large. Please link via External URL.' });
      return;
    }
    setUpFileName(file.name);
    setUpMime(file.type || 'application/octet-stream');
    setUpSize(file.size);
    setUpFileData(dataUrl);
    setUpMsg(null);
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.emailVerified) {
      await signInWithGoogle();
      return;
    }
    setUpBusy(true);
    setUpMsg(null);
    try {
      let chapters: StoryChapter[] | undefined;
      let questions: QuizQuestionItem[] | undefined;
      let finalFileData = upFileData;
      let finalFileName = upFileName || `${upTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
      let finalSize = upSize || 512;

      if (upMode === 'storybook') {
        chapters = upChaptersText
          .split(/\n\s*\n/)
          .map((block, i) => {
            const lines = block.trim().split('\n');
            const title = lines[0] || `Chapter ${i + 1}`;
            const body = lines.slice(1).join('\n').trim() || title;
            return { title, body };
          })
          .filter((c) => c.body.length > 0);
        finalFileData = utf8ToBase64DataUrl(
          'text/plain',
          chapters.map((c) => `${c.title}\n${c.body}`).join('\n\n'),
        );
        finalSize = upChaptersText.length;
      } else if (upMode === 'quiz') {
        questions = upQuizText
          .split('\n')
          .map((line) => line.split('|').map((p) => p.trim()))
          .filter((parts) => parts.length >= 6)
          .map((parts) => ({
            question: parts[0],
            options: [parts[1], parts[2], parts[3], parts[4]],
            correctIndex: Math.max(0, Math.min(3, (Number(parts[5]) || 1) - 1)),
          }));
        if (questions.length === 0) {
          throw new Error('Add at least 1 quiz question formatted as: Question | A | B | C | D | Correct(1-4)');
        }
        finalFileName = `${upTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-quiz.txt`;
        finalSize = upQuizText.length;
      }

      await saveLibraryItem({
        title: upTitle,
        itemType: upMode === 'storybook' ? 'Storybook' : upMode === 'quiz' ? 'Test' : upType,
        subject: upSubject,
        gradeLevel: upGrade,
        description: upDesc,
        fileName: finalFileName,
        mimeType: upMime,
        sizeBytes: finalSize,
        sourceType:
          upMode === 'url'
            ? 'url'
            : upMode === 'storybook'
              ? 'storybook'
              : upMode === 'quiz'
                ? 'quiz'
                : 'upload',
        fileUrl: upMode === 'url' ? upFileUrl : undefined,
        fileData: upMode !== 'url' ? finalFileData : undefined,
        storyChapters: chapters,
        quizQuestions: questions,
      });

      setUpTitle('');
      setUpDesc('');
      setUpFileData('');
      setUpFileUrl('');
      setUpMsg({
        type: 'ok',
        text: isAdmin
          ? 'Published directly to the Subject Library!'
          : 'Submitted! Waiting for Owner (epnkombo@gmail.com) approval before public release.',
      });
    } catch (err) {
      setUpMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save library item.',
      });
    } finally {
      setUpBusy(false);
    }
  };

  return (
    <section
      id="library"
      className="border-b border-[#D4DFEB] bg-[#FFFFFF] py-16 dark:border-[#1E334D] dark:bg-[#0B1728] sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Top Heading + Teacher Upload Trigger */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] uppercase dark:text-[#60A5FA]">
              10-Subject Digital Library · Books · Lesson Plans · Tests · Storybooks
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-white sm:text-4xl [text-wrap:balance]">
              Curriculum Books, Storybooks & Interactive Subject Tests
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1] sm:text-base">
              Browse books, exams, tests, lesson plans, and read-along storybooks across all primary subjects. Teachers may submit new materials for Owner review and publication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setUpMsg(null);
                setUploadOpen(true);
              }}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#123D68] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0B2E50] dark:bg-[#1769AA] dark:hover:bg-[#1D7CC7] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FilePlus2 className="h-4 w-4 text-[#F2B544]" aria-hidden="true" />
              <span>
                {isAdmin
                  ? 'Upload Book / Test / Storybook'
                  : 'Teacher Upload (Owner Approval)'}
              </span>
            </button>
          </div>
        </div>

        {/* Subject Filter Tabs */}
        <div className="mt-8 flex flex-wrap gap-1.5 rounded-xl border border-[#D4DFEB] bg-[#F6F9FC] p-2 dark:border-[#1E334D] dark:bg-[#0D1F35]">
          <button
            type="button"
            onClick={() => setSubjectFilter('ALL')}
            className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              subjectFilter === 'ALL'
                ? 'bg-[#123D68] text-white dark:bg-[#1769AA]'
                : 'text-[#334155] hover:bg-white hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:bg-[#152B46]'
            }`}
          >
            All 10 Subjects
          </button>
          {LIBRARY_SUBJECTS.map((subj) => {
            const active = subjectFilter === subj.id;
            return (
              <button
                key={subj.id}
                type="button"
                onClick={() => setSubjectFilter(subj.id)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#123D68] text-white dark:bg-[#1769AA]'
                    : 'text-[#334155] hover:bg-white hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:bg-[#152B46]'
                }`}
              >
                {subj.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Type Sub-Filter */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">Resource Type:</span>
          {(['ALL', ...ITEM_TYPES] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`min-h-[32px] rounded-full border px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === t
                  ? 'border-[#14532D] bg-[#14532D] text-white'
                  : 'border-[#CBD8E6] bg-white text-[#334155] hover:border-[#123D68] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#CBD5E1]'
              }`}
            >
              {t === 'ALL' ? 'All Resources' : `${t}s`}
            </button>
          ))}
        </div>

        {/* Library Grid */}
        {visibleItems.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-[#CBD8E6] bg-[#F6F9FC] p-10 text-center dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <p className="text-sm font-medium text-[#0B2E50] dark:text-white">
              No resources match this subject and type filter yet.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubjectFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="mt-3 text-xs font-semibold text-[#1769AA] hover:underline dark:text-[#60A5FA] cursor-pointer"
            >
              Reset subject filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => {
              const isStory = Boolean(item.storyChapters && item.storyChapters.length > 0);
              const isQuiz = Boolean(item.quizQuestions && item.quizQuestions.length > 0);
              const isPending = item.approvalStatus === 'pending';

              return (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#F8FAFD] p-5 transition-colors hover:border-[#1769AA] dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:hover:border-[#60A5FA]"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                        {item.subject} · {item.itemType.toUpperCase()}
                      </span>
                      <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">
                        {item.gradeLevel}
                      </span>
                    </div>

                    {item.approvalStatus !== 'approved' && (
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#92400E] dark:text-[#FCD34D]">
                        <Clock className="h-3 w-3" />
                        <span>
                          {isPending
                            ? 'Pending Owner Approval'
                            : 'Needs Revision (Rejected)'}
                        </span>
                      </p>
                    )}

                    <h3 className="mt-2 font-display text-lg font-medium text-[#0B2E50] dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#475569] dark:text-[#CBD5E1]">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-[#E2E8F0] pt-3.5 dark:border-[#1E334D]">
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      <span>By {item.submittedByName}</span>
                      <span className="font-mono tabular-figures">
                        {formatFileSize(item.sizeBytes)} · {item.displayDate}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isStory && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStory(item);
                            setChapterIndex(0);
                          }}
                          className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0F3F22] whitespace-nowrap cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Read Storybook</span>
                        </button>
                      )}

                      {isQuiz && (
                        <button
                          type="button"
                          onClick={() => openQuizModal(item)}
                          className="inline-flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1769AA] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#123D68] whitespace-nowrap cursor-pointer"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          <span>Take Online Test ({item.quizQuestions?.length} Q)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border border-[#CBD8E6] bg-white px-3 py-1.5 text-xs font-medium text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:hover:bg-[#1A3150] whitespace-nowrap cursor-pointer"
                      >
                        {item.sourceType === 'url' ? (
                          <>
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Open</span>
                          </>
                        ) : downloadedId === item.id ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#14532D]" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Owner Moderation Controls */}
                    {isAdmin && isPending && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => void approveLibraryItem(item.id)}
                          className="flex-1 rounded-md bg-[#14532D] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#0F3F22] cursor-pointer"
                        >
                          Approve & Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => void rejectLibraryItem(item.id)}
                          className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1.5 text-[11px] font-semibold text-[#B91C1C] cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {(isAdmin || (user?.uid === item.submittedByUid && item.approvalStatus !== 'approved')) && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => void deleteLibraryItem(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B91C1C] hover:underline dark:text-[#FCA5A5] cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* STORYBOOK READER MODAL */}
      {activeStory && activeStory.storyChapters && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/75 p-4 backdrop-blur-xs"
          onClick={() => {
            stopSpeech();
            setActiveStory(null);
          }}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#CBD8E6] bg-[#FFFDF8] text-[#0F1E33] shadow-2xl dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:text-[#E7EFF8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5DFD3] px-6 py-4 dark:border-[#1E334D]">
              <div>
                <p className="font-mono text-[11px] font-semibold text-[#14532D] dark:text-[#86EFAC]">
                  {activeStory.subject} STORYBOOK · PAGE {chapterIndex + 1} OF{' '}
                  {activeStory.storyChapters.length}
                </p>
                <h3 className="font-display text-lg font-medium">{activeStory.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ch = activeStory.storyChapters![chapterIndex];
                    toggleReadAloud(`${ch.title}. ${ch.body}`);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#CBD8E6] bg-white px-3 text-xs font-medium text-[#123D68] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#93C5FD] cursor-pointer"
                >
                  {speaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  <span>{speaking ? 'Stop Voice' : 'Listen'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopSpeech();
                    setActiveStory(null);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#CBD8E6] bg-white dark:border-[#1E334D] dark:bg-[#13253D] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <h4 className="font-display text-2xl font-medium text-[#0B2E50] dark:text-white">
                {activeStory.storyChapters[chapterIndex]?.title}
              </h4>
              <p className="mt-4 font-serif text-lg leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                {activeStory.storyChapters[chapterIndex]?.body}
              </p>

              <div className="mt-8 flex items-center justify-between border-t border-[#E5DFD3] pt-4 dark:border-[#1E334D]">
                <button
                  type="button"
                  disabled={chapterIndex === 0}
                  onClick={() => {
                    stopSpeech();
                    setChapterIndex((i) => Math.max(0, i - 1));
                  }}
                  className="rounded-full border border-[#CBD8E6] px-4 py-2 text-xs font-medium disabled:opacity-40 dark:border-[#1E334D] cursor-pointer"
                >
                  Previous Page
                </button>
                <button
                  type="button"
                  disabled={chapterIndex >= activeStory.storyChapters.length - 1}
                  onClick={() => {
                    stopSpeech();
                    setChapterIndex((i) =>
                      Math.min(activeStory.storyChapters!.length - 1, i + 1),
                    );
                  }}
                  className="rounded-full bg-[#123D68] px-5 py-2 text-xs font-medium text-white disabled:opacity-40 cursor-pointer"
                >
                  Next Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE ONLINE SUBJECT TEST MODAL */}
      {activeQuiz && activeQuiz.quizQuestions && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/75 p-4 backdrop-blur-xs"
          onClick={() => setActiveQuiz(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#CBD8E6] bg-white text-[#0F1E33] shadow-2xl dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:text-[#E7EFF8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D4DFEB] px-6 py-4 dark:border-[#1E334D]">
              <div>
                <p className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                  {activeQuiz.subject} ONLINE TEST · INSTANT MARKING
                </p>
                <h3 className="font-display text-lg font-medium">{activeQuiz.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuiz(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#CBD8E6] dark:border-[#1E334D] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuizSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={quizStudentName}
                    onChange={(e) => setQuizStudentName(e.target.value)}
                    placeholder="e.g. Aline Uwase"
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    Class
                  </label>
                  <select
                    value={quizClassName}
                    onChange={(e) => setQuizClassName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    {SCHOOL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {quizResult && (
                <div className="rounded-xl border border-[#14532D] bg-[#F0FDF4] p-4 dark:bg-[#052E16]/60">
                  <p className="text-xs font-semibold tracking-wider text-[#14532D] uppercase dark:text-[#86EFAC]">
                    Your Submitted Marks
                  </p>
                  <p className="mt-1 font-mono text-3xl font-bold text-[#0B2E50] dark:text-white tabular-figures">
                    {quizResult.score} / {quizResult.total} ({quizResult.percentage}%)
                  </p>
                  <p className="mt-1 text-xs text-[#334155] dark:text-[#CBD5E1]">
                    {quizResult.percentage >= 80
                      ? 'Excellent Mastery! Result recorded for teacher review.'
                      : quizResult.percentage >= 50
                        ? 'Pass! Review the marked answers below to reach distinction.'
                        : 'Keep practicing! Check the correct answers highlighted below.'}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {activeQuiz.quizQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="rounded-xl border border-[#D4DFEB] bg-[#F8FAFD] p-4 dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    <p className="text-sm font-medium">
                      <span className="mr-2 font-mono text-xs text-[#1769AA] dark:text-[#60A5FA]">
                        Q{qIdx + 1}.
                      </span>
                      {q.question}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {q.options.map((opt, optIdx) => {
                        const selected = quizAnswers[qIdx] === optIdx;
                        const showCorrect = quizResult !== null && optIdx === q.correctIndex;
                        const showWrong =
                          quizResult !== null && selected && optIdx !== q.correctIndex;

                        return (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer ${
                              showCorrect
                                ? 'border-[#16A34A] bg-[#DCFCE7] font-semibold text-[#14532D]'
                                : showWrong
                                  ? 'border-[#DC2626] bg-[#FEE2E2] text-[#991B1B]'
                                  : selected
                                    ? 'border-[#1769AA] bg-[#EDF4FA] dark:bg-[#13253D]'
                                    : 'border-[#CBD8E6] bg-white dark:border-[#1E334D] dark:bg-[#0D1B2D]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${qIdx}`}
                              disabled={quizResult !== null}
                              checked={selected}
                              onChange={() =>
                                setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
                              }
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-[#D4DFEB] pt-4 dark:border-[#1E334D]">
                {quizResult ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizResult(null);
                    }}
                    className="rounded-full border border-[#CBD8E6] px-5 py-2 text-xs font-semibold dark:border-[#1E334D] cursor-pointer"
                  >
                    Retake Test
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={quizSubmitting}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#14532D] px-6 py-2 text-sm font-semibold text-white hover:bg-[#0F3F22] disabled:opacity-60 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{quizSubmitting ? 'Grading...' : 'Submit Answers & View Marks'}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER / OWNER UPLOAD & CREATE RESOURCE MODAL */}
      {uploadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/75 p-4 backdrop-blur-xs"
          onClick={() => setUploadOpen(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#CBD8E6] bg-white text-[#0F1E33] shadow-2xl dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:text-[#E7EFF8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D4DFEB] px-6 py-4 dark:border-[#1E334D]">
              <div>
                <p className="text-[11px] font-semibold text-[#1769AA] uppercase dark:text-[#60A5FA]">
                  {isAdmin ? 'Owner Direct Publish' : 'Teacher Upload (Owner Approval Workflow)'}
                </p>
                <h3 className="font-display text-lg font-medium">
                  Upload Book, Exam, Test, Lesson Plan, or Storybook
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#CBD8E6] dark:border-[#1E334D] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
              {!user && (
                <div className="rounded-xl border border-[#F2B544] bg-[#FEF9E7] p-4 text-xs text-[#78350F]">
                  Please sign in with Google to upload classroom resources or lesson plans.
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="ml-3 rounded-full bg-[#123D68] px-3 py-1 font-semibold text-white cursor-pointer"
                  >
                    Sign In Now
                  </button>
                </div>
              )}

              {upMsg && (
                <div
                  className={`rounded-lg border p-3 text-xs font-medium ${
                    upMsg.type === 'ok'
                      ? 'border-[#16A34A] bg-[#F0FDF4] text-[#14532D]'
                      : 'border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C]'
                  }`}
                >
                  {upMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Title</label>
                  <input
                    type="text"
                    required
                    value={upTitle}
                    onChange={(e) => setUpTitle(e.target.value)}
                    placeholder="e.g. P4 Mathematics End-of-Term Test"
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Subject</label>
                  <select
                    value={upSubject}
                    onChange={(e) => setUpSubject(e.target.value as LibrarySubject)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    {LIBRARY_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium">Resource Type</label>
                  <select
                    value={upType}
                    onChange={(e) => setUpType(e.target.value as LibraryItemType)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    {ITEM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium">Class / Grade Level</label>
                  <input
                    type="text"
                    required
                    value={upGrade}
                    onChange={(e) => setUpGrade(e.target.value)}
                    placeholder="e.g. Primary 5"
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium">Description</label>
                <textarea
                  rows={2}
                  required
                  value={upDesc}
                  onChange={(e) => setUpDesc(e.target.value)}
                  placeholder="Describe what learners or teachers will find in this resource..."
                  className="mt-1 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] p-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                />
              </div>

              <div>
                <p className="text-xs font-medium">Creation / Upload Format</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { id: 'file', label: 'Upload File (<=500KB)' },
                    { id: 'url', label: 'External Link / Google Drive' },
                    { id: 'storybook', label: 'Write Storybook Chapters' },
                    { id: 'quiz', label: 'Build Online Test Questions' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setUpMode(m.id as typeof upMode)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer ${
                        upMode === m.id
                          ? 'bg-[#123D68] text-white'
                          : 'border border-[#CBD8E6] bg-[#F6F9FC] dark:border-[#1E334D] dark:bg-[#0A1626]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {upMode === 'file' && (
                <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD8E6] bg-[#F6F9FC] p-5 text-center dark:border-[#1E334D] dark:bg-[#0A1626] cursor-pointer">
                  <Upload className="h-6 w-6 text-[#1769AA]" />
                  <span className="mt-2 text-xs font-semibold">
                    {upFileName ? `${upFileName} (${formatFileSize(upSize)})` : 'Choose PDF, Word, CSV, or Text File'}
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => void handleFileSelect(e.target.files?.[0])}
                  />
                </label>
              )}

              {upMode === 'url' && (
                <input
                  type="url"
                  required
                  value={upFileUrl}
                  onChange={(e) => setUpFileUrl(e.target.value)}
                  placeholder="https://elearning.reb.rw/..."
                  className="h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                />
              )}

              {upMode === 'storybook' && (
                <div>
                  <label className="block text-xs font-medium">
                    Story Chapters (separate chapters with a blank line)
                  </label>
                  <textarea
                    rows={5}
                    value={upChaptersText}
                    onChange={(e) => setUpChaptersText(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] p-3 font-mono text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
              )}

              {upMode === 'quiz' && (
                <div>
                  <label className="block text-xs font-medium">
                    Questions (1 per line: Question | Opt1 | Opt2 | Opt3 | Opt4 | CorrectOption 1-4)
                  </label>
                  <textarea
                    rows={5}
                    value={upQuizText}
                    onChange={(e) => setUpQuizText(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] p-3 font-mono text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-[#D4DFEB] pt-4 dark:border-[#1E334D]">
                <button
                  type="submit"
                  disabled={upBusy}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#123D68] px-6 py-2 text-xs font-semibold text-white hover:bg-[#0B2E50] disabled:opacity-60 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {upBusy
                      ? 'Submitting...'
                      : isAdmin
                        ? 'Publish Now'
                        : 'Submit for Owner Approval'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
