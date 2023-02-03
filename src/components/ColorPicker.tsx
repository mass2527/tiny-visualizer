import { ChangeEventHandler } from "react";

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        pointerEvents: "all",
      }}
    >
      {label}
      <input type="color" value={value} onChange={onChange} />
    </label>
  );
}

export default ColorPicker;
