"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-navy font-body">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-10 rounded-md border bg-white px-3 text-sm font-body text-navy-dark placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent disabled:opacity-50 ${
            error
              ? "border-burgundy focus:ring-burgundy"
              : "border-cream-dark hover:border-navy/30"
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-burgundy font-body">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500 font-body">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
