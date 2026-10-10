import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { GoogleSignInButton } from './GoogleSignInButton';
import { authService, AuthValidators } from '../../services/authService';

interface SignUpPageProps {
  onNavigateSignIn: () => void;
  onNavigateHome: () => void;
  onSignUpSuccess: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onNavigateSignIn,
  onNavigateHome,
  onSignUpSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendFeedback, setBackendFeedback] = useState<string | null>(null);

  // Real-time password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-300 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!AuthValidators.isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy to register.';
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
      const response = await authService.signUp({
        name,
        email,
        password,
        confirmPassword,
        agreeToTerms,
      });

      if (response.success && response.user) {
        onSignUpSuccess();
      } else {
        setBackendFeedback(
          response.error || 'Registration service error. Please check your configuration.'
        );
      }
    } catch (err: unknown) {
      setBackendFeedback(
        err instanceof Error ? err.message : 'An unexpected error occurred during account creation.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      onNavigateHome={onNavigateHome}
      onLaunchDemoConsole={onSignUpSuccess}
    >
      {/* Title & Subtitle */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Create your GhostRunner account
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
          Get started with smarter, more reliable software testing.
        </p>
      </div>

      {/* Google Sign In Option */}
      <div className="mb-5">
        <GoogleSignInButton onGoogleSuccess={onSignUpSuccess} />
      </div>

      {/* Subtle "or" Divider */}
      <div className="relative flex items-center justify-center my-5">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white dark:bg-[#0f172a] px-3 text-xs text-slate-500 uppercase tracking-wider font-medium absolute">
          or
        </span>
      </div>

      {/* Backend connection notice if attempted */}
      {backendFeedback && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 mt-0.5">
              cloud_off
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white">Live Backend Required</span>
              <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed mt-0.5">
                {backendFeedback}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200 dark:border-amber-800/40">
            <button
              type="button"
              onClick={onSignUpSuccess}
              className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white underline cursor-pointer"
            >
              Enter Console in Demo Mode →
            </button>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label
            htmlFor="signup-name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Full name
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            disabled={isSubmitting}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Enter your full name"
            className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm border transition-all focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-red-500/80 focus:ring-red-500/40'
                : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-blue-500/40'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Work email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="you@company.com"
            className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm border transition-all focus:outline-none focus:ring-2 ${
              errors.email
                ? 'border-red-500/80 focus:ring-red-500/40'
                : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-blue-500/40'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isSubmitting}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Create a strong password"
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

          {/* Password strength bar */}
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 grid grid-cols-4 gap-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${strength.score >= 1 ? strength.color : ''}`} />
                <div className={`h-full rounded-full ${strength.score >= 2 ? strength.color : ''}`} />
                <div className={`h-full rounded-full ${strength.score >= 3 ? strength.color : ''}`} />
                <div className={`h-full rounded-full ${strength.score >= 4 ? strength.color : ''}`} />
              </div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {strength.label}
              </span>
            </div>
          )}

          {errors.password && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="signup-confirm-password"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isSubmitting}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Re-enter your password"
              className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm border transition-all focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? 'border-red-500/80 focus:ring-red-500/40'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-blue-500/40'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer p-0.5"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showConfirmPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{errors.confirmPassword}</span>
            </p>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => {
                setAgreeToTerms(e.target.checked);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-blue-600 focus:ring-blue-500/40 cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
              I agree to the{' '}
              <a href="#terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              <span>{errors.terms}</span>
            </p>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <span>Sign Up</span>
          )}
        </button>
      </form>

      {/* Card Footer: Switch to Sign In */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-center">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateSignIn}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* Demo Direct Access shortcut */}
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={onSignUpSuccess}
          className="text-[11px] text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          ⚡ Or jump straight to demo environment without signing up
        </button>
      </div>
    </AuthLayout>
  );
};
