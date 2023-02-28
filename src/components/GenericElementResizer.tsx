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
      left: elementViewportPoint.x - WIDTH / 2,
      top: elementViewportPoint.y - HEIGHT / 2,
    },
    {
      direction: "up-right",
      left: elementViewportPoint.x + elementViewportWidth - WIDTH / 2,
      top: elementViewportPoint.y - HEIGHT / 2,
    },
    {
      direction: "down-left",
      left: elementViewportPoint.x - WIDTH / 2,
      top: elementViewportPoint.y + elementViewportHeight - HEIGHT / 2,
    },
    {
      direction: "down-right",
      left: elementViewportPoint.x + elementViewportWidth - WIDTH / 2,
      top: elementViewportPoint.y + elementViewportHeight - HEIGHT / 2,
    },
  ];

  const haveEnoughWidth = Math.abs(elementViewportWidth) >= 2 * (3 * WIDTH);
  if (haveEnoughWidth) {
    virtualPoints.push(
      {
        direction: "up",
        left: elementViewportPoint.x + elementViewportWidth / 2 - WIDTH / 2,
        top: elementViewportPoint.y - HEIGHT / 2,
      },
      {
        direction: "down",
        left: elementViewportPoint.x + elementViewportWidth / 2 - WIDTH / 2,
        top: elementViewportPoint.y + elementViewportHeight - HEIGHT / 2,
      }
    );
  }

  const haveEnoughHeight = Math.abs(elementViewportHeight) >= 2 * (3 * HEIGHT);
  if (haveEnoughHeight) {
    virtualPoints.push(
      {
        direction: "left",
        left: elementViewportPoint.x - WIDTH / 2,
        top: elementViewportPoint.y + elementViewportHeight / 2 - HEIGHT / 2,
      },
      {
        direction: "right",
        left: elementViewportPoint.x + elementViewportWidth - WIDTH / 2,
        top: elementViewportPoint.y + elementViewportHeight / 2 - HEIGHT / 2,
      }
    );
  }

  return virtualPoints;
};

const WIDTH = 8;
const HEIGHT = 8;

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
          <div
            key={virtualPoint.direction}
            role='button'
            style={{
              position: "absolute",
              left: virtualPoint.left,
              top: virtualPoint.top,
              width: WIDTH,
              height: HEIGHT,
              backgroundColor: "dodgerblue",
              cursor: "pointer",
            }}
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
