import { MouseEventHandler } from "react";
import invariant from "tiny-invariant";
import { VisualizerElement } from "./machines/elementMachine";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";

// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
export const calculateMousePoint = (
  canvasElement: HTMLCanvasElement,
  event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0]
) => {
  const rect = canvasElement.getBoundingClientRect();
  const scaleX = canvasElement.width / rect.width; // relationship bitmap vs. element for x
  const scaleY = canvasElement.height / rect.height; // relationship bitmap vs. element for y

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};

export const calculateDistance = (width: number, height: number) => {
  return Math.sqrt(width ** 2 + height ** 2);
};

export const convertDegreeToRadian = (angleInDegrees: number) => {
  return (Math.PI * angleInDegrees) / 180;
};

const ARROW_MAX_SIZE = 30;

export const generateDraw = (
  element: VisualizerElement,
  canvasElement: HTMLCanvasElement
) => {
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
      element.height
    );
    return () => {
      roughCanvas.draw(rectangleDrawable);
    };
  } else if (element.shape === "ellipse") {
    const ellipseDrawable = generator.ellipse(
      element.x + element.width / 2,
      element.y + element.height / 2,
      element.width,
      element.height
    );
    return () => {
      roughCanvas.draw(ellipseDrawable);
    };
  } else if (element.shape === "line") {
    const lineDrawable = generator.line(
      element.x,
      element.y,
      element.x + element.width,
      element.y + element.height
    );
    return () => {
      roughCanvas.draw(lineDrawable);
    };
  } else {
    // element.shape === "arrow"
    const distance = calculateDistance(element.width, element.height);
    const arrowSize = Math.min(ARROW_MAX_SIZE, distance / 2);
    const angleInRadians = Math.atan2(element.height, element.width);

    const startX = element.x;
    const startY = element.y;
    const endX = element.x + element.width;
    const endY = element.y + element.height;

    let arrowDrawables: Drawable[] = [];

    // \
    arrowDrawables.push(
      generator.line(
        endX,
        endY,
        endX - arrowSize * Math.cos(angleInRadians + convertDegreeToRadian(30)),
        endY - arrowSize * Math.sin(angleInRadians + convertDegreeToRadian(30))
      )
    );
    // -
    arrowDrawables.push(generator.line(startX, startY, endX, endY));
    // /
    arrowDrawables.push(
      generator.line(
        endX,
        endY,
        endX - arrowSize * Math.cos(angleInRadians - convertDegreeToRadian(30)),
        endY - arrowSize * Math.sin(angleInRadians - convertDegreeToRadian(30))
      )
    );

    return () => {
      arrowDrawables.forEach((drawable) => {
        roughCanvas.draw(drawable);
      });
    };
  }
};
