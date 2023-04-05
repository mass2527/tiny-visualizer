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
  /** @xstate-layout N4IgpgJg5mDOIC5QDcCWsCuBDANqgXmAE4AEAtlgMYAWqAdmAHSoQ5gDEAIgEoCCA6gH0AygBVe3UQG0ADAF1EoAA4B7WKgAuqFXUUgAHogBsRgOyMAnAEYALDKNWArEbumATKYA0IAJ6JbABxWjAFuATIyjo7WAMwxNhYAvoneaJi4BMTkVLQMzKwcAMIAErwAcgDiAKKCogDydQAysgpIIKrqWjp6hggm5tZ2Ds6uHt5+CG4RjKaOEW4xFjZGUTIxyano2HiEpBQ09EwsbFx8FSLiki16HZraum29-Za29k4uMu5evogLMeZhKxuZYBCwBAKmIwbEBpbaZPY5Q75E7CKqNKqFURVTiCNFVACyVTKomEjE4eKx1zaty6D1ATzMLyG71G3wmQMijCBcw8wM+9mhsIyu2yBzyxw4qPRmOxuPRhOJpMKdQACgBNKnKNR3bqPYyMwZvEafMY-BAxYEBSwWezzUymCxuJIpGFbYVZfa5I4FdhSjFYnF4hUkxgq3hiKqa9ra2k9fUDV7DD5fca-G1W0H2WYxRyLf6Ct07D2I8U+-F1ACqqME5YAapH5DcY-c4+bTMEbLmrFYLIsZI6bGz-GZzDJlhZojEe+ErOsXUKiwixd6TgBJYRyglE0QiUoqmoAMVXAA1ZfUKhV0VGaS29X0DYmWSah+bgVznMDIbnBxPTAX0ouopesikp4jKgbytuSoVtIjbUs2ur0vGTJGsmpoTHEjg2IwCS2iMyxGG4jj-nCIqekiErsCU5TVJuwaCKqoirnUZTCNeCF0gYyGGkmrKpggPYyG4lhGAEzgxKJE7hG4JHukuwGUdRlQ1AAWg0+LsZ0t5IfeCbMsaKZmjYUyMEY-b-EEQKmBasmAeRpYnEptFqXU+KCPwq6iMUggqquZQlJpOqcQyemoXxZqOFYo6EXMYntmCNgBLZ8JARRPrVGIFbcFUoblIFsZ3s8PFPoZEwODEjCRVEFgWGYcz-H+86Fil9krhwxTrvU3BqoIFYqpwvCUnBWpaYhXG6ShvHPvxpj9iJAQrLYbhWKC3bJWRJZtew-DcJ5NRiBIsGtCNQWtkVj4Geh-juFaHydjEESRb2zqbABLWbSB7BBlBjB+pigi8I0zTDdGo3BdxF1oS+4RGDhy0LZEvZYXOr2kcWy6fTte24pwnn5dp43nfpUP8VYRgWlyEJ2NyATxGs63owpPrZcIq4qftlxHU2YNnQ+xPhRMwJYZVU7-LOYnRECDPyWlJwqnUfmiIwfUDViFyHfjY0hZNJVXZMJgyIwY42DEoJTLNY4o66b0bRjlF-QGdE-RU3CViqmvgxNxWXS+PY1XDUU3Q4CwrdLqUOaB0qO99irK5Urt9R7vOhVNpW-P2jghKYiXAmZ4RiWHrWfWGZTq1cIM3lrEP89NZo5rTXK9qJ5NuOTMizoXH2Uau+K8LRfWNHUvCcEnd6OPaISzkCIJBFOvv2BVC0mLT7hzI4MlNTbjNIhARBYAA7vQUCnAIo86d2NjYZfs5LCYSzOKTNjdly7cJFYawNUlm9ozLeS7wfR8T5CCJCPCuHFWyzkZHMUwtMoiznHhOUmKxM5k1NisPMUUFidwxv-Q+dBj7knRGrB2zEyhn3GpA8w0DYGRRzA6Rw-EJyG0CGggitUarYOArgwByoyhlH9GXLm8EeZ3koZVT4ND4H0NJrmCwRtPjkzMmEB6X9UZyXDkwf+UAoCAJ4H3chvQyZGDkcscyxjlpRUvvxNwCw5FmScJ8G05MrCcJ3nvbRuizi4jKKA46oNTqiPTKZeKTp6oZwYWaBYl8RZAjMIOAIoxXF5CUMQdQsAtD4PYAYxAmE7EuCdMYiwDoiLQ2CHMeY-xcztxMMRb+6ii7cPwSQFQpB95EDuE0sAdAICQCyWAkROk+SjhgStCIElyaQhkY6GYK1YrWQiCsRqai7IfUaVAZprT2kZPWV0npEAslWD8ZXT2QyjYjPCGsEw-wjCk3tMJS+VVBwWhqhOJJTBkCpPuCQIgYA2BYFgL07J5ocx5OMuwopjpx7WKCLDTszgmGREiqo62P8NGMDaR04+WM1YgKBWI6hOZaEIIieye0Vpx4RFWhEd+Tg3noq2YA7FDYjngNETfUy48oiFIepYpBcxTLkyWE-RF7YrYLnehjJQ-ztnsAgDoI4dBkAqAANbvOarbYCUr0lHwQPQJVlAsC0haHiiSVCJGEqkYgyJtNggrVmFMdenYBx0q1TK4gRAWmMCUDgQ1AAzFpZBGDio1UiV1Oq9UqANUa+QJqoHmrgXQq1gsBymSGGJKcYllp0vdS0kgOAVAeMyXiyK5gLRBCKfacyOZ+IPVzFyIYy1aFfhsHSygKglA+EAXK8UiqVVqq3r-JgbaO3ht7VG+4xr+kBPPhJYSBKE3Epra3bC2d7B-GDssFtdSVkY2HZ2zJOaiBep9Rof1RBA3Bu3nkPdo79WGonTGqdBUZ3kxCCbbOCw5h2FNjW9+hsPiEUEjIWmHhW0YA0DK7tCqlWqqDeqq9Q7wPbN1WO+9OhJ0soGRQ2d4iYEWsTSSnJ8QAQfDEuCT4CQwMQcAYe49fqA1wYHWiygSHb2RrQ3QDD3Np3YdfQk-4xkcxjjWAEX9iV61rpsRCUErzt0SuAm2ugDBKAyr0fwPFor62dgWqvIp5NH6dkYA9UxiUzJgnJq2nQymZW8P4ZiPFhFzBPyfhfLCDpwSk3iBmKqXZbCzjFfBwdjBFPWZ4SxOz0hDncefRQm0FUzA9lCWscJMiFiMEBGsL9oRzJ0p+eofAgCWZsxqLip9BNDFBIS46JhD0JyEcmOvJzZn7Ar2UbluABBCtVFZuzDT78jOhASU-CSdgwjWOMrDahqwbRgrpRgJQEB71NNUPQDQ7B5aK2Vv1QazLovlf8EsCqxn3CXyEtnaxjgIQiXfg9Kcl8vhzYW0t9ZK26BrY28SLbqsSs+KBctFYpkIRYTWEtOL1j2y2o+A9e1CSXAuqwEpwBJc-s2hQURC+T9IQzZrYlExTiwiOicLODeyz5OhoR3QJH5RvG+L21Xc078UEQgcCsR0OYbl12iIbS+El251dqkslF9TVl7zwTstgZAukaBIACtgKnAVlfpwTpr4Jx6zEsRYW57ZTIThWk6JYkJQgup+WgMA+8SCoAoDAPNKgsAQC7fK5gvbYOXqC0oE3qAzcW6t2AG3du2PjvQ4+zDPHDFcqNgk8IOdzEebNN2JwOFexlsIlMLBcmQ3JI917y3WBrf5v9weogHqj3evo+exjqKi7u7AKb83Oe8+2-t-glDd7o1yBNeCUyftnCfHc7YUmUxDbAjiJg2qa7jc1893Xn3fu9lAN6iqQew9ZQ9z7rt4RoffjwJwrOCIP4HoOFJt2ORDV36E87EJALTGi71992s2VjuI0u8C2i2-JA1kt-Y23v7xjzBY6IkUpdhCJ8KTMBovFFI6GsIlKbMsHSm-vfrRqXqegxq7q-jPh-hGoHpxsHnTicpFNhM1rDvYmCL7GTOSmYIMOYgkMiqgUXPnk3sfFBk7jBv2pXh9PQQHhxlxhvjFr0J3oRBJKCIsMYsdrctEFyGTIzpEAfolHShwYXsXnRsgeXrQewY3pwd-orp7AALTdj-ruBxBhCgjRC1RuCkzgjCSzALJ86661Iuh0AqA9LwBtCqHLi4GtjaE2KGyEqOjGKDiRBjhmFmjaGZwvI1TwomxOCjZwEFDuF3jGTCRJ6Sz3aWT1aBzkrUqiRvz3Qk5C47pcKi5HxxHnyjKVQxS2DRDZx1YyKLC4btiDiuCfAuLp4IaMBaI6L4LFEUKzSwwRAwI2iOhBCNrWKCHyL2hTjlS2K5GuHATyFQBdG9C6HuBGbVStwG4BHGS3KDjpblI1Smy9iZouqfLaqdE8H7bmgjAzA8hCFLA9g1rrxyLtxzJhAAHjx0prIbIkAYrbIkC7KQALFb4mBGwmwziDhGIrC3IUz3zAb2gOjEZbqk4Z7vKfI6DfK-JgD-L-FnH061qwyiQtaJiGHWImDYSHaXwp6iRYR0rfFFHYmeyuZnKoI9gCbuBWBa6PGzRkwjJESUrw4nHzF0kQLAYrrZzZwSRGKfAxDQpiQhBOJMIPErAIl5Fk55CHo26FoCknS8HDhFICpCRjjAHZygg1r9hOZOIrQrRR6C4zFIg3qnFannHvzhCVSzTGbWDAgWlLpETWhvA1RY6cpUbbIAkCTAaGwUpunTyel1wj6J5rrfgSTWCWZKZgAqa0kOn05ky6kGxTCJSzRGma5x5YSwyzBfgGx4a1Ttb5Zpn+LakCSzRyJwntweCrrOD1ZEQeAiT9gtb-BtYtFBbzaLY-GvYaDBk9j9buAGzGKWRThBGCySQ752DZaTEmDw6I72k1nnHK44SiRxTq5VH3E2iWAmz4nLzjJQh9loofHomS5vYy7ony4QDBmtw2KVRRLRBES0wuC+zWTYQ9iRTMngjua1KImtHV617e656+5zHBlLyWBYS5juCQqXyzn+BQFGzH7WQJJjKRQT7gVv70FYnpn0kJJlLLrOYRDWAJJH6zjWiGEskWlKk2nijoGFHrnHKtgLDa45jLAeDXKIw2CgFjghAwpBD9jLCcnJDJBAA */
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

            IMAGE_UPLOAD: {
              target: "preview image loading",
              actions: "assignImageFile",
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

        "drawing element selected": {
          entry: ["selectDrawingElement", "resetDrawingElementId"],

          always: "version released",
        },

        "preview image loading": {
          invoke: {
            src: "loadPreviewImage",
            onDone: {
              target: "preview image loaded",
            },
            onError: {
              target: "error logging",
              actions: "resetCursor",
            },
          },
        },

        "preview image loaded": {
          on: {
            DRAW_UPLOADED_IMAGE: {
              target: "image drawing",
              actions: ["assignDrawStartPoint"],
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

          const imageElement: VisualizerImageElement = {
            id: uuidv4(),
            x: context.drawStartPoint.x,
            y: context.drawStartPoint.y,
            status: "selected",
            options: context.elementOptions,
            groupIds: [],
            shape: "image",

            width: data.size.width,
            height: data.size.height,
            fileId: data.fileId,
          };

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
        loadImageInfo: async (context) => {
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

          return { fileId, size, imageElement, dataURL: imageDataURL };
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
