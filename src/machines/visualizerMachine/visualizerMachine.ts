import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { assign, createMachine } from "xstate";
import {
  calculateCenterPoint,
  calculateElementsAbsolutePoint,
  calculateCanvasPoint,
  calculateNormalizedValue,
  calculateNormalizedZoom,
  isIntersecting,
  createElement,
  isGenericElement,
  isLinearElement,
  calculateFreeDrawElementAbsolutePoint,
  isTextElement,
  isFreeDrawElement,
  calculateClientPoint,
  measureText,
} from "../../utils";
import debounce from "lodash.debounce";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../../constants";
import {
  VisualizerElement,
  VisualizerMachineContext,
  VisualizerMachineEvents,
} from "./types";
import { PERSISTED_CONTEXT } from "./constant";

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogDsMo4wCcARgAspgKyXz1hwCYjAGhABPRJYAcMuaMLgBsAMwyYSGOLnYh1uYAvomeaJi4BMTkVLQMzKwcAMIAErwAcgDiAKKCVQAyVQCyVWWiIqUAClWyCkggqupaOnqGCCZmVrZGDk6uHt6ILjIyjNPLMksyzmHmdsmp6Nh4hKQUNPRMLGxcfBUi4pI9egOa2rp9o+MWNvaOzpZuTw+BBLfyMMJGFwuJzLEIBeL7EBpI6ZU45C75a7CepVQqiKqcWoNZqtYSMTg4-FPPovIbvUCfUzfKYzf6AhYIAGWMwuPwAsJhbnLMLWRHIjInbLnPJXDjYhp4glEpotURkwoAeQ6AE1qco1K9hh9jEzJr9ZgD5sCwi5rIxLHFYhEdn47EZLGLDhKsmdcpcCux5bj8YScSS1YwOrwxN15M8DXSRiaJj9pn85kDfIKwqsRWE7NY4XY-NYwn5Peljj70TKA40NQBVbGCesANVjvX1gzeSYQEMsjG2lnCsyMZbCmc55ihq15RkhO3ngr2KSRXqraOl-uuAElhMrw+1eF1BAAxHcADSVog1FQqDT1-QTPeNY1NqdZGY51iWjBCgQhZw7DiEITBXA5K1RKU-UxOUcUVUNiVVdUG2kOMaWfI0GWTZlzTZK1EAcMwZBCW1zH-d1rHnCsUUlX0MVldgSnKaoD1VQQtVEHcNTKYRH1pF9sLfFMWXTS1JxsSwVn8IwqNImRhzsCEaO9TcYMY5jKhqAAtDUNUafjMPpAwcLNNMLXZYF4hWQs-D8fMBQFEIQnAtdILomttyKUotMEXT9MEfgd1EYpBA6HcyhKQzuywkzhNw8z8MnMcQgsFxHDiEsrCMFyVI3aCGIDKMymiw1jMZES8K-YF7JzCE7FMez4nMPxSLyqD6Nra5ij3G9uG1QQGw6TheCpdCuzK3svjMz9xI5acgj8XlHBagIjHIj1V3FfLOq89h+G4YKajECQ0M7J8YvK0yPzEyzfBIlZGpcHZzGnZ6bXajyt1gpifNYsRtQaPjxouybX2mm6LIIzkGtS6y7HMeduULKJPurb6ICILAAHd6CgG4BFKxNXykkVGARpH0pa6Y-AksccyMVqpisZqHDRtSMUxnG8YJoQWk4InBLigFnuCPNGfMHZwksCTSLMHYZDdExAkVhEtvXDrPMYLncbofGeAEWoygFyxzoE2LRhFnNntLCWpcFCSAjtExBWmCJXuiUV1fc9GYJ1nmKQafERHgrieMFi3ECWlZSIapZ5xckwXFl11GFdZzyMlki3fZgq8i5qAoAD24I6uzlIgHUxIhCRGonMBToZiGPpzAnKHRMEJc927WscL4veDufnS97K2xdtvxJfIh2OSWWI-yhOcpNsLYu61nAVCwCAeeH19lvBUD0sieOdknUEJkFPwTG5JXplX76lGIdRYC0PX2B3oT0oiNPlpFSFnAUuwk4+Tk3WNnHKAQJ6d29rRX2GIwBsDIGAOgGgSCwGoFgB+JAiBwDABoN+INzZl2vgOUIwFyKuiksKR2Nc-wAVstOJaBY74wWQI-N4WD4FgCwLASA+CzZGV7J-FYS0+S-1tA1B0EkGo5ksACEs7p2411cttTW31sZEFeK-A6R0jYCwIQIkmUJrbiwnvbGWHIpJjnJgWEsdkXJuDCMkVcdAVAQDgHoFRX0-Txkur2AAtCEScfi7AWFegwpY0drC2BcMwwqbAfFgyEj+FwFgnKyIFIEcIgSZ4bDtP4fwk9LD5msDYWJ+csa6ygAk4mQlLErHdJfFKjVJEWNaikmIsl3SMzLFRMpTAC5Fz1tUoWlts5-m5OlWIS1SyOFPlsIIgQ7GuhdsOPpjB16bzxsMyOCAfwSVejmGZq16bdPLNA1SecmAPyIE-F+VSMK+N3qQ3CdkRS7AUpOcIfhaFRKRl0twazOGIOQag9BmDsE8I0NsohBYgjQjhE7N2izHbOHtABecUIfwI0cecnaWtWE3PYdgtg3DIDQpHpfVK+YHQNSogjV6tMLFUW+dENwE8oQkUFF7CCMCOZ5HUZo+5E0anC1MHaS+0irB2WvtYCSgRiLZh-FJCROLkhAA */
  createMachine(
    {
      id: "visualizer machine",
      tsTypes: {} as import("./visualizerMachine.typegen").Typegen0,

      // Ensures that assign actions are called in order
      preserveActionOrder: true,

      predictableActionArguments: true,

      schema: {
        context: {} as VisualizerMachineContext,
        events: {} as VisualizerMachineEvents,
      },

      context: {
        ...PERSISTED_CONTEXT,

        historyStep: 0,
        history: [
          {
            elements: PERSISTED_CONTEXT["elements"],
            elementOptions: PERSISTED_CONTEXT["elementOptions"],
          },
        ],
      },

      states: {
        idle: {
          on: {
            DRAW_START: {
              target: "drawing",
              actions: [
                "unselectElements",
                "assignDrawStartPoint",
                "addElement",
              ],
            },

            CHANGE_ELEMENT_SHAPE: {
              target: "persisting",

              actions: ["unselectElements", "changeElementShape"],
            },

            DRAG_START: {
              target: "dragging",
              actions: "assignPreviousPoint",
            },

            "SELECTED_ELEMENTS.DELETE": {
              target: "version released",
              actions: ["deleteSelectedElements"],
            },

            "SELECTED_ELEMENTS.COPY": {
              target: "persisting",
              actions: "copySelectedElements",
            },

            "SELECTED_ELEMENTS.PASTE": {
              target: "version released",
              actions: ["pasteSelectedElements"],
            },

            MOUSE_MOVE: {
              target: "idle",
              internal: true,
              actions: "assignCurrentPoint",
            },

            IS_ELEMENT_SHAPE_FIXED_TOGGLE: {
              target: "persisting",
              actions: "toggleIsElementShapeFixed",
            },

            "SELECTED_ELEMENTS.CUT": {
              target: "persisting",
              actions: ["copySelectedElements", "deleteSelectedElements"],
            },

            CHANGE_ELEMENT_OPTIONS: {
              target: "version released",
              actions: "assignElementOptions",
            },

            CHANGE_ZOOM: {
              target: "persisting",
              actions: ["assignZoom"],
            },

            CHANGE_ZOOM_WITH_PINCH: {
              target: "persisting",
              actions: ["assignZoomToCurrentPoint"],
            },

            PAN: {
              target: "persisting",
              actions: ["pan"],
            },

            HISTORY_UPDATE: {
              target: "persisting",
              actions: ["updateHistory"],
            },

            WRITE_START: {
              target: "writing",
              actions: ["assignDrawStartPoint", "addElement"],
            },
          },
        },

        drawing: {
          on: {
            DRAW: {
              target: "drawing",
              internal: true,
              actions: ["draw", "updateIntersecting"],
            },

            DRAW_END: [
              {
                target: "version released",

                actions: [
                  "draw",
                  "updateIntersecting",
                  "selectDrawingElement",
                  "resetDrawingElementId",
                ],

                cond: "isElementShapeFixed",
              },
              {
                target: "element shape reset",
                actions: [
                  "draw",
                  "updateIntersecting",
                  "selectDrawingElement",
                  "resetDrawingElementId",
                ],
              },
            ],

            DELETE_SELECTION: {
              target: "idle",
              actions: ["deleteSelection", "resetDrawingElementId"],
            },
          },
        },

        dragging: {
          on: {
            DRAG: {
              target: "dragging",
              internal: true,
              actions: ["drag", "assignPreviousPoint"],
            },

            DRAG_END: {
              target: "version released",
              actions: ["drag"],
            },
          },
        },

        loading: {
          always: "idle",
          entry: "loadSavedContext",
        },

        persisting: {
          entry: "persist",
          always: "idle",
        },

        "element shape reset": {
          entry: assign({
            elementShape: "selection",
          }),

          always: "version released",
        },

        "version released": {
          entry: ["addVersionToHistory"],

          always: "persisting",
        },

        writing: {
          on: {
            WRITE_END: {
              target: "version released",
              actions: "endWrite",
            },
          },
        },
      },

      initial: "loading",
    },
    {
      actions: {
        addElement: assign((context, { devicePixelRatio }) => {
          const newElement = createElement({
            elementShape: context.elementShape,
            elementOptions: context.elementOptions,
            drawStartPoint: context.drawStartPoint,
            devicePixelRatio,
          });

          return {
            elements: [...context.elements, newElement],
            drawingElementId: newElement.id,
          };
        }),
        deleteSelection: assign((context) => {
          return {
            elements: context.elements.filter(
              (element) => element.shape !== "selection"
            ),
          };
        }),
        changeElementShape: assign((_, { elementShape }) => {
          return {
            elementShape,
          };
        }),
        assignDrawStartPoint: assign((context, { devicePixelRatio, event }) => {
          const drawStartPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            drawStartPoint,
          };
        }),
        assignPreviousPoint: assign((context, { devicePixelRatio, event }) => {
          const previousPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            previousPoint,
          };
        }),
        unselectElements: assign((context) => {
          return {
            elements: context.elements.map((element) => ({
              ...element,
              isSelected: false,
            })),
          };
        }),
        draw: assign((context, { devicePixelRatio, event }) => {
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            elements: context.elements.map((element): VisualizerElement => {
              if (element.id === context.drawingElementId) {
                const dx = currentPoint.x - context.drawStartPoint.x;
                const dy = currentPoint.y - context.drawStartPoint.y;

                if (isGenericElement(element)) {
                  return {
                    ...element,
                    x: Math.min(currentPoint.x, context.drawStartPoint.x),
                    y: Math.min(currentPoint.y, context.drawStartPoint.y),
                    width: Math.abs(dx),
                    height: Math.abs(dy),
                  };
                }

                if (isLinearElement(element)) {
                  return {
                    ...element,
                    width: Math.abs(dx),
                    height: Math.abs(dy),
                    points: [
                      [0, 0],
                      [dx, dy],
                    ],
                  };
                }

                if (isFreeDrawElement(element)) {
                  const absolutePoint =
                    calculateFreeDrawElementAbsolutePoint(element);
                  return {
                    ...element,
                    width: absolutePoint.maxX - absolutePoint.minX,
                    height: absolutePoint.maxY - absolutePoint.minY,
                    points: [...element.points, [dx, dy]],
                  };
                }

                return element;
              }

              return element;
            }),
          };
        }),
        updateIntersecting: assign((context) => {
          const drawingElement = context.elements.find(
            (element) => element.id === context.drawingElementId
          );
          invariant(drawingElement);

          if (drawingElement.shape === "selection") {
            return {
              elements: context.elements.map((element) => {
                if (element.shape === "selection") {
                  return element;
                }

                return {
                  ...element,
                  isSelected: isIntersecting(drawingElement, element),
                };
              }),
            };
          }
          return {};
        }),
        selectDrawingElement: assign((context) => {
          return {
            elements: context.elements.map((element) => {
              if (element.id === context.drawingElementId) {
                return {
                  ...element,
                  isSelected: true,
                };
              }
              return element;
            }),
          };
        }),
        drag: assign((context, { devicePixelRatio, event }) => {
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            elements: context.elements.map((element) => {
              if (element.isSelected) {
                return {
                  ...element,
                  x: element.x + (currentPoint.x - context.previousPoint.x),
                  y: element.y + (currentPoint.y - context.previousPoint.y),
                };
              }
              return element;
            }),
          };
        }),
        persist: debounce((context: VisualizerMachineContext) => {
          const { history, historyStep, ...persistedContext } = context;

          try {
            localStorage.setItem("context", JSON.stringify(persistedContext));
          } catch (error) {
            console.error(error);
          }
        }, 300),
        deleteSelectedElements: assign((context) => {
          return {
            elements: context.elements.map((element) => {
              if (element.isSelected) {
                return {
                  ...element,
                  isDeleted: true,
                  isSelected: false,
                };
              }

              return element;
            }),
          };
        }),
        copySelectedElements: assign((context) => {
          return {
            copiedElements: context.elements.filter(
              (element) => element.isSelected
            ),
          };
        }),
        pasteSelectedElements: assign((context) => {
          const absolutePoint = calculateElementsAbsolutePoint(
            context.copiedElements
          );
          const centerPoint = calculateCenterPoint(absolutePoint);

          const copiedElements = context.copiedElements.map((copiedElement) => {
            const centerX = copiedElement.x + copiedElement.width / 2;
            const centerY = copiedElement.y + copiedElement.height / 2;

            return {
              ...copiedElement,
              id: uuidv4(),
              x:
                context.currentPoint.x -
                copiedElement.width / 2 +
                centerX -
                centerPoint.x,
              y:
                context.currentPoint.y -
                copiedElement.height / 2 +
                centerY -
                centerPoint.y,
            };
          });

          return {
            elements: [
              ...context.elements.map((element) => {
                return {
                  ...element,
                  isSelected: false,
                };
              }),
              ...copiedElements,
            ],
          };
        }),
        assignCurrentPoint: assign((context, { devicePixelRatio, event }) => {
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            currentPoint,
          };
        }),
        toggleIsElementShapeFixed: assign((context) => {
          return {
            isElementShapeFixed: !context.isElementShapeFixed,
          };
        }),
        assignElementOptions: assign((context, event) => {
          return {
            elementOptions: {
              ...context.elementOptions,
              ...event.elementOptions,
            },
          };
        }),
        assignZoom: assign((context, { setZoom, canvasElement }) => {
          const normalizedZoom = calculateNormalizedZoom(setZoom(context.zoom));
          const targetPoint = {
            x: canvasElement.width / 2,
            y: canvasElement.height / 2,
          };

          return {
            zoom: normalizedZoom,
            origin: {
              x: -(targetPoint.x * normalizedZoom - targetPoint.x),
              y: -(targetPoint.y * normalizedZoom - targetPoint.y),
            },
          };
        }),
        assignZoomToCurrentPoint: assign((context, { setZoom }) => {
          const normalizedZoom = calculateNormalizedZoom(setZoom(context.zoom));

          return {
            zoom: normalizedZoom,
            origin: {
              x:
                context.origin.x -
                (context.currentPoint.x * normalizedZoom -
                  context.currentPoint.x * context.zoom),
              y:
                context.origin.y -
                (context.currentPoint.y * normalizedZoom -
                  context.currentPoint.y * context.zoom),
            },
          };
        }),
        pan: assign((context, { event, devicePixelRatio }) => {
          const clientPoint = calculateClientPoint({
            canvasPoint: context.currentPoint,
            origin: context.origin,
            zoom: context.zoom,
            devicePixelRatio,
          });
          const updatedOrigin = {
            x: context.origin.x - event.deltaX,
            y: context.origin.y - event.deltaY,
          };
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event: {
              clientX: clientPoint.x,
              clientY: clientPoint.y,
            },
            origin: updatedOrigin,
            zoom: context.zoom,
          });

          return {
            origin: updatedOrigin,
            currentPoint,
          };
        }),
        addVersionToHistory: assign((context) => {
          const newVersion = {
            elementOptions: context.elementOptions,
            elements: context.elements,
          };

          const isPresent = context.historyStep === context.history.length - 1;
          if (isPresent) {
            return {
              history: [...context.history, newVersion],
              historyStep: context.historyStep + 1,
            };
          }

          return {
            history: [
              ...context.history.slice(0, context.historyStep + 1),
              newVersion,
            ],
            historyStep: context.historyStep + 1,
          };
        }),
        updateHistory: assign((context, { changedStep }) => {
          const updatedHistoryStep = calculateNormalizedValue({
            maximum: context.history.length - 1,
            value: context.historyStep + changedStep,
            minimum: 0,
          });
          const version = context.history[updatedHistoryStep];
          invariant(version);

          return {
            elements: version.elements,
            elementOptions: version.elementOptions,
            historyStep: updatedHistoryStep,
          };
        }),
        resetDrawingElementId: assign((_) => ({
          drawingElementId: null,
        })),
        endWrite: assign((context, { text, canvasElement }) => {
          return {
            elements: context.elements.map((element) => {
              if (
                element.id === context.drawingElementId &&
                isTextElement(element)
              ) {
                const { width, height } = measureText({
                  fontFamily: element.fontFamily,
                  fontSize: element.fontSize,
                  lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
                  text,
                  canvasElement,
                });

                return {
                  ...element,
                  text,
                  width,
                  height,
                };
              }
              return element;
            }),
          };
        }),
      },
      guards: {
        isElementShapeFixed: (context) => {
          return context.isElementShapeFixed;
        },
      },
    }
  );
