import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../api/client';
import { AuthLayout } from './AuthLayout';
import { OAuthButtons } from './OAuthButtons';
import { registerSchema, type RegisterForm } from './schemas';

export function RegisterPage() {
  const registerUser = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      await registerUser(data.displayName, data.email, data.password);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Get started with ChatMe for free">
      <OAuthButtons />
      <div className="my-6 flex items-center gap-3 text-xs font-medium text-neutral-90 dark:text-gray-500">
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
          placeholder="Display name"
          autoFocus
          autoComplete="name"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <Input
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          type="password"
          placeholder="At least 8 characters"
          revealable
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {serverError && (
          <p role="alert" className="text-sm text-danger-600 dark:text-danger-400">
            {serverError}
          </p>
        )}
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!isValid}
          className="mt-1.5 w-full"
        >
          Sign Up
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-neutral-300 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-brand-600 transition-colors hover:text-brand-500 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
