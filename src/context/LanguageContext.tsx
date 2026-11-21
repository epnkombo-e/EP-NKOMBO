import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  SUPPORTED_LANGUAGES,
  UI_TRANSLATIONS,
  type LanguageCode,
  type UIStrings,
} from '../i18n/translations';

const STORAGE_KEY = 'epn_language';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: UIStrings;
  localizeCategory: (category: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isSupportedLanguage(val: string | null): val is LanguageCode {
  return Boolean(val && SUPPORTED_LANGUAGES.some((item) => item.code === val));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isSupportedLanguage(saved)) return saved;
    } catch {
      // Ignore storage access restrictions
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage write restrictions
    }
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const t = UI_TRANSLATIONS[language];

  const localizeCategory = useMemo(() => {
    return (category: string): string => {
      switch (category) {
        case 'Announcements':
          return t.posts.filters.announcements;
        case 'Academics':
          return t.posts.filters.academics;
        case 'Community & Events':
          return t.posts.filters.community;
        case 'Achievements':
          return t.posts.filters.achievements;
        case 'Academic Dates':
          return t.calendar.filterAcademic;
        case 'Parent Meetings':
          return t.calendar.filterParent;
        case 'Athletics & Clubs':
          return t.calendar.filterAthletics;
        case 'Administration':
          return t.faculty.administration;
        case 'Lower Primary':
          return t.faculty.lowerPrimary;
        case 'Upper Primary & STEM':
          return t.faculty.upperPrimary;
        case 'Parent':
          return t.testimonials.parentLabel;
        case 'Student':
          return t.testimonials.studentLabel;
        default:
          return category;
      }
    };
  }, [t]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      localizeCategory,
    }),
    [language, t, localizeCategory],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return ctx;
}
