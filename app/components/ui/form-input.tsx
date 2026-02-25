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
        <label className="text-sm font-semibold text-foreground transition-colors group-focus-within:text-primary">
          {label}
          {props.required && <span className="text-danger ms-0.5">*</span>}
        </label>
        <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-0.5">
          {Icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={`w-full ${
              Icon ? "pr-11 pl-4" : "px-4"
            } py-3.5 bg-surface-1 border border-card-border rounded-xl outline-none text-foreground placeholder:text-muted-foreground font-medium transition-all duration-300 focus:bg-surface-2 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30 ${className}`}
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
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, icon: Icon, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="group space-y-2">
        <label className="text-sm font-semibold text-foreground transition-colors group-focus-within:text-primary">
          {label}
          {props.required && <span className="text-danger ms-0.5">*</span>}
        </label>
        <div className="relative transition-all duration-300 transform group-focus-within:-translate-y-0.5">
          {Icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none">
              <Icon size={18} />
            </div>
          )}
          <select
            ref={ref}
            defaultValue={placeholder ? "" : undefined}
            {...props}
            className={`w-full ${
              Icon ? "pr-11 pl-4" : "px-4"
            } py-3.5 bg-surface-1 border border-card-border rounded-xl outline-none text-foreground font-medium transition-all duration-300 focus:bg-surface-2 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30 appearance-none cursor-pointer ${className}`}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
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
