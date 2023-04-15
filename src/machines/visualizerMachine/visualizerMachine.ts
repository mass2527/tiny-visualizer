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
  calculateScaledSize,
  Size,
  isImageShape,
  calculateReadableFileSize,
  isImageElement,
  resizeImageElement,
} from "../../utils";
import debounce from "lodash.debounce";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../../constants";
import {
  FileId,
  ImageCache,
  Point,
  VisualizerElement,
  VisualizerImageElement,
  VisualizerLinearElement,
  VisualizerMachineContext,
  VisualizerMachineEvents,
  VisualizerTextElement,
} from "./types";
import { ELEMENT_STATUS, PERSISTED_CONTEXT } from "./constant";
import {
  createFileId,
  createImageDataURL,
  loadImageElement,
  readAsDataURL,
} from "../../utils/image";

export const visualizerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogBsRgOyMAnAEYALDKNWArEbumATKYA0IAJ6JbABxWjAFuATIyjo7WAMwxNhYAvoneaJi4BMTkVLQMzKwcAMIAErwAcgDiAKKCogDydQAysgpIIKrqWjp6hggm5tZ2Ds6uHt5+CG4RjKaOEW4xFjZGUTIxyano2HiEpBQ09EwsbFx8FSLiki16HZraum29-Za29k4uMu5evogLMeZhKxuZYBCwBAKmIwbEBpbaZPY5Q75E7CKqNKqFURVTiCNFVACyVTKomEjE4eKx1zaty6D1ATzMLyG71G3wmQMijCBcw8wM+9mhsIyu2yBzyxw4qPRmOxuPRhOJpMKdQACgBNKnKNR3bqPYyMwZvEafMY-BAxYEBSwWezzUymCxuJIpGFbYVZfa5I4FdhSjFYnF4hUkxgq3hiKqa9ra2k9fUDV7DD5fca-G1W0H2WYxRyLf6Ct07D2I8U+-F1ACqqME5YAapH5DcY-c4+bTMEbLmrFYLIsZI6bGz-GZzDJlhZojEe+ErOsXUKiwixd6TgBJYRyglE0QiUoqmoAMVXAA1ZfUKhV0VGaS29X0DYmWSah+bgVznMDIbnBxPTAX0ouopesikp4jKgbytuSoVtIjbUs2ur0vGTJGsmpoTHEjg2IwCS2iMyxGG4jj-nCIqekiErsCU5TVJuwaCKqoirnUZTCNeCF0gYyGGkmrKpggPYyG4lhGAEzgxKJE7hG4JHukuwGUdRlQ1AAWg0+LsZ0t5IfeCbMsaKZmjYUyMEY-b-EEQKmBasmAeRpYnEptFqXU+KCPwq6iMUggqquZQlJpOqcQyemoXxZqOFYo6EXMYntmCNgBLZ8JARRPrVGIFbcFUoblIFsZ3s8PFPoZEwODEjCRVEFgWGYcz-H+86Fil9krhwxTrvU3BqoIFYqpwvCUnBWpaYhXG6ShvHPvxpj9iJAQrLYbhWKC3bJWRJZtew-DcJ5NRiBIsGtCNQWtkVj4Geh-juFaHydjEESRb2zqbABLWbSB7BBlBjB+pigi8I0zTDdGo3BdxF1oS+4RGDhy0LZEvZYXOr2kcWy6fTte24pwnn5dp43nfpUP8VYRgWlyEJ2NyATxGs63owpPrZcIq4qftlxHU2YNnQ+xPhRMwJYZVU7-LOYnRECDPyWlJwqnUfmiIwfUDViFyHfjY0hZNJVXZMJgyIwY42DEoJTLNY4o66b0bRjlF-QGdE-RU3CViqmvgxNxWXS+PY1XDUU3Q4CwrdLqUOaB0qO99irK5Urt9R7vOhVNpW-P2jghKYiXAmZ4RiWHrWfWGZTq1cIM3lrEP89NZo5rTXK9qJ5NuOTMizoXH2Uau+K8LRfWNHUvCcEnd6OPaISzkCIJBFOvv2BVC0mLT7hzI4MlNTbjOyxwPACL1KqD8Pso933DbHaDp13m45umbOYuRYsbikw9sM1XYTpEU6s2Najcnh0wCARAsAAHd6BQFOAIUeOluw2GwnA2cSwTBLGcKTGw3YuTtwSFYNYDUkqbzRjLPIQDQHgMgUIIkI8K4cVbLORkcxTC0yiLOceE5SYrEzmTU2Kw8xRQWJ3DGJCwF0AgeSdEasHbMTKNA8adDzAMKYY-Vhjh+ITkNoEbhBFao1QEcBIRZDlRlDKP6MuXN4I8zvHIyqnxFEsIdCos0ThFhG0+OTMyYQHr4L-nZD6JCoBQDIXvCoMjehkyMBYHCZkm6Om7NnGw-Eb7OLMk4T4NpyZWF0UiPxASRGQPOJQkJ-h0ymXik6eqGcHGC3iNhLsrds6MNGJkvIOAVBYAgGQiAOgjh0GQCoAA1kwBc70MYtLaeAhA9BemUCwLSFohSEDglMgsSSixwkPUHKTWYETuwOEiJEV+iUmlMFGe03JxAiAqCIIwJQOAZkADNLlkEYEM22wETnjMmSoaZsz5DzIALTdkNmYP4YRQTRFqs-Rx4JhKzAiMkmqVUjnXOIOoWAWhcnzMwhEkwxltEWAdERaGwQ5jzH+LmduJhiIEP-kXfRIiSCXJICAogdx6VgDoBASA7B5l8lHIwlaEQJLk0hKTaIMKVqxWsnC8eSK6VQAZaQZlrL5Xss5RAblVgL6V09ryo2-LwhrBMP8Iwmz3A4U7E4QcFoaoTiRcgFF9wSBEDAGwLAsAuWYpzNilwTpwn4sdOPBJQRYadmcGoyIkUvHW0IQAxgSr0UQKxmrAp1CLEwIkvImxOYlH2NNVaceERVoRBwU4JF8ayFJvPtzK+MDEGmXHlEP1D0orxMcSsIF5MljoIje2K2Lzt55CUG6hN7BOnih6f0wZzVXlIiHWij5E7vn3DmammtsiM3WMYdmuxbCzQeOCCtWYUx16dgHEiudI7zmXOubcjQDyiBPP7UQpgF6F1TJmcu35q6CrpvoVm5hOZc17oHKZIYYkpxiWWkiq9pAWn+LIfMpwUVGAWiCPi+05kcz8QermLkQxlqPy-DYJFlAVBKB8B0rpzAJ0DOedOgdTBSPkbfV8j9OgV1apoZYiSwkFHbsA7ujCrdsLZ3sH8YOyxiPUp8RjJjFGzlEAuVcm59zHl0a3s+xgcmWNLvY1+zjab13kxCCbbOCw5h2FNthnBQL8OCRkLTDwJGMAaBHWO7pvTaNPtjZQFzCaJmLrY3QDj1af1Gd4-+nNgnEBxEHIwYTDnHDgk+AkZzrmyEwZvaph96mY1F18+lkRAX30-LkIhiSi9TPGRzGONYARrOJTw2Jm+EJQS2uk8M4CpG6AMEoCOve-BEO9rw52Baq98XkzQZ2FDY4zKJSiQtPt9HNPdd6yOwxxjMSIcIuYdB6DYFYQdOCF+jWxJOC7LYe+JGdBrYMSxTb0hNWhYJqEm0FUzA9jKWsCpoqFjxaCGsCzoRzJIudeofAZCWZsxqCmgza7XsOZKZ9tRD0JyVN+OvXbUT7Arw8aDuABBIdVFZuzIbOCUOhACAgiSH96t7uMrDBRqwbS4qRRgJQEAP30tUPQDQ7B5aK2Vv1QaVbzHw6KSbGbg5gQf2zgkpLAxdkPSnHAr4bOOdc-lTzugfOBfEiF6rGHZQqFw7C70ZaKxTIQiwmsJab2EntgPR8B6R6qcuHPVgHrZCS48ptJwoisD0GQhZ9hxKETcKETNkhmyHWZ2Ds93Qb35RcTG8xTgzhEIHArEdDmE1ddoiGzgRJduaPaq-2jTS3xwDhEqrYGQdlGgSDurYH1j136Xu-FBFj8E49ZgtosKa4I4TI1OiWJCUI57nVoDACAkgqAKAwBIO83J7nqOeanRp2NSgp+oBn3PhfYAl+tNOVAYrrHSuIcbUbKn4Qc7hNBaTbsmcEhxDCIRKY-DY8MeuTvvf8+sCL7L4QKZYqZ3pqbeZFzb5gDT6z7-6AHH46ZBYhZi5m7+Cmy3R+zOCfBHa2CkxTCGzAhxB8K1RiZIpwGH5yqjpUafJebLaxrkEkBypn66bBb6bPZVz6z4ozD37RCzDgg-ykwOaLxRSOhrCJSmzLBkEH6MHV4ZaKbXqgH3qPp0FFwMFMGfIsHIEnSoGTCRTYTY5u7woQiP6iSVRmCDD34JBRoQFdw+gxwhhOQ1CMRSJsTt4cGxKwxAiAowyDifAJJ1Y4QThgiiQ95YTOguh0AqCcrwBtA2HLjsGex-I3yGzZqOjhK+EWaQoTB-KwwRB5HWpmTDCMJkEFAJGtjGTCS9heq2CDiWTo4CT2j5rFqiTYL3QbzeKdZZKyEiJlGWICpmEB6nrZxo6irOIMLtiDiuCfAZJf6abZLgK9EwKzS5E2I2iOhBAEYJISRWgRD2hTjlQLCOhIpAGLHjQApmqpGtxj57LGSbJxZEQRA1Smy9iQbnoOrzo9EoEd7mgjAzA8igiLDoID755OhGwpIQhhBES-iyrdHyqMrlpsocqQCnHm5hJGwmwziDhhIrCbIUwoIOb2gOjxDZx2oOo6BOoupgBurIlfEcE4awyiQ46Jiv4JI4qWAmxwLv6iRYRlosoJoon+C2CZzTHpK9j1LLSmoRL8hkz8oPEOYe4fFQACkCQOYib1ImxZ5mTWRBpiQhBpJqLry1Q8mzGxowZH7wafHaHfFkxcEGxTCJQ-xh7Yb9i7ZpIrQrS37l5xFdZkbyZKm0mew4LhCVSzTrLWDAjunYY3yZw1RvA1TB4Nppb8kBm0IOaGwFphnTyRl1xEGBFibfgSTWDXY9ZgB9YLEpmWLhLmB2ljgQgpagiirLB-FfgGxbq1T47g7llWnuGzQRJEntweCibOD1FfyK79g47-B44mlFzs6c4JokDa4aDKk9jk7uAGzhKWRThZG-CSQ4SvDA4HEmAe5e6WmXw6FhBcEzy96RTDHYYF7snbH2CiRCpQjTlV6kJsp14N5N6Umt4QDKmtw3yVQLCnpES0wuC+zWTYQ9iRQ9joFHZUodFx4vq-6wHSEnEVk6RLyWBYS5juABpwLbkqnxBgk9jWRU6CqRRSEAEUGwkAViwoZYQ7bGqIytrsgRDYTghkwA5IKzQzHJBAA */
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
          loadPreviewImage: {
            data: void;
          };
          loadImageInfo: {
            data: {
              fileId: FileId;
              size: Size;
              imageElement: HTMLImageElement;
              dataURL: string;
              devicePixelRatio: number;
            };
          };
          loadImages: {
            data: ImageCache;
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
        imageFile: null,
        imageCache: {},
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
              actions: "handleElementOptionsChange",
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

            IMAGE_UPLOAD: {
              target: "preview image loading",
              actions: "assignImageFile",
            },

            DRAW_UPLOADED_IMAGE: {
              target: "image drawing",
              actions: "assignDrawStartPoint",
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
          entry: ["loadSavedContext"],

          invoke: {
            src: "loadImages",
            onDone: {
              target: "idle",
              actions: "assignImages",
            },

            onError: {
              target: "loading",
              internal: true,
            },
          },
        },

        persisting: {
          entry: "persist",
          always: "idle",
        },

        "drawing or writing ended": {
          always: [
            {
              target: "version released",
              cond: "isToolFixed",
              actions: "resetDrawingElementId",
            },
            "drawing element selected",
          ],
          entry: ["updateTool"],
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
          entry: "alertError",
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

        "drawing element selected": {
          entry: ["selectDrawingElement", "resetDrawingElementId"],

          always: "version released",
        },

        "preview image loading": {
          invoke: {
            src: "loadPreviewImage",
            onDone: "idle",
            onError: {
              target: "error logging",
              actions: ["resetCursor", "updateTool"],
            },
          },
        },

        "image drawing": {
          invoke: {
            src: "loadImageInfo",
            onDone: {
              target: "version released",
              actions: ["addImageElement", "assignFiles", "assignImageCache"],
            },
            onError: "error logging",
          },

          exit: "updateTool",
        },
      },

      initial: "loading",
    },
    {
      actions: {
        addElement: assign((context, { devicePixelRatio }) => {
          invariant(isDrawingTool(context.tool));
          invariant(!isImageShape(context.tool));

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
          }) as VisualizerTextElement;

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
          // prettier-ignore
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { history, historyStep, imageCache, imageFile, ...persistedContext } =
            context;

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
        handleElementOptionsChange: assign(
          (context, { elementOptions, canvasElement, devicePixelRatio }) => {
            const selectedElements = context.elements.filter(
              (element) => element.status === "selected"
            );
            if (selectedElements.length === 0) {
              return {
                elementOptions: {
                  ...context.elementOptions,
                  ...elementOptions,
                },
              };
            }

            const selectedElementsIds = selectedElements.map(
              (element) => element.id
            );

            return {
              elementOptions: {
                ...context.elementOptions,
                ...elementOptions,
              },
              elements: context.elements.map((element) => {
                if (selectedElementsIds.includes(element.id)) {
                  if (isTextElement(element)) {
                    invariant(canvasElement);
                    invariant(devicePixelRatio);

                    const updatedFontSize =
                      elementOptions.fontSize ?? element.fontSize;

                    const { width, height } = measureText({
                      fontFamily: element.fontFamily,
                      fontSize: updatedFontSize,
                      lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
                      text: element.text,
                      canvasElement,
                    });

                    return {
                      ...element,
                      options: {
                        ...element.options,
                        ...elementOptions,
                      },
                      fontSize: updatedFontSize,
                      y:
                        element.y +
                        ((element.fontSize - updatedFontSize) *
                          (TEXTAREA_UNIT_LESS_LINE_HEIGHT * devicePixelRatio)) /
                          2,
                      width,
                      height,
                    };
                  }

                  return {
                    ...element,
                    options: {
                      ...element.options,
                      ...elementOptions,
                    },
                  };
                }

                return element;
              }),
            };
          }
        ),
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

          if (context.tool === "image") {
            return {
              tool: "selection" as const,
            };
          }

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

                if (isImageElement(element)) {
                  const dx = currentCanvasPoint.x - context.resizeStartPoint.x;
                  const dy = currentCanvasPoint.y - context.resizeStartPoint.y;
                  if (element.width + dx === 0 || element.height + dy === 0) {
                    return element;
                  }

                  const resizedElement = resizeImageElement({
                    element,
                    direction: context.resizingDirection,
                    previousCanvasPoint: context.resizeStartPoint,
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
        alertError: (_, event) => {
          alert(event.data);
        },
        assignImageFile: assign((_, { event }) => {
          const fileList = event.target.files;
          invariant(fileList);

          const file = fileList[0];
          invariant(file);

          return {
            imageFile: file,
          };
        }),
        resetCursor: () => {
          document.body.style.cursor = "default";
        },
        addImageElement: assign((context, { data }) => {
          invariant(context.imageFile);

          const imageElement = createElement({
            devicePixelRatio: data.devicePixelRatio,
            drawStartPoint: context.drawStartPoint,
            elementOptions: context.elementOptions,
            elements: context.elements,
            shape: "image",
            fileId: data.fileId,
            width: data.size.width,
            height: data.size.height,
            status: "selected",
          }) as VisualizerImageElement;

          return {
            elements: [...context.elements, imageElement],
          };
        }),
        assignFiles: assign((context, { data }) => {
          return {
            files: {
              ...context.files,
              [data.fileId]: {
                dataURL: data.dataURL,
              },
            },
          };
        }),
        assignImageCache: assign((context, { data }) => {
          return {
            imageCache: {
              ...context.imageCache,
              [data.fileId]: data.imageElement,
            },
          };
        }),
        assignImages: assign((_, { data }) => {
          return {
            imageCache: data,
          };
        }),
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
        loadPreviewImage: async (_, { event }) => {
          document.body.style.cursor = "wait";

          const fileList = event.target.files;
          invariant(fileList);

          const file = fileList[0];
          invariant(file);

          const MAX_ALLOWED_FILE_BYTES = 2 * 1024 * 1024;
          if (file.size > MAX_ALLOWED_FILE_BYTES) {
            throw new Error(
              `File is too big. Maximum allowed size is ${calculateReadableFileSize(
                MAX_ALLOWED_FILE_BYTES
              )}`
            );
          }

          const { target: fileReader } = await readAsDataURL(file);
          invariant(fileReader);

          const imageDataURL = fileReader.result;
          invariant(typeof imageDataURL === "string");

          const imageElement = await loadImageElement(imageDataURL);
          // https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#icon_size_limits
          const MAX_SIZE = 128;
          const thumbnailSize = calculateScaledSize(
            { width: imageElement.width, height: imageElement.height },
            MAX_SIZE
          );

          const thumbnailUrl = createImageDataURL(imageElement, thumbnailSize);
          document.body.style.cursor = `url(${thumbnailUrl}), auto`;
        },
        loadImageInfo: async (context, { devicePixelRatio }) => {
          invariant(isDrawingTool(context.tool));
          invariant(context.imageFile);

          const fileId = await createFileId(context.imageFile);

          const { target: fileReader } = await readAsDataURL(context.imageFile);
          invariant(fileReader);

          const imageDataURL = fileReader.result;
          invariant(typeof imageDataURL === "string");

          const imageElement = await loadImageElement(imageDataURL);
          const size = {
            width: imageElement.width,
            height: imageElement.height,
          };

          return {
            fileId,
            size,
            imageElement,
            dataURL: imageDataURL,
            devicePixelRatio,
          };
        },
        loadImages: async () => {
          const value = localStorage.getItem("context");
          if (value === null) {
            return {};
          }

          const { files } = JSON.parse(value) as VisualizerMachineContext;
          const imageCache: ImageCache = {};

          for (const [fileId, { dataURL }] of Object.entries(files)) {
            imageCache[fileId] = await loadImageElement(dataURL);
          }

          return imageCache;
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
        isToolFixed: (context) => {
          return context.isToolFixed;
        },
      },
    }
  );
