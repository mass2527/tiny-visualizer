import { ChangeEventHandler, CSSProperties } from "react";

function Radio({
  label,
  value,
  checked,
  onChange,
  style,
}: {
  label: string;
  value: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  style?: CSSProperties;
}) {
  return (
    <label style={style}>
      <input type="radio" value={value} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default Radio;
