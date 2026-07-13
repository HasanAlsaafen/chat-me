import { type InputHTMLAttributes, forwardRef, useId, useState } from "react";
import clsx from "clsx";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  revealable?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, revealable, type, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    const errorId = `${inputId}-error`;
    const [revealed, setRevealed] = useState(false);

    const isPasswordToggle = revealable && type === "password";
    const resolvedType = isPasswordToggle
      ? revealed
        ? "text"
        : "password"
      : type;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700 dark:text-gray-200"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={clsx(
              "h-11 w-full rounded-[3px] border border-neutral-40 bg-neutral-10 px-3.5 text-sm text-neutral-800 placeholder:text-neutral-90 transition-all duration-200 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-neutral-20 disabled:text-neutral-90",
              "dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-100 dark:focus:border-brand-400 dark:focus:bg-gray-800 dark:focus:ring-brand-400/15 dark:disabled:bg-gray-900 dark:disabled:text-gray-600",
              error &&
                "border-danger-400 focus:border-danger-600 focus:ring-danger-400/15 dark:border-danger-400 dark:focus:border-danger-400",
              isPasswordToggle && "pr-11",
              className,
            )}
            {...props}
          />
          {isPasswordToggle && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              tabIndex={-1}
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-90 transition-colors hover:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-400 dark:text-gray-500 dark:hover:text-gray-300"
            >
              {revealed ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
