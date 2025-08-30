import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
};

export function Button({ variant = "default", className = "", children, ...rest }: Props) {
  const base = "inline-flex items-center justify-center px-4 py-2 rounded-2xl text-sm font-medium";
  const style = variant === "ghost" ? "bg-transparent" : "bg-white/10 hover:bg-white/20";
  return (
    <button className={`${base} ${style} ${className}`} {...rest}>
      {children}
    </button>
  );
}
