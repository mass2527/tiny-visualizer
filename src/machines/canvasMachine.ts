import { MouseEventHandler } from "react";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { actions, ActorRefFrom, assign, createMachine, spawn } from "xstate";
import { calculateMousePoint, isIntersecting, Point } from "../utils";
import { createElementMachine, VisualizerElement } from "./elementMachine";

type VisualizerElementWithRef = VisualizerElement & {
  ref: ActorRefFrom<ReturnType<typeof createElementMachine>>;
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
    }
  | {
      type: "ELEMENT.UPDATE";
      updatedElement: VisualizerElement;
    }
  | {
      type: "ELEMENT.UPDATE_END";
      updatedElement: VisualizerElement;
    }
  | {
      type: "ELEMENT.DELETE";
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
      type: "ELEMENT.DRAG";
      updatedElement: VisualizerElement;
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "ELEMENT.DRAG_END";
      updatedElement: VisualizerElement;
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "ELEMENT.SELECT";
      updatedElement: VisualizerElement;
    }
  | {
      type: "ELEMENT.UNSELECT";
      updatedElement: VisualizerElement;
    };

export const canvasMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAJgAsATkoBmXQHZdANgCMRgKwAOM0au6ANCACeiALQXjt-StTAIC9Uzt9AF9I9zQsHAIiMgpqOkYAYQAJNgA5AHEAUS4CgBkCgFkCnL5ebIAFArFJJBA5BWVVdS0EfW1DUQH9I1EDI31Le3cvBCs9SlN7R1tdK3tRQPsh6NiMbDxCEnIqGnpmdjzeASEm9TalFTUW7tNVyhcAy2dRMZcpxHsjNpjEFRC4LM4rN9bNsQHE9olDikToxShUqnxKDxUekRBJbvJ7p0nogVro3gD9L0wc5tLYLH8EOZTG8xuNxi9rNoYXCEgdklQIAAnVAAd3IUAYqMq1UoAFU6kw2HxGniWncOo9QN1vNojEZKBYFjYBpt9KZRKYGX0-OttNpHKI7ZtwaZubteUkjpQhaLxZKytKMUxUcqbmqCRquohWZR7brKaY+qYXpbPIggvrbLTbGNdPYnVZxm74vtPSkfWL0BKpei5QqlUUqkwwzIIw8owgabGjPnLBZbLYXOsGXqrJRSaILPYpxZtMFdMX4XyvRW-TWZViyjiW6020Stem6W8gifZroTLp7QzDUDzZsrNYXIsxouPYiBcLK9WA7XZTlNwU26qq27TtsSCDeLM+oWJYvQDJYpgwfotjXtY44Xs+ugrCY9ivqW77esKUBQGuP4yqwbB5Du6pgQeCAWI6BrfCs4Tnt89iptMVg2GO+jTuszjDI6roxLC7r4fyhGoMRpFouR5zFDkzbAbuoH7poiBDH4PzWIOHGfPoDIAkCzjmsMU7jKsRh4QiknIv6ckYn+AFAc0IGEpqGkIOezK2KIzprLO6wBAyyz2JQiyUtoDH2Fm07RKJ6CyBAcDqDyElHPiamedq9pjoa9jGv5CYWgy3hDBFAQPjBwSOgCIk7CWtlesiWUeR2iaGA4yEODVBjcde0XjhSsX+YsjjWaJ6XNeWn7im1kbgYV445jxFjrUFA4jstJhGMmPEPkE0JTeJM0ftJJFVgttFeeEfhTpCyErNOwyTGmMyOmOZhOH5awrEWCVAA */
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
          elements: VisualizerElementWithRef[];
          drawingElementId: VisualizerElement["id"] | null;
          dragStartPoint: Point;
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
              actions: ["unselectElements", "addElement", "draw"],
            },

            CHANGE_ELEMENT_SHAPE: {
              target: "idle",
              internal: true,
              actions: ["unselectElements", "changeElementShape", "draw"],
            },

            DRAG_START: {
              target: "dragging",
              actions: "assignDragStartPoint",
            },

            "ELEMENT.SELECT": {
              target: "idle",
              internal: true,
              actions: ["updateElement", "draw"],
            },

            "ELEMENT.UNSELECT": {
              target: "idle",
              internal: true,
              actions: ["updateElement", "draw"],
            },
          },

          entry: assign({
            drawingElementId: null,
          }),
        },

        drawing: {
          on: {
            "ELEMENT.UPDATE": {
              target: "drawing",
              internal: true,
              actions: ["updateElement", "draw", "updateIntersecting"],
            },

            "ELEMENT.DELETE": {
              target: "idle",
              actions: ["stopElement", "deleteElement", "draw"],
            },

            "ELEMENT.UPDATE_END": {
              target: "idle",
              actions: [
                "updateElement",
                "draw",
                assign({
                  elementShape: "selection",
                }),
                "updateIntersecting",
              ],
            },

            "ELEMENT.SELECT": {
              target: "drawing",
              internal: true,
              actions: ["updateElement", "draw"],
            },

            "ELEMENT.UNSELECT": {
              target: "drawing",
              internal: true,
              actions: ["updateElement", "draw"],
            },
          },
        },

        dragging: {
          on: {
            "ELEMENT.DRAG": {
              target: "dragging",
              internal: true,
              actions: ["updateElement", "draw", "assignDragStartPoint"],
            },

            "ELEMENT.DRAG_END": {
              target: "idle",
              actions: ["updateElement", "draw"],
            },
          },
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
            elements: [
              ...context.elements,
              {
                ...newElement,
                ref: spawn(createElementMachine(newElement), newElement.id),
              },
            ],
            drawingElementId: newElement.id,
          };
        }),
        updateElement: assign((context, { updatedElement }) => {
          return {
            elements: context.elements.map((element) => {
              if (element.id === updatedElement.id) {
                return {
                  ...element,
                  ...updatedElement,
                };
              }
              return element;
            }),
          };
        }),
        stopElement: actions.pure((context, { id }) => {
          return context.elements
            .filter((element) => element.id === id)
            .map((element) => actions.stop(element.id));
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
          context.elements.forEach((element) => {
            element.ref.send({
              type: "UNSELECT",
            });
          });
          return {
            elements: context.elements.map((element) => ({
              ...element,
              isSelected: false,
            })),
          };
        }),
        updateIntersecting: ({ elements, drawingElementId }) => {
          const drawingElement = elements.find(
            (element) => element.id === drawingElementId
          );
          invariant(drawingElement);

          if (drawingElement.shape === "selection") {
            elements
              .filter((element) => element.shape !== "selection")
              .forEach((element) => {
                if (isIntersecting(drawingElement, element)) {
                  element.ref.send("SELECT");
                } else {
                  element.ref.send("UNSELECT");
                }
              });
          }
        },
      },
    }
  );
