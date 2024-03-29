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

import { useDevicePixelRatio, useWindowSize } from "./hooks";

import { HOT_KEYS, TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "./constants";
import {
  FontFamily,
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
  isPointInsideOfAbsolutePoint,
  calculateSelectedElementsAbsolutePoint,
  isSameGroup,
  groupBy,
  isImageElement,
  calculateElementOptionValue,
  calculateShouldShowElementOptions as calculateShowElementOptions,
  strokeRectangle,
  calculateAbsolutePointByElementBase,
} from "./utils";
import ElementResizer from "./components/ElementResizer";
import RadioCardGroup from "./components/RadioCardGroup";

import CheckboxCard from "./components/CheckboxCard";

import {
  ArchitectRoughnessIcon,
  ArrowRightIcon,
  ArtistRoughnessIcon,
  BoldLineIcon,
  BorderSolidIcon,
  CartoonistRoughnessIcon,
  CircleIcon,
  CodeIcon,
  CopyIcon,
  CrossHatchIcon,
  CursorArrowIcon,
  DashedLineIcon,
  DeleteIcon,
  DottedLineIcon,
  GroupIcon,
  HachureIcon,
  HandIcon,
  ImageIcon,
  LargeSizeIcon,
  LockClosedIcon,
  LockOpenIcon,
  MediumSizeIcon,
  MinusIcon,
  NormalFontIcon,
  PencilIcon,
  PlusIcon,
  RedoIcon,
  RegularLineIcon,
  SmallSizeIcon,
  SolidIcon,
  SquareIcon,
  TextIcon,
  ThinLineIcon,
  UnGroupIcon,
  UndoIcon,
  XLargeSizeIcon,
} from "./components/Icons";
import Fieldset from "./components/Fieldset";

import { blue } from "@radix-ui/colors";
import { Button } from "./components/Button";
import ColorPicker from "./components/ColorPicker";

const canShowElementOption = (
  obj: Record<string, boolean> | null,
  key: string
) => {
  return obj && key in obj && obj[key];
};

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

type Option<T> = {
  label: string;
  value: T;
  icon: ReactNode;
};

type ElementOption<T extends keyof VisualizerMachineContext["elementOptions"]> =
  Option<VisualizerMachineContext["elementOptions"][T]>;

const Fill_STYLE_OPTIONS: ElementOption<"fillStyle">[] = [
  { label: "Hachure", value: "hachure", icon: <HachureIcon /> },
  { label: "Cross-hatch", value: "cross-hatch", icon: <CrossHatchIcon /> },
  { label: "Solid", value: "solid", icon: <SolidIcon /> },
];

const STROKE_WIDTH_OPTIONS: ElementOption<"strokeWidth">[] = [
  {
    label: "Thin",
    value: 2,
    icon: <ThinLineIcon />,
  },
  {
    label: "Regular",
    value: 4,
    icon: <RegularLineIcon />,
  },
  {
    label: "Bold",
    value: 6,
    icon: <BoldLineIcon />,
  },
];

const STROKE_LINE_DASH_OPTIONS: ElementOption<"strokeLineDash">[] = [
  { label: "Solid", value: [], icon: <ThinLineIcon /> },
  {
    label: "Dashed",
    value: [20, 5],
    icon: <DashedLineIcon />,
  },
  {
    label: "Dotted",
    value: [5, 10],
    icon: <DottedLineIcon />,
  },
];

const ROUGHNESS_OPTIONS: ElementOption<"roughness">[] = [
  { label: "Architect", value: 0, icon: <ArchitectRoughnessIcon /> },
  { label: "Artist", value: 1, icon: <ArtistRoughnessIcon /> },
  { label: "Cartoonist", value: 3, icon: <CartoonistRoughnessIcon /> },
];

const FONT_SIZE_OPTIONS: ElementOption<"fontSize">[] = [
  {
    label: "Small",
    value: 12,
    icon: <SmallSizeIcon />,
  },
  {
    label: "Medium",
    value: 16,
    icon: <MediumSizeIcon />,
  },
  {
    label: "Large",
    value: 20,
    icon: <LargeSizeIcon />,
  },
  {
    label: "X-Large",
    value: 24,
    icon: <XLargeSizeIcon />,
  },
];

const FONT_FAMILY_OPTIONS: ElementOption<"fontFamily">[] = [
  {
    label: "handDrawn",
    value: "Virgil",
    icon: <PencilIcon />,
  },
  {
    label: "normal",
    value: "Helvetica",
    icon: <NormalFontIcon />,
  },
  {
    label: "code",
    value: "Cascadia",
    icon: <CodeIcon />,
  },
];

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
    selection,
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
        strokeRectangle({
          absolutePoint,
          ctx,
          strokeStyle: blue.blue9,
          lineWidth: 2,
        });
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
      strokeRectangle({
        ctx,
        absolutePoint,
        lineWidth: 2,
        segments: [16, 8],
      });
    }

    const isEverySelectedElementsSameGroup = isSameGroup(selectedElements);
    if (!isEverySelectedElementsSameGroup) {
      const selectedElementsAbsolutePoint =
        calculateSelectedElementsAbsolutePoint(elements);
      strokeRectangle({
        ctx,
        absolutePoint: selectedElementsAbsolutePoint,
        lineWidth: 2,
        strokeStyle: blue.blue9,
        segments: [4, 4],
      });
    }

    if (selection) {
      const absolutePoint = calculateAbsolutePointByElementBase(selection);
      strokeRectangle({
        absolutePoint,
        ctx,
        lineWidth: 2,
        strokeStyle: blue.blue9,
        margin: 0,
      });

      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = blue.blue2;
      ctx.fillRect(
        selection.point.x,
        selection.point.y,
        selection.size.width,
        selection.size.height
      );
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
    selection,
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
      const focusedElement = document.activeElement;
      const isInteractiveElementFocused =
        focusedElement instanceof HTMLInputElement ||
        focusedElement instanceof HTMLTextAreaElement ||
        focusedElement instanceof HTMLButtonElement;
      if (isInteractiveElementFocused) {
        return;
      }

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

    switch (tool) {
      case "hand": {
        startPanWithHand(event);
        break;
      }
      case "text": {
        startWrite(event);
        break;
      }
      case "image":
        send({
          type: "DRAW_UPLOADED_IMAGE",
          event,
          devicePixelRatio,
        });
        break;
      case "selection": {
        const selectedElements = elements.filter(
          (element) => element.status === "selected"
        );
        const absolutePoint = calculateElementsAbsolutePoint(selectedElements);
        if (isPointInsideOfAbsolutePoint(absolutePoint, mousePoint)) {
          startDrag(event);
        } else {
          send({
            type: "SELECT_START",
            event,
            devicePixelRatio,
          });
        }
        break;
      }
      default: {
        startDraw(event);
        break;
      }
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
      if (drawingElement.size.width === 0 && drawingElement.size.height === 0) {
        send("CONNECT_START");
        return;
      }
    }

    send({
      type: "DRAW_END",
      event,
      devicePixelRatio,
    });
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

  const endSelect: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "SELECT_END",
      devicePixelRatio,
      event,
    });
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

  const select: MouseEventHandler<HTMLCanvasElement> = (event) => {
    send({
      type: "SELECT",
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

  const showElementOptions = calculateShowElementOptions(
    tool,
    selectedElements
  );

  return (
    <div className="h-screen overflow-hidden">
      <div className="absolute w-full h-full p-4 pointer-events-none z-10">
        <div className="w-full h-full relative flex flex-col gap-4">
          <header
            className={`flex justify-center items-center gap-1 bg-black rounded-lg cursor-default
            ${state.matches("idle") && "pointer-events-auto"}`}
          >
            <input
              className="hidden"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={uploadImage}
            />

            <CheckboxCard
              label="fix shape"
              checked={isToolFixed}
              onCheckedChange={() => send("IS_ELEMENT_SHAPE_FIXED_TOGGLE")}
              defaultIcon={<LockOpenIcon />}
              checkedIcon={<LockClosedIcon />}
            />

            <RadioCardGroup.Root
              aria-label="Tool"
              className="flex gap-1 p-2"
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
                    label={label}
                    value={shape}
                    icon={icon}
                    checked={tool === shape}
                  />
                );
              })}
            </RadioCardGroup.Root>
          </header>

          {((selectedElements.length === 0 &&
            tool !== "hand" &&
            tool !== "selection" &&
            tool !== "image") ||
            (selectedElements.length >= 1 && tool === "selection")) && (
            <div
              className={`w-[180px] cursor-default
              ${state.matches("idle") && "pointer-events-auto"}`}
            >
              <div className="flex flex-col gap-2 bg-black text-slate11 text-sm p-2 rounded-lg">
                {canShowElementOption(showElementOptions, "stroke") && (
                  <Fieldset legend="Stroke Color">
                    <ColorPicker
                      scale={11}
                      value={String(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "stroke",
                        }) ?? ""
                      )}
                      onColorChange={(color) => {
                        const canvasElement = canvasRef.current;
                        invariant(canvasElement);

                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            stroke: color,
                          },
                          canvasElement,
                          devicePixelRatio,
                        });
                      }}
                    />
                  </Fieldset>
                )}

                {canShowElementOption(showElementOptions, "fill") && (
                  <Fieldset legend="Fill Color">
                    <ColorPicker
                      scale={9}
                      value={String(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "fill",
                        }) ?? ""
                      )}
                      onColorChange={(color) => {
                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            fill: color,
                          },
                        });
                      }}
                    />
                  </Fieldset>
                )}

                {canShowElementOption(showElementOptions, "fillStyle") && (
                  <Fieldset legend="Fill Style">
                    <RadioCardGroup.Root
                      aria-label="fill style"
                      className="flex gap-1"
                      value={String(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "fillStyle",
                        })
                      )}
                      onValueChange={(fillStyle) => {
                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            fillStyle,
                          },
                        });
                      }}
                    >
                      {Fill_STYLE_OPTIONS.map(({ label, value, icon }) => {
                        return (
                          <RadioCardGroup.Item
                            key={value}
                            label={label}
                            value={value}
                            icon={icon}
                            checked={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "fillStyle",
                              }) === value
                            }
                            className={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "fillStyle",
                              }) !== value
                                ? "bg-slate12"
                                : undefined
                            }
                          />
                        );
                      })}
                    </RadioCardGroup.Root>
                  </Fieldset>
                )}

                {canShowElementOption(showElementOptions, "strokeWidth") && (
                  <Fieldset legend="Stroke Width">
                    <RadioCardGroup.Root
                      aria-label="stroke width"
                      className="flex gap-1"
                      value={String(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "strokeWidth",
                        })
                      )}
                      onValueChange={(strokeWidth) => {
                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            strokeWidth: Number(strokeWidth),
                          },
                        });
                      }}
                    >
                      {STROKE_WIDTH_OPTIONS.map(({ label, value, icon }) => {
                        return (
                          <RadioCardGroup.Item
                            key={value}
                            label={label}
                            value={String(value)}
                            icon={icon}
                            checked={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "strokeWidth",
                              }) === value
                            }
                            className={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "strokeWidth",
                              }) !== value
                                ? "bg-slate12"
                                : undefined
                            }
                          />
                        );
                      })}
                    </RadioCardGroup.Root>
                  </Fieldset>
                )}

                {canShowElementOption(showElementOptions, "strokeLineDash") && (
                  <Fieldset legend="Stroke Line Dash">
                    <RadioCardGroup.Root
                      aria-label="stroke line dash"
                      className="flex gap-1"
                      value={JSON.stringify(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "strokeLineDash",
                        })
                      )}
                      onValueChange={(strokeLineDash) => {
                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            strokeLineDash: JSON.parse(
                              strokeLineDash
                            ) as number[],
                          },
                        });
                      }}
                    >
                      {STROKE_LINE_DASH_OPTIONS.map(
                        ({ label, value, icon }) => {
                          return (
                            <RadioCardGroup.Item
                              key={label}
                              label={label}
                              value={JSON.stringify(value)}
                              icon={icon}
                              checked={
                                JSON.stringify(
                                  calculateElementOptionValue({
                                    selectedElements,
                                    elementOptions,
                                    option: "strokeLineDash",
                                  })
                                ) === JSON.stringify(value)
                              }
                              className={
                                JSON.stringify(
                                  calculateElementOptionValue({
                                    selectedElements,
                                    elementOptions,
                                    option: "strokeLineDash",
                                  })
                                ) !== JSON.stringify(value)
                                  ? "bg-slate12"
                                  : undefined
                              }
                            />
                          );
                        }
                      )}
                    </RadioCardGroup.Root>
                  </Fieldset>
                )}

                {canShowElementOption(showElementOptions, "roughness") && (
                  <Fieldset legend="Roughness">
                    <RadioCardGroup.Root
                      aria-label="roughness"
                      className="flex gap-1"
                      value={String(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "roughness",
                        })
                      )}
                      onValueChange={(roughness) => {
                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            roughness: Number(roughness),
                          },
                        });
                      }}
                    >
                      {ROUGHNESS_OPTIONS.map(({ label, value, icon }) => {
                        return (
                          <RadioCardGroup.Item
                            key={label}
                            label={label}
                            value={String(value)}
                            icon={icon}
                            checked={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "roughness",
                              }) === value
                            }
                            className={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "roughness",
                              }) !== value
                                ? "bg-slate12"
                                : undefined
                            }
                          />
                        );
                      })}
                    </RadioCardGroup.Root>
                  </Fieldset>
                )}

                {canShowElementOption(showElementOptions, "fontSize") && (
                  <Fieldset legend="Font Size">
                    <RadioCardGroup.Root
                      aria-label="font size"
                      className="flex gap-1"
                      value={String(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "fontSize",
                        })
                      )}
                      onValueChange={(fontSize) => {
                        const canvasElement = canvasRef.current;
                        invariant(canvasElement);

                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            fontSize: Number(fontSize),
                          },
                          canvasElement,
                          devicePixelRatio,
                        });
                      }}
                    >
                      {FONT_SIZE_OPTIONS.map(({ label, value, icon }) => {
                        return (
                          <RadioCardGroup.Item
                            key={label}
                            label={label}
                            value={String(value)}
                            icon={icon}
                            checked={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "fontSize",
                              }) === value
                            }
                            className={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "fontSize",
                              }) !== value
                                ? "bg-slate12"
                                : undefined
                            }
                          />
                        );
                      })}
                    </RadioCardGroup.Root>
                  </Fieldset>
                )}

                {canShowElementOption(showElementOptions, "fontFamily") && (
                  <Fieldset legend="Font Family">
                    <RadioCardGroup.Root
                      aria-label="font family"
                      className="flex gap-1"
                      value={String(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "fontFamily",
                        })
                      )}
                      onValueChange={(fontFamily) => {
                        const canvasElement = canvasRef.current;
                        invariant(canvasElement);

                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            fontFamily: fontFamily as FontFamily,
                          },
                          canvasElement,
                          devicePixelRatio,
                        });
                      }}
                    >
                      {FONT_FAMILY_OPTIONS.map(({ label, value, icon }) => {
                        return (
                          <RadioCardGroup.Item
                            key={label}
                            label={label}
                            value={value}
                            icon={icon}
                            checked={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "fontFamily",
                              }) === value
                            }
                            className={
                              calculateElementOptionValue({
                                selectedElements,
                                elementOptions,
                                option: "fontFamily",
                              }) !== value
                                ? "bg-slate12"
                                : undefined
                            }
                          />
                        );
                      })}
                    </RadioCardGroup.Root>
                  </Fieldset>
                )}

                {canShowElementOption(showElementOptions, "opacity") && (
                  <Fieldset legend="Opacity">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={Number(
                        calculateElementOptionValue({
                          selectedElements,
                          elementOptions,
                          option: "opacity",
                        })
                      )}
                      onChange={(event) => {
                        const canvasElement = canvasRef.current;
                        invariant(canvasElement);

                        send({
                          type: "CHANGE_ELEMENT_OPTIONS",
                          elementOptions: {
                            opacity: Number(event.target.value),
                          },
                          canvasElement,
                          devicePixelRatio,
                        });
                      }}
                    />
                  </Fieldset>
                )}

                {selectedElements.length !== 0 && (
                  <Fieldset legend="Actions">
                    <div className="flex gap-1">
                      <Button
                        variant="primary"
                        onClick={() => {
                          send("SELECTED_ELEMENTS.COPY");
                        }}
                        aria-label="copy"
                      >
                        <CopyIcon />
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          send("SELECTED_ELEMENTS.DELETE");
                        }}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </Button>

                      {selectedElements.length > 1 && (
                        <>
                          {isSameGroup(selectedElements) ? (
                            <Button
                              variant="primary"
                              onClick={() => {
                                send("SELECTED_ELEMENTS.UNGROUP");
                              }}
                              aria-label="ungroup"
                            >
                              <UnGroupIcon />
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={() => {
                                send("SELECTED_ELEMENTS.GROUP");
                              }}
                              aria-label="group"
                            >
                              <GroupIcon />
                            </Button>
                          )}

                          {!isSameGroup(selectedElements) &&
                            selectedElements.some(
                              (element) => element.groupIds.length !== 0
                            ) && (
                              <Button
                                variant="primary"
                                onClick={() => {
                                  send("SELECTED_ELEMENTS.UNGROUP");
                                }}
                                aria-label="ungroup"
                              >
                                <UnGroupIcon />
                              </Button>
                            )}
                        </>
                      )}
                    </div>
                  </Fieldset>
                )}
              </div>
            </div>
          )}

          <div
            className={`absolute bottom-0 left-0 flex gap-2 ${
              state.matches("idle") && "pointer-events-auto"
            }`}
          >
            <div className="flex">
              <Button
                className="rounded-r-none"
                onClick={() => updateZoom(-10)}
                disabled={zoom === ZOOM.MIN}
              >
                <MinusIcon />
              </Button>

              <Button
                className="rounded-none"
                onClick={() => {
                  const canvasElement = canvasRef.current;
                  invariant(canvasElement);

                  send({
                    type: "CHANGE_ZOOM",
                    setZoom: () => 1,
                    canvasElement,
                  });
                }}
                disabled={zoom === 1}
              >
                {Math.round(zoom * 100)}%
              </Button>

              <Button
                className="rounded-l-none"
                onClick={() => updateZoom(10)}
                disabled={zoom === ZOOM.MAX}
              >
                <PlusIcon />
              </Button>
            </div>

            <div className="flex">
              <Button
                className="rounded-r-none"
                onClick={() =>
                  send({
                    type: "HISTORY_UPDATE",
                    changedStep: -1,
                  })
                }
                disabled={historyStep === 0}
              >
                <UndoIcon />
              </Button>
              <Button
                className="rounded-l-none"
                onClick={() => {
                  send({
                    type: "HISTORY_UPDATE",
                    changedStep: 1,
                  });
                }}
                disabled={historyStep === history.length - 1}
              >
                <RedoIcon />
              </Button>
            </div>
          </div>
        </div>
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
            : state.matches("selecting")
            ? select
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
            : state.matches("selecting")
            ? endSelect
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
            className="absolute bg-transparent overflow-hidden whitespace-pre resize-none border-none p-0 outline-0"
            style={{
              left: drawStartViewportPoint.x,
              top: drawStartViewportPoint.y,
              fontFamily: drawingElement.options.fontFamily,
              fontSize: drawingElement.options.fontSize,
              color: drawingElement.options.stroke,
              lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
              // initialize width = '1px' to show input caret
              width: drawingElement.text === "" ? 1 : "auto",
              maxWidth: (windowSize.width - drawStartViewportPoint.x) / zoom,
              maxHeight: Math.max(
                (windowSize.height -
                  drawStartViewportPoint.y +
                  (drawingElement.options.fontSize *
                    TEXTAREA_UNIT_LESS_LINE_HEIGHT) /
                    2) /
                  zoom,
                drawingElement.options.fontSize * TEXTAREA_UNIT_LESS_LINE_HEIGHT
              ),
              transformOrigin: "top left",
              transform: `scale(${zoom}) translateY(${
                -(
                  drawingElement.options.fontSize *
                  TEXTAREA_UNIT_LESS_LINE_HEIGHT
                ) / 2
              }px)`,
              opacity: drawingElement.options.opacity,
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
