import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetVisaCountries } from "@workspace/api-client-react";
import { Globe, Clock, Shield, CheckCircle, ArrowRight, Zap, FileCheck, Plane } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function Landing() {
  const { data: countries } = useGetVisaCountries();
  const featured = countries?.filter((c) => c.isFeatured) ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-32">
          <motion.div
            className="max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium">
                <Zap className="w-3.5 h-3.5" />
                Fast e-Visa processing for Indian passport holders
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight"
            >
              Your visa.{" "}
              <span className="text-primary">Done right.</span>
              <br />
              Done fast.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl"
            >
              Apply for e-visas to Dubai, Vietnam, Singapore, Malaysia, Thailand, and 8 more countries — all from one trusted platform. Upload documents, track your application, and receive your approved visa digitally.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex items-center gap-4">
              <Link href="/apply">
                <div className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all hover:shadow-md cursor-pointer group">
                  Start Your Application
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
              <Link href="/track">
                <div className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors cursor-pointer text-sm">
                  Track Existing Visa
                </div>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>24-hour support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>96% approval rate</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative background element */}
        <div className="absolute -right-24 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-accent/30 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Stats */}
      <section className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {[
              { value: "12+", label: "Countries" },
              { value: "96%", label: "Approval Rate" },
              { value: "2-5", label: "Days Processing" },
              { value: "50K+", label: "Visas Issued" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-primary-foreground/70">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-12"
          >
            <motion.p variants={fadeUp} className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Top Destinations
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold text-foreground">
              Popular e-Visa destinations
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-muted-foreground max-w-xl">
              Fast, affordable e-visas for Indian passport holders. Processing starts within hours.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            {featured.map((country) => (
              <motion.div key={country.code} variants={fadeUp}>
                <Link href={`/apply/${country.code}`}>
                  <div className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{country.flag}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {country.continent}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">{country.name}</h3>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {country.processingDays} day{country.processingDays !== 1 ? "s" : ""} processing
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Stay up to {country.maxStay}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">From </span>
                        <span className="text-base font-bold text-primary">
                          {formatCurrency(country.fee)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Apply <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 text-center">
            <Link href="/apply">
              <div className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer">
                View all destinations
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-muted/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.p variants={fadeUp} className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Simple Process
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold text-foreground">
              Your visa in 4 easy steps
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                icon: Globe,
                step: "01",
                title: "Choose destination",
                desc: "Select your destination country and preferred visa type from our curated list.",
              },
              {
                icon: FileCheck,
                step: "02",
                title: "Fill application",
                desc: "Complete the guided form with your personal and travel details. Takes under 10 minutes.",
              },
              {
                icon: Shield,
                step: "03",
                title: "Upload documents",
                desc: "Securely upload your passport copy, photo, and supporting documents.",
              },
              {
                icon: Plane,
                step: "04",
                title: "Receive your visa",
                desc: "Get your approved e-visa directly to your email within the processing period.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  variants={fadeUp}
                  className="relative bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground">{item.step}</span>
                      <h3 className="mt-0.5 font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="glass-panel rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 120% at 100% 0%, hsl(43 54% 54% / 0.12), transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
                Ready to start your{" "}
                <span className="text-gold-gradient">journey?</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md">
                Join thousands of Indian travelers who get their e-visas quickly and hassle-free through VisaPath.
              </p>
            </div>
            <div className="relative flex items-center gap-3 flex-shrink-0">
              <Link href="/register">
                <div className="px-6 py-3 bg-gold-gradient text-[hsl(217_60%_10%)] rounded-lg font-semibold hover:brightness-110 transition-all cursor-pointer shadow-md">
                  Create Free Account
                </div>
              </Link>
              <Link href="/apply">
                <div className="px-6 py-3 border border-primary/40 text-foreground rounded-lg font-medium hover:bg-primary/10 transition-colors cursor-pointer">
                  Browse Countries
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
