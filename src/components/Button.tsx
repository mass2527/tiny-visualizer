import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { centeredSquare } from "../utils/style";

type ButtonProps = {
  className?: string;
  onClick?: VoidFunction;
  children?: ReactNode;
  variant?: "primary" | "secondary";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function (
  {
    className,
    variant = "secondary",
    onClick,
    type = "button",
    children,
    ...props
  },
  ref
) {
  const baseClassName = (
    {
      primary: "bg-slate12 text-slate11 hover:text-white hover:bg-blue9",
      secondary: "bg-black text-white disabled:text-slate11 text-xs",
    } satisfies Record<NonNullable<ButtonProps["variant"]>, string>
  )[variant];

  return (
    <button
      type={type}
      className={`${centeredSquare} rounded-lg ${baseClassName} ${className}`}
      onClick={onClick}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});
