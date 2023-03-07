import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { Direction } from "../components/ElementResizer";
import {
  VIRTUAL_POINT_HEIGHT,
  VIRTUAL_POINT_WIDTH,
} from "../components/VirtualPoint";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../constants";
import {
  Point,
  SHAPE_TYPES,
  VisualizerElement,
  VisualizerElementBase,
  VisualizerFreeDrawElement,
  VisualizerGenericElement,
  VisualizerLinearElement,
  VisualizerMachineContext,
  VisualizerTextElement,
  ZOOM,
} from "../machines/visualizerMachine";
import { removeLastItem } from "./array";

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

export const convertToViewportPoint = ({
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

type AbsolutePoint = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export const calculateElementAbsolutePoint = (
  element: VisualizerElement
): AbsolutePoint => {
  if (isGenericElement(element)) {
    return calculateGenericElementAbsolutePoint(element);
  }

  if (isLinearElement(element)) {
    return calculateLinearElementAbsolutePoint(element);
  }

  if (isFreeDrawElement(element)) {
    return calculateFreeDrawElementAbsolutePoint(element);
  }

  return calculateTextElementAbsolutePoint(element);
};

export const calculateElementSize = (element: VisualizerElement) => {
  const { minX, minY, maxX, maxY } = calculateElementAbsolutePoint(element);

  return {
    width: maxX - minX,
    height: maxY - minY,
  };
};

const calculateGenericElementAbsolutePoint = (
  element: VisualizerGenericElement
) => {
  return {
    minX: element.x,
    minY: element.y,
    maxX: element.x + element.width,
    maxY: element.y + element.height,
  };
};

const calculateLinearElementAbsolutePoint = (
  element: VisualizerLinearElement
) => {
  const { points } = element;

  return {
    minX: Math.min(...points.map((point) => element.x + point.x)),
    minY: Math.min(...points.map((point) => element.y + point.y)),
    maxX: Math.max(...points.map((point) => element.x + point.x)),
    maxY: Math.max(...points.map((point) => element.y + point.y)),
  };
};

export const calculateFreeDrawElementAbsolutePoint = (
  element: VisualizerFreeDrawElement
) => {
  const { points } = element;
  return {
    minX: Math.min(...points.map((point) => element.x + point.x)),
    minY: Math.min(...points.map((point) => element.y + point.y)),
    maxX: Math.max(...points.map((point) => element.x + point.x)),
    maxY: Math.max(...points.map((point) => element.y + point.y)),
  };
};

const calculateTextElementAbsolutePoint = (element: VisualizerTextElement) => {
  return {
    minX: element.x,
    minY: element.y,
    maxX: element.x + element.width,
    maxY: element.y + element.height,
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
  selection: VisualizerElement,
  element: VisualizerElement
) => {
  const selectionAbsolutePoint = calculateElementAbsolutePoint(selection);
  const elementAbsolutePoint = calculateElementAbsolutePoint(element);

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

export const calculateDistance = (width: number, height: number) => {
  return Math.hypot(width, height);
};

export const convertDegreeToRadian = (angleInDegrees: number) => {
  return (Math.PI * angleInDegrees) / 180;
};

const ARROW_MAX_SIZE = 50;

export const createDraw = (
  element: VisualizerElement,
  canvasElement: HTMLCanvasElement
): VoidFunction => {
  const ctx = canvasElement.getContext("2d");
  invariant(ctx);

  const roughCanvas = rough.canvas(canvasElement);
  const { generator } = roughCanvas;

  if (element.shape === "selection") {
    return () => {
      ctx.strokeRect(element.x, element.y, element.width, element.height);
    };
  } else if (element.shape === "rectangle") {
    const rectangleDrawable = generator.rectangle(
      element.x,
      element.y,
      element.width,
      element.height,
      { ...element.options, seed: element.seed }
    );
    return () => {
      roughCanvas.draw(rectangleDrawable);
    };
  } else if (element.shape === "ellipse") {
    const ellipseDrawable = generator.ellipse(
      element.x + element.width / 2,
      element.y + element.height / 2,
      element.width,
      element.height,
      { ...element.options, seed: element.seed }
    );
    return () => {
      roughCanvas.draw(ellipseDrawable);
    };
  } else if (isLinearElement(element)) {
    if (element.shape === "line") {
      const drawables: Drawable[] = [];
      const startPoint = {
        x: element.x,
        y: element.y,
      };

      for (const point of element.points) {
        const { x, y } = point;
        const lineDrawable = generator.line(
          startPoint.x,
          startPoint.y,
          element.x + x,
          element.y + y,
          { ...element.options, seed: element.seed }
        );
        drawables.push(lineDrawable);

        startPoint.x = element.x + x;
        startPoint.y = element.y + y;
      }

      return () => {
        drawables.forEach((drawable) => {
          roughCanvas.draw(drawable);
        });
      };
    } else {
      const arrowDrawables: Drawable[] = [];
      const startPoint = {
        x: element.x,
        y: element.y,
      };

      // if last and second last have same items, arrow will be disappear
      // so need to remove last item to continue showing previous arrow
      let { points } = element;
      if (points.length > 1) {
        const lastPoint = points[points.length - 1];
        invariant(lastPoint);

        const secondLastPoint = points[points.length - 2];
        invariant(secondLastPoint);

        if (haveSamePoint(lastPoint, secondLastPoint)) {
          points = removeLastItem(points);
        }
      }

      let index = 0;
      let previousPoint: Point | undefined;

      for (const point of points) {
        const { x, y } = point;
        const endX = element.x + x;
        const endY = element.y + y;

        // -
        arrowDrawables.push(
          generator.line(startPoint.x, startPoint.y, endX, endY, {
            ...element.options,
            seed: element.seed,
          })
        );

        startPoint.x = endX;
        startPoint.y = endY;

        const isLastPoint = index === points.length - 1;
        if (!isLastPoint) {
          index++;
          previousPoint = point;
          continue;
        }

        if (previousPoint === undefined) {
          continue;
        }

        const angleInRadians = Math.atan2(
          y - previousPoint.y,
          x - previousPoint.x
        );

        const distance = calculateDistance(
          x - previousPoint.x,
          y - previousPoint.y
        );
        const arrowSize = Math.min(ARROW_MAX_SIZE, distance / 2);

        // \
        arrowDrawables.push(
          generator.line(
            endX,
            endY,
            endX -
              arrowSize * Math.cos(angleInRadians + convertDegreeToRadian(30)),
            endY -
              arrowSize * Math.sin(angleInRadians + convertDegreeToRadian(30)),
            { ...element.options, seed: element.seed }
          )
        );
        // /
        arrowDrawables.push(
          generator.line(
            endX,
            endY,
            endX -
              arrowSize * Math.cos(angleInRadians - convertDegreeToRadian(30)),
            endY -
              arrowSize * Math.sin(angleInRadians - convertDegreeToRadian(30)),
            { ...element.options, seed: element.seed }
          )
        );
      }

      return () => {
        arrowDrawables.forEach((drawable) => {
          roughCanvas.draw(drawable);
        });
      };
    }
  } else if (element.shape === "freedraw") {
    return () => {
      ctx.save();

      ctx.beginPath();
      ctx.lineWidth = element.options.strokeWidth!;
      ctx.strokeStyle = element.options.stroke || "black";

      ctx.moveTo(element.x, element.y);
      for (let i = 1; i < element.points.length; i++) {
        const point = element.points[i];
        invariant(point);

        const { x, y } = point;
        ctx.lineTo(element.x + x, element.y + y);
      }
      ctx.stroke();

      ctx.restore();
    };
  } else {
    return () => {
      ctx.save();

      const { fontSize, lineGap, lineHeight } = measureText({
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
        text: element.text,
        canvasElement,
      });

      ctx.textBaseline = "top";
      ctx.font = `${fontSize}px ${element.fontFamily}`;

      const lines = element.text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const text = lines[i];
        if (text) {
          ctx.fillText(text, element.x, element.y + lineGap + i * lineHeight);
        }
      }

      ctx.restore();
    };
  }
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

const platform =
  window.navigator?.userAgentData?.platform ||
  window.navigator?.platform ||
  "unknown";

const testPlatform = (regex: RegExp) => regex.test(platform);

const isMac = () => testPlatform(/^mac/i);

export const isWithPlatformMetaKey = (event: {
  metaKey: boolean;
  ctrlKey: boolean;
}) => (isMac() ? event.metaKey : event.ctrlKey);

export const convertToPercent = (ratio: number) => {
  return ratio * 100;
};

export const convertToRatio = (percent: number) => {
  return percent / 100;
};

export const calculateNormalizedValue = ({
  max,
  value,
  min,
}: {
  max: number;
  value: number;
  min: number;
}) => {
  return Math.max(min, Math.min(value, max));
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

export const isGenericElementShape = (
  shape: VisualizerElement["shape"]
): shape is VisualizerGenericElement["shape"] => {
  return SHAPE_TYPES[shape] === "generic";
};

export const isGenericElement = (
  element: VisualizerElement
): element is VisualizerGenericElement => {
  return isGenericElementShape(element.shape);
};

const isLinearElementShape = (
  shape: VisualizerElement["shape"]
): shape is VisualizerLinearElement["shape"] => {
  return SHAPE_TYPES[shape] === "linear";
};

export const isLinearElement = (
  element: VisualizerElement
): element is VisualizerLinearElement => {
  return isLinearElementShape(element.shape);
};

export const isFreeDrawElementShape = (
  shape: VisualizerElement["shape"]
): shape is VisualizerFreeDrawElement["shape"] => {
  return SHAPE_TYPES[shape] === "freedraw";
};

export const isFreeDrawElement = (
  element: VisualizerElement
): element is VisualizerFreeDrawElement => {
  return isFreeDrawElementShape(element.shape);
};

export const isTextElementShape = (
  shape: VisualizerElement["shape"]
): shape is VisualizerTextElement["shape"] => {
  return SHAPE_TYPES[shape] === "text";
};

export const isTextElement = (
  element: VisualizerElement
): element is VisualizerTextElement => {
  return isTextElementShape(element.shape);
};

export const createElement = ({
  elements,
  elementShape,
  drawStartPoint,
  elementOptions,
  devicePixelRatio,
}: {
  elements: VisualizerMachineContext["elements"];
  elementShape: VisualizerMachineContext["elementShape"];
  drawStartPoint: VisualizerMachineContext["drawStartPoint"];
  elementOptions: VisualizerMachineContext["elementOptions"];
  devicePixelRatio: number;
}): VisualizerElement => {
  const elementBase: VisualizerElementBase = {
    id: uuidv4(),
    x: drawStartPoint.x,
    y: drawStartPoint.y,
    width: 0,
    height: 0,
    status: "idle",
    options: elementOptions,
  };

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

  if (isGenericElementShape(elementShape)) {
    if (elementShape === "selection") {
      return {
        ...elementBase,
        shape: elementShape,
      };
    } else {
      return {
        ...elementBase,
        shape: elementShape,
        seed: createRandomSeed(existingSeeds),
      };
    }
  }

  if (
    isLinearElementShape(elementShape) ||
    isFreeDrawElementShape(elementShape)
  ) {
    if (isLinearElementShape(elementShape)) {
      return {
        ...elementBase,
        shape: elementShape,
        points: [{ x: 0, y: 0 }],
        seed: createRandomSeed(existingSeeds),
      };
    } else {
      return {
        ...elementBase,
        shape: elementShape,
        points: [{ x: 0, y: 0 }],
      };
    }
  }
  const { fontSize, fontFamily } = elementOptions;

  return {
    ...elementBase,
    y:
      elementBase.y -
      (fontSize * TEXTAREA_UNIT_LESS_LINE_HEIGHT * devicePixelRatio) / 2,
    shape: elementShape,
    fontSize,
    fontFamily,
    text: "",
  };
};

const createRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * max) + min;
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

export const getClosenessThreshold = (
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

export const calculateFixedPoint = (
  element:
    | VisualizerGenericElement
    | VisualizerTextElement
    | VisualizerFreeDrawElement,
  direction: Direction
): Point => {
  if (isFreeDrawElement(element)) {
    const { minX, minY, maxX, maxY } = calculateElementAbsolutePoint(element);
    const width = maxX - minX;
    const height = maxY - minY;

    switch (direction) {
      case "up-left":
        return {
          x: minX + width,
          y: minY + height,
        };
      case "up-right":
        return {
          x: minX,
          y: minY + height,
        };
      case "down-left":
        return {
          x: minX + width,
          y: minY,
        };
      case "down-right":
        return {
          x: minX,
          y: minY,
        };
      case "up":
        return {
          x: minX + width / 2,
          y: minY + height,
        };
      case "left":
        return {
          x: minX + width,
          y: minY + height / 2,
        };
      case "right":
        return {
          x: minX,
          y: minY + height / 2,
        };
      case "down":
        return {
          x: minX + width / 2,
          y: minY,
        };
    }
  }

  switch (direction) {
    case "up-left":
      return {
        x: element.x + element.width,
        y: element.y + element.height,
      };
    case "up-right":
      return {
        x: element.x,
        y: element.y + element.height,
      };
    case "down-left":
      return {
        x: element.x + element.width,
        y: element.y,
      };
    case "down-right":
      return {
        x: element.x,
        y: element.y,
      };
    case "up":
      return {
        x: element.x + element.width / 2,
        y: element.y + element.height,
      };
    case "left":
      return {
        x: element.x + element.width,
        y: element.y + element.height / 2,
      };
    case "right":
      return {
        x: element.x,
        y: element.y + element.height / 2,
      };
    case "down":
      return {
        x: element.x + element.width / 2,
        y: element.y,
      };
  }
};

export const calculateElementViewportSize = ({
  element,
  devicePixelRatio,
  zoom,
}: {
  element: VisualizerElement;
  devicePixelRatio: number;
  zoom: number;
}) => {
  return {
    width: (element.width / devicePixelRatio) * zoom,
    height: (element.height / devicePixelRatio) * zoom,
  };
};

export const createElementVirtualPoints = ({
  element,
  devicePixelRatio,
  origin,
  zoom,
}: {
  element: VisualizerElement;
  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
}) => {
  const absolutePoint = calculateElementAbsolutePoint(element);
  const elementViewportPoint = convertToViewportPoint({
    canvasPoint: {
      x: absolutePoint.minX,
      y: absolutePoint.minY,
    },
    devicePixelRatio,
    origin,
    zoom,
  });
  const elementViewportSize = calculateElementViewportSize({
    element,
    devicePixelRatio,
    zoom,
  });

  const virtualPoints: {
    direction: Direction;
    left: number;
    top: number;
  }[] = [
    {
      direction: "up-left",
      left: elementViewportPoint.x,
      top: elementViewportPoint.y,
    },
    {
      direction: "up-right",
      left: elementViewportPoint.x + elementViewportSize.width,
      top: elementViewportPoint.y,
    },
    {
      direction: "down-left",
      left: elementViewportPoint.x,
      top: elementViewportPoint.y + elementViewportSize.height,
    },
    {
      direction: "down-right",
      left: elementViewportPoint.x + elementViewportSize.width,
      top: elementViewportPoint.y + elementViewportSize.height,
    },
  ];

  if (isTextElement(element)) {
    return virtualPoints;
  }

  const haveEnoughWidth =
    Math.abs(elementViewportSize.width) >= 2 * (3 * VIRTUAL_POINT_WIDTH);
  if (haveEnoughWidth) {
    virtualPoints.push(
      {
        direction: "up",
        left: elementViewportPoint.x + elementViewportSize.width / 2,
        top: elementViewportPoint.y,
      },
      {
        direction: "down",
        left: elementViewportPoint.x + elementViewportSize.width / 2,
        top: elementViewportPoint.y + elementViewportSize.height,
      }
    );
  }

  const haveEnoughHeight =
    Math.abs(elementViewportSize.height) >= 2 * (3 * VIRTUAL_POINT_HEIGHT);
  if (haveEnoughHeight) {
    virtualPoints.push(
      {
        direction: "left",
        left: elementViewportPoint.x,
        top: elementViewportPoint.y + elementViewportSize.height / 2,
      },
      {
        direction: "right",
        left: elementViewportPoint.x + elementViewportSize.width,
        top: elementViewportPoint.y + elementViewportSize.height / 2,
      }
    );
  }

  return virtualPoints;
};

const MARGIN = 8;
export const strokeDashedRectangle = (
  ctx: CanvasRenderingContext2D,
  absolutePoint: AbsolutePoint
) => {
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(
    absolutePoint.minX - MARGIN,
    absolutePoint.minY - MARGIN,
    absolutePoint.maxX - absolutePoint.minX + MARGIN * 2,
    absolutePoint.maxY - absolutePoint.minY + MARGIN * 2
  );
  ctx.setLineDash([]);
};

export * from "./resize";
export * from "./array";