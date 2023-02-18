import { useMachine } from "@xstate/react";
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
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
import {
  HOT_KEY,
  HOT_KEYS,
  LABELS,
  STROKE_WIDTH_OPTIONS,
  TEXTAREA_UNIT_LESS_LINE_HEIGHT,
} from "./constants";

import {
  calculateElementAbsolutePoint,
  calculateCanvasPoint,
  convertToPercent,
  convertToRatio,
  createDraw,
  isPointInsideOfElement,
  isTextElement,
  isWithPlatformMetaKey,
  convertToViewportPoint,
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
          const updatedContext = {
            ...context,
            elements: context.elements,
          };

          return {
            ...updatedContext,
            history: [
              {
                elements: updatedContext.elements,
                elementOptions: updatedContext.elementOptions,
              },
            ],
          };
        } catch (error) {
          console.error(error);
          return {};
        }
      }),
    },
  });
  const {
    elementShape,
    drawingElementId,
    elements,
    isElementShapeFixed,
    elementOptions,
    zoom,
    origin,
    history,
    historyStep,
    drawStartPoint,
  } = state.context;

  const drawStartViewportPoint = convertToViewportPoint({
    canvasPoint: drawStartPoint,
    devicePixelRatio,
    origin,
    zoom,
  });

  const drawingElement = elements.find(
    (element) => element.id === drawingElementId
  );
  const selectedElements = elements.filter((element) => element.isSelected);

  const updateZoom = (change: number) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    const setZoom = (zoom: VisualizerMachineContext["zoom"]) => {
      const zoomInPercent = convertToPercent(zoom);
      const updatedZoom = convertToRatio(zoomInPercent + change);

      return updatedZoom;
    };

    send({
      type: "CHANGE_ZOOM",
      setZoom,
      canvasElement,
    });
  };

  useLayoutEffect(() => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    const ctx = canvasElement.getContext("2d");
    invariant(ctx);

    // canvasElement width and height are dependent on windowSize, devicePixelRatio
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    const drawnElements = elements.filter((element) => !element.isDeleted);
    drawnElements.forEach((element) => {
      ctx.save();
      ctx.translate(origin.x, origin.y);
      ctx.scale(zoom, zoom);

      const drawElement = createDraw(element, canvasElement);
      drawElement();

      const absolutePoint = calculateElementAbsolutePoint(element);
      if (element.isSelected) {
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(
          absolutePoint.minX - MARGIN,
          absolutePoint.minY - MARGIN,
          absolutePoint.maxX - absolutePoint.minX + MARGIN * 2,
          absolutePoint.maxY - absolutePoint.minY + MARGIN * 2
        );
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  }, [elements, origin, zoom, windowSize, devicePixelRatio]);

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

          return updatedZoom;
        };

        send({
          type: "CHANGE_ZOOM_WITH_PINCH",
          setZoom,
        });
      } else {
        send({
          type: "PAN",
          event,
          devicePixelRatio,
        });
      }
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [devicePixelRatio]);

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
          updateZoom(10);
        } else if (event.key === "-") {
          event.preventDefault();
          updateZoom(-10);
        } else if (event.shiftKey && event.key === "z") {
          send({
            type: "HISTORY_UPDATE",
            changedStep: 1,
          });
        } else if (event.key === "z") {
          send({
            type: "HISTORY_UPDATE",
            changedStep: -1,
          });
        }
      }

      const isShapeChangeHotKeys = Object.values(HOT_KEYS).includes(
        event.key as HOT_KEY
      );
      if (!isShapeChangeHotKeys) {
        return;
      }

      const updatedElementShape = Object.entries(HOT_KEYS).find(
        ([, hotkey]) => hotkey === event.key
      )![0];

      send({
        type: "CHANGE_ELEMENT_SHAPE",
        elementShape: updatedElementShape as VisualizerElement["shape"],
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
    const mousePoint = calculateCanvasPoint({
      devicePixelRatio,
      event,
      zoom,
      origin,
    });

    if (elementShape === "text") {
      startWrite(event);
      return;
    }

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

  const startWrite: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "WRITE_START",
      event,
      devicePixelRatio,
    });
  };

  const startDrag: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "DRAG_START",
      event,
      devicePixelRatio,
    });
  };

  const drag: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "DRAG",
      event,
      devicePixelRatio,
    });
  };

  const endDrag: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "DRAG_END",
      event,
      devicePixelRatio,
    });
  };

  const startDraw: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "DRAW_START",
      event,
      devicePixelRatio,
    });
  };

  const draw: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "DRAW",
      event,
      devicePixelRatio,
    });
  };

  const endDraw: MouseEventHandler<HTMLCanvasElement> = (event) => {
    invariant(drawingElement);

    if (drawingElement.shape === "selection") {
      send("DELETE_SELECTION");
    } else {
      send({
        type: "DRAW_END",
        event,
        devicePixelRatio,
      });
    }
  };

  const moveMouse: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "MOUSE_MOVE",
      event,
      devicePixelRatio,
    });
  };

  const editableRefCallback = useCallback(
    (editableElement: HTMLDivElement | null) => {
      if (editableElement === null) {
        return;
      }

      setTimeout(() => {
        editableElement.focus();
      }, 0);
    },
    []
  );

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
          {Object.entries(LABELS).map(([shape, label]) => (
            <Radio
              key={shape}
              label={label}
              value={shape}
              checked={elementShape === shape}
              onChange={(event) => {
                send({
                  type: "CHANGE_ELEMENT_SHAPE",
                  elementShape: event.currentTarget
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
                    stroke: event.currentTarget.value,
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
                    fill: event.currentTarget.value,
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
                        strokeWidth: Number(event.currentTarget.value),
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
                  onClick={() => updateZoom(-10)}
                  disabled={zoom === ZOOM.MINIMUM}
                >
                  -
                </button>
                <button
                  onClick={() => {
                    const canvasElement = canvasRef.current;
                    invariant(canvasElement);

                    send({
                      type: "CHANGE_ZOOM",
                      setZoom: () => 1,
                      canvasElement,
                    });
                  }}
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => updateZoom(10)}
                  disabled={zoom === ZOOM.MAXIMUM}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", pointerEvents: "all" }}>
                <button
                  type="button"
                  onClick={() =>
                    send({
                      type: "HISTORY_UPDATE",
                      changedStep: -1,
                    })
                  }
                  disabled={historyStep === 0}
                >
                  undo
                </button>

                <button
                  type="button"
                  onClick={() => {
                    send({
                      type: "HISTORY_UPDATE",
                      changedStep: 1,
                    });
                  }}
                  disabled={historyStep === history.length - 1}
                >
                  redo
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
      {state.matches("writing") &&
        drawingElement &&
        isTextElement(drawingElement) && (
          <div
            contentEditable
            role="textbox"
            ref={editableRefCallback}
            style={{
              position: "absolute",
              left: drawStartViewportPoint.x,
              top:
                drawStartViewportPoint.y -
                (drawingElement.fontSize * TEXTAREA_UNIT_LESS_LINE_HEIGHT) / 2,
              fontFamily: drawingElement.fontFamily,
              fontSize: drawingElement.fontSize,
              lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
              padding: 0,
              outline: 0,
              border: 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
              backgroundColor: "transparent",
              resize: "none",
              // initialize width = '1px' to show input caret
              width: 1,
              maxWidth: windowSize.width - drawStartViewportPoint.x,
              maxHeight:
                windowSize.height -
                drawStartViewportPoint.y +
                (drawingElement.fontSize * TEXTAREA_UNIT_LESS_LINE_HEIGHT) / 2,
              transformOrigin: "left center",
              transform: `scale(${zoom})`,
            }}
            onBlur={(event) => {
              send({
                type: "WRITE_END",
                text: event.currentTarget.innerText,
              });
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                send({
                  type: "WRITE_END",
                  text: event.currentTarget.innerText,
                });
              }
            }}
            onInput={(event) => {
              const editableElement = event.currentTarget;

              if (editableElement.innerText === "") {
                editableElement.style.width = "1px";
              } else {
                editableElement.style.width = "auto";
              }
            }}
          />
        )}
    </div>
  );
}

export default App;
