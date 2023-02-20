import invariant from "tiny-invariant";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
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
} from "./machines/visualizerMachine";
import { v4 as uuidv4 } from "uuid";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "./constants";

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
  return element.points.reduce(
    (result, point) => {
      const [dx, dy] = point;

      return {
        minX: Math.min(result.minX, element.x + dx),
        minY: Math.min(result.minY, element.y + dy),
        maxX: Math.max(result.maxX, element.x + dx),
        maxY: Math.max(result.maxY, element.y + dy),
      };
    },
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );
};

export const calculateFreeDrawElementAbsolutePoint = (
  element: VisualizerFreeDrawElement
) => {
  return element.points.reduce(
    (result, point) => {
      const [dx, dy] = point;

      return {
        minX: Math.min(result.minX, element.x + dx),
        minY: Math.min(result.minY, element.y + dy),
        maxX: Math.max(result.maxX, element.x + dx),
        maxY: Math.max(result.maxY, element.y + dy),
      };
    },
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );
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
  return elements.reduce(
    (result, copiedElement) => {
      const elementAbsolutePoint = calculateElementAbsolutePoint(copiedElement);

      return {
        minX: Math.min(result.minX, elementAbsolutePoint.minX),
        maxX: Math.max(result.maxX, elementAbsolutePoint.maxX),
        minY: Math.min(result.minY, elementAbsolutePoint.minY),
        maxY: Math.max(result.maxY, elementAbsolutePoint.maxY),
      };
    },
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );
};

export const calculateCenterPoint = (absolutePoint: AbsolutePoint) => {
  return {
    x: (absolutePoint.minX + absolutePoint.maxX) / 2,
    y: (absolutePoint.minY + absolutePoint.maxY) / 2,
  };
};

export const isPointInsideOfElement = (
  point: Point,
  element: VisualizerElement
) => {
  const { minX, maxX, minY, maxY } = calculateElementAbsolutePoint(element);

  if (
    point.x >= minX &&
    point.x <= maxX &&
    point.y >= minY &&
    point.y <= maxY
  ) {
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
  return true;
};

export const calculateDistance = (width: number, height: number) => {
  return Math.sqrt(width ** 2 + height ** 2);
};

export const convertDegreeToRadian = (angleInDegrees: number) => {
  return (Math.PI * angleInDegrees) / 180;
};

const ARROW_MAX_SIZE = 30;

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
      element.options
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
      element.options
    );
    return () => {
      roughCanvas.draw(ellipseDrawable);
    };
  } else if (isLinearElement(element)) {
    if (element.shape === "line") {
      const point = element.points[element.points.length - 1];
      invariant(point);

      const [dx, dy] = point;
      const lineDrawable = generator.line(
        element.x,
        element.y,
        element.x + dx,
        element.y + dy,
        element.options
      );
      return () => {
        roughCanvas.draw(lineDrawable);
      };
    } else {
      const distance = calculateDistance(element.width, element.height);
      const arrowSize = Math.min(ARROW_MAX_SIZE, distance / 2);
      const point = element.points[element.points.length - 1];
      invariant(point);

      const [dx, dy] = point;
      const angleInRadians = Math.atan2(dy, dx);

      const startX = element.x;
      const startY = element.y;

      const endX = element.x + dx;
      const endY = element.y + dy;

      const arrowDrawables: Drawable[] = [];

      // \
      arrowDrawables.push(
        generator.line(
          endX,
          endY,
          endX -
            arrowSize * Math.cos(angleInRadians + convertDegreeToRadian(30)),
          endY -
            arrowSize * Math.sin(angleInRadians + convertDegreeToRadian(30)),
          element.options
        )
      );
      // -
      arrowDrawables.push(
        generator.line(startX, startY, endX, endY, element.options)
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
          element.options
        )
      );

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

        const [dx, dy] = point;
        ctx.lineTo(element.x + dx, element.y + dy);
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
  const maxWidth = lines.reduce((currentMaxWidth, currentText) => {
    const { width } = ctx.measureText(currentText);
    return Math.max(currentMaxWidth, width);
  }, 0);

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

const calculateDevicePixelRatio = (canvasElement: HTMLCanvasElement) => {
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
  maximum,
  value,
  minimum,
}: {
  maximum: number;
  value: number;
  minimum: number;
}) => {
  return Math.max(minimum, Math.min(value, maximum));
};

export const calculateNormalizedZoom = (
  zoom: VisualizerMachineContext["zoom"]
) => {
  return calculateNormalizedValue({
    maximum: ZOOM.MAXIMUM,
    value: zoom,
    minimum: ZOOM.MINIMUM,
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
  elementShape,
  drawStartPoint,
  elementOptions,
  devicePixelRatio,
}: {
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
    isSelected: false,
    options: elementOptions,
    isDeleted: false,
  };

  if (isGenericElementShape(elementShape)) {
    return {
      ...elementBase,
      shape: elementShape,
    };
  }

  if (
    isLinearElementShape(elementShape) ||
    isFreeDrawElementShape(elementShape)
  ) {
    return {
      ...elementBase,
      shape: elementShape,
      points: [[0, 0]],
    };
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
