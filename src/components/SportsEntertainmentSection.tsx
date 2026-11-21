import { useMemo, useState, type FormEvent } from 'react';
import { Calendar, CheckCircle2, Clock, Film, Music, Plus, Trash2, Trophy, X } from 'lucide-react';
import type { SportsActivityType } from '../data/portalCatalog';
import { BUILTIN_IMAGE_OPTIONS } from '../data/schoolData';
import { useSchoolData } from '../context/SchoolDataContext';
import { usePortalFeatures } from '../context/PortalFeaturesContext';
import { isSafeMediaUrl, parseVideoSource } from '../lib/videoEmbed';
import { compressImageToDataUrl } from '../lib/fileUtils';
import { ResilientImage } from './ResilientImage';

export function SportsEntertainmentSection() {
  const { user, isAdmin, signInWithGoogle } = useSchoolData();
  const {
    sportsItems,
    saveSportsItem,
    approveSportsItem,
    rejectSportsItem,
    deleteSportsItem,
  } = usePortalFeatures();

  const [filter, setFilter] = useState<'ALL' | SportsActivityType>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState<SportsActivityType>('Sports');
  const [eventDate, setEventDate] = useState('Friday · 14:30');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(BUILTIN_IMAGE_OPTIONS[4]?.url || '');
  const [videoUrl, setVideoUrl] = useState('');
  const [highlightsText, setHighlightsText] = useState('Team Sportsmanship, Campus Assembly');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const visibleItems = useMemo(() => {
    return sportsItems.filter((item) => {
      if (!isAdmin && item.approvalStatus !== 'approved' && item.submittedByUid !== user?.uid) {
        return false;
      }
      if (filter !== 'ALL' && item.activityType !== filter) return false;
      return true;
    });
  }, [sportsItems, isAdmin, user?.uid, filter]);

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await compressImageToDataUrl(file, 960, 0.78);
      setImageUrl(dataUrl);
    } catch (err) {
      setMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to process image.',
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.emailVerified) {
      await signInWithGoogle();
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await saveSportsItem({
        title,
        activityType,
        eventDate,
        description,
        imageUrl: imageUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        highlights: highlightsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setMsg({
        type: 'ok',
        text: isAdmin
          ? 'Sports & Entertainment highlight published!'
          : 'Submitted for Owner approval!',
      });
    } catch (err) {
      setMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to save activity.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="sports"
      className="border-b border-[#D4DFEB] bg-[#EDF4FA]/35 py-16 dark:border-[#1E334D] dark:bg-[#081322] sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#14532D] uppercase dark:text-[#86EFAC]">
              Sports Activities, Choir & Cultural Entertainment
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-white sm:text-4xl [text-wrap:balance]">
              Lakeside Athletics, Choir & Campus Joy
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1] sm:text-base">
              Celebrating student talent in football, netball, Saint Pierre Choir, Intore cultural dance, and Friday campus clubs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setModalOpen(true);
              }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#123D68] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B2E50] dark:bg-[#1769AA] cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#F2B544]" />
              <span>{isAdmin ? 'Post Sports / Entertainment' : 'Submit Activity (Approval)'}</span>
            </button>

            <div className="flex flex-wrap gap-1.5 rounded-xl border border-[#CBD8E6] bg-white p-1 dark:border-[#1E334D] dark:bg-[#0D1B2D]">
              {(['ALL', 'Sports', 'Entertainment', 'Club & Culture'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    filter === cat
                      ? 'bg-[#123D68] text-white dark:bg-[#1769AA]'
                      : 'text-[#475569] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'All Activities' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => {
            const vid = parseVideoSource(item.videoUrl);
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#D4DFEB] bg-white dark:border-[#1E334D] dark:bg-[#0D1B2D]"
              >
                <div>
                  {item.imageUrl && isSafeMediaUrl(item.imageUrl) && (
                    <div className="aspect-[16/10] w-full overflow-hidden bg-[#EDF4FA] dark:bg-[#13253D]">
                      <ResilientImage
                        src={item.imageUrl}
                        alt={item.title}
                        fallbackTitle={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#14532D] dark:text-[#86EFAC]">
                        {item.activityType === 'Sports' ? (
                          <Trophy className="h-3.5 w-3.5" />
                        ) : (
                          <Music className="h-3.5 w-3.5" />
                        )}
                        <span>{item.activityType}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        <Calendar className="h-3 w-3" />
                        <span>{item.eventDate}</span>
                      </span>
                    </div>

                    {item.approvalStatus !== 'approved' && (
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#92400E] dark:text-[#FCD34D]">
                        <Clock className="h-3 w-3" />
                        <span>
                          {item.approvalStatus === 'pending'
                            ? 'Pending Owner Approval'
                            : 'Rejected'}
                        </span>
                      </p>
                    )}

                    <h3 className="mt-2 font-display text-xl font-medium text-[#0B2E50] dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#475569] dark:text-[#CBD5E1]">
                      {item.description}
                    </p>

                    {item.highlights.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-[#E2E8F0] pt-3 text-xs text-[#334155] dark:border-[#1E334D] dark:text-[#CBD5E1]">
                        {item.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1769AA]" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {vid && (
                      <a
                        href={vid.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769AA] hover:underline dark:text-[#60A5FA]"
                      >
                        <Film className="h-3.5 w-3.5" />
                        <span>Watch Activity Video</span>
                      </a>
                    )}
                  </div>
                </div>

                {(isAdmin || (user?.uid === item.submittedByUid && item.approvalStatus !== 'approved')) && (
                  <div className="flex items-center justify-between gap-2 border-t border-[#E2E8F0] bg-[#F8FAFD] px-5 py-3 dark:border-[#1E334D] dark:bg-[#0A1626]">
                    {isAdmin && item.approvalStatus === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void approveSportsItem(item.id)}
                          className="rounded-md bg-[#14532D] px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void rejectSportsItem(item.id)}
                          className="rounded-md bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-semibold text-[#B91C1C] cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        By {item.submittedByName}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => void deleteSportsItem(item.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B91C1C] hover:underline dark:text-[#FCA5A5] cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal to submit sports / entertainment activity */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111E]/75 p-4 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#CBD8E6] bg-white text-[#0F1E33] shadow-2xl dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:text-[#E7EFF8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D4DFEB] px-6 py-4 dark:border-[#1E334D]">
              <h3 className="font-display text-lg font-medium">
                {isAdmin ? 'Publish Sports & Entertainment Post' : 'Submit Activity for Owner Approval'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#CBD8E6] dark:border-[#1E334D] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {msg && (
                <div
                  className={`flex items-center gap-2 rounded-lg border p-3 text-xs font-medium ${
                    msg.type === 'ok'
                      ? 'border-[#16A34A] bg-[#F0FDF4] text-[#14532D]'
                      : 'border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C]'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{msg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium">Activity Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nkombo Inter-School Football Semi-Final"
                  className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Activity Type</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as SportsActivityType)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    <option value="Sports">Sports</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Club & Culture">Club & Culture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium">Event Date / Time</label>
                  <input
                    type="text"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] p-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium">Photo (Upload or URL)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleImageUpload(e.target.files?.[0])}
                    className="mt-1 block w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Video URL (Optional)</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium">Highlights (comma separated)</label>
                <input
                  type="text"
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-xs dark:border-[#1E334D] dark:bg-[#0A1626]"
                />
              </div>

              <div className="flex justify-end border-t border-[#D4DFEB] pt-4 dark:border-[#1E334D]">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-[#123D68] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#0B2E50] disabled:opacity-60 cursor-pointer"
                >
                  {busy
                    ? 'Submitting...'
                    : isAdmin
                      ? 'Publish Activity'
                      : 'Submit for Owner Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
