import { useMachine } from "@xstate/react";
import {
  ChangeEventHandler,
  CSSProperties,
  MouseEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import invariant from "tiny-invariant";
import { canvasMachine } from "./machines/canvasMachine";
import { generateDraw } from "./utils";
import { assign } from "xstate/lib/actions";
import { VisualizerElement } from "./machines/elementMachine";

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

const TOOL_OPTIONS: {
  label: string;
  value: VisualizerElement["shape"];
}[] = [
  {
    label: "(1) Selection",
    value: "selection",
  },
  {
    label: "(2) Rectangle",
    value: "rectangle",
  },
  {
    label: "(3) Ellipse",
    value: "ellipse",
  },
  {
    label: "(4) Arrow",
    value: "arrow",
  },
  {
    label: "(5) Line",
    value: "line",
  },
];

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
  const { elementShape, drawingElementId, elements } = state.context;
  const drawingElement = elements.find(
    (element) => element.id === drawingElementId
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const isHotKey = ["1", "2", "3", "4", "5"].includes(event.key);
      if (!isHotKey) {
        return;
      }

      const hotKeys: Record<string, VisualizerElement["shape"]> = {
        1: "selection",
        2: "rectangle",
        3: "ellipse",
        4: "arrow",
        5: "line",
      };
      send({
        type: "CHANGE_ELEMENT_SHAPE",
        elementShape: hotKeys[event.key],
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          padding: "16px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          {TOOL_OPTIONS.map(({ label, value }) => (
            <Radio
              key={value}
              label={label}
              value={value}
              checked={elementShape === value}
              onChange={(event) => {
                send({
                  type: "CHANGE_ELEMENT_SHAPE",
                  elementShape: event.target
                    .value as VisualizerElement["shape"],
                });
              }}
              style={{
                pointerEvents: "all",
              }}
            />
          ))}
        </header>
      </div>

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
