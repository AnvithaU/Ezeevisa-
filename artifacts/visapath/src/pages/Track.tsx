import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, CheckCircle2, XCircle, FileText, ArrowRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Track() {
  const [refInput, setRefInput] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (refInput.trim()) setSearched(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Globe className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Track Your Visa</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your reference number to check your application status
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value.toUpperCase())}
              placeholder="e.g. VPXYZ12345"
              className="w-full pl-10 pr-4 py-3 bg-card border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono tracking-wider"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-all"
          >
            Track
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <AnimatePresence>
          {searched && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-6 bg-card border border-border rounded-xl"
            >
              <p className="text-sm text-muted-foreground mb-4 font-mono">
                Reference: {refInput}
              </p>
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-amber-300" />
                </div>
                <p className="font-semibold text-foreground">Application Under Review</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                  Your application is being processed. You will receive an email once a decision is made.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="font-medium text-foreground mt-0.5">UAE (Dubai)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visa Type</p>
                  <p className="font-medium text-foreground mt-0.5">Tourist - 30 Days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="font-medium text-foreground mt-0.5">12 Apr 2026</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected Decision</p>
                  <p className="font-medium text-foreground mt-0.5">15 Apr 2026</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Info cards */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Apply Online", desc: "Fill form in 10 min" },
          { icon: Clock, label: "Fast Processing", desc: "2-5 business days" },
          { icon: CheckCircle2, label: "96% Approval", desc: "Expert reviewed" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="text-center p-4 bg-card border border-border rounded-xl">
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
