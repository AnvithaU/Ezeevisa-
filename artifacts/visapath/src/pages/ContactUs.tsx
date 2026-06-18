import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { customFetch } from "@/lib/customFetch";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function ContactUs() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await customFetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setSent(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <MessageSquare className="w-4 h-4" />
          Here to help
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="text-4xl md:text-5xl font-bold text-foreground font-serif tracking-tight mb-4"
        >
          Get in <span className="text-gold-gradient">Touch</span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-lg text-muted-foreground leading-relaxed"
        >
          Have a question about your visa application or our services? Our
          dedicated support team is available 24/7 to assist you.
        </motion.p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-12 items-start">
        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-4 group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
              <p className="text-sm text-muted-foreground mb-2">
                For general inquiries and support
              </p>
              <a
                href="mailto:support@ezevisa.com"
                className="text-primary font-medium hover:underline"
              >
                support@ezevisa.com
              </a>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-4 group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Call Us</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Available Mon-Fri, 9am - 6pm
              </p>
              <a
                href="tel:+18001234567"
                className="text-primary font-medium hover:underline"
              >
                +1 (800) 123-4567
              </a>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-4 group hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Visit Us</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                123 Visa Hub Avenue
                <br />
                Business District
                <br />
                New York, NY 10001
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 p-8 md:p-10 rounded-2xl bg-card border border-border shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-32 -mt-32 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl font-bold text-foreground mb-6">
            Send us a message
          </h2>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Message Sent!
              </h3>
              <p className="text-muted-foreground">
                We'll get back to you as soon as possible.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-primary hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Your Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Subject
                </label>
                <input
                  required
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>
              <button
                disabled={loading}
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-gold-gradient text-[hsl(217_60%_10%)] font-bold rounded-xl hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send Message <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
