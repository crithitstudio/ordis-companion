/**
 * Warframe Currency Icons
 * Custom SVG icons for in-game currencies: Platinum, Credits, Ducats, Endo, Aya, and Steel Essence
 */
import { type SVGProps } from "react";

interface CurrencyIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

/**
 * Platinum Icon - Warframe's premium currency
 * Diamond-shaped icon with cyan/blue gradient
 */
export function PlatinumIcon({
  size = 16,
  className = "",
  ...props
}: CurrencyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`text-cyan-400 ${className}`}
      fill="currentColor"
      {...props}
    >
      <defs>
        <linearGradient id="platinumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Diamond shape */}
      <path
        d="M12 2L2 12l10 10 10-10L12 2zm0 2.83L19.17 12 12 19.17 4.83 12 12 4.83z"
        fill="url(#platinumGrad)"
      />
      {/* Inner diamond */}
      <path d="M12 7L7 12l5 5 5-5-5-5z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/**
 * Credits Icon - Standard in-game currency
 * Hexagonal coin shape in gold/green
 */
export function CreditsIcon({
  size = 16,
  className = "",
  ...props
}: CurrencyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`text-green-400 ${className}`}
      fill="currentColor"
      {...props}
    >
      <defs>
        <linearGradient id="creditsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      {/* Hexagonal coin */}
      <path
        d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18l6.5 3.75v7.14L12 18.82l-6.5-3.75V7.93L12 4.18z"
        fill="url(#creditsGrad)"
      />
      {/* Credits symbol (C with line) */}
      <text
        x="12"
        y="14.5"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="currentColor"
      >
        C
      </text>
    </svg>
  );
}

/**
 * Ducats Icon - Baro Ki'Teer's currency
 * Ornate Orokin-style coin in gold/amber
 */
export function DucatIcon({
  size = 16,
  className = "",
  ...props
}: CurrencyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`text-amber-400 ${className}`}
      fill="currentColor"
      {...props}
    >
      <defs>
        <linearGradient id="ducatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="url(#ducatGrad)"
        strokeWidth="2"
      />
      {/* Inner decorative ring */}
      <circle
        cx="12"
        cy="12"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      {/* Orokin symbol (stylized D) */}
      <path
        d="M9 8v8h3c2.2 0 4-1.8 4-4s-1.8-4-4-4H9zm2 2h1c1.1 0 2 .9 2 2s-.9 2-2 2h-1v-4z"
        fill="url(#ducatGrad)"
      />
    </svg>
  );
}

/**
 * Endo Icon - Mod upgrade resource
 * Stylized crystalline shape in silver/gray
 */
export function EndoIcon({
  size = 16,
  className = "",
  ...props
}: CurrencyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`text-slate-300 ${className}`}
      fill="currentColor"
      {...props}
    >
      <defs>
        <linearGradient id="endoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      {/* Crystal shape */}
      <polygon points="12,2 18,8 18,16 12,22 6,16 6,8" fill="url(#endoGrad)" />
      {/* Inner highlight */}
      <polygon
        points="12,5 15,8 15,14 12,17 9,14 9,8"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
}

/**
 * Aya Icon - Prime Resurgence currency
 * Void-themed triangular shape in purple/gold
 */
export function AyaIcon({
  size = 16,
  className = "",
  ...props
}: CurrencyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`text-purple-400 ${className}`}
      fill="currentColor"
      {...props}
    >
      <defs>
        <linearGradient id="ayaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
      </defs>
      {/* Triangular void symbol */}
      <polygon points="12,3 21,19 3,19" fill="url(#ayaGrad)" />
      {/* Inner triangle cutout */}
      <polygon points="12,9 16,16 8,16" fill="#1e1b4b" />
    </svg>
  );
}

/**
 * Regal Aya Icon - Premium Prime Resurgence currency
 * Gold/amber triangular shape with extra ornamentation
 */
export function RegalAyaIcon({
  size = 16,
  className = "",
  ...props
}: CurrencyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`text-amber-300 ${className}`}
      fill="currentColor"
      {...props}
    >
      <defs>
        <linearGradient id="regalAyaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Outer triangle with crown */}
      <polygon points="12,1 22,19 2,19" fill="url(#regalAyaGrad)" />
      {/* Crown points */}
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
      {/* Inner triangle */}
      <polygon points="12,8 17,17 7,17" fill="#1e1b4b" />
      {/* Inner glow */}
      <polygon
        points="12,10 14,14 10,14"
        fill="url(#regalAyaGrad)"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * Steel Essence Icon - Steel Path currency
 * Red/crimson crystalline orb
 */
export function SteelEssenceIcon({
  size = 16,
  className = "",
  ...props
}: CurrencyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`text-red-500 ${className}`}
      fill="currentColor"
      {...props}
    >
      <defs>
        <radialGradient id="steelGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>
      {/* Main orb */}
      <circle cx="12" cy="12" r="9" fill="url(#steelGrad)" />
      {/* Inner glow/highlight */}
      <ellipse cx="9" cy="9" rx="3" ry="2" fill="white" opacity="0.3" />
      {/* Steel symbol */}
      <path d="M12 7l-3 5h2v5h2v-5h2l-3-5z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

/**
 * Vitus Essence Icon - Arbitration currency
 * Teal/green hexagonal crystal
 */
export function VitusEssenceIcon({
  size = 16,
  className = "",
  ...props
}: CurrencyIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`text-teal-400 ${className}`}
      fill="currentColor"
      {...props}
    >
      <defs>
        <linearGradient id="vitusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      {/* Hexagonal crystal */}
      <path
        d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5l5.5 3.2v6.6L12 17.5l-5.5-3.2V7.7L12 4.5z"
        fill="url(#vitusGrad)"
      />
      {/* Inner facet */}
      <path
        d="M12 8l-3 2v4l3 2 3-2v-4l-3-2z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}
