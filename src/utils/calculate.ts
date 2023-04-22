import invariant from "tiny-invariant";
import {
  ElementOptions,
  FileId,
  Point,
  Tool,
  VisualizerElement,
  VisualizerShapeElementBase,
  VisualizerImageElement,
  VisualizerLinearElement,
  VisualizerMachineContext,
  ZOOM,
  VisualizerElementBase,
  VisualizerPointBasedElement,
  Size,
  VisualizerTextElement,
  VisualizerFreeDrawElement,
} from "../machines/visualizerMachine";
import {
  calculateDistance,
  calculateNormalizedValue,
  createRandomNumber,
} from "./math";
import {
  isFreeDrawShape,
  isGenericShape,
  isImageShape,
  isLinearShape,
  isPointBasedElement,
  isTextShape,
} from "./type-guard";
import * as uuid from "uuid";
import {
  AVAILABLE_OPTIONS,
  TEXTAREA_UNIT_LESS_LINE_HEIGHT,
} from "../constants";
import { mergeItems } from "./array";

export const calculateCanvasPoint = ({
  devicePixelRatio,
  event,
  zoom,
  origin,
}: {
  devicePixelRatio: number;
  event: {
    clientX: number;
    clientY: number;
  };
  zoom: VisualizerMachineContext["zoom"];
  origin: VisualizerMachineContext["origin"];
}) => {
  return {
    x: (event.clientX * devicePixelRatio - origin.x) / zoom,
    y: (event.clientY * devicePixelRatio - origin.y) / zoom,
  };
};

// calculate clientX, clientY from canvas point
export const calculateClientPoint = ({
  canvasPoint,
  zoom,
  origin,
  devicePixelRatio,
}: {
  canvasPoint: Point;
  zoom: VisualizerMachineContext["zoom"];
  origin: VisualizerMachineContext["origin"];
  devicePixelRatio: number;
}) => {
  return {
    x: (canvasPoint.x * zoom + origin.x) / devicePixelRatio,
    y: (canvasPoint.y * zoom + origin.y) / devicePixelRatio,
  };
};

export type AbsolutePoint = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export const calculateElementAbsolutePoint = (
  element: VisualizerElement
): AbsolutePoint => {
  if (isPointBasedElement(element)) {
    return calculatePointBasedElementAbsolutePoint(element);
  } else {
    return calculateAbsolutePointByElementBase(element);
  }
};

export const calculateElementSize = (element: VisualizerElement) => {
  const { minX, minY, maxX, maxY } = calculateElementAbsolutePoint(element);

  return {
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const calculateAbsolutePointByElementBase = (
  elementBase: VisualizerElementBase
) => {
  return {
    minX: elementBase.point.x,
    minY: elementBase.point.y,
    maxX: elementBase.point.x + elementBase.size.width,
    maxY: elementBase.point.y + elementBase.size.height,
  };
};

export const calculatePointBasedElementAbsolutePoint = (
  element: VisualizerPointBasedElement
) => {
  const { points } = element;
  return {
    minX: Math.min(...points.map((point) => element.point.x + point.x)),
    minY: Math.min(...points.map((point) => element.point.y + point.y)),
    maxX: Math.max(...points.map((point) => element.point.x + point.x)),
    maxY: Math.max(...points.map((point) => element.point.y + point.y)),
  };
};

export const calculateElementsAbsolutePoint = (
  elements: VisualizerElement[]
) => {
  return {
    minX: Math.min(
      ...elements.map((element) => calculateElementAbsolutePoint(element).minX)
    ),
    minY: Math.min(
      ...elements.map((element) => calculateElementAbsolutePoint(element).minY)
    ),
    maxX: Math.max(
      ...elements.map((element) => calculateElementAbsolutePoint(element).maxX)
    ),
    maxY: Math.max(
      ...elements.map((element) => calculateElementAbsolutePoint(element).maxY)
    ),
  };
};

export const calculateSelectedElementsAbsolutePoint = (
  elements: VisualizerElement[]
) => {
  const selectedElements = elements.filter(
    (element) => element.status === "selected"
  );

  return calculateElementsAbsolutePoint(selectedElements);
};

export const calculateCenterPoint = (absolutePoint: AbsolutePoint) => {
  return {
    x: (absolutePoint.minX + absolutePoint.maxX) / 2,
    y: (absolutePoint.minY + absolutePoint.maxY) / 2,
  };
};

export const isPointInsideOfAbsolutePoint = (
  { minX, maxX, minY, maxY }: AbsolutePoint,
  { x, y }: Point
) => {
  if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
    return true;
  }

  return false;
};

export const isIntersecting = (
  selection: VisualizerElementBase,
  elements: VisualizerElement[]
) => {
  const selectionAbsolutePoint = calculateAbsolutePointByElementBase(selection);
  const elementAbsolutePoint = calculateElementsAbsolutePoint(elements);

  if (selectionAbsolutePoint.minX > elementAbsolutePoint.maxX) {
    return false;
  }
  if (selectionAbsolutePoint.maxX < elementAbsolutePoint.minX) {
    return false;
  }
  if (selectionAbsolutePoint.minY > elementAbsolutePoint.maxY) {
    return false;
  }
  if (selectionAbsolutePoint.maxY < elementAbsolutePoint.minY) {
    return false;
  }
  if (
    selectionAbsolutePoint.maxX < elementAbsolutePoint.maxX &&
    selectionAbsolutePoint.minX > elementAbsolutePoint.minX &&
    selectionAbsolutePoint.maxY < elementAbsolutePoint.maxY &&
    selectionAbsolutePoint.minY > elementAbsolutePoint.minY
  ) {
    return false;
  }

  return true;
};

export const measureText = ({
  text,
  fontSize,
  fontFamily,
  lineHeight,
  canvasElement,
}: {
  text: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  canvasElement: HTMLCanvasElement;
}) => {
  const ctx = canvasElement.getContext("2d");
  invariant(ctx);

  ctx.save();

  const height = fontSize * lineHeight;
  ctx.font = `${fontSize}px ${fontFamily}`;
  const { fontBoundingBoxAscent, fontBoundingBoxDescent } =
    ctx.measureText(text);
  const lineGap = height - (fontBoundingBoxAscent + fontBoundingBoxDescent);

  const lines = text.split("\n");
  const widths = lines.map((text) => ctx.measureText(text).width);
  const maxWidth = Math.max(...widths);

  const devicePixelRatio = calculateDevicePixelRatio(canvasElement);

  ctx.restore();

  return {
    width: maxWidth * devicePixelRatio,
    height: height * lines.length * devicePixelRatio,
    lineHeight: height * devicePixelRatio,
    lineGap: lineGap * devicePixelRatio,
    fontSize: fontSize * devicePixelRatio,
  };
};

export const calculateDevicePixelRatio = (canvasElement: HTMLCanvasElement) => {
  return canvasElement.width / parseInt(canvasElement.style.width);
};

export const calculateNormalizedZoom = (
  zoom: VisualizerMachineContext["zoom"]
) => {
  return calculateNormalizedValue({
    max: ZOOM.MAX,
    value: zoom,
    min: ZOOM.MIN,
  });
};

export const createElement = ({
  elements,
  shape,
  drawStartPoint,
  elementOptions,
  devicePixelRatio,
  width,
  height,
  fileId,
  status,
}: {
  elements: VisualizerMachineContext["elements"];
  shape: VisualizerElement["shape"];
  drawStartPoint: VisualizerMachineContext["drawStartPoint"];
  elementOptions: VisualizerMachineContext["elementOptions"];
  devicePixelRatio: number;
  width?: VisualizerElement["size"]["width"];
  height?: VisualizerElement["size"]["height"];
  fileId?: FileId;
  status?: VisualizerElement["status"];
}): VisualizerElement => {
  const shapeElementBase: VisualizerShapeElementBase = {
    id: uuid.v4(),
    point: {
      x: drawStartPoint.x,
      y: drawStartPoint.y,
    },
    size: {
      width: width ?? 0,
      height: height ?? 0,
    },
    status: status ?? "idle",
    groupIds: [],
    options: {
      opacity: 100,
    },
  };
  if (isFreeDrawShape(shape)) {
    const freedrawElement: VisualizerFreeDrawElement = {
      ...shapeElementBase,
      shape,
      points: [{ x: 0, y: 0 }],
      options: {
        ...shapeElementBase.options,
        stroke: elementOptions.stroke,
        strokeWidth: elementOptions.strokeWidth,
      },
    };

    return freedrawElement;
  }
  if (isTextShape(shape)) {
    const { fontSize, fontFamily } = elementOptions;

    const textElement: VisualizerTextElement = {
      ...shapeElementBase,
      point: {
        ...shapeElementBase.point,
        y:
          shapeElementBase.point.y -
          (fontSize * TEXTAREA_UNIT_LESS_LINE_HEIGHT * devicePixelRatio) / 2,
      },
      shape,
      options: {
        ...shapeElementBase.options,
        stroke: elementOptions.stroke,
        fontSize,
        fontFamily,
      },
      text: "",
    };

    return textElement;
  }
  if (isImageShape(shape)) {
    invariant(fileId);

    const imageElement: VisualizerImageElement = {
      ...shapeElementBase,
      shape,
      fileId,
      scale: [1, 1],
    };

    return imageElement;
  }

  const existingSeeds = new Set(
    elements
      .map((element) => {
        if (
          element.shape === "rectangle" ||
          element.shape === "ellipse" ||
          element.shape === "line" ||
          element.shape === "arrow"
        ) {
          return element.seed;
        }
        return undefined;
      })
      .filter(Boolean)
  );

  if (isGenericShape(shape)) {
    return {
      ...shapeElementBase,
      options: elementOptions,
      seed: createRandomSeed(existingSeeds),
      shape,
    };
  }
  if (isLinearShape(shape)) {
    return {
      ...shapeElementBase,
      options: elementOptions,
      shape,
      points: [{ x: 0, y: 0 }],
      seed: createRandomSeed(existingSeeds),
    };
  }

  throw new Error(`shape ${shape}'s logic is not defined here`);
};

// https://github.com/rough-stuff/rough/wiki#seed
const SEED = {
  MIN: 1,
  MAX: 2 ** 31,
};
export const createRandomSeed = (existingSeeds: Set<number>) => {
  let randomSeed: number;
  do {
    randomSeed = createRandomNumber(SEED.MIN, SEED.MAX);
  } while (existingSeeds.has(randomSeed));

  return randomSeed;
};

// https://user-images.githubusercontent.com/70563791/218030908-1405ee82-638b-4885-89f2-f72329dc55b7.png
export const calculateChangeInPointOnZoom = ({
  targetPoint,
  updatedZoom,
  previousZoom,
}: {
  targetPoint: Point;
  updatedZoom: VisualizerMachineContext["zoom"];
  previousZoom: VisualizerMachineContext["zoom"];
}) => {
  const changeInZoom = updatedZoom - previousZoom;

  return {
    changeInX: targetPoint.x * changeInZoom,
    changeInY: targetPoint.y * changeInZoom,
  };
};

export const calculatePointCloseness = (
  linearElement: VisualizerLinearElement,
  threshold: number
) => {
  const { points } = linearElement;
  const lastPoint = points[points.length - 1];
  invariant(lastPoint);
  const secondLastPoint = points[points.length - 2];
  invariant(secondLastPoint);

  const distanceBetweenLastAndStartPoint = calculateDistance(
    lastPoint.x,
    lastPoint.y
  );
  const distanceBetweenLastTwoPoints = calculateDistance(
    lastPoint.x - secondLastPoint.x,
    lastPoint.y - secondLastPoint.y
  );

  return {
    isLastPointCloseToStartPoint: distanceBetweenLastAndStartPoint <= threshold,
    areLastTwoPointsClose: distanceBetweenLastTwoPoints <= threshold,
  };
};

export const calculateClosenessThreshold = (
  zoom: VisualizerMachineContext["zoom"]
) => {
  return 10 / zoom;
};

export const haveSamePoint = (point1: Point, point2: Point) => {
  if (point1.x === point2.x && point1.y === point2.y) {
    return true;
  }

  return false;
};

export const calculateViewportSize = ({
  size,
  devicePixelRatio,
  zoom,
}: {
  size: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
  zoom: number;
}) => {
  return {
    width: (size.width / devicePixelRatio) * zoom,
    height: (size.height / devicePixelRatio) * zoom,
  };
};

export const calculateViewportPoint = ({
  devicePixelRatio,
  canvasPoint,
  zoom,
  origin,
}: {
  devicePixelRatio: number;
  canvasPoint: Point;
  zoom: VisualizerMachineContext["zoom"];
  origin: VisualizerMachineContext["origin"];
}) => {
  return {
    x: (canvasPoint.x * zoom + origin.x) / devicePixelRatio,
    y: (canvasPoint.y * zoom + origin.y) / devicePixelRatio,
  };
};

export const createUuid = (id: string, name: string) => {
  const namespace = uuid.parse(id);
  const uuid5 = uuid.v5(name, namespace);

  return uuid5;
};

export const isSameGroup = (elements: VisualizerElement[]) => {
  const topLevelGroupIds = elements.map((element) => element.groupIds.at(-1));
  if (!topLevelGroupIds[0]) {
    return false;
  }

  return topLevelGroupIds.every(
    (topLevelGroupId) => topLevelGroupId === topLevelGroupIds[0]
  );
};

export const calculateSameGroup = (
  elements: VisualizerElement[],
  elementId: VisualizerElement["id"]
) => {
  const element = elements.find((element) => element.id === elementId);
  invariant(element);

  const isGroupedElement = element.groupIds.length !== 0;
  if (isGroupedElement) {
    const groupId = element.groupIds.at(-1);
    return elements.filter((element) => element.groupIds.at(-1) === groupId);
  } else {
    return [element];
  }
};

export const calculateScaledSize = (size: Size, maxSize: number) => {
  let width = size.width;
  let height = size.height;
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height *= maxSize / width;
      width = maxSize;
    } else {
      width *= maxSize / height;
      height = maxSize;
    }
  }

  return { width, height };
};

export const calculateReadableFileSize = (fileSize: number) => {
  if (fileSize < 1024) {
    return fileSize + "bytes";
  } else if (fileSize >= 1024 && fileSize < 1048576) {
    return (fileSize / 1024).toFixed(1) + "KB";
  } else if (fileSize >= 1048576) {
    return (fileSize / 1048576).toFixed(1) + "MB";
  }
};

export const calculateElementOptionValue = ({
  selectedElements,
  elementOptions,
  option,
}: {
  selectedElements: VisualizerElement[];
  elementOptions: ElementOptions;
  option:
    | keyof VisualizerMachineContext["elementOptions"]
    | keyof VisualizerElement["options"];
}) => {
  if (selectedElements.length === 0) {
    return elementOptions[option];
  }

  invariant(selectedElements[0]);
  if (selectedElements.length === 1) {
    return selectedElements[0].options[
      option as keyof VisualizerElement["options"]
    ];
  }

  //  selectedElements.length > 1
  // 1. have same value A:x, B:x, C:x

  const selectedElementsOptions = selectedElements.map((element) =>
    JSON.stringify(
      element.options[option as keyof VisualizerElement["options"]]
    )
  );
  if (
    selectedElementsOptions.every(
      (element) => element === selectedElementsOptions[0]
    )
  ) {
    return selectedElements[0].options[
      option as keyof VisualizerElement["options"]
    ];
  }

  // 2. only one have value A:x, B:undefined, C:undefined
  // 3. have different value A:x, B:y, C:z
  const options = selectedElements
    .map(
      (element) => element.options[option as keyof VisualizerElement["options"]]
    )
    .filter((element) => element !== undefined);

  if (options.length === 1) {
    return options[0];
  } else {
    return undefined;
  }
};

export const calculateShouldShowElementOptions = (
  tool: Tool,
  selectedElements: VisualizerElement[]
) => {
  if (selectedElements.length === 0) {
    return AVAILABLE_OPTIONS[tool];
  }

  if (selectedElements.length === 1 && selectedElements[0]) {
    return {
      ...AVAILABLE_OPTIONS[selectedElements[0].shape],
      copy: true,
      delete: true,
    };
  }

  const availableOptions = mergeItems(
    selectedElements.map((element) => AVAILABLE_OPTIONS[element.shape])
  );

  return availableOptions;
};
