import { VisualizerElement } from "./machines/visualizerMachine";

export const LABELS: Record<VisualizerElement["shape"], string> = {
  selection: "(1) Selection",
  rectangle: "(2) Rectangle",
  ellipse: "(3) Ellipse",
  arrow: "(4) Arrow",
  line: "(5) Line",
  freedraw: "(6) Freedraw",
};

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
