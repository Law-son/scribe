"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (name: string) => void;
}

interface UserResult {
  id: string;
  name: string;
}

export function PreacherSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes (e.g. on edit page load)
  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => { setResults(d.users ?? []); setOpen(true); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(user: UserResult) {
    setQuery(user.name);
    onChange(user.name);
    setOpen(false);
  }

  return (
    <div className="relative flex-1" ref={containerRef}>
      <label className="block text-sm font-medium text-navy font-body mb-1">Preacher / Speaker *</label>
      <div className="relative">
        <input
          type="text"
          required
          placeholder="Search by name…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => { if (results.length) setOpen(true); }}
          className="w-full rounded-md border border-cream-dark bg-white px-3 py-2 text-sm font-body text-navy-dark placeholder:text-navy/30 focus:outline-none focus:ring-2 focus:ring-navy"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-navy/40 font-body">
            searching…
          </span>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-cream-dark rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm font-body text-navy hover:bg-cream transition-colors"
                onMouseDown={() => select(u)}
              >
                {u.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
