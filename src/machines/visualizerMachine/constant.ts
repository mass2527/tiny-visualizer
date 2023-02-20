import { VisualizerMachinePersistedContext } from "./types";

// zoom in ratio
export const ZOOM = {
  DEFAULT: 1,
  MINIMUM: 0.1,
  MAXIMUM: 30,
} as const;

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
  elementShape: "selection",
  copiedElements: [],
  drawingElementId: null,
  drawStartPoint: {
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
  isElementShapeFixed: false,
  zoom: ZOOM.DEFAULT,
  origin: {
    x: 0,
    y: 0,
  },
};
