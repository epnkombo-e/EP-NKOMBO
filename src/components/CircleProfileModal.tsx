import { useEffect, useState, type FormEvent } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  Eye,
  Lock,
  LogOut,
  Mail,
  Moon,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  AVATAR_OPTIONS,
  STICKER_OPTIONS,
  type AccountKind,
  type AvatarType,
} from '../data/portalCatalog';
import { useSchoolData } from '../context/SchoolDataContext';
import { usePortalFeatures } from '../context/PortalFeaturesContext';
import { useTheme } from '../context/ThemeContext';
import { compressImageToDataUrl } from '../lib/fileUtils';
import { CircleAvatar } from './CircleAvatar';

type ProfileTab = 'profile' | 'appearance' | 'privacy' | 'messages' | 'notifications' | 'settings';

interface CircleProfileModalProps {
  open: boolean;
  onClose: () => void;
  onOpenOwnerStudio: () => void;
}

export function CircleProfileModal({
  open,
  onClose,
  onOpenOwnerStudio,
}: CircleProfileModalProps) {
  const { user, isAdmin, isPrimaryOwner, signInWithGoogle, signOutUser } = useSchoolData();
  const {
    userProfile,
    messages,
    notifications,
    unreadNotificationsCount,
    saveUserProfile,
    sendDirectMessage,
    markMessageRead,
    deleteDirectMessage,
    markNotificationRead,
    markAllNotificationsRead,
  } = usePortalFeatures();
  const { theme, setTheme } = useTheme();

  const [tab, setTab] = useState<ProfileTab>('profile');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [accountKind, setAccountKind] = useState<AccountKind>('teacher');
  const [avatarType, setAvatarType] = useState<AvatarType>('avatar');
  const [avatarValue, setAvatarValue] = useState('avatar-scholar');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [classOrSubject, setClassOrSubject] = useState('');
  const [bio, setBio] = useState('');
  const [privacyShowEmail, setPrivacyShowEmail] = useState(false);
  const [privacyShowPhone, setPrivacyShowPhone] = useState(false);
  const [privacyAllowMessages, setPrivacyAllowMessages] = useState(true);
  const [privacyPublicCircle, setPrivacyPublicCircle] = useState(true);

  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgRecipient, setMsgRecipient] = useState('SCHOOL_OFFICE');

  useEffect(() => {
    if (!open) return;
    setStatusMsg(null);
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setAccountKind(userProfile.accountKind);
      setAvatarType(userProfile.avatarType);
      setAvatarValue(userProfile.avatarValue);
      setPhotoDataUrl(userProfile.photoDataUrl || '');
      setPhone(userProfile.phone || '');
      setClassOrSubject(userProfile.classOrSubject || '');
      setBio(userProfile.bio || '');
      setPrivacyShowEmail(userProfile.privacyShowEmail);
      setPrivacyShowPhone(userProfile.privacyShowPhone);
      setPrivacyAllowMessages(userProfile.privacyAllowMessages);
      setPrivacyPublicCircle(userProfile.privacyPublicCircle);
    } else if (user) {
      setDisplayName(user.displayName || user.email?.split('@')[0] || 'Member');
      setAccountKind(isAdmin ? 'teacher' : 'parent');
    }
  }, [open, userProfile, user, isAdmin]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 360, 0.8);
      setPhotoDataUrl(compressed);
      setAvatarType('photo');
      setStatusMsg({ type: 'ok', text: 'Photo ready! Click "Save Profile" to update your circle avatar.' });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to process uploaded photo.',
      });
    }
  };

  const handleSaveProfile = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.emailVerified) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      await saveUserProfile({
        displayName,
        accountKind,
        avatarType,
        avatarValue,
        photoDataUrl: photoDataUrl || undefined,
        phone,
        classOrSubject,
        bio,
        themeMode: theme,
        privacyShowEmail,
        privacyShowPhone,
        privacyAllowMessages,
        privacyPublicCircle,
      });
      setStatusMsg({ type: 'ok', text: 'Your circular profile, privacy & appearance settings were saved.' });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not save profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim()) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      await sendDirectMessage(msgRecipient, msgSubject, msgBody);
      setMsgSubject('');
      setMsgBody('');
      setStatusMsg({ type: 'ok', text: 'Message sent successfully.' });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to send message.',
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: ProfileTab; label: string; icon: typeof User; badge?: number }[] = [
    { id: 'profile', label: 'Circle & Info', icon: User },
    { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Moon : Sun },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'messages', label: 'Messages', icon: Mail, badge: messages.filter((m) => !m.read).length || undefined },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadNotificationsCount || undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="circle-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#081526]/70 p-3 backdrop-blur-xs sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#CBD8E6] bg-[#FFFFFF] text-[#0F1E33] shadow-2xl dark:border-[#1E334D] dark:bg-[#0D1B2D] dark:text-[#E7EFF8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Large Circular User Avatar */}
        <div className="flex items-center justify-between gap-4 border-b border-[#D4DFEB] bg-[#F6F9FC] px-5 py-4 dark:border-[#1E334D] dark:bg-[#0A1626]">
          <div className="flex items-center gap-4">
            <CircleAvatar
              name={displayName || user?.displayName || 'EP Saint Pierre'}
              avatarType={avatarType}
              avatarValue={avatarValue}
              photoDataUrl={photoDataUrl}
              size="lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="circle-profile-title" className="font-display text-xl font-medium">
                  {user ? displayName || user.displayName || 'Member Profile' : 'Account & Appearance Hub'}
                </h2>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded bg-[#14532D] px-2 py-0.5 text-[11px] font-semibold text-white">
                    <ShieldCheck className="h-3 w-3" />
                    {isPrimaryOwner ? 'Primary Owner' : 'Co-Admin'}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                {user
                  ? `${user.email} · Circular Avatar, Privacy, Messages & Dark/Light Mode`
                  : 'Sign in with Google to customize your circular photo/sticker, send messages, or upload school materials.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close profile modal"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4DFEB] bg-white text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] dark:hover:bg-[#1A3150] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-[#D4DFEB] bg-[#FFFFFF] px-4 py-2 dark:border-[#1E334D] dark:bg-[#0D1B2D]">
          <div className="flex items-center gap-1.5">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setStatusMsg(null);
                  }}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#123D68] text-white dark:bg-[#1769AA]'
                      : 'text-[#475569] hover:bg-[#EDF4FA] hover:text-[#0B2E50] dark:text-[#94A3B8] dark:hover:bg-[#152842] dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F2B544] px-1 font-mono text-[10px] font-bold text-[#0B2E50]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {statusMsg && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium ${
                statusMsg.type === 'ok'
                  ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#14532D] dark:border-[#166534] dark:bg-[#052E16]/60 dark:text-[#86EFAC]'
                  : 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] dark:border-[#7F1D1D] dark:bg-[#450A0A]/60 dark:text-[#FCA5A5]'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {!user && tab !== 'appearance' && tab !== 'notifications' ? (
            <div className="rounded-xl border border-[#D4DFEB] bg-[#F6F9FC] p-8 text-center dark:border-[#1E334D] dark:bg-[#0A1626]">
              <div className="mx-auto mb-4 flex justify-center">
                <CircleAvatar name="EP" size="xl" />
              </div>
              <h3 className="font-display text-xl font-medium">Sign in for Your Circle Profile</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#475569] dark:text-[#94A3B8]">
                Teachers, parents, students, and the School Owner can sign in with Google to customize a circular picture, sticker, or avatar, exchange messages, and submit classroom resources.
              </p>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#123D68] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0B2E50] cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-[#F2B544]" />
                <span>Sign In with Google</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: CIRCLE AVATAR & PERSONAL INFO */}
              {tab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="rounded-xl border border-[#D4DFEB] bg-[#F6F9FC] p-4 dark:border-[#1E334D] dark:bg-[#0A1626]">
                    <p className="text-xs font-semibold tracking-wider text-[#1769AA] uppercase dark:text-[#60A5FA]">
                      Circle Profile Design (Photo · Sticker · Avatar)
                    </p>

                    <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                      <CircleAvatar
                        name={displayName || 'SP'}
                        avatarType={avatarType}
                        avatarValue={avatarValue}
                        photoDataUrl={photoDataUrl}
                        size="xl"
                        className="mx-auto sm:mx-0"
                      />

                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[#123D68] bg-white px-3.5 py-1.5 text-xs font-medium text-[#123D68] hover:bg-[#EDF4FA] dark:border-[#60A5FA] dark:bg-[#13253D] dark:text-[#E7EFF8] cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload Circle Picture</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => void handlePhotoUpload(e.target.files?.[0])}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setAvatarType('sticker')}
                            className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer ${
                              avatarType === 'sticker'
                                ? 'bg-[#123D68] text-white'
                                : 'border border-[#CBD8E6] bg-white text-[#334155] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#CBD5E1]'
                            }`}
                          >
                            Use Sticker
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarType('avatar')}
                            className={`min-h-[38px] rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer ${
                              avatarType === 'avatar'
                                ? 'bg-[#123D68] text-white'
                                : 'border border-[#CBD8E6] bg-white text-[#334155] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#CBD5E1]'
                            }`}
                          >
                            Use Avatar Crest
                          </button>
                        </div>

                        {avatarType === 'sticker' && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {STICKER_OPTIONS.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setAvatarValue(s.id)}
                                className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs cursor-pointer ${
                                  avatarValue === s.id
                                    ? 'border-[#1769AA] bg-[#EDF4FA] font-semibold dark:bg-[#1A3150]'
                                    : 'border-[#D4DFEB] bg-white dark:border-[#1E334D] dark:bg-[#13253D]'
                                }`}
                              >
                                <CircleAvatar name={displayName} avatarType="sticker" avatarValue={s.id} size="xs" />
                                <span>{s.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {avatarType === 'avatar' && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {AVATAR_OPTIONS.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => setAvatarValue(a.id)}
                                className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs cursor-pointer ${
                                  avatarValue === a.id
                                    ? 'border-[#1769AA] bg-[#EDF4FA] font-semibold dark:bg-[#1A3150]'
                                    : 'border-[#D4DFEB] bg-white dark:border-[#1E334D] dark:bg-[#13253D]'
                                }`}
                              >
                                <CircleAvatar name={displayName || 'SP'} avatarType="avatar" avatarValue={a.id} size="xs" />
                                <span>{a.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        Full Display Name
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-[#CBD8E6] bg-white px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        School Role
                      </label>
                      <select
                        value={accountKind}
                        onChange={(e) => setAccountKind(e.target.value as AccountKind)}
                        className="mt-1 h-11 w-full rounded-lg border border-[#CBD8E6] bg-white px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                      >
                        <option value="teacher">Teacher / Staff</option>
                        <option value="parent">Parent / Guardian</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        Class or Teaching Subject
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. P5 Mathematics or Parent of P3"
                        value={classOrSubject}
                        onChange={(e) => setClassOrSubject(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-[#CBD8E6] bg-white px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        Phone Number (Private unless shared)
                      </label>
                      <input
                        type="tel"
                        placeholder="078 ..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-[#CBD8E6] bg-white px-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                      Short Personal Bio
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Introduce yourself to EP Saint Pierre Nkombo..."
                      className="mt-1 w-full rounded-lg border border-[#CBD8E6] bg-white p-3 text-sm dark:border-[#1E334D] dark:bg-[#0A1626]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#123D68] px-6 py-2 text-sm font-medium text-white hover:bg-[#0B2E50] disabled:opacity-60 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>{saving ? 'Saving...' : 'Save Circle Profile'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: APPEARANCE (DARK & LIGHT MODE) */}
              {tab === 'appearance' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display text-lg font-medium">Website Appearance Theme</h3>
                    <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                      Switch immediately between crisp Daylight Lake Kivu Paper and Deep Nkombo Night Slate.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                        theme === 'light'
                          ? 'border-[#1769AA] bg-[#EDF4FA] dark:bg-[#13253D]'
                          : 'border-[#CBD8E6] bg-white hover:bg-[#F6F9FC] dark:border-[#1E334D] dark:bg-[#0A1626]'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2B544]/25 text-[#92400E]">
                        <Sun className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Light Mode</p>
                        <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                          Bright Lake Kivu paper background with crisp cobalt ink for sunny daytime classrooms.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                        theme === 'dark'
                          ? 'border-[#60A5FA] bg-[#0E2239] text-white'
                          : 'border-[#CBD8E6] bg-white hover:bg-[#F6F9FC] dark:border-[#1E334D] dark:bg-[#0A1626]'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1769AA]/30 text-[#93C5FD]">
                        <Moon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Dark Mode</p>
                        <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                          Low-glare deep navy slate ideal for evening lesson planning and exam revision.
                        </p>
                      </div>
                    </button>
                  </div>

                  {user && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSaveProfile()}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#123D68] px-5 py-2 text-xs font-medium text-white hover:bg-[#0B2E50] cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{saving ? 'Saving...' : 'Save Appearance to My Account'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PRIVACY CONTROLS */}
              {tab === 'privacy' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1769AA] uppercase dark:text-[#60A5FA]">
                    <Eye className="h-4 w-4" />
                    <span>Privacy & Personal Data Controls</span>
                  </div>

                  {[
                    {
                      label: 'Show my circular badge in community showcase',
                      desc: 'Displays your display name, role, and circular picture/sticker (never your phone or email).',
                      checked: privacyPublicCircle,
                      onChange: setPrivacyPublicCircle,
                    },
                    {
                      label: 'Allow teachers & school office to message me',
                      desc: 'Enable direct messages inside your portal Messages inbox.',
                      checked: privacyAllowMessages,
                      onChange: setPrivacyAllowMessages,
                    },
                    {
                      label: 'Share email address with verified school staff',
                      desc: 'Keeps your email hidden from the public while visible to school admins.',
                      checked: privacyShowEmail,
                      onChange: setPrivacyShowEmail,
                    },
                    {
                      label: 'Share phone number with school administration',
                      desc: 'Allows teachers to reach you during urgent academic or term updates.',
                      checked: privacyShowPhone,
                      onChange: setPrivacyShowPhone,
                    },
                  ].map((item) => (
                    <label
                      key={item.label}
                      className="flex items-start justify-between gap-4 rounded-xl border border-[#D4DFEB] bg-[#F6F9FC] p-4 dark:border-[#1E334D] dark:bg-[#0A1626] cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-0.5 text-xs text-[#475569] dark:text-[#94A3B8]">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.onChange(e.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#123D68]"
                      />
                    </label>
                  ))}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveProfile()}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#123D68] px-5 py-2 text-xs font-medium text-white hover:bg-[#0B2E50] cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Privacy Settings'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: MESSAGES */}
              {tab === 'messages' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleSendMessage}
                    className="space-y-3 rounded-xl border border-[#D4DFEB] bg-[#F6F9FC] p-4 dark:border-[#1E334D] dark:bg-[#0A1626]"
                  >
                    <p className="text-xs font-semibold text-[#1769AA] uppercase dark:text-[#60A5FA]">
                      New Direct Message
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                          Recipient
                        </label>
                        <input
                          type="text"
                          value={msgRecipient}
                          onChange={(e) => setMsgRecipient(e.target.value)}
                          placeholder="SCHOOL_OFFICE or user UID"
                          className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-white px-3 text-xs dark:border-[#1E334D] dark:bg-[#0D1B2D]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                          Subject
                        </label>
                        <input
                          type="text"
                          required
                          value={msgSubject}
                          onChange={(e) => setMsgSubject(e.target.value)}
                          placeholder="e.g. Lesson Plan Question / Student Update"
                          className="mt-1 h-10 w-full rounded-lg border border-[#CBD8E6] bg-white px-3 text-xs dark:border-[#1E334D] dark:bg-[#0D1B2D]"
                        />
                      </div>
                    </div>
                    <textarea
                      required
                      rows={3}
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                      placeholder="Write your message to EP Saint Pierre Nkombo office or teacher..."
                      className="w-full rounded-lg border border-[#CBD8E6] bg-white p-3 text-xs dark:border-[#1E334D] dark:bg-[#0D1B2D]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#123D68] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#0B2E50] cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send Message</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-[#475569] uppercase dark:text-[#94A3B8]">
                      Inbox & Sent ({messages.length})
                    </h4>
                    {messages.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-[#CBD8E6] p-6 text-center text-xs text-[#64748B] dark:border-[#1E334D]">
                        No direct messages yet. Use the form above to contact the School Office.
                      </p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-xl border border-[#D4DFEB] bg-white p-4 dark:border-[#1E334D] dark:bg-[#0A1626]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{m.subject}</p>
                              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                                From: {m.senderName} ({m.senderEmail}) · To: {m.recipientUid} · {m.displayDate}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {!m.read && (isAdmin || m.recipientUid === user?.uid) && (
                                <button
                                  type="button"
                                  onClick={() => void markMessageRead(m.id)}
                                  className="rounded bg-[#EDF4FA] px-2 py-1 text-[11px] font-medium text-[#123D68] dark:bg-[#13253D] dark:text-[#93C5FD] cursor-pointer"
                                >
                                  Mark Read
                                </button>
                              )}
                              <button
                                type="button"
                                aria-label="Delete message"
                                onClick={() => void deleteDirectMessage(m.id)}
                                className="rounded p-1 text-[#B91C1C] hover:bg-[#FEF2F2] dark:hover:bg-[#450A0A]/40 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-[#334155] dark:text-[#CBD5E1]">
                            {m.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: NOTIFICATIONS */}
              {tab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#475569] uppercase dark:text-[#94A3B8]">
                      School & Approval Notifications ({notifications.length})
                    </h4>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void markAllNotificationsRead()}
                        className="text-xs font-medium text-[#1769AA] hover:underline dark:text-[#60A5FA] cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#CBD8E6] p-8 text-center text-xs text-[#64748B] dark:border-[#1E334D]">
                      All caught up! Approvals, messages, and school alerts will appear here.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${
                          n.read
                            ? 'border-[#D4DFEB] bg-white dark:border-[#1E334D] dark:bg-[#0A1626]'
                            : 'border-[#1769AA] bg-[#EDF4FA]/70 dark:border-[#60A5FA] dark:bg-[#13253D]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{n.title}</span>
                            <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8]">
                              {n.kind} · {n.displayDate}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#334155] dark:text-[#CBD5E1]">{n.body}</p>
                        </div>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => void markNotificationRead(n.id)}
                            className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#123D68] shadow-xs dark:bg-[#0D1B2D] dark:text-[#93C5FD] cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: ACCOUNT SETTINGS & OWNER STUDIO LINK */}
              {tab === 'settings' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#D4DFEB] bg-[#F6F9FC] p-5 dark:border-[#1E334D] dark:bg-[#0A1626]">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <SlidersHorizontal className="h-4 w-4 text-[#1769AA]" />
                      <span>Account Controls & Permissions</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                      Signed in as <span className="font-mono font-medium">{user?.email}</span>.
                      {isAdmin
                        ? ' You have full Owner/Co-Admin privileges to publish content, approve teacher uploads, edit home backgrounds, and manage student rosters.'
                        : ' Signed-in teachers & members can upload books, lesson plans, and sports updates for Owner review & approval.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenOwnerStudio();
                          }}
                          className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#14532D] px-5 py-2 text-xs font-medium text-white hover:bg-[#0F3F22] cursor-pointer"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>Open Owner Control Studio</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void signInWithGoogle()}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[#CBD8E6] bg-white px-4 py-2 text-xs font-medium text-[#0B2E50] hover:bg-[#EDF4FA] dark:border-[#1E334D] dark:bg-[#13253D] dark:text-[#E7EFF8] cursor-pointer"
                      >
                        <span>Switch Google Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void signOutUser();
                          onClose();
                        }}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-xs font-medium text-[#B91C1C] hover:bg-[#FEE2E2] dark:border-[#7F1D1D] dark:bg-[#450A0A]/50 dark:text-[#FCA5A5] cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
