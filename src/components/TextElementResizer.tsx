import { MouseEvent } from "react";
import {
  VisualizerMachineContext,
  VisualizerTextElement,
} from "../machines/visualizerMachine";
import {
  calculateElementAbsolutePoint,
  calculateElementViewportSize,
  convertToViewportPoint,
} from "../utils";
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
  const absolutePoint = calculateElementAbsolutePoint(textElement);
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
    element: textElement,
    devicePixelRatio,
    zoom,
  });

  const virtualPoints: {
    direction: DiagonalDirection;
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
      left: elementViewportPoint.x + elementViewportSize.width,
      top: elementViewportPoint.y,
    },
    {
      direction: "down-left",
      left: elementViewportPoint.x,
      top: elementViewportPoint.y + elementViewportSize.height,
    },
    {
      direction: "down-right",
      left: elementViewportPoint.x + elementViewportSize.width,
      top: elementViewportPoint.y + elementViewportSize.height,
    },
  ];

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
