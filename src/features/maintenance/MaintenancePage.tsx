function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`size-9 ${className}`}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M17 12h18a5 5 0 0 1 5 5v9a5 5 0 0 1-5 5H24l-6.4 5.02A1 1 0 0 1 16 35.24V31a5 5 0 0 1-5-5v-9a5 5 0 0 1 5-5z"
      />
    </svg>
  );
}

export function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12 dark:bg-gray-950">
      <div className="flex items-center gap-2 pb-10 text-brand-600 dark:text-brand-400">
        <LogoMark />
        <span className="text-lg font-semibold text-neutral-800 dark:text-gray-100">
          ChatMe
        </span>
      </div>

      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          <svg
            viewBox="0 0 24 24"
            className="size-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.7 6.3a4.5 4.5 0 0 0-6.28 5.03L3 17.5V21h3.5l6.17-5.42A4.5 4.5 0 0 0 17.7 9.3l-2.5 2.5-2.5-.5-.5-2.5z" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-neutral-800 dark:text-gray-100">
          We&apos;ll be right back
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-300 dark:text-gray-400">
          ChatMe is currently down for scheduled maintenance. We&apos;re
          working to get things back up and running as quickly as possible.
        </p>

        <div className="mt-8 flex items-center gap-3 text-sm font-medium text-neutral-90 dark:text-gray-500">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-600" />
          </span>
          Please check back shortly
        </div>
      </div>

      <p className="mt-16 text-xs text-neutral-90 dark:text-gray-500">
        &copy; {new Date().getFullYear()} ChatMe
      </p>
    </div>
  );
}
