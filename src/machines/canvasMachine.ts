import { MouseEventHandler } from "react";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { assign, createMachine } from "xstate";
import {
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
  dragStartPoint: Point | null;
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
      type: "DELETE_SELECTED_ELEMENTS";
    };

export const canvasMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAFgDs2ygE4ArAGYAjAA5t5gEzmAbA9G3TAGhABPHYYMPtxpb+lqbGhoahAL6RHmhYOAREZBTUdIwAwgASbAByAOIAolwFADIFALIFOXy82QAKBWKSSCByCsqq6loIgYaUtoaWloa2lmGiQ9oe3gi2oqKUusbz5qIRug7G5ubRsRjYeIQk5FQ09MzsebwCQk3qbUoqai3degYmFtZ2js6u04i6CaUZbGWy6XSmMbaAamXYgOIHRLHFJnRhMUoFPhFHgY9JYpjFMqVao8O4tB4dZ6gbqmNbAuy2aGrTbbYz-BCrcwGXQmUTGXRg0TaUz6OEIhJHZJUCAAJ1QAHdyFALpwyTJ5I9Oi8ARZKCEwsY3qFzOzTIYHEYnFyIVCRYyxfsJUkTpRZQqlSruFUmGrWhrKV1EIZHEYAqZjYaHCL2dpfHrQoZdOZ9K4zdYHfFDs6Um7FehleiyljeLi+ABJADyOV9FKegYQwYtvjMEe0Ud0pqTlGh5oitKTgVsGcRkpdbqgUA9rDYeRr-rr2oQ+mMwMNSbbENE5kG7Icqz1tmM-J7tMNxmHTuR0rlE6nl2KOR9Enu8611KDIeb4a2kejXgBLj9LoQSBNoARjJYOwxPCjpZlerpyvKuBgOgECQAwc7tAu74cqMFrDKILKQQEoJsv+PRgZQmxDBsYxrL4UF7JmSJSghqBQMhqHoZhmpUpoiB2EEeqGIRWzEUeh7svoCyuFYbbboMpjaJYF5waxtCyKgEAejxAaLqM5iUKYDgCi4Z7bOE7KGjJh7HlukEiUO0HimpLrSGAMoKLAyj5hhz7kq+fHdIJ+EiSZ4K2JsLgOOykHAvM8ymLZjLONo0TQegshofALQuSxJwvlhb78QgAC0MXkaVK7hOEBqiEpoIJqp+UomkhW8fWIoWvJW6hOMrhjFZkKLLZgSWFu4Iqc5sEtde7r5u1ek4RsuhGPyQrQsM9j6FZoJGbZbagRMDiGM1o45jek4LQFRVBQC-h6keej1dooiAidUlmv0nyggKliuA4TlMSO2ZzUhKFoRAi3YSV2xgkYIpmPVkWWDyJrkaCCzmGN6ybElXJnaDbEcRDkDQ8VwV2Kt6xI0lDio8GUnY4snx4WekXntNzHnVQGlaUq5N3Qg0JWczApHqC5ouElhPwe5nmkN5As3R1i7Y3tkLGIDHMbIMFUzCYq3JtuKZbGj6WREAA */
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
        drawingElementId: null,
        dragStartPoint: {
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

            DELETE_SELECTED_ELEMENTS: {
              target: "persisting",
              actions: ["deleteSelectedElements", "drawElements"],
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
          entry: assign({
            dragStartPoint: null,
          }),
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
              invariant(context.dragStartPoint);

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
      },
    }
  );
