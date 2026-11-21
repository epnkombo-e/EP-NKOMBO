import { Award, BookOpen, Compass, Flame, Music, Palette, Shield, Sparkles, Star, Trophy, Waves } from 'lucide-react';
import { AVATAR_OPTIONS, STICKER_OPTIONS, type AvatarType } from '../data/portalCatalog';

interface CircleAvatarProps {
  name: string;
  avatarType?: AvatarType;
  avatarValue?: string;
  photoDataUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CircleAvatarProps['size']>, string> = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const ICON_SIZES: Record<NonNullable<CircleAvatarProps['size']>, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
  xl: 'h-11 w-11',
};

export function CircleAvatar({
  name,
  avatarType = 'avatar',
  avatarValue = 'avatar-scholar',
  photoDataUrl,
  size = 'sm',
  className = '',
}: CircleAvatarProps) {
  const sizeCls = SIZE_CLASSES[size];
  const iconCls = ICON_SIZES[size];
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'SP';

  if (avatarType === 'photo' && photoDataUrl) {
    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1769AA] bg-[#EDF4FA] dark:border-[#60A5FA] dark:bg-[#0E2239] ${sizeCls} ${className}`}
      >
        <img
          src={photoDataUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  if (avatarType === 'sticker') {
    const sticker = STICKER_OPTIONS.find((s) => s.id === avatarValue) || STICKER_OPTIONS[0];
    const renderStickerIcon = () => {
      switch (sticker.id) {
        case 'sticker-owl':
          return <BookOpen className={iconCls} style={{ color: sticker.accent }} />;
        case 'sticker-wave':
          return <Waves className={iconCls} style={{ color: sticker.accent }} />;
        case 'sticker-leaf':
          return <Sparkles className={iconCls} style={{ color: sticker.accent }} />;
        case 'sticker-star':
          return <Star className={iconCls} style={{ color: sticker.accent }} />;
        case 'sticker-ball':
          return <Trophy className={iconCls} style={{ color: sticker.accent }} />;
        case 'sticker-harp':
          return <Music className={iconCls} style={{ color: sticker.accent }} />;
        default:
          return <Star className={iconCls} style={{ color: sticker.accent }} />;
      }
    };

    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-2 shadow-xs ${sizeCls} ${className}`}
        style={{ backgroundColor: sticker.bg, borderColor: sticker.accent }}
        title={sticker.label}
      >
        {renderStickerIcon()}
      </span>
    );
  }

  const avatar = AVATAR_OPTIONS.find((a) => a.id === avatarValue) || AVATAR_OPTIONS[0];
  const renderCrestBadge = () => {
    switch (avatar.id) {
      case 'avatar-teacher':
        return <Shield className="h-3 w-3" style={{ color: avatar.ring }} />;
      case 'avatar-scientist':
        return <Compass className="h-3 w-3" style={{ color: avatar.ring }} />;
      case 'avatar-artist':
        return <Palette className="h-3 w-3" style={{ color: avatar.ring }} />;
      case 'avatar-captain':
        return <Award className="h-3 w-3" style={{ color: avatar.ring }} />;
      case 'avatar-sun':
        return <Flame className="h-3 w-3" style={{ color: avatar.ring }} />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-2 font-semibold text-white shadow-xs ${sizeCls} ${className}`}
      style={{ backgroundColor: avatar.bg, borderColor: avatar.ring }}
    >
      <span>{initials}</span>
      {(size === 'lg' || size === 'xl') && renderCrestBadge() && (
        <span className="absolute -right-0.5 -bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/60 bg-[#0B2E50]">
          {renderCrestBadge()}
        </span>
      )}
    </span>
  );
}
