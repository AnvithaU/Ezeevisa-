import { useState } from "react";
import { useLocation } from "wouter";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useGetVisaCountries } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const countryAliases: Record<string, string> = {
  Indonesia: "Indonesia (Bali)",
};

export default function WorldMap() {
  const [, setLocation] = useLocation();
  const { data: countries = [] } = useGetVisaCountries();

  const [tooltip, setTooltip] = useState<any>(null);

  return (
    <div className="relative w-full">
      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 20,
          }}
        >
          <div className="min-w-[280px] rounded-3xl border border-white/10 bg-slate-950/95 backdrop-blur-xl px-5 py-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{tooltip.country.flag}</span>

              <div>
                <div className="font-semibold text-white">
                  {tooltip.country.name}
                </div>

                <div className="text-xs text-slate-400">
                  {tooltip.country.continent}
                </div>
              </div>
            </div>

            {tooltip.country.fee && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] uppercase text-slate-500">
                      Visa Fee
                    </div>
                    <div className="font-bold text-amber-400">
                      {formatCurrency(tooltip.country.fee)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase text-slate-500">
                      Processing
                    </div>
                    <div className="text-white">
                      {tooltip.country.processingDays} Days
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase text-slate-500">
                      Max Stay
                    </div>
                    <div className="text-white">{tooltip.country.maxStay}</div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase text-slate-500">
                      Validity
                    </div>
                    <div className="text-white">{tooltip.country.validity}</div>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10 pt-3">
                  <div className="text-sm font-semibold text-amber-400">
                    Click to Apply →
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ComposableMap
        width={1200}
        height={550}
        projection="geoEqualEarth"
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "auto",
          margin: "0 auto",
          display: "block",
        }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }: any) =>
            geographies.map((geo: any) => {
              const geoName = geo.properties.name;

              const mapName = countryAliases[geoName] || geoName;

              const visaCountry = countries.find(
                (c) => c.name.toLowerCase() === mapName.toLowerCase(),
              );
              const isIndia = geo.properties.name === "India";
              const isVisaCountry = !!visaCountry;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e: any) => {
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      country:
                        geoName === "India"
                          ? {
                              name: "India",
                              flag: "🇮🇳",
                              continent: "Home Country",
                            }
                          : visaCountry || {
                              name: geoName,
                              flag: "🌍",
                              continent: "Country",
                            },
                    });
                  }}
                  onMouseMove={(e: any) => {
                    setTooltip((prev: any) =>
                      prev
                        ? {
                            ...prev,
                            x: e.clientX,
                            y: e.clientY,
                          }
                        : null,
                    );
                  }}
                  onMouseLeave={() => {
                    setTooltip(null);
                  }}
                  onClick={() => {
                    if (!visaCountry) return;

                    const target = `/apply/${visaCountry.code}`;

                    localStorage.setItem("selectedCountry", visaCountry.code);

                    if (!isAuthenticated()) {
                      localStorage.setItem("redirectAfterLogin", target);
                      setLocation("/login");
                      return;
                    }

                    setLocation(target);
                  }}
                  style={{
                    default: {
                      fill: isIndia
                        ? "#16a34a"
                        : isVisaCountry
                          ? "#2563eb"
                          : "#d1d5db",
                      stroke: "#ffffff",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    hover: {
                      fill: isIndia
                        ? "#22c55e"
                        : isVisaCountry
                          ? "#D4AF37"
                          : "#94a3b8",
                      stroke: "#ffffff",
                      strokeWidth: 0.8,
                      outline: "none",
                      cursor: isVisaCountry ? "pointer" : "default",
                    },
                    pressed: {
                      fill: "#B8860B",
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span>Available e-Visa Destinations</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>Home Country</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span>Hover for Details</span>
        </div>
      </div>
    </div>
  );
}
