import { useEffect, useState } from "react";

export function useDevicePixelRatio() {
  const [devicePixelRatio, setDevicePixelRatio] = useState(
    window.devicePixelRatio
  );

  useEffect(() => {
    const mediaQueryString = `(resolution: ${devicePixelRatio}dppx)`;
    const mediaQueryList = window.matchMedia(mediaQueryString);

    const updateDevicePixelRatio = () => {
      setDevicePixelRatio(window.devicePixelRatio);
    };

    mediaQueryList.addEventListener("change", updateDevicePixelRatio);
    return () => {
      mediaQueryList.removeEventListener("change", updateDevicePixelRatio);
    };
  }, [devicePixelRatio]);

  return devicePixelRatio;
}
