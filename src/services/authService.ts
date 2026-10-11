/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  provider?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  agreeToTerms?: boolean;
}

export interface AuthResponse<T = unknown> {
  success: boolean;
  message?: string;
  user?: AuthUser;
  token?: string;
  error?: string;
  data?: T;
}

export interface AuthBackendStatus {
  isConfigured: boolean;
  provider: 'supabase';
  googleOAuthConfigured: boolean;
  description: string;
}

/**
 * Maps a Supabase Auth User object into the application's clean AuthUser model.
 */
export function mapSupabaseUser(user: User): AuthUser {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    name:
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      user.email?.split('@')[0] ||
      'GhostRunner User',
    role: meta.role || (user.app_metadata && user.app_metadata.role) || 'QA Lead',
    avatarUrl: meta.avatar_url || meta.picture || undefined,
    provider: (user.app_metadata && user.app_metadata.provider) || 'supabase',
  };
}

/**
 * Checks whether Supabase authentication is active and properly configured.
 */
export function checkAuthBackendStatus(): AuthBackendStatus {
  const configured = isSupabaseConfigured();

  return {
    isConfigured: configured,
    provider: 'supabase',
    googleOAuthConfigured: configured, // Google OAuth provider is enabled in Supabase project
    description: configured
      ? 'Supabase Authentication active with Google OAuth and Email/Password providers.'
      : 'Supabase credentials missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.',
  };
}

/**
 * Validation helpers for authentication forms.
 */
export const AuthValidators = {
  isValidEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email.trim());
  },

  isStrongPassword(password: string): { isValid: boolean; reason?: string } {
    if (!password || password.length < 8) {
      return { isValid: false, reason: 'Password must be at least 8 characters long.' };
    }
    return { isValid: true };
  },

  doPasswordsMatch(password: string, confirm: string): boolean {
    return password === confirm && password.length > 0;
  },
};

/**
 * Production-ready AuthService using Supabase Auth exclusively.
 * Supports Email/Password, Google OAuth, session restore, password reset, and sign out.
 */
class AuthService {
  /**
   * Returns current backend configuration status.
   */
  public getStatus(): AuthBackendStatus {
    return checkAuthBackendStatus();
  }

  /**
   * Sign in with Supabase Email & Password.
   */
  public async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    if (!credentials.email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!AuthValidators.isValidEmail(credentials.email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!credentials.password) {
      return { success: false, error: 'Password is required.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase credentials are not configured in environment variables.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No user returned from Supabase.' };
      }

      return {
        success: true,
        user: mapSupabaseUser(data.user),
        token: data.session?.access_token,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unexpected error during sign in.',
      };
    }
  }

  /**
   * Register a new user with Supabase Email & Password.
   */
  public async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    if (!credentials.name.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!credentials.email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!AuthValidators.isValidEmail(credentials.email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    const passwordCheck = AuthValidators.isStrongPassword(credentials.password);
    if (!passwordCheck.isValid) {
      return { success: false, error: passwordCheck.reason };
    }
    if (
      credentials.confirmPassword !== undefined &&
      !AuthValidators.doPasswordsMatch(credentials.password, credentials.confirmPassword)
    ) {
      return { success: false, error: 'Passwords do not match.' };
    }
    if (credentials.agreeToTerms === false) {
      return { success: false, error: 'You must agree to the Terms of Service and Privacy Policy.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase credentials are not configured in environment variables.',
      };
    }

    try {
      const redirectUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email.trim(),
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.name.trim(),
            name: credentials.name.trim(),
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Account creation failed. Please try again.' };
      }

      // Check if email confirmation is required (session will be null while user is created)
      const isConfirmationPending = !data.session;

      return {
        success: true,
        user: mapSupabaseUser(data.user),
        token: data.session?.access_token,
        message: isConfirmationPending
          ? 'Confirmation email sent! Please check your inbox to verify your email address.'
          : 'Account created successfully!',
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unexpected error during registration.',
      };
    }
  }

  /**
   * Initiate Google OAuth sign-in flow through Supabase.
   */
  public async signInWithGoogle(): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase is not configured. Please verify your environment variables.',
      };
    }

    try {
      const redirectUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to initialize Google OAuth.',
      };
    }
  }

  /**
   * Sign in with Google ID Token (via Google Identity Services).
   */
  public async signInWithGoogleIdToken(idToken: string, nonce?: string): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase is not configured. Please verify your environment variables.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No user returned from Supabase.' };
      }

      return {
        success: true,
        user: mapSupabaseUser(data.user),
        token: data.session?.access_token,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to sign in with Google ID token.',
      };
    }
  }

  /**
   * Request password reset instructions via Supabase.
   */
  public async requestPasswordReset(email: string): Promise<AuthResponse> {
    if (!email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!AuthValidators.isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase credentials are not configured in environment variables.',
      };
    }

    try {
      const redirectUrl =
        typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: 'Password reset link sent! Please check your inbox.',
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send password reset email.',
      };
    }
  }

  /**
   * Sign out the active user session.
   */
  public async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error signing out.',
      };
    }
  }

  /**
   * Retrieve the currently authenticated user from Supabase.
   */
  public async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) return null;
      return mapSupabaseUser(user);
    } catch {
      return null;
    }
  }

  /**
   * Retrieve the active Supabase session.
   */
  public async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) return null;
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to Supabase auth state changes (login, logout, token refresh, OAuth callback).
   */
  public onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null, user: AuthUser | null) => void
  ) {
    return supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ? mapSupabaseUser(session.user) : null;
      callback(event, session, user);
    });
  }
}

export const authService = new AuthService();
