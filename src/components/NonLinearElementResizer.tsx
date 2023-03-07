import { MouseEvent } from "react";
import {
  VisualizerElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import { createElementVirtualPoints } from "../utils";
import VirtualPoint from "./VirtualPoint";

type HorizontalDirection = "left" | "right";
type VerticalDirection = "up" | "down";
export type OrthogonalDirection = HorizontalDirection | VerticalDirection;
export type DiagonalDirection = `${VerticalDirection}-${HorizontalDirection}`;
export type Direction =
  | HorizontalDirection
  | VerticalDirection
  | DiagonalDirection;

function NonLinearElementResizer({
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
          />
        );
      })}
    </>
  );
}

export default NonLinearElementResizer;
