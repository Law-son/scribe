"use client";

import { forwardRef, SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-navy font-body">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`h-10 rounded-md border bg-white px-3 text-sm font-body text-navy-dark transition-colors focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent disabled:opacity-50 ${
            error ? "border-burgundy" : "border-cream-dark hover:border-navy/30"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-burgundy font-body">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
