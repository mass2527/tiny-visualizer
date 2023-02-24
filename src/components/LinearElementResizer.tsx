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
    changeInPointIndex: number
  ) => void;
  onMouseUp: VoidFunction;

  devicePixelRatio: number;
  origin: VisualizerMachineContext["origin"];
  zoom: VisualizerMachineContext["zoom"];
}) {
  let { changesInPoint } = linearElement;

  // linearElement has at least two point
  const firstChangesInPoint = changesInPoint[0];
  invariant(firstChangesInPoint);
  const lastChangesInPoint = changesInPoint[changesInPoint.length - 1];
  invariant(lastChangesInPoint);

  // if linearElement with 2 points, insert virtual center point
  if (changesInPoint.length === 2) {
    changesInPoint = [
      firstChangesInPoint,
      [
        firstChangesInPoint[0] + lastChangesInPoint[0] / 2,
        firstChangesInPoint[1] + lastChangesInPoint[1] / 2,
      ],
      lastChangesInPoint,
    ];
  }

  return (
    <>
      {changesInPoint.map((changesInPoint, index) => {
        const [changeInX, changeInY] = changesInPoint;

        const drawStartViewportPoint = convertToViewportPoint({
          canvasPoint: {
            x: linearElement.x + changeInX,
            y: linearElement.y + changeInY,
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
              left: drawStartViewportPoint.x - WIDTH / 2,
              top: drawStartViewportPoint.y - HEIGHT / 2,
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
