import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { inputClasses } from "./Input";

// Native select for simple filters and forms. Works with react-hook-form `register` and on mobile.
// Use the Radix-based Select when you need rich option content.
export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function NativeSelect({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(inputClasses, "pe-8", className)} {...props}>
        {children}
      </select>
    );
  },
);
