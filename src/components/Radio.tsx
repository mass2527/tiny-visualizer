import { ChangeEventHandler } from "react";

function Radio({
  label,
  value,
  checked,
  onChange,
}: {
  label: string;
  value: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label
      style={{
        pointerEvents: "all",
      }}
    >
      <input type="radio" value={value} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default Radio;
