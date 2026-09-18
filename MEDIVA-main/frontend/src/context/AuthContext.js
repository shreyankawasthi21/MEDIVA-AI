import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  getMyProfile,
  ensurePatientProfile,
  createDoctorProfileForSession,
} from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const p = await getMyProfile();
          if (mounted.current && p) setUser(p);
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      } finally {
        if (mounted.current) setReady(true);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        if (mounted.current) setUser(null);
        return;
      }
      if (session) {
        try {
          const p = await getMyProfile();
          // Only set when a profile is found; never clobber an active user with null
          if (mounted.current && p) setUser(p);
        } catch (err) {
          console.error("Failed to load profile on auth state change:", err);
        }
      }
    });

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  // ----- Patient: email + password -----
  async function loginPatient(email, password) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: (email || "").trim(),
        password,
      });
      if (error) throw new Error(mapAuthError(error));

      const profile = await getMyProfile();
      if (!profile) throw new Error("No patient profile found for this account.");
      setUser(profile);
      return profile;
    } catch (err) {
      throw err instanceof Error ? err : new Error(mapAuthError(err));
    } finally {
      // Ensures this promise always settles so callers never hang on a stuck spinner.
    }
  }

  async function signupPatient(email, password, fullName) {
    try {
      const cleanEmail = (email || "").trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });
      if (error) throw new Error(mapAuthError(error));

      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) throw new Error(mapAuthError(signInError));
      }

      const profile = await ensurePatientProfile({ full_name: fullName, role: "patient" });
      setUser(profile);
      return profile;
    } catch (err) {
      throw err instanceof Error ? err : new Error(mapAuthError(err));
    } finally {
      // Ensures this promise always settles so callers never hang on a stuck spinner.
    }
  }

  // ----- Doctor: email + password -----
  async function loginDoctor(email, password) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: (email || "").trim(),
        password,
      });
      if (error) throw new Error(mapAuthError(error));

      const profile = await getMyProfile();
      if (!profile || profile.role !== "doctor") {
        await supabase.auth.signOut();
        throw new Error("This account is not registered as clinical staff.");
      }
      setUser(profile);
      return profile;
    } catch (err) {
      throw err instanceof Error ? err : new Error(mapAuthError(err));
    } finally {
      // Ensures this promise always settles so callers never hang on a stuck spinner.
    }
  }

  async function signupDoctor(profileData, password) {
    try {
      const cleanEmail = (profileData.email || "").trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });
      if (error) throw new Error(mapAuthError(error));

      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInError) throw new Error(mapAuthError(signInError));
      }

      const profile = await createDoctorProfileForSession(profileData);
      setUser(profile);
      return profile;
    } catch (err) {
      throw err instanceof Error ? err : new Error(mapAuthError(err));
    } finally {
      // Ensures this promise always settles so callers never hang on a stuck spinner.
    }
  }

  // ----- Dev/demo bypass: auto-provision demo accounts -----
  async function devLogin(email, password) {
    const cleanEmail = (email || "").trim();
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        // The account may not exist yet, so attempt to provision it. If it turns out
        // the account already exists (422), surface a clear message instead of
        // bouncing between signIn/signUp with the same stale credentials.
        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (signUpError) {
          if (/already registered|already exists/i.test(signUpError.message || "")) {
            throw new Error(
              "This demo account already exists with different credentials. Please contact support to reset it."
            );
          }
          throw new Error(mapAuthError(signUpError));
        }
      }

      let profile = await getMyProfile();
      if (!profile) {
        profile = cleanEmail.toLowerCase().includes("doctor")
          ? await createDoctorProfileForSession({
              full_name: "Dr. Demo",
              specialty: "Clinical Specialist",
              email: cleanEmail,
            })
          : await ensurePatientProfile({ full_name: "Demo Patient" });
      }

      setUser(profile);
      return profile;
    } catch (err) {
      throw err instanceof Error ? err : new Error(mapAuthError(err));
    } finally {
      // Ensures this promise always settles so callers never hang on a stuck spinner.
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        loginPatient,
        signupPatient,
        loginDoctor,
        signupDoctor,
        devLogin,
        logout,
        refreshProfile: async () => {
          const p = await getMyProfile();
          if (p) setUser(p);
          return p;
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function mapAuthError(error) {
  const msg = error?.message || "Authentication failed.";
  if (/invalid login credentials/i.test(msg)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(msg))
    return "Email not confirmed. Disable 'Confirm email' in Supabase Auth settings for this demo.";
  if (/already registered/i.test(msg)) return "An account with this email already exists.";
  return msg;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
