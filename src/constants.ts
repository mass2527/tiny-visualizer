import {
  ElementOptions,
  Tool,
  VisualizerElement,
} from "./machines/visualizerMachine";

export type HOT_KEY = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

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
} as const satisfies Record<VisualizerElement["shape"], HOT_KEY>;

export const TEXTAREA_UNIT_LESS_LINE_HEIGHT = 1.5;

export const SELECTABLE_ELEMENT_OPTIONS: Record<
  Tool,
  Partial<Record<keyof Omit<ElementOptions, "fontFamily">, boolean>> | null
> = {
  hand: null,
  selection: null,
  rectangle: {
    stroke: true,
    fill: true,
    fillStyle: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
  },
  diamond: {
    stroke: true,
    fill: true,
    fillStyle: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
  },
  ellipse: {
    stroke: true,
    fill: true,
    fillStyle: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
  },
  arrow: {
    stroke: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
  },
  line: {
    stroke: true,
    strokeWidth: true,
    strokeLineDash: true,
    roughness: true,
  },
  freedraw: {
    stroke: true,
    strokeWidth: true,
  },
  text: {
    stroke: true,
    fontSize: true,
  },
  image: null,
};
