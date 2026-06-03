import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Globe,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

function Brand({ size = "md" }: { size?: "sm" | "md" }) {
  const mark = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  const word = size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "rounded-xl bg-gold-gradient flex items-center justify-center font-serif font-bold text-[hsl(217_60%_10%)] shadow-md",
          mark
        )}
      >
        VP
      </div>
      <span
        className={cn(
          "font-serif font-semibold tracking-[0.18em] text-foreground",
          word
        )}
      >
        VISA<span className="text-gold-gradient">PATH</span>
      </span>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/applications", label: "My Applications", icon: FileText },
        { href: "/apply", label: "Apply Now", icon: Globe },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-[hsl(43_40%_50%/0.18)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <div className="cursor-pointer">
              <Brand />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location === link.href || location.startsWith(link.href + "/");
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                      isActive
                        ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border hover:bg-white/5 transition-colors text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="hidden sm:block font-medium text-foreground">
                    {user?.firstName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-60 bg-card border border-card-border rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-foreground">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          window.location.href = "/";
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <div className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                    Sign in
                  </div>
                </Link>
                <Link href="/register">
                  <div className="px-4 py-2 bg-gold-gradient text-[hsl(217_60%_10%)] rounded-lg text-sm font-semibold hover:brightness-110 transition-all cursor-pointer shadow-md">
                    Get Started
                  </div>
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            {isAuthenticated && (
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-card/95 backdrop-blur overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location === link.href;
                  return (
                    <Link key={link.href} href={link.href}>
                      <div
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[hsl(43_40%_50%/0.15)] mt-auto bg-[hsl(217_58%_9%/0.6)] backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <Brand size="sm" />
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Smart e-Visa portal for Indian travelers. Not affiliated with any
              government body.
            </p>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <span className="hover:text-gold transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span className="hover:text-gold transition-colors cursor-pointer">
                Terms of Service
              </span>
              <span className="hover:text-gold transition-colors cursor-pointer">
                Support
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
