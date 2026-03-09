"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";

const COUNTRY_COOKIE = "pst_country";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const pair = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return pair?.split("=")[1];
}

export function AuthSync() {
  const { isLoaded, isSignedIn, user } = useAuth();
  const didSync = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || didSync.current) return;

    const email = user.email;
    if (!email) return;

    didSync.current = true;
    const detectedCountry = readCookie(COUNTRY_COOKIE);
    const referralCode = readCookie("pst_ref");

    fetch("/api/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name:
          user.user_metadata?.full_name ?? email.split("@")[0] ?? "User",
        detectedCountry,
        referralCode,
      }),
    })
      .then(() => {
        // Clear referral cookie after successful sync
        if (referralCode) {
          document.cookie = "pst_ref=; path=/; max-age=0";
        }
      })
      .catch(() => {
        didSync.current = false;
      });
  }, [isLoaded, isSignedIn, user]);

  return null;
}
