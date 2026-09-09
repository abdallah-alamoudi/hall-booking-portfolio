import React, { createContext, useContext, useMemo, useState } from 'react';
import { Roles } from '@hall-booking/contracts';

const AUTH_STORAGE_KEY = 'hall_booking_auth';

function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    const payload = atob(parts[1]);
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

function createMockToken(payload) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

function readStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { token: null, user: null };
    }

    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { token: null, user: null };
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [{ token, user }, setSession] = useState(readStoredSession);

  const persistSession = (nextToken, nextUser) => {
    const payload = { token: nextToken, user: nextUser };
    setSession(payload);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  };

  const applyAuthResponse = (authResponse) => {
    const nextToken = authResponse?.accessToken || null;
    const decoded = nextToken ? decodeToken(nextToken) : null;
    const nextUser = authResponse?.user || (decoded ? { role: decoded.role } : null);

    persistSession(nextToken, nextUser);
  };

  /*
  const loginMock = ({ email, role }) => {
    // ... mock implementation ...
  };
  */

  const login = async ({ identifier, password }) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Login failed');
    }

    const data = await response.json();
    const { token: accessToken, user: userPayload } = data;

    const authResponse = {
      accessToken,
      user: userPayload
    };

    applyAuthResponse(authResponse);
    return authResponse;
  };

  const logout = () => {
    setSession({ token: null, user: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      applyAuthResponse,
      login,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
