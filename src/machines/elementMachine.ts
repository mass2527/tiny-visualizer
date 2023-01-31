import { MouseEventHandler } from "react";

import { assign, createMachine, sendParent } from "xstate";
import { calculateMousePoint } from "../utils";
import { CanvasMachineEvents } from "./canvasMachine";

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

type ElementMachineEvents =
  | {
      type: "UPDATE";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "DELETE";
    }
  | {
      type: "UPDATE_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    };

export const createElementMachine = (visualizerElement: VisualizerElement) =>
  /** @xstate-layout N4IgpgJg5mDOIC5RgDZgLZgHYBcAE6AhgMYAWAllmAHTkRoDEAqgAoAiAggCoCiA2gAYAuolAAHAPaxyOchKyiQAD0QBaAIwCAbNXUAmTQE4AzAHYArABoQAT0TqT1AevWm9xkwBZD5gBwDTAF9A61QMbHwiMkoaOkY2HgAZHl5BESQQSWlZeUUVBE89J3MA330rW0RjdU9qPXNTMtMtX28-AODQtExcAhIKKlp6MGZ2bh4AfR4AOTY0xSyZOQUM-JdDak9zQ1bTdWNPb2rTazsEU1rDdV89LXrzc09jeuCQkCwJCDhFMJ7I-piCykS1yqzU6keugMAhMFlO4KKflcBwEW1820MAmMnXA3QifWigziYCB2WWeUQDWoWmc5juFTODlMTi0Wk8LiebX8QTev3xUQGNC+aBwkFJIJWoHyJV0NIh9PhBVu1BMxm2vi8Pm5r0CQA */
  createMachine(
    {
      id: "element machine",
      tsTypes: {} as import("./elementMachine.typegen").Typegen0,
      // Ensures that assign actions are called in order
      preserveActionOrder: true,
      predictableActionArguments: true,
      schema: {
        context: {} as VisualizerElement,
        events: {} as ElementMachineEvents,
      },
      context: visualizerElement,
      states: {
        idle: {
          on: {
            UPDATE: {
              target: "idle",
              internal: true,
              actions: [
                "update",
                sendParent((context) => ({
                  type: "ELEMENT.UPDATE",
                  updatedElement: context,
                })),
              ],
            },

            DELETE: {
              target: "deleted",
            },

            UPDATE_END: {
              target: "idle",
              internal: true,
              actions: [
                "update",
                sendParent((context) => ({
                  type: "ELEMENT.UPDATE_END",
                  updatedElement: context,
                })),
              ],
            },
          },
        },

        deleted: {
          entry: sendParent<
            VisualizerElement,
            ElementMachineEvents,
            CanvasMachineEvents
          >((context) => ({
            type: "ELEMENT.DELETE",
            id: context.id,
          })),
        },
      },

      initial: "idle",
    },
    {
      actions: {
        update: assign((context, { event, canvasElement }) => {
          const currentPoint = calculateMousePoint(canvasElement, event);
          const width = currentPoint.x - context.x;
          const height = currentPoint.y - context.y;

          return {
            ...context,
            width,
            height,
          };
        }),
      },
    }
  );
