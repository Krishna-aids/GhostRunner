import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { authService, AuthValidators } from '../../services/authService';

interface ForgotPasswordPageProps {
  onNavigateSignIn: () => void;
  onNavigateHome: () => void;
  onLaunchDemoConsole?: () => void;
  onLaunchConsole?: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateSignIn,
  onNavigateHome,
  onLaunchDemoConsole,
  onLaunchConsole,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [backendFeedback, setBackendFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendFeedback(null);

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!AuthValidators.isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.requestPasswordReset(email);

      if (response.success) {
        setIsSubmittedSuccess(true);
      } else {
        setBackendFeedback(
          response.error || 'Password reset service error. Please check your backend configuration.'
        );
      }
    } catch (err: unknown) {
      setBackendFeedback(
        err instanceof Error ? err.message : 'An error occurred while requesting password reset.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      onNavigateHome={onNavigateHome}
      onLaunchConsole={onLaunchConsole || onLaunchDemoConsole}
    >
      {/* Title & Description */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Reset your password
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
          Enter your email address and follow the instructions to regain access.
        </p>
      </div>

      {isSubmittedSuccess ? (
        <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700/60 text-teal-900 dark:text-teal-200 text-xs flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-teal-600 dark:text-teal-400">
              mark_email_read
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">Reset link dispatched</span>
              <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                If an account exists for <strong className="text-slate-900 dark:text-white">{email}</strong>, you will receive password reset instructions shortly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateSignIn}
            className="w-full mt-2 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Return to Sign In
          </button>
        </div>
      ) : (
        <>
          {/* Backend Status Notice */}
          {backendFeedback && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/60 text-red-900 dark:text-red-200 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-red-600 dark:text-red-400 mt-0.5">
                  error
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 dark:text-white">Password Reset Notice</span>
                  <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed mt-0.5">
                    {backendFeedback}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your email address"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm border transition-all focus:outline-none focus:ring-2 ${
                  error
                    ? 'border-red-500/80 focus:ring-red-500/40'
                    : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-blue-500/40'
                }`}
              />
              {error && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching instructions...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        </>
      )}

      {/* Return to Sign In */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-center">
        <button
          type="button"
          onClick={onNavigateSignIn}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer inline-flex items-center gap-1 hover:underline"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          <span>Back to sign in</span>
        </button>
      </div>
    </AuthLayout>
  );
};
