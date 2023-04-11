import {
  VisualizerElement,
  VisualizerMachineContext,
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

type Option<T> = {
  label: string;
  value: T;
};

type ElementOption<T extends keyof VisualizerMachineContext["elementOptions"]> =
  Option<VisualizerMachineContext["elementOptions"][T]>;

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
