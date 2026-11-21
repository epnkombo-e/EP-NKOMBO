import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import type { PostCategory, SchoolPost } from '../data/schoolData';
import { ResilientImage } from './ResilientImage';

type PostFilter = 'All Updates' | PostCategory;

const POST_FILTERS: PostFilter[] = [
  'All Updates',
  'Announcements',
  'Academics',
  'Community & Events',
  'Achievements',
];

interface PostsSectionProps {
  onNewPostClick: () => void;
}

export function PostsSection({ onNewPostClick }: PostsSectionProps) {
  const { posts, isAdmin } = useSchoolData();
  const { t, localizeCategory } = useLanguage();
  const [filter, setFilter] = useState<PostFilter>('All Updates');
  const [activePost, setActivePost] = useState<SchoolPost | null>(null);

  useEffect(() => {
    if (!activePost) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePost(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePost]);

  const visiblePosts = useMemo(() => {
    const base = isAdmin ? posts : posts.filter((p) => p.published);
    if (filter === 'All Updates') return base;
    return base.filter((p) => p.category === filter);
  }, [posts, isAdmin, filter]);

  const leadPost = visiblePosts[0] ?? null;
  const secondaryPosts = visiblePosts.slice(1);

  return (
    <section id="updates" className="border-b border-[#E5DFD3] bg-[#FFFFFF]/65 py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Header & Filter Controls */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wider text-[#57534E]">
              {t.posts.kicker}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#1C1917] sm:text-4xl [text-wrap:balance]">
              {t.posts.heading}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={onNewPostClick}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#14532D] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0F3F22] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.posts.publishNew}</span>
              </button>
            )}

            <div
              role="tablist"
              aria-label="Filter school posts"
              className="flex flex-wrap gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#F3EFE7] p-1.5"
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
                    className={`min-h-[40px] rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D] ${
                      isSelected
                        ? 'bg-[#FFFFFF] text-[#14532D] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
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
          <div className="mt-10 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-10 text-center">
            <p className="text-sm font-medium text-[#1C1917]">{t.posts.emptyTitle}</p>
            <p className="mt-1 text-xs text-[#57534E]">{t.posts.emptyHint}</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Lead Story */}
            {leadPost && (
              <button
                type="button"
                onClick={() => setActivePost(leadPost)}
                className="group flex flex-col justify-between rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 text-left transition-colors duration-150 hover:border-[#14532D]/40 lg:col-span-7 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
              >
                <div>
                  {leadPost.imageUrl && (
                    <div className="mb-5 aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#F3EFE7]">
                      <ResilientImage
                        src={leadPost.imageUrl}
                        alt={leadPost.title}
                        fallbackTitle={leadPost.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                    <span className="font-semibold text-[#14532D]">
                      {localizeCategory(leadPost.category)}
                    </span>
                    {leadPost.pinned && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#854D0E]">{t.posts.pinned}</span>
                      </>
                    )}
                    {!leadPost.published && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#B91C1C]">{t.posts.draftOwnerOnly}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="tabular-figures">{leadPost.displayDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t.posts.byPrefix} {leadPost.authorName}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-2xl font-medium text-[#1C1917] sm:text-3xl [text-wrap:balance]">
                    {leadPost.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#44403C] sm:text-base">
                    {leadPost.summary}
                  </p>
                </div>

                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-[#14532D]">
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
                  className="group flex flex-1 flex-col justify-between rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 text-left transition-colors duration-150 hover:border-[#14532D]/40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                      <span className="font-semibold text-[#14532D]">
                        {localizeCategory(post.category)}
                      </span>
                      {!post.published && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#B91C1C]">{t.posts.draftShort}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="tabular-figures">{post.displayDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{post.authorName}</span>
                    </div>

                    <h3 className="mt-2 font-display text-xl font-medium text-[#1C1917]">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#44403C]">
                      {post.summary}
                    </p>
                  </div>

                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#14532D]">
                    {t.posts.readShort}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Post Reader Modal */}
      {activePost && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="post-reader-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-4 backdrop-blur-xs"
          onClick={() => setActivePost(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#E5DFD3] bg-[#FBF9F5] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5DFD3] bg-[#FBF9F5] px-6 py-4">
              <p className="text-xs text-[#57534E]">
                <span className="font-semibold text-[#14532D]">
                  {localizeCategory(activePost.category)}
                </span>
                <span aria-hidden="true"> · </span>
                <span className="tabular-figures">{activePost.displayDate}</span>
              </p>
              <button
                type="button"
                aria-label="Close article"
                onClick={() => setActivePost(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E5DFD3] bg-[#FFFFFF] text-[#1C1917] hover:bg-[#F3EFE7] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <article className="p-6 sm:p-8">
              {activePost.imageUrl && (
                <div className="mb-6 aspect-[16/9] w-full overflow-hidden rounded-lg bg-[#F3EFE7]">
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
                className="font-display text-2xl font-medium text-[#1C1917] sm:text-3xl [text-wrap:balance]"
              >
                {activePost.title}
              </h3>

              <p className="mt-2 text-xs text-[#57534E]">
                {t.posts.publishedBy}{' '}
                <span className="font-medium text-[#1C1917]">{activePost.authorName}</span>
                <span aria-hidden="true"> · </span>
                <span>{activePost.authorEmail}</span>
              </p>

              <div className="mt-6 space-y-4 border-t border-[#E5DFD3] pt-5 text-base leading-relaxed text-[#44403C]">
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
