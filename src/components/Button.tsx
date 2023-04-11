import { ReactNode } from "react";
import { centeredSquare } from "../utils/style";

function Button({
  className,
  onClick,
  disabled,
  children,
}: {
  className?: string;
  onClick: VoidFunction;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${centeredSquare} bg-black text-white disabled:text-gray11  pointer-events-auto text-xs ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
