import { useEffect, useRef, useState } from "react";

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", updateWindowSize);
    return () => {
      window.removeEventListener("resize", updateWindowSize);
    };
  }, []);

  return windowSize;
}

function useDevicePixelRatio() {
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

function App() {
  const windowSize = useWindowSize();
  const devicePixelRatio = useDevicePixelRatio();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    const context = canvasRef.current.getContext("2d");
    if (context === null) {
      return;
    }

    context.scale(devicePixelRatio, devicePixelRatio);
  }, [devicePixelRatio]);

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ width: windowSize.width, height: windowSize.height }}
        width={Math.floor(windowSize.width * devicePixelRatio)}
        height={Math.floor(windowSize.height * devicePixelRatio)}
      />
    </div>
  );
}

export default App;
