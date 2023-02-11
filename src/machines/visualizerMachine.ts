import { MouseEventHandler } from "react";
import { Options } from "roughjs/bin/core";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { assign, createMachine } from "xstate";
import {
  calculateCenterPoint,
  calculateElementsAbsolutePoint,
  calculateMousePoint,
  generateDraw,
  getNormalizedValue,
  getNormalizedZoom,
  isIntersecting,
  Point,
} from "../utils";
import debounce from "lodash.debounce";

export type VisualizerElement = {
  id: string;
  shape: "selection" | "rectangle" | "ellipse" | "arrow" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  draw: VoidFunction | null;
  options: Options;
  isDeleted: boolean;
};

export type VisualizerMachineContext = {
  elements: VisualizerElement[];
  elementOptions: Options;

  elementShape: VisualizerElement["shape"];
  drawingElementId: VisualizerElement["id"] | null;
  dragStartPoint: Point;
  copiedElements: VisualizerElement[];
  currentPoint: Point;
  isElementShapeFixed: boolean;
  zoom: number;
  origin: {
    x: number;
    y: number;
  };

  history: {
    elements: VisualizerElement[];
    elementOptions: Options;
  }[];
  historyStep: number;
};

/* #region events within machine  */
export type VisualizerMachineEvents =
  | {
      type: "DRAW_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "DRAW";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "DRAW_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
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
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "DRAG";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "DRAG_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
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
      canvasElement: HTMLCanvasElement;
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
    }
  | {
      type: "HISTORY_UPDATE";
      changedStep: 1 | -1;
    };
/* #endregion */

// zoom in ratio
export const ZOOM = {
  DEFAULT: 1,
  MINIMUM: 0.1,
  MAXIMUM: 30,
} as const;

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogBsAdhOMAnAEYALDIBMFmQA5T9kxYA0IAJ6IrzgCsMoyuNs4m4VZGMjJGgQC+Cd5omLgExORUtAzMrBwAwgASvAByAOIAooKVADKVALKVpaIiJQAKlbIKSCCq6lo6eoYIpubWdo4ubh7efgj2sYyRFqs2NgDMgYFWMjb2SSno2HiEpBQ09EwsbFx85SLikt16-Zraur0jY5a2Dk6uEzuLy+fyBDYWRgbDYxGRWdwxGIWQ4gVInDLnbJXPK3YR1SoFUSVTg1epNFrCRicfFEl69N6DT6gb5mX6TAEzEHzLZWRi7Cww+zOewxXaRFFo9JnLKXXI3Dh4+qE4mkxrNUSUgoAeXaAE06co1O8hl9jKyJv9pkDZqCEDZIowdoEjO5IvENhEJccpZkLjlrvl2IqCUSSfjyRrGO1eGIuvJXkbGcNEECbIx3JN3Bs7DYLCY5ohAiZedYLIFwkFnIKjF60qdfVi5YGGlqAKp4wQtgBqcZ6hoGH2TCA2xcYNnBVknHnBTg2BYQVhMwrH1i2wqszviJlr6Olfux8vYAElhKqI21eJ1BAAxI8ADRVoi15XK9QNfUTg9No3NfymgOBecjAsNMR1zMtHFWWINh3H1MVlANcXxZUwzJdVNVbaR43pT8TWZM1xj-DlrS5FMnFCIV4RMbMNxA5xYPreD-RxQoSgqapw3VQQdVEI8tVKYR3wZL98J-Qj2StQDbRA3kAhMQJ7B2OwyxdBiMRlZjD2KMoqkEAAtLUtQaITcKZAwCLZS0AJteZdhHRgjDsQILCrRyLCFejklRb1GI0g9A209j9MMhpBH4I9RCKQR2iPUpihMgc8PMsTLP-Tl50nIxeT2MZgkCZwIhHNS90bRCOGjUoEuNMyWXEqz0tteFnDTccNjiAUCpFRTiobBCWPYIoTyfbhdUEVt2k4XhaWw-tqqHEdAkddwxUWYD13newrBhdMeXtNrwkU7cvMlXz91yCAiCwAB3egoDuAQqqTb9djhRgZBMBxqICIwfosIwMsiZwxx5LY7DMaijqOOt1LOpgLuu277qEZpOEekTksnVw+Q8UwjFcKwQOdDKq3sCiq1sDNFgcHqmOxeGbroO6eAEGpSlRqw+w-RKav8RZFvCPYzDicdnA3DKXSB51FOsZw1mCKwab887LoZpmaWqYNCT4yqZq5ubvw8EIXVzZy2rMGxHIBpY8vtD7okcxJjp8mHSsYeGoCgRHmfKNGkpGeFTFCFYjC2csssCDL1l5eIXWibZHCLRXYbdy6Pa9+5WdR3XhL9sF4XTfZvp2AmFoy8ENj5GQQJDvYIUUmwk9dnAVCwCBEd9nmFlFqFTEXAr1hkDYrGJ1lgPHex7QnhShUbvqlGIdRYC0Rn2A7odVvMfL8tlvGPvkiPbW78DVmAstc3WTyod3XrmLANgyDAOgNBIWBqCweeSCIOAwA0Vfs9Moci58oOXCPsQeuYNjuCtkYSw44B4gXsCOAqs9mLIAXh8T+d8wBYFgJAP+nMc6d02sESwzgq5VjWM1RSVtzDrG2A4RcBMnCOy8nQFQEA4B6BOi7BCCZuZDgALT-VtEIt6sRYgRHCOHWIyInbQxKn1eUfD9aiX2KTAUMIq5D1MIPKBjUCqQl2JsbMHp3qi0ht5eRN86Yq1usop6ok7LmAJltEm-I-pzkarOZYhNoSLGLDyFBNisBp0ZvY9G-shTOPkiYEOMTFLD0akWEIcQEkuGFNmGscjr601yM3VudicL8O-PsYmdg+SE0nHmFy+wG7ZLgkrJg88iCL2XlAcJucFibVJr3Uw2wZKOE8fMUWMD8r2niOWVwWigm5CwQ-J+L834fy-rgjQHTO4bnzhPTarhi4CnkuLZcdDczyR+kuAIMymBoJaRgr+bAcGQHWYAoIFdqLrBsBudwIp3KHNJscvMm5zmeSSEAA */
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
        dragStartPoint: {
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

        historyStep: 0,
        history: [
          {
            elements: [],
            elementOptions: {
              stroke: "#000",
              fill: "transparent",
              strokeWidth: 2,
            },
          },
        ],
      },

      states: {
        idle: {
          on: {
            DRAW_START: {
              target: "drawing",
              actions: ["unselectElements", "addElement", "drawElements"],
            },

            CHANGE_ELEMENT_SHAPE: {
              target: "persisting",

              actions: [
                "unselectElements",
                "changeElementShape",
                "drawElements",
              ],
            },

            DRAG_START: {
              target: "dragging",
              actions: "assignDragStartPoint",
            },

            "SELECTED_ELEMENTS.DELETE": {
              target: "version released",
              actions: ["deleteSelectedElements", "drawElements"],
            },

            "SELECTED_ELEMENTS.COPY": {
              target: "persisting",
              actions: "copySelectedElements",
            },

            "SELECTED_ELEMENTS.PASTE": {
              target: "version released",
              actions: ["pasteSelectedElements", "drawElements"],
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
              actions: [
                "copySelectedElements",
                "deleteSelectedElements",
                "drawElements",
              ],
            },

            CHANGE_ELEMENT_OPTIONS: {
              target: "version released",
              actions: "assignElementOptions",
            },

            CHANGE_ZOOM: {
              target: "persisting",
              actions: ["assignZoom", "drawElements"],
            },

            CHANGE_ZOOM_WITH_PINCH: {
              target: "persisting",
              actions: ["assignZoomToCurrentPoint", "drawElements"],
            },

            PAN: {
              target: "persisting",
              actions: ["assignOrigin", "drawElements"],
            },

            HISTORY_UPDATE: {
              target: "idle",
              internal: true,
              actions: ["updateHistory", "drawElements"],
            },
          },
        },

        drawing: {
          on: {
            DRAW: {
              target: "drawing",
              internal: true,
              actions: ["draw", "updateIntersecting", "drawElements"],
            },

            DRAW_END: [
              {
                target: "version released",

                actions: [
                  "draw",
                  "updateIntersecting",
                  "selectDrawingElement",
                  "drawElements",
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
                  "drawElements",
                  "resetDrawingElementId",
                ],
              },
            ],

            DELETE_SELECTION: {
              target: "idle",
              actions: [
                "deleteSelection",
                "drawElements",
                "resetDrawingElementId",
              ],
            },
          },
        },

        dragging: {
          on: {
            DRAG: {
              target: "dragging",
              internal: true,
              actions: ["drag", "drawElements"],
            },

            DRAG_END: {
              target: "version released",
              actions: ["drag", "drawElements"],
            },
          },
        },

        loading: {
          always: "idle",
          entry: "loadSavedContext",
          exit: "drawElements",
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
      },

      initial: "loading",
    },
    {
      actions: {
        addElement: assign((context, { event, canvasElement }) => {
          const startPoint = calculateMousePoint({
            canvasElement,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });
          const newElement: VisualizerElement = {
            id: uuidv4(),
            shape: context.elementShape,
            x: startPoint.x,
            y: startPoint.y,
            width: 0,
            height: 0,
            isSelected: false,
            draw: null,
            options: context.elementOptions,
            isDeleted: false,
          };

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
        assignDragStartPoint: assign((context, { canvasElement, event }) => {
          const dragStartPoint = calculateMousePoint({
            canvasElement,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            dragStartPoint,
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
        draw: assign((context, { canvasElement, event }) => {
          const currentPoint = calculateMousePoint({
            canvasElement,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            elements: context.elements.map((element) => {
              if (element.id === context.drawingElementId) {
                const width = currentPoint.x - element.x;
                const height = currentPoint.y - element.y;

                const updatedElement: VisualizerElement = {
                  ...element,
                  width,
                  height,
                };

                return {
                  ...updatedElement,
                  draw: generateDraw(updatedElement, canvasElement),
                };
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
        drag: assign((context, { canvasElement, event }) => {
          const currentPoint = calculateMousePoint({
            canvasElement,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            elements: context.elements.map((element) => {
              if (element.isSelected) {
                const updatedElement = {
                  ...element,
                  x: element.x + (currentPoint.x - context.dragStartPoint.x),
                  y: element.y + (currentPoint.y - context.dragStartPoint.y),
                };

                return {
                  ...updatedElement,
                  draw: generateDraw(updatedElement, canvasElement),
                };
              }
              return element;
            }),
            dragStartPoint: currentPoint,
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
        pasteSelectedElements: assign((context, { canvasElement }) => {
          const absolutePoint = calculateElementsAbsolutePoint(
            context.copiedElements
          );
          const centerPoint = calculateCenterPoint(absolutePoint);

          const copiedElements = context.copiedElements.map((copiedElement) => {
            const centerX = copiedElement.x + copiedElement.width / 2;
            const centerY = copiedElement.y + copiedElement.height / 2;

            const updatedElement = {
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

            return {
              ...updatedElement,
              draw: generateDraw(updatedElement, canvasElement),
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
        assignCurrentPoint: assign((context, { canvasElement, event }) => {
          const currentPoint = calculateMousePoint({
            canvasElement,
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
          const normalizedZoom = getNormalizedZoom(setZoom(context.zoom));
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
          const normalizedZoom = getNormalizedZoom(setZoom(context.zoom));

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
        assignOrigin: assign((context, { event }) => {
          return {
            origin: {
              x: context.origin.x - event.deltaX,
              y: context.origin.y - event.deltaY,
            },
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
          const updatedHistoryStep = getNormalizedValue({
            maximum: context.history.length - 1,
            value: context.historyStep + changedStep,
            minimum: 0,
          });
          const { elements, elementOptions } =
            context.history[updatedHistoryStep];

          return {
            elements,
            elementOptions,
            historyStep: updatedHistoryStep,
          };
        }),
        resetDrawingElementId: assign((_) => ({
          drawingElementId: null,
        })),
      },
      guards: {
        isElementShapeFixed: (context) => {
          return context.isElementShapeFixed;
        },
      },
    }
  );
