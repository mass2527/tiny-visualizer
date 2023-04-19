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
  Size,
  VisualizerElement,
  VisualizerElementBase,
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
          point: {
            x: currentCanvasPoint.x,
            y: currentCanvasPoint.y,
          },
          size: {
            width: resizeFixedPoint.x - currentCanvasPoint.x,
            height: resizeFixedPoint.y - currentCanvasPoint.y,
          },
        };
      case "up-right":
        return {
          ...element,
          point: {
            x: resizeFixedPoint.x,
            y: currentCanvasPoint.y,
          },
          size: {
            width: currentCanvasPoint.x - resizeFixedPoint.x,
            height: resizeFixedPoint.y - currentCanvasPoint.y,
          },
        };
      case "down-left":
        return {
          ...element,
          point: {
            x: currentCanvasPoint.x,
            y: resizeFixedPoint.y,
          },
          size: {
            width: resizeFixedPoint.x - currentCanvasPoint.x,
            height: currentCanvasPoint.y - resizeFixedPoint.y,
          },
        };
      case "down-right":
        return {
          ...element,
          point: {
            x: resizeFixedPoint.x,
            y: resizeFixedPoint.y,
          },
          size: {
            width: currentCanvasPoint.x - resizeFixedPoint.x,
            height: currentCanvasPoint.y - resizeFixedPoint.y,
          },
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
        point: {
          ...element.point,
          y: currentCanvasPoint.y,
        },
        size: {
          ...element.size,
          height: resizeFixedPoint.y - currentCanvasPoint.y,
        },
      };
    case "left":
      return {
        ...element,
        point: {
          ...element.point,
          x: currentCanvasPoint.x,
        },
        size: {
          ...element.size,
          width: resizeFixedPoint.x - currentCanvasPoint.x,
        },
      };
    case "right":
      return {
        ...element,
        point: {
          ...element.point,
          x: resizeFixedPoint.x,
        },
        size: {
          ...element.size,
          width: currentCanvasPoint.x - resizeFixedPoint.x,
        },
      };
    case "down":
      return {
        ...element,
        point: {
          ...element.point,
          y: resizeFixedPoint.y,
        },
        size: {
          ...element.size,
          height: currentCanvasPoint.y - resizeFixedPoint.y,
        },
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
          point: {
            x: currentCanvasPoint.x,
            y: currentCanvasPoint.y,
          },
          size: {
            width: resizeFixedPoint.x - currentCanvasPoint.x,
            height: resizeFixedPoint.y - currentCanvasPoint.y,
          },
        };
      case "up-right":
        return {
          ...elementBase,
          point: {
            x: resizeFixedPoint.x,
            y: currentCanvasPoint.y,
          },
          size: {
            width: currentCanvasPoint.x - resizeFixedPoint.x,
            height: resizeFixedPoint.y - currentCanvasPoint.y,
          },
        };
      case "down-left":
        return {
          ...elementBase,
          point: {
            x: currentCanvasPoint.x,
            y: resizeFixedPoint.y,
          },
          size: {
            width: resizeFixedPoint.x - currentCanvasPoint.x,
            height: currentCanvasPoint.y - resizeFixedPoint.y,
          },
        };
      case "down-right":
        return {
          ...elementBase,
          point: {
            x: resizeFixedPoint.x,
            y: resizeFixedPoint.y,
          },
          size: {
            width: currentCanvasPoint.x - resizeFixedPoint.x,
            height: currentCanvasPoint.y - resizeFixedPoint.y,
          },
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
        point: {
          ...elementBase.point,
          y: currentCanvasPoint.y,
        },
        size: {
          ...elementBase.size,
          height: resizeFixedPoint.y - currentCanvasPoint.y,
        },
      };
    case "left":
      return {
        ...elementBase,
        point: {
          ...elementBase.point,
          x: currentCanvasPoint.x,
        },
        size: {
          ...elementBase.size,
          width: resizeFixedPoint.x - currentCanvasPoint.x,
        },
      };
    case "right":
      return {
        ...elementBase,
        point: {
          ...elementBase.point,
          x: resizeFixedPoint.x,
        },
        size: {
          ...elementBase.size,
          width: currentCanvasPoint.x - resizeFixedPoint.x,
        },
      };
    case "down":
      return {
        ...elementBase,
        point: {
          ...elementBase.point,
          y: resizeFixedPoint.y,
        },
        size: {
          ...element.size,
          height: currentCanvasPoint.y - resizeFixedPoint.y,
        },
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
          point: {
            x: element.point.x + dx,
            y: element.point.y + dy,
          },
          points,
        };
        const size = calculateElementSize(resizedElement);

        return {
          ...resizedElement,
          size,
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
        const size = calculateElementSize(resizedElement);

        return {
          ...resizedElement,
          size,
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
        const size = calculateElementSize(resizedElement);

        return {
          ...resizedElement,
          size,
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
      point: {
        x: element.point.x + dx,
        y: element.point.y + dy,
      },
      points,
    };
    const size = calculateElementSize(resizedElement);

    return {
      ...resizedElement,
      size,
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
  const size = calculateElementSize(resizedElement);

  return {
    ...resizedElement,
    size,
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
}): VisualizerTextElement => {
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

  const resizedElement: VisualizerTextElement = {
    ...element,
    size: {
      width,
      height,
    },
    fontSize: resizedFontSize,
  };

  switch (direction) {
    case "up-left": {
      return {
        ...resizedElement,
        point: {
          x: resizeFixedPoint.x - width,
          y: resizeFixedPoint.y - height,
        },
      };
    }
    case "up-right": {
      return {
        ...resizedElement,
        point: {
          x: resizeFixedPoint.x,
          y: resizeFixedPoint.y - height,
        },
      };
    }
    case "down-left": {
      return {
        ...resizedElement,
        point: {
          x: resizeFixedPoint.x - width,
          y: resizeFixedPoint.y,
        },
      };
    }
    case "down-right": {
      return {
        ...resizedElement,
        point: {
          x: resizeFixedPoint.x,
          y: resizeFixedPoint.y,
        },
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

  // if currentCanvasPoint and previousCanvasPoint is on the other side,
  // we need to multiply by -1 for symmetry
  const flipSign = calculateFlipSign({
    previousCanvasPoint,
    currentCanvasPoint,
    resizeFixedPoint,
  });

  const updatedSize = {
    width: Math.abs(currentCanvasPoint.x - resizeFixedPoint.x),
    height: Math.abs(currentCanvasPoint.y - resizeFixedPoint.y),
  };
  if (isDiagonalDirection(direction)) {
    return {
      ...element,
      point: {
        x:
          (flipSign.x *
            ((element.point.x - resizeFixedPoint.x) * updatedSize.width)) /
            previousSize.width +
          resizeFixedPoint.x,
        y:
          (flipSign.y *
            (element.point.y - resizeFixedPoint.y) *
            updatedSize.height) /
            previousSize.height +
          resizeFixedPoint.y,
      },
      size: {
        width: updatedSize.width,
        height: updatedSize.height,
      },
      points: element.points.map((point) => {
        return {
          x: flipSign.x * point.x * (updatedSize.width / previousSize.width),
          y: flipSign.y * point.y * (updatedSize.height / previousSize.height),
        };
      }),
    };
  }

  switch (direction) {
    case "up":
    case "down":
      return {
        ...element,
        point: {
          ...element.point,
          y:
            (flipSign.y *
              (element.point.y - resizeFixedPoint.y) *
              updatedSize.height) /
              previousSize.height +
            resizeFixedPoint.y,
        },
        size: {
          ...element.size,
          height: updatedSize.height,
        },
        points: element.points.map((point) => {
          return {
            x: point.x,
            y:
              flipSign.y * point.y * (updatedSize.height / previousSize.height),
          };
        }),
      };
    case "left":
    case "right":
      return {
        ...element,
        point: {
          ...element.point,
          x:
            (flipSign.x *
              ((element.point.x - resizeFixedPoint.x) * updatedSize.width)) /
              previousSize.width +
            resizeFixedPoint.x,
        },
        size: {
          ...element.size,
          width: updatedSize.width,
        },
        points: element.points.map((point) => {
          return {
            x: flipSign.x * point.x * (updatedSize.width / previousSize.width),
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
        element.size.height * changeInSurroundingBoxSize.height
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
          ((resizeFixedPoint.x - element.point.x) * width) / element.size.width,
        y:
          resizeFixedPoint.y -
          ((resizeFixedPoint.y - element.point.y) * height) /
            element.size.height,
        width,
        height,
        fontSize: resizedFontSize,
      };

      return resizedElement;
    }

    const resizedElementBase: VisualizerElementBase = {
      point: {
        x:
          ((element.point.x - resizeFixedPoint.x) *
            resizedSurroundingBoxSize.width) /
            previousSurroundingBoxSize.width +
          resizeFixedPoint.x,
        y:
          ((element.point.y - resizeFixedPoint.y) *
            resizedSurroundingBoxSize.height) /
            previousSurroundingBoxSize.height +
          resizeFixedPoint.y,
      },
      size: {
        width: element.size.width * changeInSurroundingBoxSize.width,
        height: element.size.height * changeInSurroundingBoxSize.height,
      },
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
