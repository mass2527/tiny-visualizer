import { actions, ActorRefFrom, assign, createMachine, spawn } from "xstate";
import { createElementMachine, VisualizerElement } from "./elementMachine";
import { v4 as uuidv4 } from "uuid";
import { MouseEventHandler } from "react";
import { calculateMousePoint, Point } from "../utils";

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
    };

export const canvasMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAJm0B2SgDYAnIcMAWQwGZto41YAcxgKwAaEAE9EARnOU9lg7eot5W5sbaztbaAL4x7mhYOAREZBTUdIwAwgASbAByAOIAolzFADLFALLF+Xy8eQAKxWKSSCByCsqq6loIxsYGzs76ZlbONtrebp4+elaUI8NWxuYOukGrcQkY2HiEJORUNPTM7IW8AkKt6p1KKmrtfXreDpS+zqvWwSu+7l4IBw2ShWbx6EKWUE-ZzbECJPYpQ7pCAAJ1QAHdyFAGBVqrU+JQAKqNJhsPgtCS3eT3HpPRAAWmM3ne83MznBojCVhC-x0DgM1mc3gs5j0DgsxgcsPhyQOaSoqIxWJxlRqdUoTFx5Ju7Tu3UeoD62nMCz0rP0ugmejMDl5CDBBhcoPM3n0A1FJulu1lqSOlEVmPQ2NxaoJxNJ5LK+SYOpk1P1vR0Jv85r0lqs1sMttmCBsb1BkV0ryshj0MPicO9+19yLRUCgypD+I151jHXjD0TCEMom0Rk5LtZ3Mcejt3lCzMlPfsoVEvb0XqS1aRCrrDaDKrx6tYbAutRjlN1HdphsQ9kMIKZhmmrwC1mMdqBfdB4O5WdWxbiFfQsggcHUMrLvKVJdJ2dIIPSoTGCyYTsnOXI8jm9Jpv4EzePYIQBA45i6IuCJyn6JxgCBNIGpoiBptBzhOMM4oeky3h2oY2gXmsKwOM4ogONx2FWHhPorv6aKBlAJEJuBQSUGyoKgmYZi2MMdqOMyXJmhOwpguWOxLoi8pCag9ZYmJYGngg8wXlmwQuC64rctmALBFMUkBPMnEOKILpbF+QA */
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
              actions: ["changeElementShape", "unselectElements", "draw"],
            },

            DRAG_START: {
              target: "dragging",
              actions: "assignDragStartPoint",
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
              actions: ["updateElement", "draw"],
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
              ],
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
        unselectElements: assign((context) => {
          context.elements.forEach((element) => {
            element.ref.send("UNSELECT");
          });

          return {
            elements: context.elements.map((element) => ({
              ...element,
              isSelected: false,
            })),
          };
        }),
        assignDragStartPoint: assign((_, { canvasElement, event }) => {
          const dragStartPoint = calculateMousePoint(canvasElement, event);

          return {
            dragStartPoint,
          };
        }),
      },
    }
  );
