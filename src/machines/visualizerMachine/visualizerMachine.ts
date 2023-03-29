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
  calculateClosenessThreshold,
  calculateFixedPoint,
  isDiagonalDirection,
  resizeTextElement,
  resizePointBasedElement,
  resizeGenericElement,
  resizeLinearElementPoint,
  calculateElementSize,
  isPointBasedElement,
  calculateSelectedElementsAbsolutePoint,
  resizeMultipleElements,
  calculateDiagonalDirection,
  removeLastItem,
  createUuid,
  isSameGroup,
  calculateSameGroup,
} from "../../utils";
import debounce from "lodash.debounce";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../../constants";
import {
  Point,
  VisualizerElement,
  VisualizerLinearElement,
  VisualizerMachineContext,
  VisualizerMachineEvents,
  VisualizerTextElement,
} from "./types";
import { ELEMENT_STATUS, PERSISTED_CONTEXT } from "./constant";

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogDsMo4wCcARgAsM60fNGArADYnlgMwAaEAE9EAEwBboyWlkYeph7W5gAcDtYAvok+aJi4BMTkVLQMzKwcAMIAErwAcgDiAKKCVQAyVQCyVWWiIqUAClWyCkggqupaOnqGCCZmVrb2jq7u3n6BMjKMRjGOAbHmLjLm1k7JqejYeISkFDT0TCxsXHwVIuKSPXoDmtq6faPjFjZ2Ds5uTw+fwISyxcGMGROawucweYIBMLmA4gNLHTJnHKXfI3YT1KqFURVTi1BrNVrCRicfFE559V5DD6gL6mH5Tf6zIELUFOJzLSzmdzbWLWDxGcWxFFojKnbIXPLXDh4hqE4mkpotUSUwoAeQ6AE06co1G9hp9jKzJn8ZoD5iDYQFGE4PFYoryAuZzAEpUcZVlzrkrgV2MqCUSSfjyVrGB1eGJuvIXibGSMLRNftMAXNgYhPAFlgFrEFLE4jIjYh5Nj70id-ViFcHGjqAKp4wRNgBqCd6xsG71TCDFlkYew8nlMoqcFZc1hzCERW1CMUrsXLO2d1fRsoD2MV7AAksJ1VH2rwuoIAGL7gAaatEOoqFQaRv6yf75rGlozHNtc-h1lCVwAg8XktliFxYksTc-UxeUg1xfFVQjMlNW1ZtpETek3zNZk0zZa0sy5EFLBkDwPBWItEV5eIXHCIxoNrWDAxxIpSkqGpI01QQ9VEfcdTKYQXwZd9cM-dN2RtbNuUsGcXEYGcKycREZE8QUGIxOVmL3EpymqQQAC0dR1RohOwpkDDwq1M05O1ECLZZtjhB0tncLZ1O3et4NY3SakM4zBH4fdRGKQQOn3MoSlMvscIssT8Os39uXcMwZBcAJXChaFPAg9y6zglj2FjMootNczRnS1YnVXewRWsWJnWdOdC0q51K1FVYIiMKCUlRX1GM03dg2KQ9724fVBGbDpOF4WlMN7UqB2+Kyfyk4jRwo-MRRMfMrHonrpX6ncGxufhuCCmoxAkDCe1faKytzGREUhF13A2JZaKapZHUiUUNnBKFCw8XKmMGm5OIpRhQ0JQReDqOoSpTD8bHsCwyJnUxNkrSsmt2cix2CGJwNXVKgf2vqNKOrz2FO87ak4IKEZE2KK1iRh-1hQV-vcJw5zo8xQhccUthsQWINJw4awpzyCu4KphH3fSLsea6kzugcAFp81RzYbF5Jw4hAv9EQAsIliMSCJXS-Yycljz8r3DodXC0RGEm6aiQeK7GZi0ZKzk6xfs2wW-ZcP8A8dJY7CWOr2pcYGBuOpVEPDY9UMYCpuBbDpvfuhAp0dMFwjSj183sIwmrLb6wRkC3gJI+J48pgqoZT8Ho2bSpM8mnOBzS-mwkLHYbAFUjbPnWiUvCIsvTsFm9olrc8uYiAiCwAB3egoFuAQe6R8JhynPlgJr1dwND7kF355xUqnGqtsb6WV-Xzft6EFpOF30Tx1Zs3zEe2Jo5lnLhfDYw4diVi6vVOw1huoLxggnJgT8N50C3tSBoHsW58WKnNW6C0PwBABCONwU5tgkMsJ9GuI4-4CnhLsEi0QH75SQS-XUZQyhhk9k8HBwkfYPRcHjLYaUur62LMAkE6UZwjkxoWAUTk9iMOXqvKAUAX48F4BUT+sUZJ2DZn8PYQQYGwjEbmBwywxR1XhLRIsZZrZwMOo-JRKiUHb3uO-TRowwRikYPVOE4FHDjDBLzTYThdH2FIl1McA8FHYhwCoLAEAX7uMCJBNmgsBTpN2CKJqHphwgXSnVBw0R9bRLyEoYg6hYBaGcUk+chYQnX1Ii4Jpq58zGIQCktYgowJYzIvPXqtsl7YmYSgkgKhSBryIG8EZYA6AQEgOwGpnizA+L9v40wgSQGCkYB6WExdZhVhtovEGeRkDlPeCQIgYA2BYFgPMmpBj6l8kac0oIpheZpNCIWSCuxHoqTBCUpgEyplbxph7Nx3CzIDm-pCUwf83p-AIZ9McKxIJ-U2DsAhtj+lHIQYwIFVSQVnVmjdHhucwiwh+ILcURc4QyV5kA7Z-DgibDLPw6EALGBKBuQS9gEAdBXDoMgFQABrJgB0pb5S5ZUzeCB6BCsoFgRkPRFmRB-rC-+gDEXSTHORFS1EcnMp2ByqVPLiBEDGZynAiqABmYyyCMHFXbZiJqZVypUAqpV8gVWUN-hqhFbTLDBBCdzNJ2xbB-zjoc+BTczVjJILE5RiSIVqyRjCR0p98ylkeo4L0vM6IWC9PmRydVoTi2xdG6WlAVBKF8C-PlCpBUirFeTJ12Iq01tdY2j17xlXJrwV-VVMLTHwvsFq+02wUV-ziGlGIDhkRRvsfldttbnGxqIJam1dqHUtsGXkZdnb5WKp7V6vtiMB0+vVSOoBc4TCsw2FYEipFnQ1zLY63dTBKAYA0Dy+tAqhWiu3QM45H6v0EtlV2o9Ohe0kshUjQdvqr1jsQIKOSpFXRbTsHySNdiJXMU-d+l+a6N0aFtUQe1b7gOMHw2Bt13aoMnpgym89arh0AP9bzOw-MYjFmiKQl0fSKO4qrXQBglAeVqP4IsnYDlTDvRiILf+TU2NOhAnEcEt73AcuE6JnlrD2GEhVZ4XRqVZ5xG2k1JpV986QSjo4WB5bF14Z0Dplh-F9PSEsIx-tWidXGbDZseIj0lM6MRL8BwtUvSvp3ZRy56h8Av1lvLRWtQygf1PUzDxJFcmzqMLJDYuXZzcnxssxECRPDhDHNhhzuHsSxYIAluWCtuyq286MeqAE4VzpouBRqRXIEjhiGXccZZPAcowEoCAR6RmqHoBoQqTtWiuymjNZrWEmOxTSqzQUuWZKQVom4MeYoQhrDqqlaqMIxsTam1AEgM26Bzcds7Jb7sOKpZqWLbx-Ca5ThzU+sOf9GWpRLEpcLe0ep0BUHM+AfRBOUxa2e2K6sILa0mHrA2PNuRI5hUsSxkRHoEKi0B3Fip4cZbskEVGHhhQbAguBcI2THDyUeqWXYzguqFg5cMqApPeGgh2MspY7W-gzkDU1McP8wnvWZWRQnOKm5P0TSgnnZL0beKFKpgmzhzC8ysKzc2gbBZqdxhy2J8TN7K4HEWbJTS1fpV2l0kUVXYfSzKUQCpBKLf4MrMsacqU4W2BsGPfhAEA7fOD3UmSnPV7IJu3G-Fm8SAzLmRAT3X9XDiRLOEcsdTskBxWFsRw4EdjgTIhy05bvzmXOubclPa3Wu5k9MOAnfIYT63iOld5MJ5JfJnZhsUHL49K7rwjzLJh5IuiLE0-JGziL1TMJOVcqxVz8LUgumrpTuXm+H2TvnthtlL-hOECsYQx6BsZ4WYscJ1klg5Wu+NKhFfc+37zksnoiEkSLJ-4bebRQWCLGCNvKcVYLTatFdJ-eaEfB6KnSEEwECWiQsT0ILbkSzFTB9TjSIXWLTUDLfCAnfehVDWA1wQNNYJA4iFSZYVYV5TwQ+EiJ3aLITZzMAMTHA3BSAvnZHEUOIM2GuOqQUCzLvSBU7MJOnDlOreLIfXA3nOfbZKEECZcXLfhchIrPWVGGcaIGwIIL0S7SbAlW7FQWbVPWKKcYcP+aEKxXYNTP8NKYNf4L0aEKwXkSNZIIAA */
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
              actions: ["assignDrawStartPoint", "addTextElement"],
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

            RESIZE_START: {
              target: "resizing",
              actions: [
                "assignResizingStartPoint",
                "assignResizingDirection",
                "assignResizeFixedPoint",
              ],
              description: "single element resizing",
            },

            "POINT.UPDATE_START": {
              target: "updating point",
              actions: ["assignResizingStartPoint", "assignUpdatingPointIndex"],
            },

            "SELECTED_ELEMENTS.GROUP": {
              target: "version released",
              actions: "groupSelectedElements",
            },

            "SELECTED_ELEMENTS.UNGROUP": {
              target: "version released",
              actions: "ungroupSelectedElements",
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

            RESIZE: {
              target: "resizing",
              internal: true,
              actions: "resize",
            },
          },
        },

        "updating point": {
          on: {
            "POINT.UPDATE": {
              target: "updating point",
              internal: true,
              actions: "updatePoint",
            },

            "POINT.UPDATE_END": "version released",
          },

          description: `updating linear element's point`,
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
        addTextElement: assign((context, { devicePixelRatio }) => {
          const textElement = createElement({
            elements: context.elements,
            elementShape: "text",
            elementOptions: context.elementOptions,
            drawStartPoint: context.drawStartPoint,
            devicePixelRatio,
          });

          return {
            elements: [...context.elements, textElement],
            drawingElementId: textElement.id,
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

          const threshold = calculateClosenessThreshold(context.zoom);
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

                const linearElement: VisualizerLinearElement = {
                  ...element,
                  points,
                };
                const { width, height } = calculateElementSize(linearElement);

                return {
                  ...linearElement,
                  width,
                  height,
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
                  const sameGroupElements = calculateSameGroup(
                    context.elements,
                    element.id
                  );

                  return {
                    ...element,
                    status: isIntersecting(drawingElement, sameGroupElements)
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            const now = Date.now().toString();

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
                groupIds: copiedElement.groupIds.map((groupId) =>
                  createUuid(groupId, now)
                ),
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
              groupIds: [],
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          const nonZeroSizeElements = context.elements.filter(
            (element) => element.width !== 0 && element.height !== 0
          );
          const isElementAdded =
            context.elements.length === nonZeroSizeElements.length;

          return {
            elements: nonZeroSizeElements,
            elementShape:
              context.isElementShapeFixed || !isElementAdded
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
        assignResizingDirection: assign((_, { resizingDirection }) => {
          return {
            resizingDirection,
          };
        }),
        assignUpdatingPointIndex: assign((_, { updatingPointIndex }) => {
          return {
            updatingPointIndex,
          };
        }),
        assignResizeFixedPoint: assign((context) => {
          const absolutePoint = calculateSelectedElementsAbsolutePoint(
            context.elements
          );
          const resizeFixedPoint = calculateFixedPoint(
            absolutePoint,
            context.resizingDirection
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
        resize: assign(
          (context, { event, devicePixelRatio, canvasElement }) => {
            const selectedElements = context.elements.filter(
              (element) => element.status === "selected"
            );

            const currentCanvasPoint = calculateCanvasPoint({
              devicePixelRatio,
              event,
              zoom: context.zoom,
              origin: context.origin,
            });

            // resizing multiple elements
            if (selectedElements.length > 1) {
              const convertedDirection = calculateDiagonalDirection(
                currentCanvasPoint,
                context.resizeFixedPoint
              );
              if (convertedDirection !== context.resizingDirection) {
                return {};
              }

              const resizedElements = resizeMultipleElements({
                currentCanvasPoint,
                direction: context.resizingDirection,
                elements: context.elements,
                resizeFixedPoint: context.resizeFixedPoint,
                resizeStartPoint: context.resizeStartPoint,
                canvasElement,
              });

              return {
                elements: resizedElements,
                resizeStartPoint: currentCanvasPoint,
              };
            }

            const resizingElement = selectedElements[0];
            invariant(resizingElement);

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

                if (isGenericElement(element)) {
                  const dx = currentCanvasPoint.x - context.resizeStartPoint.x;
                  const dy = currentCanvasPoint.y - context.resizeStartPoint.y;
                  if (element.width + dx === 0 || element.height + dy === 0) {
                    return element;
                  }

                  const resizedElement = resizeGenericElement({
                    element,
                    direction: context.resizingDirection,
                    currentCanvasPoint,
                    resizeFixedPoint: context.resizeFixedPoint,
                  });

                  return resizedElement;
                }

                if (isPointBasedElement(element)) {
                  const resizedElement = resizePointBasedElement({
                    element,
                    direction: context.resizingDirection,
                    previousCanvasPoint: context.resizeStartPoint,
                    currentCanvasPoint,
                    resizeFixedPoint: context.resizeFixedPoint,
                  });

                  return resizedElement;
                }

                if (isTextElement(element)) {
                  invariant(isDiagonalDirection(context.resizingDirection));

                  const resizedElement = resizeTextElement({
                    canvasElement,
                    direction: context.resizingDirection,
                    element,
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
        updatePoint: assign((context, { event, devicePixelRatio }) => {
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

          return {
            elements: context.elements.map((element) => {
              if (element.id !== resizingElement.id) {
                return element;
              }

              invariant(isLinearElement(element));

              const resizedElement = resizeLinearElementPoint({
                currentCanvasPoint,
                element,
                pointIndex: context.updatingPointIndex,
                resizeStartPoint: context.resizeStartPoint,
              });

              return resizedElement;
            }),
            resizeStartPoint: currentCanvasPoint,
          };
        }),
        groupSelectedElements: assign((context) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          if (selectedElements.length <= 1) {
            return {};
          }

          const isEverySelectedElementsSameGroup =
            isSameGroup(selectedElements);
          if (isEverySelectedElementsSameGroup) {
            return {};
          }

          const newGroupId = uuidv4();
          return {
            elements: context.elements.map((element) => {
              if (element.status !== "selected") {
                return element;
              }

              return {
                ...element,
                groupIds: [...element.groupIds, newGroupId],
              };
            }),
          };
        }),
        ungroupSelectedElements: assign((context) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          if (selectedElements.length <= 1) {
            return {};
          }

          return {
            elements: context.elements.map((element) => {
              if (element.status !== "selected") {
                return element;
              }

              return {
                ...element,
                groupIds: removeLastItem(element.groupIds),
              };
            }),
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

          const threshold = calculateClosenessThreshold(context.zoom);
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
