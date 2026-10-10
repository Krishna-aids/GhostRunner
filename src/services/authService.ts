/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
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
  provider: 'none' | 'custom_api' | 'firebase' | 'oauth';
  googleOAuthConfigured: boolean;
  description: string;
}

/**
 * Checks whether an authentication backend is configured in the environment.
 */
export function checkAuthBackendStatus(): AuthBackendStatus {
  // Check for common auth environment variables
  const hasCustomApi = Boolean(import.meta.env.VITE_AUTH_API_URL);
  const hasGoogleOAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const hasFirebase = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

  if (hasCustomApi) {
    return {
      isConfigured: true,
      provider: 'custom_api',
      googleOAuthConfigured: hasGoogleOAuth,
      description: 'Connected to custom API backend.',
    };
  }

  if (hasFirebase) {
    return {
      isConfigured: true,
      provider: 'firebase',
      googleOAuthConfigured: hasGoogleOAuth,
      description: 'Connected to Firebase Authentication.',
    };
  }

  return {
    isConfigured: false,
    provider: 'none',
    googleOAuthConfigured: hasGoogleOAuth,
    description:
      'No authentication backend configured. Frontend forms validate input locally and expose clear service hooks for production integration.',
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
 * Abstract AuthService class ready to be backed by REST API, Firebase, Supabase, or Auth0.
 */
class AuthService {
  private backendStatus: AuthBackendStatus;

  constructor() {
    this.backendStatus = checkAuthBackendStatus();
  }

  public getStatus(): AuthBackendStatus {
    return this.backendStatus;
  }

  /**
   * Attempt sign in. If no backend is configured, returns a descriptive error
   * explaining that a live backend API is required.
   */
  public async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    // 1. Client-side input validation
    if (!credentials.email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!AuthValidators.isValidEmail(credentials.email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!credentials.password) {
      return { success: false, error: 'Password is required.' };
    }

    // 2. Check if a real backend API is connected
    if (this.backendStatus.isConfigured && import.meta.env.VITE_AUTH_API_URL) {
      try {
        const response = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        const data = await response.json();
        return data;
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Network error contacting auth backend.',
        };
      }
    }

    // 3. Realistic simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Notice: Per requirements, do NOT pretend an account was authenticated or store credentials
    return {
      success: false,
      error:
        'Authentication backend not connected. To connect live users, configure an authentication endpoint in src/services/authService.ts.',
    };
  }

  /**
   * Attempt registration.
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
    if (!AuthValidators.doPasswordsMatch(credentials.password, credentials.confirmPassword)) {
      return { success: false, error: 'Passwords do not match.' };
    }
    if (!credentials.agreeToTerms) {
      return { success: false, error: 'You must agree to the Terms of Service and Privacy Policy.' };
    }

    if (this.backendStatus.isConfigured && import.meta.env.VITE_AUTH_API_URL) {
      try {
        const response = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        return await response.json();
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Network error contacting auth backend.',
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      success: false,
      error:
        'Authentication backend not connected. To register live accounts, connect an authentication API or database.',
    };
  }

  /**
   * Request password reset link.
   */
  public async requestPasswordReset(email: string): Promise<AuthResponse> {
    if (!email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!AuthValidators.isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (this.backendStatus.isConfigured && import.meta.env.VITE_AUTH_API_URL) {
      try {
        const response = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        return await response.json();
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Network error contacting auth backend.',
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    // Per requirement: "Do not claim that an email has been sent unless the backend confirms the request"
    return {
      success: false,
      error:
        'Backend email service is not configured. No password reset email could be sent. Configure an SMTP or transactional email provider in the environment.',
    };
  }
}

export const authService = new AuthService();
