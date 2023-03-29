import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import invariant from "tiny-invariant";
import {
  AbsolutePoint,
  calculateDistance,
  convertDegreeToRadian,
  haveSamePoint,
  isLinearElement,
  measureText,
  removeLastItem,
} from ".";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../constants";
import { Point, VisualizerElement } from "../machines/visualizerMachine";

const ARROW_MAX_SIZE = 50;
export const createDraw = (
  element: VisualizerElement,
  canvasElement: HTMLCanvasElement
): VoidFunction => {
  const ctx = canvasElement.getContext("2d");
  invariant(ctx);

  const roughCanvas = rough.canvas(canvasElement);
  const { generator } = roughCanvas;

  if (element.shape === "selection") {
    return () => {
      ctx.strokeRect(element.x, element.y, element.width, element.height);
    };
  } else if (element.shape === "rectangle") {
    const rectangleDrawable = generator.rectangle(
      element.x,
      element.y,
      element.width,
      element.height,
      { ...element.options, seed: element.seed }
    );
    return () => {
      roughCanvas.draw(rectangleDrawable);
    };
  } else if (element.shape === "ellipse") {
    const ellipseDrawable = generator.ellipse(
      element.x + element.width / 2,
      element.y + element.height / 2,
      element.width,
      element.height,
      { ...element.options, seed: element.seed }
    );
    return () => {
      roughCanvas.draw(ellipseDrawable);
    };
  } else if (isLinearElement(element)) {
    if (element.shape === "line") {
      const drawables: Drawable[] = [];
      const startPoint = {
        x: element.x,
        y: element.y,
      };

      for (const point of element.points) {
        const { x, y } = point;
        const lineDrawable = generator.line(
          startPoint.x,
          startPoint.y,
          element.x + x,
          element.y + y,
          { ...element.options, seed: element.seed }
        );
        drawables.push(lineDrawable);

        startPoint.x = element.x + x;
        startPoint.y = element.y + y;
      }

      return () => {
        drawables.forEach((drawable) => {
          roughCanvas.draw(drawable);
        });
      };
    } else {
      const arrowDrawables: Drawable[] = [];
      const startPoint = {
        x: element.x,
        y: element.y,
      };

      // if last and second last have same items, arrow will be disappear
      // so need to remove last item to continue showing previous arrow
      let { points } = element;
      if (points.length > 1) {
        const lastPoint = points[points.length - 1];
        invariant(lastPoint);

        const secondLastPoint = points[points.length - 2];
        invariant(secondLastPoint);

        if (haveSamePoint(lastPoint, secondLastPoint)) {
          points = removeLastItem(points);
        }
      }

      let index = 0;
      let previousPoint: Point | undefined;

      for (const point of points) {
        const { x, y } = point;
        const endX = element.x + x;
        const endY = element.y + y;

        // -
        arrowDrawables.push(
          generator.line(startPoint.x, startPoint.y, endX, endY, {
            ...element.options,
            seed: element.seed,
          })
        );

        startPoint.x = endX;
        startPoint.y = endY;

        const isLastPoint = index === points.length - 1;
        if (!isLastPoint) {
          index++;
          previousPoint = point;
          continue;
        }

        if (previousPoint === undefined) {
          continue;
        }

        const angleInRadians = Math.atan2(
          y - previousPoint.y,
          x - previousPoint.x
        );

        const distance = calculateDistance(
          x - previousPoint.x,
          y - previousPoint.y
        );
        const arrowSize = Math.min(ARROW_MAX_SIZE, distance / 2);

        // \
        arrowDrawables.push(
          generator.line(
            endX,
            endY,
            endX -
              arrowSize * Math.cos(angleInRadians + convertDegreeToRadian(30)),
            endY -
              arrowSize * Math.sin(angleInRadians + convertDegreeToRadian(30)),
            { ...element.options, seed: element.seed }
          )
        );
        // /
        arrowDrawables.push(
          generator.line(
            endX,
            endY,
            endX -
              arrowSize * Math.cos(angleInRadians - convertDegreeToRadian(30)),
            endY -
              arrowSize * Math.sin(angleInRadians - convertDegreeToRadian(30)),
            { ...element.options, seed: element.seed }
          )
        );
      }

      return () => {
        arrowDrawables.forEach((drawable) => {
          roughCanvas.draw(drawable);
        });
      };
    }
  } else if (element.shape === "freedraw") {
    return () => {
      ctx.save();

      ctx.beginPath();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ctx.lineWidth = element.options.strokeWidth!;
      ctx.strokeStyle = element.options.stroke || "black";

      ctx.moveTo(element.x, element.y);
      for (let i = 1; i < element.points.length; i++) {
        const point = element.points[i];
        invariant(point);

        const { x, y } = point;
        ctx.lineTo(element.x + x, element.y + y);
      }
      ctx.stroke();

      ctx.restore();
    };
  } else {
    return () => {
      ctx.save();

      const { fontSize, lineGap, lineHeight } = measureText({
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
        text: element.text,
        canvasElement,
      });

      ctx.textBaseline = "top";
      ctx.font = `${fontSize}px ${element.fontFamily}`;

      const lines = element.text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const text = lines[i];
        if (text) {
          ctx.fillText(text, element.x, element.y + lineGap + i * lineHeight);
        }
      }

      ctx.restore();
    };
  }
};

const MARGIN = 8;
export const strokeDashedRectangle = (
  ctx: CanvasRenderingContext2D,
  absolutePoint: AbsolutePoint,
  segments: [number, number] = [8, 4]
) => {
  ctx.setLineDash(segments);
  ctx.strokeRect(
    absolutePoint.minX - MARGIN,
    absolutePoint.minY - MARGIN,
    absolutePoint.maxX - absolutePoint.minX + MARGIN * 2,
    absolutePoint.maxY - absolutePoint.minY + MARGIN * 2
  );
  ctx.setLineDash([]);
};
