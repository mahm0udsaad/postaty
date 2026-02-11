import React, { forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon: Icon, className, ...props }, ref) => {
    return (
      <div className="group space-y-2">
        <label className="text-sm font-semibold text-slate-700 transition-colors group-focus-within:text-primary">
          {label}
        </label>
        <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-0.5">
          {Icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={`w-full ${
              Icon ? "pr-11 pl-4" : "px-4"
            } py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 placeholder:text-slate-400 font-medium transition-all duration-300 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 ${className}`}
          />
        </div>
      </div>
    );
  }
);
FormInput.displayName = "FormInput";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: LucideIcon;
  options: readonly string[] | string[];
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, icon: Icon, options, className, ...props }, ref) => {
    return (
      <div className="group space-y-2">
        <label className="text-sm font-semibold text-slate-700 transition-colors group-focus-within:text-primary">
          {label}
        </label>
        <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-0.5">
          {Icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-10 pointer-events-none">
              <Icon size={18} />
            </div>
          )}
          <select
            ref={ref}
            {...props}
            className={`w-full ${
              Icon ? "pr-11 pl-4" : "px-4"
            } py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 font-medium transition-all duration-300 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 appearance-none cursor-pointer ${className}`}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }
);
FormSelect.displayName = "FormSelect";
