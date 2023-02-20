import {
  VisualizerElement,
  VisualizerMachineContext,
} from "./machines/visualizerMachine";

export type HOT_KEY = "1" | "2" | "3" | "4" | "5" | "6" | "7";

export const HOT_KEYS = {
  selection: "1",
  rectangle: "2",
  ellipse: "3",
  arrow: "4",
  line: "5",
  freedraw: "6",
  text: "7",
} as const satisfies Record<VisualizerElement["shape"], HOT_KEY>;

export const LABELS = {
  selection: "(1) Selection",
  rectangle: "(2) Rectangle",
  ellipse: "(3) Ellipse",
  arrow: "(4) Arrow",
  line: "(5) Line",
  freedraw: "(6) Freedraw",
  text: "(7) Text",
} as const satisfies Record<
  VisualizerElement["shape"],
  `(${HOT_KEY}) ${Capitalize<VisualizerElement["shape"]>}`
>;

type Option<T> = {
  label: string;
  value: T;
};

type ElementOption<T extends keyof VisualizerMachineContext["elementOptions"]> =
  Option<VisualizerMachineContext["elementOptions"][T]>;

export const Fill_STYLE_OPTIONS: ElementOption<"fillStyle">[] = [
  { label: "Hachure", value: "hachure" },
  { label: "Cross-hatch", value: "cross-hatch" },
  { label: "Solid", value: "solid" },
];

export const STROKE_WIDTH_OPTIONS: ElementOption<"strokeWidth">[] = [
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

export const STROKE_LINE_DASH_OPTIONS: ElementOption<"strokeLineDash">[] = [
  { label: "Solid", value: [] },
  {
    label: "Dashed",
    value: [20, 5],
  },
  {
    label: "Dotted",
    value: [5, 10],
  },
];

export const ROUGHNESS_OPTIONS: ElementOption<"roughness">[] = [
  { label: "Architect", value: 0 },
  { label: "Artist", value: 1 },
  { label: "Cartoonist", value: 3 },
];

export const FONT_SIZE_OPTIONS: ElementOption<"fontSize">[] = [
  {
    label: "Small",
    value: 12,
  },
  {
    label: "Medium",
    value: 16,
  },
  {
    label: "Large",
    value: 20,
  },
  {
    label: "X-Large",
    value: 24,
  },
];

export const TEXTAREA_UNIT_LESS_LINE_HEIGHT = 1.5;
