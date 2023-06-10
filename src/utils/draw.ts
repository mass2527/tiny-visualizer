import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import invariant from "tiny-invariant";
import {
  AbsolutePoint,
  calculateDistance,
  convertDegreeToRadian,
  haveSamePoint,
  isImageElement,
  isLinearElement,
  measureText,
  removeLastItem,
} from ".";
import { OrthogonalDirection } from "../components/ElementResizer";
import { TEXTAREA_UNIT_LESS_LINE_HEIGHT } from "../constants";
import {
  Files,
  ImageCache,
  Point,
  VisualizerElement,
} from "../machines/visualizerMachine";
import getStroke from "perfect-freehand";

const ARROW_MAX_SIZE = 50;
export const createDraw = (
  element: VisualizerElement,
  canvasElement: HTMLCanvasElement
): (({
  files,
  imageCache,
}: {
  files?: Files;
  imageCache?: ImageCache;
}) => void) => {
  const ctx = canvasElement.getContext("2d");
  invariant(ctx);

  ctx.globalAlpha = element.options.opacity;

  const roughCanvas = rough.canvas(canvasElement);
  const { generator } = roughCanvas;

  if (element.shape === "rectangle") {
    const rectangleDrawable = generator.rectangle(
      element.point.x,
      element.point.y,
      element.size.width,
      element.size.height,
      { ...element.options, seed: element.seed }
    );
    return () => {
      roughCanvas.draw(rectangleDrawable);
    };
  } else if (element.shape === "diamond") {
    const vertices: Record<OrthogonalDirection, [number, number]> = {
      up: [element.point.x + element.size.width / 2, element.point.y],
      left: [element.point.x, element.point.y + element.size.height / 2],
      down: [
        element.point.x + element.size.width / 2,
        element.point.y + element.size.height,
      ],
      right: [
        element.point.x + element.size.width,
        element.point.y + element.size.height / 2,
      ],
    };
    const diamondDrawable = generator.polygon(
      [vertices.up, vertices.left, vertices.down, vertices.right],
      { ...element.options, seed: element.seed }
    );

    return () => {
      roughCanvas.draw(diamondDrawable);
    };
  } else if (element.shape === "ellipse") {
    const ellipseDrawable = generator.ellipse(
      element.point.x + element.size.width / 2,
      element.point.y + element.size.height / 2,
      element.size.width,
      element.size.height,
      { ...element.options, seed: element.seed }
    );
    return () => {
      roughCanvas.draw(ellipseDrawable);
    };
  } else if (isLinearElement(element)) {
    if (element.shape === "line") {
      const drawables: Drawable[] = [];
      const startPoint = {
        x: element.point.x,
        y: element.point.y,
      };

      for (const point of element.points) {
        const { x, y } = point;
        const lineDrawable = generator.line(
          startPoint.x,
          startPoint.y,
          element.point.x + x,
          element.point.y + y,
          { ...element.options, seed: element.seed }
        );
        drawables.push(lineDrawable);

        startPoint.x = element.point.x + x;
        startPoint.y = element.point.y + y;
      }

      return () => {
        drawables.forEach((drawable) => {
          roughCanvas.draw(drawable);
        });
      };
    } else {
      const arrowDrawables: Drawable[] = [];
      const startPoint = {
        x: element.point.x,
        y: element.point.y,
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
        const endX = element.point.x + x;
        const endY = element.point.y + y;

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

      ctx.fillStyle = element.options.stroke;
      ctx.beginPath();
      ctx.moveTo(element.point.x, element.point.y);

      const stroke = getStroke(
        element.points.map((point) => {
          return [point.x + element.point.x, point.y + element.point.y];
        }),
        {
          size: element.options.strokeWidth * 7,
        }
      );
      const svgPath = getSvgPathFromStroke(stroke);
      const path2D = new Path2D(svgPath);
      ctx.fill(path2D);

      ctx.restore();
    };
  } else if (isImageElement(element)) {
    return ({ files, imageCache }) => {
      ctx.save();

      ctx.scale(element.scale[0], element.scale[1]);
      ctx.translate(
        element.scale[0] === 1
          ? 0
          : -(element.point.x * 2 + element.size.width),
        element.scale[1] === 1
          ? 0
          : -(element.point.y * 2 + element.size.height)
      );

      const file = files?.[element.fileId];
      invariant(file);

      const cachedImage = imageCache?.[element.fileId];
      if (cachedImage) {
        ctx.drawImage(
          cachedImage,
          element.point.x,
          element.point.y,
          element.size.width,
          element.size.height
        );
      }

      ctx.restore();
    };
  } else {
    return () => {
      ctx.save();

      const { fontSize, lineGap, lineHeight } = measureText({
        fontFamily: element.options.fontFamily,
        fontSize: element.options.fontSize,
        lineHeight: TEXTAREA_UNIT_LESS_LINE_HEIGHT,
        text: element.text,
        canvasElement,
      });

      ctx.textBaseline = "top";
      ctx.font = `${fontSize}px ${element.options.fontFamily}`;
      ctx.fillStyle = element.options.stroke;

      const lines = element.text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const text = lines[i];
        if (text) {
          ctx.fillText(
            text,
            element.point.x,
            element.point.y + lineGap + i * lineHeight
          );
        }
      }

      ctx.restore();
    };
  }
};

const MARGIN = 8;
export const strokeRectangle = ({
  ctx,
  absolutePoint,
  segments,
  lineWidth,
  strokeStyle,
  margin = MARGIN,
}: {
  ctx: CanvasRenderingContext2D;
  absolutePoint: AbsolutePoint;
  segments?: [number, number];
  lineWidth?: CanvasPathDrawingStyles["lineWidth"];
  strokeStyle?: CanvasFillStrokeStyles["strokeStyle"];
  margin?: number;
}) => {
  ctx.save();

  if (segments) {
    ctx.setLineDash(segments);
  }
  if (lineWidth) {
    ctx.lineWidth = lineWidth;
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
  }

  ctx.strokeRect(
    absolutePoint.minX - margin,
    absolutePoint.minY - margin,
    absolutePoint.maxX - absolutePoint.minX + margin * 2,
    absolutePoint.maxY - absolutePoint.minY + margin * 2
  );

  if (segments) {
    ctx.setLineDash([]);
  }

  ctx.restore();
};

const calculateAverage = (a: number, b: number) => (a + b) / 2;

const getSvgPathFromStroke = (points: number[][], closed = true) => {
  const pointsLength = points.length;

  if (pointsLength < 4) {
    return ``;
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  invariant(a && a[0] && a[1]);
  invariant(b && b[0] && b[1]);
  invariant(c && c[0] && c[1]);

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2
  )},${b[1].toFixed(2)} ${calculateAverage(b[0], c[0]).toFixed(
    2
  )},${calculateAverage(b[1], c[1]).toFixed(2)} T`;

  for (let i = 2, max = pointsLength - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    invariant(a && a[0] && a[1]);
    invariant(b && b[0] && b[1]);

    result += `${calculateAverage(a[0], b[0]).toFixed(2)},${calculateAverage(
      a[1],
      b[1]
    ).toFixed(2)} `;
  }

  if (closed) {
    result += "Z";
  }

  return result;
};
