import { useState } from 'react';
import { Bell, Menu, UserCircle2, X } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { usePortalFeatures } from '../context/PortalFeaturesContext';
import { useLanguage } from '../context/LanguageContext';
import { CircleAvatar } from './CircleAvatar';

interface HeaderProps {
  onProfileButtonClick: () => void;
}

export function Header({ onProfileButtonClick }: HeaderProps) {
  const { settings, user, isAdmin } = useSchoolData();
  const { userProfile, unreadNotificationsCount } = usePortalFeatures();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#library', label: 'Library' },
    { href: '#ai-studio', label: 'AI & REB' },
    { href: '#performance', label: 'Performance' },
    { href: '#sports', label: 'Sports' },
    { href: '#exam', label: t.nav.exam },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#D4DFEB] bg-[#FFFFFF]/95 backdrop-blur-sm dark:border-[#1E334D] dark:bg-[#0A1626]/95">
      <div className="h-1 w-full bg-gradient-to-r from-[#0B2E50] via-[#1769AA] to-[#14532D]" />
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-semibold tracking-tight text-[#0B2E50] dark:text-[#EAF1F8] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769AA]"
        >
          {settings.schoolName}
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#475569] transition-colors duration-150 hover:text-[#0B2E50] hover:underline hover:underline-offset-8 hover:decoration-[#1769AA] dark:text-[#94A3B8] dark:hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769AA]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Circle Profile / Login Trigger + Mobile Hamburger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onProfileButtonClick}
            aria-label={user ? 'Open Circle Profile & Notifications' : t.nav.ownerLogin}
            className="relative hidden sm:inline-flex items-center gap-2 rounded-full border border-[#CBD8E6] bg-[#F6F9FC] py-1 pr-3.5 pl-1 text-xs font-semibold text-[#0B2E50] transition-colors hover:border-[#1769AA] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:hover:bg-[#1A3150] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {user ? (
              <CircleAvatar
                name={userProfile?.displayName || user.displayName || user.email || 'User'}
                avatarType={userProfile?.avatarType}
                avatarValue={userProfile?.avatarValue}
                photoDataUrl={userProfile?.photoDataUrl}
                size="sm"
              />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#123D68] text-white">
                <UserCircle2 className="h-4 w-4" />
              </span>
            )}
            <span>
              {isAdmin ? t.nav.ownerStudio : user ? (userProfile?.displayName?.split(' ')[0] || t.nav.account) : 'Profile / Login'}
            </span>
            {unreadNotificationsCount > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F2B544] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0B2E50]">
                <Bell className="h-2.5 w-2.5" />
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D4DFEB] bg-[#F6F9FC] text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] md:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#D4DFEB] bg-[#FFFFFF] px-5 py-4 dark:border-[#1E334D] dark:bg-[#0D1B2D] md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="flex min-h-[44px] items-center rounded-md px-3 text-base font-medium text-[#0B2E50] hover:bg-[#EDF4FA] dark:text-[#E7EFF8] dark:hover:bg-[#13253D] whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onProfileButtonClick();
              }}
              className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#123D68] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0B2E50] whitespace-nowrap cursor-pointer"
            >
              <span>{user ? 'Open Circle Profile' : 'Profile / Login'}</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
