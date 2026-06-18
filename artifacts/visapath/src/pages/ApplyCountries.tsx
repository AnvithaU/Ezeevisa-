import { useState } from "react";
import { motion } from "framer-motion";
import { useGetVisaCountries } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Globe, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { isAuthenticated } from "@/lib/auth";

const stagger = { visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const CONTINENTS = ["All", "Asia", "Europe", "Africa"];

export default function ApplyCountries() {
  const { data: countries, isLoading } = useGetVisaCountries();
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("All");
  const [, setLocation] = useLocation();

  const countryImages: Record<string, string> = {
    "Indonesia (Bali)": "/countries/Bali.jpg",
    Cambodia: "/countries/cambodia.jpg",
    Egypt: "/countries/Egypt.jpg",
    Kenya: "/countries/Kenya.jpg",
    Malaysia: "/countries/malaysia.jpg",
    Oman: "/countries/Oman.jpg",
    Singapore: "/countries/singapore.jpg",
    "Sri Lanka": "/countries/Srilanka.jpg",
    Thailand: "/countries/thailand.jpg",
    Turkey: "/countries/Turkey.jpg",
    Vietnam: "/countries/Vietnam.jpg",
    "United Arab Emirates": "/countries/UAE.jpg",
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

  const filtered = (countries ?? []).filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());

    const matchContinent = continent === "All" || c.continent === continent;

    return matchSearch && matchContinent;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* HEADER */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm font-medium text-primary mb-1">
          Apply for e-Visa
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">
            Choose your destination
          </h1>

          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            {filtered.length} Countries
          </span>
        </div>
        <p className="mt-2 text-muted-foreground">
          {filtered.length} destinations available for e-Visa applications
        </p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">50K+</div>
          <div className="text-sm text-muted-foreground">Visas Issued</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">96%</div>
          <div className="text-sm text-muted-foreground">Approval Rate</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">24/7</div>
          <div className="text-sm text-muted-foreground">Support</div>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1">
            {CONTINENTS.map((c) => (
              <button
                key={c}
                onClick={() => setContinent(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  continent === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 animate-pulse"
            >
              <div className="w-12 h-12 bg-muted rounded-lg mb-4" />
              <div className="h-4 bg-muted rounded mb-3 w-2/3" />
              <div className="h-3 bg-muted rounded mb-2 w-1/2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-medium text-foreground">No countries found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {filtered.map((country) => (
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
                // Changed from h-72 to h-[22rem] here to prevent content clipping
                className="relative group rounded-xl overflow-hidden h-[22rem] cursor-pointer shadow-md hover:shadow-2xl border border-white/10 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
                style={{
                  backgroundImage: `url(${countryImages[country.name] || ""})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:from-black/90 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* CONTENT */}
                <div className="relative z-10 h-full p-4 flex flex-col justify-between text-white">
                  {/* TOP */}
                  <div className="flex items-start justify-between">
                    <span className="text-4xl">{country.flag}</span>

                    {country.isFeatured && (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-400 text-black text-[11px] font-bold shadow-lg">
                        ⭐ Featured
                      </div>
                    )}
                  </div>

                  {/* BOTTOM */}
                  <div className="relative">
                    <h3 className="font-semibold text-lg">{country.name}</h3>

                    <div className="mt-2 flex gap-2">
                      <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-[10px] font-medium">
                        Fast Approval
                      </span>

                      <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium">
                        e-Visa
                      </span>
                    </div>

                    <div className="group-hover:hidden">
                      <div className="mt-2 text-xs opacity-80">
                        {country.processingDays} day
                        {country.processingDays !== 1 ? "s" : ""} processing
                      </div>

                      <div className="mt-1 text-xs opacity-80">
                        Stay up to {country.maxStay}
                      </div>

                      <div
                        className="mt-2 font-bold text-amber-300"
                        style={{ textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}
                      >
                        {formatCurrency(country.fee)}
                      </div>
                    </div>

                    <div className="hidden group-hover:block mt-2">
                      <p className="text-sm text-white leading-relaxed">
                        {countryDescriptions[country.name] ||
                          `Apply for your ${country.name} e-Visa quickly and securely.`}
                      </p>
                      <div className="mt-3 text-sm font-semibold text-yellow-300">
                        Visa from {formatCurrency(country.fee)}
                      </div>

                      <p className="text-xs opacity-80">{country.continent}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-200 text-[10px] font-medium">
                          {country.processingDays} Days
                        </span>
                      </div>

                      <div className="text-xs text-white/80">
                        Stay up to {country.maxStay}
                      </div>
                      <div className="mt-4">
                        {/* Fixed the typo in class (shadow-lgtransition-all -> shadow-lg transition-all) */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300/40 bg-black/30 backdrop-blur-md text-amber-300 text-sm font-semibold shadow-lg transition-all duration-300 group-hover:bg-amber-300/10">
                          Start Application
                          <span className="transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
