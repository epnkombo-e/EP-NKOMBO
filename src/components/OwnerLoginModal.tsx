import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, LogOut, ShieldCheck, X } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useLanguage } from '../context/LanguageContext';
import { PRIMARY_OWNER_EMAIL } from '../data/schoolData';

interface OwnerLoginModalProps {
  open: boolean;
  onClose: () => void;
  onOpenStudio: () => void;
}

export function OwnerLoginModal({ open, onClose, onOpenStudio }: OwnerLoginModalProps) {
  const { user, isAdmin, isPrimaryOwner, authError, signInWithGoogle, signOutUser } =
    useSchoolData();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleGoogleLogin = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#08223C]/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-[#CBD8E6] bg-[#FFFFFF] shadow-xl dark:border-[#1E334D] dark:bg-[#0D1B2D]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#D4DFEB] px-6 py-4 dark:border-[#1E334D]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#123D68] dark:text-[#93C5FD]">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            <span>{t.login.portalTag}</span>
          </div>
          <button
            type="button"
            aria-label="Close login modal"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#CBD8E6] bg-[#FFFFFF] text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:hover:bg-[#1A3150] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 sm:p-7">
          <h2 id="owner-login-title" className="font-display text-2xl font-medium text-[#0B2E50] dark:text-[#EAF1F8]">
            {t.login.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
            {t.login.desc}
          </p>

          {/* Login Details Summary Box */}
          <dl className="mt-5 divide-y divide-[#D4DFEB] rounded-lg border border-[#D4DFEB] bg-[#F8FAFD] text-sm dark:divide-[#1E334D] dark:border-[#1E334D] dark:bg-[#13253D]">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{t.login.primaryEmailLabel}</dt>
              <dd className="font-mono text-xs font-medium text-[#0B2E50] dark:text-[#E7EFF8]">
                {PRIMARY_OWNER_EMAIL}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{t.login.authMethodLabel}</dt>
              <dd className="text-xs font-medium text-[#0B2E50] dark:text-[#E7EFF8]">
                {t.login.authMethodVal}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">{t.login.coAdminLabel}</dt>
              <dd className="text-xs text-[#475569] dark:text-[#94A3B8]">
                {t.login.coAdminVal}
              </dd>
            </div>
          </dl>

          {authError && (
            <p className="mt-4 flex items-center gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-medium text-[#B91C1C]">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{authError}</span>
            </p>
          )}

          {user ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-[#D4DFEB] bg-[#F8FAFD] p-4 dark:border-[#1E334D] dark:bg-[#13253D]">
                <div className="flex items-start gap-3">
                  {isAdmin ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#14532D] dark:text-[#6EE7B7]" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B91C1C] dark:text-[#FCA5A5]" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#0B2E50] dark:text-[#EAF1F8]">
                      Signed in as {user.displayName || user.email}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-[#475569] dark:text-[#94A3B8]">{user.email}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                      {isPrimaryOwner
                        ? 'Verified Primary Owner access is active. You have full control over all website content, posts, inquiries, and co-admin permissions.'
                        : isAdmin
                          ? 'Verified Co-Administrator access is active. You can edit school records, publish posts, and manage inquiries.'
                          : `This account does not have owner or co-admin permissions. Sign in with ${PRIMARY_OWNER_EMAIL} or ask the primary owner to add your email in Access Settings.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStudio();
                    }}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-[#123D68] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0B2E50] dark:bg-[#1769AA] whitespace-nowrap cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{t.login.openStudioBtn}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={busy}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#CBD8E6] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] whitespace-nowrap cursor-pointer"
                >
                  {t.login.switchBtn}
                </button>

                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-[#CBD8E6] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#475569] hover:text-[#0B2E50] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#CBD5E1] whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>{t.login.signOutBtn}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleLogin}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#123D68] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0B2E50] disabled:opacity-60 dark:bg-[#1769AA] whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>{busy ? t.login.signingInBtn : t.login.signInBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
