import { MouseEventHandler } from "react";
import invariant from "tiny-invariant";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import {
  SHAPE_TYPES,
  VisualizerElement,
  VisualizerElementBase,
  VisualizerFreeDrawElement,
  VisualizerGenericElement,
  VisualizerLinearElement,
  VisualizerMachineContext,
  ZOOM,
} from "./machines/visualizerMachine";
import { v4 as uuidv4 } from "uuid";

// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
export const calculateMousePoint = ({
  canvasElement,
  event,
  zoom,
  origin,
}: {
  canvasElement: HTMLCanvasElement;
  event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
  zoom: VisualizerMachineContext["zoom"];
  origin: VisualizerMachineContext["origin"];
}) => {
  const rect = canvasElement.getBoundingClientRect();
  const scaleX = canvasElement.width / rect.width; // relationship bitmap vs. element for x
  const scaleY = canvasElement.height / rect.height; // relationship bitmap vs. element for y

  return {
    x: ((event.clientX - rect.left) * scaleX - origin.x) / zoom,
    y: ((event.clientY - rect.top) * scaleY - origin.y) / zoom,
  };
};

export type Point = { x: number; y: number };

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

  return calculateFreeDrawElementAbsolutePoint(element);
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
  } else if (element.shape === "line") {
    const [dx, dy] = element.points[element.points.length - 1];
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
  } else if (element.shape === "arrow") {
    const distance = calculateDistance(element.width, element.height);
    const arrowSize = Math.min(ARROW_MAX_SIZE, distance / 2);
    const [dx, dy] = element.points[element.points.length - 1];
    const angleInRadians = Math.atan2(dy, dx);

    const startX = element.x;
    const startY = element.y;

    const endX = element.x + dx;
    const endY = element.y + dy;

    let arrowDrawables: Drawable[] = [];

    // \
    arrowDrawables.push(
      generator.line(
        endX,
        endY,
        endX - arrowSize * Math.cos(angleInRadians + convertDegreeToRadian(30)),
        endY - arrowSize * Math.sin(angleInRadians + convertDegreeToRadian(30)),
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
        endX - arrowSize * Math.cos(angleInRadians - convertDegreeToRadian(30)),
        endY - arrowSize * Math.sin(angleInRadians - convertDegreeToRadian(30)),
        element.options
      )
    );

    return () => {
      arrowDrawables.forEach((drawable) => {
        roughCanvas.draw(drawable);
      });
    };
  } else {
    // freedraw
    return () => {
      ctx.save();

      ctx.beginPath();
      ctx.strokeStyle = element.options.stroke || "black";

      ctx.moveTo(element.x, element.y);
      for (let i = 1; i < element.points.length; i++) {
        const [dx, dy] = element.points[i];
        ctx.lineTo(element.x + dx, element.y + dy);
      }
      ctx.stroke();

      ctx.restore();
    };
  }
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

export const createElement = ({
  elementShape,
  drawStartPoint,
  elementOptions,
}: {
  elementShape: VisualizerMachineContext["elementShape"];
  drawStartPoint: VisualizerMachineContext["drawStartPoint"];
  elementOptions: VisualizerMachineContext["elementOptions"];
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

  // linear or freedraw
  return {
    ...elementBase,
    shape: elementShape,
    points: [[0, 0]],
  };
};
