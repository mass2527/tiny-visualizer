import { useMachine } from "@xstate/react";
import { MouseEventHandler, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { canvasMachine } from "./machines/canvasMachine";
import { generateDraw } from "./utils";
import { assign } from "xstate/lib/actions";

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
  const [state, send] = useMachine(canvasMachine, {
    actions: {
      generateDraw: assign((context) => {
        const canvasElement = canvasRef.current;
        invariant(canvasElement);

        const ctx = canvasElement.getContext("2d");
        invariant(ctx);

        return {
          elements: context.elements.map((element) => {
            if (element.id === context.drawingElementId) {
              return {
                ...element,
                draw: generateDraw(element, canvasElement),
              };
            }
            return element;
          }),
        };
      }),
      draw: (context) => {
        const canvasElement = canvasRef.current;
        invariant(canvasElement);

        const ctx = canvasElement.getContext("2d");
        invariant(ctx);

        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        context.elements.forEach((element) => {
          invariant(element.draw);
          element.draw();
        });
      },
    },
  });
  const { drawingElementId, elements } = state.context;
  const drawingElement = elements.find(
    (element) => element.id === drawingElementId
  );

  const startDraw: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    send({
      type: "DRAW_START",
      event,
      canvasElement,
    });
  };

  const draw: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    invariant(drawingElement);

    drawingElement.ref.send({
      type: "UPDATE",
      event,
      canvasElement,
    });
  };

  const endDraw: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    invariant(drawingElement);

    if (drawingElement.shape === "selection") {
      drawingElement.ref.send("DELETE");
    } else {
      drawingElement.ref.send({
        type: "UPDATE_END",
        event,
        canvasElement,
      });
    }
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{ width: windowSize.width, height: windowSize.height }}
        width={Math.floor(windowSize.width * devicePixelRatio)}
        height={Math.floor(windowSize.height * devicePixelRatio)}
        onMouseDown={state.matches("idle") ? startDraw : undefined}
        onMouseMove={state.matches("drawing") ? draw : undefined}
        onMouseUp={state.matches("drawing") ? endDraw : undefined}
      />
    </div>
  );
}

export default App;
