"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, type ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { status } = useSession();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const startTime = useRef(Date.now());
  const MAX_WAIT = 3000;

  useEffect(() => {
    if (status === "authenticated") {
      setReady(true);
      return;
    }
    if (status === "unauthenticated") {
      const elapsed = Date.now() - startTime.current;
      if (elapsed > 500) {
        router.push("/login");
        return;
      }
    }
    // Polling: cek status setiap 200ms
    const poll = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      if (elapsed > MAX_WAIT) {
        setReady(true); // force render setelah 3 detik
        clearInterval(poll);
      }
    }, 200);
    return () => clearInterval(poll);
  }, [status, router]);

  useEffect(() => {
    if (ready && status === "unauthenticated") {
      router.push("/login");
    }
  }, [ready, status, router]);

  if (status === "loading" || (!ready && status !== "unauthenticated")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fbf8fe]">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-[#6c45b2]"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-[#4a4452]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return null;
}