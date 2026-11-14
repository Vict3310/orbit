import type { AstronautProfile } from '../../types/domain';
import { cn } from '../ui';

/**
 * Procedural illustrated portraits. No external images or real NASA
 * likenesses are used; the crest colours are synthetic identifiers.
 */
export function CrewAvatar({
  profile,
  size = 56,
  className,
}: {
  profile: AstronautProfile;
  size?: number;
  className?: string;
}) {
  const { suit, visor, strap, patch } = profile.avatar;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0 border border-line', className)}
    >
      <rect width="64" height="64" fill="#19232E" />
      <path d="M9 64c0-13.5 10.3-21 23-21s23 7.5 23 21" fill={suit} opacity="0.92" />
      <path d="M9 64c0-13.5 10.3-21 23-21s23 7.5 23 21" fill="none" stroke="#293744" />
      <path d="M22 55h20l3 9H19z" fill={strap} opacity="0.85" />
      <circle cx="32" cy="26" r="15.5" fill={suit} stroke="#293744" strokeWidth="1.2" />
      <path
        d="M20.5 24.5a11.5 11.5 0 0 1 23 0v5.2a11.5 11.5 0 0 1-23 0z"
        fill={visor}
      />
      <path
        d="M23 29.5c5.2 2.8 12.8 2.8 18 0"
        stroke={patch}
        strokeWidth="1.1"
        opacity="0.75"
        fill="none"
      />
      <path d="M32 42v6" stroke="#293744" strokeWidth="1.2" />
      <circle cx="32" cy="52" r="2.4" fill={patch} />
      <rect x="44" y="46" width="9" height="4" fill={patch} opacity="0.65" />
      <path
        d="M5 5h8M5 5v8M59 59h-8M59 59v-8"
        stroke="#293744"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}
