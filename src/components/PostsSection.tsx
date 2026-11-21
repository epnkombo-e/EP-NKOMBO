import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, PlayCircle, Plus, Send, Upload, X } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { PostCategory, SchoolPost } from '../data/schoolData';
import { compressImageToDataUrl } from '../lib/fileUtils';
import { isSafeMediaUrl, parseVideoSource } from '../lib/videoEmbed';
import { ResilientImage } from './ResilientImage';

type PostFilter = 'All Updates' | PostCategory;

const POST_FILTERS: PostFilter[] = [
  'All Updates',
  'Announcements',
  'Academics',
  'Community & Events',
  'Achievements',
];

const POST_CATEGORIES: PostCategory[] = [
  'Announcements',
  'Academics',
  'Community & Events',
  'Achievements',
];

interface PostsSectionProps {
  onNewPostClick: () => void;
}

export function PostsSection({ onNewPostClick }: PostsSectionProps) {
  const { posts, user, isAdmin, savePost } = useSchoolData();
  const { t, localizeCategory } = useLanguage();
  const [filter, setFilter] = useState<PostFilter>('All Updates');
  const [activePost, setActivePost] = useState<SchoolPost | null>(null);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<PostCategory>('Academics');
  const [formSummary, setFormSummary] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');

  useEffect(() => {
    if (!activePost && !submitOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePost(null);
        setSubmitOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePost, submitOpen]);

  const visiblePosts = useMemo(() => {
    const base = isAdmin
      ? posts
      : posts.filter(
          (p) => p.published || (user?.uid && p.submittedByUid === user.uid),
        );
    if (filter === 'All Updates') return base;
    return base.filter((p) => p.category === filter);
  }, [posts, isAdmin, user?.uid, filter]);

  const leadPost = visiblePosts[0] ?? null;
  const secondaryPosts = visiblePosts.slice(1);
  const activeVideo = activePost ? parseVideoSource(activePost.videoUrl) : null;

  const canTeacherSubmit = Boolean(user?.emailVerified && !isAdmin);

  const handleTeacherPostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (formTitle.trim().length < 4 || formSummary.trim().length < 10 || formBody.trim().length < 15) {
      setSubmitError('Please fill in Title, Summary, and Article Body before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await savePost({
        title: formTitle.trim(),
        category: formCategory,
        summary: formSummary.trim(),
        body: formBody.trim(),
        authorName: formAuthor.trim() || user?.displayName || user?.email || 'Teacher',
        published: false,
        pinned: false,
        imageUrl: formImageUrl.trim() || undefined,
        videoUrl: formVideoUrl.trim() || undefined,
      });
      setSubmitSuccess('Submitted! Your post is now waiting for Owner approval.');
      setFormTitle('');
      setFormSummary('');
      setFormBody('');
      setFormImageUrl('');
      setFormVideoUrl('');
      window.setTimeout(() => {
        setSubmitOpen(false);
        setSubmitSuccess(null);
      }, 1400);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="updates"
      className="border-b border-[#D4DFEB] bg-[#EDF4FA]/35 py-16 dark:border-[#1E334D] dark:bg-[#0B1728]/70 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Header & Filter Controls */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] dark:text-[#60A5FA] uppercase">
              {t.posts.kicker}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] sm:text-4xl [text-wrap:balance]">
              {t.posts.heading}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={onNewPostClick}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#123D68] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0B2E50] dark:bg-[#1769AA] dark:hover:bg-[#125387] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.posts.publishNew}</span>
              </button>
            )}

            {canTeacherSubmit && (
              <button
                type="button"
                onClick={() => {
                  setFormAuthor(user?.displayName || user?.email?.split('@')[0] || '');
                  setSubmitError(null);
                  setSubmitSuccess(null);
                  setSubmitOpen(true);
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[#1769AA] bg-white px-3.5 py-2 text-xs font-semibold text-[#123D68] transition-colors hover:bg-[#EDF4FA] dark:border-[#3B82F6] dark:bg-[#13253D] dark:text-[#93C5FD] dark:hover:bg-[#1A3150] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Submit Post (Owner Approval)</span>
              </button>
            )}

            <div
              role="tablist"
              aria-label="Filter school posts"
              className="flex flex-wrap gap-1.5 rounded-lg border border-[#D4DFEB] bg-[#FFFFFF] p-1.5 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
            >
              {POST_FILTERS.map((cat) => {
                const isSelected = filter === cat;
                const label = cat === 'All Updates' ? t.posts.filters.all : localizeCategory(cat);
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => setFilter(cat)}
                    className={`min-h-[40px] rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                      isSelected
                        ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                        : 'text-[#475569] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {visiblePosts.length === 0 ? (
          <div className="mt-10 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-10 text-center dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <p className="text-sm font-medium text-[#0B2E50] dark:text-[#EAF1F8]">{t.posts.emptyTitle}</p>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">{t.posts.emptyHint}</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Lead Story */}
            {leadPost && (
              <button
                type="button"
                onClick={() => setActivePost(leadPost)}
                className="group flex flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-5 text-left transition-colors duration-150 hover:border-[#1769AA]/50 dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:hover:border-[#60A5FA]/50 lg:col-span-7 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
              >
                <div>
                  {leadPost.imageUrl && isSafeMediaUrl(leadPost.imageUrl) && (
                    <div className="mb-5 aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#EDF4FA] dark:bg-[#13253D]">
                      <ResilientImage
                        src={leadPost.imageUrl}
                        alt={leadPost.title}
                        fallbackTitle={leadPost.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                    <span className="font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                      {localizeCategory(leadPost.category)}
                    </span>
                    {leadPost.pinned && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#9A5B00] dark:text-[#F2B544]">{t.posts.pinned}</span>
                      </>
                    )}
                    {!leadPost.published && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#B45309] dark:text-[#FBBF24]">
                          {leadPost.approvalStatus === 'pending'
                            ? 'Pending Owner Approval'
                            : leadPost.approvalStatus === 'rejected'
                              ? 'Returned by Owner'
                              : t.posts.draftOwnerOnly}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-figures">{leadPost.displayDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t.posts.byPrefix} {leadPost.authorName}
                    </span>
                    {parseVideoSource(leadPost.videoUrl) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-medium text-[#14532D] dark:text-[#6EE7B7]">
                          <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Video</span>
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="mt-2.5 font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8] sm:text-3xl [text-wrap:balance]">
                    {leadPost.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1] sm:text-base">
                    {leadPost.summary}
                  </p>
                </div>

                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#123D68] dark:text-[#93C5FD]">
                  {t.posts.readFull}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </button>
            )}

            {/* Secondary Posts Stack */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              {secondaryPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setActivePost(post)}
                  className="group flex flex-1 flex-col justify-between rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-5 text-left transition-colors duration-150 hover:border-[#1769AA]/50 dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:hover:border-[#60A5FA]/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span className="font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                        {localizeCategory(post.category)}
                      </span>
                      {!post.published && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#B45309] dark:text-[#FBBF24]">
                            {post.approvalStatus === 'pending'
                              ? 'Pending Approval'
                              : post.approvalStatus === 'rejected'
                                ? 'Returned'
                                : t.posts.draftShort}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="tabular-figures">{post.displayDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.authorName}</span>
                      {parseVideoSource(post.videoUrl) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-medium text-[#14532D] dark:text-[#6EE7B7]">
                            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Video</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                      {post.summary}
                    </p>
                  </div>

                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#123D68] dark:text-[#93C5FD]">
                    {t.posts.readShort}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Teacher Post Submission Modal */}
      {submitOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="teacher-post-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08223C]/70 p-4 backdrop-blur-xs"
          onClick={() => setSubmitOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#CBD8E6] bg-white p-6 shadow-xl dark:border-[#1E334D] dark:bg-[#0D1B2D]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D4DFEB] pb-4 dark:border-[#1E334D]">
              <div>
                <h3
                  id="teacher-post-modal-title"
                  className="font-display text-xl font-semibold text-[#0B2E50] dark:text-[#EAF1F8]"
                >
                  Submit School Post or Photo/Video
                </h3>
                <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                  Sent directly to the School Owner for approval before appearing publicly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitOpen(false)}
                aria-label="Close post submission"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#CBD8E6] text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:text-[#E7EFF8] dark:hover:bg-[#13253D] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTeacherPostSubmit} className="mt-4 space-y-4">
              {submitSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-xs font-medium text-[#14532D]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}
              {submitError && (
                <p className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-xs font-medium text-[#B91C1C]">
                  {submitError}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. P5 Science Exhibition Highlights"
                  className="mt-1 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PostCategory)}
                    className="mt-1 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                  >
                    {POST_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Teacher name"
                    className="mt-1 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                  Short Summary *
                </label>
                <input
                  type="text"
                  required
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Brief 1-sentence summary for the news feed"
                  className="mt-1 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-sm text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                  Full Post Body *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Write the announcement, learning report, or classroom news..."
                  className="mt-1 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] p-3 text-sm text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                    Upload Photo or Paste URL
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-[#CBD8E6] bg-[#EDF4FA] px-3 text-xs font-medium text-[#123D68] hover:bg-[#DCEAF7] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#93C5FD]">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={async (ev) => {
                          const file = ev.target.files?.[0];
                          if (!file) return;
                          try {
                            const dataUrl = await compressImageToDataUrl(file);
                            setFormImageUrl(dataUrl);
                          } catch (err) {
                            setSubmitError(
                              err instanceof Error ? err.message : 'Unable to attach photo.',
                            );
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={formImageUrl.startsWith('data:') ? 'Attached compressed photo' : formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="h-10 min-w-0 flex-1 rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-2.5 text-xs text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B2E50] dark:text-[#E7EFF8]">
                    Video URL (YouTube / Vimeo / MP4)
                  </label>
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="mt-1 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-3 text-xs text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#D4DFEB] pt-4 dark:border-[#1E334D]">
                <button
                  type="button"
                  onClick={() => setSubmitOpen(false)}
                  className="inline-flex h-10 items-center rounded-md border border-[#CBD8E6] px-4 text-xs font-medium text-[#334155] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:text-[#CBD5E1] dark:hover:bg-[#13253D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#123D68] px-4 text-xs font-semibold text-white hover:bg-[#0B2E50] disabled:opacity-60 dark:bg-[#1769AA] cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit for Owner Approval'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Post Reader Modal */}
      {activePost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-reader-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#08223C]/70 p-4 backdrop-blur-xs"
          onClick={() => setActivePost(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#CBD8E6] bg-[#FFFFFF] shadow-xl dark:border-[#1E334D] dark:bg-[#0D1B2D]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D4DFEB] bg-[#FFFFFF] px-6 py-4 dark:border-[#1E334D] dark:bg-[#0D1B2D]">
              <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                <span className="font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                  {localizeCategory(activePost.category)}
                </span>
                <span aria-hidden="true"> · </span>
                <span className="tabular-figures">{activePost.displayDate}</span>
              </p>
              <button
                type="button"
                aria-label="Close article"
                onClick={() => setActivePost(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#CBD8E6] bg-[#FFFFFF] text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:hover:bg-[#1A3150] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <article className="p-6 sm:p-8">
              {activeVideo && (
                <div className="mb-6">
                  {activeVideo.kind === 'iframe' ? (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-[#D4DFEB] bg-[#08223C] dark:border-[#1E334D]">
                      <iframe
                        src={activeVideo.src}
                        title={`${activePost.title} video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full border-0"
                      />
                    </div>
                  ) : activeVideo.kind === 'video' ? (
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-[#D4DFEB] bg-[#08223C] dark:border-[#1E334D]">
                      <video
                        src={activeVideo.src}
                        controls
                        playsInline
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <a
                      href={activeVideo.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[#CBD8E6] bg-[#F8FAFD] px-4 py-2 text-xs font-medium text-[#123D68] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#93C5FD]"
                    >
                      <PlayCircle className="h-4 w-4" aria-hidden="true" />
                      <span>Open attached video</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}

              {activePost.imageUrl && isSafeMediaUrl(activePost.imageUrl) && (
                <div className="mb-6 aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#EDF4FA] dark:bg-[#13253D]">
                  <ResilientImage
                    src={activePost.imageUrl}
                    alt={activePost.title}
                    fallbackTitle={activePost.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <h3
                id="post-reader-title"
                className="font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8] sm:text-3xl [text-wrap:balance]"
              >
                {activePost.title}
              </h3>

              <p className="mt-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                {t.posts.publishedBy}{' '}
                <span className="font-medium text-[#0B2E50] dark:text-[#E7EFF8]">{activePost.authorName}</span>
                <span aria-hidden="true"> · </span>
                <span>{activePost.authorEmail}</span>
              </p>

              <div className="mt-6 space-y-4 border-t border-[#D4DFEB] pt-5 text-base leading-relaxed text-[#334155] dark:border-[#1E334D] dark:text-[#CBD5E1]">
                {activePost.body.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}
