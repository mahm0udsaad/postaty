"use client";

import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputClassName =
  "px-4 py-2.5 bg-surface-1 border border-card-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 w-full ltr:pr-10 rtl:pl-10";

interface PasswordInputProps {
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { name = "password", placeholder = "••••••••", ...props },
    ref
  ) {
    const [show, setShow] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          name={name}
          className={inputClassName}
          placeholder={placeholder}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }
);
