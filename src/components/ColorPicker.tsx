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
  gray,
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
            className="flex gap-1 z-10 rounded-lg p-1 bg-white cursor-default shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] focus:shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2),0_0_0_2px_theme(colors.violet7)] will-change-[transform,opacity] data-[state=open]:data-[side=top]:animate-slideDownAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade"
            sideOffset={5}
            side="right"
            align="start"
          >
            {[red, orange, yellow, green, blue, indigo, purple, pink, gray].map(
              (color) => {
                const regex = new RegExp(`.*${scale}$`);
                const colorKey = Object.keys(color).find((key) => {
                  return regex.test(key);
                });

                return (
                  <Popover.Close asChild>
                    <Button
                      key={colorKey}
                      className={`w-8 h-8 flex-none`}
                      style={{
                        backgroundColor: color[colorKey as keyof typeof color],
                      }}
                      onClick={() => {
                        onColorChange(
                          convertHslToHex(color[colorKey as keyof typeof color])
                        );
                      }}
                    />
                  </Popover.Close>
                );
              }
            )}
            <Popover.Arrow className="fill-white z-10" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <div className="flex items-center gap-1 rounded-lg bg-gray12 px-2">
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
