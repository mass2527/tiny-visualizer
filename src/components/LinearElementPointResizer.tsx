import invariant from "tiny-invariant";
import {
  VisualizerLinearElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import { calculateViewportPoint } from "../utils";
import VirtualPoint from "./VirtualPoint";

function LinearElementPointResizer({
  linearElement,
  onMouseDown,
  devicePixelRatio,
  origin,
  zoom,
}: {
  linearElement: VisualizerLinearElement;
  onMouseDown: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    pointIndex: number
  ) => void;

  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
}) {
  let { points } = linearElement;

  // linearElement has at least two point
  const firstPoint = points[0];
  invariant(firstPoint);
  const lastPoint = points[points.length - 1];
  invariant(lastPoint);

  // if linearElement with 2 points, insert virtual center point
  if (points.length === 2) {
    points = [
      firstPoint,
      { x: firstPoint.x + lastPoint.x / 2, y: firstPoint.y + lastPoint.y / 2 },
      lastPoint,
    ];
  }

  return (
    <>
      {points.map((point, index) => {
        const { x, y } = point;

        const resizingStartViewportPoint = calculateViewportPoint({
          canvasPoint: {
            x: linearElement.x + x,
            y: linearElement.y + y,
          },
          devicePixelRatio,
          origin,
          zoom,
        });

        return (
          <VirtualPoint
            key={String(index)}
            type="circle"
            left={resizingStartViewportPoint.x}
            top={resizingStartViewportPoint.y}
            onMouseDown={(event) => {
              event.preventDefault();
              onMouseDown(event, index);
            }}
          />
        );
      })}
    </>
  );
}

export default LinearElementPointResizer;
