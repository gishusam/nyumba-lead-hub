import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Home } from "lucide-react";
import { changePassword, ApiError, getToken } from "@/lib/api";

export const Route = createFileRoute("/change-password")({
  head: () => ({ meta: [{ title: "Change Password — Nyumba Zetu" }] }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!getToken()) {
      navigate({ to: "/signin" });
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(current, next);
      navigate({ to: "/" });
    } catch (err) {
      let msg = "Failed to change password.";
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string } | null;
        msg = body?.detail || `Request failed (${err.status}).`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-full border-2 border-[#E68A1E] flex items-center justify-center">
            <Home className="h-6 w-6 text-[#E68A1E]" strokeWidth={2.2} />
          </div>
          <h2 className="mt-3 text-xl font-semibold" style={{ color: "#B8761A" }}>
            Nyumba Zetu
          </h2>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#0F1B3D]">
          Change your password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          For your security, please set a new password before continuing.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <Field
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={setCurrent}
            required
          />
          <Field
            label="New password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={setNext}
            required
            hint="Minimum 8 characters."
          />
          <Field
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#E68A1E] py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#d27d15] disabled:opacity-70"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  autoComplete,
  value,
  onChange,
  required,
  hint,
}: {
  label: string;
  type: string;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#0F1B3D]">
        {label}
        {required && <span className="text-[#E68A1E]">*</span>}
      </label>
      <input
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm outline-none transition focus:border-[#E68A1E] focus:ring-2 focus:ring-[#E68A1E]/20"
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
