"use client";

import { AuthProvider } from "@/context/AuthContext";

export default function ClientProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

