import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Home, Eye, EyeOff } from "lucide-react";
import { login, ApiError } from "@/lib/api";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — Nyumba Zetu Lead Intelligence" },
      {
        name: "description",
        content:
          "Sign in to the Nyumba Zetu Lead Intelligence Platform to manage and track property sales leads across Nairobi.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email.trim(), password);
      if (res.must_change_password) {
        navigate({ to: "/change-password" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? "Invalid email or password."
            : `Login failed (${err.status}).`
          : "Network error. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white grid lg:grid-cols-[1.05fr_1fr]">
      {/* Left: form */}
      <div className="flex flex-col px-6 sm:px-12 lg:px-20 py-10">
        <div className="flex-1 flex flex-col">
          {/* Brand */}
          <div className="flex flex-col items-center mt-10 lg:mt-20">
            <div className="h-16 w-16 rounded-full border-2 border-[#E68A1E] flex items-center justify-center">
              <Home className="h-7 w-7 text-[#E68A1E]" strokeWidth={2.2} />
            </div>
            <h2
              className="mt-3 text-2xl font-semibold tracking-tight"
              style={{ color: "#B8761A", fontFamily: "var(--font-display)" }}
            >
              Nyumba Zetu
            </h2>
          </div>

          {/* Form */}
          <div className="mt-16 lg:mt-24 mx-auto w-full max-w-md">
            <h1 className="text-4xl font-bold tracking-tight text-[#0F1B3D]">
              Sign In
            </h1>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-[#0F1B3D]"
                >
                  Email or phone number<span className="text-[#E68A1E]">*</span>
                </label>
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-sm outline-none transition focus:border-[#E68A1E] focus:ring-2 focus:ring-[#E68A1E]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#0F1B3D]"
                >
                  Password<span className="text-[#E68A1E]">*</span>
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-slate-300 bg-white px-4 py-3 pr-11 text-[15px] text-slate-900 shadow-sm outline-none transition focus:border-[#E68A1E] focus:ring-2 focus:ring-[#E68A1E]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#E68A1E] focus:ring-[#E68A1E]"
                  />
                  Remember me
                </label>
                <Link
                  to="/signin"
                  className="text-sm font-medium text-[#E68A1E] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p className="text-sm text-red-600 -mt-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#E68A1E] py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#d27d15] disabled:opacity-70"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                Sales team access only · Nyumba Zetu Lead Intelligence
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Right: dark panel */}
      <div className="relative hidden lg:block overflow-hidden bg-[#0F1B3D]">
        {/* Orange dot grid */}
        <div
          className="absolute top-10 right-10 h-44 w-56 opacity-90"
          style={{
            backgroundImage: "radial-gradient(#E68A1E 1.6px, transparent 1.8px)",
            backgroundSize: "14px 14px",
          }}
        />
        {/* Brown circle accent */}
        <div className="absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#6B4A2B]" />
        <div className="absolute -bottom-24 -right-10 h-40 w-40 rounded-full bg-[#0F1B3D] opacity-60" />

        {/* Tagline */}
        <div className="relative z-10 h-full flex flex-col justify-center px-16 text-white">
          <h3
            className="text-4xl font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Lead Intelligence
            <br />
            for Nairobi's
            <br />
            property market.
          </h3>
          <p className="mt-5 max-w-sm text-white/70 text-[15px] leading-relaxed">
            Identify, prioritize, and convert apartments, agencies, and
            landlords — all from one workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
