import { MouseEvent } from "react";
import {
  VisualizerGenericElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import { createAllDirectionVirtualPoints } from "../utils";
import VirtualPoint from "./VirtualPoint";

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
  const virtualPoints = createAllDirectionVirtualPoints({
    element: genericElement,
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

export default GenericElementResizer;
