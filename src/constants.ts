import {
  Tool,
  VisualizerFreeDrawElement,
  VisualizerGenericElement,
  VisualizerImageElement,
  VisualizerLinearElement,
  VisualizerTextElement,
} from "./machines/visualizerMachine";

export type HOT_KEY = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "h";

export const HOT_KEYS = {
  selection: "1",
  rectangle: "2",
  diamond: "3",
  ellipse: "4",
  arrow: "5",
  line: "6",
  freedraw: "7",
  text: "8",
  image: "9",
  hand: "h",
} as const satisfies Record<Tool, HOT_KEY>;

export const TEXTAREA_UNIT_LESS_LINE_HEIGHT = 1.5;

export const AVAILABLE_OPTIONS: {
  hand: null;
  selection: null;
  rectangle: Record<keyof VisualizerGenericElement["options"], boolean>;
  diamond: Record<keyof VisualizerGenericElement["options"], boolean>;
  ellipse: Record<keyof VisualizerGenericElement["options"], boolean>;
  arrow: Record<keyof VisualizerLinearElement["options"], boolean>;
  line: Record<keyof VisualizerLinearElement["options"], boolean>;
  freedraw: Record<keyof VisualizerFreeDrawElement["options"], boolean>;
  text: Record<keyof VisualizerTextElement["options"], boolean>;
  image: Record<keyof VisualizerImageElement["options"], boolean>;
} = {
  hand: null,
  selection: null,
  rectangle: {
    stroke: true,
    fill: true,
    fillStyle: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
    opacity: true,
  },
  diamond: {
    stroke: true,
    fill: true,
    fillStyle: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
    opacity: true,
  },
  ellipse: {
    stroke: true,
    fill: true,
    fillStyle: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
    opacity: true,
  },
  arrow: {
    stroke: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
    opacity: true,
  },
  line: {
    stroke: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
    opacity: true,
  },
  freedraw: {
    stroke: true,
    strokeWidth: true,
    opacity: true,
  },
  text: {
    fontFamily: true,
    stroke: true,
    fontSize: true,
    opacity: true,
  },
  image: {
    opacity: true,
  },
};
