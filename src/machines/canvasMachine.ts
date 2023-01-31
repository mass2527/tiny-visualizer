import { actions, ActorRefFrom, assign, createMachine, spawn } from "xstate";
import { createElementMachine, VisualizerElement } from "./elementMachine";
import { v4 as uuidv4 } from "uuid";
import { MouseEventHandler } from "react";
import { calculateMousePoint } from "../utils";

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
    };

export const canvasMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAZgCMAFkoAmAKyjzAdl0ntoiwA4L+gDQgAnonu7K+gJz--I3t7bV8LEwBfCNc0LBwCIjIKajpGAGEACTYAOQBxAFEufIAZfIBZfOy+XiyABXyxSSQQOQVlVXUtBAA2CwtKXQtu3SN9USNw7pDXDwQ9bsoTcN1dXxXwid8omIxsPEIScioIACdUAHdyKAYS8sq+SgBVWqY2PgaJdValFTVmrv0RhmiCMI0Wdnsonm3VEa3s2xAsT2CUOyVOFyuN1KFSqlCYt3ejS+8h+HX+IP02kofW0lJs2kcvm6JmBcyClD0oxCw1E3V8gP0CKR8QOSWOZ0u6GutxxD2er3eRWyTCJzW+7T+oC6oypNLp2gZFiZLPciEG-V8NnWQXsvgmRqi0RA6FkEDg6mF+0SR2JbV+nUQAFpuqzg5RzOZVisTPaTDYhbsRd7kjR6L7SZrNIh9A5KN1umMjP59PYjHyDayjHYOaXIdoy0ycwyE3EvajxRipemNQGEF4fFbdF5NsE46ztL1KPZero+SWHCYQo6IkA */
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
        },
        events: {} as CanvasMachineEvents,
      },

      context: {
        elementShape: "selection",
        elements: [],
        drawingElementId: null,
      },

      states: {
        idle: {
          on: {
            DRAW_START: {
              target: "drawing",
              actions: "addElement",
            },

            CHANGE_ELEMENT_SHAPE: {
              target: "idle",
              internal: true,
              actions: "changeElementShape",
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
              actions: ["updateElement", "generateDraw", "draw"],
            },

            "ELEMENT.DELETE": {
              target: "idle",
              actions: ["stopElement", "deleteElement", "draw"],
            },

            "ELEMENT.UPDATE_END": {
              target: "idle",
              actions: [
                "updateElement",
                "generateDraw",
                "draw",
                assign({
                  elementShape: "selection",
                }),
              ],
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
      },
    }
  );
