import { useMemo, useState } from 'react';
import { Check, Download, ExternalLink, FileText, Plus } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import { type SchoolFileCategory, type SchoolFileRecord } from '../data/schoolData';
import {
  formatFileSize,
  getFileExtensionLabel,
  triggerSchoolFileDownload,
} from '../lib/fileUtils';

type FileFilter = 'All Files' | SchoolFileCategory;

const FILE_CATEGORIES: SchoolFileCategory[] = [
  'Forms & Admissions',
  'Curriculum & Booklists',
  'Circulars & Notices',
  'Reports & Policies',
  'Media & Resources',
];

interface DocumentsSectionProps {
  onUploadFileClick: () => void;
}

export function DocumentsSection({ onUploadFileClick }: DocumentsSectionProps) {
  const { schoolFiles, schoolFilesLoading, isAdmin } = useSchoolData();
  const { t, localizeCategory } = useLanguage();
  const [filter, setFilter] = useState<FileFilter>('All Files');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const visibleFiles = useMemo(() => {
    const base = isAdmin ? schoolFiles : schoolFiles.filter((f) => f.published);
    if (filter === 'All Files') return base;
    return base.filter((f) => f.category === filter);
  }, [schoolFiles, isAdmin, filter]);

  const handleDownload = (file: SchoolFileRecord) => {
    const ok = triggerSchoolFileDownload(file);
    if (ok) {
      setDownloadedId(file.id);
      window.setTimeout(() => {
        setDownloadedId((prev) => (prev === file.id ? null : prev));
      }, 2200);
    }
  };

  return (
    <section
      id="documents"
      className="border-b border-[#D4DFEB] bg-[#FFFFFF] py-16 dark:border-[#1E334D] dark:bg-[#081322] sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Header & Category Tabs */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#1769AA] dark:text-[#60A5FA] uppercase">
              {t.files.kicker}
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] sm:text-4xl [text-wrap:balance]">
              {t.files.heading}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
              {t.files.intro}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={onUploadFileClick}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-[#123D68] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#0B2E50] dark:bg-[#1769AA] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.files.uploadBtn}</span>
              </button>
            )}

            <div
              role="tablist"
              aria-label="Filter school documents by category"
              className="flex flex-wrap gap-1.5 rounded-lg border border-[#D4DFEB] bg-[#EDF4FA] p-1.5 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
            >
              <button
                role="tab"
                aria-selected={filter === 'All Files'}
                type="button"
                onClick={() => setFilter('All Files')}
                className={`min-h-[40px] rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                  filter === 'All Files'
                    ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                    : 'text-[#334155] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                }`}
              >
                {t.files.filterAll}
              </button>
              {FILE_CATEGORIES.map((category) => {
                const active = filter === category;
                return (
                  <button
                    key={category}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setFilter(category)}
                    className={`min-h-[40px] rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                      active
                        ? 'bg-[#123D68] text-white shadow-xs dark:bg-[#1769AA]'
                        : 'text-[#334155] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:text-white'
                    }`}
                  >
                    {localizeCategory(category)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading / Empty States */}
        {schoolFilesLoading && visibleFiles.length === 0 ? (
          <div className="mt-10 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-10 text-center dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <p className="text-sm font-medium text-[#475569] dark:text-[#94A3B8]">{t.files.loading}</p>
          </div>
        ) : visibleFiles.length === 0 ? (
          <div className="mt-10 rounded-xl border border-[#D4DFEB] bg-[#FFFFFF] p-10 text-center dark:border-[#1E334D] dark:bg-[#0D1B2D]">
            <p className="text-sm font-medium text-[#0B2E50] dark:text-[#EAF1F8]">{t.files.empty}</p>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">{t.files.emptyHint}</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {visibleFiles.map((file) => {
              const ext = getFileExtensionLabel(file.fileName, file.mimeType);
              const isExternal = file.sourceType === 'url' && !file.fileData;
              const isDone = downloadedId === file.id;

              return (
                <article
                  key={file.id}
                  className="flex flex-col justify-between gap-5 rounded-xl border border-[#D4DFEB] bg-[#F8FAFD] p-6 dark:border-[#1E334D] dark:bg-[#0D1B2D]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span className="font-semibold text-[#1769AA] dark:text-[#60A5FA]">
                        {localizeCategory(file.category)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-medium text-[#0B2E50] dark:text-[#E7EFF8]">{ext}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-figures">{formatFileSize(file.sizeBytes)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-figures">{file.displayDate}</span>
                      {!file.published && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                            {t.posts.draftOwnerOnly}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-3 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#CBD8E6] bg-[#FFFFFF] text-[#1769AA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#60A5FA]">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg leading-snug font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
                          {file.title}
                        </h3>
                        <p className="mt-1 truncate font-mono text-[11px] text-[#475569] dark:text-[#94A3B8]">
                          {file.fileName}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                      {file.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-end border-t border-[#D4DFEB] pt-4 dark:border-[#1E334D]">
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className={`inline-flex min-h-[40px] items-center gap-2 rounded-md border px-4 py-2 text-xs font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                        isDone
                          ? 'border-[#14532D] bg-[#14532D] text-white'
                          : 'border-[#CBD8E6] bg-[#FFFFFF] text-[#123D68] hover:bg-[#123D68] hover:text-white dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#93C5FD] dark:hover:bg-[#1769AA] dark:hover:text-white'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.files.downloadedLabel}</span>
                        </>
                      ) : isExternal ? (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.files.externalLinkLabel}</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.files.downloadBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
