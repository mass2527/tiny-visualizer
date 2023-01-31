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
    };

export const canvasMachine = createMachine(
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
            actions: ["updateElement", "generateDraw", "draw"],
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
    },
  }
);
