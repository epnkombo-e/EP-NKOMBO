import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileText,
  Film,
  GraduationCap,
  Image as ImageIcon,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  useSchoolData,
  type NewPostPayload,
  type NewSchoolFilePayload,
  type NewTestimonialPayload,
} from '../context/SchoolDataContext';
import { usePortalFeatures } from '../context/PortalFeaturesContext';
import {
  OwnerApprovalsPanel,
  OwnerBackgroundPanel,
  OwnerRosterPanel,
} from './OwnerStudioNewTabs';
import { isSafeMediaUrl, parseVideoSource } from '../lib/videoEmbed';
import {
  MAX_DIRECT_FILE_BYTES,
  MAX_ENCODED_DATA_LENGTH,
  compressImageToDataUrl,
  formatFileSize,
  getFileExtensionLabel,
  isSafeHttpUrl,
  readFileAsDataUrl,
  triggerSchoolFileDownload,
} from '../lib/fileUtils';
import {
  BUILTIN_IMAGE_OPTIONS,
  PRIMARY_OWNER_EMAIL,
  type AcademicDivision,
  type AdmissionsInquiryRecord,
  type CalendarEvent,
  type CampusSpace,
  type DailyScheduleRow,
  type FacultyMember,
  type PostCategory,
  type SchoolFileCategory,
  type SchoolFileRecord,
  type SchoolPost,
  type SchoolSettings,
  type SchoolTestimonial,
  type TestimonialVoiceType,
} from '../data/schoolData';

export type StudioTab =
  | 'posts'
  | 'approvals'
  | 'roster'
  | 'background'
  | 'testimonials'
  | 'files'
  | 'exams'
  | 'profile'
  | 'academics'
  | 'campus'
  | 'faculty'
  | 'calendar'
  | 'inquiries'
  | 'access';

interface OwnerStudioModalProps {
  open: boolean;
  initialTab?: StudioTab;
  onClose: () => void;
}

const TABS: { id: StudioTab; label: string }[] = [
  { id: 'posts', label: 'Posts & News' },
  { id: 'approvals', label: 'Teacher Approvals' },
  { id: 'roster', label: 'Roster & Marks' },
  { id: 'background', label: 'Background & AI' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'files', label: 'Files & Downloads' },
  { id: 'exams', label: 'Exam Results' },
  { id: 'profile', label: 'School Profile' },
  { id: 'academics', label: 'Academics' },
  { id: 'campus', label: 'Campus Spaces' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'calendar', label: 'Calendar & Bell' },
  { id: 'inquiries', label: 'Inquiries Inbox' },
  { id: 'access', label: 'Login & Access' },
];

export function OwnerStudioModal({ open, initialTab = 'posts', onClose }: OwnerStudioModalProps) {
  const {
    user,
    isPrimaryOwner,
    isAdmin,
    signOutUser,
    settings,
    posts,
    academics,
    campusSpaces,
    faculty,
    testimonials,
    schoolFiles,
    calendarEvents,
    dailySchedule,
    inquiries,
    examSubmissions,
    adminEmails,
    hasSyncedFromDb,
    saveSchoolSettings,
    savePost,
    deletePost,
    saveAcademicDivision,
    saveCampusSpace,
    deleteCampusSpace,
    saveFacultyMember,
    deleteFacultyMember,
    saveTestimonial,
    deleteTestimonial,
    saveSchoolFile,
    deleteSchoolFile,
    saveCalendarEvent,
    deleteCalendarEvent,
    saveDailyScheduleSlot,
    deleteDailyScheduleSlot,
    updateInquiryStatus,
    deleteInquiry,
    deleteExamSubmission,
    addCoAdminEmail,
    removeCoAdminEmail,
    seedAllDefaultsToFirestore,
  } = useSchoolData();
  const { libraryItems, sportsItems } = usePortalFeatures();

  const pendingApprovalsCount =
    posts.filter((p) => p.approvalStatus === 'pending').length +
    libraryItems.filter((l) => l.approvalStatus === 'pending').length +
    sportsItems.filter((s) => s.approvalStatus === 'pending').length;

  const [tab, setTab] = useState<StudioTab>(initialTab);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync tab when opened with a requested initialTab
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setBanner(null);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const notifyOk = (text: string) => setBanner({ type: 'ok', text });
  const notifyErr = (err: unknown) =>
    setBanner({
      type: 'err',
      text: err instanceof Error ? err.message : 'Unable to save changes.',
    });

  // 1. POSTS FORM STATE
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<NewPostPayload>({
    title: '',
    category: 'Announcements',
    summary: '',
    body: '',
    authorName: user?.displayName || 'Jean Bosco Habimana',
    published: true,
    pinned: false,
    imageUrl: BUILTIN_IMAGE_OPTIONS[0].url,
    videoUrl: '',
  });

  const resetPostForm = () => {
    setEditingPostId(null);
    setPostForm({
      title: '',
      category: 'Announcements',
      summary: '',
      body: '',
      authorName: user?.displayName || 'Jean Bosco Habimana',
      published: true,
      pinned: false,
      imageUrl: BUILTIN_IMAGE_OPTIONS[0].url,
      videoUrl: '',
    });
  };

  const loadPostForEdit = (p: SchoolPost) => {
    setEditingPostId(p.id);
    setPostForm({
      title: p.title,
      category: p.category,
      summary: p.summary,
      body: p.body,
      authorName: p.authorName,
      published: p.published,
      pinned: p.pinned,
      imageUrl: p.imageUrl || '',
      videoUrl: p.videoUrl || '',
    });
  };

  const handlePostPhotoUpload = async (file?: File | null) => {
    if (!file) return;
    setSaving(true);
    try {
      const compressed = await compressImageToDataUrl(file);
      setPostForm((prev) => ({ ...prev, imageUrl: compressed }));
      notifyOk(`Uploaded and optimized photo "${file.name}". Click Publish/Update Post to save.`);
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePost = async (e: FormEvent) => {
    e.preventDefault();
    if (postForm.title.trim().length < 3 || postForm.summary.trim().length < 10 || postForm.body.trim().length < 10) {
      setBanner({
        type: 'err',
        text: 'Post requires a title (3+ chars), summary (10+ chars), and body (10+ chars).',
      });
      return;
    }
    if (postForm.imageUrl?.trim() && !isSafeMediaUrl(postForm.imageUrl)) {
      setBanner({
        type: 'err',
        text: 'Enter a valid https:// image URL, choose a campus photo, or upload an image file.',
      });
      return;
    }
    setSaving(true);
    try {
      await savePost(postForm, editingPostId ?? undefined);
      notifyOk(editingPostId ? 'Website post updated.' : 'New post published to website.');
      resetPostForm();
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  // 2. SCHOOL PROFILE FORM STATE
  const [profileForm, setProfileForm] = useState<SchoolSettings>(settings);
  useEffect(() => {
    setProfileForm(settings);
  }, [settings]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSchoolSettings(profileForm);
      notifyOk('School profile and hero information saved.');
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  // 3. ACADEMICS FORM STATE
  const [selectedDivId, setSelectedDivId] = useState<string>(academics[0]?.id ?? 'lower-primary');
  const currentDiv = academics.find((d) => d.id === selectedDivId) ?? academics[0];
  const [divForm, setDivForm] = useState<AcademicDivision | null>(currentDiv ?? null);

  useEffect(() => {
    if (currentDiv) setDivForm(currentDiv);
  }, [selectedDivId, currentDiv]);

  const handleSaveDivision = async (e: FormEvent) => {
    e.preventDefault();
    if (!divForm) return;
    setSaving(true);
    try {
      await saveAcademicDivision(divForm);
      notifyOk(`Updated ${divForm.label}.`);
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  // 4. CAMPUS SPACES FORM STATE
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [spaceForm, setSpaceForm] = useState<Omit<CampusSpace, 'id'>>({
    order: campusSpaces.length + 1,
    indexLabel: 'Space 05 · Learning Facility',
    title: '',
    subtitle: '',
    description: '',
    highlights: ['Open to P1–P6 pupils'],
    image: BUILTIN_IMAGE_OPTIONS[0].url,
    imageAlt: 'Campus facility at EP Saint Pierre Nkombo',
    figureNumber: `Fig. ${campusSpaces.length + 3}`,
    featured: false,
  });

  const handleSpacePhotoUpload = async (file?: File | null) => {
    if (!file) return;
    setSaving(true);
    try {
      const compressed = await compressImageToDataUrl(file);
      setSpaceForm((prev) => ({ ...prev, image: compressed }));
      notifyOk(`Uploaded and optimized campus photo "${file.name}".`);
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSpace = async (e: FormEvent) => {
    e.preventDefault();
    if (spaceForm.title.trim().length < 3 || spaceForm.description.trim().length < 10) {
      setBanner({ type: 'err', text: 'Space title (3+ chars) and description (10+ chars) required.' });
      return;
    }
    if (!isSafeMediaUrl(spaceForm.image)) {
      setBanner({ type: 'err', text: 'Provide a valid photo URL, preset, or upload an image.' });
      return;
    }
    setSaving(true);
    try {
      await saveCampusSpace({
        id: editingSpaceId ?? '',
        ...spaceForm,
        highlights: spaceForm.highlights.filter((h) => h.trim().length > 0),
      });
      notifyOk(editingSpaceId ? 'Campus space updated.' : 'Campus space added.');
      setEditingSpaceId(null);
      setSpaceForm({
        order: campusSpaces.length + 1,
        indexLabel: `Space 0${campusSpaces.length + 1} · Learning Facility`,
        title: '',
        subtitle: '',
        description: '',
        highlights: ['Open to P1–P6 pupils'],
        image: BUILTIN_IMAGE_OPTIONS[0].url,
        imageAlt: 'Campus facility at EP Saint Pierre Nkombo',
        figureNumber: `Fig. ${campusSpaces.length + 3}`,
        featured: false,
      });
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  // 5. FACULTY FORM STATE
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);
  const [facultyForm, setFacultyForm] = useState<Omit<FacultyMember, 'id'>>({
    name: '',
    initials: '',
    role: '',
    department: 'Lower Primary',
    subjects: '',
    yearsAtSchool: 3,
    bio: '',
  });

  const handleSaveFaculty = async (e: FormEvent) => {
    e.preventDefault();
    if (facultyForm.name.trim().length < 2 || facultyForm.bio.trim().length < 10) {
      setBanner({ type: 'err', text: 'Teacher name and bio (10+ chars) are required.' });
      return;
    }
    const derivedInitials =
      facultyForm.initials.trim() ||
      facultyForm.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    setSaving(true);
    try {
      await saveFacultyMember(
        { ...facultyForm, initials: derivedInitials },
        editingFacultyId ?? undefined,
      );
      notifyOk(editingFacultyId ? 'Faculty member updated.' : 'Faculty member added.');
      setEditingFacultyId(null);
      setFacultyForm({
        name: '',
        initials: '',
        role: '',
        department: 'Lower Primary',
        subjects: '',
        yearsAtSchool: 3,
        bio: '',
      });
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  // 5B. TESTIMONIALS FORM STATE
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState<NewTestimonialPayload>({
    authorName: '',
    roleLabel: '',
    voiceType: 'Parent',
    gradeContext: '',
    quote: '',
    featured: false,
    published: true,
  });

  const resetTestimonialForm = () => {
    setEditingTestimonialId(null);
    setTestimonialForm({
      authorName: '',
      roleLabel: '',
      voiceType: 'Parent',
      gradeContext: '',
      quote: '',
      featured: false,
      published: true,
    });
  };

  const loadTestimonialForEdit = (t: SchoolTestimonial) => {
    setEditingTestimonialId(t.id);
    setTestimonialForm({
      authorName: t.authorName,
      roleLabel: t.roleLabel,
      voiceType: t.voiceType,
      gradeContext: t.gradeContext,
      quote: t.quote,
      featured: t.featured,
      published: t.published,
    });
  };

  const handleSaveTestimonial = async (e: FormEvent) => {
    e.preventDefault();
    if (
      testimonialForm.authorName.trim().length < 2 ||
      testimonialForm.roleLabel.trim().length < 3 ||
      testimonialForm.gradeContext.trim().length < 2 ||
      testimonialForm.quote.trim().length < 15
    ) {
      setBanner({
        type: 'err',
        text: 'Testimonial requires name (2+ chars), role (3+ chars), grade context (2+ chars), and quote (15+ chars).',
      });
      return;
    }
    setSaving(true);
    try {
      await saveTestimonial(testimonialForm, editingTestimonialId ?? undefined);
      notifyOk(
        editingTestimonialId
          ? 'Testimonial updated.'
          : 'New testimonial added to Parent & Student Testimonials.',
      );
      resetTestimonialForm();
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  // 5C. SCHOOL FILES & DOWNLOADS FORM STATE
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [fileInputMode, setFileInputMode] = useState<'upload' | 'url'>('upload');
  const [fileForm, setFileForm] = useState<NewSchoolFilePayload>({
    title: '',
    category: 'Forms & Admissions',
    description: '',
    fileName: '',
    mimeType: 'application/pdf',
    sizeBytes: 0,
    sourceType: 'upload',
    fileUrl: '',
    fileData: '',
    published: true,
  });

  const resetFileForm = () => {
    setEditingFileId(null);
    setFileInputMode('upload');
    setFileForm({
      title: '',
      category: 'Forms & Admissions',
      description: '',
      fileName: '',
      mimeType: 'application/pdf',
      sizeBytes: 0,
      sourceType: 'upload',
      fileUrl: '',
      fileData: '',
      published: true,
    });
  };

  const loadFileForEdit = (f: SchoolFileRecord) => {
    setEditingFileId(f.id);
    setFileInputMode(f.sourceType === 'url' && !f.fileData ? 'url' : 'upload');
    setFileForm({
      title: f.title,
      category: f.category,
      description: f.description,
      fileName: f.fileName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      sourceType: f.sourceType,
      fileUrl: f.fileUrl || '',
      fileData: f.fileData || '',
      published: f.published,
    });
  };

  const handlePickSchoolFile = async (file?: File | null) => {
    if (!file) return;
    setBanner(null);

    try {
      let dataUri = '';
      let finalMime = file.type || 'application/octet-stream';
      let finalSize = file.size;

      if (file.type.startsWith('image/') && file.size > MAX_DIRECT_FILE_BYTES) {
        dataUri = await compressImageToDataUrl(file, 1600, MAX_ENCODED_DATA_LENGTH - 5000);
        finalMime = 'image/jpeg';
        finalSize = Math.round((dataUri.length * 3) / 4);
      } else {
        if (file.size > MAX_DIRECT_FILE_BYTES) {
          setBanner({
            type: 'err',
            text: `"${file.name}" is ${formatFileSize(file.size)}. Direct uploads support up to 500 KB. Switch to "External File Link" for larger PDFs or videos.`,
          });
          return;
        }
        dataUri = await readFileAsDataUrl(file);
      }

      if (dataUri.length > MAX_ENCODED_DATA_LENGTH) {
        setBanner({
          type: 'err',
          text: `"${file.name}" is too large after encoding. Please use External File Link for large files.`,
        });
        return;
      }

      const suggestedTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      setFileForm((prev) => ({
        ...prev,
        title: prev.title.trim() ? prev.title : suggestedTitle.slice(0, 140),
        fileName: file.name.slice(0, 180),
        mimeType: finalMime.slice(0, 120),
        sizeBytes: finalSize,
        sourceType: 'upload',
        fileData: dataUri,
        fileUrl: '',
      }));
      notifyOk(`Attached "${file.name}" (${formatFileSize(finalSize)}). Add a short description and click Save & Publish File.`);
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleSaveSchoolFile = async (e: FormEvent) => {
    e.preventDefault();
    if (fileForm.title.trim().length < 2 || fileForm.description.trim().length < 5) {
      setBanner({
        type: 'err',
        text: 'Document requires a title (2+ chars) and description (5+ chars).',
      });
      return;
    }

    if (fileInputMode === 'upload') {
      if (!fileForm.fileData?.trim()) {
        setBanner({
          type: 'err',
          text: 'Select a file from your computer or phone first, or switch to External File Link.',
        });
        return;
      }
    } else {
      if (!isSafeHttpUrl(fileForm.fileUrl)) {
        setBanner({
          type: 'err',
          text: 'Enter a valid https:// or http:// external file link.',
        });
        return;
      }
    }

    const payload: NewSchoolFilePayload =
      fileInputMode === 'url'
        ? {
            ...fileForm,
            sourceType: 'url',
            fileUrl: fileForm.fileUrl?.trim(),
            fileData: '',
            fileName: fileForm.fileName.trim() || `${fileForm.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.link`,
            mimeType: fileForm.mimeType.trim() || 'text/uri-list',
            sizeBytes: Math.max(0, Math.round(fileForm.sizeBytes || 0)),
          }
        : {
            ...fileForm,
            sourceType: fileForm.sourceType === 'generated' ? 'generated' : 'upload',
            fileUrl: '',
          };

    setSaving(true);
    try {
      await saveSchoolFile(payload, editingFileId ?? undefined);
      notifyOk(
        editingFileId
          ? 'School document updated.'
          : 'File uploaded and published to School Documents & Downloads.',
      );
      resetFileForm();
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  // 6. CALENDAR & DAILY SCHEDULE STATE
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<Omit<CalendarEvent, 'id'>>({
    dateISO: '20270315T083000',
    displayDate: '15 Mar 2027',
    monthLabel: 'MAR',
    dayNumber: '15',
    timeRange: '08:30 – 12:00',
    category: 'Academic Dates',
    title: '',
    location: 'Main Courtyard',
    description: '',
  });

  const handleSaveEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (eventForm.title.trim().length < 3 || eventForm.description.trim().length < 5) {
      setBanner({ type: 'err', text: 'Event title and description are required.' });
      return;
    }
    setSaving(true);
    try {
      await saveCalendarEvent(eventForm, editingEventId ?? undefined);
      notifyOk(editingEventId ? 'Calendar event updated.' : 'Calendar event added.');
      setEditingEventId(null);
      setEventForm({
        dateISO: '20270315T083000',
        displayDate: '15 Mar 2027',
        monthLabel: 'MAR',
        dayNumber: '15',
        timeRange: '08:30 – 12:00',
        category: 'Academic Dates',
        title: '',
        location: 'Main Courtyard',
        description: '',
      });
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState<Omit<DailyScheduleRow, 'id'>>({
    order: dailySchedule.length + 1,
    time: '',
    activity: '',
    notes: '',
  });

  const handleSaveSlot = async (e: FormEvent) => {
    e.preventDefault();
    if (slotForm.time.trim().length < 3 || slotForm.activity.trim().length < 3) {
      setBanner({ type: 'err', text: 'Time range and activity title are required.' });
      return;
    }
    setSaving(true);
    try {
      await saveDailyScheduleSlot(slotForm, editingSlotId ?? undefined);
      notifyOk(editingSlotId ? 'Schedule row updated.' : 'Schedule row added.');
      setEditingSlotId(null);
      setSlotForm({
        order: dailySchedule.length + 1,
        time: '',
        activity: '',
        notes: '',
      });
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  // 7. INQUIRY STATUS NOTES
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // 8. CO-ADMIN ACCESS
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminLabel, setNewAdminLabel] = useState('');

  const handleAddCoAdmin = async (e: FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setBanner({ type: 'err', text: 'Enter a valid Google email address.' });
      return;
    }
    setSaving(true);
    try {
      await addCoAdminEmail(email, newAdminLabel.trim() || 'School Co-Administrator');
      notifyOk(`Granted co-admin editing access to ${email}.`);
      setNewAdminEmail('');
      setNewAdminLabel('');
    } catch (err) {
      notifyErr(err);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !isAdmin) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-studio-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/65 p-2 sm:p-5 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[#E5DFD3] bg-[#FBF9F5] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DFD3] bg-[#FFFFFF] px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-medium text-[#14532D]">
              {isPrimaryOwner ? 'Primary Owner Control' : 'Co-Administrator Control'} ·{' '}
              <span className="font-mono">{user?.email}</span>
            </p>
            <h2 id="owner-studio-title" className="font-display text-xl font-medium text-[#1C1917]">
              EP Saint Pierre Nkombo — Website &amp; Data Studio
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {!hasSyncedFromDb && (
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await seedAllDefaultsToFirestore();
                    notifyOk('All initial school records synced to live database.');
                  } catch (err) {
                    notifyErr(err);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[#14532D] bg-[#F3EFE7] px-3 py-2 text-xs font-medium text-[#14532D] hover:bg-[#E5DFD3] whitespace-nowrap cursor-pointer"
              >
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sync Default Data</span>
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                await signOutUser();
                onClose();
              }}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-3 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] whitespace-nowrap cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>

            <button
              type="button"
              aria-label="Close Owner Studio"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E5DFD3] bg-[#FFFFFF] text-[#1C1917] hover:bg-[#F3EFE7] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="border-b border-[#E5DFD3] bg-[#F3EFE7] px-5 py-2.5 sm:px-7">
          <div role="tablist" aria-label="Owner Studio sections" className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => {
                    setTab(t.id);
                    setBanner(null);
                  }}
                  className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#FFFFFF] text-[#14532D] shadow-xs'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {t.label}
                  {t.id === 'approvals' && pendingApprovalsCount > 0 && (
                    <span className="ml-1.5 rounded bg-[#F2B544] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0B2E50]">
                      {pendingApprovalsCount}
                    </span>
                  )}
                  {t.id === 'inquiries' && inquiries.filter((i) => i.status === 'new').length > 0 && (
                    <span className="ml-1.5 font-mono text-[11px] text-[#14532D]">
                      ({inquiries.filter((i) => i.status === 'new').length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Banner */}
        {banner && (
          <div
            className={`flex items-center justify-between border-b px-6 py-2.5 text-xs font-medium ${
              banner.type === 'ok'
                ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#14532D]'
                : 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
            }`}
          >
            <span className="flex items-center gap-2">
              {banner.type === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span>{banner.text}</span>
            </span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Workspace Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {/* TAB 1: POSTS & NEWS */}
          {tab === 'posts' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleSavePost}
                className="space-y-4 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 lg:col-span-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    {editingPostId ? 'Edit Website Post' : 'Create & Publish Website Post'}
                  </h3>
                  {editingPostId && (
                    <button
                      type="button"
                      onClick={resetPostForm}
                      className="text-xs font-medium text-[#57534E] underline cursor-pointer"
                    >
                      Cancel edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Headline</label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="e.g. Term II Uniform & Booklist Notice"
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Category</label>
                    <select
                      value={postForm.category}
                      onChange={(e) =>
                        setPostForm({ ...postForm, category: e.target.value as PostCategory })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    >
                      <option value="Announcements">Announcements</option>
                      <option value="Academics">Academics</option>
                      <option value="Community & Events">Community &amp; Events</option>
                      <option value="Achievements">Achievements</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Author Name</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={postForm.authorName}
                      onChange={(e) => setPostForm({ ...postForm, authorName: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Short Summary (shown on homepage cards)
                  </label>
                  <textarea
                    rows={2}
                    required
                    maxLength={320}
                    value={postForm.summary}
                    onChange={(e) => setPostForm({ ...postForm, summary: e.target.value })}
                    placeholder="Concise two-sentence summary for families..."
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Full Post Content
                  </label>
                  <textarea
                    rows={5}
                    required
                    maxLength={5000}
                    value={postForm.body}
                    onChange={(e) => setPostForm({ ...postForm, body: e.target.value })}
                    placeholder="Write the full announcement or news story..."
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>

                <div className="space-y-2 rounded-lg border border-[#E5DFD3] bg-[#FBF9F5] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
                      <ImageIcon className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                      <span>Photo (Upload from Device, Preset, or URL)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#14532D] bg-[#FFFFFF] px-2.5 text-[11px] font-medium text-[#14532D] hover:bg-[#F3EFE7] cursor-pointer">
                        <Upload className="h-3 w-3" aria-hidden="true" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            void handlePostPhotoUpload(f);
                          }}
                        />
                      </label>
                      {postForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setPostForm({ ...postForm, imageUrl: '' })}
                          className="text-[11px] font-medium text-[#57534E] underline cursor-pointer"
                        >
                          Clear photo
                        </button>
                      )}
                    </div>
                  </div>

                  <select
                    aria-label="Choose built-in school photo"
                    value={
                      BUILTIN_IMAGE_OPTIONS.some((o) => o.url === postForm.imageUrl)
                        ? postForm.imageUrl
                        : ''
                    }
                    onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })}
                    className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-3 text-sm"
                  >
                    <option value="">
                      {postForm.imageUrl?.startsWith('data:image/')
                        ? 'Uploaded photo from device attached'
                        : postForm.imageUrl
                          ? 'Using custom photo URL below'
                          : 'No cover photo'}
                    </option>
                    {BUILTIN_IMAGE_OPTIONS.map((opt) => (
                      <option key={opt.url} value={opt.url}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {postForm.imageUrl?.startsWith('data:image/') ? (
                    <p className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-xs text-[#14532D]">
                      Photo uploaded from device ({formatFileSize(Math.round((postForm.imageUrl.length * 3) / 4))}).
                    </p>
                  ) : (
                    <input
                      type="text"
                      maxLength={250000}
                      value={postForm.imageUrl || ''}
                      onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })}
                      placeholder="Or paste custom photo link: https://..."
                      className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-3 text-sm"
                    />
                  )}

                  {postForm.imageUrl && isSafeMediaUrl(postForm.imageUrl) && (
                    <div className="aspect-[16/9] w-full max-w-xs overflow-hidden rounded-md border border-[#E5DFD3] bg-[#F3EFE7]">
                      <img
                        src={postForm.imageUrl}
                        alt="Post cover preview"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 rounded-lg border border-[#E5DFD3] bg-[#FBF9F5] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
                      <Film className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
                      <span>Video Link (Optional — YouTube, Vimeo, or MP4)</span>
                    </label>
                    {postForm.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setPostForm({ ...postForm, videoUrl: '' })}
                        className="text-[11px] font-medium text-[#57534E] underline cursor-pointer"
                      >
                        Clear video
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    maxLength={500}
                    value={postForm.videoUrl || ''}
                    onChange={(e) => setPostForm({ ...postForm, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                    className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-3 text-sm"
                  />
                  {postForm.videoUrl && (
                    <p className="text-[11px] text-[#57534E]">
                      {parseVideoSource(postForm.videoUrl)?.kind === 'iframe'
                        ? `Ready to embed (${parseVideoSource(postForm.videoUrl)?.kind === 'iframe' ? (parseVideoSource(postForm.videoUrl) as { provider: string }).provider : ''})`
                        : parseVideoSource(postForm.videoUrl)?.kind === 'video'
                          ? 'Ready to play HTML5 video'
                          : parseVideoSource(postForm.videoUrl)?.kind === 'link'
                            ? 'Will appear as a video link inside the post'
                            : 'Enter a valid https:// YouTube, Vimeo, or .mp4 URL'}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postForm.published}
                      onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })}
                      className="h-4 w-4 accent-[#14532D]"
                    />
                    <span>Published on public website</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postForm.pinned}
                      onChange={(e) => setPostForm({ ...postForm, pinned: e.target.checked })}
                      className="h-4 w-4 accent-[#14532D]"
                    />
                    <span>Pin as featured top post</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[42px] w-full items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F3F22] disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingPostId ? 'Update Website Post' : 'Publish Post'}
                </button>
              </form>

              {/* Existing Posts List */}
              <div className="space-y-3 lg:col-span-6">
                <h3 className="font-display text-lg font-medium text-[#1C1917]">
                  All Website Posts ({posts.length})
                </h3>
                {posts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4 sm:flex-row sm:items-start"
                  >
                    <div>
                      <p className="text-xs text-[#57534E]">
                        <span className="font-semibold text-[#14532D]">{p.category}</span>
                        <span> · </span>
                        <span>{p.published ? 'Published' : 'Draft'}</span>
                        {p.pinned && <span> · Pinned</span>}
                        {p.imageUrl && <span> · Photo</span>}
                        {p.videoUrl && <span> · Video</span>}
                        <span> · </span>
                        <span>{p.displayDate}</span>
                      </p>
                      <h4 className="mt-1 font-display text-base font-medium text-[#1C1917]">
                        {p.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs text-[#57534E]">{p.summary}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadPostForEdit(p)}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-[#E5DFD3] px-2.5 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE7] cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deletePost(p.id);
                            notifyOk('Post deleted.');
                          } catch (err) {
                            notifyErr(err);
                          }
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-[#FECACA] px-2.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SCHOOL PROFILE */}
          {tab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="mx-auto max-w-3xl space-y-5 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-6"
            >
              <h3 className="font-display text-xl font-medium text-[#1C1917]">
                School Profile, Hero &amp; Operational Ribbon
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">School Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.schoolName}
                    onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={profileForm.contactEmail}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, contactEmail: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    School Phone Number
                  </label>
                  <input
                    type="text"
                    value={profileForm.phoneNumber}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                    }
                    placeholder="e.g. 078 200 6911"
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Hero Kicker / Tagline
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.tagline}
                    onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Main Hero Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.heroTitle}
                    onChange={(e) => setProfileForm({ ...profileForm, heroTitle: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Hero Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={profileForm.heroSubtitle}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, heroSubtitle: e.target.value })
                    }
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Grades Served</label>
                  <input
                    type="text"
                    required
                    value={profileForm.gradesServed}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, gradesServed: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Languages</label>
                  <input
                    type="text"
                    required
                    value={profileForm.languages}
                    onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Daily Hours</label>
                  <input
                    type="text"
                    required
                    value={profileForm.schoolHours}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, schoolHours: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    P6 Exam Pass Rate
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.plePassRate}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, plePassRate: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Campus Address
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.campusAddress}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, campusAddress: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Office Hours</label>
                  <input
                    type="text"
                    required
                    value={profileForm.officeHours}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, officeHours: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Institutional History Note
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.historyNote}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, historyNote: e.target.value })
                    }
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-[#14532D] px-6 py-2 text-sm font-medium text-white hover:bg-[#0F3F22] disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save School Profile'}
              </button>
            </form>
          )}

          {/* TAB 3: ACADEMICS */}
          {tab === 'academics' && divForm && (
            <div className="mx-auto max-w-4xl space-y-5">
              <div className="flex flex-wrap gap-2">
                {academics.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDivId(d.id)}
                    className={`rounded-md border px-3.5 py-2 text-xs font-medium cursor-pointer ${
                      selectedDivId === d.id
                        ? 'border-[#14532D] bg-[#14532D] text-white'
                        : 'border-[#E5DFD3] bg-[#FFFFFF] text-[#1C1917]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleSaveDivision}
                className="space-y-4 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-6"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Tab Label</label>
                    <input
                      type="text"
                      value={divForm.label}
                      onChange={(e) => setDivForm({ ...divForm, label: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      Weekly Hours
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={divForm.weeklyHours}
                      onChange={(e) =>
                        setDivForm({ ...divForm, weeklyHours: Number(e.target.value) || 20 })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Class Size</label>
                    <input
                      type="text"
                      value={divForm.classSize}
                      onChange={(e) => setDivForm({ ...divForm, classSize: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Division Headline
                  </label>
                  <input
                    type="text"
                    value={divForm.headline}
                    onChange={(e) => setDivForm({ ...divForm, headline: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Division Overview
                  </label>
                  <textarea
                    rows={3}
                    value={divForm.summary}
                    onChange={(e) => setDivForm({ ...divForm, summary: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#1C1917]">
                    Milestones (one per line, max 8)
                  </p>
                  <textarea
                    rows={3}
                    value={divForm.milestones.join('\n')}
                    onChange={(e) =>
                      setDivForm({
                        ...divForm,
                        milestones: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .slice(0, 8),
                      })
                    }
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-md bg-[#14532D] px-6 py-2 text-sm font-medium text-white hover:bg-[#0F3F22] cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Division Changes'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: CAMPUS SPACES */}
          {tab === 'campus' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleSaveSpace}
                className="space-y-4 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 lg:col-span-5"
              >
                <h3 className="font-display text-lg font-medium text-[#1C1917]">
                  {editingSpaceId ? 'Edit Campus Space' : 'Add Campus Space'}
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Space Title</label>
                  <input
                    type="text"
                    required
                    value={spaceForm.title}
                    onChange={(e) => setSpaceForm({ ...spaceForm, title: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Index Label</label>
                    <input
                      type="text"
                      required
                      value={spaceForm.indexLabel}
                      onChange={(e) => setSpaceForm({ ...spaceForm, indexLabel: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Subtitle</label>
                    <input
                      type="text"
                      required
                      value={spaceForm.subtitle}
                      onChange={(e) => setSpaceForm({ ...spaceForm, subtitle: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={spaceForm.description}
                    onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>
                <div className="space-y-2 rounded-lg border border-[#E5DFD3] bg-[#FBF9F5] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      Campus Space Photo (Upload, Preset, or URL)
                    </label>
                    <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#14532D] bg-[#FFFFFF] px-2.5 text-[11px] font-medium text-[#14532D] hover:bg-[#F3EFE7] cursor-pointer">
                      <Upload className="h-3 w-3" aria-hidden="true" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = '';
                          void handleSpacePhotoUpload(f);
                        }}
                      />
                    </label>
                  </div>
                  <select
                    value={
                      BUILTIN_IMAGE_OPTIONS.some((o) => o.url === spaceForm.image)
                        ? spaceForm.image
                        : ''
                    }
                    onChange={(e) => {
                      if (e.target.value) setSpaceForm({ ...spaceForm, image: e.target.value });
                    }}
                    className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-3 text-sm"
                  >
                    <option value="">
                      {spaceForm.image?.startsWith('data:image/')
                        ? 'Uploaded photo from device attached'
                        : 'Using custom photo URL below'}
                    </option>
                    {BUILTIN_IMAGE_OPTIONS.map((opt) => (
                      <option key={opt.url} value={opt.url}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {spaceForm.image?.startsWith('data:image/') ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-xs text-[#14532D]">
                      <span>Photo uploaded from device ({formatFileSize(Math.round((spaceForm.image.length * 3) / 4))}).</span>
                      <button
                        type="button"
                        onClick={() => setSpaceForm({ ...spaceForm, image: BUILTIN_IMAGE_OPTIONS[0].url })}
                        className="underline cursor-pointer"
                      >
                        Reset preset
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      maxLength={250000}
                      value={spaceForm.image}
                      onChange={(e) => setSpaceForm({ ...spaceForm, image: e.target.value })}
                      placeholder="https://..."
                      className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-3 text-sm"
                    />
                  )}
                  {spaceForm.image && isSafeMediaUrl(spaceForm.image) && (
                    <div className="aspect-[16/9] w-full max-w-xs overflow-hidden rounded-md border border-[#E5DFD3] bg-[#F3EFE7]">
                      <img
                        src={spaceForm.image}
                        alt="Campus space preview"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[42px] w-full items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F3F22] cursor-pointer"
                >
                  {editingSpaceId ? 'Update Space' : 'Add Campus Space'}
                </button>
              </form>

              <div className="space-y-3 lg:col-span-7">
                {campusSpaces.map((sp) => (
                  <div
                    key={sp.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4"
                  >
                    <div>
                      <p className="text-xs text-[#57534E]">{sp.indexLabel}</p>
                      <h4 className="mt-1 font-display text-base font-medium text-[#1C1917]">
                        {sp.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs text-[#57534E]">{sp.description}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSpaceId(sp.id);
                          const { id: _id, ...rest } = sp;
                          setSpaceForm(rest);
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-[#E5DFD3] px-2.5 text-xs font-medium cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteCampusSpace(sp.id);
                            notifyOk('Campus space removed.');
                          } catch (err) {
                            notifyErr(err);
                          }
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-[#FECACA] px-2.5 text-xs font-medium text-[#B91C1C] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FACULTY */}
          {tab === 'faculty' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleSaveFaculty}
                className="space-y-4 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 lg:col-span-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    {editingFacultyId ? 'Edit Faculty Member' : 'Add Faculty Member'}
                  </h3>
                  {editingFacultyId && (
                    <button
                      type="button"
                      onClick={() => setEditingFacultyId(null)}
                      className="text-xs underline cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={facultyForm.name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Role / Title</label>
                    <input
                      type="text"
                      required
                      value={facultyForm.role}
                      onChange={(e) => setFacultyForm({ ...facultyForm, role: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Department</label>
                    <select
                      value={facultyForm.department}
                      onChange={(e) =>
                        setFacultyForm({
                          ...facultyForm,
                          department: e.target.value as FacultyMember['department'],
                        })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    >
                      <option value="Administration">Administration</option>
                      <option value="Lower Primary">Lower Primary</option>
                      <option value="Upper Primary & STEM">Upper Primary &amp; STEM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      Subjects / Focus
                    </label>
                    <input
                      type="text"
                      required
                      value={facultyForm.subjects}
                      onChange={(e) => setFacultyForm({ ...facultyForm, subjects: e.target.value })}
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Years</label>
                    <input
                      type="number"
                      min={0}
                      max={70}
                      value={facultyForm.yearsAtSchool}
                      onChange={(e) =>
                        setFacultyForm({
                          ...facultyForm,
                          yearsAtSchool: Number(e.target.value) || 0,
                        })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Short Bio</label>
                  <textarea
                    rows={3}
                    required
                    value={facultyForm.bio}
                    onChange={(e) => setFacultyForm({ ...facultyForm, bio: e.target.value })}
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[42px] w-full items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F3F22] cursor-pointer"
                >
                  {editingFacultyId ? 'Update Faculty Member' : 'Add Faculty Member'}
                </button>
              </form>

              <div className="space-y-3 lg:col-span-7">
                {faculty.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#14532D]">
                        {m.role} · {m.department}
                      </p>
                      <h4 className="mt-0.5 font-display text-base font-medium text-[#1C1917]">
                        {m.name}
                      </h4>
                      <p className="mt-1 text-xs text-[#57534E]">{m.subjects}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFacultyId(m.id);
                          const { id: _id, ...rest } = m;
                          setFacultyForm(rest);
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-[#E5DFD3] px-2.5 text-xs font-medium cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteFacultyMember(m.id);
                            notifyOk('Faculty member removed.');
                          } catch (err) {
                            notifyErr(err);
                          }
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-[#FECACA] px-2.5 text-xs font-medium text-[#B91C1C] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1B: PARENT & STUDENT TESTIMONIALS */}
          {tab === 'testimonials' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleSaveTestimonial}
                className="space-y-4 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 lg:col-span-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    {editingTestimonialId ? 'Edit Testimonial' : 'Add New Testimonial'}
                  </h3>
                  {editingTestimonialId && (
                    <button
                      type="button"
                      onClick={resetTestimonialForm}
                      className="text-xs font-medium text-[#14532D] underline whitespace-nowrap cursor-pointer"
                    >
                      + Add New Testimonial
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Parent or Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={testimonialForm.authorName}
                    onChange={(e) =>
                      setTestimonialForm({ ...testimonialForm, authorName: e.target.value })
                    }
                    placeholder="e.g. Béatrice Nyirabagenzi"
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      Voice Type
                    </label>
                    <select
                      value={testimonialForm.voiceType}
                      onChange={(e) =>
                        setTestimonialForm({
                          ...testimonialForm,
                          voiceType: e.target.value as TestimonialVoiceType,
                        })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Student">Student</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      Grade / Class Context
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={80}
                      value={testimonialForm.gradeContext}
                      onChange={(e) =>
                        setTestimonialForm({ ...testimonialForm, gradeContext: e.target.value })
                      }
                      placeholder="e.g. Primary 4"
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Role / Community Relationship
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={120}
                    value={testimonialForm.roleLabel}
                    onChange={(e) =>
                      setTestimonialForm({ ...testimonialForm, roleLabel: e.target.value })
                    }
                    placeholder="e.g. Parent of P4 Pupil · Nkombo Sector"
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      Testimonial Quote
                    </label>
                    <span className="font-mono text-[11px] text-[#57534E] tabular-figures">
                      {testimonialForm.quote.length}/800
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    minLength={15}
                    maxLength={800}
                    value={testimonialForm.quote}
                    onChange={(e) =>
                      setTestimonialForm({ ...testimonialForm, quote: e.target.value })
                    }
                    placeholder="Share a reflection about learning, teachers, reading circles, or campus life..."
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testimonialForm.published}
                      onChange={(e) =>
                        setTestimonialForm({ ...testimonialForm, published: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#14532D]"
                    />
                    <span>Published on public website</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testimonialForm.featured}
                      onChange={(e) =>
                        setTestimonialForm({ ...testimonialForm, featured: e.target.checked })
                      }
                      className="h-4 w-4 accent-[#14532D]"
                    />
                    <span>Feature in top pull-quote row</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F3F22] disabled:opacity-60 cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {saving
                      ? 'Saving...'
                      : editingTestimonialId
                        ? 'Update Testimonial'
                        : 'Add New Testimonial'}
                  </span>
                </button>
              </form>

              <div className="space-y-3 lg:col-span-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    All Testimonials ({testimonials.length})
                  </h3>
                  {editingTestimonialId && (
                    <button
                      type="button"
                      onClick={resetTestimonialForm}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#14532D] bg-[#FFFFFF] px-3 text-xs font-medium text-[#14532D] hover:bg-[#F3EFE7] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Add New Testimonial</span>
                    </button>
                  )}
                </div>

                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4 sm:flex-row sm:items-start"
                  >
                    <div>
                      <p className="text-xs text-[#57534E]">
                        <span className="font-semibold text-[#14532D]">{t.voiceType}</span>
                        <span> · </span>
                        <span>{t.gradeContext}</span>
                        <span> · </span>
                        <span>{t.published ? 'Published' : 'Draft'}</span>
                        {t.featured && <span> · Featured</span>}
                      </p>
                      <h4 className="mt-1 font-display text-base font-medium text-[#1C1917]">
                        {t.authorName}
                      </h4>
                      <p className="text-xs text-[#57534E]">{t.roleLabel}</p>
                      <p className="mt-2 line-clamp-2 text-xs italic text-[#44403C]">
                        “{t.quote}”
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadTestimonialForEdit(t)}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-[#E5DFD3] px-2.5 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE7] cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteTestimonial(t.id);
                            if (editingTestimonialId === t.id) {
                              resetTestimonialForm();
                            }
                            notifyOk('Testimonial deleted.');
                          } catch (err) {
                            notifyErr(err);
                          }
                        }}
                        className="inline-flex h-9 items-center gap-1 rounded-md border border-[#FECACA] px-2.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1C: FILES & DOWNLOADS */}
          {tab === 'files' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <form
                onSubmit={handleSaveSchoolFile}
                className="space-y-4 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5 lg:col-span-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    {editingFileId ? 'Edit School Document' : 'Upload or Link School File'}
                  </h3>
                  {editingFileId && (
                    <button
                      type="button"
                      onClick={resetFileForm}
                      className="text-xs font-medium text-[#14532D] underline whitespace-nowrap cursor-pointer"
                    >
                      + Upload New File
                    </button>
                  )}
                </div>

                {/* Source Mode Toggle */}
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#F3EFE7] p-1">
                  <button
                    type="button"
                    onClick={() => setFileInputMode('upload')}
                    className={`min-h-[36px] rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      fileInputMode === 'upload'
                        ? 'bg-[#FFFFFF] text-[#14532D] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    Upload from Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileInputMode('url')}
                    className={`min-h-[36px] rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      fileInputMode === 'url'
                        ? 'bg-[#FFFFFF] text-[#14532D] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    External File Link
                  </button>
                </div>

                {fileInputMode === 'upload' ? (
                  <div className="space-y-2 rounded-lg border border-dashed border-[#CFC6B4] bg-[#FBF9F5] p-4">
                    <label className="flex flex-col items-center gap-2 text-center cursor-pointer">
                      <Upload className="h-5 w-5 text-[#14532D]" aria-hidden="true" />
                      <span className="text-xs font-semibold text-[#1C1917]">
                        Choose PDF, Word, Excel, CSV, TXT, or Photo
                      </span>
                      <span className="text-[11px] text-[#57534E]">
                        Direct uploads up to 500 KB (photos auto-optimize). Use External File Link for larger videos or packs.
                      </span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const picked = e.target.files?.[0];
                          e.target.value = '';
                          void handlePickSchoolFile(picked);
                        }}
                      />
                    </label>
                    {fileForm.fileData && (
                      <div className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2 text-xs text-[#14532D]">
                        <p className="font-mono font-medium truncate">{fileForm.fileName}</p>
                        <p className="mt-0.5 text-[11px]">
                          {getFileExtensionLabel(fileForm.fileName, fileForm.mimeType)} ·{' '}
                          {formatFileSize(fileForm.sizeBytes)} ready
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border border-[#E5DFD3] bg-[#FBF9F5] p-3.5">
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      External Download / Resource URL
                    </label>
                    <input
                      type="url"
                      maxLength={1000}
                      value={fileForm.fileUrl || ''}
                      onChange={(e) =>
                        setFileForm({ ...fileForm, fileUrl: e.target.value, sourceType: 'url' })
                      }
                      placeholder="https://drive.google.com/... or https://.../document.pdf"
                      className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-3 text-sm"
                    />
                    <p className="text-[11px] text-[#57534E]">
                      Ideal for large PDFs, multi-megabyte handbooks, or school event videos.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">Document Title</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={140}
                    value={fileForm.title}
                    onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })}
                    placeholder="e.g. Term II Admissions Form (PDF)"
                    className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">Category</label>
                    <select
                      value={fileForm.category}
                      onChange={(e) =>
                        setFileForm({
                          ...fileForm,
                          category: e.target.value as SchoolFileCategory,
                        })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    >
                      <option value="Forms & Admissions">Forms &amp; Admissions</option>
                      <option value="Curriculum & Booklists">Curriculum &amp; Booklists</option>
                      <option value="Circulars & Notices">Circulars &amp; Notices</option>
                      <option value="Reports & Policies">Reports &amp; Policies</option>
                      <option value="Media & Resources">Media &amp; Resources</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      Download Filename
                    </label>
                    <input
                      type="text"
                      maxLength={180}
                      value={fileForm.fileName}
                      onChange={(e) => setFileForm({ ...fileForm, fileName: e.target.value })}
                      placeholder="e.g. Admissions-2026.pdf"
                      className="mt-1 h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917]">
                    Short Description (for parents &amp; students)
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    maxLength={400}
                    value={fileForm.description}
                    onChange={(e) => setFileForm({ ...fileForm, description: e.target.value })}
                    placeholder="Explain what this file contains and who should download it..."
                    className="mt-1 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fileForm.published}
                    onChange={(e) => setFileForm({ ...fileForm, published: e.target.checked })}
                    className="h-4 w-4 accent-[#14532D]"
                  />
                  <span>Published on public website</span>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-md bg-[#14532D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F3F22] disabled:opacity-60 cursor-pointer"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {saving
                      ? 'Saving...'
                      : editingFileId
                        ? 'Update School File'
                        : 'Save & Publish File'}
                  </span>
                </button>
              </form>

              <div className="space-y-3 lg:col-span-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    Published &amp; Draft School Files ({schoolFiles.length})
                  </h3>
                  {editingFileId && (
                    <button
                      type="button"
                      onClick={resetFileForm}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#14532D] bg-[#FFFFFF] px-3 text-xs font-medium text-[#14532D] hover:bg-[#F3EFE7] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Upload New File</span>
                    </button>
                  )}
                </div>

                {schoolFiles.map((f) => {
                  const ext = getFileExtensionLabel(f.fileName, f.mimeType);
                  const isUrlOnly = f.sourceType === 'url' && !f.fileData;
                  return (
                    <div
                      key={f.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4 sm:flex-row sm:items-start"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-[#57534E]">
                          <span className="font-semibold text-[#14532D]">{f.category}</span>
                          <span> · </span>
                          <span className="font-mono font-medium text-[#1C1917]">{ext}</span>
                          <span> · </span>
                          <span>{formatFileSize(f.sizeBytes)}</span>
                          <span> · </span>
                          <span>{f.published ? 'Published' : 'Draft'}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-[#14532D]" aria-hidden="true" />
                          <h4 className="font-display text-base font-medium text-[#1C1917]">
                            {f.title}
                          </h4>
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-[#57534E]">
                          {f.fileName}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-[#57534E]">{f.description}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => triggerSchoolFileDownload(f)}
                          className="inline-flex h-9 items-center gap-1 rounded-md border border-[#E5DFD3] px-2.5 text-xs font-medium text-[#14532D] hover:bg-[#F3EFE7] cursor-pointer"
                        >
                          {isUrlOnly ? (
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{isUrlOnly ? 'Open' : 'Download'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => loadFileForEdit(f)}
                          className="inline-flex h-9 items-center gap-1 rounded-md border border-[#E5DFD3] px-2.5 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE7] cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await deleteSchoolFile(f.id);
                              if (editingFileId === f.id) {
                                resetFileForm();
                              }
                              notifyOk('School file deleted.');
                            } catch (err) {
                              notifyErr(err);
                            }
                          }}
                          className="inline-flex h-9 items-center gap-1 rounded-md border border-[#FECACA] px-2.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: CALENDAR & BELL SCHEDULE */}
          {tab === 'calendar' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-6">
                <form
                  onSubmit={handleSaveEvent}
                  className="space-y-3 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5"
                >
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    {editingEventId ? 'Edit Calendar Event' : 'Add Calendar Event'}
                  </h3>
                  <input
                    type="text"
                    required
                    placeholder="Event title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Month (DEC)"
                      value={eventForm.monthLabel}
                      onChange={(e) => setEventForm({ ...eventForm, monthLabel: e.target.value })}
                      className="h-10 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Day (04)"
                      value={eventForm.dayNumber}
                      onChange={(e) => setEventForm({ ...eventForm, dayNumber: e.target.value })}
                      className="h-10 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="08:30 – 12:00"
                      value={eventForm.timeRange}
                      onChange={(e) => setEventForm({ ...eventForm, timeRange: e.target.value })}
                      className="h-10 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={eventForm.category}
                      onChange={(e) =>
                        setEventForm({
                          ...eventForm,
                          category: e.target.value as CalendarEvent['category'],
                        })
                      }
                      className="h-10 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    >
                      <option value="Academic Dates">Academic Dates</option>
                      <option value="Parent Meetings">Parent Meetings</option>
                      <option value="Athletics & Clubs">Athletics &amp; Clubs</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Location"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="h-10 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Event details"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-[40px] w-full items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-medium text-white cursor-pointer"
                  >
                    {editingEventId ? 'Update Event' : 'Add Event to Calendar'}
                  </button>
                </form>

                <div className="space-y-2.5">
                  {calendarEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] p-3.5"
                    >
                      <div>
                        <p className="text-xs text-[#14532D]">
                          {ev.monthLabel} {ev.dayNumber} · {ev.category}
                        </p>
                        <p className="text-sm font-medium text-[#1C1917]">{ev.title}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEventId(ev.id);
                            const { id: _id, ...rest } = ev;
                            setEventForm(rest);
                          }}
                          className="rounded border border-[#E5DFD3] px-2 py-1 text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteCalendarEvent(ev.id)}
                          className="rounded border border-[#FECACA] px-2 py-1 text-xs text-[#B91C1C] cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 lg:col-span-6">
                <form
                  onSubmit={handleSaveSlot}
                  className="space-y-3 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5"
                >
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    {editingSlotId ? 'Edit Daily Bell Slot' : 'Add Daily Bell Slot'}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min={1}
                      value={slotForm.order}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, order: Number(e.target.value) || 1 })
                      }
                      placeholder="Order"
                      className="h-10 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={slotForm.time}
                      onChange={(e) => setSlotForm({ ...slotForm, time: e.target.value })}
                      placeholder="07:30 – 07:55"
                      className="col-span-2 h-10 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={slotForm.activity}
                    onChange={(e) => setSlotForm({ ...slotForm, activity: e.target.value })}
                    placeholder="Activity name"
                    className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                  <input
                    type="text"
                    required
                    value={slotForm.notes}
                    onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                    placeholder="Notes (e.g. All grades)"
                    className="h-10 w-full rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-[40px] w-full items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-xs font-medium text-white cursor-pointer"
                  >
                    {editingSlotId ? 'Update Bell Slot' : 'Add Bell Slot'}
                  </button>
                </form>

                <div className="space-y-2">
                  {dailySchedule.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] p-3.5"
                    >
                      <div>
                        <p className="font-mono text-xs text-[#14532D]">{row.time}</p>
                        <p className="text-sm font-medium text-[#1C1917]">{row.activity}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSlotId(row.id);
                            const { id: _id, ...rest } = row;
                            setSlotForm(rest);
                          }}
                          className="rounded border border-[#E5DFD3] px-2 py-1 text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteDailyScheduleSlot(row.id)}
                          className="rounded border border-[#FECACA] px-2 py-1 text-xs text-[#B91C1C] cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ADMISSIONS INQUIRIES INBOX */}
          {tab === 'inquiries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-medium text-[#1C1917]">
                  Parent Admissions Inquiries ({inquiries.length})
                </h3>
              </div>

              {inquiries.length === 0 ? (
                <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-8 text-center text-sm text-[#57534E]">
                  No parent admissions inquiries submitted yet. New inquiries submitted through the
                  website form appear here immediately.
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => {
                    const draftNote = noteDrafts[inq.id] ?? inq.ownerNotes;
                    return (
                      <div
                        key={inq.id}
                        className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="font-mono text-xs text-[#14532D]">
                              {inq.referenceCode} · {inq.createdAtLabel} · {inq.gradeLevel} ·{' '}
                              {inq.inquiryType}
                            </p>
                            <h4 className="mt-1 font-display text-lg font-medium text-[#1C1917]">
                              {inq.parentName}
                            </h4>
                            <p className="text-xs font-medium text-[#57534E]">
                              Contact: <span className="text-[#1C1917]">{inq.contact}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Status for ${inq.parentName}`}
                              value={inq.status}
                              onChange={async (e) => {
                                try {
                                  await updateInquiryStatus(
                                    inq.id,
                                    e.target.value as AdmissionsInquiryRecord['status'],
                                    draftNote,
                                  );
                                  notifyOk(`Updated status for ${inq.parentName}.`);
                                } catch (err) {
                                  notifyErr(err);
                                }
                              }}
                              className="h-9 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-2.5 text-xs font-medium"
                            >
                              <option value="new">New</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="scheduled">Visit Scheduled</option>
                              <option value="archived">Archived</option>
                            </select>

                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await deleteInquiry(inq.id);
                                  notifyOk('Inquiry deleted.');
                                } catch (err) {
                                  notifyErr(err);
                                }
                              }}
                              className="inline-flex h-9 items-center gap-1 rounded-md border border-[#FECACA] px-2.5 text-xs font-medium text-[#B91C1C] cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <p className="mt-3 rounded-lg bg-[#FBF9F5] p-3 text-sm text-[#44403C]">
                          {inq.message}
                        </p>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={draftNote}
                            onChange={(e) =>
                              setNoteDrafts({ ...noteDrafts, [inq.id]: e.target.value })
                            }
                            placeholder="Internal school office notes..."
                            className="h-9 flex-1 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-xs"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateInquiryStatus(inq.id, inq.status, draftNote);
                                notifyOk('Notes saved.');
                              } catch (err) {
                                notifyErr(err);
                              }
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-3 text-xs font-medium hover:bg-[#F3EFE7] cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: ONLINE EXAM RESULTS (CENTRAL SUBMISSION LOG) */}
          {tab === 'exams' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 font-display text-xl font-medium text-[#0B2E50]">
                    <GraduationCap className="h-5 w-5 text-[#1769AA]" aria-hidden="true" />
                    <span>P6 National Exam Submissions ({examSubmissions.length})</span>
                  </h3>
                  <p className="mt-1 text-xs text-[#57534E]">
                    Central score ledger saved automatically whenever learners submit the P6 Science
                    &amp; Technology Online Exam.
                  </p>
                </div>
              </div>

              {examSubmissions.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-4">
                    <p className="text-xs font-medium text-[#57534E]">Total Submissions</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-[#123D68] tabular-figures">
                      {examSubmissions.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-4">
                    <p className="text-xs font-medium text-[#57534E]">Average Score</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-[#1769AA] tabular-figures">
                      {Math.round(
                        examSubmissions.reduce((acc, s) => acc + s.percentage, 0) /
                          examSubmissions.length,
                      )}
                      %
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-4">
                    <p className="text-xs font-medium text-[#57534E]">Highest Score</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-[#14532D] tabular-figures">
                      {Math.max(...examSubmissions.map((s) => s.score))} / 50
                    </p>
                  </div>
                </div>
              )}

              {examSubmissions.length === 0 ? (
                <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-8 text-center text-sm text-[#57534E]">
                  No P6 online exam submissions recorded yet. Student results appear here
                  automatically once submitted in the Online Exam section.
                </div>
              ) : (
                <div className="space-y-3">
                  {examSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-5 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-mono text-xs font-medium text-[#1769AA] tabular-figures">
                          {sub.referenceCode} · {sub.createdAtLabel} · Exam Date: {sub.examDate}
                        </p>
                        <h4 className="mt-1 font-display text-lg font-medium text-[#0B2E50]">
                          {sub.studentName}{' '}
                          <span className="font-sans text-xs font-normal text-[#57534E]">
                            ({sub.className}
                            {sub.candidateNumber ? ` · #${sub.candidateNumber}` : ''})
                          </span>
                        </h4>
                        <p className="mt-0.5 text-xs text-[#57534E]">
                          {sub.schoolName} · {sub.sector} Sector, {sub.district} District
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p
                            className={`font-display text-xl font-semibold tabular-figures ${
                              sub.percentage >= 70 ? 'text-[#14532D]' : 'text-[#123D68]'
                            }`}
                          >
                            {sub.score} / {sub.totalQuestions} ({sub.percentage}%)
                          </p>
                          <p className="font-mono text-[11px] text-[#57534E] tabular-figures">
                            Time: {Math.floor(sub.elapsedSeconds / 60)}m{' '}
                            {String(sub.elapsedSeconds % 60).padStart(2, '0')}s · Unanswered:{' '}
                            {sub.unansweredCount}
                          </p>
                        </div>

                        <button
                          type="button"
                          aria-label={`Delete exam result for ${sub.studentName}`}
                          onClick={async () => {
                            try {
                              await deleteExamSubmission(sub.id);
                              notifyOk('Exam submission deleted.');
                            } catch (err) {
                              notifyErr(err);
                            }
                          }}
                          className="inline-flex h-9 items-center gap-1 rounded-md border border-[#FECACA] px-2.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: LOGIN & ACCESS DETAILS */}
          {tab === 'access' && (
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-6">
                <h3 className="font-display text-xl font-medium text-[#1C1917]">
                  Active Owner Login Details
                </h3>
                <dl className="mt-4 divide-y divide-[#E5DFD3] text-sm">
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-xs font-medium text-[#57534E]">Signed-In Account</dt>
                    <dd className="font-mono text-xs font-medium text-[#1C1917]">{user?.email}</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-xs font-medium text-[#57534E]">Role</dt>
                    <dd className="text-xs font-semibold text-[#14532D]">
                      {isPrimaryOwner ? 'Primary School Owner' : 'Authorized Co-Administrator'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-xs font-medium text-[#57534E]">Primary Owner Email</dt>
                    <dd className="font-mono text-xs text-[#1C1917]">{PRIMARY_OWNER_EMAIL}</dd>
                  </div>
                </dl>
              </div>

              {isPrimaryOwner && (
                <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-6">
                  <h3 className="font-display text-lg font-medium text-[#1C1917]">
                    Co-Administrator Google Accounts
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
                    Grant Deputy Head Teachers or School Secretaries permission to sign in with
                    their Google email and manage posts, calendar dates, and faculty records.
                  </p>

                  <form onSubmit={handleAddCoAdmin} className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="colleague@gmail.com"
                      className="h-10 flex-1 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                    <input
                      type="text"
                      value={newAdminLabel}
                      onChange={(e) => setNewAdminLabel(e.target.value)}
                      placeholder="Role label (e.g. Deputy Head)"
                      className="h-10 sm:w-52 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] px-3 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-[#14532D] px-4 text-xs font-medium text-white hover:bg-[#0F3F22] whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Add Access</span>
                    </button>
                  </form>

                  <div className="mt-5 divide-y divide-[#E5DFD3] border-t border-[#E5DFD3]">
                    {adminEmails.length === 0 ? (
                      <p className="pt-4 text-xs text-[#57534E]">
                        Only the primary owner ({PRIMARY_OWNER_EMAIL}) currently has editing access.
                      </p>
                    ) : (
                      adminEmails.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-4 py-3 text-xs"
                        >
                          <div>
                            <p className="font-mono font-medium text-[#1C1917]">{entry.email}</p>
                            <p className="text-[#57534E]">{entry.label}</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await removeCoAdminEmail(entry.email);
                                notifyOk(`Revoked access for ${entry.email}.`);
                              } catch (err) {
                                notifyErr(err);
                              }
                            }}
                            className="rounded border border-[#FECACA] px-2.5 py-1 text-xs font-medium text-[#B91C1C] cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'approvals' && (
            <OwnerApprovalsPanel notifyOk={notifyOk} notifyErr={notifyErr} />
          )}

          {tab === 'roster' && (
            <OwnerRosterPanel notifyOk={notifyOk} notifyErr={notifyErr} />
          )}

          {tab === 'background' && (
            <OwnerBackgroundPanel notifyOk={notifyOk} notifyErr={notifyErr} />
          )}
        </div>
      </div>
    </div>
  );
}
