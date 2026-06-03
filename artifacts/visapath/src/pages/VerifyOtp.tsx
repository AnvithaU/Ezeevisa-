import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useVerifyOtp, useResendOtp } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { getOtpSession, clearOtpSession } from "@/lib/otpSession";
import AuthShell from "@/components/auth/AuthShell";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOtp() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, login } = useAuth();
  const session = getOtpSession();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const verifyMutation = useVerifyOtp();
  const resendMutation = useResendOtp();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !session) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, session, setLocation]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!session) return null;

  const isRegistration = session.purpose === "email_verification";
  const code = digits.join("");

  const submitCode = (value: string) => {
    if (value.length !== CODE_LENGTH || verifyMutation.isPending) return;
    setError(null);
    setInfo(null);
    verifyMutation.mutate(
      { data: { pendingToken: session.pendingToken, code: value } },
      {
        onSuccess: (res) => {
          clearOtpSession();
          login(res.token, res.user);
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Verification failed. Please try again.");
          setDigits(Array(CODE_LENGTH).fill(""));
          inputsRef.current[0]?.focus();
        },
      }
    );
  };

  const handleChange = (index: number, raw: string) => {
    const val = raw.replace(/\D/g, "");
    if (!val) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      const chars = val.split("");
      let i = index;
      for (const ch of chars) {
        if (i >= CODE_LENGTH) break;
        next[i] = ch;
        i++;
      }
      const focusIndex = Math.min(i, CODE_LENGTH - 1);
      inputsRef.current[focusIndex]?.focus();
      const joined = next.join("");
      if (joined.length === CODE_LENGTH) {
        setTimeout(() => submitCode(joined), 0);
      }
      return next;
    });
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (cooldown > 0 || resendMutation.isPending) return;
    setError(null);
    setInfo(null);
    resendMutation.mutate(
      { data: { pendingToken: session.pendingToken } },
      {
        onSuccess: () => {
          setInfo("A new code has been sent to your email.");
          setCooldown(RESEND_COOLDOWN);
          setDigits(Array(CODE_LENGTH).fill(""));
          inputsRef.current[0]?.focus();
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Could not resend the code. Please try again.");
        },
      }
    );
  };

  return (
    <AuthShell>
      <div className="ezv-form-title">
        {isRegistration ? "Verify Your Email" : "Two-Factor Verification"}
      </div>
      <p className="ezv-form-subtitle">
        We sent a 6-digit code to{" "}
        <span style={{ color: "var(--ezv-cream)", fontWeight: 500 }}>{session.email}</span>
      </p>

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

      <label className="ezv-field-label" style={{ marginTop: 4 }}>
        Enter OTP
      </label>
      <div className="ezv-otp-boxes">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            className={`ezv-otp-box ${digit ? "filled" : ""} ${error ? "error" : ""}`}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={CODE_LENGTH}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={verifyMutation.isPending}
          />
        ))}
      </div>

      <div className="ezv-otp-meta">
        Didn't receive it?{" "}
        <button
          type="button"
          className="ezv-resend-btn"
          onClick={handleResend}
          disabled={cooldown > 0 || resendMutation.isPending}
        >
          {resendMutation.isPending
            ? "Sending..."
            : cooldown > 0
            ? `Resend in ${cooldown}s`
            : "Resend OTP"}
        </button>
      </div>

      <button
        type="button"
        className="ezv-cta-btn"
        style={{ marginTop: 18 }}
        onClick={() => submitCode(code)}
        disabled={code.length !== CODE_LENGTH || verifyMutation.isPending}
      >
        <span className="ezv-btn-inner">
          {verifyMutation.isPending ? (
            <>
              <Loader2 size={16} className="ezv-spin" /> Verifying...
            </>
          ) : (
            <>
              Verify <ArrowRight size={16} strokeWidth={2.5} />
            </>
          )}
        </span>
      </button>

      <p className="ezv-otp-note">
        The code expires in 10 minutes. Check your spam folder if you don't see it.
      </p>
    </AuthShell>
  );
}
