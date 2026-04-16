import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { GoogleLogin } from "@react-oauth/google";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Globe, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { customFetch } from "@/lib/customFetch";

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const registerMutation = useRegister();
  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    registerMutation.mutate(
      {
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
        },
      },
      {
        onSuccess: (res) => {
          login(res.token, res.user);
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Registration failed. Please try again.");
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
        headers: { "Content-Type": "application/json" },
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

  const passwordStrength = password
    ? password.length >= 12
      ? "strong"
      : password.length >= 8
      ? "good"
      : "weak"
    : null;

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
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Start applying for e-visas in minutes
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

            <div className="flex justify-center mb-4">
              {googleLoading ? (
                <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-background border border-input rounded-lg text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing up with Google...
                </div>
              ) : (
                <div className="w-full [&>div]:w-full [&>div>div]:w-full [&_iframe]:w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google sign-in failed. Please try again.")}
                    width="100%"
                    text="signup_with"
                    shape="rectangular"
                    theme="outline"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or sign up with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">First name</label>
                  <input
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                      errors.firstName ? "border-destructive" : "border-input"
                    )}
                    placeholder="Rahul"
                    {...register("firstName", { required: "Required" })}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Last name</label>
                  <input
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                      errors.lastName ? "border-destructive" : "border-input"
                    )}
                    placeholder="Sharma"
                    {...register("lastName", { required: "Required" })}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  className={cn(
                    "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                    errors.email ? "border-destructive" : "border-input"
                  )}
                  placeholder="you@example.com"
                  {...register("email", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" } })}
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Phone number <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={cn(
                      "w-full px-3.5 py-2.5 pr-10 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                      errors.password ? "border-destructive" : "border-input"
                    )}
                    placeholder="Min. 8 characters"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 8, message: "At least 8 characters" },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {["weak", "good", "strong"].map((level, i) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all",
                            i === 0 && passwordStrength ? "bg-destructive" :
                            i <= 1 && (passwordStrength === "good" || passwordStrength === "strong") ? "bg-warning" :
                            i === 2 && passwordStrength === "strong" ? "bg-success" : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{passwordStrength}</span>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className={cn(
                    "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                    errors.confirmPassword ? "border-destructive" : "border-input"
                  )}
                  placeholder="Repeat password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val) => val === password || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By creating an account you agree to our Terms of Service and Privacy Policy. Your data is encrypted and secure.
                </p>
              </div>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary font-medium hover:underline cursor-pointer">
                Sign in
              </span>
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
