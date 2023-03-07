import { MouseEvent } from "react";
import {
  VisualizerElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import {
  calculateElementAbsolutePoint,
  calculateElementViewportSize,
  convertToViewportPoint,
  isTextElement,
} from "../utils";
import VirtualPoint, {
  VirtualPointProps,
  VIRTUAL_POINT_HEIGHT,
  VIRTUAL_POINT_WIDTH,
} from "./VirtualPoint";

type HorizontalDirection = "left" | "right";
type VerticalDirection = "up" | "down";
export type OrthogonalDirection = HorizontalDirection | VerticalDirection;
export type DiagonalDirection = `${VerticalDirection}-${HorizontalDirection}`;
export type Direction =
  | HorizontalDirection
  | VerticalDirection
  | DiagonalDirection;

const createElementVirtualPoints = ({
  element,
  devicePixelRatio,
  origin,
  zoom,
  virtualPointSize = {
    width: VIRTUAL_POINT_WIDTH,
    height: VIRTUAL_POINT_HEIGHT,
  },
}: {
  element: VisualizerElement;
  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
  virtualPointSize?: Required<Pick<VirtualPointProps, "width" | "height">>;
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

  const virtualPoints: ({
    direction: Direction;
  } & Required<
    Pick<VirtualPointProps, "top" | "left" | "width" | "height">
  >)[] = [
    {
      direction: "up-left",
      left: elementViewportPoint.x,
      top: elementViewportPoint.y,
      width: virtualPointSize.width,
      height: virtualPointSize.height,
    },
    {
      direction: "up-right",
      left: elementViewportPoint.x + elementViewportSize.width,
      top: elementViewportPoint.y,
      width: virtualPointSize.width,
      height: virtualPointSize.height,
    },
    {
      direction: "down-left",
      left: elementViewportPoint.x,
      top: elementViewportPoint.y + elementViewportSize.height,
      width: virtualPointSize.width,
      height: virtualPointSize.height,
    },
    {
      direction: "down-right",
      left: elementViewportPoint.x + elementViewportSize.width,
      top: elementViewportPoint.y + elementViewportSize.height,
      width: virtualPointSize.width,
      height: virtualPointSize.height,
    },
  ];

  if (isTextElement(element)) {
    return virtualPoints;
  }

  const haveEnoughWidth =
    Math.abs(elementViewportSize.width) >= 2 * (3 * virtualPointSize.width);
  if (haveEnoughWidth) {
    virtualPoints.push(
      {
        direction: "up",
        left: elementViewportPoint.x + elementViewportSize.width / 2,
        top: elementViewportPoint.y,
        width: virtualPointSize.width,
        height: virtualPointSize.height,
      },
      {
        direction: "down",
        left: elementViewportPoint.x + elementViewportSize.width / 2,
        top: elementViewportPoint.y + elementViewportSize.height,
        width: virtualPointSize.width,
        height: virtualPointSize.height,
      }
    );
  }

  const haveEnoughHeight =
    Math.abs(elementViewportSize.height) >= 2 * (3 * virtualPointSize.height);
  if (haveEnoughHeight) {
    virtualPoints.push(
      {
        direction: "left",
        left: elementViewportPoint.x,
        top: elementViewportPoint.y + elementViewportSize.height / 2,
        width: virtualPointSize.width,
        height: virtualPointSize.height,
      },
      {
        direction: "right",
        left: elementViewportPoint.x + elementViewportSize.width,
        top: elementViewportPoint.y + elementViewportSize.height / 2,
        width: virtualPointSize.width,
        height: virtualPointSize.height,
      }
    );
  }

  return virtualPoints;
};

function ElementResizer({
  element,
  devicePixelRatio,
  origin,
  zoom,
  onMouseDown,
}: {
  element: VisualizerElement;
  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
  onMouseDown: (
    event: MouseEvent<HTMLDivElement>,
    direction: Direction
  ) => void;
}) {
  const virtualPoints = createElementVirtualPoints({
    element,
    devicePixelRatio,
    origin,
    zoom,
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
            width={virtualPoint.width}
            height={virtualPoint.height}
          />
        );
      })}
    </>
  );
}

export default ElementResizer;
