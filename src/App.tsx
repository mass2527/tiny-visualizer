import { useMachine } from "@xstate/react";
import { MouseEventHandler, useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import Radio from "./components/Radio";
import { useWindowSize } from "./hooks";
import { useDevicePixelRatio } from "./hooks/useDevicePixelRatio";
import { canvasMachine, VisualizerElement } from "./machines/canvasMachine";

import { calculateMousePoint, isPointInsideOfElement } from "./utils";

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

const MARGIN = 8;

function App() {
  const windowSize = useWindowSize();
  const devicePixelRatio = useDevicePixelRatio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, send] = useMachine(canvasMachine, {
    actions: {
      drawElements: (context) => {
        const canvasElement = canvasRef.current;
        invariant(canvasElement);

        const ctx = canvasElement.getContext("2d");
        invariant(ctx);

        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        context.elements.forEach((element) => {
          if (element.draw) {
            element.draw();
          }

          if (element.isSelected) {
            ctx.setLineDash([8, 4]);
            ctx.strokeRect(
              element.x - MARGIN,
              element.y - MARGIN,
              element.width + MARGIN * 2,
              element.height + MARGIN * 2
            );
            ctx.setLineDash([]);
          }
        });
      },
    },
  });
  const { elementShape, drawingElementId, elements, dragStartPoint } =
    state.context;
  const drawingElement = elements.find(
    (element) => element.id === drawingElementId
  );
  const selectedElements = elements.filter((element) => element.isSelected);

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

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    const mousePoint = calculateMousePoint(canvasElement, event);

    if (
      elementShape === "selection" &&
      selectedElements.some((selectedElement) => {
        return isPointInsideOfElement(mousePoint, selectedElement);
      })
    ) {
      startDrag(event);
    } else {
      startDraw(event);
    }
  };

  const startDrag: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    send({
      type: "DRAG_START",
      canvasElement,
      event,
    });
  };

  const drag: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    send({
      type: "DRAG",
      canvasElement,
      event,
    });
  };

  const endDrag: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    send({
      type: "DRAG_END",
      canvasElement,
      event,
    });
  };

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

    send({
      type: "DRAW",
      event,
      canvasElement,
    });
  };

  const endDraw: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    invariant(drawingElement);

    if (drawingElement.shape === "selection") {
      send({
        type: "DELETE_SELECTION",
        id: drawingElement.id,
      });
    } else {
      send({
        type: "DRAW_END",
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
        onMouseDown={state.matches("idle") ? handleMouseDown : undefined}
        onMouseMove={
          state.matches("drawing")
            ? draw
            : state.matches("dragging")
            ? drag
            : undefined
        }
        onMouseUp={
          state.matches("drawing")
            ? endDraw
            : state.matches("dragging")
            ? endDrag
            : undefined
        }
      />
    </div>
  );
}

export default App;
