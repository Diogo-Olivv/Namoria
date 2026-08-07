"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ redirect }: { redirect: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await login({ email, password });
    if (error) {
      console.error("Supabase login error:", error);
      toast.error("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.replace(redirect || "/");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col gap-5 sm:max-w-md lg:gap-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="lg:text-base">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 lg:h-12 lg:text-base"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="lg:text-base">
          Senha
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 lg:h-12 lg:text-base"
        />
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        disabled={loading}
        className="mt-1 h-11 text-base lg:h-12 lg:text-lg"
      >
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
