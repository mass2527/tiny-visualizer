import { VisualizerElement, VisualizerMachinePersistedContext } from "./types";

// zoom in ratio
export const ZOOM = {
  DEFAULT: 1,
  MIN: 0.1,
  MAX: 30,
} as const;

export const ELEMENT_STATUS = {
  idle: "idle",
  selected: "selected",
  deleted: "deleted",
} satisfies Record<VisualizerElement["status"], VisualizerElement["status"]>;

export const PERSISTED_CONTEXT: VisualizerMachinePersistedContext = {
  // track
  elements: [],
  elementOptions: {
    // roughJS options
    stroke: "#000000",
    fill: "#ffffff",
    fillStyle: "hachure",
    strokeWidth: 2,
    strokeLineDash: [],
    roughness: 1,

    fontSize: 16,
    fontFamily: "serif",
  },

  // untrack
  tool: "selection",
  drawingElementId: null,
  drawStartPoint: {
    x: 0,
    y: 0,
  },
  resizeStartPoint: {
    x: 0,
    y: 0,
  },
  resizeFixedPoint: {
    x: 0,
    y: 0,
  },
  previousPoint: {
    x: 0,
    y: 0,
  },
  // cursor point in actual canvas size (not viewport)
  currentPoint: {
    x: 0,
    y: 0,
  },
  isToolFixed: false,
  zoom: ZOOM.DEFAULT,
  origin: {
    x: 0,
    y: 0,
  },
  resizingDirection: "up",
  updatingPointIndex: 0,

  files: {},
};
