import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { assign, createMachine } from "xstate";
import {
  calculateCenterPoint,
  calculateElementsAbsolutePoint,
  calculateCanvasPoint,
  calculateNormalizedValue,
  calculateNormalizedZoom,
  isIntersecting,
  createElement,
  isGenericElement,
  isLinearElement,
  calculateFreeDrawElementAbsolutePoint,
  isTextElement,
  isFreeDrawElement,
  calculateClientPoint,
  measureText,
  calculateChangeInPointOnZoom,
} from "../../utils";
import debounce from "lodash.debounce";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../../constants";
import {
  VisualizerElement,
  VisualizerMachineContext,
  VisualizerMachineEvents,
  VisualizerTextElement,
} from "./types";
import { PERSISTED_CONTEXT } from "./constant";

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogDsMo4wCcARgAsM60fNGArADYnlgMwAaEAE9EAEwBboyWlkYeph7W5gAcDtYAvok+aJi4BMTkVLQMzKwcAMIAErwAcgDiAKKCVQAyVQCyVWWiIqUAClWyCkggqupaOnqGCCZmVrb2jq7u3n6BMjKMRjGOAbHmLjLm1k7JqejYeISkFDT0TCxsXHwVIuKSPXoDmtq6faPjFjZ2Ds5uTw+fwISyxcGMGROawucweYIBMLmA4gNLHTJnHKXfI3YT1KqFURVTi1BrNVrCRicfFE559V5DD6gL6mH5Tf6zIELUFOJzLSzmdzbWLWDxGcWxFFojKnbIXPLXDh4hqE4mkpotUSUwoAeQ6AE06co1G9hp9jKzJn8ZoD5iDYQFGE4PFYoryAuZzAEpUcZVlzrkrgV2MqCUSSfjyVrGB1eGJuvIXibGSMLRNftMAXNgYhPAFlgFrEFLE4jIjYh5Nj70id-ViFcHGjqAKp4wRNgBqCd6xsG71TCDFlkYew8nlMoqcFZc1hzCERW1CMUrsXLO2d1fRsoD2MV7AAksJ1VH2rwuoIAGL7gAaatEOoqFQaRv6yf75rGlozHNtc-h1lCVwAg8XktliFxYksTc-UxeUg1xfFVQjMlNW1ZtpETek3zNZk0zZa0sy5EFLBkDwPBWItEV5eIXHCIxoNrWDAxxIpSkqGpI01QQ9VEfcdTKYQXwZd9cM-dN2RtbNuUsGcXEYGcKycREZE8QUGIxOVmL3EpymqQQAC0dR1RohOwpkDDwq1M05O1ECLZZtjhB0tncLZ1O3et4NY3SakM4zBH4fdRGKQQOn3MoSlMvscIssT8Os39uXcMwZBcAJXChaFPAg9y6zglj2FjMootNczRnS1YnVXewRWsWJnWdOdC0q51K1FVYIiMKCUlRX1GM03dg2KQ9724fVBGbDpOF4WlMN7UqB2+Kyfyk4jRwo-MRRMfMrHonrpX6ncGxufhuCCmoxAkDCe1faKyss79JKIxYwUYSIaoFOqyO9fa+o0o6mAgIgsAAd3oKBbgEEqUw-EjaPk-5xXCGFESasFzHk2wINI7Hdg8XKmOxIHQfByGhBaThoZE2Lx1iSFTHMGQNiWewAiMJqNmHHZKy6+q7GsbrDhrf7PMYYmwboCHqQaIkREQ3j+KpmLRlXBzC0cExIM9WE0YFlYSLiEwrBsAmBryYmoCgUmeF4Colfu0FtgA97ViUwsZMcOdwkZt7VgrYIbDZ9LTYBsXgct627lqMpKbm26FthiszHquFwI10wwS9zYnDev5SK6scwh+oWtzy5icBULAIFJ+2B05t6XC6qxm7q2duSCKw3qU6F4jhPZkV+4WPPypRiHUWAtEl9ha4-II9hWPkcZcCCglMOdIJHT1BTAysyLFEPRfF8GSBUUgQaIN5JZIMA6AgSBp7j4TldzJPGBTytYXFDPYg5wVGA9WEaV0puCrIPUuhM8jIDHu8EgRAwBsCwLAe+M9RJzxzs4JYHhl4r3zOzaSjdhyWELFrWw+YwiSjATBM2TBz6Xwhqdc60dY43Sfg7Wm9MHBM1iCzMseCQT5jHCsSCGxwSMy9M4A+I9EGTwhhAHQVw6DIBUAAayYAdEWUiJ7gwQPQJRlAsCMh6CgmmkQ6ZLE4czP4bMvZjnIipaiHoiG40kcxJQ0jSbECIKfRgSgcAGIAGanzIIwdRw9XHuMljoxRKh9GGPkMY0Y7DzGM0sazPhuZgg53cK4LqTsdipRcdiTxp8SAVwjlPBJuYUZvw2PmUsTNHBei9nRCwXp8yOTqtCfGlDDqi0oCoJQvhSZyIVNE1RIS-phOxP0wZ2jdExIMe8Ixj8zIDiSQzLhPDrHcmXssIwmwdjgXVg4AeJcqGhxmUMqexSiA+L8RoQJRBgmhLLtMgZVyoBRL0YsnQyyWGrNhqYjhKTuFWPSZ+OmGxjaYOdDICshS8iUAwBoGR7ARkKKUeMl5ECmBIpRXM6JsSlnxJWXdNZQLkmbLBXOQUclSKui2nYPkLgEW4uRaim5dyAlBImUPV5iL2UEu+XEuQlTQQUo2ak3hXs7AYxiMWaI2xnSOFZQVTiFJGChkJIIXgdQ6hipsPYCwZEZymE2LvH+7c8ZvScTEcCqsXDdJ6nQFQd94B9GxdQpMZKPwAFoXBzn9fTJYApU7OhkkEVVipvUJ1EpRY1WC4UbAguBcIv8zDbAqrsZwXVCyqqPpLGNMNRIG2Tkseq7IZxEKamOMx9glipWCBWMi+bw5W0LVhH1JbTVvyFCBL0M5nDmC9lYOm+ynEOFEaKVVFcq7gyLdTUYRYObL17elXa28RQsp6Ro1x0CtEdvmsW2KwFuFv0TbCJmtgbC2QQI6gC1g6oCnvYWIUraSZXxKbQmR19b6QAXc-Hkjc2QlnCOWV9HNH0rC2I4cChzHXdLOb0-KUCiDqB0LA+BYBEH-s7bGmmnphxsxAnYNwht0pe1kvJYhaUpjOj2kh3d2Jv3zrw8exJYQzAB1XEpZe6UpxNUyv-UsroyyszqqqtxB6oAAbYXYAsft4ThArGEW9RDHD-0ogKSIXUSyqpuaUlQ5SZNscXbmJwnoRy0TsIWd2OnmmigsEWMEFn6rxCSDuqZiL3msaPWZ0EONIQmBArRdWKS5zLwxsqsIsrIg2H2J5-lbL8WHvjux3MgXTCkVcEQtYTMZUkQ2mQkC9U4bJGSEAA */
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
        services: {} as {
          readClipboardText: {
            data: { clipText: string; canvasElement: HTMLCanvasElement };
          };
          copySelectedElements: {
            data: void;
          };
        },
      },

      context: {
        ...PERSISTED_CONTEXT,

        historyStep: 0,
        history: [
          {
            elements: PERSISTED_CONTEXT["elements"],
            elementOptions: PERSISTED_CONTEXT["elementOptions"],
          },
        ],
      },

      states: {
        idle: {
          on: {
            DRAW_START: {
              target: "drawing",
              actions: [
                "unselectElements",
                "assignDrawStartPoint",
                "addElement",
              ],
            },

            CHANGE_ELEMENT_SHAPE: {
              target: "persisting",

              actions: ["unselectElements", "changeElementShape"],
            },

            DRAG_START: {
              target: "dragging",
              actions: "assignPreviousPoint",
            },

            "SELECTED_ELEMENTS.DELETE": {
              target: "version released",
              actions: ["deleteSelectedElements"],
            },

            "SELECTED_ELEMENTS.COPY": "copying",
            "SELECTED_ELEMENTS.PASTE": "pasting",

            MOUSE_MOVE: {
              target: "idle",
              internal: true,
              actions: "assignCurrentPoint",
            },

            IS_ELEMENT_SHAPE_FIXED_TOGGLE: {
              target: "persisting",
              actions: "toggleIsElementShapeFixed",
            },

            "SELECTED_ELEMENTS.CUT": "cutting",

            CHANGE_ELEMENT_OPTIONS: {
              target: "version released",
              actions: "assignElementOptions",
            },

            CHANGE_ZOOM: {
              target: "persisting",
              actions: ["assignZoom"],
            },

            CHANGE_ZOOM_WITH_PINCH: {
              target: "persisting",
              actions: ["assignZoomToCurrentPoint"],
            },

            PAN: {
              target: "persisting",
              actions: ["pan"],
            },

            HISTORY_UPDATE: {
              target: "persisting",
              actions: ["updateHistory"],
            },

            WRITE_START: {
              target: "writing",
              actions: ["assignDrawStartPoint", "addElement"],
            },

            "ELEMENTS.SELECT_ALL": {
              target: "persisting",
              actions: "selectAllElements",
            },
          },
        },

        drawing: {
          on: {
            DRAW: {
              target: "drawing",
              internal: true,
              actions: ["draw", "updateIntersecting"],
            },

            DRAW_END: {
              target: "drawing or writing ended",

              actions: ["draw", "updateIntersecting"],
            },

            DELETE_SELECTION: {
              target: "idle",
              actions: ["deleteSelection", "resetDrawingElementId"],
            },
          },
        },

        dragging: {
          on: {
            DRAG: {
              target: "dragging",
              internal: true,
              actions: ["drag", "assignPreviousPoint"],
            },

            DRAG_END: {
              target: "version released",
              actions: ["drag"],
            },
          },
        },

        loading: {
          always: "idle",
          entry: "loadSavedContext",
        },

        persisting: {
          entry: "persist",
          always: "idle",
        },

        "drawing or writing ended": {
          always: "version released",
          entry: [
            "selectDrawingElement",
            "resetDrawingElementId",
            "updateElementShape",
          ],
        },

        "version released": {
          entry: ["addVersionToHistory"],

          always: "persisting",
        },

        writing: {
          on: {
            WRITE_END: {
              target: "drawing or writing ended",
              actions: ["endWrite"],
            },
          },
        },

        pasting: {
          invoke: {
            src: "readClipboardText",
            onDone: {
              target: "version released",
              actions: "pasteSelectedElements",
            },
            onError: "error logging",
          },
        },

        "error logging": {
          always: "idle",
          entry: "logError",
        },

        copying: {
          invoke: {
            src: "copySelectedElements",
            onDone: "persisting",
            onError: "error logging",
          },
        },

        cutting: {
          invoke: {
            src: "copySelectedElements",

            onDone: {
              target: "persisting",
              actions: "deleteSelectedElements",
            },

            onError: "error logging",
          },
        },
      },

      initial: "loading",
    },
    {
      actions: {
        addElement: assign((context, { devicePixelRatio }) => {
          const element = createElement({
            elements: context.elements,
            elementShape: context.elementShape,
            elementOptions: context.elementOptions,
            drawStartPoint: context.drawStartPoint,
            devicePixelRatio,
          });

          return {
            elements: [...context.elements, element],
            drawingElementId: element.id,
          };
        }),
        deleteSelection: assign((context) => {
          return {
            elements: context.elements.filter(
              (element) => element.shape !== "selection"
            ),
          };
        }),
        changeElementShape: assign((_, { elementShape }) => {
          return {
            elementShape,
          };
        }),
        assignDrawStartPoint: assign((context, { devicePixelRatio, event }) => {
          const drawStartPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            drawStartPoint,
          };
        }),
        assignPreviousPoint: assign((context, { devicePixelRatio, event }) => {
          const previousPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            previousPoint,
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
        draw: assign((context, { devicePixelRatio, event }) => {
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            elements: context.elements.map((element): VisualizerElement => {
              if (element.id === context.drawingElementId) {
                const changeInX = currentPoint.x - context.drawStartPoint.x;
                const changeInY = currentPoint.y - context.drawStartPoint.y;

                if (isGenericElement(element)) {
                  return {
                    ...element,
                    x: Math.min(currentPoint.x, context.drawStartPoint.x),
                    y: Math.min(currentPoint.y, context.drawStartPoint.y),
                    width: Math.abs(changeInX),
                    height: Math.abs(changeInY),
                  };
                }

                if (isLinearElement(element)) {
                  return {
                    ...element,
                    width: Math.abs(changeInX),
                    height: Math.abs(changeInY),
                    changesInPoint: [
                      [0, 0],
                      [changeInX, changeInY],
                    ],
                  };
                }

                if (isFreeDrawElement(element)) {
                  const absolutePoint =
                    calculateFreeDrawElementAbsolutePoint(element);
                  return {
                    ...element,
                    width: absolutePoint.maxX - absolutePoint.minX,
                    height: absolutePoint.maxY - absolutePoint.minY,
                    changesInPoint: [
                      ...element.changesInPoint,
                      [changeInX, changeInY],
                    ],
                  };
                }

                return element;
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
        drag: assign((context, { devicePixelRatio, event }) => {
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            elements: context.elements.map((element) => {
              if (element.isSelected) {
                return {
                  ...element,
                  x: element.x + (currentPoint.x - context.previousPoint.x),
                  y: element.y + (currentPoint.y - context.previousPoint.y),
                };
              }
              return element;
            }),
          };
        }),
        persist: debounce((context: VisualizerMachineContext) => {
          const { history, historyStep, ...persistedContext } = context;

          try {
            localStorage.setItem("context", JSON.stringify(persistedContext));
          } catch (error) {
            console.error(error);
          }
        }, 300),
        deleteSelectedElements: assign((context) => {
          return {
            elements: context.elements.map((element) => {
              if (element.isSelected) {
                return {
                  ...element,
                  isDeleted: true,
                  isSelected: false,
                };
              }

              return element;
            }),
          };
        }),
        pasteSelectedElements: assign((context, { data }) => {
          try {
            const { elements } = JSON.parse(data.clipText) as {
              elements: VisualizerElement[];
            };
            const absolutePoint = calculateElementsAbsolutePoint(elements);
            const centerPoint = calculateCenterPoint(absolutePoint);
            const copiedElements = elements.map((copiedElement) => {
              const centerX = copiedElement.x + copiedElement.width / 2;
              const centerY = copiedElement.y + copiedElement.height / 2;

              return {
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
          } catch (error) {
            console.error(error);

            const { fontFamily, fontSize } = context.elementOptions;
            const text = data.clipText;

            const { width, height } = measureText({
              fontFamily,
              fontSize,
              lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
              text,
              canvasElement: data.canvasElement,
            });

            const textElement: VisualizerTextElement = {
              id: uuidv4(),
              shape: "text",
              text,
              x: context.currentPoint.x,
              y: context.currentPoint.y,
              fontFamily,
              fontSize,
              isSelected: true,
              isDeleted: false,
              options: context.elementOptions,
              width,
              height,
            };

            return {
              elements: [...context.elements, textElement],
            };
          }
        }),
        assignCurrentPoint: assign((context, { devicePixelRatio, event }) => {
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            currentPoint,
          };
        }),
        toggleIsElementShapeFixed: assign((context) => {
          return {
            isElementShapeFixed: !context.isElementShapeFixed,
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
        assignZoom: assign((context, { setZoom, canvasElement }) => {
          const updatedZoom = calculateNormalizedZoom(setZoom(context.zoom));
          const targetPoint = {
            x: canvasElement.width / 2,
            y: canvasElement.height / 2,
          };
          const changeInPoint = calculateChangeInPointOnZoom({
            targetPoint,
            previousZoom: context.zoom,
            updatedZoom,
          });

          return {
            zoom: updatedZoom,
            origin: {
              x: context.origin.x - changeInPoint.changeInX,
              y: context.origin.y - changeInPoint.changeInY,
            },
          };
        }),
        assignZoomToCurrentPoint: assign((context, { setZoom }) => {
          const updatedZoom = calculateNormalizedZoom(setZoom(context.zoom));
          const changeInPoint = calculateChangeInPointOnZoom({
            targetPoint: context.currentPoint,
            previousZoom: context.zoom,
            updatedZoom,
          });

          return {
            zoom: updatedZoom,
            origin: {
              x: context.origin.x - changeInPoint.changeInX,
              y: context.origin.y - changeInPoint.changeInY,
            },
          };
        }),
        pan: assign((context, { event, devicePixelRatio }) => {
          const clientPoint = calculateClientPoint({
            canvasPoint: context.currentPoint,
            origin: context.origin,
            zoom: context.zoom,
            devicePixelRatio,
          });
          const updatedOrigin = {
            x: context.origin.x - event.deltaX,
            y: context.origin.y - event.deltaY,
          };
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event: {
              clientX: clientPoint.x,
              clientY: clientPoint.y,
            },
            origin: updatedOrigin,
            zoom: context.zoom,
          });

          return {
            origin: updatedOrigin,
            currentPoint,
          };
        }),
        addVersionToHistory: assign((context) => {
          const version = {
            elementOptions: context.elementOptions,
            elements: context.elements,
          };

          const isPresent = context.historyStep === context.history.length - 1;
          if (isPresent) {
            return {
              history: [...context.history, version],
              historyStep: context.historyStep + 1,
            };
          }

          return {
            history: [
              ...context.history.slice(0, context.historyStep + 1),
              version,
            ],
            historyStep: context.historyStep + 1,
          };
        }),
        updateHistory: assign((context, { changedStep }) => {
          const updatedHistoryStep = calculateNormalizedValue({
            max: context.history.length - 1,
            value: context.historyStep + changedStep,
            min: 0,
          });
          const version = context.history[updatedHistoryStep];
          invariant(version);

          return {
            elements: version.elements,
            elementOptions: version.elementOptions,
            historyStep: updatedHistoryStep,
          };
        }),
        resetDrawingElementId: assign((_) => ({
          drawingElementId: null,
        })),
        endWrite: assign((context, { text, canvasElement }) => {
          return {
            elements: context.elements.map((element) => {
              if (
                element.id === context.drawingElementId &&
                isTextElement(element)
              ) {
                const { width, height } = measureText({
                  fontFamily: element.fontFamily,
                  fontSize: element.fontSize,
                  lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
                  text,
                  canvasElement,
                });

                return {
                  ...element,
                  text,
                  width,
                  height,
                };
              }
              return element;
            }),
          };
        }),
        updateElementShape: assign((context) => {
          return {
            elementShape: context.isElementShapeFixed
              ? context.elementShape
              : "selection",
          };
        }),
        selectAllElements: assign((context) => {
          return {
            elements: context.elements.map((element) => ({
              ...element,
              isSelected: true,
            })),
          };
        }),
        logError: (_, event) => {
          console.error(event.data);
        },
      },
      services: {
        readClipboardText: async (_, { canvasElement }) => {
          const clipText = await navigator.clipboard.readText();

          return {
            clipText,
            canvasElement,
          };
        },
        copySelectedElements: async (context) => {
          const selectedElements = context.elements.filter(
            (element) => element.isSelected
          );
          const newClipText = {
            type: "visualizer/clipboard",
            elements: selectedElements,
            files: {},
          };
          navigator.clipboard.writeText(JSON.stringify(newClipText));
        },
      },
    }
  );
