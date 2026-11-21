import { useState, type FormEvent } from 'react';
import { Check, CheckCircle2, Image as ImageIcon, Plus, Sparkles, Trash2, Upload, Users, XCircle } from 'lucide-react';
import {
  HERO_BG_PRESETS,
  LIBRARY_SUBJECTS,
  SCHOOL_CLASSES,
  type HeroBgMode,
} from '../data/portalCatalog';
import { useSchoolData } from '../context/SchoolDataContext';
import { usePortalFeatures } from '../context/PortalFeaturesContext';
import { compressImageToDataUrl } from '../lib/fileUtils';

interface PanelCallbacks {
  notifyOk: (text: string) => void;
  notifyErr: (err: unknown) => void;
}

export function OwnerApprovalsPanel({ notifyOk, notifyErr }: PanelCallbacks) {
  const { posts, approvePost, rejectPost } = useSchoolData();
  const {
    libraryItems,
    approveLibraryItem,
    rejectLibraryItem,
    sportsItems,
    approveSportsItem,
    rejectSportsItem,
  } = usePortalFeatures();

  const pendingPosts = posts.filter((p) => p.approvalStatus === 'pending');
  const pendingLibrary = libraryItems.filter((l) => l.approvalStatus === 'pending');
  const pendingSports = sportsItems.filter((s) => s.approvalStatus === 'pending');

  const totalPending = pendingPosts.length + pendingLibrary.length + pendingSports.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-[#D4DFEB] bg-white p-5">
        <h3 className="font-display text-xl font-medium text-[#0B2E50]">
          Teacher Uploads & Posts Approval Queue ({totalPending} pending)
        </h3>
        <p className="mt-1 text-xs text-[#475569]">
          Items submitted by teachers stay hidden from the public until you approve and publish them.
        </p>
      </div>

      {totalPending === 0 ? (
        <div className="rounded-xl border border-dashed border-[#CBD8E6] bg-white p-10 text-center text-sm text-[#475569]">
          No pending teacher submissions right now. All approved content is live!
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPosts.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#F2B544] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[#1769AA] uppercase">
                    SCHOOL POST · {p.category} · By {p.authorName} ({p.authorEmail})
                  </span>
                  <h4 className="mt-1 font-display text-lg font-medium text-[#0B2E50]">{p.title}</h4>
                  <p className="mt-1 text-xs text-[#475569]">{p.summary}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await approvePost(p.id);
                        notifyOk(`Approved and published post "${p.title}".`);
                      } catch (e) {
                        notifyErr(e);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-[#14532D] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await rejectPost(p.id);
                        notifyOk(`Rejected post "${p.title}".`);
                      } catch (e) {
                        notifyErr(e);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[#FECACA] px-3 py-1.5 text-xs font-semibold text-[#B91C1C] cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pendingLibrary.map((item) => (
            <div key={item.id} className="rounded-xl border border-[#F2B544] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[#1769AA] uppercase">
                    LIBRARY {item.itemType} · {item.subject} ({item.gradeLevel}) · By {item.submittedByName}
                  </span>
                  <h4 className="mt-1 font-display text-lg font-medium text-[#0B2E50]">{item.title}</h4>
                  <p className="mt-1 text-xs text-[#475569]">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await approveLibraryItem(item.id);
                        notifyOk(`Approved library item "${item.title}".`);
                      } catch (e) {
                        notifyErr(e);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-[#14532D] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await rejectLibraryItem(item.id);
                        notifyOk(`Rejected library item "${item.title}".`);
                      } catch (e) {
                        notifyErr(e);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[#FECACA] px-3 py-1.5 text-xs font-semibold text-[#B91C1C] cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {pendingSports.map((sp) => (
            <div key={sp.id} className="rounded-xl border border-[#F2B544] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[#14532D] uppercase">
                    {sp.activityType} · {sp.eventDate} · By {sp.submittedByName}
                  </span>
                  <h4 className="mt-1 font-display text-lg font-medium text-[#0B2E50]">{sp.title}</h4>
                  <p className="mt-1 text-xs text-[#475569]">{sp.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await approveSportsItem(sp.id);
                        notifyOk(`Approved sports/entertainment item "${sp.title}".`);
                      } catch (e) {
                        notifyErr(e);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-[#14532D] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await rejectSportsItem(sp.id);
                        notifyOk(`Rejected "${sp.title}".`);
                      } catch (e) {
                        notifyErr(e);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[#FECACA] px-3 py-1.5 text-xs font-semibold text-[#B91C1C] cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OwnerRosterPanel({ notifyOk, notifyErr }: PanelCallbacks) {
  const { studentRecords, saveStudentRecord, bulkImportStudents, deleteStudentRecord } =
    usePortalFeatures();

  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('P6');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [studentCode, setStudentCode] = useState('');
  const [term1Avg, setTerm1Avg] = useState(80);
  const [term2Avg, setTerm2Avg] = useState(84);
  const [term3Avg, setTerm3Avg] = useState(88);
  const [pleAvg, setPleAvg] = useState(90);
  const [subjectScores, setSubjectScores] = useState<Record<string, number>>({
    IKINYARWANDA: 88,
    MATHEMATICS: 85,
    SET: 87,
    SRE: 86,
    ENGLISH: 84,
    FRENCH: 80,
  });

  const [csvText, setCsvText] = useState(
    'Aline Uwase, P6, Female, 86, 89, 92, 94, 90, 91, 88, 93\nEric Habakurama, P6, Male, 82, 85, 89, 91, 87, 89, 85, 88',
  );
  const [busy, setBusy] = useState(false);

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveStudentRecord({
        studentName,
        className,
        gender,
        studentCode,
        term1Avg,
        term2Avg,
        term3Avg,
        pleAvg: className === 'P6' ? pleAvg : 0,
        subjectScores,
      });
      setStudentName('');
      setStudentCode('');
      notifyOk(`Saved ${studentName} (${className}, ${gender}) and updated class performance charts.`);
    } catch (err) {
      notifyErr(err);
    } finally {
      setBusy(false);
    }
  };

  const handleBulkCsvImport = async () => {
    setBusy(true);
    try {
      const lines = csvText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const parsed = lines.map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        const name = cols[0] || 'Student';
        const cls = cols[1] || 'P6';
        const g: 'Female' | 'Male' = cols[2]?.toLowerCase().startsWith('m') ? 'Male' : 'Female';
        const t1 = Number(cols[3]) || 0;
        const t2 = Number(cols[4]) || 0;
        const t3 = Number(cols[5]) || 0;
        const ple = Number(cols[6]) || 0;
        const math = Number(cols[7]) || t3;
        const setScore = Number(cols[8]) || t3;
        const eng = Number(cols[9]) || t3;
        const kin = Number(cols[10]) || t3;

        return {
          studentName: name,
          className: cls,
          gender: g,
          term1Avg: t1,
          term2Avg: t2,
          term3Avg: t3,
          pleAvg: cls === 'P6' ? ple : 0,
          subjectScores: {
            MATHEMATICS: math,
            SET: setScore,
            ENGLISH: eng,
            IKINYARWANDA: kin,
          },
        };
      });

      const count = await bulkImportStudents(parsed);
      notifyOk(`Imported ${count} students and automatically recalculated Class & Gender Performance!`);
    } catch (err) {
      notifyErr(err);
    } finally {
      setBusy(false);
    }
  };

  const handleCsvFileUpload = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-5">
        <form onSubmit={handleAddStudent} className="space-y-3 rounded-xl border border-[#D4DFEB] bg-white p-5">
          <h3 className="flex items-center gap-2 font-display text-lg font-medium text-[#0B2E50]">
            <Users className="h-4 w-4 text-[#1769AA]" />
            <span>Add Student with Gender & Subject Marks</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#475569]">Student Full Name</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Keza Aline"
                className="mt-1 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569]">Class</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-sm"
              >
                {SCHOOL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569]">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'Female' | 'Male')}
                className="mt-1 h-10 w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-sm"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569]">Term 1 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={term1Avg}
                onChange={(e) => setTerm1Avg(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569]">Term 2 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={term2Avg}
                onChange={(e) => setTerm2Avg(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569]">Term 3 (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={term3Avg}
                onChange={(e) => setTerm3Avg(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569]">National PLE (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={pleAvg}
                onChange={(e) => setPleAvg(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] px-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-[#475569]">Subject Marks (0–100)</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {LIBRARY_SUBJECTS.slice(0, 6).map((subj) => (
                <div key={subj.id}>
                  <label className="block truncate text-[10px] font-medium text-[#64748B]">
                    {subj.shortLabel}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={subjectScores[subj.id] ?? 80}
                    onChange={(e) =>
                      setSubjectScores((prev) => ({
                        ...prev,
                        [subj.id]: Number(e.target.value) || 0,
                      }))
                    }
                    className="mt-0.5 h-8 w-full rounded border border-[#CBD8E6] bg-[#F6F9FC] px-2 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-md bg-[#123D68] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B2E50] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Save Student & Update Analytics</span>
          </button>
        </form>

        {/* Bulk CSV Roster Importer */}
        <div className="space-y-3 rounded-xl border border-[#D4DFEB] bg-white p-5">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-base font-medium text-[#0B2E50]">
              Bulk CSV Class List Upload
            </h4>
            <label className="inline-flex items-center gap-1 rounded border border-[#CBD8E6] px-2.5 py-1 text-[11px] font-medium text-[#123D68] cursor-pointer">
              <Upload className="h-3 w-3" />
              <span>Load .csv</span>
              <input
                type="file"
                accept=".csv,.txt"
                className="sr-only"
                onChange={(e) => void handleCsvFileUpload(e.target.files?.[0])}
              />
            </label>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Format: Name, Class, Gender, T1, T2, T3, PLE, Math, SET, English, Ikinyarwanda
          </p>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] p-2.5 font-mono text-[11px]"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleBulkCsvImport()}
            className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-md bg-[#14532D] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0F3F22] cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Student List & Recalculate Performance</span>
          </button>
        </div>
      </div>

      {/* Recorded Students Roster List */}
      <div className="space-y-3 lg:col-span-7">
        <div className="flex items-center justify-between rounded-xl border border-[#D4DFEB] bg-white px-5 py-3.5">
          <h3 className="font-display text-lg font-medium text-[#0B2E50]">
            Recorded Students ({studentRecords.length})
          </h3>
          <span className="font-mono text-xs text-[#14532D]">
            F: {studentRecords.filter((r) => r.gender === 'Female').length} · M:{' '}
            {studentRecords.filter((r) => r.gender === 'Male').length}
          </span>
        </div>

        {studentRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#CBD8E6] bg-white p-10 text-center text-xs text-[#64748B]">
            Add individual students or paste a CSV roster on the left. Live class averages & gender statistics update immediately in the Performance section.
          </div>
        ) : (
          <div className="max-h-[540px] space-y-2.5 overflow-y-auto">
            {studentRecords.map((stu) => (
              <div
                key={stu.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#D4DFEB] bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0B2E50]">
                    {stu.studentName}{' '}
                    <span className="ml-1.5 rounded bg-[#EDF4FA] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#123D68]">
                      {stu.className} · {stu.gender}
                    </span>
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#475569] tabular-figures">
                    T1: {stu.term1Avg}% · T2: {stu.term2Avg}% · T3: {stu.term3Avg}%
                    {stu.pleAvg > 0 ? ` · PLE: ${stu.pleAvg}%` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteStudentRecord(stu.id);
                      notifyOk(`Removed ${stu.studentName}.`);
                    } catch (e) {
                      notifyErr(e);
                    }
                  }}
                  className="rounded border border-[#FECACA] p-2 text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function OwnerBackgroundPanel({ notifyOk, notifyErr }: PanelCallbacks) {
  const { settings, saveSchoolSettings } = useSchoolData();

  const [bgMode, setBgMode] = useState<HeroBgMode>(settings.heroBgMode || 'default');
  const [customImage, setCustomImage] = useState(settings.heroBgImage || '');
  const [overlay, setOverlay] = useState(settings.heroBgOverlay ?? 60);
  const [aiNotes, setAiNotes] = useState(settings.aiLessonTrainerNotes || '');
  const [busy, setBusy] = useState(false);

  const handleUploadBg = async (file: File | undefined) => {
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 1280, 0.78);
      setCustomImage(compressed);
      setBgMode('custom');
      notifyOk('Background photo ready — click "Save Home Background" below to publish.');
    } catch (err) {
      notifyErr(err);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveSchoolSettings({
        ...settings,
        heroBgMode: bgMode,
        heroBgImage: customImage,
        heroBgOverlay: overlay,
        aiLessonTrainerNotes: aiNotes,
      });
      notifyOk('Updated Home Page background & AI Lesson Plan training rules!');
    } catch (err) {
      notifyErr(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-[#D4DFEB] bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#1769AA]" />
          <h3 className="font-display text-xl font-medium text-[#0B2E50]">
            Customize Home Page Background
          </h3>
        </div>
        <p className="text-xs text-[#475569]">
          Choose a curated Nkombo campus scene, gradient backdrop, or upload your own photo for the Home Page hero backdrop.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {HERO_BG_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setBgMode(preset.id)}
              className={`rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                bgMode === preset.id
                  ? 'border-[#1769AA] bg-[#EDF4FA]'
                  : 'border-[#D4DFEB] bg-[#F6F9FC] hover:border-[#123D68]'
              }`}
            >
              <p className="text-xs font-semibold text-[#0B2E50]">{preset.label}</p>
              <p className="mt-0.5 text-[11px] text-[#475569]">{preset.description}</p>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-[#CBD8E6] bg-[#F6F9FC] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#0B2E50]">
              Or Upload Custom Home Background Photo / Paste URL
            </span>
            <label className="inline-flex items-center gap-1.5 rounded-md bg-[#123D68] px-3 py-1.5 text-xs font-medium text-white cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => void handleUploadBg(e.target.files?.[0])}
              />
            </label>
          </div>
          <input
            type="text"
            value={customImage}
            onChange={(e) => {
              setCustomImage(e.target.value);
              if (e.target.value.trim()) setBgMode('custom');
            }}
            placeholder="https://... or uploaded image data URL"
            className="h-9 w-full rounded-md border border-[#CBD8E6] bg-white px-3 text-xs"
          />
          <div>
            <label className="block text-xs font-medium text-[#475569]">
              Text Readability Tint Overlay: {overlay}%
            </label>
            <input
              type="range"
              min={15}
              max={85}
              value={overlay}
              onChange={(e) => setOverlay(Number(e.target.value))}
              className="mt-1 w-full accent-[#123D68]"
            />
          </div>
        </div>
      </div>

      {/* AI Lesson Plan Trainer Default Rules */}
      <div className="rounded-xl border border-[#D4DFEB] bg-white p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#14532D]" />
          <h3 className="font-display text-lg font-medium text-[#0B2E50]">
            AI Lesson Plan Trainer Default School Rules
          </h3>
        </div>
        <textarea
          rows={4}
          value={aiNotes}
          onChange={(e) => setAiNotes(e.target.value)}
          className="w-full rounded-md border border-[#CBD8E6] bg-[#F6F9FC] p-3 text-xs leading-relaxed"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-md bg-[#123D68] px-6 py-2 text-xs font-semibold text-white hover:bg-[#0B2E50] cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4 text-[#F2B544]" />
          <span>{busy ? 'Saving...' : 'Save Home Background & AI Rules'}</span>
        </button>
      </div>
    </form>
  );
}
