/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  AuthUser,
  authService,
  SignInCredentials,
  SignUpCredentials,
  AuthResponse,
  mapSupabaseUser,
} from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';

export const DEMO_USER: AuthUser = {
  id: 'user-demo-elena',
  email: 'elena.rostova@acme.corp',
  name: 'Elena Rostova',
  role: 'QA Lead',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuClQsIR7bEguSlug4BrrJjeX5oQCIkUgXw_QZkIaWafVR1CGk6q8ZgITi3oKWNNaYVWPeU4Q94KOiGdViwUCG_PpARSOd6q6rpHK9Qu5Sjq7qmiFEmKMMb8ghwMtNxMnE2VEpID-Pishmdf2nJulyN1EIFnEWcrRSWSNTqTwShRx5qr_0hlU65cH-F5LSFOFJYn3Kpj7A4o56vhUs4gmUpGfVsBz8lmG3R6yd5SW5foGob6h0JXvfXd',
  provider: 'demo',
};

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isConfigured: boolean;
  signIn: (credentials: SignInCredentials) => Promise<AuthResponse>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let isMounted = true;

    // Check for existing session on startup (including OAuth redirects)
    const checkInitialSession = async () => {
      try {
        const currentSession = await authService.getSession();
        if (isMounted) {
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(mapSupabaseUser(currentSession.user));
            setIsDemoMode(false);
          }
        }
      } catch (err) {
        console.error('Error checking initial auth session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkInitialSession();

    // Listen to real-time auth changes from Supabase (sign-in, OAuth callback, sign-out)
    const { data: authListener } = authService.onAuthStateChange(
      (_event, newSession, authUser) => {
        if (!isMounted) return;
        setSession(newSession);
        if (authUser) {
          setUser(authUser);
          setIsDemoMode(false);
        } else if (!isDemoMode) {
          setUser(null);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [isDemoMode]);

  const signIn = async (credentials: SignInCredentials): Promise<AuthResponse> => {
    const res = await authService.signIn(credentials);
    if (res.success && res.user) {
      setUser(res.user);
      setIsDemoMode(false);
    }
    return res;
  };

  const signUp = async (credentials: SignUpCredentials): Promise<AuthResponse> => {
    const res = await authService.signUp(credentials);
    if (res.success && res.user && res.token) {
      setUser(res.user);
      setIsDemoMode(false);
    }
    return res;
  };

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    return await authService.signInWithGoogle();
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setIsDemoMode(false);
  };

  const enterDemoMode = () => {
    setUser(DEMO_USER);
    setIsDemoMode(true);
  };

  const isAuthenticated = useMemo(() => {
    return Boolean(user && (Boolean(session) || isDemoMode));
  }, [user, session, isDemoMode]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated,
        isDemoMode,
        isConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
