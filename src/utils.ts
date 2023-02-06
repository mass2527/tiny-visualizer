import { MouseEventHandler } from "react";
import invariant from "tiny-invariant";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import {
  VisualizerElement,
  VisualizerMachineContext,
} from "./machines/visualizerMachine";

// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
export const calculateMousePoint = ({
  canvasElement,
  event,
  zoom,
}: {
  canvasElement: HTMLCanvasElement;
  event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
  zoom: VisualizerMachineContext["zoom"];
}) => {
  const rect = canvasElement.getBoundingClientRect();
  const scaleX = canvasElement.width / rect.width; // relationship bitmap vs. element for x
  const scaleY = canvasElement.height / rect.height; // relationship bitmap vs. element for y

  const canvasCenterDifference = calculateCanvasCenterDifference(
    canvasElement,
    zoom
  );

  return {
    x: ((event.clientX - rect.left) * scaleX + canvasCenterDifference.x) / zoom,
    y: ((event.clientY - rect.top) * scaleY + canvasCenterDifference.y) / zoom,
  };
};

export const calculateCanvasCenterDifference = (
  canvasElement: HTMLCanvasElement,
  zoom: VisualizerMachineContext["zoom"]
) => {
  return {
    x: (canvasElement.width / 2) * (zoom - 1),
    y: (canvasElement.height / 2) * (zoom - 1),
  };
};

export type Point = { x: number; y: number };

export const calculateAbsolutePoint = (element: VisualizerElement) => {
  const minX = Math.min(element.x, element.x + element.width);
  const maxX = Math.max(element.x, element.x + element.width);
  const minY = Math.min(element.y, element.y + element.height);
  const maxY = Math.max(element.y, element.y + element.height);

  return {
    minX,
    maxX,
    minY,
    maxY,
  };
};

export const calculateElementsAbsolutePoint = (
  elements: VisualizerElement[]
) => {
  return elements.reduce(
    (acc, copiedElement) => {
      const elementAbsolutePoint = calculateAbsolutePoint(copiedElement);

      return {
        minX: Math.min(acc.minX, elementAbsolutePoint.minX),
        maxX: Math.max(acc.maxX, elementAbsolutePoint.maxX),
        minY: Math.min(acc.minY, elementAbsolutePoint.minY),
        maxY: Math.max(acc.maxY, elementAbsolutePoint.maxY),
      };
    },
    {
      minX: Number.MAX_SAFE_INTEGER,
      maxX: 0,
      minY: Number.MAX_SAFE_INTEGER,
      maxY: 0,
    }
  );
};

export const calculateCenterPoint = (absolutePoint: {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}) => {
  return {
    x: (absolutePoint.minX + absolutePoint.maxX) / 2,
    y: (absolutePoint.minY + absolutePoint.maxY) / 2,
  };
};

export const isPointInsideOfElement = (
  point: Point,
  element: VisualizerElement
) => {
  const { minX, maxX, minY, maxY } = calculateAbsolutePoint(element);

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
  const selectionAbsolutePoint = calculateAbsolutePoint(selection);
  const elementAbsolutePoint = calculateAbsolutePoint(element);

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

export const generateDraw = (
  element: VisualizerElement,
  canvasElement: HTMLCanvasElement
) => {
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
    const lineDrawable = generator.line(
      element.x,
      element.y,
      element.x + element.width,
      element.y + element.height,
      element.options
    );
    return () => {
      roughCanvas.draw(lineDrawable);
    };
  } else {
    // element.shape === "arrow"
    const distance = calculateDistance(element.width, element.height);
    const arrowSize = Math.min(ARROW_MAX_SIZE, distance / 2);
    const angleInRadians = Math.atan2(element.height, element.width);

    const startX = element.x;
    const startY = element.y;
    const endX = element.x + element.width;
    const endY = element.y + element.height;

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
