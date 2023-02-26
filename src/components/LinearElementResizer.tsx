import invariant from "tiny-invariant";
import {
  VisualizerLinearElement,
  VisualizerMachineContext,
} from "../machines/visualizerMachine";
import { convertToViewportPoint } from "../utils";

const WIDTH = 10;
const HEIGHT = 10;

function LinearElementResizer({
  linearElement,
  onMouseDown,
  onMouseUp,
  devicePixelRatio,
  origin,
  zoom,
}: {
  linearElement: VisualizerLinearElement;
  onMouseDown: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    pointIndex: number
  ) => void;
  onMouseUp: VoidFunction;

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
      [firstPoint[0] + lastPoint[0] / 2, firstPoint[1] + lastPoint[1] / 2],
      lastPoint,
    ];
  }

  return (
    <>
      {points.map((point, index) => {
        const [x, y] = point;

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
            onMouseDown={(event) => onMouseDown(event, index)}
            onMouseUp={onMouseUp}
          />
        );
      })}
    </>
  );
}

export default LinearElementResizer;
