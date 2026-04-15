import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Globe } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Globe className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl font-semibold text-foreground mb-2">Page not found</p>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
