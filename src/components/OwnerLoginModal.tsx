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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-[#E5DFD3] bg-[#FBF9F5] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD3] px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#14532D]">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            <span>{t.login.portalTag}</span>
          </div>
          <button
            type="button"
            aria-label="Close login modal"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E5DFD3] bg-[#FFFFFF] text-[#1C1917] hover:bg-[#F3EFE7] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 sm:p-7">
          <h2 id="owner-login-title" className="font-display text-2xl font-medium text-[#1C1917]">
            {t.login.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#44403C]">
            {t.login.desc}
          </p>

          {/* Login Details Summary Box */}
          <dl className="mt-5 divide-y divide-[#E5DFD3] rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] text-sm">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs font-medium text-[#57534E]">{t.login.primaryEmailLabel}</dt>
              <dd className="font-mono text-xs font-medium text-[#1C1917]">
                {PRIMARY_OWNER_EMAIL}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs font-medium text-[#57534E]">{t.login.authMethodLabel}</dt>
              <dd className="text-xs font-medium text-[#1C1917]">
                {t.login.authMethodVal}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-xs font-medium text-[#57534E]">{t.login.coAdminLabel}</dt>
              <dd className="text-xs text-[#57534E]">
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
              <div className="rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] p-4">
                <div className="flex items-start gap-3">
                  {isAdmin ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#14532D]" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B91C1C]" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#1C1917]">
                      Signed in as {user.displayName || user.email}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-[#57534E]">{user.email}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#44403C]">
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
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0F3F22] whitespace-nowrap cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{t.login.openStudioBtn}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={busy}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#1C1917] hover:bg-[#F3EFE7] whitespace-nowrap cursor-pointer"
                >
                  {t.login.switchBtn}
                </button>

                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-[#E5DFD3] bg-[#FFFFFF] px-4 py-2.5 text-sm font-medium text-[#57534E] hover:text-[#1C1917] whitespace-nowrap cursor-pointer"
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
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[#14532D] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0F3F22] disabled:opacity-60 whitespace-nowrap cursor-pointer"
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
