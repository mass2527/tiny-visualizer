import { useState } from "react";
import { Button } from "./Button";

function ColorPicker({
  value,
  onColorChange,
}: {
  value: string;
  onColorChange: (value: string) => void;
}) {
  // support only hex or named color
  const [color, setColor] = useState(value);

  return (
    <div className="flex gap-1">
      <Button
        onClick={() => {
          //
        }}
        className={`w-8 h-8 flex-none`}
        style={{
          backgroundColor: value,
        }}
      />

      <div className="flex items-center rounded-lg bg-gray12 px-4">
        <span>#</span>
        <input
          className="bg-transparent w-full"
          type="text"
          value={color.replace(/#/, "")}
          onChange={(event) => {
            const sanitizedColor = event.target.value
              .replace(/[^0-9a-z]/, "")
              .toLowerCase();

            const hexColorRegex = /^#([a-f0-9]{3}){1,2}$/;
            if (hexColorRegex.test(`#${sanitizedColor}`)) {
              setColor(`#${sanitizedColor}`);
              onColorChange(`#${sanitizedColor}`);
            } else {
              setColor(sanitizedColor);
            }

            const alphabetOnlyRegex = /^[a-z]+$/;
            if (!alphabetOnlyRegex.test(sanitizedColor)) {
              return;
            }

            const div = document.createElement("div");
            div.style.color = sanitizedColor;
            const isNamedColor = div.style.color !== "";
            div.remove();
            if (isNamedColor) {
              onColorChange(sanitizedColor);
            }
          }}
          onBlur={() => {
            setColor(value);
          }}
        />
      </div>
    </div>
  );
}

export default ColorPicker;
