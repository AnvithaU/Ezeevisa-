import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetVisaCountries } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Clock, Globe, Search, ArrowRight, Filter } from "lucide-react";

const stagger = { visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

const CONTINENTS = ["All", "Asia", "Europe", "Africa"];

export default function ApplyCountries() {
  const { data: countries, isLoading } = useGetVisaCountries();
  const [search, setSearch] = useState("");
  const [continent, setContinent] = useState("All");

  const filtered = (countries ?? []).filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchContinent = continent === "All" || c.continent === continent;
    return matchSearch && matchContinent;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm font-medium text-primary mb-1">Apply for e-Visa</p>
        <h1 className="text-3xl font-bold text-foreground">Choose your destination</h1>
        <p className="mt-2 text-muted-foreground">
          Select a country to see available visa types and requirements
        </p>
      </motion.div>

      {/* Search + Filter */}
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

      {/* Countries Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
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
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
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
              <Link href={`/apply/${country.code}`}>
                <div className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{country.flag}</span>
                    {country.isFeatured && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground">{country.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{country.continent}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{country.processingDays} day{country.processingDays !== 1 ? "s" : ""} processing</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Stay up to {country.maxStay}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {country.visaTypes.length} visa type{country.visaTypes.length !== 1 ? "s" : ""} available
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">From </span>
                      <span className="font-bold text-primary text-sm">
                        {formatCurrency(country.fee)}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
