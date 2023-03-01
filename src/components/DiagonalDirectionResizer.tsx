import { MouseEvent } from "react";
import {
  VisualizerFreeDrawElement,
  VisualizerGenericElement,
  VisualizerMachineContext,
  VisualizerTextElement,
} from "../machines/visualizerMachine";
import { createDiagonalDirectionVirtualPoints } from "../utils";
import { DiagonalDirection } from "./AllDirectionResizer";
import VirtualPoint from "./VirtualPoint";

function DiagonalDirectionResizer({
  element,
  devicePixelRatio,
  origin,
  zoom,
  onMouseDown,
}: {
  element:
    | VisualizerGenericElement
    | VisualizerTextElement
    | VisualizerFreeDrawElement;
  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
  onMouseDown: (
    event: MouseEvent<HTMLDivElement>,
    direction: DiagonalDirection
  ) => void;
}) {
  const virtualPoints = createDiagonalDirectionVirtualPoints({
    element,
    devicePixelRatio,
    origin,
    zoom,
  });

  return (
    <>
      {virtualPoints.map((virtualPoint) => (
        <VirtualPoint
          key={virtualPoint.direction}
          left={virtualPoint.left}
          top={virtualPoint.top}
          onMouseDown={(event) => {
            event.preventDefault();
            onMouseDown(event, virtualPoint.direction);
          }}
        />
      ))}
    </>
  );
}

export default DiagonalDirectionResizer;
