import { MouseEventHandler } from "react";

import { assign, createMachine, sendParent } from "xstate";
import { calculateMousePoint, generateDraw, Point } from "../utils";
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
    }
  | {
      type: "UNSELECT";
    }
  | {
      type: "DRAG";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
      dragStartPoint: Point;
    }
  | {
      type: "DRAG_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
      dragStartPoint: Point;
    };

export const createElementMachine = (visualizerElement: VisualizerElement) =>
  /** @xstate-layout N4IgpgJg5mDOIC5RgDZgLZgHYBcAE6AhgMYAWAllmAHTkRoDEAqgAoAiAggCoCiA2gAYAuolAAHAPaxyOchKyiQAD0QBGAOwBmagIAcAFgCcu3ar2HDANnUAaEAE9EAJnX6dm6-oGb9L9ZYBfALtUDGx8IjJKGjpGNh4AGR5eQREkEElpWXlFFQRVQ3VqSwFDTXUAVjtHBH0Ky2onVV1KoJC0TFwCEgoqWnowZnZuHgB9HgA5NlTFTJk5BXS8gFoNVWoLXUt9SwrdCt8BS0tqtXUBagrKr01VS10nXQ9A4PAO8O6ovtjBpgmAZUSPAAwlwZuk5tlFqAVponBsDqoKgJ9HCHuoDFUHIh-NRVEinE0nHoKppDBVVG03mEupFejEBgw2AAlDgAcXB4ik8xyS0QyychUuBiexy8AglBlOCAqsuoOxcBm8VkeTipoU6ER60X6cVZbPGU05GW5UNyiF8xUsZQexNURi8hml5waljJdQK1kK5SCrywEggcEUGo+dOis1NC3NCGWPgqwv0ou2Esl+mlq3WmgM6kqukld2t6vetO13wGEayUb5CAxOgO90q0rqDXUzVarxDJa+NEDaBwkArPOhykQtyKTVK5SxNVR2iaLQqvoCQA */
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
      context: {
        ...visualizerElement,
      },
      states: {
        idle: {
          on: {
            UPDATE: {
              target: "idle",
              internal: true,
              actions: [
                "update",
                "updateDraw",
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
                "updateDraw",
                "select",
                sendParent((context) => ({
                  type: "ELEMENT.UPDATE_END",
                  updatedElement: context,
                })),
              ],
            },

            UNSELECT: {
              target: "idle",
              internal: true,
              actions: "unselect",
            },

            DRAG: {
              target: "idle",
              internal: true,
              actions: [
                "drag",
                "updateDraw",
                sendParent((context, { canvasElement, event }) => {
                  return {
                    type: "ELEMENT.DRAG",
                    updatedElement: context,
                    canvasElement,
                    event,
                  };
                }),
              ],
            },

            DRAG_END: {
              target: "idle",
              internal: true,
              actions: [
                "drag",
                "updateDraw",
                sendParent((context, { canvasElement, event }) => ({
                  type: "ELEMENT.DRAG_END",
                  updatedElement: context,
                  canvasElement,
                  event,
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
        select: assign({
          isSelected: true,
        }),
        unselect: assign({
          isSelected: false,
        }),
        drag: assign((context, { canvasElement, event, dragStartPoint }) => {
          const currentPoint = calculateMousePoint(canvasElement, event);

          return {
            x: context.x + (currentPoint.x - dragStartPoint.x),
            y: context.y + (currentPoint.y - dragStartPoint.y),
          };
        }),
        updateDraw: assign((context, { canvasElement }) => {
          return {
            draw: generateDraw(context, canvasElement),
          };
        }),
      },
    }
  );
