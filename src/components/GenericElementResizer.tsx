import { MouseEvent } from "react";
import {
  VisualizerGenericElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import {
  calculateElementAbsolutePoint,
  convertToViewportPoint,
} from "../utils";

const WIDTH = 8;
const HEIGHT = 8;

type VerticalAlignment = "top" | "middle" | "bottom";
type HorizontalAlignment = "left" | "center" | "right";
export type Alignment = Exclude<
  `${VerticalAlignment}-${HorizontalAlignment}`,
  "middle-center"
>;
export type DiagonalAlignment = `${Exclude<
  VerticalAlignment,
  "middle"
>}-${Exclude<HorizontalAlignment, "center">}`;
export type MiddleAlignment = Exclude<Alignment, DiagonalAlignment>;

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
    alignment: Alignment
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

  const virtualPoints: {
    alignment: Alignment;
    left: number;
    top: number;
  }[] = [
    {
      alignment: "top-left",
      left: elementViewportPoint.x - WIDTH / 2,
      top: elementViewportPoint.y - HEIGHT / 2,
    },
    {
      alignment: "top-right",
      left: elementViewportPoint.x + elementViewportWidth - WIDTH / 2,
      top: elementViewportPoint.y - HEIGHT / 2,
    },
    {
      alignment: "bottom-left",
      left: elementViewportPoint.x - WIDTH / 2,
      top: elementViewportPoint.y + elementViewportHeight - HEIGHT / 2,
    },
    {
      alignment: "bottom-right",
      left: elementViewportPoint.x + elementViewportWidth - WIDTH / 2,
      top: elementViewportPoint.y + elementViewportHeight - HEIGHT / 2,
    },
  ];

  const haveEnoughWidth = Math.abs(elementViewportWidth) >= 2 * (3 * WIDTH);
  if (haveEnoughWidth) {
    virtualPoints.push(
      {
        alignment: "top-center",
        left: elementViewportPoint.x + elementViewportWidth / 2 - WIDTH / 2,
        top: elementViewportPoint.y - HEIGHT / 2,
      },
      {
        alignment: "bottom-center",
        left: elementViewportPoint.x + elementViewportWidth / 2 - WIDTH / 2,
        top: elementViewportPoint.y + elementViewportHeight - HEIGHT / 2,
      }
    );
  }

  const haveEnoughHeight = Math.abs(elementViewportHeight) >= 2 * (3 * HEIGHT);
  if (haveEnoughHeight) {
    virtualPoints.push(
      {
        alignment: "middle-left",
        left: elementViewportPoint.x - WIDTH / 2,
        top: elementViewportPoint.y + elementViewportHeight / 2 - HEIGHT / 2,
      },
      {
        alignment: "middle-right",
        left: elementViewportPoint.x + elementViewportWidth - WIDTH / 2,
        top: elementViewportPoint.y + elementViewportHeight / 2 - HEIGHT / 2,
      }
    );
  }

  return (
    <>
      {virtualPoints.map((virtualPoint) => {
        return (
          <div
            key={virtualPoint.alignment}
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
              onMouseDown(event, virtualPoint.alignment);
            }}
          />
        );
      })}
    </>
  );
}

export default GenericElementResizer;
