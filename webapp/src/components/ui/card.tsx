import React from "react";

export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl p-3 bg-neutral-900 border border-neutral-800 ${className}`} {...rest}>{children}</div>;
}

export function CardHeader({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-2 ${className}`} {...rest}>{children}</div>;
}

export function CardContent({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`${className}`} {...rest}>{children}</div>;
}

export function CardTitle({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-lg font-semibold ${className}`} {...rest}>{children}</div>;
}
