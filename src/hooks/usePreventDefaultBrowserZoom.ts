import { useEffect } from "react";

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
}
