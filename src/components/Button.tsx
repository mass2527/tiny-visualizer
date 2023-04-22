import { ButtonHTMLAttributes, ReactNode } from "react";
import { centeredSquare } from "../utils/style";

type ButtonProps = {
  className?: string;
  onClick: VoidFunction;
  children: ReactNode;
  variant?: "primary" | "secondary";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  className,
  variant = "secondary",
  onClick,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const baseClassName = (
    {
      primary: "bg-gray12 text-gray11 hover:text-white hover:bg-blue9",
      secondary: "bg-black text-white disabled:text-gray11 text-xs",
    } satisfies Record<NonNullable<ButtonProps["variant"]>, string>
  )[variant];

  return (
    <button
      type={type}
      className={`${centeredSquare} rounded-lg ${baseClassName} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
