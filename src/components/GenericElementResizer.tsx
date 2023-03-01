import { MouseEvent } from "react";
import {
  Point,
  VisualizerGenericElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import {
  calculateElementAbsolutePoint,
  convertToViewportPoint,
} from "../utils";
import VirtualPoint, {
  VIRTUAL_POINT_HEIGHT,
  VIRTUAL_POINT_WIDTH,
} from "./VirtualPoint";

const createVirtualPoints = ({
  elementViewportPoint,
  elementViewportWidth,
  elementViewportHeight,
}: {
  elementViewportPoint: Point;
  elementViewportWidth: number;
  elementViewportHeight: number;
}) => {
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
      left: elementViewportPoint.x + elementViewportWidth,
      top: elementViewportPoint.y,
    },
    {
      direction: "down-left",
      left: elementViewportPoint.x,
      top: elementViewportPoint.y + elementViewportHeight,
    },
    {
      direction: "down-right",
      left: elementViewportPoint.x + elementViewportWidth,
      top: elementViewportPoint.y + elementViewportHeight,
    },
  ];

  const haveEnoughWidth =
    Math.abs(elementViewportWidth) >= 2 * (3 * VIRTUAL_POINT_WIDTH);
  if (haveEnoughWidth) {
    virtualPoints.push(
      {
        direction: "up",
        left: elementViewportPoint.x + elementViewportWidth / 2,
        top: elementViewportPoint.y,
      },
      {
        direction: "down",
        left: elementViewportPoint.x + elementViewportWidth / 2,
        top: elementViewportPoint.y + elementViewportHeight,
      }
    );
  }

  const haveEnoughHeight =
    Math.abs(elementViewportHeight) >= 2 * (3 * VIRTUAL_POINT_HEIGHT);
  if (haveEnoughHeight) {
    virtualPoints.push(
      {
        direction: "left",
        left: elementViewportPoint.x,
        top: elementViewportPoint.y + elementViewportHeight / 2,
      },
      {
        direction: "right",
        left: elementViewportPoint.x + elementViewportWidth,
        top: elementViewportPoint.y + elementViewportHeight / 2,
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

  const elementViewportWidth = (genericElement.width / devicePixelRatio) * zoom;
  const elementViewportHeight =
    (genericElement.height / devicePixelRatio) * zoom;

  const virtualPoints = createVirtualPoints({
    elementViewportPoint,
    elementViewportWidth,
    elementViewportHeight,
  });

  return (
    <>
      {virtualPoints.map((virtualPoint) => {
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
