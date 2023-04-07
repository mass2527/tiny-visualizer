import invariant from "tiny-invariant";
import {
  AbsolutePoint,
  calculateElementAbsolutePoint,
  calculateElementSize,
  isGenericElement,
  isImageElement,
  isTextElement,
  measureText,
  removeLastItem,
  replaceNthItem,
} from ".";

import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../constants";
import {
  Point,
  VisualizerElement,
  VisualizerGenericElement,
  VisualizerImageElement,
  VisualizerLinearElement,
  VisualizerPointBasedElement,
  VisualizerTextElement,
} from "../machines/visualizerMachine";

type HorizontalDirection = "left" | "right";
type VerticalDirection = "up" | "down";
export type OrthogonalDirection = HorizontalDirection | VerticalDirection;
export type DiagonalDirection = `${VerticalDirection}-${HorizontalDirection}`;
export type Direction =
  | HorizontalDirection
  | VerticalDirection
  | DiagonalDirection;

export const isDiagonalDirection = (
  direction: Direction
): direction is DiagonalDirection => {
  return (
    direction === "up-left" ||
    direction === "up-right" ||
    direction === "down-left" ||
    direction === "down-right"
  );
};

type Quadrant = 1 | 2 | 3 | 4;
const calculateQuadrant = (point: Point, origin: Point): Quadrant => {
  if (point.x > origin.x && point.y > origin.y) {
    return 1;
  }

  if (point.x < origin.x && point.y > origin.y) {
    return 2;
  }

  if (point.x > origin.x && point.y < origin.y) {
    return 3;
  }

  return 4;
};

export const calculateDiagonalDirection = (
  currentCanvasPoint: Point,
  resizeFixedPoint: Point
): DiagonalDirection => {
  const quadrant = calculateQuadrant(currentCanvasPoint, resizeFixedPoint);

  switch (quadrant) {
    case 1:
      return "down-right";
    case 2:
      return "down-left";
    case 3:
      return "up-right";
    case 4:
      return "up-left";
  }
};

export const calculateOrthogonalDirection = ({
  currentCanvasPoint,
  resizeFixedPoint,
  direction,
}: {
  currentCanvasPoint: Point;
  resizeFixedPoint: Point;
  direction: OrthogonalDirection;
}): OrthogonalDirection => {
  const quadrant = calculateQuadrant(currentCanvasPoint, resizeFixedPoint);

  switch (direction) {
    case "left":
    case "right":
      switch (quadrant) {
        case 1:
        case 3:
          return "right";
        case 2:
        case 4:
          return "left";
      }

    // eslint-disable-next-line no-fallthrough
    case "up":
    case "down":
      switch (quadrant) {
        case 1:
        case 2:
          return "down";
        case 3:
        case 4:
          return "up";
      }
  }
};

export const resizeGenericElement = ({
  element,
  direction,
  currentCanvasPoint,
  resizeFixedPoint,
}: {
  element: VisualizerGenericElement;
  direction: Direction;
  currentCanvasPoint: Point;
  resizeFixedPoint: Point;
}): VisualizerGenericElement => {
  if (isDiagonalDirection(direction)) {
    const diagonalDirection = calculateDiagonalDirection(
      currentCanvasPoint,
      resizeFixedPoint
    );
    switch (diagonalDirection) {
      case "up-left":
        return {
          ...element,
          x: currentCanvasPoint.x,
          y: currentCanvasPoint.y,
          width: resizeFixedPoint.x - currentCanvasPoint.x,
          height: resizeFixedPoint.y - currentCanvasPoint.y,
        };
      case "up-right":
        return {
          ...element,
          x: resizeFixedPoint.x,
          y: currentCanvasPoint.y,
          width: currentCanvasPoint.x - resizeFixedPoint.x,
          height: resizeFixedPoint.y - currentCanvasPoint.y,
        };
      case "down-left":
        return {
          ...element,
          x: currentCanvasPoint.x,
          y: resizeFixedPoint.y,
          width: resizeFixedPoint.x - currentCanvasPoint.x,
          height: currentCanvasPoint.y - resizeFixedPoint.y,
        };
      case "down-right":
        return {
          ...element,
          x: resizeFixedPoint.x,
          y: resizeFixedPoint.y,
          width: currentCanvasPoint.x - resizeFixedPoint.x,
          height: currentCanvasPoint.y - resizeFixedPoint.y,
        };
    }
  }

  const orthogonalDirection = calculateOrthogonalDirection({
    currentCanvasPoint,
    direction,
    resizeFixedPoint,
  });
  switch (orthogonalDirection) {
    case "up":
      return {
        ...element,
        y: currentCanvasPoint.y,
        height: resizeFixedPoint.y - currentCanvasPoint.y,
      };
    case "left":
      return {
        ...element,
        x: currentCanvasPoint.x,
        width: resizeFixedPoint.x - currentCanvasPoint.x,
      };
    case "right":
      return {
        ...element,
        x: resizeFixedPoint.x,
        width: currentCanvasPoint.x - resizeFixedPoint.x,
      };
    case "down":
      return {
        ...element,
        y: resizeFixedPoint.y,
        height: currentCanvasPoint.y - resizeFixedPoint.y,
      };
  }
};

export const resizeImageElement = ({
  element,
  direction,
  previousCanvasPoint,
  currentCanvasPoint,
  resizeFixedPoint,
}: {
  element: VisualizerImageElement;
  direction: Direction;
  previousCanvasPoint: Point;
  currentCanvasPoint: Point;
  resizeFixedPoint: Point;
}): VisualizerImageElement => {
  const flipSign = calculateFlipSign({
    previousCanvasPoint,
    currentCanvasPoint,
    resizeFixedPoint,
  });
  const elementBase: VisualizerImageElement = {
    ...element,
    scale: [element.scale[0] * flipSign.x, element.scale[1] * flipSign.y],
  };

  if (isDiagonalDirection(direction)) {
    const diagonalDirection = calculateDiagonalDirection(
      currentCanvasPoint,
      resizeFixedPoint
    );
    switch (diagonalDirection) {
      case "up-left":
        return {
          ...elementBase,
          x: currentCanvasPoint.x,
          y: currentCanvasPoint.y,
          width: resizeFixedPoint.x - currentCanvasPoint.x,
          height: resizeFixedPoint.y - currentCanvasPoint.y,
        };
      case "up-right":
        return {
          ...elementBase,
          x: resizeFixedPoint.x,
          y: currentCanvasPoint.y,
          width: currentCanvasPoint.x - resizeFixedPoint.x,
          height: resizeFixedPoint.y - currentCanvasPoint.y,
        };
      case "down-left":
        return {
          ...elementBase,
          x: currentCanvasPoint.x,
          y: resizeFixedPoint.y,
          width: resizeFixedPoint.x - currentCanvasPoint.x,
          height: currentCanvasPoint.y - resizeFixedPoint.y,
        };
      case "down-right":
        return {
          ...elementBase,
          x: resizeFixedPoint.x,
          y: resizeFixedPoint.y,
          width: currentCanvasPoint.x - resizeFixedPoint.x,
          height: currentCanvasPoint.y - resizeFixedPoint.y,
        };
    }
  }

  const orthogonalDirection = calculateOrthogonalDirection({
    currentCanvasPoint,
    direction,
    resizeFixedPoint,
  });
  switch (orthogonalDirection) {
    case "up":
      return {
        ...elementBase,
        y: currentCanvasPoint.y,
        height: resizeFixedPoint.y - currentCanvasPoint.y,
      };
    case "left":
      return {
        ...elementBase,
        x: currentCanvasPoint.x,
        width: resizeFixedPoint.x - currentCanvasPoint.x,
      };
    case "right":
      return {
        ...elementBase,
        x: resizeFixedPoint.x,
        width: currentCanvasPoint.x - resizeFixedPoint.x,
      };
    case "down":
      return {
        ...elementBase,
        y: resizeFixedPoint.y,
        height: currentCanvasPoint.y - resizeFixedPoint.y,
      };
  }
};

export const resizeLinearElementPoint = ({
  element,
  pointIndex,
  currentCanvasPoint,
  resizeStartPoint,
}: {
  element: VisualizerLinearElement;
  pointIndex: number;
  currentCanvasPoint: Point;
  resizeStartPoint: Point;
}): VisualizerLinearElement => {
  const dx = currentCanvasPoint.x - resizeStartPoint.x;
  const dy = currentCanvasPoint.y - resizeStartPoint.y;

  const firstPoint = element.points[0];
  invariant(firstPoint);
  const lastPoint = element.points[element.points.length - 1];
  invariant(lastPoint);

  const hasMoreThan2Points = element.points.length > 2;
  if (!hasMoreThan2Points) {
    const updatingPointPosition =
      (
        {
          0: "start",
          1: "virtual center",
        } as const
      )[pointIndex] || "rest";
    switch (updatingPointPosition) {
      case "start": {
        const points: Point[] = element.points.map(({ x, y }, index) => {
          if (index === 0) {
            return { x, y };
          }

          return { x: x - dx, y: y - dy };
        });

        const resizedElement: VisualizerLinearElement = {
          ...element,
          x: element.x + dx,
          y: element.y + dy,
          points,
        };
        const { width, height } = calculateElementSize(resizedElement);

        return {
          ...resizedElement,
          width,
          height,
        };
      }
      case "virtual center": {
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

        const resizedElement: VisualizerLinearElement = {
          ...element,
          points,
        };
        const { width, height } = calculateElementSize(resizedElement);

        return {
          ...resizedElement,
          width,
          height,
        };
      }
      case "rest": {
        const points: Point[] = [
          ...removeLastItem(element.points),
          { x: dx + lastPoint.x, y: dy + lastPoint.y },
        ];
        const resizedElement: VisualizerLinearElement = {
          ...element,
          points,
        };
        const { width, height } = calculateElementSize(resizedElement);

        return {
          ...resizedElement,
          width,
          height,
        };
      }
    }
  }

  const isUpdatingStartPoint = pointIndex === 0;
  if (isUpdatingStartPoint) {
    const points: Point[] = element.points.map(({ x, y }, index) => {
      if (index === 0) {
        return { x, y };
      }

      return {
        x: x - dx,
        y: y - dy,
      };
    });
    const resizedElement: VisualizerLinearElement = {
      ...element,
      x: element.x + dx,
      y: element.y + dy,
      points,
    };
    const { width, height } = calculateElementSize(resizedElement);

    return {
      ...resizedElement,
      width,
      height,
    };
  }

  const updatingPoint = element.points[pointIndex];
  invariant(updatingPoint);

  const points: Point[] = replaceNthItem({
    array: element.points,
    index: pointIndex,
    item: { x: updatingPoint.x + dx, y: updatingPoint.y + dy },
  });
  const resizedElement: VisualizerLinearElement = {
    ...element,
    points,
  };
  const { width, height } = calculateElementSize(resizedElement);

  return {
    ...resizedElement,
    width,
    height,
  };
};

export const resizeTextElement = ({
  element,
  direction,
  currentCanvasPoint,
  resizeFixedPoint,
  canvasElement,
}: {
  element: VisualizerTextElement;
  direction: DiagonalDirection;
  currentCanvasPoint: Point;
  resizeFixedPoint: Point;
  canvasElement: HTMLCanvasElement;
}) => {
  const { height: previousHeight, lineHeight: previousLineHeight } =
    measureText({
      canvasElement,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      text: element.text,
      lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
    });

  const previousNumberOfLines = previousHeight / previousLineHeight;
  const minHeight = 30 * previousNumberOfLines;
  const resizedHeight = direction.startsWith("up")
    ? Math.max(minHeight, resizeFixedPoint.y - currentCanvasPoint.y)
    : Math.max(minHeight, currentCanvasPoint.y - resizeFixedPoint.y);

  // previousHeight : previousFontSize = resizedHeight : resizedFontSize
  // ∴ resizedFontSize = previousFontSize * resizedHeight / previousHeight
  const resizedFontSize = element.fontSize * (resizedHeight / previousHeight);

  const { width, height } = measureText({
    canvasElement,
    fontSize: resizedFontSize,
    fontFamily: element.fontFamily,
    text: element.text,
    lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
  });

  const resizedElement = {
    ...element,
    width,
    height,
    fontSize: resizedFontSize,
  };

  switch (direction) {
    case "up-left": {
      return {
        ...resizedElement,
        x: resizeFixedPoint.x - width,
        y: resizeFixedPoint.y - height,
      };
    }
    case "up-right": {
      return {
        ...resizedElement,
        x: resizeFixedPoint.x,
        y: resizeFixedPoint.y - height,
      };
    }
    case "down-left": {
      return {
        ...resizedElement,
        x: resizeFixedPoint.x - width,
        y: resizeFixedPoint.y,
      };
    }
    case "down-right": {
      return {
        ...resizedElement,
        x: resizeFixedPoint.x,
        y: resizeFixedPoint.y,
      };
    }
    default:
      return element;
  }
};

const calculateFlipSign = ({
  previousCanvasPoint,
  currentCanvasPoint,
  resizeFixedPoint,
}: {
  previousCanvasPoint: Point;
  currentCanvasPoint: Point;
  resizeFixedPoint: Point;
}) => {
  return {
    x: Math.sign(
      (currentCanvasPoint.x - resizeFixedPoint.x) *
        (previousCanvasPoint.x - resizeFixedPoint.x)
    ),
    y: Math.sign(
      (currentCanvasPoint.y - resizeFixedPoint.y) *
        (previousCanvasPoint.y - resizeFixedPoint.y)
    ),
  };
};

export const resizePointBasedElement = <T extends VisualizerPointBasedElement>({
  element,
  direction,
  previousCanvasPoint,
  currentCanvasPoint,
  resizeFixedPoint,
}: {
  element: T;
  direction: Direction;
  previousCanvasPoint: Point;
  currentCanvasPoint: Point;
  resizeFixedPoint: Point;
}): T => {
  const previousAbsolutePoint = calculateElementAbsolutePoint(element);
  const previousSize = {
    width: previousAbsolutePoint.maxX - previousAbsolutePoint.minX,
    height: previousAbsolutePoint.maxY - previousAbsolutePoint.minY,
  };

  // if currentCanvasPoint and previousCanvasPoint is on the another side,
  // we need to multiply by -1 for symmetry
  const flipSign = calculateFlipSign({
    previousCanvasPoint,
    currentCanvasPoint,
    resizeFixedPoint,
  });

  const resizedSize = {
    width: Math.abs(currentCanvasPoint.x - resizeFixedPoint.x),
    height: Math.abs(currentCanvasPoint.y - resizeFixedPoint.y),
  };
  if (isDiagonalDirection(direction)) {
    return {
      ...element,
      width: resizedSize.width,
      height: resizedSize.height,
      x:
        (flipSign.x * ((element.x - resizeFixedPoint.x) * resizedSize.width)) /
          previousSize.width +
        resizeFixedPoint.x,
      y:
        (flipSign.y * (element.y - resizeFixedPoint.y) * resizedSize.height) /
          previousSize.height +
        resizeFixedPoint.y,
      points: element.points.map((point) => {
        return {
          x: flipSign.x * point.x * (resizedSize.width / previousSize.width),
          y: flipSign.y * point.y * (resizedSize.height / previousSize.height),
        };
      }),
    };
  }

  switch (direction) {
    case "up":
    case "down":
      return {
        ...element,
        height: resizedSize.height,
        y:
          (flipSign.y * (element.y - resizeFixedPoint.y) * resizedSize.height) /
            previousSize.height +
          resizeFixedPoint.y,
        points: element.points.map((point) => {
          return {
            x: point.x,
            y:
              flipSign.y * point.y * (resizedSize.height / previousSize.height),
          };
        }),
      };
    case "left":
    case "right":
      return {
        ...element,
        width: resizedSize.width,
        x:
          (flipSign.x *
            ((element.x - resizeFixedPoint.x) * resizedSize.width)) /
            previousSize.width +
          resizeFixedPoint.x,
        points: element.points.map((point) => {
          return {
            x: flipSign.x * point.x * (resizedSize.width / previousSize.width),
            y: point.y,
          };
        }),
      };
  }
};

export const calculateFixedPoint = (
  absolutePoint: AbsolutePoint,
  direction: Direction
): Point => {
  const width = absolutePoint.maxX - absolutePoint.minX;
  const height = absolutePoint.maxY - absolutePoint.minY;

  switch (direction) {
    case "up-left":
      return {
        x: absolutePoint.maxX,
        y: absolutePoint.maxY,
      };
    case "up-right":
      return {
        x: absolutePoint.minX,
        y: absolutePoint.maxY,
      };
    case "down-left":
      return {
        x: absolutePoint.maxX,
        y: absolutePoint.minY,
      };
    case "down-right":
      return {
        x: absolutePoint.minX,
        y: absolutePoint.minY,
      };
    case "up":
      return {
        x: absolutePoint.minX + width / 2,
        y: absolutePoint.maxY,
      };
    case "left":
      return {
        x: absolutePoint.maxX,
        y: absolutePoint.minY + height / 2,
      };
    case "right":
      return {
        x: absolutePoint.minX,
        y: absolutePoint.minY + height / 2,
      };
    case "down":
      return {
        x: absolutePoint.minX + width / 2,
        y: absolutePoint.minY,
      };
  }
};

export type Size = {
  width: number;
  height: number;
};

export const resizeMultipleElements = ({
  elements,
  direction,
  resizeFixedPoint,
  resizeStartPoint,
  currentCanvasPoint,
  canvasElement,
}: {
  elements: VisualizerElement[];
  direction: Direction;
  resizeFixedPoint: Point;
  resizeStartPoint: Point;
  currentCanvasPoint: Point;
  canvasElement: HTMLCanvasElement;
}): VisualizerElement[] => {
  return elements.map((element) => {
    if (element.status !== "selected") {
      return element;
    }

    let previousSurroundingBoxSize: Size;
    let resizedSurroundingBoxSize: Size;

    switch (direction) {
      case "up-left":
        previousSurroundingBoxSize = {
          width: resizeFixedPoint.x - resizeStartPoint.x,
          height: resizeFixedPoint.y - resizeStartPoint.y,
        };
        resizedSurroundingBoxSize = {
          width: resizeFixedPoint.x - currentCanvasPoint.x,
          height: resizeFixedPoint.y - currentCanvasPoint.y,
        };
        break;
      case "up-right":
        previousSurroundingBoxSize = {
          width: resizeStartPoint.x - resizeFixedPoint.x,
          height: resizeFixedPoint.y - resizeStartPoint.y,
        };
        resizedSurroundingBoxSize = {
          width: currentCanvasPoint.x - resizeFixedPoint.x,
          height: resizeFixedPoint.y - currentCanvasPoint.y,
        };
        break;
      case "down-left":
        previousSurroundingBoxSize = {
          width: resizeFixedPoint.x - resizeStartPoint.x,
          height: resizeStartPoint.y - resizeFixedPoint.y,
        };
        resizedSurroundingBoxSize = {
          width: resizeFixedPoint.x - currentCanvasPoint.x,
          height: currentCanvasPoint.y - resizeFixedPoint.y,
        };
        break;
      case "down-right":
        previousSurroundingBoxSize = {
          width: resizeStartPoint.x - resizeFixedPoint.x,
          height: resizeStartPoint.y - resizeFixedPoint.y,
        };
        resizedSurroundingBoxSize = {
          width: currentCanvasPoint.x - resizeFixedPoint.x,
          height: currentCanvasPoint.y - resizeFixedPoint.y,
        };
        break;
      default:
        throw new Error(`Unreachable direction: ${direction}`);
    }

    const changeInSurroundingBoxSize = {
      width: resizedSurroundingBoxSize.width / previousSurroundingBoxSize.width,
      height:
        resizedSurroundingBoxSize.height / previousSurroundingBoxSize.height,
    };

    if (isTextElement(element)) {
      const { height: previousHeight, lineHeight: previousLineHeight } =
        measureText({
          canvasElement,
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          text: element.text,
          lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
        });
      const previousNumberOfLines = previousHeight / previousLineHeight;
      const minHeight = 30 * previousNumberOfLines;
      const resizedHeight = Math.max(
        minHeight,
        element.height * changeInSurroundingBoxSize.height
      );

      const resizedFontSize =
        element.fontSize * (resizedHeight / previousHeight);
      const { width, height } = measureText({
        canvasElement,
        fontSize: resizedFontSize,
        fontFamily: element.fontFamily,
        text: element.text,
        lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
      });
      const resizedElement = {
        ...element,
        x:
          resizeFixedPoint.x -
          ((resizeFixedPoint.x - element.x) * width) / element.width,
        y:
          resizeFixedPoint.y -
          ((resizeFixedPoint.y - element.y) * height) / element.height,
        width,
        height,
        fontSize: resizedFontSize,
      };

      return resizedElement;
    }

    const resizedElementBase = {
      x:
        ((element.x - resizeFixedPoint.x) * resizedSurroundingBoxSize.width) /
          previousSurroundingBoxSize.width +
        resizeFixedPoint.x,
      y:
        ((element.y - resizeFixedPoint.y) * resizedSurroundingBoxSize.height) /
          previousSurroundingBoxSize.height +
        resizeFixedPoint.y,
      width: element.width * changeInSurroundingBoxSize.width,
      height: element.height * changeInSurroundingBoxSize.height,
    };

    if (isGenericElement(element)) {
      const resizedElement: VisualizerGenericElement = {
        ...element,
        ...resizedElementBase,
      };

      return resizedElement;
    }

    // TODO
    if (isImageElement(element)) {
      return {
        ...element,
        ...resizedElementBase,
      };
    }

    const resizedElement: VisualizerPointBasedElement = {
      ...element,
      ...resizedElementBase,
      points: element.points.map((point) => {
        return {
          x: point.x * changeInSurroundingBoxSize.width,
          y: point.y * changeInSurroundingBoxSize.height,
        };
      }),
    };

    return resizedElement;
  });
};
