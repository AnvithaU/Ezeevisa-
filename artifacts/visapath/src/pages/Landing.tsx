import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetVisaCountries } from "@workspace/api-client-react";
import WorldMap from "@/components/WorldMap/WorldMap";
import {
  Globe,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Zap,
  FileCheck,
  Plane,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";

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

// Image mappings for the photo cards
// Image mappings for the photo cards
const countryImages: Record<string, string> = {
  Malaysia: "/countries/malaysia2.jpg",
  Singapore: "/countries/singapore2.jpg",
  "Sri Lanka": "/countries/srilanka2.jpg",
  Thailand: "/countries/thailand2.jpg",
  Turkey: "/countries/turkey2.jpg",
  Vietnam: "/countries/vietnam2.jpg",
  "United Arab Emirates": "/countries/uae2.jpg",
};

const countryDescriptions: Record<string, string> = {
  Thailand: "Explore beaches, nightlife and temples.",
  Vietnam: "Discover culture, food and scenic landscapes.",
  Turkey: "Visit Istanbul and Cappadocia with ease.",
  Egypt: "Experience the pyramids and ancient history.",
  Kenya: "Enjoy wildlife safaris and nature adventures.",
  Oman: "Explore deserts, mountains and rich heritage.",
  Malaysia: "Modern cities and tropical islands await.",
  Singapore: "A clean, futuristic city full of attractions.",
  "Sri Lanka": "Beautiful beaches, tea estates and culture.",
  Cambodia: "Visit Angkor Wat and stunning historical sites.",
  "Indonesia (Bali)": "Relax in Bali's beaches and luxury resorts.",
  "United Arab Emirates": "Experience Dubai and Abu Dhabi.",
};

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleApplyClick = (href: string) => {
    if (!isAuthenticated()) {
      localStorage.setItem("redirectAfterLogin", href);
      setLocation("/apply");
      return;
    }

    setLocation(href);
  };

  const { data: countries } = useGetVisaCountries();
  const featured = countries?.filter((c) => c.isFeatured) ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-center">
            {/* Left Side */}
            <motion.div
              className="max-w-2xl"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div
                variants={fadeUp}
                className="flex items-center gap-2 mb-6"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  Fast e-Visa processing for Indian passport holders
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight"
              >
                Your visa. <span className="text-primary">Done right.</span>
                <br />
                Done fast.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl"
              >
                Apply for e-visas to Dubai, Vietnam, Singapore, Malaysia,
                Thailand, and 8 more countries — all from one trusted platform.
                Upload documents, track your application, and receive your
                approved visa digitally.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-8 flex items-center gap-4"
              >
                <div
                  onClick={() => handleApplyClick("/apply")}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all hover:shadow-md cursor-pointer group"
                >
                  Start Your Application
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <Link href="/track">
                  <div className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors cursor-pointer text-sm">
                    Track Existing Visa
                  </div>
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex items-center gap-6 text-sm text-muted-foreground"
              >
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

            {/* Right Side Map */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-center items-start w-full"
            >
              <WorldMap />
            </motion.div>
          </div>
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
                <p className="text-3xl font-bold text-primary-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-primary-foreground/70">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Destinations (Now using beautiful Photo Cards) */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="mb-12"
          >
            <motion.p
              variants={fadeUp}
              className="text-sm font-medium text-primary uppercase tracking-wider mb-2"
            >
              Top Destinations
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold text-foreground"
            >
              Popular e-Visa destinations
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-3 text-muted-foreground max-w-xl"
            >
              Fast, affordable e-visas for Indian passport holders. Processing
              starts within hours.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            {featured.map((country) => (
              <motion.div key={country.code} variants={fadeUp}>
                <div
                  onClick={() => {
                    const target = `/apply/${country.code}`;
                    localStorage.setItem("selectedCountry", country.code);

                    if (!isAuthenticated()) {
                      localStorage.setItem("redirectAfterLogin", target);
                      setLocation("/login");
                    } else {
                      setLocation(target);
                    }
                  }}
                  // Increased height to h-[380px], added rounded-2xl, and beautiful gold glow on hover
                  className="relative group rounded-2xl overflow-hidden h-[380px] cursor-pointer shadow-lg border border-white/10 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.4)] hover:border-amber-400/60"
                  style={{
                    backgroundImage: `url(${countryImages[country.name] || ""})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 group-hover:from-black group-hover:via-black/60 transition-all duration-500" />

                  {/* GOLD GLOW OVERLAY ON HOVER */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />

                  {/* CONTENT */}
                  <div className="relative z-10 h-full p-5 flex flex-col justify-between text-white">
                    {/* TOP */}
                    <div className="flex items-start justify-between">
                      <span className="text-4xl drop-shadow-md">
                        {country.flag}
                      </span>

                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-400 text-black text-[11px] font-bold shadow-lg">
                        ⭐ Featured
                      </div>
                    </div>

                    {/* BOTTOM */}
                    <div className="relative">
                      <h3 className="font-semibold text-2xl tracking-wide group-hover:text-amber-300 transition-colors duration-300">
                        {country.name}
                      </h3>

                      <div className="mt-2 flex gap-2">
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-[10px] font-medium border border-green-500/20 backdrop-blur-sm">
                          Fast Approval
                        </span>

                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium border border-blue-500/20 backdrop-blur-sm">
                          e-Visa
                        </span>
                      </div>

                      {/* NON-HOVER STATE */}
                      <div className="group-hover:hidden transition-all duration-300">
                        <div className="mt-3 text-sm opacity-80 font-medium">
                          {country.processingDays} day
                          {country.processingDays !== 1 ? "s" : ""} processing
                        </div>

                        <div className="mt-1 text-sm opacity-80 font-medium">
                          Stay up to {country.maxStay}
                        </div>

                        <div
                          className="mt-3 text-xl font-bold text-amber-300"
                          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
                        >
                          {formatCurrency(country.fee)}
                        </div>
                      </div>

                      {/* HOVER CONTENT (Only visible when hovering) */}
                      <div className="hidden group-hover:block mt-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="text-sm text-white/90 leading-relaxed font-medium">
                          {countryDescriptions[country.name] ||
                            `Apply for your ${country.name} e-Visa quickly and securely.`}
                        </p>

                        <div className="mt-4 pt-4 border-t border-white/20">
                          <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-amber-300">
                              {formatCurrency(country.fee)}
                            </div>
                            <div className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
                              {country.continent}
                            </div>
                          </div>

                          <div className="mt-4 inline-flex w-full justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 text-black text-sm font-bold shadow-[0_0_15px_rgba(251,191,36,0.5)] hover:bg-amber-300 transition-all duration-300">
                            Start Application
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
            <motion.p
              variants={fadeUp}
              className="text-sm font-medium text-primary uppercase tracking-wider mb-2"
            >
              Simple Process
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold text-foreground"
            >
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
                      <span className="text-xs font-bold text-muted-foreground">
                        {item.step}
                      </span>
                      <h3 className="mt-0.5 font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
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
                Join thousands of Indian travelers who trust EzeVisa for fast,
                secure, and hassle-free e-visa processing.
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
