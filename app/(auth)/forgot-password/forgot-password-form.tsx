"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/set-password`,
    });

    // Always show the same message, regardless of whether the email exists —
    // otherwise this becomes a way to check which addresses have an account.
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Ja šis e-pasts pieder kādam kontam, uz to nosūtīta saite paroles maiņai. Pārbaudi iesūtni
        (arī mēstuļu mapi).
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-pasts</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sūta..." : "Nosūtīt saiti paroles maiņai"}
      </Button>
    </form>
  );
}
