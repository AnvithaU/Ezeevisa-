import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { customFetch } from "@/lib/customFetch";
import { cn } from "@/lib/utils";

export default function WriteReview() {
  const [, setLocation] = useLocation();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !reviewText.trim() || !name.trim() || !destination.trim())
      return;

    setIsSubmitting(true);
    try {
      await customFetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: reviewText, name, destination }),
      });
      setSubmitted(true);
      // Let them see the success screen for 2.5s, then redirect to reviews!
      setTimeout(() => setLocation("/reviews"), 2500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card border border-border p-12 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Thank You!
          </h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Your review has been published. We deeply appreciate you sharing
            your journey with EzeVisa.
          </p>
          <div className="flex justify-center items-center gap-3 text-sm font-semibold text-primary">
            <Loader2 className="w-5 h-5 animate-spin" /> Returning to reviews...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 relative flex items-center justify-center">
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        <Link href="/reviews">
          <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 cursor-pointer transition-colors font-semibold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" />
            Back to Reviews
          </div>
        </Link>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card/80 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-[2.5rem] p-8 md:p-14"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Rate Your Experience
            </h1>
            <p className="text-lg text-muted-foreground">
              Your feedback is what drives us to provide a world-class visa
              experience.
            </p>
          </div>

          <div className="space-y-10">
            <div className="flex flex-col items-center justify-center bg-background/50 rounded-3xl p-10 border border-border/30 shadow-inner">
              <div className="flex gap-2 md:gap-4 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(star)}
                    className="relative transition-all"
                  >
                    <Star
                      className={cn(
                        "w-12 h-12 md:w-16 md:h-16 transition-all duration-300 stroke-[1.5px]",
                        (hoveredStar || rating) >= star
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-110"
                          : "fill-muted/20 text-foreground/40 hover:fill-muted/50",
                      )}
                    />
                  </motion.button>
                ))}
              </div>
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {rating === 0
                  ? "Select a rating"
                  : rating === 5
                    ? "Excellent!"
                    : rating === 4
                      ? "Very Good"
                      : rating === 3
                        ? "Average"
                        : rating === 2
                          ? "Poor"
                          : "Terrible"}
              </span>
            </div>

            <AnimatePresence>
              {rating > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="space-y-8 overflow-hidden pt-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        className="w-full px-6 py-4 bg-background border border-border/50 rounded-2xl text-base focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">
                        Destination
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dubai, UAE"
                        className="w-full px-6 py-4 bg-background border border-border/50 rounded-2xl text-base focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">
                      Your Story
                    </label>
                    <textarea
                      placeholder="How was the application process? Did you get your visa on time?"
                      className="w-full px-6 py-5 bg-background border border-border/50 rounded-2xl text-base focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none resize-none leading-relaxed"
                      rows={5}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                    />
                  </div>

                  <button
                    disabled={
                      isSubmitting ||
                      !reviewText.trim() ||
                      !name.trim() ||
                      !destination.trim()
                    }
                    onClick={handleSubmit}
                    className="w-full py-5 bg-primary text-primary-foreground font-bold text-lg rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_40px_rgba(var(--primary),0.4)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 flex justify-center items-center gap-3 mt-4"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" /> Publish Review
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
