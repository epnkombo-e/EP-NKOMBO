import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  RWANDA_QUICK_CODES,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '../i18n/translations';

export function LanguageBar() {
  const { language, setLanguage, t } = useLanguage();

  const rwandaLanguages = SUPPORTED_LANGUAGES.filter((l) => l.region === 'rwanda');
  const europeLanguages = SUPPORTED_LANGUAGES.filter((l) => l.region === 'europe');

  return (
    <div className="border-b border-[#E5DFD3] bg-[#F3EFE7]/65 px-5 py-2.5 sm:px-8">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] whitespace-nowrap">
            <Globe className="h-3.5 w-3.5 text-[#14532D]" aria-hidden="true" />
            <span>{t.langBarLabel}</span>
          </span>

          <div
            role="group"
            aria-label={t.langRwandaGroup}
            className="flex flex-wrap items-center gap-1 rounded-md border border-[#E5DFD3] bg-[#FBF9F5] p-0.5"
          >
            {RWANDA_QUICK_CODES.map((code) => {
              const meta = rwandaLanguages.find((l) => l.code === code);
              if (!meta) return null;
              const active = language === code;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLanguage(code)}
                  className={`min-h-[30px] rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#14532D] ${
                    active
                      ? 'bg-[#14532D] text-white'
                      : 'text-[#44403C] hover:bg-[#F3EFE7] hover:text-[#1C1917]'
                  }`}
                >
                  {meta.nativeName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="site-language-select"
            className="text-xs font-medium text-[#57534E] whitespace-nowrap"
          >
            {t.langEuropeGroup}:
          </label>
          <select
            id="site-language-select"
            aria-label={t.langBarLabel}
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="h-8 rounded-md border border-[#D6CEBE] bg-[#FFFFFF] px-2.5 text-xs font-medium text-[#1C1917] focus:border-[#14532D] focus:outline-none cursor-pointer"
          >
            <optgroup label={t.langRwandaGroup}>
              {rwandaLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.englishName})
                </option>
              ))}
            </optgroup>
            <optgroup label={t.langEuropeGroup}>
              {europeLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.englishName})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  );
}
