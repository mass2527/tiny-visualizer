import { useState } from "react";
import { Button } from "./Button";
import { usePrevious } from "../hooks";

function ColorPicker({
  value,
  onColorChange,
}: {
  value: string;
  onColorChange: (value: string) => void;
}) {
  // support only hex or named color
  const [color, setColor] = useState(value);
  const previousColor = usePrevious(color);

  if (value !== color && color === previousColor) {
    setColor(value);
  }

  const shouldShowTransparentImage = value === "transparent" || value === "";

  return (
    <div className="flex gap-1">
      <Button
        onClick={() => {
          //
        }}
        className={`w-8 h-8 flex-none`}
        style={{
          backgroundColor: shouldShowTransparentImage ? "#fff" : value,
          backgroundImage: shouldShowTransparentImage
            ? "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==)"
            : undefined,
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
