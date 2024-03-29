import * as RadioGroup from "@radix-ui/react-radio-group";
import { RadioGroupItemProps } from "@radix-ui/react-radio-group";
import { ReactNode } from "react";
import { centeredSquare } from "../utils/style";

const RadioCardGroupRoot = RadioGroup.Root;

function RadioCardGroupItem({
  label,
  value,
  checked,
  icon,
  className,
}: {
  label: RadioGroupItemProps["aria-label"];
  value: RadioGroupItemProps["value"];
  checked: boolean;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <label aria-label={label}>
      <RadioGroup.Item
        className={`${centeredSquare} rounded-lg ${className}
        ${
          checked
            ? "bg-blue9 text-white"
            : "text-slate11 hover:bg-blue10 hover:text-white"
        }`}
        value={value}
      >
        {!checked && icon}
        <RadioGroup.Indicator>{icon}</RadioGroup.Indicator>
      </RadioGroup.Item>
    </label>
  );
}

const RadioCardGroup = {
  Root: RadioCardGroupRoot,
  Item: RadioCardGroupItem,
};

export default RadioCardGroup;
