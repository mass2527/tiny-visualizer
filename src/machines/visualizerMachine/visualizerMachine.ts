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
  calculateDiagonalDirection,
  calculateOrthogonalDirection,
  resizeGenericElementIntoOrthogonalDirection,
  resizeTextElementIntoDiagonalDirection,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogDsMo4wCcARgAsM60fNGArADYnlgMwAaEAE9EAEwBboyWlkYeph7W5gAcDtYAvok+aJi4BMTkVLQMzKwcAMIAErwAcgDiAKKCVQAyVQCyVWWiIqUAClWyCkggqupaOnqGCCZmVrb2jq7u3n6BMjKMRjGOAbHmLjLm1k7JqejYeISkFDT0TCxsXHwVIuKSPXoDmtq6faPjFjZ2Ds5uTw+fwISyxcGMGROawucweYIBMLmA4gNLHTJnHKXfI3YT1KqFURVTi1BrNVrCRicfFE559V5DD6gL6mH5Tf6zIELUFOJzLSzmdzbWLWDxGcWxFFojKnbIXPLXDh4hqE4mkpotUSUwoAeQ6AE06co1G9hp9jKzJn8ZoD5iDYQFGE4PFYoryAuZzAEpUcZVlzrkrgV2MqCUSSfjyVrGB1eGJuvIXibGSMLRNftMAXNgYhPAFlgFrEFLE4jIjYh5Nj70id-ViFcHGjqAKp4wRNgBqCd6xsG71TCDFlkYew8nlMoqcFZc1hzCERW1CMUrsXLO2d1fRsoD2MV7AAksJ1VH2rwuoIAGL7gAaatEOoqFQaRv6yf75rGlozHNtc-h1lCVwAg8XktliFxYksTc-UxeUg1xfFVQjMlNW1ZtpETek3zNZk0zZa0sy5EFLBkDwPBWItEV5eIXHCIxoNrWDAxxIpSkqGpI01QQ9VEfcdTKYQXwZd9cM-dN2RtbNuUsGcXEYGcKycREZE8QUGIxOVmL3EpymqQQAC0dR1RohOwpkDDwq1M05O1ECLZZtjhB0tncLZ1O3et4NY3SakM4zBH4fdRGKQQOn3MoSlMvscIssT8Os39uXcMwZBcAJXChaFPAg9y6zglj2FjMootNczRnS1YnVXewRWsWJnWdOdC0q51K1FVYIiMKCUlRX1GM03dg2KQ9724fVBGbDpOF4WlMN7UqB2+Kyfyk4jRwo-MRRMfMrHonrpX6ncGxufhuCCmoxAkDCe1faKytzGREUhF13A2JZaKapZHUiUUNnBKFCw8XKmMGm5OIpRhQ0JQReDqOoSpTD8bHsCwyJnUxNkrSsmt2cix2CGJwNXVKgf2vqNKOrz2FO87ak4IKEZE2KK1iRh-1hQV-vcJw5zo8xQhccUthsQWINJw4awpzyCu4KphH3fSLsea6kzugd3FZ6x7IdOqXFswdLACMxVzBJY7BnXZgYG46OCJa82nB0RGFl+XFYeK7GZi8rSLZ8DnBMEUAfSprwPIj0+WdOFIPBK3KYK6oyiqM7CmPTVnblhWlY9ubboWj8AFpDf5itgglEVNmcAI-wFACoUFOFeS1pT9jJyWPPyiAiCwAB3egoFuARPfu0FwmHKc+WAmRwQ2FwXCagV+ecVKpxqrbY+lzue77gehBaTgh4HcdWaWBxHtiJZ7CNpqNmHHZKy6+q7GsbqJa3PLmM33u6H76kGiJEREK8X4gfD8xN5KFkcAHBesJ57PxWCROIJgrA2HXh3LuX9+66jKInaGl0ng52El7B6es2ZbDSl1JwXpERGCaq4ACdU4SFgXh4GcLdX4wWtkwTeUAoDbx4LwCoIDRIyTsGzP4ewgjP1hDQ6Sp82arBLrRIsZY2G9Tbu-bE3DeHfwHvcPeQjYpgjFIweqUdpHjDBLzTYTgxH2FIl1McYRvStzfiDPIOAVBYAgNvAx5VIJs0FgKIJuwRTXysGzZudUHDREoag5iShiDqFgFoHRvjAiFhsUvUis8IJBFMHOfxax65iwrGRPa7DDob3QX3EgKhSDdyIG8b+JAwB0AgJAdgaTQQVmNpQys5jTCWO5EEQUjAPSwjSulNwVYXEcLjsgRJ7wSBEDAGwLAsAOldMkZkvk2TZ6rnzDI4igTQiFkgrsR6KkwRxOxA0pp-cab-30QQsyh9IjH1MOYM+F8yxHMWGOFYkE-qbB2EbVRB0pb5TuSkh5Z1Zo3UIcPMIsIfiC3FOEWEY456yKNmMvWwQK7BBAkkWZlT8pKHWTC9gEAdBXDoMgFQABrJgEL27xMpX3BA9AGWUCwIyHoXSj6Qk+d8v4V9pJjnIipaiHpDYQR2DcvIFLknb2IEQOpjAlA4D5QAMzqWQRgrKNFKo5d-Ll9KVC8v5fIQV7zhWnzemKv5oJgg2O5oE7YtgvkuEVUwNVdSSAeJ4T4l5askYwkdKuYmpZHqOC9LzOiFgqGpR2HVaE4s1GuM4YwSgKglC+G3jShUFrmWGvJmy7Eub82cu5Zavl7wBWhrzsIu1J8vmOsvs62eywjAgriGlGIDhkSkshcxKtBadH+qIJq7VGg9VEANUatxTBx01otVahtNqm2IxbVPe17bz5OrnAHMZmwwhLBAu8jNS7s2UAwBoKlRa6UMtLTeuOd6H1rp5fWnQjaEWvKRq2kVHbflzkFHJUirotp2D5D6kdFa8gfqpVOmdur9VlvUcunN96YXmu-dauQtq91ttFZ23mdh+YxGLNEbYkdymZrmdLXNdAGCUCpfw-ggqdgOVMO9GIgsz4hyWE6ECcRwQB3cL6nNOhWNUqwTglWWEw0ts8GIlNDD4iPSarPReU4b52B2F1KTzHZPb3k2GKQlh-3KcMZKtTnrNiaarsM8+AFES-AcLVL017y3GqYCs9Q+Bt4u0zl0r55FnTKLiMETm+t4SC3kvCEsY5nT2KkwFggwWM6K0s9Z5tsUvRyRItsWe4oiWCj-KKciewthayLF6KEcGKmjuxBloLOiQtu2eXlndhiSLDmiJA2SGwjAzmrrik2CRPDhCxeluAmWdF2wdihVo6dXbdlVvl0Y9UzAZKNv+TwAI-wmGHHmTqcRPQvwY2S5ibXt4JyTvuFOjs1uhe3UzUY8I8ZfXsEKRzzqWGGxWGjYl+Z4TDp6nQFQ7T4B9DfZ5TbvXRiF3FCY+LZcGGVznPnGxnpLtwhO8pGIUnFSI4+3ZIIqMWFTxnuCWizqRlmG2BVXY-tDYkuawhrh1Tv5k6IaCQzJilj1XZDOQ2TUxzHzse9AlZEfOYezVovufOkXoxMUKUTBNnDmF5lYVmva5Wec2KKKTHivHK6U1tin19Z7q-SrteuIomvXZa0qxZKreeW6R4ESsyxpypXbbYGw+s9b0LqgKUPGSZJSc-jUgN0KamtPaRAFXh9XDiRLOEcsGTr5axWFsRw4Edih3l1m+ZiydDLNWWAdZkBU9I0u2MiIfIYSUPiMHaSslwG60LDBsUUmE+e-mt7keJhEu7GCGlLKsQrGlhHCBVcCjyvgt81h5VML6-CIM03uqSXe2OP1kXXblEBSRC6iWKTU7A0qGDUP3OI+SyehHLROwhYmFn4TaKCwRYwRt6nKsYzPNCdKATfQxbJSEEwECWiCBdtOcHTETZBCjSIGwFfBXd9HDC3YfcnAXFhCA0iVwdnT0LTaSFSHtSiFSBfdwVKQAljMANjTA+-bA4rVmEUOIE+KeBhHmYZLvB+OqP4KeWiObQLBgxFAcdtExAdGne3L5SwcbY2csAUfMGSRwZIZIIAA */
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

            RESIZE_START: {
              target: "resizing",
              actions: ["assignResizingStartPoint", "assignResizingElement"],
              cond: "isSingleElementSelected",
            },

            "TEXT_ELEMENT.RESIZE_START": {
              target: "resizing",
              actions: [
                "assignResizingStartPoint",
                "assignResizingElement2",
                "assignResizeFixedPoint",
              ],
            },

            "GENERIC_ELEMENT.RESIZE_START": {
              target: "resizing",
              actions: [
                "assignResizingStartPoint",
                "assignResizingElement2",
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
              target: "idle",
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
            RESIZE: [
              {
                target: "resizing",
                internal: true,
                cond: "isSingleElementSelected",
                actions: "resize",
              },
              {
                target: "resizing",
                internal: true,
              },
            ],

            RESIZE_END: {
              target: "version released",
              cond: "isSingleElementSelected",
            },

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
        assignResizingElement: assign((context, { resizingElement }) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          const selectedElement = selectedElements[0];
          invariant(selectedElement);

          if ("direction" in resizingElement) {
            const resizeFixedPoint = calculateFixedPoint(
              selectedElement,
              resizingElement.direction
            );

            return {
              resizingElement,
              resizeFixedPoint,
            };
          }

          return {
            resizingElement,
          };
        }),
        assignResizingElement2: assign((_, { resizingElement }) => {
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
        resize: assign((context, { event, devicePixelRatio }) => {
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

          if (!isLinearElement(resizingElement)) {
            return {};
          }

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
                const direction = calculateDiagonalDirection(
                  currentCanvasPoint,
                  context.resizeFixedPoint
                );
                const resizedElement =
                  resizeGenericElementIntoDiagonalDirection({
                    element,
                    direction,
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
        isSingleElementSelected: (context) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );

          return selectedElements.length === 1;
        },
      },
    }
  );
