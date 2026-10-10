import React, { useState } from 'react';
import { checkAuthBackendStatus } from '../../services/authService';

interface GoogleSignInButtonProps {
  onGoogleSuccess?: () => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onGoogleSuccess,
}) => {
  const [showConfigNotice, setShowConfigNotice] = useState(false);
  const backendStatus = checkAuthBackendStatus();

  const handleClick = () => {
    if (backendStatus.googleOAuthConfigured) {
      if (onGoogleSuccess) onGoogleSuccess();
    } else {
      setShowConfigNotice(true);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-sm font-medium transition-all shadow-xs dark:shadow-sm cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        {/* Official Google G Logo */}
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Informative Configuration Notice if not configured */}
      {showConfigNotice && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex items-start justify-between gap-2 animate-fadeIn">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400 mt-0.5">
              info
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-white">Google OAuth Not Configured</span>
              <span className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                To activate Google SSO, add <code className="bg-slate-200 dark:bg-slate-900 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300 font-mono">VITE_GOOGLE_CLIENT_ID</code> to your environment variables or integrate Firebase Auth.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfigNotice(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
