import { motion } from "framer-motion";
import { Star, Quote, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { customFetch } from "@/lib/customFetch";
import { cn } from "@/lib/utils";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const DUMMY_REVIEWS = [
  {
    id: 1,
    name: "Priya Sharma",
    destination: "Dubai (UAE)",
    text: "Absolutely seamless experience! I needed my e-visa urgently for a business trip and I received it within 24 hours.",
    date: "2 days ago",
    rating: 5,
  },
  {
    id: 2,
    name: "Rahul Verma",
    destination: "Singapore",
    text: "I was skeptical at first, but EzeVisa made it so easy. The automatic passport scanner saved me a lot of typing.",
    date: "1 week ago",
    rating: 5,
  },
  {
    id: 3,
    name: "Anjali Gupta",
    destination: "Thailand",
    text: "No hidden fees, no confusing forms. The 4-step process is exactly as advertised.",
    date: "2 weeks ago",
    rating: 5,
  },
];

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    customFetch("/api/reviews")
      .then((data: any) => {
        if (data && data.length > 0) {
          setReviews(data);
        } else {
          setReviews(DUMMY_REVIEWS);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setReviews(DUMMY_REVIEWS);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
        >
          <Star className="w-4 h-4 fill-primary text-primary" />
          Top Rated Service
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-4xl md:text-5xl font-bold text-foreground font-serif tracking-tight mb-4"
        >
          Loved by <span className="text-gold-gradient">Thousands</span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-lg text-muted-foreground leading-relaxed"
        >
          Don't just take our word for it. Read what travelers have to say about
          their seamless visa experience with EzeVisa.
        </motion.p>
      </motion.div>

      {/* Trust Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
      >
        <div className="bg-card border border-border rounded-2xl p-6 text-center flex flex-col items-center justify-center shadow-sm">
          <span className="text-3xl font-bold text-foreground mb-1">4.9/5</span>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">Average Rating</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
          <span className="block text-3xl font-bold text-primary mb-1">
            50K+
          </span>
          <span className="text-sm text-muted-foreground">Visas Issued</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
          <span className="block text-3xl font-bold text-primary mb-1">
            96%
          </span>
          <span className="text-sm text-muted-foreground">Approval Rate</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-sm">
          <span className="block text-3xl font-bold text-primary mb-1">
            24h
          </span>
          <span className="text-sm text-muted-foreground">Avg. Processing</span>
        </div>
      </motion.div>

      {/* Review Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              variants={fadeUp}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: review.rating || 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-primary/20" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                "{review.text}"
              </p>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {review.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Traveled to {review.destination}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Premium Call to Action */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-card border border-border rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden max-w-5xl mx-auto mt-24 shadow-2xl"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 120%, hsl(var(--primary) / 0.15), transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Star className="w-10 h-10 text-primary fill-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Share Your Journey
          </h2>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Have you traveled using EzeVisa? We'd love to hear about your
            experience. Your feedback guides thousands of future travelers.
          </p>
          <Link href="/write-review">
            <button className="px-10 py-4 bg-primary text-primary-foreground font-bold text-lg rounded-2xl hover:bg-primary/90 transition-all shadow-[0_0_40px_rgba(var(--primary),0.4)] flex items-center justify-center gap-3 mx-auto hover:-translate-y-1 active:translate-y-0 duration-200">
              Write a Review <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
