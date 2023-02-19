import { MouseEventHandler } from "react";
import { Options } from "roughjs/bin/core";
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
  Point,
  createElement,
  isGenericElement,
  isLinearElement,
  calculateFreeDrawElementAbsolutePoint,
  isTextElement,
  isFreeDrawElement,
  calculateClientPoint,
  measureText,
} from "../utils";
import debounce from "lodash.debounce";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../constants";

export type VisualizerElementBase = {
  id: string;

  // VisualizerGenericElement: left top point
  // VisualizerLinearElement: start point
  x: number;
  y: number;

  // VisualizerGenericElement: absolute width, height
  // VisualizerLinearElement: absolute width, height
  width: number;
  height: number;

  isSelected: boolean;
  options: Options;
  isDeleted: boolean;
};

type VisualizerSelectionElement = VisualizerElementBase & {
  shape: "selection";
};
type VisualizerRectangleElement = VisualizerElementBase & {
  shape: "rectangle";
};
type VisualizerEllipseElement = VisualizerElementBase & {
  shape: "ellipse";
};

export type VisualizerGenericElement =
  | VisualizerSelectionElement
  | VisualizerRectangleElement
  | VisualizerEllipseElement;

type TuplePoint = [number, number];

export type VisualizerLinearElement = VisualizerElementBase & {
  shape: "line" | "arrow";
  points: TuplePoint[];
};

export type VisualizerFreeDrawElement = VisualizerElementBase & {
  shape: "freedraw";
  points: TuplePoint[];
};

export type VisualizerTextElement = VisualizerElementBase & {
  shape: "text";
  fontFamily: "serif";
  fontSize: number;
  text: string;
};

export type VisualizerElement =
  | VisualizerGenericElement
  | VisualizerLinearElement
  | VisualizerFreeDrawElement
  | VisualizerTextElement;

export const SHAPE_TYPES: Record<
  VisualizerElement["shape"],
  "generic" | "linear" | "freedraw" | "text"
> = {
  selection: "generic",
  rectangle: "generic",
  ellipse: "generic",
  line: "linear",
  arrow: "linear",
  freedraw: "freedraw",
  text: "text",
};

type Version = {
  elements: VisualizerMachineContext["elements"];
  elementOptions: VisualizerMachineContext["elementOptions"];
};

// context that is saved to localStorage
type VisualizerMachinePersistedContext = {
  elements: VisualizerElement[];
  elementOptions: Options;

  elementShape: VisualizerElement["shape"];
  drawingElementId: VisualizerElement["id"] | null;
  drawStartPoint: Point;
  previousPoint: Point;
  copiedElements: VisualizerElement[];
  currentPoint: Point;
  isElementShapeFixed: boolean;
  zoom: number;
  origin: {
    x: number;
    y: number;
  };
};

export type VisualizerMachineContext = VisualizerMachinePersistedContext & {
  // context that is **not** saved to localStorage
  history: Version[];
  historyStep: number;
};

/* #region events within machine  */
export type VisualizerMachineEvents =
  | {
      type: "DRAW_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DRAW";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DRAW_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DELETE_SELECTION";
    }
  | {
      type: "CHANGE_ELEMENT_SHAPE";
      elementShape: VisualizerElement["shape"];
    }
  | {
      type: "DRAG_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DRAG";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DRAG_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "SELECTED_ELEMENTS.DELETE";
    }
  | {
      type: "SELECTED_ELEMENTS.COPY";
    }
  | {
      type: "SELECTED_ELEMENTS.CUT";
    }
  | {
      type: "SELECTED_ELEMENTS.PASTE";
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "MOUSE_MOVE";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "IS_ELEMENT_SHAPE_FIXED_TOGGLE";
    }
  | {
      type: "CHANGE_ELEMENT_OPTIONS";
      elementOptions: VisualizerMachineContext["elementOptions"];
    }
  | {
      type: "CHANGE_ZOOM";
      setZoom: (
        zoom: VisualizerMachineContext["zoom"]
      ) => VisualizerMachineContext["zoom"];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "CHANGE_ZOOM_WITH_PINCH";
      setZoom: (
        zoom: VisualizerMachineContext["zoom"]
      ) => VisualizerMachineContext["zoom"];
    }
  | {
      type: "PAN";
      event: WheelEvent;
      devicePixelRatio: number;
    }
  | {
      type: "HISTORY_UPDATE";
      changedStep: 1 | -1;
    }
  | {
      type: "WRITE_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "WRITE_END";
      text: string;
      canvasElement: HTMLCanvasElement;
    };
/* #endregion */

// zoom in ratio
export const ZOOM = {
  DEFAULT: 1,
  MINIMUM: 0.1,
  MAXIMUM: 30,
} as const;

const PERSISTED_CONTEXT: VisualizerMachinePersistedContext = {
  // track
  elements: [],
  elementOptions: {
    stroke: "#000",
    fill: "transparent",
    strokeWidth: 2,
  },

  // untrack
  elementShape: "selection",
  copiedElements: [],
  drawingElementId: null,
  drawStartPoint: {
    x: 0,
    y: 0,
  },
  previousPoint: {
    x: 0,
    y: 0,
  },
  // cursor point in actual canvas size (not viewport)
  currentPoint: {
    x: 0,
    y: 0,
  },
  isElementShapeFixed: false,
  zoom: ZOOM.DEFAULT,
  origin: {
    x: 0,
    y: 0,
  },
};

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogBsAdhOMAnAEYALDIBMFmQA5T9kxYA0IAJ6IrzgCsMoyuNs4m4VZGMjJGgQC+Cd5omLgExORUtAzMrBwAwgASvAByAOIAooKVADKVALKVpaIiJQAKlbIKSCCq6lo6eoYIpubWdo4ubh7efgj2sYyRFqs2NgDMgYFWMjb2SSno2HiEpBQ09EwsbFx85SLikt16-Zraur0jY5a2Dk6uEzuLy+fyBDYWRgbDYxGRWdwxGIWQ4gVInDLnbJXPK3YR1SoFUSVTg1epNFrCRicfFEl69N6DT6gb5mX6TAEzEHzLZWRi7Cww+zOewxXaRFFo9JnLKXXI3Dh4+qE4mkxrNUSUgoAeXaAE06co1O8hl9jKyJv9pkDZqCEDZIowdoEjO5IvENhEJccpZkLjlrvl2IqCUSSfjyRrGO1eGIuvJXkbGcNEECbIx3JN3Bs7DYLCY5ohAiZedYLIFwkFnIKjF60qdfVi5YGGlqAKp4wQtgBqcZ6hoGH2TCA2xcYNnBVknHnBTg2BYQVhMwrH1i2wqszviJlr6Olfux8vYAElhKqI21eJ1BAAxI8ADRVoi15XK9QNfUTg9No3NfymgOBecjAsNMR1zMtHFWWINh3H1MVlANcXxZUwzJdVNVbaR43pT8TWZM1xj-DlrS5FMnFCIV4RMbMNxA5xYPreD-RxQoSgqapw3VQQdVEI8tVKYR3wZL98J-Qj2StQDbRA3kAhMQJ7B2OwyxdBiMRlZjD2KMoqkEAAtLUtQaITcKZAwCLZS0AJteZdhHRgjDsQILCrRyLCFejklRb1GI0g9A209j9MMhpBH4I9RCKQR2iPUpihMgc8PMsTLP-Tl50nIxeT2MZgkCZwIhHNS90bRCOGjUoEuNMyWXEqz0tteFnDTccNjiAUCpFRTiobBCWPYIoTyfbhdUEVt2k4XhaWw-tqqHEdAkddwxUWYD13newrBhdMeXtNrwkU7cvMlXz9ybW5+G4CLqjECQsL7D9Epqwt1lCEd7GzRZcw2IUNv+RgZEiZwrDLVzhRg46fPUs6mAgIgsAAd3oKA7gEKqk2-XY4QBkwHGogIjEJiwjAyoGxx5LY7DMaijqOOtodKxg4cR5HUaEZpOHRkTksnVw+Q8UwjFcEHxxJxqq3sCiq1sDNFgcHqmOxZmkboFGeAEGpSk5qwHuEpKRnhGRFvCPYzDicdgcCDKXWcR0XWcgI1mCKwFb83JldZ6l6iJERkN4-iuf1siQhdXNnLaswbEc0mljy+1ceiRzEkh+mSr65moCgT37kD56FxFcwIlzIwtnLLKrca9ZeXiF1om2Rwi1dmGmfhzPs94B4OdzocN3hdN9gJnYQYWjLwQ2PkZBAku9ghRSbCbxmcBULAIFZ7vv0oqFTEXAr1hkDYrAyiJzGA8d7Htc+FKFBe+qUYh1FgLRVfYdfRNW8x8vy5xiYiQHtnnYGK5VjE1WOWEC4Qb7MTAGwMgYA6AaBILAagWA74kCIHAMAGgX4zUenNTG8lbaOWaosbMAp3AxyMJYcce8QIfSXJ5Omu5erMWQPfD4aDoFgCwLASA2DdamSHJtYIlhnCTyrGsYhFdbK43MOsbYDhFwgycMnRhcE3ZMARkQd4z9LrXU1pzHBes85bWzMsWIxM5HAQ8M4P6zlfjn2oaAkUSQvJ0BUBAOAegToMwQgmJ6Q4AC0Yt5gBMWsAlyBVKYLRLpA-ybA-F4NEvsSWAoYSTwPqYfe5DxbfwnpsbMHpAbA1pt5VOzClbwxVlABJGNRJ2XMCDLaEt+TEznI1WcywQJj0WMWHksT3atyzqrGp3MDZCgafJEwJdJmKUPo1IsIQ4izJcODKO-SmBLxXsjEZQc7T2CPnYPkXTJx5hcvseeKcmGK1yHfIgD8n7VJwv4jem1Jbb1MNsGSjg2nzGBpQ-K9p4jllcOk9ZjBOGwPgYg5BqD0E8I0Ds4xOxJbn02q4IeAp5LW2XHI3M8lCZLgCGC1hdz2HoLYNwyAiKe5BHHtRdYNgNzuBFO5bFktcV5k3IShhpSrnqMYJo7RjzZq1OSuix0RY0klxlrmWxkJrDnxoiXGJLigA */
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
        addElement: assign((context) => {
          const newElement = createElement({
            elementShape: context.elementShape,
            elementOptions: context.elementOptions,
            drawStartPoint: context.drawStartPoint,
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
