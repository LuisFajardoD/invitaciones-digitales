"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ useMock }: { useMock: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo iniciar sesion.");
      }
      router.push("/admin/invitations");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth-card">
        <p className="eyebrow">Admin Auth</p>
        <h1>Acceso al CRM</h1>
        <p className="muted">
          Inicia sesion con Supabase Auth (email/password).
          {useMock ? " Modo demo sin variables: usa demo@invitaciones.local / demo12345." : ""}
        </p>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </section>
    </div>
  );
}
