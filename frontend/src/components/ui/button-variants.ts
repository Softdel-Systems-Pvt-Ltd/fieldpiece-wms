import { cva } from "class-variance-authority";

// Section 5.1. One primary action per view. Primary is always black text on yellow.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-ink-1000 hover:bg-brand-600 active:bg-brand-700 active:text-ink-0 disabled:hover:bg-brand-500",
        secondary: "border border-ink-1000 bg-ink-0 text-ink-1000 hover:bg-ink-50 active:bg-ink-100",
        dark: "bg-ink-900 text-ink-0 hover:bg-ink-700 active:bg-ink-1000",
        ghost: "text-ink-700 hover:bg-ink-50 active:bg-ink-100 dark:text-ink-100 dark:hover:bg-ink-700",
        danger: "bg-danger text-ink-0 hover:brightness-90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-body",
        lg: "h-12 px-5 text-body",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
