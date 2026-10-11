import React, { useState, useEffect } from 'react';
import { AuthLayout } from './AuthLayout';
import { GoogleSignInButton } from './GoogleSignInButton';
import { authService, AuthValidators } from '../../services/authService';

interface SignInPageProps {
  onNavigateSignUp: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateHome: () => void;
  onLoginSuccess: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onNavigateSignUp,
  onNavigateForgotPassword,
  onNavigateHome,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendFeedback, setBackendFeedback] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<{
    code?: string;
    description?: string;
  } | null>(null);

  // Parse error parameters from URL query string or hash (from Supabase OAuth redirects)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('error') || urlParams.get('error_code');
    let desc = urlParams.get('error_description');

    if (!code && window.location.hash) {
      const hashStr = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashStr);
      code = hashParams.get('error') || hashParams.get('error_code') || code;
      desc = hashParams.get('error_description') || desc;
    }

    if (code || desc) {
      setOauthError({
        code: code || 'OAuth Error',
        description: desc
          ? decodeURIComponent(desc.replace(/\+/g, ' '))
          : 'Authentication failed with the external provider.',
      });
    }
  }, []);

  // Validate on blur or submit
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!AuthValidators.isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendFeedback(null);

    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await authService.signIn({ email, password });

      if (response.success && response.user) {
        onLoginSuccess();
      } else {
        setBackendFeedback(
          response.error || 'Authentication service error. Please check your configuration.'
        );
      }
    } catch (err: unknown) {
      setBackendFeedback(
        err instanceof Error ? err.message : 'An unexpected error occurred during sign in.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      onNavigateHome={onNavigateHome}
      onLaunchConsole={onLoginSuccess}
    >
      {/* Title & Subtitle */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
          Sign in to continue to GhostRunner.
        </p>
      </div>

      {/* OAuth Callback Error Alert with actionable guidance */}
      {oauthError && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/60 text-red-950 dark:text-red-200 text-xs flex flex-col gap-2.5 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0">
              gpp_maybe
            </span>
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Google OAuth Code Exchange Failed
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOauthError(null);
                    try {
                      window.history.replaceState({}, '', window.location.pathname);
                    } catch {}
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-700 dark:text-slate-300 text-xs font-mono bg-white/70 dark:bg-slate-900/60 p-2 rounded border border-red-200 dark:border-red-900/40 select-all">
                {oauthError.description}
              </p>

              <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800/40 text-[11px] text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-amber-500">lightbulb</span>
                  How to resolve this in Google Cloud &amp; Supabase:
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>
                    In <strong className="text-slate-900 dark:text-slate-200">Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</strong>: open your OAuth 2.0 Web Client and add <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">https://xjgxnpnfeabiyqsdyljo.supabase.co/auth/v1/callback</code> to <em>Authorized redirect URIs</em>.
                  </li>
                  <li>
                    In <strong className="text-slate-900 dark:text-slate-200">Supabase Dashboard &gt; Authentication &gt; Providers &gt; Google</strong>: confirm that the <code className="font-mono text-[10px]">Client ID</code> and <code className="font-mono text-[10px]">Client Secret</code> match without trailing spaces.
                  </li>
                </ol>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-200 dark:border-red-800/40">
            <button
              type="button"
              onClick={onLoginSuccess}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline cursor-pointer"
            >
              Quick Access to Console →
            </button>
          </div>
        </div>
      )}

      {/* Google Sign In option */}
      <div className="mb-5">
        <GoogleSignInButton onGoogleSuccess={onLoginSuccess} />
      </div>

      {/* Subtle "or" Divider */}
      <div className="relative flex items-center justify-center my-5">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white dark:bg-[#0f172a] px-3 text-xs text-slate-500 uppercase tracking-wider font-medium absolute">
          or
        </span>
      </div>

      {/* Backend feedback notice if attempted */}
      {backendFeedback && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/60 text-red-900 dark:text-red-200 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-red-600 dark:text-red-400 mt-0.5">
              error
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white">Authentication Error</span>
              <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed mt-0.5">
                {backendFeedback}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-200 dark:border-red-800/40">
            <button
              type="button"
              onClick={onLoginSuccess}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline cursor-pointer"
            >
              Quick Access to Console →
            </button>
          </div>
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email Address */}
        <div>
          <label
            htmlFor="signin-email"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="Enter your email address"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm border transition-all focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-500/80 focus:ring-red-500/40'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-blue-500/40'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="signin-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <button
              type="button"
              onClick={onNavigateForgotPassword}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="signin-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isSubmitting}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm border transition-all focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-500/80 focus:ring-red-500/40'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-blue-500/40'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer p-0.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Card Footer: Switch to Sign Up */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-center">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onNavigateSignUp}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Quick Access — QA Lead session */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-1">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
          Quick Access
        </p>
        <button
          type="button"
          onClick={onLoginSuccess}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-violet-500/60 dark:border-violet-400/50 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 text-xs font-semibold transition-all cursor-pointer w-full justify-center"
        >
          <span>⚡</span>
          <span>Sign In as Elena Rostova (QA Lead)</span>
        </button>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
          Direct access to test suites and healing engine
        </p>
      </div>
    </AuthLayout>
  );
};
