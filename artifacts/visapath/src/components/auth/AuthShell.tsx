import { ReactNode, useMemo } from "react";
import { Link } from "wouter";
import "@/styles/ezevisa-auth.css";

function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, () => ({
        left: `${Math.random() * 50}%`,
        top: `${20 + Math.random() * 60}%`,
        animationDuration: `${4 + Math.random() * 5}s`,
        animationDelay: `${Math.random() * 6}s`,
      })),
    [],
  );
  return (
    <>
      {particles.map((style, i) => (
        <div key={i} className="ezv-particle" style={style} />
      ))}
    </>
  );
}

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="ezv-auth">
      <div className="ezv-bg-layer" />
      <div className="ezv-globe-ring ezv-globe-ring--1" />
      <div className="ezv-globe-ring ezv-globe-ring--2" />
      <div className="ezv-globe-ring ezv-globe-ring--3" />
      <Particles />
      <div className="ezv-v-divider" />

      <div className="ezv-left-panel">
        <div className="ezv-logo-mark ezv-brand">
          <img
            src="/logo/EzeVisa Logo.png"
            alt="EzeVisa"
            className="ezv-logo-img"
          />
          <div className="ezv-logo-text ezv-brand-text">
            Eze<span>Visa</span>
          </div>
        </div>
        <div className="ezv-hero-tag">&#10022; Global Visa Solutions</div>
        <h1 className="ezv-hero-title">
          Your World,
          <br />
          <em>Seamlessly</em>
          <span className="ezv-line2">Connected.</span>
        </h1>
        <p className="ezv-hero-sub">
          Fast, secure, and intelligent visa processing for travelers and
          administrators worldwide. Apply, track, and manage — all in one
          elegant platform.
        </p>
        <div className="ezv-stats-row">
          <div className="ezv-stat">
            <span className="ezv-stat-num">190+</span>
            <span className="ezv-stat-label">Countries</span>
          </div>
          <div className="ezv-divider-v" />
          <div className="ezv-stat">
            <span className="ezv-stat-num">48h</span>
            <span className="ezv-stat-label">Avg. Processing</span>
          </div>
          <div className="ezv-divider-v" />
          <div className="ezv-stat">
            <span className="ezv-stat-num">98%</span>
            <span className="ezv-stat-label">Approval Rate</span>
          </div>
        </div>
      </div>

      <div className="ezv-right-panel">
        <div className="ezv-form-card">{children}</div>
      </div>
    </div>
  );
}

export function AuthTabs({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="ezv-auth-modes">
      <Link
        href="/login"
        className={`ezv-auth-mode-btn ${mode === "login" ? "active" : ""}`}
      >
        Login
      </Link>
      <div className="ezv-auth-modes-divider" />
      <Link
        href="/register"
        className={`ezv-auth-mode-btn ${mode === "signup" ? "active" : ""}`}
      >
        Sign Up
      </Link>
    </div>
  );
}
