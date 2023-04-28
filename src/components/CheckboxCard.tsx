import * as Checkbox from "@radix-ui/react-checkbox";
import { ReactNode } from "react";

function CheckboxCard({
  label,
  checked,
  onCheckedChange,
  checkedIcon,
  defaultIcon,
}: {
  label: Checkbox.CheckboxProps["aria-label"];
  checked: Checkbox.CheckboxProps["checked"];
  onCheckedChange: Checkbox.CheckboxProps["onCheckedChange"];
  checkedIcon: ReactNode;
  defaultIcon: ReactNode;
}) {
  return (
    <label
      aria-label={label}
      className={`flex items-center justify-center w-8 h-8 rounded-lg
     ${
       checked
         ? "bg-blue9 text-white"
         : "text-slate11 hover:bg-blue10 hover:text-white"
     }`}
    >
      <Checkbox.Root checked={checked} onCheckedChange={onCheckedChange}>
        <Checkbox.Indicator>{checkedIcon}</Checkbox.Indicator>
      </Checkbox.Root>
      {!checked && defaultIcon}
    </label>
  );
}

export default CheckboxCard;
