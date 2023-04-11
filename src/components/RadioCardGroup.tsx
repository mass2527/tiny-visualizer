import * as RadioGroup from "@radix-ui/react-radio-group";
import { RadioGroupItemProps } from "@radix-ui/react-radio-group";
import { ReactNode } from "react";

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
    <label aria-label={label} className="pointer-events-auto">
      <RadioGroup.Item
        className={`flex items-center justify-center w-8 h-8 rounded-lg text-gray11 ${className}
        ${checked && "bg-blue9 text-white"}
        ${!checked && "hover:bg-blue10 hover:text-white"}`}
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
