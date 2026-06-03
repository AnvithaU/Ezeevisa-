import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface Country {
  f: string;
  c: string;
  n: string;
}

export const CC_DATA: Country[] = [
  { f: "🇮🇳", c: "+91", n: "India" },
  { f: "🇺🇸", c: "+1", n: "USA" },
  { f: "🇬🇧", c: "+44", n: "UK" },
  { f: "🇦🇪", c: "+971", n: "UAE" },
  { f: "🇸🇬", c: "+65", n: "Singapore" },
  { f: "🇦🇺", c: "+61", n: "Australia" },
  { f: "🇯🇵", c: "+81", n: "Japan" },
  { f: "🇩🇪", c: "+49", n: "Germany" },
  { f: "🇫🇷", c: "+33", n: "France" },
  { f: "🇨🇳", c: "+86", n: "China" },
  { f: "🇷🇺", c: "+7", n: "Russia" },
  { f: "🇧🇷", c: "+55", n: "Brazil" },
  { f: "🇲🇽", c: "+52", n: "Mexico" },
  { f: "🇰🇷", c: "+82", n: "S. Korea" },
  { f: "🇮🇩", c: "+62", n: "Indonesia" },
  { f: "🇹🇭", c: "+66", n: "Thailand" },
  { f: "🇲🇾", c: "+60", n: "Malaysia" },
  { f: "🇿🇦", c: "+27", n: "S. Africa" },
  { f: "🇪🇬", c: "+20", n: "Egypt" },
  { f: "🇳🇬", c: "+234", n: "Nigeria" },
  { f: "🇵🇰", c: "+92", n: "Pakistan" },
  { f: "🇧🇩", c: "+880", n: "Bangladesh" },
  { f: "🇵🇭", c: "+63", n: "Philippines" },
  { f: "🇻🇳", c: "+84", n: "Vietnam" },
  { f: "🇮🇹", c: "+39", n: "Italy" },
  { f: "🇪🇸", c: "+34", n: "Spain" },
  { f: "🇳🇱", c: "+31", n: "Netherlands" },
  { f: "🇸🇦", c: "+966", n: "Saudi Arabia" },
  { f: "🇹🇷", c: "+90", n: "Turkey" },
  { f: "🇨🇦", c: "+1", n: "Canada" },
];

interface Props {
  value: Country;
  onChange: (country: Country) => void;
}

export default function CountryCodePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("click", handler);
    const t = setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("click", handler);
      clearTimeout(t);
    };
  }, [open]);

  const q = query.toLowerCase().replace(/\+/g, "");
  const filtered = q
    ? CC_DATA.filter(
        (d) =>
          d.n.toLowerCase().includes(q) ||
          d.c.includes(q) ||
          d.c.replace("+", "").includes(q)
      )
    : CC_DATA;

  return (
    <div className="ezv-cc-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`ezv-cc-trigger ${open ? "open" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span className="ezv-cc-trigger-text">
          {value.f} {value.c}
        </span>
        <span className="ezv-cc-chevron">
          <ChevronDown size={12} strokeWidth={2} />
        </span>
      </button>

      {open && (
        <div className="ezv-cc-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="ezv-cc-search-wrap">
            <span className="ezv-cc-search-icon">
              <Search size={13} strokeWidth={2} />
            </span>
            <input
              ref={searchRef}
              className="ezv-cc-search"
              type="text"
              placeholder="Search country or code..."
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="ezv-cc-list">
            {filtered.length === 0 ? (
              <div className="ezv-cc-no-results">No results</div>
            ) : (
              filtered.map((d) => (
                <div
                  key={`${d.c}-${d.n}`}
                  className={`ezv-cc-item ${
                    d.c === value.c && d.n === value.n ? "selected" : ""
                  }`}
                  onClick={() => {
                    onChange(d);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span className="ezv-cc-item-flag">{d.f}</span>
                  <span className="ezv-cc-item-name">{d.n}</span>
                  <span className="ezv-cc-item-code">{d.c}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
