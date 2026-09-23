// src/contexts/AuthContext.jsx
//
// Replaces the Base44-specific AuthContext. Keeps the SAME context shape
// (user, isAuthenticated, isLoadingAuth, authError, authChecked, logout,
// navigateToLogin, checkUserAuth) so every component that calls useAuth()
// elsewhere in the app keeps working unchanged.
//
// Removed: appPublicSettings / checkAppState / isLoadingPublicSettings —
// those existed to ask Base44's server "is this app configured, is auth
// required" (multi-tenant hosting concern). Supabase has no such concept;
// your app always requires auth, so we just listen to the Supabase session.
//
import React, { createContext, useState, useContext, useEffect } from "react";
import { base44, supabase } from "@/api/base44Client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();

    // Keep state in sync with Supabase's own session lifecycle
    // (token refresh, sign-out in another tab, OAuth redirect return, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          // Defer: awaiting Supabase calls inside this callback deadlocks supabase-js
          setTimeout(() => checkUserAuth(), 0);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await Promise.race([
        base44.auth.me(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth check timed out")), 10000),
        ),
      ]);
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setAuthChecked(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error("User auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      setAuthError({
        type: "auth_required",
        message: "Authentication required",
      });
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? window.location.origin : undefined);
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false, // kept for compatibility, always false now
        authError,
        appPublicSettings: null, // kept for compatibility, unused now
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth, // alias for old call sites
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
