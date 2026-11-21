import { Globe, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  RWANDA_QUICK_CODES,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '../i18n/translations';

export function LanguageBar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const rwandaLanguages = SUPPORTED_LANGUAGES.filter((l) => l.region === 'rwanda');
  const europeLanguages = SUPPORTED_LANGUAGES.filter((l) => l.region === 'europe');

  return (
    <div className="border-b border-[#D4DFEB] bg-[#EDF4FA] px-5 py-2.5 dark:border-[#1E334D] dark:bg-[#0B1728] sm:px-8">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#123D68] dark:text-[#93C5FD] whitespace-nowrap">
            <Globe className="h-3.5 w-3.5 text-[#1769AA] dark:text-[#60A5FA]" aria-hidden="true" />
            <span>{t.langBarLabel}</span>
          </span>

          <div
            role="group"
            aria-label={t.langRwandaGroup}
            className="flex flex-wrap items-center gap-1 rounded-md border border-[#CBD8E6] bg-[#FFFFFF] p-0.5 dark:border-[#1E334D] dark:bg-[#13253D]"
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
                  className={`min-h-[30px] rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1769AA] ${
                    active
                      ? 'bg-[#123D68] text-white dark:bg-[#1769AA]'
                      : 'text-[#334155] hover:bg-[#EDF4FA] hover:text-[#0B2E50] dark:text-[#CBD5E1] dark:hover:bg-[#1A3150] dark:hover:text-white'
                  }`}
                >
                  {meta.nativeName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="site-language-select"
              className="text-xs font-medium text-[#123D68] dark:text-[#93C5FD] whitespace-nowrap"
            >
              {t.langEuropeGroup}:
            </label>
            <select
              id="site-language-select"
              aria-label={t.langBarLabel}
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="h-8 rounded-md border border-[#CBD8E6] bg-[#FFFFFF] px-2.5 text-xs font-medium text-[#0B2E50] focus:border-[#1769AA] focus:outline-none dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] cursor-pointer"
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

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#CBD8E6] bg-white px-3 text-xs font-medium text-[#0B2E50] transition-colors hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#F2B544] dark:hover:bg-[#1A3150] whitespace-nowrap cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#1769AA]" aria-hidden="true" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
