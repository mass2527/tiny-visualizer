import {
  DrawingTool,
  VisualizerElement,
  VisualizerFreeDrawElement,
  VisualizerGenericElement,
  VisualizerLinearElement,
  VisualizerMachineContext,
  VisualizerPointBasedElement,
  VisualizerTextElement,
} from "../machines/visualizerMachine";

const TOOL_TYPES: Record<
  VisualizerMachineContext["tool"],
  "drawing" | "non-drawing"
> = {
  selection: "drawing",
  rectangle: "drawing",
  diamond: "drawing",
  ellipse: "drawing",
  arrow: "drawing",
  line: "drawing",
  freedraw: "drawing",
  text: "drawing",
  hand: "non-drawing",
};

const SHAPE_TYPES: Record<
  VisualizerElement["shape"],
  "generic" | "linear" | "freedraw" | "text"
> = {
  selection: "generic",
  rectangle: "generic",
  diamond: "generic",
  ellipse: "generic",
  line: "linear",
  arrow: "linear",
  freedraw: "freedraw",
  text: "text",
};

export const isGenericShape = (
  shape: VisualizerElement["shape"]
): shape is VisualizerGenericElement["shape"] => {
  return SHAPE_TYPES[shape] === "generic";
};

export const isGenericElement = (
  element: VisualizerElement
): element is VisualizerGenericElement => {
  return isGenericShape(element.shape);
};

export const isLinearShape = (
  shape: VisualizerElement["shape"]
): shape is VisualizerLinearElement["shape"] => {
  return SHAPE_TYPES[shape] === "linear";
};

export const isLinearElement = (
  element: VisualizerElement
): element is VisualizerLinearElement => {
  return isLinearShape(element.shape);
};

export const isFreeDrawShape = (
  shape: VisualizerElement["shape"]
): shape is VisualizerFreeDrawElement["shape"] => {
  return SHAPE_TYPES[shape] === "freedraw";
};

export const isFreeDrawElement = (
  element: VisualizerElement
): element is VisualizerFreeDrawElement => {
  return isFreeDrawShape(element.shape);
};

export const isTextShape = (
  shape: VisualizerElement["shape"]
): shape is VisualizerTextElement["shape"] => {
  return SHAPE_TYPES[shape] === "text";
};

export const isTextElement = (
  element: VisualizerElement
): element is VisualizerTextElement => {
  return isTextShape(element.shape);
};

export const isPointBasedElement = (
  element: VisualizerElement
): element is VisualizerPointBasedElement => {
  return (
    SHAPE_TYPES[element.shape] === "linear" ||
    SHAPE_TYPES[element.shape] === "freedraw"
  );
};

export const isDrawingTool = (
  tool: VisualizerMachineContext["tool"]
): tool is DrawingTool => {
  return TOOL_TYPES[tool] === "drawing";
};
