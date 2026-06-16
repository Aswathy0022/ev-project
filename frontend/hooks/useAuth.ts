"use client";

import { useEffect, useState } from "react";
import { auth, type User } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  return { user, loading, setUser, logout };
}
