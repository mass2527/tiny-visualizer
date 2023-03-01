import { MouseEvent } from "react";
import {
  VisualizerMachineContext,
  VisualizerTextElement,
} from "../machines/visualizerMachine";
import { createDiagonalDirectionVirtualPoints } from "../utils";
import { DiagonalDirection } from "./GenericElementResizer";
import VirtualPoint from "./VirtualPoint";

function TextElementResizer({
  textElement,
  devicePixelRatio,
  origin,
  zoom,
  onMouseDown,
}: {
  textElement: VisualizerTextElement;
  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
  onMouseDown: (
    event: MouseEvent<HTMLDivElement>,
    direction: DiagonalDirection
  ) => void;
}) {
  const virtualPoints = createDiagonalDirectionVirtualPoints({
    element: textElement,
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

export default TextElementResizer;
