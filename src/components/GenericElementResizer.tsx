import { MouseEvent } from "react";
import {
  Point,
  VisualizerGenericElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import {
  calculateElementAbsolutePoint,
  calculateElementViewportSize,
  convertToViewportPoint,
} from "../utils";
import VirtualPoint, {
  VIRTUAL_POINT_HEIGHT,
  VIRTUAL_POINT_WIDTH,
} from "./VirtualPoint";

const createElementVirtualPoints = ({
  point,
  width,
  height,
}: {
  point: Point;
  width: number;
  height: number;
}) => {
  const virtualPoints: {
    direction: Direction;
    left: number;
    top: number;
  }[] = [
    {
      direction: "up-left",
      left: point.x,
      top: point.y,
    },
    {
      direction: "up-right",
      left: point.x + width,
      top: point.y,
    },
    {
      direction: "down-left",
      left: point.x,
      top: point.y + height,
    },
    {
      direction: "down-right",
      left: point.x + width,
      top: point.y + height,
    },
  ];

  const haveEnoughWidth = Math.abs(width) >= 2 * (3 * VIRTUAL_POINT_WIDTH);
  if (haveEnoughWidth) {
    virtualPoints.push(
      {
        direction: "up",
        left: point.x + width / 2,
        top: point.y,
      },
      {
        direction: "down",
        left: point.x + width / 2,
        top: point.y + height,
      }
    );
  }

  const haveEnoughHeight = Math.abs(height) >= 2 * (3 * VIRTUAL_POINT_HEIGHT);
  if (haveEnoughHeight) {
    virtualPoints.push(
      {
        direction: "left",
        left: point.x,
        top: point.y + height / 2,
      },
      {
        direction: "right",
        left: point.x + width,
        top: point.y + height / 2,
      }
    );
  }

  return virtualPoints;
};

type HorizontalDirection = "left" | "right";
type VerticalDirection = "up" | "down";
export type OrthogonalDirection = HorizontalDirection | VerticalDirection;
export type DiagonalDirection = `${VerticalDirection}-${HorizontalDirection}`;
export type Direction =
  | HorizontalDirection
  | VerticalDirection
  | DiagonalDirection;

function GenericElementResizer({
  genericElement,
  devicePixelRatio,
  origin,
  zoom,
  onMouseDown,
}: {
  genericElement: VisualizerGenericElement;
  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
  onMouseDown: (
    event: MouseEvent<HTMLDivElement>,
    direction: Direction
  ) => void;
}) {
  const absolutePoint = calculateElementAbsolutePoint(genericElement);
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
    element: genericElement,
    devicePixelRatio,
    zoom,
  });

  const elementVirtualPoints = createElementVirtualPoints({
    point: elementViewportPoint,
    width: elementViewportSize.width,
    height: elementViewportSize.height,
  });

  return (
    <>
      {elementVirtualPoints.map((virtualPoint) => {
        return (
          <VirtualPoint
            key={virtualPoint.direction}
            left={virtualPoint.left}
            top={virtualPoint.top}
            onMouseDown={(event) => {
              event.preventDefault();
              onMouseDown(event, virtualPoint.direction);
            }}
          />
        );
      })}
    </>
  );
}

export default GenericElementResizer;
