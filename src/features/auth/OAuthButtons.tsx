import { API_URL } from "../../api/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.9 5.5 29.8 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.9-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.9 5.5 29.8 3.5 24 3.5c-7.8 0-14.5 4.4-17.7 11.2z"
      />
      <path
        fill="#4CAF50"
        d="M24 44.5c5.7 0 10.7-1.9 14.6-5.2l-6.7-5.7c-2 1.4-4.7 2.4-7.9 2.4-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.4 40 16.1 44.5 24 44.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.7 5.7C41.9 36.1 44.5 30.9 44.5 24c0-1.2-.1-2.4-.9-3.5z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.78 2.72 1.26 3.38.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.2 1.18a11 11 0 0 1 5.82 0c2.22-1.49 3.19-1.18 3.19-1.18.64 1.59.24 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

const oauthButtonClasses =
  "flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-neutral-40 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-[0_1px_2px_rgba(9,30,66,0.08)] transition-all duration-200 ease-out hover:-translate-y-px hover:border-neutral-50 hover:bg-neutral-10 hover:shadow-[0_4px_10px_rgba(9,30,66,0.1)] active:translate-y-0 active:bg-neutral-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200 dark:shadow-none dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:shadow-[0_4px_10px_rgba(0,0,0,0.25)]";

export function OAuthButtons() {
  return (
    <div className="flex flex-col gap-2.5">
      <a href={`${API_URL}/auth/google`} className={oauthButtonClasses}>
        <GoogleIcon />
        Continue with Google
      </a>
      <a href={`${API_URL}/auth/github`} className={oauthButtonClasses}>
        <GitHubIcon />
        Continue with GitHub
      </a>
    </div>
  );
}
