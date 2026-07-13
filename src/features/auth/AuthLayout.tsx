import type { ReactNode } from 'react';
import logo from '../../assets/logo.png';

interface AuthLayoutProps {
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-20 px-4 py-10 dark:bg-gray-950">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="auth-blob -left-24 -top-24 size-80 bg-brand-400"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="auth-blob -right-20 top-1/3 size-72 bg-discovery-400"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="auth-blob bottom-[-6rem] left-1/4 size-96 bg-brand-300"
          style={{ animationDelay: "-14s" }}
        />
        <div className="auth-noise absolute inset-0" />
      </div>
      <div className="auth-card-enter relative z-10 w-full max-w-[420px]">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="ChatMe" className="size-16 drop-shadow-[0_4px_14px_rgba(0,101,255,0.35)]" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-gray-100">
              ChatMe
            </h1>
            <p className="text-sm text-neutral-300 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
        <div className="rounded-[3px] border border-neutral-40 bg-white/95 p-7 shadow-[0_8px_30px_rgba(9,30,66,0.12)] backdrop-blur-sm dark:border-gray-800/80 dark:bg-gray-900/90 dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
          {children}
        </div>
      </div>
    </div>
  );
}
