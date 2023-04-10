import "@total-typescript/ts-reset";

import { useMachine } from "@xstate/react";
import {
  CSSProperties,
  ChangeEvent,
  MouseEventHandler,
  ReactNode,
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
  ROUGHNESS_OPTIONS,
  STROKE_LINE_DASH_OPTIONS,
  STROKE_WIDTH_OPTIONS,
  TEXTAREA_UNIT_LESS_LINE_HEIGHT,
} from "./constants";
import {
  Tool,
  visualizerMachine,
  VisualizerMachineContext,
  ZOOM,
} from "./machines/visualizerMachine";

import LinearElementPointResizer from "./components/LinearElementPointResizer";
import {
  calculateCanvasPoint,
  calculateElementAbsolutePoint,
  calculateElementsAbsolutePoint,
  convertToPercent,
  convertToRatio,
  calculateViewportPoint,
  createDraw,
  isFreeDrawElement,
  isGenericElement,
  isLinearElement,
  isTextElement,
  isWithPlatformMetaKey,
  strokeDashedRectangle,
  isPointInsideOfAbsolutePoint,
  calculateSelectedElementsAbsolutePoint,
  isSameGroup,
  groupBy,
  isImageElement,
} from "./utils";
import ElementResizer from "./components/ElementResizer";
import RadioCardGroup from "./components/RadioCardGroup";
import HandIcon from "./components/HandIcon";
import CursorArrowIcon from "./components/CursorArrowIcon";
import SquareIcon from "./components/SquareIcon";
import CircleIcon from "./components/CircleIcon";
import ArrowRightIcon from "./components/ArrowRightIcon";
import BorderSolidIcon from "./components/BorderSolidIcon";
import PencilIcon from "./components/PencilIcon";
import TextIcon from "./components/TextIcon";
import ImageIcon from "./components/ImageIcon";

export const TOOL_LABELS = {
  hand: {
    label: "Hand",
    icon: <HandIcon />,
  },
  selection: {
    label: "(1) Selection",
    icon: <CursorArrowIcon />,
  },
  rectangle: {
    label: "(2) Rectangle",
    icon: <SquareIcon />,
  },
  diamond: {
    label: "(3) Diamond",
    icon: <SquareIcon className="rotate-45" />,
  },
  ellipse: {
    label: "(4) Ellipse",
    icon: <CircleIcon />,
  },
  arrow: {
    label: "(5) Arrow",
    icon: <ArrowRightIcon />,
  },
  line: {
    label: "(6) Line",
    icon: <BorderSolidIcon />,
  },
  freedraw: {
    label: "(7) Freedraw",
    icon: <PencilIcon />,
  },
  text: {
    label: "(8) Text",
    icon: <TextIcon />,
  },
  image: {
    label: "(9) Image",
    icon: <ImageIcon />,
  },
} as const satisfies Record<
  Tool,
  {
    label: string;
    icon: ReactNode;
  }
>;

function App() {
  const windowSize = useWindowSize();
  const devicePixelRatio = useDevicePixelRatio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialTextRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    tool,
    drawingElementId,
    elements,
    isToolFixed,
    elementOptions,
    zoom,
    origin,
    history,
    historyStep,
    drawStartPoint,
    files,
    imageCache,
  } = state.context;

  const drawStartViewportPoint = calculateViewportPoint({
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
      drawElement({
        files,
        imageCache,
      });

      const absolutePoint = calculateElementAbsolutePoint(element);
      const isGroupedElement = element.groupIds.length !== 0;
      if (element.status === "selected" && !isGroupedElement) {
        strokeDashedRectangle(ctx, absolutePoint);
      }

      ctx.restore();
    }

    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.scale(zoom, zoom);

    const selectedElements = elements.filter(
      (element) => element.status === "selected"
    );
    const groupedElements = groupBy(selectedElements, (element) =>
      element.groupIds.at(-1)
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const elements of Object.values(groupedElements)) {
      const absolutePoint = calculateElementsAbsolutePoint(elements);
      strokeDashedRectangle(ctx, absolutePoint, [16, 8]);
    }

    const isEverySelectedElementsSameGroup = isSameGroup(selectedElements);
    if (!isEverySelectedElementsSameGroup) {
      const selectedElementsAbsolutePoint =
        calculateSelectedElementsAbsolutePoint(elements);
      strokeDashedRectangle(ctx, selectedElementsAbsolutePoint);
    }

    ctx.restore();
  }, [
    elements,
    origin,
    zoom,
    windowSize,
    devicePixelRatio,
    drawingElementId,
    isWritingState,
    files,
    imageCache,
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
          type: "GESTURE.PAN",
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

    const fileInputElement = fileInputRef.current;
    invariant(fileInputElement);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Backspace") {
        send("SELECTED_ELEMENTS.DELETE");
        return;
      } else if (
        event.key === "Escape" ||
        (isWithPlatformMetaKey(event) && event.key === "Enter")
      ) {
        send("WRITE_END");
        return;
      } else if (event.key === "Enter") {
        send({ type: "WRITE_EDIT", canvasElement });
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
        } else if (event.shiftKey && event.key === "g") {
          event.preventDefault();
          send("SELECTED_ELEMENTS.UNGROUP");
        } else if (event.key === "g") {
          event.preventDefault();
          send("SELECTED_ELEMENTS.GROUP");
        }
      }

      const isShapeChangeHotKeys = Object.values(HOT_KEYS).includes(event.key);
      if (!isShapeChangeHotKeys) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const tool = Object.entries(HOT_KEYS).find(
        ([, hotkey]) => hotkey === event.key
      )![0] as Tool;

      send({
        type: "CHANGE_TOOL",
        tool,
      });

      if (tool === "image") {
        fileInputElement.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [send, updateZoom]);

  const isPanningState = state.matches("panning");
  useEffect(() => {
    let cursor: CSSProperties["cursor"];
    switch (tool) {
      case "selection":
        cursor = "default";
        break;
      case "hand":
        if (isPanningState) {
          cursor = "grabbing";
        } else {
          cursor = "grab";
        }
        break;
      default:
        cursor = "crosshair";
    }

    document.body.style.cursor = cursor;
  }, [tool, isPanningState]);

  const isResizingState = state.matches("resizing");
  useEffect(() => {
    if (!isResizingState) {
      return;
    }

    const handleMouseUp = () => {
      send("RESIZE_END");
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingState, send]);

  const isUpdatingPointState = state.matches("updating point");
  useEffect(() => {
    if (!isUpdatingPointState) {
      return;
    }

    const handleMouseUp = () => {
      send("POINT.UPDATE_END");
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isUpdatingPointState, send]);

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const mousePoint = calculateCanvasPoint({
      devicePixelRatio,
      event,
      zoom,
      origin,
    });

    if (tool === "hand") {
      startPanWithHand(event);
      return;
    }

    if (tool === "text") {
      startWrite(event);
      return;
    }

    if (tool === "image") {
      send({
        type: "DRAW_UPLOADED_IMAGE",
        event,
        devicePixelRatio,
      });
    }

    const selectedElements = elements.filter(
      (element) => element.status === "selected"
    );
    const absolutePoint = calculateElementsAbsolutePoint(selectedElements);
    if (
      tool === "selection" &&
      isPointInsideOfAbsolutePoint(absolutePoint, mousePoint)
    ) {
      startDrag(event);
    } else {
      startDraw(event);
    }
  };

  const startPanWithHand: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "PAN_START",
      event,
    });
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

  const endPan: MouseEventHandler<HTMLCanvasElement> = () => {
    send("PAN_END");
  };

  const resize: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    send({
      type: "RESIZE",
      event,
      devicePixelRatio,
      canvasElement,
    });
  };

  const updatePoint: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const canvasElement = canvasRef.current;
    invariant(canvasElement);

    if (selectedElements.length !== 1) {
      return;
    }

    const selectedElement = selectedElements[0];
    if (selectedElement === undefined) {
      return;
    }

    send({
      type: "POINT.UPDATE",
      event,
      devicePixelRatio,
    });
  };

  const pan: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "PAN",
      event,
      devicePixelRatio,
    });
  };

  const moveMouse: MouseEventHandler<HTMLCanvasElement> = (event) => {
    const selectedElementsAbsolutePoint =
      calculateSelectedElementsAbsolutePoint(elements);
    const mousePoint = calculateCanvasPoint({
      devicePixelRatio,
      event,
      zoom,
      origin,
    });

    send({
      type: "MOUSE_MOVE",
      event,
      devicePixelRatio,
    });

    if (tool !== "selection") {
      return;
    }

    if (
      isPointInsideOfAbsolutePoint(selectedElementsAbsolutePoint, mousePoint)
    ) {
      document.body.style.cursor = "move";
    } else {
      document.body.style.cursor = "default";
    }
  };

  const uploadImage = (event: ChangeEvent<HTMLInputElement>) => {
    send({
      type: "IMAGE_UPLOAD",
      event,
    });

    event.target.value = "";
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
              checked={isToolFixed}
              onChange={() => send("IS_ELEMENT_SHAPE_FIXED_TOGGLE")}
            />
            Fix shape
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{
              display: "none",
            }}
            onChange={uploadImage}
          />

          <RadioCardGroup.Root
            aria-label="Tool"
            className="flex flex-row gap-1 bg-black p-2 text-gray11"
            value={tool}
            onValueChange={(tool) => {
              const fileInputElement = fileInputRef.current;
              invariant(fileInputElement);

              send({
                type: "CHANGE_TOOL",
                tool: tool as Tool,
              });

              if (tool === "image") {
                fileInputElement.click();
              }
            }}
          >
            {Object.entries(TOOL_LABELS).map(([shape, { label, icon }]) => {
              return (
                <RadioCardGroup.Item
                  key={shape}
                  className="pointer-events-auto"
                  label={label}
                  value={shape}
                  icon={icon}
                  checked={tool === shape}
                />
              );
            })}
          </RadioCardGroup.Root>

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
                        fontSize: Number(event.currentTarget.value),
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
            : state.matches("updating point")
            ? updatePoint
            : state.matches("panning")
            ? pan
            : moveMouse
        }
        onMouseUp={
          state.matches("drawing")
            ? endDraw
            : state.matches("dragging")
            ? endDrag
            : state.matches("connecting")
            ? connect
            : state.matches("panning")
            ? endPan
            : undefined
        }
        onDoubleClick={(event) => {
          if (tool === "selection") {
            startWrite(event);
          }
        }}
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
          <LinearElementPointResizer
            linearElement={selectedElements[0]}
            devicePixelRatio={devicePixelRatio}
            origin={origin}
            zoom={zoom}
            onMouseDown={(event, pointIndex) => {
              send({
                type: "POINT.UPDATE_START",
                updatingPointIndex: pointIndex,
                devicePixelRatio,
                event,
              });
            }}
          />
        )}

      {selectedElements.length === 1 &&
        selectedElements[0] &&
        isGenericElement(selectedElements[0]) && (
          <ElementResizer
            absolutePoint={calculateElementAbsolutePoint(selectedElements[0])}
            devicePixelRatio={devicePixelRatio}
            origin={origin}
            zoom={zoom}
            onMouseDown={(event, direction) => {
              send({
                type: "RESIZE_START",
                event,
                devicePixelRatio,
                resizingDirection: direction,
              });
            }}
          />
        )}

      {selectedElements.length === 1 &&
        selectedElements[0] &&
        isImageElement(selectedElements[0]) && (
          <ElementResizer
            absolutePoint={calculateElementAbsolutePoint(selectedElements[0])}
            devicePixelRatio={devicePixelRatio}
            origin={origin}
            zoom={zoom}
            onMouseDown={(event, direction) => {
              send({
                type: "RESIZE_START",
                event,
                devicePixelRatio,
                resizingDirection: direction,
              });
            }}
          />
        )}

      {!state.matches("writing") &&
        selectedElements.length === 1 &&
        selectedElements[0] &&
        isTextElement(selectedElements[0]) && (
          <ElementResizer
            absolutePoint={calculateElementAbsolutePoint(selectedElements[0])}
            disallowOrthogonalDirection
            devicePixelRatio={devicePixelRatio}
            origin={origin}
            zoom={zoom}
            onMouseDown={(event, direction) => {
              send({
                type: "RESIZE_START",
                event,
                devicePixelRatio,
                resizingDirection: direction,
              });
            }}
          />
        )}

      {selectedElements.length === 1 &&
        selectedElements[0] &&
        isFreeDrawElement(selectedElements[0]) && (
          <ElementResizer
            absolutePoint={calculateElementAbsolutePoint(selectedElements[0])}
            devicePixelRatio={devicePixelRatio}
            origin={origin}
            zoom={zoom}
            onMouseDown={(event, direction) => {
              send({
                type: "RESIZE_START",
                event,
                devicePixelRatio,
                resizingDirection: direction,
              });
            }}
          />
        )}

      {selectedElements.length === 1 &&
        selectedElements[0] &&
        isLinearElement(selectedElements[0]) &&
        selectedElements[0].points.length >= 3 && (
          <ElementResizer
            absolutePoint={calculateElementAbsolutePoint(selectedElements[0])}
            devicePixelRatio={devicePixelRatio}
            origin={origin}
            zoom={zoom}
            onMouseDown={(event, direction) => {
              send({
                type: "RESIZE_START",
                event,
                devicePixelRatio,
                resizingDirection: direction,
              });
            }}
          />
        )}

      {selectedElements.length > 1 && (
        <ElementResizer
          absolutePoint={calculateElementsAbsolutePoint(selectedElements)}
          disallowOrthogonalDirection
          devicePixelRatio={devicePixelRatio}
          origin={origin}
          zoom={zoom}
          onMouseDown={(event, direction) => {
            send({
              type: "RESIZE_START",
              event,
              devicePixelRatio,
              resizingDirection: direction,
            });
          }}
        />
      )}
    </div>
  );
}

export default App;
