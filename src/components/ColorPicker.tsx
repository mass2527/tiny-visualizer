import { ChangeEventHandler } from "react";

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="flex flex-col">
      {label}
      <input type="color" value={value} onChange={onChange} />
    </label>
  );
}

export default ColorPicker;
