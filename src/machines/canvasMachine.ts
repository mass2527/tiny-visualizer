import { MouseEventHandler } from "react";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { assign, createMachine } from "xstate";
import {
  calculateAbsolutePoint,
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
};

export type CanvasMachineContext = {
  elementShape: VisualizerElement["shape"];
  elements: VisualizerElement[];
  drawingElementId: VisualizerElement["id"] | null;
  dragStartPoint: Point;
  copiedElements: VisualizerElement[];

  currentPoint: Point;
};

export type CanvasMachineEvents =
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
      type: "SELECTED_ELEMENTS.PASTE";
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "MOUSE_MOVE";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    };

export const canvasMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAFgDs2ygE4ArAGYAjAA5t5gEzmAbA9G3TAGhABPHYYMPtxpb+lqbGhoahAL6RHmhYOAREZBTUdIwAwgASbAByAOIAolwFADIFALIFOXy82QAKBWKSSCByCsqq6loIgYaUtoaWloa2lmGiQ9oe3gi2oqKUusbz5qIRug7G5ubRsRjYeIQk5FQ09MzsebwCQk3qbUoqai3degYmFtZ2js6u04i6CaUZbGWy6XSmMbaAamXYgOIHRLHFJnRg8UoFdJ8ApMYplSrVHiUJgY7F3FoPDrPUDdcwbSgOcyBZw2MYOJZTLyIVbmAyWUSmUyDfTGYwOWy2OEIhJHZKnNIMdFlLE4vEVKp8InpADydQAmuSZPJHp0XohTGDFqJRYZHEsXOL-gheZtKAKHOEBiFxREpfsZUkTqlzkrMdjcRiCZrKHU2PxGhJ7saqV1zaIHMDbMt045eaZdE66UFFnTfLowYNJn74odAykIAAnVAAd3IUAunENrWTT1TCAh5koITCxjeoXMTqFGcMTl5EKh+ds2mriNlQcbLbbHe4VSYXcpvbNCFt04Cgq2o4c+ad2l8Q9Chl0dOhgsGy5i8P9teRVA3rfQ7YkmU2K8BiWIAJLajk+49qaNKICeRhnuOl7XlyCD5oO0IzhEpiiE+gSSh+0rfnKlAblAUBbqwbB5DB7SHvB-YBMCo5Pto7J4eYgxOoyCyWFmxj6DC1oBCuAY-uRTaUdRlzFDke6JhSsHUpoCGOEhZgoRxaEzICtj9LoQSBNoARjJYOzEV+SJkX+uBgOgECQAw9EmqptKjBmwzplsFkBKCxhOqOfiBJYGxjGsviWXsNY2eu0n2Y5zmuSmR52MW3mbFYvKilmTr6AsrhWBx3GDKY2iWOJpFBrQsioBAW4pYxamzBZlCmOycxZgE2zhEF2iFYJBXZYYLhVXFKTSGADYKLAygAS5SlGgxcEtelXmjey4K2JsDpOm12bzBauUcaI74xaudbyuc5TagAquiXC3QAagmzTLW5fYWgsIwdRZwwbFe5juOhNh9PhHVXoykLaPm0QfugshOfALQkRNYBJit7mIAAtA4To48YRjhOE+YhCYV7WONa4omkmOfUe+YZiVojAzaLiQoF6FmJYiyCaFrPgpVVmxTTv5Nv+UD06lTEbLoRhCWd0LDPY+hBaC7WCRxJkTB61NXVJqAyQB0vNd0Gx8qKegCgNgIevlQr9J8oLlgJHVERdEm2RLiVORApurbSdjy+sZgCjtYW2kFcyUEyQzrJsFq8vrkkUb7kAB9jzrB0Y+ZhxaDiRxO6EEYsnyeaOoKbCnZG1fVbaZ320JBUyfOiqCM4cx7n6iwbU0zaQc0N8pWN9kyGuc+KO1CR6QROiY8t0txwlbLotrw5EQA */
  createMachine(
    {
      id: "canvas machine",
      tsTypes: {} as import("./canvasMachine.typegen").Typegen0,

      // Ensures that assign actions are called in order
      preserveActionOrder: true,

      predictableActionArguments: true,

      schema: {
        context: {} as CanvasMachineContext,
        events: {} as CanvasMachineEvents,
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
        currentPoint: {
          x: 0,
          y: 0,
        },
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
          },
        },

        drawing: {
          on: {
            DRAW: {
              target: "drawing",
              internal: true,
              actions: ["draw", "updateIntersecting", "drawElements"],
            },

            DRAW_END: {
              target: "draw ended",
              actions: [
                "draw",
                "updateIntersecting",
                "selectDrawingElement",
                "drawElements",
              ],
            },

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
      },

      initial: "loading",
    },
    {
      actions: {
        addElement: assign((context, { event, canvasElement }) => {
          const startPoint = calculateMousePoint(canvasElement, event);
          const newElement: VisualizerElement = {
            id: uuidv4(),
            shape: context.elementShape,
            x: startPoint.x,
            y: startPoint.y,
            width: 0,
            height: 0,
            isSelected: false,
            draw: null,
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
        assignDragStartPoint: assign((_, { canvasElement, event }) => {
          const dragStartPoint = calculateMousePoint(canvasElement, event);

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
          const currentPoint = calculateMousePoint(canvasElement, event);

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
          const currentPoint = calculateMousePoint(canvasElement, event);

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
        assignCurrentPoint: assign((_, { canvasElement, event }) => {
          const currentPoint = calculateMousePoint(canvasElement, event);

          return {
            currentPoint,
          };
        }),
      },
    }
  );
