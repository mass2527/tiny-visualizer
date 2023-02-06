import { useMachine } from "@xstate/react";
import { MouseEventHandler, useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { assign } from "xstate";
import ColorPicker from "./components/ColorPicker";
import Radio from "./components/Radio";
import { useDevicePixelRatio, useWindowSize } from "./hooks";

import {
  visualizerMachine,
  VisualizerMachineContext,
  VisualizerElement,
  ZOOM,
} from "./machines/visualizerMachine";
import { STROKE_WIDTH_OPTIONS, TOOL_OPTIONS } from "./options";

import {
  calculateCanvasCenterDifference,
  calculateMousePoint,
  convertToPercent,
  convertToRatio,
  generateDraw,
  isPointInsideOfElement,
  isWithPlatformMetaKey,
} from "./utils";

const MARGIN = 8;

function App() {
  const windowSize = useWindowSize();
  const devicePixelRatio = useDevicePixelRatio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, send] = useMachine(visualizerMachine, {
    actions: {
      loadSavedContext: assign(() => {
        const canvasElement = canvasRef.current;
        if (canvasElement === null) {
          return {};
        }

        try {
          const value = localStorage.getItem("context");
          if (value === null) {
            return {};
          }

          const context = JSON.parse(value) as VisualizerMachineContext;
          return {
            ...context,
            elements: context.elements.map((element) => {
              return {
                ...element,
                draw: generateDraw(element, canvasElement),
              };
            }),
          };
        } catch (error) {
          console.error(error);
          return {};
        }
      }),
      drawElements: (context) => {
        const canvasElement = canvasRef.current;
        invariant(canvasElement);

        const ctx = canvasElement.getContext("2d");
        invariant(ctx);

        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        ctx.clearRect(
          -canvasElement.width * ((1 / context.zoom - 1) / 2),
          -canvasElement.height * ((1 / context.zoom - 1) / 2),
          canvasElement.width / context.zoom,
          canvasElement.height / context.zoom
        );

        // scale for zoom
        ctx.setTransform(context.zoom, 0, 0, context.zoom, 0, 0);

        // translation for zoom
        const canvasCenterDifference = calculateCanvasCenterDifference(
          canvasElement,
          context.zoom
        );
        ctx.setTransform(
          ctx.getTransform().a,
          0,
          0,
          ctx.getTransform().d,
          -canvasCenterDifference.x,
          -canvasCenterDifference.y
        );

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
  const {
    elementShape,
    drawingElementId,
    elements,
    isElementShapeFixed,
    elementOptions,
    zoom,
  } = state.context;
  const drawingElement = elements.find(
    (element) => element.id === drawingElementId
  );
  const selectedElements = elements.filter((element) => element.isSelected);

  const zoomIn = () => {
    const setZoom = (zoom: VisualizerMachineContext["zoom"]) => {
      const zoomInPercent = convertToPercent(zoom);
      const updatedZoom = convertToRatio(zoomInPercent + 10);

      return Math.min(ZOOM.MAXIMUM, updatedZoom);
    };

    send({
      type: "CHANGE_ZOOM",
      setZoom,
    });
  };

  const zoomOut = () => {
    const setZoom = (zoom: VisualizerMachineContext["zoom"]) => {
      const zoomInPercent = convertToPercent(zoom);
      const updatedZoom = convertToRatio(zoomInPercent - 10);

      return Math.max(ZOOM.MINIMUM, updatedZoom);
    };

    send({
      type: "CHANGE_ZOOM",
      setZoom,
    });
  };

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      // window - pressing ctrlKey with wheel result in zooming
      // mac - event.ctrlKey is automatically true when pinch with two fingers on track pad
      if (event.ctrlKey) {
        const signDeltaY = Math.sign(event.deltaY);
        const absoluteDeltaY = Math.abs(event.deltaY);

        const setZoom = (zoom: VisualizerMachineContext["zoom"]) => {
          let updatedZoom = zoom - event.deltaY / 100;
          updatedZoom +=
            // the bigger zoom is, the slower it will be increased (applied when zoom > 1)
            Math.log10(Math.max(1, zoom)) *
            -signDeltaY *
            Math.min(1, absoluteDeltaY / 20);

          const isZoomIn = signDeltaY === -1;
          if (isZoomIn) {
            return Math.min(ZOOM.MAXIMUM, updatedZoom);
          } else {
            return Math.max(ZOOM.MINIMUM, updatedZoom);
          }
        };

        send({
          type: "CHANGE_ZOOM",
          setZoom,
        });
      }
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Backspace") {
        send("SELECTED_ELEMENTS.DELETE");
        return;
      }

      if (isWithPlatformMetaKey(event)) {
        if (event.key === "c") {
          send("SELECTED_ELEMENTS.COPY");
        } else if (event.key === "v") {
          send({
            type: "SELECTED_ELEMENTS.PASTE",
            canvasElement,
          });
        } else if (event.key === "x") {
          send("SELECTED_ELEMENTS.CUT");
        } else if (event.key === "=" || event.key === "+") {
          event.preventDefault();
          zoomIn();
        } else if (event.key === "-") {
          event.preventDefault();
          zoomOut();
        }
      }

      const isShapeChangeHotKeys = ["1", "2", "3", "4", "5"].includes(
        event.key
      );
      if (!isShapeChangeHotKeys) {
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

  useEffect(() => {
    if (elementShape === "selection") {
      document.body.style.cursor = "default";
    } else {
      document.body.style.cursor = "crosshair";
    }
  }, [elementShape]);

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    const mousePoint = calculateMousePoint({ canvasElement, event, zoom });

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

  const moveMouse: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    send({
      type: "MOUSE_MOVE",
      canvasElement,
      event,
    });
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
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <label style={{ pointerEvents: "all" }}>
            <input
              type="checkbox"
              checked={isElementShapeFixed}
              onChange={() => send("IS_ELEMENT_SHAPE_FIXED_TOGGLE")}
            />
            Fix shape
          </label>
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
            />
          ))}

          <div
            style={{
              position: "absolute",
              top: "50px",
              left: 0,
            }}
          >
            <ColorPicker
              label="Stroke Color"
              value={elementOptions.stroke || "#000"}
              onChange={(event) => {
                send({
                  type: "CHANGE_ELEMENT_OPTIONS",
                  elementOptions: {
                    stroke: event.target.value,
                  },
                });
              }}
            />
            <ColorPicker
              label="Fill Color"
              value={elementOptions.fill || "#000"}
              onChange={(event) => {
                send({
                  type: "CHANGE_ELEMENT_OPTIONS",
                  elementOptions: {
                    fill: event.target.value,
                  },
                });
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Stroke Width</span>
              {STROKE_WIDTH_OPTIONS.map(({ label, value }) => (
                <Radio
                  key={label}
                  label={label}
                  value={String(value)}
                  checked={elementOptions.strokeWidth === value}
                  onChange={(event) => {
                    send({
                      type: "CHANGE_ELEMENT_OPTIONS",
                      elementOptions: {
                        strokeWidth: Number(event.target.value),
                      },
                    });
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Zoom</span>
              <div style={{ display: "flex", pointerEvents: "all" }}>
                <button
                  type="button"
                  onClick={() => zoomOut()}
                  disabled={zoom === ZOOM.MINIMUM}
                >
                  -
                </button>
                <button
                  onClick={() => {
                    send({
                      type: "CHANGE_ZOOM",
                      setZoom: () => 1,
                    });
                  }}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => zoomIn()}
                  disabled={zoom === ZOOM.MAXIMUM}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          // visual size
          width: windowSize.width,
          height: windowSize.height,
        }}
        // actual size
        width={Math.floor(windowSize.width * devicePixelRatio)}
        height={Math.floor(windowSize.height * devicePixelRatio)}
        onMouseDown={state.matches("idle") ? handleMouseDown : undefined}
        onMouseMove={
          state.matches("drawing")
            ? draw
            : state.matches("dragging")
            ? drag
            : moveMouse
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
