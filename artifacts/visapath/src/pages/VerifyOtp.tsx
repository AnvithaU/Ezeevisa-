import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useVerifyOtp, useResendOtp } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Globe, Loader2, AlertCircle, MailCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOtpSession, clearOtpSession } from "@/lib/otpSession";

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
      // support pasting multiple digits
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Visa<span className="text-primary">Path</span>
              </span>
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
              {isRegistration ? (
                <MailCheck className="w-6 h-6 text-primary" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-primary" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRegistration ? "Verify your email" : "Two-factor verification"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{session.email}</span>
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive mb-4"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {info && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary mb-4"
              >
                <MailCheck className="w-4 h-4 flex-shrink-0" />
                {info}
              </motion.div>
            )}

            <div className="flex justify-center gap-2 sm:gap-3 mb-6">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={CODE_LENGTH}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={verifyMutation.isPending}
                  className={cn(
                    "w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-semibold bg-background border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-60",
                    error ? "border-destructive" : "border-input"
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => submitCode(code)}
              disabled={code.length !== CODE_LENGTH || verifyMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              Didn't get the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resendMutation.isPending}
                className="text-primary font-medium hover:underline disabled:opacity-60 disabled:cursor-not-allowed disabled:no-underline"
              >
                {resendMutation.isPending
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            The code expires in 10 minutes. Check your spam folder if you don't see it.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
