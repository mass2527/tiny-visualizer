import { VisualizerElement } from "./machines/canvasMachine";

export const TOOL_OPTIONS: {
  label: string;
  value: VisualizerElement["shape"];
}[] = [
  {
    label: "(1) Selection",
    value: "selection",
  },
  {
    label: "(2) Rectangle",
    value: "rectangle",
  },
  {
    label: "(3) Ellipse",
    value: "ellipse",
  },
  {
    label: "(4) Arrow",
    value: "arrow",
  },
  {
    label: "(5) Line",
    value: "line",
  },
];

export const STROKE_WIDTH_OPTIONS: {
  label: string;
  value: VisualizerElement["options"]["strokeWidth"];
}[] = [
  {
    label: "Thin",
    value: 2,
  },
  {
    label: "Regular",
    value: 4,
  },
  {
    label: "Bold",
    value: 6,
  },
];
