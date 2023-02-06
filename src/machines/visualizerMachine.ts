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
  isIntersecting,
  Point,
} from "../utils";

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
};

export type VisualizerMachineContext = {
  elementShape: VisualizerElement["shape"];
  elements: VisualizerElement[];
  drawingElementId: VisualizerElement["id"] | null;
  dragStartPoint: Point;
  copiedElements: VisualizerElement[];

  currentPoint: Point;
  isElementShapeFixed: boolean;
  elementOptions: Options;
  zoom: number;
};

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
      id: VisualizerElement["id"];
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
    };

// zoom in ratio
export const ZOOM = {
  DEFAULT: 1,
  MINIMUM: 0.1,
  MAXIMUM: 30,
} as const;

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogCsATgDsjEwEYALFZkBmAEw2HDswDYjAGhABPRCsrEwdGGwAOG1cZExszB3CzAF8k3zRMXAJicipaBmZWDgBhAAleADkAcQBRQWqAGWqAWWry0REygAVq2QUkEFV1LR09QwRTC2s7Rxc3Tx9-RCcZGUYzGxNzCJkzMydzFLT0bDxCUgoaeiYWNi4+SpFxSV69Qc1tXX6xictbe2dXO4vL4AggrEYnFZGOCPAkEjIjGZwlZDiB0icsudclcCrdhA1qkVRNVOHVGi02sJGJwCcSXv03sNPqBvuZftMAXNgYsEA4jFD7CEnOEjA4ZE4jAjUejMmccpd8jcOPjGkSSWTmq1RFSigB5ToATXpyjU7xGX2MbKm-1mQIWoLiNkY-KMrt2ko8Nn20uOsuyFzy10K7BVhOJpIJFO1jE6vDEPXkr1NTNGlsmfxmgPmIOMZlWJg8iRiTniEqcPoyp392MVwaauoAqvjBPWAGoJvomoYfVO8sxQmyi2wrRwrT058YIsJTCEmSFGZEVjFygM4pXsACSwg1UY6vG6ggAYhuABrq0S6yqVRrGgbJnsW8ZWjOcu0TjyxRjuDYi-ZmEzhLES5+liCpBniBJqhG5JajqDbSImDL3uaLJpuyNpZtyoL-qs4TCjEKxWB4EoODYwFVqBga4sUZRVLUkZaoI+qiBuurlMIt6Mg+qFPumHK2tmPKxAKiRRO4CS7K45GYvKVHrqUFQ1IIABauq6k0nHIcyBiIKJlgmDsGwuPE-YTgAtHyYSRLEpEyPYwRBNJK41kwEBEFgADu9BQHcAiad2KE6Qgc5QjsCISusXpGF6E6CkYjDhDINieoleaihETnVmBjBuZ53m+UIrScP5ZraWMQQyB40L-gWHh7JVJZWLFcyMB4Vh7DYMxuIlZGpGivoUbJOK5V5dA+TwAh1OUxVWJ2d4BWVgT2FV7WbB4dXLMRpk8hVfEIgByV4URmWUcN7mjeNtK1KGRKseUJUpo+FUrTV631VtTU7ZCTqQjEiR5jIyJGB4J1DfkuVQFA+UTZUD3cUFIROkiiN7JEsKbLFXqhHEhbBKRc5Sn1MqDau4PuZD0P3FNxWIV2pW9s91VrRtDXbaC4K2JYf5eHyTjfkYoOk6550kGAdAQJA7Bw4F5WxE4rX-TEVhlpC4SxVYziMI4BkAeJsIQoLLk5eTovi5L0uLWCdXhK1ETxAWa1zmYsWuvL4R4bElVhSsvVHJWMlC4wOAqFgED5RbvbClCDh1cElUVXZrrvisrWxAuCThIWDhWOEhvZUoxDqLAWhjVLtPzfTT1ywruxKyrOcTsi06bO7npIn85ZEwNAdG2AbBkGLGgkLA1BYAXJBEHAYAaGXc1cTLgTW7biQOA7DslurMRhMOhaAZKiQpH1dAqBL8D9MTPdgUmC29mZHjmcr8sHWnlV2Aug553JhTX5XPFek-bg2qkRzqYfYycqqxEHIidGkR+SfzOnlMaP9Ho8RMIiaE1hYS-ldAuJwsUJQCk9DEaKdl1iingWTLAFMkFIRvo+NBToCL2R6u7AsLt+QJQ9tFAsBFdgUOFp5U2EsIDIPhuVJEoR4iHR1kRLYm8LCigMhKaBg4vT8ONlQoRkBRELzBBEJ0ijV6QicClJK7CoTu2FEAiEkIkTqODqHbyOjLYxR5MDUIwRkpJWFKjBw6iC5ECLiXKAzjI5BAsLsGOC5+R7BMfaRABYta42InOYidls7qL7mAAedAh4jzHmACeU8NChKeq4eWLhlE+zzMKeJYJAZOmsKvHh5gDKekPkkIAA */
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
        elementShape: "selection",
        elements: [],
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
        elementOptions: {
          stroke: "#000",
          fill: "transparent",
          strokeWidth: 2,
        },
        zoom: ZOOM.DEFAULT,
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
              target: "persisting",
              actions: ["deleteSelectedElements", "drawElements"],
            },

            "SELECTED_ELEMENTS.COPY": {
              target: "persisting",
              actions: "copySelectedElements",
            },

            "SELECTED_ELEMENTS.PASTE": {
              target: "persisting",
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
              target: "persisting",
              actions: "assignElementOptions",
            },

            CHANGE_ZOOM: {
              target: "persisting",
              actions: ["assignZoom", "drawElements"],
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
                target: "draw ended",

                actions: [
                  "draw",
                  "updateIntersecting",
                  "selectDrawingElement",
                  "drawElements",
                ],

                cond: "isElementShapeFixed",
              },
              "element shape reset",
            ],

            DELETE_SELECTION: {
              target: "draw ended",
              actions: ["deleteElement", "drawElements"],
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
              target: "drag ended",
              actions: ["drag", "drawElements"],
            },
          },
        },

        "draw ended": {
          entry: assign({
            drawingElementId: null,
          }),

          always: "persisting",
        },

        "drag ended": {
          always: "persisting",
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
          entry: "resetElementShape",

          always: "draw ended",
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
          };

          return {
            elements: [...context.elements, newElement],
            drawingElementId: newElement.id,
          };
        }),
        deleteElement: assign((context, { id }) => {
          return {
            elements: context.elements.filter((element) => element.id !== id),
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
        persist: (context) => {
          try {
            localStorage.setItem("context", JSON.stringify(context));
          } catch (error) {
            console.error(error);
          }
        },
        deleteSelectedElements: assign((context, event) => {
          return {
            elements: context.elements.filter((element) => !element.isSelected),
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
        resetElementShape: assign(() => {
          return {
            elementShape: "selection",
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
        assignZoom: assign((context, event) => {
          return {
            zoom: event.setZoom(context.zoom),
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
