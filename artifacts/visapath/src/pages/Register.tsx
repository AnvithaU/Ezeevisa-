import { useState } from "react";
import { useLocation } from "wouter";
import { GoogleLogin } from "@react-oauth/google";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { customFetch } from "@/lib/customFetch";
import { setOtpSession } from "@/lib/otpSession";
import AuthShell, { AuthTabs } from "@/components/auth/AuthShell";
import CountryCodePicker, { CC_DATA, Country } from "@/components/auth/CountryCodePicker";

interface RegisterFields {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPass: string;
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^\d{7,15}$/;

function pwStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_COLORS = ["#e05a5a", "#e05a5a", "#e8a44a", "#4caf7d", "#4caf7d"];
const STRENGTH_LABELS = [
  "",
  "Weak - too short",
  "Fair - add more variety",
  "Good password",
  "Strong password",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();

  const [form, setForm] = useState<RegisterFields>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPass: "",
  });
  const [country, setCountry] = useState<Country>(CC_DATA[0]);
  const [fieldErrors, setFieldErrors] = useState<Partial<RegisterFields>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const set = (key: keyof RegisterFields, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const errs: Partial<RegisterFields> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    else if (form.fullName.trim().length < 2) errs.fullName = "Name must be at least 2 characters";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!emailRe.test(form.email.trim())) errs.email = "Enter a valid email address";
    if (form.phone.trim() && !phoneRe.test(form.phone.replace(/\s/g, "")))
      errs.phone = "Enter a valid phone number (digits only)";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    else if (pwStrength(form.password) < 2) errs.password = "Add uppercase, numbers or symbols";
    if (!form.confirmPass) errs.confirmPass = "Please confirm your password";
    else if (form.confirmPass !== form.password) errs.confirmPass = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    const trimmedName = form.fullName.trim();
    const spaceIdx = trimmedName.indexOf(" ");
    const firstName = spaceIdx === -1 ? trimmedName : trimmedName.slice(0, spaceIdx);
    const lastName = spaceIdx === -1 ? "" : trimmedName.slice(spaceIdx + 1).trim();
    const phoneDigits = form.phone.replace(/\s/g, "");
    const phone = phoneDigits ? `${country.c} ${phoneDigits}` : undefined;

    registerMutation.mutate(
      {
        data: {
          firstName,
          lastName,
          email: form.email.trim(),
          password: form.password,
          phone,
        },
      },
      {
        onSuccess: (res) => {
          setOtpSession({
            pendingToken: res.pendingToken,
            purpose: "email_verification",
            email: form.email.trim(),
          });
          setLocation("/verify-otp");
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Registration failed. Please try again.");
        },
      }
    );
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError("Google sign-up failed. Please try again.");
      return;
    }
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await customFetch<{ token: string; user: any }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      login(res.token, res.user);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err?.data?.error || "Google sign-up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const strength = pwStrength(form.password);
  const barWidth = form.password.length === 0 ? 0 : Math.max(10, strength * 25);

  return (
    <AuthShell>
      <div className="ezv-form-title">Create Account</div>
      <p className="ezv-form-subtitle">Start your visa journey today</p>
      <AuthTabs mode="signup" />

      {error && (
        <div className="ezv-alert ezv-alert--err">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ezv-field-group">
          <div className="ezv-field-wrap">
            <label className="ezv-field-label">Full Name</label>
            <div className="ezv-field-control">
              <input
                className={`ezv-field-input ${fieldErrors.fullName ? "error" : ""}`}
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
              <span className="ezv-field-icon">
                <User size={17} strokeWidth={2} />
              </span>
            </div>
            {fieldErrors.fullName && <div className="ezv-field-err">{fieldErrors.fullName}</div>}
          </div>

          <div className="ezv-field-wrap">
            <label className="ezv-field-label">Email Address</label>
            <div className="ezv-field-control">
              <input
                className={`ezv-field-input ${fieldErrors.email ? "error" : ""}`}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
              <span className="ezv-field-icon">
                <Mail size={17} strokeWidth={2} />
              </span>
            </div>
            {fieldErrors.email && <div className="ezv-field-err">{fieldErrors.email}</div>}
          </div>

          <div>
            <label className="ezv-field-label">
              Phone Number <span style={{ textTransform: "none", opacity: 0.6 }}>(optional)</span>
            </label>
            <div className="ezv-phone-row">
              <CountryCodePicker value={country} onChange={setCountry} />
              <div className="ezv-phone-input-wrap">
                <input
                  className={`ezv-field-input ${fieldErrors.phone ? "error" : ""}`}
                  type="tel"
                  autoComplete="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
            </div>
            {fieldErrors.phone && <div className="ezv-field-err">{fieldErrors.phone}</div>}
          </div>

          <div className="ezv-field-wrap">
            <label className="ezv-field-label">Password</label>
            <div className="ezv-field-control">
              <input
                className={`ezv-field-input ${fieldErrors.password ? "error" : ""}`}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
              <span className="ezv-field-icon">
                <Lock size={17} strokeWidth={2} />
              </span>
              <button
                type="button"
                className="ezv-eye-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <div className="ezv-pw-strength">
              <div className="ezv-pw-bar-track">
                <div
                  className="ezv-pw-bar-fill"
                  style={{
                    width: `${barWidth}%`,
                    background: STRENGTH_COLORS[strength] || STRENGTH_COLORS[0],
                  }}
                />
              </div>
              <div
                className="ezv-pw-hint"
                style={{
                  color:
                    form.password.length === 0
                      ? "var(--ezv-text-muted)"
                      : STRENGTH_COLORS[strength] || "var(--ezv-text-muted)",
                }}
              >
                {form.password.length === 0
                  ? "Min 8 chars, uppercase, number & symbol"
                  : STRENGTH_LABELS[strength] || ""}
              </div>
            </div>
            {fieldErrors.password && <div className="ezv-field-err">{fieldErrors.password}</div>}
          </div>

          <div className="ezv-field-wrap">
            <label className="ezv-field-label">Confirm Password</label>
            <div className="ezv-field-control">
              <input
                className={`ezv-field-input ${fieldErrors.confirmPass ? "error" : ""}`}
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={form.confirmPass}
                onChange={(e) => set("confirmPass", e.target.value)}
              />
              <span className="ezv-field-icon">
                <ShieldCheck size={17} strokeWidth={2} />
              </span>
              <button
                type="button"
                className="ezv-eye-toggle"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {fieldErrors.confirmPass && (
              <div className="ezv-field-err">{fieldErrors.confirmPass}</div>
            )}
          </div>
        </div>

        <button type="submit" className="ezv-cta-btn" disabled={registerMutation.isPending}>
          <span className="ezv-btn-inner">
            {registerMutation.isPending ? (
              <>
                <Loader2 size={16} className="ezv-spin" /> Creating account...
              </>
            ) : (
              <>
                Create Account <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </span>
        </button>
      </form>

      <div className="ezv-separator">
        <div className="ezv-sep-line" />
        <span className="ezv-sep-text">or continue with</span>
        <div className="ezv-sep-line" />
      </div>

      <div className="ezv-social-row">
        {googleLoading ? (
          <div
            className="ezv-alert ezv-alert--ok"
            style={{ margin: 0, width: "100%", justifyContent: "center" }}
          >
            <Loader2 size={15} className="ezv-spin" /> Signing up with Google...
          </div>
        ) : (
          <div>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google sign-up failed. Please try again.")}
              text="signup_with"
              shape="pill"
              theme="filled_black"
              width="320"
            />
          </div>
        )}
      </div>

      <p className="ezv-bottom-link">
        Already have an account? <a onClick={() => setLocation("/login")}>Sign in</a>
      </p>
    </AuthShell>
  );
}
