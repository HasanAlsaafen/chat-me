import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../api/client";
import { AuthLayout } from "./AuthLayout";
import { OAuthButtons } from "./OAuthButtons";
import { loginSchema, type LoginForm } from "./schemas";

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to ChatMe">
      <OAuthButtons />
      <div className="my-6 flex items-center gap-3 text-sm font-medium text-neutral-90 dark:text-gray-500">
        <div className="h-px flex-1 bg-neutral-40 dark:bg-gray-800" />
        or continue with email
        <div className="h-px flex-1 bg-neutral-40 dark:bg-gray-800" />
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-3.5"
        noValidate
      >
        <Input
          type="email"
          placeholder="name@example.com"
          autoFocus
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          type="password"
          placeholder="Password"
          revealable
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        {serverError && (
          <p
            role="alert"
            className="text-sm text-danger-600 dark:text-danger-400"
          >
            {serverError}
          </p>
        )}
        <Button
          type="submit"
          loading={isSubmitting}
          className="mt-1.5 w-full"
        >
          Sign In
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-neutral-300 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className="font-semibold text-brand-600 transition-colors hover:text-brand-500 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
