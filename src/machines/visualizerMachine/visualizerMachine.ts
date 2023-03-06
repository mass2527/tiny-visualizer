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
  setLastItem,
  calculatePointCloseness,
  getClosenessThreshold,
  removeLastItem,
  replaceNthItem,
  calculateFixedPoint,
  resizeGenericElementIntoDiagonalDirection,
  isDiagonalDirection,
  calculateOrthogonalDirection,
  resizeGenericElementIntoOrthogonalDirection,
  resizeTextElementIntoDiagonalDirection,
  resizeFreedrawElementIntoDiagonalDirection,
} from "../../utils";
import debounce from "lodash.debounce";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../../constants";
import {
  Point,
  VisualizerElement,
  VisualizerMachineContext,
  VisualizerMachineEvents,
  VisualizerTextElement,
} from "./types";
import { ELEMENT_STATUS, PERSISTED_CONTEXT } from "./constant";

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogDsMo4wCcARgAsM60fNGArADYnlgMwAaEAE9EAEwBboyWlkYeph7W5gAcDtYAvok+aJi4BMTkVLQMzKwcAMIAErwAcgDiAKKCVQAyVQCyVWWiIqUAClWyCkggqupaOnqGCCZmVrb2jq7u3n6BMjKMRjGOAbHmLjLm1k7JqejYeISkFDT0TCxsXHwVIuKSPXoDmtq6faPjFjZ2Ds5uTw+fwISyxcGMGROawucweYIBMLmA4gNLHTJnHKXfI3YT1KqFURVTi1BrNVrCRicfFE559V5DD6gL6mH5Tf6zIELUFOJzLSzmdzbWLWDxGcWxFFojKnbIXPLXDh4hqE4mkpotUSUwoAeQ6AE06co1G9hp9jKzJn8ZoD5iDYQFGE4PFYoryAuZzAEpUcZVlzrkrgV2MqCUSSfjyVrGB1eGJuvIXibGSMLRNftMAXNgYhPAFlgFrEFLE4jIjYh5Nj70id-ViFcHGjqAKp4wRNgBqCd6xsG71TCDFlkYew8nlMoqcFZc1hzCERW1CMUrsXLO2d1fRsoD2MV7AAksJ1VH2rwuoIAGL7gAaatEOoqFQaRv6yf75rGlozHNtc-h1lCVwAg8XktliFxYksTc-UxeUg1xfFVQjMlNW1ZtpETek3zNZk0zZa0sy5EFLBkDwPBWItEV5eIXHCIxoNrWDAxxIpSkqGpI01QQ9VEfcdTKYQXwZd9cM-dN2RtbNuUsGcXEYGcKycREZE8QUGIxOVmL3EpymqQQAC0dR1RohOwpkDDwq1M05O1ECLZZtjhB0tncLZ1O3et4NY3SakM4zBH4fdRGKQQOn3MoSlMvscIssT8Os39uXcMwZBcAJXChaFPAg9y6zglj2FjMootNczRnS1YnVXewRWsWJnWdOdC0q51K1FVYIiMKCUlRX1GM03dg2KQ9724fVBGbDpOF4WlMN7UqB2+Kyfyk4jRwo-MRRMfMrHonrpX6ncGxufhuCCmoxAkDCe1faKytzGREUhF13A2JZaKapZHUiUUNnBKFCw8XKmMGm5OIpRhQ0JQReDqOoSpTD8bHsCwyJnUxNkrSsmt2cix2CGJwNXVKgf2vqNKOrz2FO87ak4IKEZE2KK1iRh-1hQV-vcJw5zo8xQhccUthsQWINJw4awpzyCqJa82nB0RGG4KphH3fSLsea6kzugd8zx8DnBMEUAfSprwPIj0+WdOFIPBYGBuOjhqjKKozsKY9NSVlW1Y1q7GZi0ZwkYEV4WA7YoQrKw-wFJxGA9cEYURAIImA+3KYKupwqqCQPdaL3VfVh4-bm26Fo-Ww5LF2iVKcXZw9nbkw-5R7tg2BFETT6W9wvZXiT4IQFfzn2i6eEvhIDxA0oA1qsusUUwQiJqHDkkjBSCPYZJUzv8ogIgsAAd3oKBbgEf37tBcJhynPlgJkcENhcFwmoFfnnFSqcaq27fmN3g+j5PgeZROBnwHOOVmSwHCPViEsewycmobGHDsSsXV6p2GsN1CWW48o-z3ofOgx9qQNCJCIRCvF+IgI-MnVwI43BTm2HQywn074jnMCpOEHp0GkSSGTSWHkd64P-rqMoLtoaXVHjdce58SIuDxlsNKXVa7FiME1VwAE6rsPQZ6DwM59g8KwSDPIv8oBQH-jwXgFQKGiU3gBH6qwlKFhko4XmkC2arArMEGwyd0rf2xEYkx+CT73BaMAseZlQEVjMPVG2sJxSmDBLzTYsdbGkS6mOMI3o9EwQdkwHAKgsAQH-pY2KCC2aCwFOU3YIp4FWDZkpaE8Q4R7GRJkw60slDEHULALQASinlULLHN+pFH4QSCKYOckEWGelrmLCsZE9qYKyenX+eCoAkBUKQfeRA3j4JIGAOgEBIDsF6bmCJwda6VhieMeJjdLZxy2FsIIswqwtKlvlZAHT3gkCIGANgWBYCHOOfOfpKw+RDMfqufMyjpJlNCIWSCuxHoqTBD4vImztnHxpsQ4JgKwGQlMKwt6fw4GN1IsOIwkE-qbB2FQlFTA0XdIxWdWaEiwlI0cT8QW4pwiwjHE-aSZYzDBHhBBdYMjoS0sYEoP5DL2AQB0FcOgyAVAAGsmAHVecxKVXSj4IHoEqygWBGQ9BxZEcB+KoEwIFbzMc5Ea5Tg9JYYI0DmkLNaflLVMriBEHWZKnAhqABm6yyCMHVXwzV0qdV6pUAao18gTXMIgQS6BRKoXEWCLHbmZTti2FYS4CVXr1kkFycYwpoSdZI0TsHNuUJtqOC9LzOiFgvT5kcnVaE4teq8OwdiSgKglC+H-nKhUiqVVqvJmGntfaB34N1SOmN7xjVlrLlY01eLIGEtgamye2wVhUriFPOtLrO36OyYwXt-b-4FqIL6gNQaQ3ju7Xkc906oCzv1Yahdcal2IxXQm81G6rXciNnHTYYQlggVNR20Nj6mCUAwBoGVQ6FVKtVfertBjYPwYZW+6NH6dCLpZeW39Zr13Js3XOQUclSKui2nYPkeaXkTqfVhy9RBvXXqUH6jQgaiDBugxhs9LGZ1Rvnfhr9hHl2xVxYmi1KbeZ2H5jEYs0R6EunmcexZ0te10AYJQGVZj+A4p2A5Uw70YiCygWbJYToQJxHBEbdwErtO6ZlUIkRWssJEakzatm707CbHiI9Jqj9X72sgnYHYXUnM6Bc4I-i7mpCWAkz+7znhfOpX83EbaVmAKIl+A4WqXooMPoE989Q+B-7KwLhxIBOKSLDmiI4IwskNjNYbiCfGkTEQJE8OEXlEqysEH-rLeWKE85VZ9oC+qgq9jJ3-J4AEf4TDDjzJ1OInoMEabdcxQbFWAnO1dvud2g8Jvq0BfCPGX17BCgC1uwctFHQRG0SBey8Ij38dPbt-+mcXY5xO97M736mZfEXHMewopILJR5o3L0sdYQllcM2zeujXUauxF9gJPcqh9wELnRWp3uza0k4HFSjpynOF2mRFmf4gis0FtN0iEDVx7R6nQFQBz4B9A+5TInKXRgAFpIiAU5TIz06DHJzn51RpYj1xjQO2I6yUjGYMsV58DuyQRUbaLvg-cEtE7tBEcPJR6pZdiG0ddw1HTGmDLKPmrieoJIvByWPVdkM5HVNTHOA+wMu0pizIhKvxdvPPE9zOjM5MlbMEwp7zKwrNyWOsFnZ3GErcn5OD-NPnGv4GPzOelXago4gwgle0ognSGX2-PsBaBwdtewkerYGwtkEAyLUXVAUrf+kyUDwInZhb6VH12fsyAlfQGuHEiWcI5Z+nwLnise55LHLm2K+h097yy+fO+b8-5EBR9Iw23HCIfIYS13iKbaFMJ5JwqnnRsUEqB-4L31Y8IDkXRFkfuldBsQEmlhHCBZndUQqakyuAmHqGepcWejutgh+dU8I4QFYYQzejqRuhYxYcIcSJY+abGhaxa-iUAT+Umtcim1cRYpB44d2YQooFgRYYIp+U4qw0WF6j+IekBJE2ikIJgIED2awQW3IIWNmVgJEy4KkewTmQm+BLB6uju7BpmXBFunovBxEKkywqwoyng180i0WOmYAem4BkioCqUrMIocQECd86i0OIIBMckKCdUfwd8tEA2cAQ2zBmeUhBKwcN+EKRBKk0cycVaYIAo+YjiLOiQQAA */
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

            WRITE_EDIT: {
              target: "writing",
              actions: "editWrite",
              cond: "canEditText",
            },

            "TEXT_ELEMENT.RESIZE_START": {
              target: "resizing",
              actions: [
                "assignResizingStartPoint",
                "assignResizingElement",
                "assignResizeFixedPoint",
              ],
            },

            "GENERIC_ELEMENT.RESIZE_START": {
              target: "resizing",
              actions: [
                "assignResizingStartPoint",
                "assignResizingElement",
                "assignResizeFixedPoint",
              ],
            },

            "LINEAR_ELEMENT.RESIZE_START": {
              target: "resizing",
              actions: ["assignResizingStartPoint", "assignResizingElement"],
            },

            "FREEDRAW_ELEMENT.RESIZE_START": {
              target: "resizing",
              actions: [
                "assignResizingStartPoint",
                "assignResizingElement",
                "assignResizeFixedPoint",
              ],
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
              target: "persisting",
              actions: ["deleteSelection", "resetDrawingElementId"],
            },

            CONNECT_START: "connecting",
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
            WRITE_END: "drawing or writing ended",

            WRITE: {
              target: "writing",
              actions: ["write", "persist"],
              internal: true,
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

        connecting: {
          on: {
            DRAW: {
              target: "connecting",
              internal: true,
              actions: ["draw"],
            },

            CONNECT: [
              {
                target: "connecting",
                internal: true,
                actions: "connect",
                cond: "shouldConnect",
              },
              {
                target: "drawing or writing ended",
                actions: "endConnect",
              },
            ],
          },
        },

        resizing: {
          on: {
            RESIZE_END: "version released",

            "TEXT_ELEMENT.RESIZE": {
              target: "resizing",
              internal: true,
              actions: "resizeTextElement",
            },

            "GENERIC_ELEMENT.RESIZE": {
              target: "resizing",
              internal: true,
              actions: "resizeGenericElement",
            },

            "LINEAR_ELEMENT.RESIZE": {
              target: "resizing",
              internal: true,
              actions: "resizeLinearElement",
            },

            "FREEDRAW_ELEMENT.RESIZE": {
              target: "resizing",
              internal: true,
              actions: ["resizeFreedrawElement"],
            },
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
            elements: context.elements.map((element) => {
              if (element.status === "selected") {
                return {
                  ...element,
                  status: ELEMENT_STATUS["idle"],
                };
              }

              return element;
            }),
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
                  const points: Point[] =
                    element.points.length === 1
                      ? [
                          { x: 0, y: 0 },
                          { x: changeInX, y: changeInY },
                        ]
                      : setLastItem(element.points, {
                          x: changeInX,
                          y: changeInY,
                        });
                  return {
                    ...element,
                    width: Math.abs(changeInX),
                    height: Math.abs(changeInY),
                    points,
                  };
                }

                if (isFreeDrawElement(element)) {
                  const absolutePoint =
                    calculateFreeDrawElementAbsolutePoint(element);
                  return {
                    ...element,
                    width: absolutePoint.maxX - absolutePoint.minX,
                    height: absolutePoint.maxY - absolutePoint.minY,
                    points: [...element.points, { x: changeInX, y: changeInY }],
                  };
                }

                return element;
              }

              return element;
            }),
          };
        }),
        connect: assign((context, { event }) => {
          const currentPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });

          return {
            elements: context.elements.map((element): VisualizerElement => {
              if (element.id === context.drawingElementId) {
                invariant(isLinearElement(element));

                const changeInX = currentPoint.x - context.drawStartPoint.x;
                const changeInY = currentPoint.y - context.drawStartPoint.y;

                return {
                  ...element,
                  width: Math.abs(changeInX),
                  height: Math.abs(changeInY),
                  points: [...element.points, { x: changeInX, y: changeInY }],
                };
              }

              return element;
            }),
          };
        }),
        endConnect: assign((context) => {
          const drawingElement = context.elements.find(
            (element) => element.id === context.drawingElementId
          );
          invariant(drawingElement);
          invariant(isLinearElement(drawingElement));

          const threshold = getClosenessThreshold(context.zoom);
          const { areLastTwoPointsClose, isLastPointCloseToStartPoint } =
            calculatePointCloseness(drawingElement, threshold);

          return {
            elements: context.elements.map((element) => {
              if (element.id === context.drawingElementId) {
                invariant(isLinearElement(element));

                let points: Point[];
                if (isLastPointCloseToStartPoint) {
                  points = setLastItem(element.points, { x: 0, y: 0 });
                } else if (areLastTwoPointsClose) {
                  points = element.points.slice(0, element.points.length - 1);
                } else {
                  points = [...element.points];
                }

                return {
                  ...element,
                  points,
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

                if (
                  element.status === "idle" ||
                  element.status === "selected"
                ) {
                  return {
                    ...element,
                    status: isIntersecting(drawingElement, element)
                      ? ELEMENT_STATUS["selected"]
                      : ELEMENT_STATUS["idle"],
                  };
                }

                return element;
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
                  status: ELEMENT_STATUS["selected"],
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
              if (element.status === "selected") {
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
              if (element.status === "selected") {
                return {
                  ...element,
                  status: ELEMENT_STATUS["deleted"],
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
                  if (element.status === "selected") {
                    return {
                      ...element,
                      status: ELEMENT_STATUS["idle"],
                    };
                  }

                  return element;
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
              status: ELEMENT_STATUS["selected"],
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
        write: assign((context, { text, canvasElement }) => {
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
            elements: context.elements.map((element) => {
              if (element.status === "idle") {
                return {
                  ...element,
                  status: ELEMENT_STATUS["selected"],
                };
              }

              return element;
            }),
          };
        }),
        editWrite: assign((context, { canvasElement }) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );

          const element = selectedElements[0];
          invariant(element);

          if (element.shape !== "text") {
            return {};
          }

          const { lineHeight } = measureText({
            canvasElement,
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            text: element.text,
            lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
          });
          const drawingElementId = element.id;
          return {
            drawingElementId,
            drawStartPoint: {
              x: element.x,
              y: element.y + lineHeight / 2,
            },
          };
        }),
        assignResizingElement: assign((_, { resizingElement }) => {
          return {
            resizingElement,
          };
        }),
        assignResizeFixedPoint: assign((context) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          const selectedElement = selectedElements[0];
          invariant(selectedElement);

          invariant(!isLinearElement(selectedElement));

          invariant("direction" in context.resizingElement);

          const resizeFixedPoint = calculateFixedPoint(
            selectedElement,
            context.resizingElement.direction
          );

          return {
            resizeFixedPoint,
          };
        }),
        assignResizingStartPoint: assign(
          (context, { event, devicePixelRatio }) => {
            const resizeStartPoint = calculateCanvasPoint({
              devicePixelRatio,
              event,
              zoom: context.zoom,
              origin: context.origin,
            });

            return {
              resizeStartPoint,
            };
          }
        ),
        resizeGenericElement: assign((context, { devicePixelRatio, event }) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          const resizingElement = selectedElements[0];
          invariant(resizingElement);

          const currentCanvasPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });
          const dx = currentCanvasPoint.x - context.resizeStartPoint.x;
          const dy = currentCanvasPoint.y - context.resizeStartPoint.y;

          return {
            elements: context.elements.map((element) => {
              if (element.id !== resizingElement.id) {
                return element;
              }

              invariant(isGenericElement(element));
              invariant("direction" in context.resizingElement);

              if (element.width + dx === 0 || element.height + dy === 0) {
                return element;
              }

              if (isDiagonalDirection(context.resizingElement.direction)) {
                const resizedElement =
                  resizeGenericElementIntoDiagonalDirection({
                    element,
                    direction: context.resizingElement.direction,
                    currentCanvasPoint,
                    resizeFixedPoint: context.resizeFixedPoint,
                  });

                return resizedElement;
              }

              const direction = calculateOrthogonalDirection({
                direction: context.resizingElement.direction,
                currentCanvasPoint,
                resizeFixedPoint: context.resizeFixedPoint,
              });
              const resizedElement =
                resizeGenericElementIntoOrthogonalDirection({
                  element,
                  direction,
                  currentCanvasPoint,
                  resizeFixedPoint: context.resizeFixedPoint,
                });

              return resizedElement;
            }),
            resizeStartPoint: currentCanvasPoint,
          };
        }),
        resizeLinearElement: assign((context, { devicePixelRatio, event }) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          const resizingElement = selectedElements[0];
          invariant(resizingElement);

          const currentCanvasPoint = calculateCanvasPoint({
            devicePixelRatio,
            event,
            zoom: context.zoom,
            origin: context.origin,
          });
          const dx = currentCanvasPoint.x - context.resizeStartPoint.x;
          const dy = currentCanvasPoint.y - context.resizeStartPoint.y;

          return {
            elements: context.elements.map((element) => {
              if (element.id !== resizingElement.id) {
                return element;
              }

              invariant(isLinearElement(element));
              invariant("pointIndex" in context.resizingElement);

              const isUpdatingStartPoint =
                context.resizingElement.pointIndex === 0;

              const firstPoint = element.points[0];
              invariant(firstPoint);
              const lastPoint = element.points[element.points.length - 1];
              invariant(lastPoint);

              invariant("points" in resizingElement);

              const hasMoreThan2Points = resizingElement.points.length > 2;
              if (!hasMoreThan2Points) {
                if (isUpdatingStartPoint) {
                  const points: Point[] = element.points.map(
                    ({ x, y }, index) => {
                      if (index === 0) {
                        return { x, y };
                      }

                      return { x: x - dx, y: y - dy };
                    }
                  );
                  return {
                    ...element,
                    x: element.x + dx,
                    y: element.y + dy,
                    points,
                  };
                }

                const isUpdatingVirtualCenterPoint =
                  context.resizingElement.pointIndex === 1;
                if (isUpdatingVirtualCenterPoint) {
                  const virtualCenterPoint = {
                    x: firstPoint.x + lastPoint.x / 2,
                    y: firstPoint.y + lastPoint.y / 2,
                  };

                  const points: Point[] = [
                    firstPoint,
                    {
                      x: dx + virtualCenterPoint.x,
                      y: dy + virtualCenterPoint.y,
                    },
                    lastPoint,
                  ];

                  return {
                    ...element,
                    points,
                  };
                }

                // resizing end point (context.resizingElement.pointIndex = 2)
                const points: Point[] = [
                  ...removeLastItem(element.points),
                  { x: dx + lastPoint.x, y: dy + lastPoint.y },
                ];
                return {
                  ...element,
                  points,
                };
              }

              if (isUpdatingStartPoint) {
                const points: Point[] = element.points.map(
                  ({ x, y }, index) => {
                    if (index === 0) {
                      return { x, y };
                    }

                    return {
                      x: x - dx,
                      y: y - dy,
                    };
                  }
                );
                return {
                  ...element,
                  x: element.x + dx,
                  y: element.y + dy,
                  points,
                };
              }

              const updatingPoint =
                element.points[context.resizingElement.pointIndex];
              invariant(updatingPoint);

              const points: Point[] = replaceNthItem({
                array: element.points,
                index: context.resizingElement.pointIndex,
                item: { x: updatingPoint.x + dx, y: updatingPoint.y + dy },
              });

              return {
                ...element,
                points,
              };
            }),
            resizeStartPoint: currentCanvasPoint,
          };
        }),
        resizeTextElement: assign(
          (context, { event, devicePixelRatio, canvasElement }) => {
            const selectedElements = context.elements.filter(
              (element) => element.status === "selected"
            );
            const resizingElement = selectedElements[0];
            invariant(resizingElement);

            invariant("direction" in context.resizingElement);
            const { direction } = context.resizingElement;

            invariant(isDiagonalDirection(direction));

            const currentCanvasPoint = calculateCanvasPoint({
              devicePixelRatio,
              event,
              zoom: context.zoom,
              origin: context.origin,
            });

            return {
              elements: context.elements.map((element) => {
                if (element.id !== resizingElement.id) {
                  return element;
                }

                invariant(isTextElement(element));

                const resizedElement = resizeTextElementIntoDiagonalDirection({
                  canvasElement,
                  direction: direction,
                  element,
                  currentCanvasPoint,
                  resizeFixedPoint: context.resizeFixedPoint,
                });

                return resizedElement;
              }),
              resizeStartPoint: currentCanvasPoint,
            };
          }
        ),
        resizeFreedrawElement: assign(
          (context, { devicePixelRatio, event }) => {
            const selectedElements = context.elements.filter(
              (element) => element.status === "selected"
            );
            const resizingElement = selectedElements[0];
            invariant(resizingElement);

            const currentCanvasPoint = calculateCanvasPoint({
              devicePixelRatio,
              event,
              zoom: context.zoom,
              origin: context.origin,
            });

            if (
              currentCanvasPoint.x === context.resizeFixedPoint.x ||
              currentCanvasPoint.y === context.resizeFixedPoint.y
            ) {
              return {};
            }

            return {
              elements: context.elements.map((element) => {
                if (element.id !== resizingElement.id) {
                  return element;
                }

                invariant(isFreeDrawElement(element));

                invariant("direction" in context.resizingElement);

                if (isDiagonalDirection(context.resizingElement.direction)) {
                  const resizedElement =
                    resizeFreedrawElementIntoDiagonalDirection({
                      element,
                      previousCanvasPoint: context.resizeStartPoint,
                      currentCanvasPoint,
                      resizeFixedPoint: context.resizeFixedPoint,
                    });

                  return resizedElement;
                }

                return element;
              }),
              resizeStartPoint: currentCanvasPoint,
            };
          }
        ),
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
            (element) => element.status === "selected"
          );
          const newClipText = {
            type: "visualizer/clipboard",
            elements: selectedElements,
            files: {},
          };
          navigator.clipboard.writeText(JSON.stringify(newClipText));
        },
      },
      guards: {
        canEditText: (context) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          if (selectedElements.length !== 1) {
            return false;
          }

          const selectedElement = selectedElements[0];
          invariant(selectedElement);

          return selectedElement.shape === "text";
        },
        shouldConnect: (context) => {
          const drawingElement = context.elements.find(
            (element) => element.id === context.drawingElementId
          );
          invariant(drawingElement);
          invariant(isLinearElement(drawingElement));

          const threshold = getClosenessThreshold(context.zoom);
          const { areLastTwoPointsClose, isLastPointCloseToStartPoint } =
            calculatePointCloseness(drawingElement, threshold);

          if (isLastPointCloseToStartPoint || areLastTwoPointsClose) {
            return false;
          }

          return true;
        },
      },
    }
  );
