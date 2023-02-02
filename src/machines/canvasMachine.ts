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
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAJgAsATkoBmXQHZdANgCMRgKwAOM0au6ANCACeiALQXjt-StTAIC9Uzt9AF9I9zQsHAIiMgpqOkYAYQAJNgA5AHEAUS4CgBkCgFkCnL5ebIAFArFJJBA5BWVVdS0EfW1DUQH9I1EDI31Le3cvBCs9SlN7R1tdK3tRQPsh6NiMbDxCEnIqGnpmdjzeASEm9TalFTUW7tNVyhcAy2dRMZcpxHsjNpjEFRC4LM4rN9bNsQHE9olDikIAAnVAAd3IUDOnBuLTuHUeoG63gWlAG2gspn0Fm02iM9j02j+CG0LkovRMdJp2gWomCMLhCQOySoKPRmOx3CqTFxMnk906Tx0dnZogsolstheVlsRgsNOZzlM7KMwW+uhWqw1At2QqSR0oYox6CxTFKBT4RR47vSfAAkgB5HKy1rygldHQWygWXSDBxUtWibS2ZlUoG6MYmFw-Cz2Kw2+L7e1I1FQKAS1hsPIh-EPCMIXSOebmXS6iGOExuTz-amUFb2bWx2YxowF+HCh1issV87FHIyiS3MN1pU9WaUNY8mx2Ey2DXM-SHt62Cz6danykDUcxWG2ouI0WotG4MDoCCQBg15eKomIZa2dkAiCKx1W0BkrCsZkaWNfQAX0UxrF0WkjTHO0H0dUsXzfD8v3aFdfwQexbCBBY7GsaxFkbSZuwQU8jDeMiFhAkFemiG90Fkd94BaQV7xFJc8J-TQfGHMkk0palkIZJDmW8IYNyA3Nc1sECtVMVC+IdE4wAEhVCWEhBTD6SgHH0TV7BjcxAkgmiaT8RsxiI0RFko68dkLBERQw8UXV08NVzzPtdRsED9RpDUUxo+krGMDNTBeCFrH5G9eM8ydS3LXy8W-fTnj1aM83WZZVnBZzmUhVk+3McI9zWFZxg0tKS3RLD3wgPz8IMukYvVPMwvpSwgi7aYAlESgwOpKlwTTWDGonZqoFayAOqE7oINBEzxkzXrNn0KCTHZdUNWpDNFnBNjIiAA */
  createMachine(
    {
      id: "canvas machine",
      tsTypes: {} as import("./canvasMachine.typegen").Typegen0,

      // Ensures that assign actions are called in order
      preserveActionOrder: true,

      predictableActionArguments: true,

      schema: {
        context: {} as {
          elementShape: VisualizerElement["shape"];
          elements: VisualizerElement[];
          drawingElementId: VisualizerElement["id"] | null;
          dragStartPoint: Point | null;
        },
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
              target: "idle",
              internal: true,
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

          always: "idle",
        },

        "drag ended": {
          always: "idle",
          entry: assign({
            dragStartPoint: null,
          }),
        },
      },

      initial: "idle",
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
      },
    }
  );
