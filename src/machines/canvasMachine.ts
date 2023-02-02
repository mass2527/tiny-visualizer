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
    };

export const canvasMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAFgDs2ygE4ArAGYAjAA5t5gEzmAbA9G3TAGhABPHYYMPtxpb+lqbGhoahAL6RHmhYOAREZBTUdIwAwgASbAByAOIAolwFADIFALIFOXy82QAKBWKSSCByCsqq6loIgYaUtoaWloa2lmGiQ9oe3gi2oqKUusbz5qIRug7G5ubRsRjYeIQk5FQ09MzsebwCQk3qbUoqai3degYmFtZ2js6u04i6CaUZbGWy6XSmMbaAamXYgOIHRLHFIQABOqAA7uQoBdOHcWg8Os9QN0IeZKCEwsY3qFzP8EKZDA4jE5zHpIdTTLpbNo4QiEkdklQ0ZjsbjuFUmPiZPJHp0XohDI4jAFTLTqQ4ufTtL4KaFDLpzPpXIzrHz9gKkidKCKsegcUxSgU+EUeE70nwAJIAeRy0tasqJXUVyt8ZnV2k1unpXPJ0KZEVMokNgVs5vihytKPRUCgYtYbDy-sJT2DCH0xmB1MNkYhonMg3pDlWFNsxmMxoiompxnTiMF1pFufzl2KOSlEnugdLCoQSuZYbVWw1Wq8AJc-V0QUC2gCY0sOxi8ItmeRwvRGNwYHQEEgDGL0-lJMQdiCFMMok2VjZ7bb9OpfiBJYGxjGsviHnsGZIkKNo5leN53g+7Qzs+CCvsywyflsB4BKCxj0voCyuFYkYNoMpjaJYfaWmelC0LIqAQGKSFysSmiIKM5KmA43IuD22zhP+2hEW2HbCd+H5pke-KnjB0hgKiCiwMo9r3pOBKPmx3Toe+n7gtymwuA49IHsC8zzKYok8s4vJwugsi3vALQydBJxTshT7sQgAC0xlrj5lbhEFvhqsBOoGtRsnWmcYDuaxZZcsyqpGmqYL1ga-6Mv0omWN2kZhOYsLSSernZqK9pxUGs4bLoRgdqIu6jCMRpTP5v6UJZ7b5dYEwOIYkWleeqDDhVGkeVpAL+BSXWAhRyafoYBFZcRYxgqMrgOFJkH9lmQ2Xtet4QJVKFedsYJGFyZiiJZDjAUq-5zJQ5hAesmyWWyA0DmVUDwYdx2edpdi1esV03XddL+SmiyfKMmwBLYmyfbtdEMUxo0yuNZbQv+z2LKJoJMi4llI7R8mKaQynYv9E1oe1HKbQjHZ9UE9ImLVRoNsaWy6Eq0TREAA */
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
      },
    }
  );
