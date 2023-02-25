import "@total-typescript/ts-reset";

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
  Fill_STYLE_OPTIONS,
  FONT_SIZE_OPTIONS,
  HOT_KEYS,
  LABELS,
  ROUGHNESS_OPTIONS,
  STROKE_LINE_DASH_OPTIONS,
  STROKE_WIDTH_OPTIONS,
  TEXTAREA_UNIT_LESS_LINE_HEIGHT,
} from "./constants";
import {
  FontSize,
  VisualizerElement,
  visualizerMachine,
  VisualizerMachineContext,
  ZOOM,
} from "./machines/visualizerMachine";

import LinearElementResizer from "./components/LinearElementResizer";
import {
  calculateCanvasPoint,
  calculateElementAbsolutePoint,
  convertToPercent,
  convertToRatio,
  convertToViewportPoint,
  createDraw,
  isLinearElement,
  isPointInsideOfElement,
  isTextElement,
  isWithPlatformMetaKey,
} from "./utils";

const MARGIN = 8;

function App() {
  const windowSize = useWindowSize();
  const devicePixelRatio = useDevicePixelRatio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialTextRef = useRef("");
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

  const isWritingState = state.matches("writing");

  if (state.event.type === "WRITE_EDIT") {
    invariant(drawingElement);
    invariant(isTextElement(drawingElement));

    initialTextRef.current = drawingElement.text;
  } else if (state.event.type === "WRITE_END") {
    initialTextRef.current = "";
  }

  const selectedElements = elements.filter(
    (element) => element.status === "selected"
  );

  const updateZoom = useCallback(
    (change: number) => {
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
    },
    [send]
  );

  useLayoutEffect(() => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    const ctx = canvasElement.getContext("2d");
    invariant(ctx);

    const canvasElementSize = {
      width: windowSize.width * devicePixelRatio,
      height: windowSize.height * devicePixelRatio,
    };
    ctx.clearRect(0, 0, canvasElementSize.width, canvasElementSize.height);

    const nonDeletedElements = elements.filter(
      (element) => element.status !== "deleted"
    );
    for (const element of nonDeletedElements) {
      ctx.save();
      ctx.translate(origin.x, origin.y);
      ctx.scale(zoom, zoom);

      const drawingElement = elements.find(
        (element) => element.id === drawingElementId
      );
      if (
        isWritingState &&
        drawingElement?.shape === "text" &&
        drawingElementId === element.id
      ) {
        ctx.restore();
        continue;
      }

      const drawElement = createDraw(element, canvasElement);
      drawElement();

      const absolutePoint = calculateElementAbsolutePoint(element);
      if (element.status === "selected") {
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
    }
  }, [
    elements,
    origin,
    zoom,
    windowSize,
    devicePixelRatio,
    drawingElementId,
    isWritingState,
  ]);

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
  }, [send, devicePixelRatio]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Backspace") {
        send("SELECTED_ELEMENTS.DELETE");
        return;
      } else if (event.key === "Enter") {
        send({ type: "WRITE_EDIT", canvasElement });
        return;
      } else if (event.key === "Escape") {
        send("WRITE_END");
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
        } else if (event.key === "a") {
          event.preventDefault();
          send({
            type: "ELEMENTS.SELECT_ALL",
          });
        }
      }

      const isShapeChangeHotKeys = Object.values(HOT_KEYS).includes(event.key);
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
  }, [send, updateZoom]);

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

    if (drawingElement.shape === "line" || drawingElement.shape === "arrow") {
      if (drawingElement.width === 0 && drawingElement.height === 0) {
        send("CONNECT_START");
        return;
      }
    }

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

  const connect: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "CONNECT",
      event,
    });
  };

  const resize: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "RESIZE",
      event,
      devicePixelRatio,
    });
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
              value={elementOptions.stroke}
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
              value={elementOptions.fill}
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
              <span>Fill Style</span>
              {Fill_STYLE_OPTIONS.map(({ label, value }) => (
                <Radio
                  key={label}
                  label={label}
                  value={String(value)}
                  checked={elementOptions.fillStyle === value}
                  onChange={() => {
                    send({
                      type: "CHANGE_ELEMENT_OPTIONS",
                      elementOptions: {
                        fillStyle: value,
                      },
                    });
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Stroke Width</span>
              {STROKE_WIDTH_OPTIONS.map(({ label, value }) => (
                <Radio
                  key={label}
                  label={label}
                  value={String(value)}
                  checked={elementOptions.strokeWidth === value}
                  onChange={() => {
                    send({
                      type: "CHANGE_ELEMENT_OPTIONS",
                      elementOptions: {
                        strokeWidth: value,
                      },
                    });
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Stroke Line Dash</span>
              {STROKE_LINE_DASH_OPTIONS.map(({ label, value }) => (
                <Radio
                  key={label}
                  label={label}
                  value={String(value)}
                  checked={
                    JSON.stringify(elementOptions.strokeLineDash) ===
                    JSON.stringify(value)
                  }
                  onChange={() => {
                    send({
                      type: "CHANGE_ELEMENT_OPTIONS",
                      elementOptions: {
                        strokeLineDash: value,
                      },
                    });
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Roughness</span>
              {ROUGHNESS_OPTIONS.map(({ label, value }) => (
                <Radio
                  key={label}
                  label={label}
                  value={String(value)}
                  checked={elementOptions.roughness === value}
                  onChange={() => {
                    send({
                      type: "CHANGE_ELEMENT_OPTIONS",
                      elementOptions: {
                        roughness: value,
                      },
                    });
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>Font Size</span>
              {FONT_SIZE_OPTIONS.map(({ label, value }) => (
                <Radio
                  key={label}
                  label={label}
                  value={String(value)}
                  checked={elementOptions.fontSize === value}
                  onChange={(event) => {
                    send({
                      type: "CHANGE_ELEMENT_OPTIONS",
                      elementOptions: {
                        fontSize: Number(event.currentTarget.value) as FontSize,
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
                  disabled={zoom === ZOOM.MIN}
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
                  disabled={zoom === ZOOM.MAX}
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
          state.matches("drawing") || state.matches("connecting")
            ? draw
            : state.matches("dragging")
            ? drag
            : state.matches("resizing")
            ? resize
            : moveMouse
        }
        onMouseUp={
          state.matches("drawing")
            ? endDraw
            : state.matches("dragging")
            ? endDrag
            : state.matches("connecting")
            ? connect
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
              top: drawStartViewportPoint.y,
              fontFamily: drawingElement.fontFamily,
              fontSize: drawingElement.fontSize,
              lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
              padding: 0,
              outline: 0,
              border: 0,
              overflow: "hidden",
              whiteSpace: "pre",
              backgroundColor: "transparent",
              resize: "none",
              // initialize width = '1px' to show input caret
              width: drawingElement.text === "" ? 1 : "auto",
              maxWidth: (windowSize.width - drawStartViewportPoint.x) / zoom,
              maxHeight: Math.max(
                (windowSize.height -
                  drawStartViewportPoint.y +
                  (drawingElement.fontSize * TEXTAREA_UNIT_LESS_LINE_HEIGHT) /
                    2) /
                  zoom,
                drawingElement.fontSize * TEXTAREA_UNIT_LESS_LINE_HEIGHT
              ),
              transformOrigin: "top left",
              transform: `scale(${zoom}) translateY(${
                -(drawingElement.fontSize * TEXTAREA_UNIT_LESS_LINE_HEIGHT) / 2
              }px)`,
            }}
            onBlur={() => {
              send("WRITE_END");
            }}
            onInput={(event) => {
              const canvasElement = canvasRef.current;
              invariant(canvasElement);

              const editableElement = event.currentTarget;
              if (editableElement.innerText === "") {
                editableElement.style.width = "1px";
              } else {
                editableElement.style.width = "auto";
              }

              send({
                type: "WRITE",
                canvasElement,
                text: editableElement.innerText,
              });
            }}
            onFocus={(event) => {
              const editableElement = event.currentTarget;
              if (editableElement.innerText.length === 0) {
                return;
              }

              const range = document.createRange();
              range.selectNodeContents(editableElement);

              const selection = window.getSelection();
              if (selection === null) {
                return;
              }

              if (selection.rangeCount > 0) {
                selection.removeAllRanges();
              }
              selection.addRange(range);
            }}
            suppressContentEditableWarning
          >
            {initialTextRef.current}
          </div>
        )}

      {selectedElements.length === 1 &&
        selectedElements[0] &&
        isLinearElement(selectedElements[0]) && (
          <LinearElementResizer
            linearElement={selectedElements[0]}
            devicePixelRatio={devicePixelRatio}
            origin={origin}
            zoom={zoom}
            onMouseDown={(event, changeInPointIndex) => {
              send({
                type: "RESIZE_START",
                resizingElement: {
                  changeInPointIndex,
                },
                devicePixelRatio,
                event,
              });
            }}
            onMouseUp={() => {
              send("RESIZE_END");
            }}
          />
        )}
    </div>
  );
}

export default App;
