import { MouseEvent } from "react";
import {
  VisualizerGenericElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import { createOrthogonalDirectionVirtualPoints } from "../utils";
import DiagonalDirectionResizer from "./DiagonalDirectionResizer";
import VirtualPoint from "./VirtualPoint";

type HorizontalDirection = "left" | "right";
type VerticalDirection = "up" | "down";
export type OrthogonalDirection = HorizontalDirection | VerticalDirection;
export type DiagonalDirection = `${VerticalDirection}-${HorizontalDirection}`;
export type Direction =
  | HorizontalDirection
  | VerticalDirection
  | DiagonalDirection;

function AllDirectionResizer({
  element,
  devicePixelRatio,
  origin,
  zoom,
  onMouseDown,
}: {
  element: VisualizerGenericElement;
  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
  onMouseDown: (
    event: MouseEvent<HTMLDivElement>,
    direction: Direction
  ) => void;
}) {
  const virtualPoints = createOrthogonalDirectionVirtualPoints({
    element,
    devicePixelRatio,
    origin,
    zoom,
  });

  return (
    <>
      <DiagonalDirectionResizer
        element={element}
        devicePixelRatio={devicePixelRatio}
        origin={origin}
        zoom={zoom}
        onMouseDown={onMouseDown}
      />
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

export default AllDirectionResizer;
