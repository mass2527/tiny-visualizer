import { MouseEventHandler } from "react";
import { Options as RoughJSOptions } from "roughjs/bin/core";

export type VisualizerElementBase = {
  id: string;

  // VisualizerGenericElement: left top point
  // VisualizerLinearElement: start point
  x: number;
  y: number;

  // VisualizerGenericElement: absolute width, height
  // VisualizerLinearElement: absolute width, height
  width: number;
  height: number;

  isSelected: boolean;
  options: RoughJSOptions;
  isDeleted: boolean;
};

export type VisualizerSelectionElement = VisualizerElementBase & {
  shape: "selection";
};
export type VisualizerRectangleElement = VisualizerElementBase & {
  shape: "rectangle";
  seed: number;
};
export type VisualizerEllipseElement = VisualizerElementBase & {
  shape: "ellipse";
  seed: number;
};

export type VisualizerGenericElement =
  | VisualizerSelectionElement
  | VisualizerRectangleElement
  | VisualizerEllipseElement;

export type ChangeInPoint = [number, number];

export type VisualizerLinearElement = VisualizerElementBase & {
  shape: "line" | "arrow";
  changesInPoint: ChangeInPoint[];
  seed: number;
};

export type VisualizerFreeDrawElement = VisualizerElementBase & {
  shape: "freedraw";
  changesInPoint: ChangeInPoint[];
};

export type FontSize = 12 | 16 | 20 | 24;
type VisualizerTextElementOptions = {
  fontFamily: "serif";
  fontSize: FontSize;
};

export type VisualizerTextElement = VisualizerElementBase &
  VisualizerTextElementOptions & {
    shape: "text";
    text: string;
  };

export type VisualizerElement =
  | VisualizerGenericElement
  | VisualizerLinearElement
  | VisualizerFreeDrawElement
  | VisualizerTextElement;

export const SHAPE_TYPES: Record<
  VisualizerElement["shape"],
  "generic" | "linear" | "freedraw" | "text"
> = {
  selection: "generic",
  rectangle: "generic",
  ellipse: "generic",
  line: "linear",
  arrow: "linear",
  freedraw: "freedraw",
  text: "text",
};

export type Version = {
  elements: VisualizerMachineContext["elements"];
  elementOptions: VisualizerMachineContext["elementOptions"];
};

export type Point = { x: number; y: number };

export type ElementOptions = Required<
  Pick<
    RoughJSOptions,
    | "stroke"
    | "fill"
    | "fillStyle"
    | "strokeWidth"
    | "strokeLineDash"
    | "roughness"
  >
> &
  VisualizerTextElementOptions;

// context that is saved to localStorage
export type VisualizerMachinePersistedContext = {
  elements: VisualizerElement[];
  elementOptions: ElementOptions;

  elementShape: VisualizerElement["shape"];
  drawingElementId: VisualizerElement["id"] | null;
  drawStartPoint: Point;
  previousPoint: Point;
  currentPoint: Point;
  isElementShapeFixed: boolean;
  zoom: number;
  origin: {
    x: number;
    y: number;
  };
};

export type VisualizerMachineContext = VisualizerMachinePersistedContext & {
  // context that is **not** saved to localStorage
  history: Version[];
  historyStep: number;
};

/* #region events within machine  */
export type VisualizerMachineEvents =
  | {
      type: "DRAW_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DRAW";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DRAW_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DELETE_SELECTION";
    }
  | {
      type: "CHANGE_ELEMENT_SHAPE";
      elementShape: VisualizerElement["shape"];
    }
  | {
      type: "DRAG_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DRAG";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "DRAG_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "SELECTED_ELEMENTS.DELETE";
    }
  | {
      type: "SELECTED_ELEMENTS.COPY";
    }
  | {
      type: "SELECTED_ELEMENTS.CUT";
    }
  | {
      type: "SELECTED_ELEMENTS.PASTE";
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "MOUSE_MOVE";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "IS_ELEMENT_SHAPE_FIXED_TOGGLE";
    }
  | {
      type: "CHANGE_ELEMENT_OPTIONS";
      elementOptions: Partial<VisualizerMachineContext["elementOptions"]>;
    }
  | {
      type: "CHANGE_ZOOM";
      setZoom: (
        zoom: VisualizerMachineContext["zoom"]
      ) => VisualizerMachineContext["zoom"];
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "CHANGE_ZOOM_WITH_PINCH";
      setZoom: (
        zoom: VisualizerMachineContext["zoom"]
      ) => VisualizerMachineContext["zoom"];
    }
  | {
      type: "PAN";
      event: WheelEvent;
      devicePixelRatio: number;
    }
  | {
      type: "HISTORY_UPDATE";
      changedStep: 1 | -1;
    }
  | {
      type: "WRITE_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "WRITE";
      text: string;
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "WRITE_END";
    }
  | {
      type: "ELEMENTS.SELECT_ALL";
    }
  | {
      type: "WRITE_EDIT";
      canvasElement: HTMLCanvasElement;
    };
/* #endregion */
