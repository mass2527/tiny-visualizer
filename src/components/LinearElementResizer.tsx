import invariant from "tiny-invariant";
import {
  VisualizerLinearElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import { convertToViewportPoint } from "../utils";

const WIDTH = 8;
const HEIGHT = 8;

function LinearElementResizer({
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

        const resizingStartViewportPoint = convertToViewportPoint({
          canvasPoint: {
            x: linearElement.x + x,
            y: linearElement.y + y,
          },
          devicePixelRatio,
          origin,
          zoom,
        });

        return (
          <div
            key={String(index)}
            role='button'
            style={{
              position: "absolute",
              left: resizingStartViewportPoint.x - WIDTH / 2,
              top: resizingStartViewportPoint.y - HEIGHT / 2,
              width: WIDTH,
              height: HEIGHT,
              borderRadius: "50%",
              backgroundColor: "dodgerblue",
              cursor: "pointer",
            }}
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

export default LinearElementResizer;
