"use client";

import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProtectedGateProps = {
  description: string;
  passwordLabel: string;
  submitLabel: string;
  errorMessage: string;
};

export function ProtectedGate({
  description,
  passwordLabel,
  submitLabel,
  errorMessage,
}: ProtectedGateProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(false);

    const response = await fetch("/api/protected-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      setError(true);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <p className="text-sm text-fd-muted-foreground">{description}</p>

      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{passwordLabel}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="rounded-lg border bg-fd-background px-3 py-2"
            required
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            buttonVariants({ color: "secondary", size: "sm" }),
            "w-fit",
          )}
        >
          {loading ? "…" : submitLabel}
        </button>
      </form>
    </div>
  );
}
