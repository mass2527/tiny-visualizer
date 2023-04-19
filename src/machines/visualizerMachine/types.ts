import { ChangeEvent, MouseEvent, MouseEventHandler } from "react";
import { Options as RoughJSOptions } from "roughjs/bin/core";
import { Direction } from "../../components/ElementResizer";

export type Point = { x: number; y: number };

export type Size = {
  width: number;
  height: number;
};

export type VisualizerElementBase = {
  point: Point;
  size: Size;
};

export type VisualizerShapeElementBase = VisualizerElementBase & {
  id: string;
  status: "idle" | "selected" | "deleted";
  options: ElementOptions;
  groupIds: string[];
};

export type VisualizerRectangleElement = VisualizerShapeElementBase & {
  shape: "rectangle";
  seed: number;
};
export type VisualizerEllipseElement = VisualizerShapeElementBase & {
  shape: "ellipse";
  seed: number;
};
export type VisualizerDiamondElement = VisualizerShapeElementBase & {
  shape: "diamond";
  seed: number;
};

export type VisualizerGenericElement =
  | VisualizerRectangleElement
  | VisualizerDiamondElement
  | VisualizerEllipseElement;

export type VisualizerLinearElement = VisualizerShapeElementBase & {
  shape: "line" | "arrow";
  // first point always starts with {x:0, y:0} since origin is element.x, element.y
  points: Point[];
  seed: number;
};

export type VisualizerFreeDrawElement = VisualizerShapeElementBase & {
  shape: "freedraw";
  points: Point[];
};

type VisualizerTextElementOptions = {
  fontFamily: "serif";
  fontSize: number;
};

export type VisualizerTextElement = VisualizerShapeElementBase &
  VisualizerTextElementOptions & {
    shape: "text";
    text: string;
  };

export type VisualizerImageElement = VisualizerShapeElementBase & {
  shape: "image";
  fileId: FileId;
  scale: [number, number];
};

export type VisualizerElement =
  | VisualizerGenericElement
  | VisualizerLinearElement
  | VisualizerFreeDrawElement
  | VisualizerTextElement
  | VisualizerImageElement;

export type VisualizerPointBasedElement =
  | VisualizerLinearElement
  | VisualizerFreeDrawElement;

export type Version = {
  elements: VisualizerMachineContext["elements"];
  elementOptions: VisualizerMachineContext["elementOptions"];
};

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

export type DrawingTool = VisualizerElement["shape"];
export type NonDrawingTool = "hand" | "selection";
export type Tool = DrawingTool | NonDrawingTool;

export type FileId = string;
export type Files = Record<
  FileId,
  {
    dataURL: string;
  }
>;

// context that is saved to localStorage
export type VisualizerMachinePersistedContext = {
  selection: VisualizerElementBase | null;

  elements: VisualizerElement[];
  elementOptions: ElementOptions;

  tool: Tool;
  resizingDirection: Direction;
  updatingPointIndex: number;
  resizeStartPoint: Point;
  resizeFixedPoint: Point;
  drawingElementId: VisualizerElement["id"] | null;
  drawStartPoint: Point;
  previousPoint: Point;
  currentPoint: Point;
  isToolFixed: boolean;
  zoom: number;
  origin: Point;

  files: Files;
};

export type ImageCache = Record<FileId, HTMLImageElement>;

export type VisualizerMachineContext = VisualizerMachinePersistedContext & {
  // context that is **not** saved to localStorage
  history: Version[];
  historyStep: number;

  imageFile: File | null;
  imageCache: ImageCache;
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
      type: "CHANGE_TOOL";
      tool: Tool;
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
      canvasElement?: HTMLCanvasElement;
      devicePixelRatio?: number;
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
      type: "GESTURE.PAN";
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
    }
  | {
      type: "CONNECT_START";
    }
  | {
      type: "CONNECT";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
    }
  | {
      type: "CONNECT_END";
    }
  | {
      type: "RESIZE_START";
      resizingDirection: VisualizerMachineContext["resizingDirection"];
      event: MouseEvent;
      devicePixelRatio: number;
    }
  | {
      type: "RESIZE";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
      // only for text element
      canvasElement: HTMLCanvasElement;
    }
  | {
      type: "RESIZE_END";
    }
  | {
      type: "POINT.UPDATE_START";
      updatingPointIndex: VisualizerMachineContext["updatingPointIndex"];
      event: MouseEvent;
      devicePixelRatio: number;
    }
  | {
      type: "POINT.UPDATE";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "POINT.UPDATE_END";
    }
  | {
      type: "SELECTED_ELEMENTS.GROUP";
    }
  | {
      type: "SELECTED_ELEMENTS.UNGROUP";
    }
  | {
      type: "PAN_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
    }
  | {
      type: "PAN";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "PAN_END";
    }
  | {
      type: "IMAGE_UPLOAD";
      event: ChangeEvent<HTMLInputElement>;
    }
  | {
      type: "IMAGE_UPLOADED";
    }
  | {
      type: "DRAW_UPLOADED_IMAGE";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "SELECT_START";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "SELECT";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    }
  | {
      type: "SELECT_END";
      event: Parameters<MouseEventHandler<HTMLCanvasElement>>[0];
      devicePixelRatio: number;
    };
/* #endregion */
