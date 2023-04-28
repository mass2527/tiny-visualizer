import { useState } from "react";
import { Button } from "./Button";
import { usePrevious } from "../hooks";
import * as Popover from "@radix-ui/react-popover";
import {
  blue,
  green,
  orange,
  red,
  purple,
  yellow,
  pink,
  indigo,
  slate,
} from "@radix-ui/colors";

import { convertHslToHex } from "../utils";

function ColorPicker({
  value,
  onColorChange,
  scale,
}: {
  value: string;
  onColorChange: (value: string) => void;
  scale: 9 | 11;
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
      <Popover.Root>
        <Popover.Trigger asChild>
          <Button
            className={`w-8 h-8 flex-none`}
            style={{
              backgroundColor: shouldShowTransparentImage ? "#fff" : value,
              backgroundImage: shouldShowTransparentImage
                ? "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==)"
                : undefined,
            }}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="grid grid-cols-3 gap-1 z-10 rounded-lg p-1 bg-black cursor-default"
            sideOffset={5}
            side="right"
            align="start"
          >
            {[
              red,
              orange,
              yellow,
              green,
              blue,
              indigo,
              purple,
              pink,
              slate,
            ].map((color) => {
              const regex = new RegExp(`.*${scale}$`);
              const colorKey = Object.keys(color).find((key) => {
                return regex.test(key);
              });
              const updatedColor = convertHslToHex(
                color[colorKey as keyof typeof color]
              );

              return (
                <Popover.Close asChild key={updatedColor}>
                  <Button
                    className={`w-8 h-8 flex-none 
                  ${
                    updatedColor === value
                      ? "bg-slate12"
                      : "bg-black hover:bg-slate12"
                  }`}
                    onClick={() => {
                      onColorChange(updatedColor);
                    }}
                    autoFocus={updatedColor === value}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: updatedColor,
                      }}
                    ></div>
                  </Button>
                </Popover.Close>
              );
            })}
            <Popover.Arrow className="fill-black z-10" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <label className="flex items-center gap-1 rounded-lg bg-slate12 px-2 border border-transparent focus-within:border-blue9">
        <span>#</span>
        <input
          className="bg-transparent w-full focus:outline-none"
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
          spellCheck={false}
        />
      </label>
    </div>
  );
}

export default ColorPicker;
