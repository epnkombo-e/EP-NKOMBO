import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
}

export function ResilientImage({
  src,
  alt,
  fallbackTitle,
  className = '',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#EDE8DE] via-[#E5DFD3] to-[#D9D2C3] p-6 text-center text-[#57534E] ${className}`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#CFC6B4] bg-[#FBF9F5] text-[#14532D]">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="font-display text-base font-medium text-[#1C1917]">{fallbackTitle}</p>
        <p className="max-w-xs text-xs text-[#57534E]">EP Saint Pierre Nkombo · Nkombo Island</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
