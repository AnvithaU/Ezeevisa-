import { useState } from "react";
import { useLocation } from "wouter";
import { GoogleLogin } from "@react-oauth/google";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { customFetch } from "@/lib/customFetch";
import { setOtpSession } from "@/lib/otpSession";
import AuthShell, { AuthTabs } from "@/components/auth/AuthShell";

interface LoginForm {
  email: string;
  password: string;
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginForm>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = (): boolean => {
    const errs: Partial<LoginForm> = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!emailRe.test(form.email.trim())) errs.email = "Enter a valid email address";
    if (!form.password) errs.password = "Password is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!validate()) return;
    loginMutation.mutate(
      { data: { email: form.email.trim(), password: form.password } },
      {
        onSuccess: (res) => {
          if ("token" in res) {
            login(res.token, res.user);
            setLocation("/dashboard");
            return;
          }
          setOtpSession({
            pendingToken: res.pendingToken,
            purpose: res.purpose,
            email: form.email.trim(),
          });
          setLocation("/verify-otp");
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Invalid email or password");
        },
      }
    );
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError("Google sign-in failed. Please try again.");
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
      setError(err?.data?.error || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="ezv-form-title">Welcome Back</div>
      <p className="ezv-form-subtitle">Sign in to your VisaPath account</p>
      <AuthTabs mode="login" />

      {error && (
        <div className="ezv-alert ezv-alert--err">
          <AlertCircle size={15} />
          {error}
        </div>
      )}
      {info && !error && (
        <div className="ezv-alert ezv-alert--ok">
          <CheckCircle2 size={15} />
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="ezv-field-group">
          <div className="ezv-field-wrap">
            <label className="ezv-field-label">Email Address</label>
            <div className="ezv-field-control">
              <input
                className={`ezv-field-input ${fieldErrors.email ? "error" : ""}`}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <span className="ezv-field-icon">
                <Mail size={17} strokeWidth={2} />
              </span>
            </div>
            {fieldErrors.email && <div className="ezv-field-err">{fieldErrors.email}</div>}
          </div>

          <div className="ezv-field-wrap">
            <label className="ezv-field-label">Password</label>
            <div className="ezv-field-control">
              <input
                className={`ezv-field-input ${fieldErrors.password ? "error" : ""}`}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
            {fieldErrors.password && <div className="ezv-field-err">{fieldErrors.password}</div>}
          </div>
        </div>

        <button
          type="button"
          className="ezv-forgot-link"
          onClick={() =>
            setInfo("To reset your password, please contact support@visapath.com.")
          }
        >
          Forgot password?
        </button>

        <button type="submit" className="ezv-cta-btn" disabled={loginMutation.isPending}>
          <span className="ezv-btn-inner">
            {loginMutation.isPending ? (
              <>
                <Loader2 size={16} className="ezv-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={16} strokeWidth={2.5} />
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
          <div className="ezv-alert ezv-alert--ok" style={{ margin: 0, width: "100%", justifyContent: "center" }}>
            <Loader2 size={15} className="ezv-spin" /> Signing in with Google...
          </div>
        ) : (
          <div>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google sign-in failed. Please try again.")}
              text="continue_with"
              shape="pill"
              theme="filled_black"
              width="320"
            />
          </div>
        )}
      </div>

      <p className="ezv-bottom-link">
        New to VisaPath?{" "}
        <a onClick={() => setLocation("/register")}>Create a free account</a>
      </p>
    </AuthShell>
  );
}
