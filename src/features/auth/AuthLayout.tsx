import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`size-8 ${className}`} aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 12h18a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5H24l-6.4 5.02A1 1 0 0 1 16 35.24V31a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5z"
      />
    </svg>
  );
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      <div className="auth-panel-bg hidden w-[38%] max-w-[440px] flex-col justify-between bg-brand-600 px-10 py-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-lg font-semibold">ChatMe</span>
        </div>
        <p className="text-2xl font-medium leading-snug text-white/90">
          Fast, focused messaging for teams that ship.
        </p>
        <p className="text-sm text-white/60">&copy; {new Date().getFullYear()} ChatMe</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex items-center gap-2 pb-10 lg:hidden">
          <LogoMark className="text-brand-600 dark:text-brand-400" />
          <span className="text-lg font-semibold text-neutral-800 dark:text-gray-100">
            ChatMe
          </span>
        </div>
        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-neutral-800 dark:text-gray-100">
              {title}
            </h1>
            <p className="mt-1 text-sm text-neutral-300 dark:text-gray-400">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
