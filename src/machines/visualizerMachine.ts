import { MouseEventHandler } from "react";
import { Options } from "roughjs/bin/core";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { assign, createMachine } from "xstate";
import {
  calculateCenterPoint,
  calculateElementsAbsolutePoint,
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
  options: Options;
};

export type VisualizerMachineContext = {
  elementShape: VisualizerElement["shape"];
  elements: VisualizerElement[];
  drawingElementId: VisualizerElement["id"] | null;
  dragStartPoint: Point;
  copiedElements: VisualizerElement[];

  currentPoint: Point;
  isElementShapeFixed: boolean;
  elementOptions: Options;
};

export type VisualizerMachineEvents =
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
      type: "SELECTED_ELEMENTS.DELETE";
    }
  | {
      type: "SELECTED_ELEMENTS.COPY";
    }
  | {
      type: "SELECTED_ELEMENTS.CUT";
    }
  | {
      type: "SELECTED_ELEMENTS.PASTE";
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "MOUSE_MOVE";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "IS_ELEMENT_SHAPE_FIXED_TOGGLE";
    }
  | {
      type: "CHANGE_ELEMENT_OPTIONS";
      elementOptions: VisualizerMachineContext["elementOptions"];
    };

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGMCGA7Abq2ACAtqsgBYCW6YAdKRADZgDEAIgEoCCA6gPoDKAKmxZ8A2gAYAuolAAHAPaxSAF1Kz0UkAA9EAVgAcAdkoBOAIwAWUboBM+gMzaTJ3bYA0IAJ6IjZgGyUf+k76VpYm+qI+tgC+UW5oWDgERGQU1HSMAMIAEmwAcgDiAKJchQAyhQCyhbl8vDkACoVikkggcgrKqupaCHqGphbWdg5Orh6IIaKU+tqioiY+2r4m2vq6MXEY2HiEJORUNPTM7Pm8AkLN6u1KKmqtPX3G5pY29o7Obp4IJjZmlLZmWz6Iy6H5WHzeMwbEDxbZJPapQ6MHhlQoZPiFJglcpVGo8ShMVEYy6ta6dO6gB4GJ6DV4jD7jBBvSgmUTeURWIxGEK6azRWIwraJXYpA7pBgo8rozHYyrVPj4jIAeXqAE0STJ5DcuvcdNSBi9hu8xl8zPo-g5tIsVlbTAtobDhcl9mkjpK0RisajcQrKPU2PwmhIrlryd09f1nkM3qNPjpwsYfAZdLMrL8IQ6hTtnYjxRUlQBVFFcfMANSDLU1HVu4aZgUoZm0thMAKttlsuiMizjTKM2mMczCQIsDh8K0zCWzCLFRwAkjxZT66mxGlwAGKzgAaMr4Svy+XKGraoZrut6+qjdONPYhfyBs3bfVWon5m0n8NFruRqOlXpx8sVAsRGDUkTx1SlEDWXRKCbCE7CBMJ5m0HsAFoFj8awfi7EF21EbRtAnOERRdCAACdUAAd3IKBjk4I8yVPCCEDtShRHCWxFl0PCVgZL5dDMaCuTTMw+zMMwrCtExCKdadKDIyjqNo7hqiYeiwIpTREBbPDjEBG0InNcwrB7Rwfhg0EFgBDjQU5aSp0-eSqPQGjWE4EpclUkxK2PatwM074whMGCx10RZ2xMUwlh7UKgp8JDOysayzShAVHXskjyKclyiWKd10VnJVcjU3yNJ6VkuxZYF9B8M1Vn0OxjMZLtDFsEExPwgSrFZdZUqzD8MtQKAoEU1z8mK7VSq8Kw-jWUxJkiQFwRMsI-B8GrLHagItrs-rUnkoaRpOdzVJAqsJtrcq-DCIxqtq+qGpM8FoMcYIrREjlHB24i9sy3AwHQCBIAYcawzPCL+IbIzREbRbtAk6KU0oNNFngq0xybL6cyofa-oBoGQcY-ynAkhsx2h+qJICUKTNsCJWPYptmx+GqfEx2TaFkVAIEUgm-J6KxQX+AIQgFlsYZMHsRKC1lwtMOw8LMe1evfb6qGkMBSIUWBlGc4HTp886wbayHxOhpZbAk+HGUF2ZBxmHxpoEq02c-MB6Hwf7FFwWBiFQdXcFIuAwEUPXvIYvmtICWx-Cdq1gnmB3ood-wkKMDs5rCfQXZdJEGGyPIikXeUuBVPgCtyHhecmhBOyMaY4rZFMDDmaaTOfYxQQtxDzFalKBXQWRAfgVo0t2sAQxK2sUJ8VCJLvLqLbi6xnAi7Pc3oCfDaY8SrGMR807wrsxyMSWbv+Rm2JCSJLTX7HMuozfQaY7xDAi8wx05dGwhMuY71HFseQGRSm+IiWM5LkQOs5R+hMeiQlYrXF82g04r30DTHSbEXxrD0HoTkr5BQqzAY5XGgMIDQIjt8aw-Zljk1elTGe1s4rTHBGOASN17zAPwaA2SON-okLIdXBYdgY4pjjiEBYjUvjaX7BgoETccFp1vpQDmXMH6gUnmecSksmwp3bBxGYbFAh4NHqrSg6tNakG1qos6T9-ILzrrbRwMYIgnyan8FsnZEHzHKksRRbswAe3QF7H2fswAByDoofhF0d5Ix3g4GwIIErRQ7CyBOcwLbQ15DEGIQA */
  createMachine(
    {
      id: "visualizer machine",
      tsTypes: {} as import("./visualizerMachine.typegen").Typegen0,

      // Ensures that assign actions are called in order
      preserveActionOrder: true,

      predictableActionArguments: true,

      schema: {
        context: {} as VisualizerMachineContext,
        events: {} as VisualizerMachineEvents,
      },

      context: {
        elementShape: "selection",
        elements: [],
        copiedElements: [],
        drawingElementId: null,
        dragStartPoint: {
          x: 0,
          y: 0,
        },
        currentPoint: {
          x: 0,
          y: 0,
        },
        isElementShapeFixed: false,
        elementOptions: {
          stroke: "#000",
          fill: "transparent",
          strokeWidth: 2,
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

            "SELECTED_ELEMENTS.DELETE": {
              target: "persisting",
              actions: ["deleteSelectedElements", "drawElements"],
            },

            "SELECTED_ELEMENTS.COPY": {
              target: "persisting",
              actions: "copySelectedElements",
            },

            "SELECTED_ELEMENTS.PASTE": {
              target: "persisting",
              actions: ["pasteSelectedElements", "drawElements"],
            },

            MOUSE_MOVE: {
              target: "idle",
              internal: true,
              actions: "assignCurrentPoint",
            },

            IS_ELEMENT_SHAPE_FIXED_TOGGLE: {
              target: "persisting",
              actions: "toggleIsElementShapeFixed",
            },

            "SELECTED_ELEMENTS.CUT": {
              target: "persisting",
              actions: [
                "copySelectedElements",
                "deleteSelectedElements",
                "drawElements",
              ],
            },

            CHANGE_ELEMENT_OPTIONS: {
              target: "persisting",
              actions: "assignElementOptions",
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

            DRAW_END: [
              {
                target: "draw ended",

                actions: [
                  "draw",
                  "updateIntersecting",
                  "selectDrawingElement",
                  "drawElements",
                ],

                cond: "isElementShapeFixed",
              },
              "element shape reset",
            ],

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

        "element shape reset": {
          entry: "resetElementShape",

          always: "draw ended",
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
            options: context.elementOptions,
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
        copySelectedElements: assign((context) => {
          return {
            copiedElements: context.elements.filter(
              (element) => element.isSelected
            ),
          };
        }),
        pasteSelectedElements: assign((context, { canvasElement }) => {
          const absolutePoint = calculateElementsAbsolutePoint(
            context.copiedElements
          );
          const centerPoint = calculateCenterPoint(absolutePoint);

          const copiedElements = context.copiedElements.map((copiedElement) => {
            const centerX = copiedElement.x + copiedElement.width / 2;
            const centerY = copiedElement.y + copiedElement.height / 2;

            const updatedElement = {
              ...copiedElement,
              id: uuidv4(),
              x:
                context.currentPoint.x -
                copiedElement.width / 2 +
                centerX -
                centerPoint.x,
              y:
                context.currentPoint.y -
                copiedElement.height / 2 +
                centerY -
                centerPoint.y,
            };

            return {
              ...updatedElement,
              draw: generateDraw(updatedElement, canvasElement),
            };
          });

          return {
            elements: [
              ...context.elements.map((element) => {
                return {
                  ...element,
                  isSelected: false,
                };
              }),
              ...copiedElements,
            ],
          };
        }),
        assignCurrentPoint: assign((_, { canvasElement, event }) => {
          const currentPoint = calculateMousePoint(canvasElement, event);

          return {
            currentPoint,
          };
        }),
        toggleIsElementShapeFixed: assign((context) => {
          return {
            isElementShapeFixed: !context.isElementShapeFixed,
          };
        }),
        resetElementShape: assign(() => {
          return {
            elementShape: "selection",
          };
        }),
        assignElementOptions: assign((context, event) => {
          return {
            elementOptions: {
              ...context.elementOptions,
              ...event.elementOptions,
            },
          };
        }),
      },
      guards: {
        isElementShapeFixed: (context) => {
          return context.isElementShapeFixed;
        },
      },
    }
  );
