import React from 'react';

export default function BrandLogo({
  compact = false,
  className = '',
  textClassName = '',
  subtitleClassName = '',
  iconClassName = '',
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-[0_14px_35px_rgba(251,146,60,0.28)] ${iconClassName}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M7 3.5h7l3 3V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" stroke="white" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M14 3.5V7a1 1 0 0 0 1 1h3" stroke="white" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M10 12.5c1.1-1.4 3.3-1.4 4.4 0" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 10.2v3.7" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </div>

      {!compact && (
        <div>
          <h1 className={`text-lg font-black tracking-[-0.03em] text-stone-900 ${textClassName}`}>ResumeIQ</h1>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-500 ${subtitleClassName}`}>
            Smart Resume Studio
          </p>
        </div>
      )}
    </div>
  );
}
