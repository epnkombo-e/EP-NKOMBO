import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  onOwnerButtonClick: () => void;
}

export function Header({ onOwnerButtonClick }: HeaderProps) {
  const { settings, user, isAdmin } = useSchoolData();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#updates', label: t.nav.updates },
    { href: '#academics', label: t.nav.academics },
    { href: '#campus', label: t.nav.campus },
    { href: '#faculty', label: t.nav.faculty },
    { href: '#admissions', label: t.nav.admissions },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const actionLabel = isAdmin ? t.nav.ownerStudio : user ? t.nav.account : t.nav.ownerLogin;

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5DFD3] bg-[#FBF9F5]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-5 sm:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14532D]"
        >
          {settings.schoolName}
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#57534E] transition-colors duration-150 hover:text-[#1C1917] hover:underline hover:underline-offset-8 hover:decoration-[#14532D] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14532D]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action (desktop) + menu button (mobile) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOwnerButtonClick}
            className="hidden sm:inline-flex items-center justify-center rounded-md bg-[#14532D] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#0F3F22] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D] cursor-pointer"
          >
            {actionLabel}
          </button>

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#E5DFD3] bg-[#FBF9F5] text-[#1C1917] md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#E5DFD3] bg-[#FBF9F5] px-5 py-4 md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="flex min-h-[44px] items-center rounded-md px-3 text-base font-medium text-[#1C1917] hover:bg-[#F3EFE7] whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOwnerButtonClick();
              }}
              className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#14532D] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0F3F22] whitespace-nowrap cursor-pointer"
            >
              {actionLabel}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
