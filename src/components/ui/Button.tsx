import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_1px_2px_rgba(0,82,204,0.3)] hover:bg-brand-500 hover:shadow-[0_4px_12px_rgba(0,82,204,0.35)] hover:-translate-y-px active:bg-brand-700 active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,82,204,0.3)] disabled:bg-brand-100 disabled:text-brand-300 disabled:shadow-none disabled:translate-y-0 dark:disabled:bg-gray-800 dark:disabled:text-gray-600",
  secondary:
    "bg-neutral-20 text-neutral-700 hover:bg-neutral-30 hover:-translate-y-px active:bg-neutral-40 active:translate-y-0 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
  ghost:
    "bg-transparent text-neutral-300 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800",
  danger:
    "bg-danger-600 text-white hover:bg-danger-400 hover:-translate-y-px active:translate-y-0 disabled:bg-danger-50 disabled:text-danger-400 disabled:translate-y-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", loading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={clsx(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] px-4 py-2 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
