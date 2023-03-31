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
  isDrawingTool,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogDsMo4wCcARgAsM60fNGArADYnlgMwAaEAE9EAEwBboyWlkYeph7W5gAcDtYAvok+aJi4BMTkVLQMzKwcAMIAErwAcgDiAKKCogDydQAysgpIIKrqWjp6hgguMi6M1h4e-bEBsS6xkwE+-ggBTh6xFhOuYR6WwS4uyano2HiEpBQ09EwsbFx8FSLiki16HZraum29JmZWtvaOru7ePyISzTFYyJzWFzmDzBAJhcx7EBpQ6ZE45c75K7CKqNKqFURVTiCHFVACyVTKomEjE4JIJjzazy6b1AH1MFhsdgczjcnjmwKcThkoXM7jGwyMktiiORGWO2TOeUuHGxuPxhOJuPJlOphTqAAUAJoM5RqF7dd7GdnfLl-XmA+ZQgKMJZWKKCgLmcwBGUHOVZU65C4FdiqvEEokk7VUxj63hiKom9pm5k9K1fTm-HkA-kITwBYUBaxBSxOIxw2LLBEpJF+o4B9FKkOkuoAVWxghbADVE-IninXmmEB4jJYhktPKZhk5Ky5rLm4eZBjZodMKzJRR5fel62jFcGrgBJYSaskU0QiUr6moAMUPAA0NfUKhVcUmmYPLQhPhyftz-nyQLDkWoSuAEHiCkukyxJY24ovKgYYsqoYkuqkZaueuqttIfaMgOFqsumv62tmgHzJYMgjIwRjFnCgrxC44RGHB-p7kGmJFKUlQ1FG56CAaoiHnUZTCO++EsgYRE2lmAEOsCc6DHOlZOHCMieKKLG7gq7HISU5TVIIABaDSkmJnSfoR37Wpm-72rmxbCv00JOku7hLppqLaUhIZ6dxRkmYI-CHqIxSCPqh5lCUZnmhJbIZn+do5kB7hmAMiz9IK1ieFMHkIY2B4cNUYittwVSxuU0Wpl+-SDMMowyOM0EzAuMTCt6sTrJ4Ww7LsNaylpiFNlcxTHvU3CGoIrb6pwvD0rhprmQRklWfFJGybmNhLNRDmxPYMgFlYzF9XWnmDQV7D8NwwU1GIEg4a0C0xUOFFwowlGilssQyAMlgLt9zqRMMEzTOCRZbsdO6nflHHsLxOqMGG+KCLwjTNPNyaLbFwLWPYFgjHOpixKuywLuYwyMJswQxNBBYuOD+yQ3l+4w5d13EpwwWVRZy2VisMKQl6M5fe4TgbZK5ihC44uMZCRhTPTtaMw2zPIaVwiHoZN33Pd-aY0OAC0BZ40Tm2QcpuYwjYoQUYTTHjIKuXKzpIb6nUEWiIwU0zQSdx3VzS29MstVAwWkwRJMLgWzjzrfXY33WLtI69Qz8FO95WKoRGp7RtSFTcG2+r+1jCAzs6ILhC4QTelyRgLuWAMgg14TgRR8SO2x6cqpnGpwzGraVPnU1F0OThetROzeks0SVtYotAYskyrB1jFddsyeK6nHdDRwXGcOVZS+w86MfgHiCCk4b3BKPFFQuY4LmAuEFghCd+uPElhxD6EOb15eQQEQWAADu9AoDXAEMPL8YRRwug6vtSIa4I4Lg-hLZwAwZz2GmPYduv8mD-yASAsBQgKScAgZZScYJTB3wmPHcstd54TDHBuZYo5YE41gt-ViODGB4OAXQUBtJcQ+0RoJYSpDloBB5EMNwM4MqTF+vPb6KxWofxhGTCi0RsFnW4QA3hoC9RlDKOGQ+Os8J60gQMDwFMlyV1HKPEsdD5jpWsEMIm-NkGjFnpo6GeCoBQAITwXgFQxG9EsP0ZxgMaIqSLKExwYs74UxopWYINgJGLC8czHxfi+FgNuMQ4JwJKxmA6quKEkpTAgg2kTC+ETKKjk2GEL+KdOFaJwCoLAEACH5IWDBCmUsP79LJrtBcnoxwQUWAnBw0RR7pPYkoYg6hYBaGyV0oIs9qJCkoj1cYBYHGIB6TEQWUFlgjBHDMjEPCQEkBUKQQBRAXh8JIGAOgEBIDsC6SCEcjBilB0cJ8Cp9DRSME9FCSu6UZzViaQNaGyB5mvBIEQMAbAsCwFeSsosF9UGbJ2Ns0wG0+mhCLDBMm+01IgjOXkW59zQGsx9nk4+4lnrwLepQ-aX0uQSL+psaiMFgZEw3BIpw5KmCUqWdSq6c0HoYyepAmJHIpaSgrtCUJYsJFArpsEIm5Y6YQiFYwJQyLRXsAgDoC4dBkAqAANZMH6lDZm+rFkgIQPQc1lAsDMhaO8pl30HCspoRyoCXVLFqXoiMjVG5dX2sNcQIg1y9U4DdQAM2uWQRgNqmazINY651KhXXuvkJ6hqzKfXUPZbsvMV8XSlj6WEjcAxdXRuuSQVpvjOn0rMWQyEzpGoFjLPtRw3oNpMQsN6WmG4E4QgVmmtOeRKAqCUL4AhxqlRmstdak66aMSzvnVmldubXgerbdKshXqWUlvsP6x0-RuV3ziJXGIDgIUb2adDLdC7skNqIHGxNybU3runUwV9O6XVuv3fmw9VVj2Fu9VQtl56y0mBWBMKwNsILwMnX+reAGMAaENUu015qrW-qVphxglBsOiqdbukDOgD2SpPsXchRaYN+rLaKQY71W57VnnWjhULmZkZwwQj9X6NBJqICmqdJGBMUezXumjYG6MMsgSe4tsHaEbTsBLGIJZogZQ8I4XVs66AMEoIagJ-B3m1sYP0EwAwYhS1ZQuNlLoIJxGmAh9whmdAmcNfowx+JPWeApt9MJRN4j7QXBPdZjUKK2EcOwyFtr2JGZ8wQvz4YpCWEU+25agbgsDDsGFkwsx55fWcXCTkDhdrafQ8RrhCL1D4AIWrDWPEygkPA9zEJFFRn3rlp2hi84gKUyKXCBIXUIihN1Q1ggzWqjq01l0jqziqEPoYpMJYFsWFDBiPYOppg4S1Z-lojASgIAgYeaoegGh2Cu3dp7aas1ezZaPctSuKxRRy1CTBRibg5LDjlhfA5CcBjjBxuvSTXDTvndFSQK7dAbt3cpA972bWOsvYg29ysXy6YNXBT6iCUd4nBB+h6KrR1EsbryPq4zBDd77yW64F0gtiyuHsLYMthLLGCg2L99BRhpS8aSxiGndA6flD3nGA+dKMddcQI4JRUs4s9rlkWR+Y9nAVxLJ6CIgrER0BUC8+AbRIdnV1q93o+spjG2+OfOIhOgJW+Zd9fto5XLxEfab6GypzeY96LRPG9VGpTDkZznX1n9pljJs4UcRZdUXL4b7uXeYNxFMURCLkc4tiPxBG9PaIWNUnPjwAltifTEW-krYL5YpXNU2cA-ANVgVgC+6lVomwxdWtPaSApPp8EDFmGTsavixDqijiJCCNsKHVl8en7wIyxhSzgGFQ2wNh-t02cTjIlG-0VTaF1T3BOjLmNpFZcp5LyIC94Y64eKpZm4gnRcMnG1ElwK6cpMEYuqYVEHUDoeFiKwBkVIAr9novQxwJEII7A3A4hyw55yIFJrNCU707AlgKcn0+N2JT8Z8pU588xwhHJ9Niwdhxl-lyIOozBpxxhElgh9M9dKd-09VM1sD6Nno44gVElLYBd6l-sthHAgVaIVFylSx60iAY1SBm0skoAQDIFR4tNGI7AixolIgy0whyYyYKxR4Op4gkh98GDANmClMyFNk3oTAIJGIiwvQIsgIotXQwhNNIhNpDNyMe9y9cD1F2NTD1gLCqENMKJtogg1In53AeN6CpNvMwBTMXDZ9k8b4Vhdo4hvUGoE5RRItIRqIQQQc9o5Fps4BZsDCctehyCgVwQIIYgk46Z5F5gIJBQ8Y5xogUlPRGl0Dhc8hocLsoA4cVBrtpDLIZwxxX5IQVxqZYgLZK4L4o8HBxkrBBQIcMMuFRcoicDk8tD+C1IHAP4pYVJOdixGF3AthNg8dthkhkggA */
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

            CHANGE_TOOL: {
              target: "persisting",

              actions: ["unselectElements", "changeTool"],
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
              actions: "toggleIsToolFixed",
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

            "GESTURE.PAN": {
              target: "persisting",
              actions: ["panWithGesture"],
            },

            HISTORY_UPDATE: {
              target: "persisting",
              actions: ["updateHistory"],
            },

            WRITE_START: {
              target: "writing",
              actions: [
                "unselectElements",
                "assignDrawStartPoint",
                "addTextElement",
              ],
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
              cond: "canGroup",
            },

            "SELECTED_ELEMENTS.UNGROUP": {
              target: "version released",
              actions: "ungroupSelectedElements",
              cond: "canUngroup",
            },

            PAN_START: {
              target: "panning",
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
            "updateTool",
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

        panning: {
          on: {
            PAN: {
              target: "panning",
              internal: true,
              actions: "pan",
            },

            PAN_END: "persisting",
          },
        },
      },

      initial: "loading",
    },
    {
      actions: {
        addElement: assign((context, { devicePixelRatio }) => {
          invariant(isDrawingTool(context.tool));

          const element = createElement({
            elements: context.elements,
            shape: context.tool,
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
            shape: "text",
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
        changeTool: assign((_, { tool }) => {
          return {
            tool,
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
        toggleIsToolFixed: assign((context) => {
          return {
            isToolFixed: !context.isToolFixed,
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
        panWithGesture: assign((context, { event, devicePixelRatio }) => {
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
        pan: assign((context, { event, devicePixelRatio }) => {
          const origin = {
            x: context.origin.x + event.movementX * devicePixelRatio,
            y: context.origin.y + event.movementY * devicePixelRatio,
          };

          return {
            origin,
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
        updateTool: assign((context) => {
          const nonZeroSizeElements = context.elements.filter(
            (element) => element.width !== 0 && element.height !== 0
          );
          const isElementAdded =
            context.elements.length === nonZeroSizeElements.length;

          return {
            elements: nonZeroSizeElements,
            tool:
              context.isToolFixed || !isElementAdded
                ? context.tool
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
        canGroup: (context) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          if (selectedElements.length <= 1) {
            return false;
          }

          const isEverySelectedElementsSameGroup =
            isSameGroup(selectedElements);
          if (isEverySelectedElementsSameGroup) {
            return false;
          }

          return true;
        },
        canUngroup: (context) => {
          const selectedElements = context.elements.filter(
            (element) => element.status === "selected"
          );
          if (selectedElements.length <= 1) {
            return false;
          }

          return true;
        },
      },
    }
  );
