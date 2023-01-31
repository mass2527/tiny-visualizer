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
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAJm0B2SgDYAnIcMAWQwGZto41YAcxgKwAaEAE9EARnOU9lg7eot5W5sbaztbaAL4x7mhYOAREZBTUdIwAwgASbAByAOIAolzFADLFALLF+Xy8eQAKxWKSSCByCsqq6loIhtpW-pbG5qGi2uHehu5e-caUzjYRDmMOA+aiDnEJGNh4hCTkVBAATqgA7uRQDBXVtXyUAKqNTGx8LRLqnUoqau19AC0xm8lG8ejCzj0olEYSsIVmOgcBmszmm5nMenW4W28RAiX2KSO6TOl2ut0qNTqlCYdw+rW+8l+PQBOnMQz0EPM+l0Sz0ZgciIQ4IMLisvm8+mMowCVh2+L2yUOaRO5yu6Budypjxebw+ZXyTAZ7R+3X+oD6kw5XJ5kSs-MMgs8iBsDko4sium8Dishj0zjiePQsggcHUBKVqWOjK6f16iEBoQW4Mh0Nh7IRzoQgL02n8S28EQiUTszlxuySByj6Ro9BjzPNmkQzl0Rm0Dic9gc7bRQu000o9nbGd8S27hnlEarxNVZI19bN8YQQUo5gL4rMZlszjcWccoLhnNC3mm4IDgaAA */
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
              actions: ["unselectElements", "addElement", "draw"],
            },

            CHANGE_ELEMENT_SHAPE: {
              target: "idle",
              internal: true,
              actions: ["changeElementShape", "unselectElements", "draw"],
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
      },
    }
  );
