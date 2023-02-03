import { useEffect } from "react";
import { isWithPlatformMetaKey } from "../utils";

const OPTIONS: AddEventListenerOptions = {
  passive: false,
};

export function usePreventDefaultBrowserZoom() {
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
    };

    document.addEventListener("wheel", handleWheel, OPTIONS);
    return () => {
      document.removeEventListener("wheel", handleWheel, OPTIONS);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      if (isWithPlatformMetaKey(event)) {
        // prevent default zoom in (+ can come from numpad)
        if (event.key === "=" || event.key === "+") {
          event.preventDefault();

          // prevent default zoom out
        } else if (event.key === "-") {
          event.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
