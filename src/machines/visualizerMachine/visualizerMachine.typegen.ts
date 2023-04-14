// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.visualizer machine.copying:invocation[0]": {
      type: "done.invoke.visualizer machine.copying:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.visualizer machine.cutting:invocation[0]": {
      type: "done.invoke.visualizer machine.cutting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.visualizer machine.image drawing:invocation[0]": {
      type: "done.invoke.visualizer machine.image drawing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.visualizer machine.loading:invocation[0]": {
      type: "done.invoke.visualizer machine.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.visualizer machine.pasting:invocation[0]": {
      type: "done.invoke.visualizer machine.pasting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.visualizer machine.copying:invocation[0]": {
      type: "error.platform.visualizer machine.copying:invocation[0]";
      data: unknown;
    };
    "error.platform.visualizer machine.cutting:invocation[0]": {
      type: "error.platform.visualizer machine.cutting:invocation[0]";
      data: unknown;
    };
    "error.platform.visualizer machine.image drawing:invocation[0]": {
      type: "error.platform.visualizer machine.image drawing:invocation[0]";
      data: unknown;
    };
    "error.platform.visualizer machine.loading:invocation[0]": {
      type: "error.platform.visualizer machine.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.visualizer machine.pasting:invocation[0]": {
      type: "error.platform.visualizer machine.pasting:invocation[0]";
      data: unknown;
    };
    "error.platform.visualizer machine.preview image loading:invocation[0]": {
      type: "error.platform.visualizer machine.preview image loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {
    copySelectedElements:
      | "done.invoke.visualizer machine.copying:invocation[0]"
      | "done.invoke.visualizer machine.cutting:invocation[0]";
    loadImageInfo: "done.invoke.visualizer machine.image drawing:invocation[0]";
    loadImages: "done.invoke.visualizer machine.loading:invocation[0]";
    loadPreviewImage: "done.invoke.visualizer machine.preview image loading:invocation[0]";
    readClipboardText: "done.invoke.visualizer machine.pasting:invocation[0]";
  };
  missingImplementations: {
    actions: "loadSavedContext";
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    addElement: "DRAW_START";
    addImageElement: "done.invoke.visualizer machine.image drawing:invocation[0]";
    addTextElement: "WRITE_START";
    addVersionToHistory:
      | ""
      | "CHANGE_ELEMENT_OPTIONS"
      | "DRAG_END"
      | "POINT.UPDATE_END"
      | "RESIZE_END"
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.GROUP"
      | "SELECTED_ELEMENTS.UNGROUP"
      | "done.invoke.visualizer machine.image drawing:invocation[0]"
      | "done.invoke.visualizer machine.pasting:invocation[0]";
    alertError:
      | "error.platform.visualizer machine.copying:invocation[0]"
      | "error.platform.visualizer machine.cutting:invocation[0]"
      | "error.platform.visualizer machine.image drawing:invocation[0]"
      | "error.platform.visualizer machine.pasting:invocation[0]"
      | "error.platform.visualizer machine.preview image loading:invocation[0]";
    assignCurrentPoint: "MOUSE_MOVE";
    assignDrawStartPoint: "DRAW_START" | "DRAW_UPLOADED_IMAGE" | "WRITE_START";
    assignFiles: "done.invoke.visualizer machine.image drawing:invocation[0]";
    assignImageCache: "done.invoke.visualizer machine.image drawing:invocation[0]";
    assignImageFile: "IMAGE_UPLOAD";
    assignImages: "done.invoke.visualizer machine.loading:invocation[0]";
    assignPreviousPoint: "DRAG" | "DRAG_START";
    assignResizeFixedPoint: "RESIZE_START";
    assignResizingDirection: "RESIZE_START";
    assignResizingStartPoint: "POINT.UPDATE_START" | "RESIZE_START";
    assignUpdatingPointIndex: "POINT.UPDATE_START";
    assignZoom: "CHANGE_ZOOM";
    assignZoomToCurrentPoint: "CHANGE_ZOOM_WITH_PINCH";
    changeTool: "CHANGE_TOOL";
    connect: "CONNECT";
    deleteSelectedElements:
      | "SELECTED_ELEMENTS.DELETE"
      | "done.invoke.visualizer machine.cutting:invocation[0]";
    deleteSelection: "DELETE_SELECTION";
    drag: "DRAG" | "DRAG_END";
    draw: "DRAW" | "DRAW_END";
    editWrite: "WRITE_EDIT";
    endConnect: "CONNECT";
    groupSelectedElements: "SELECTED_ELEMENTS.GROUP";
    handleElementOptionsChange: "CHANGE_ELEMENT_OPTIONS";
    loadSavedContext:
      | "error.platform.visualizer machine.loading:invocation[0]"
      | "xstate.init";
    pan: "PAN";
    panWithGesture: "GESTURE.PAN";
    pasteSelectedElements: "done.invoke.visualizer machine.pasting:invocation[0]";
    persist:
      | ""
      | "CHANGE_TOOL"
      | "CHANGE_ZOOM"
      | "CHANGE_ZOOM_WITH_PINCH"
      | "DELETE_SELECTION"
      | "ELEMENTS.SELECT_ALL"
      | "GESTURE.PAN"
      | "HISTORY_UPDATE"
      | "IS_ELEMENT_SHAPE_FIXED_TOGGLE"
      | "PAN_END"
      | "WRITE"
      | "done.invoke.visualizer machine.copying:invocation[0]"
      | "done.invoke.visualizer machine.cutting:invocation[0]";
    resetCursor: "error.platform.visualizer machine.preview image loading:invocation[0]";
    resetDrawingElementId: "" | "DELETE_SELECTION";
    resize: "RESIZE";
    selectAllElements: "ELEMENTS.SELECT_ALL";
    selectDrawingElement: "";
    toggleIsToolFixed: "IS_ELEMENT_SHAPE_FIXED_TOGGLE";
    ungroupSelectedElements: "SELECTED_ELEMENTS.UNGROUP";
    unselectElements: "CHANGE_TOOL" | "DRAW_START" | "WRITE_START";
    updateHistory: "HISTORY_UPDATE";
    updateIntersecting: "DRAW" | "DRAW_END";
    updatePoint: "POINT.UPDATE";
    updateTool:
      | "CONNECT"
      | "DRAW_END"
      | "WRITE_END"
      | "done.invoke.visualizer machine.image drawing:invocation[0]"
      | "error.platform.visualizer machine.image drawing:invocation[0]"
      | "error.platform.visualizer machine.preview image loading:invocation[0]"
      | "xstate.stop";
    write: "WRITE";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    canEditText: "WRITE_EDIT";
    canGroup: "SELECTED_ELEMENTS.GROUP";
    canUngroup: "SELECTED_ELEMENTS.UNGROUP";
    isToolFixed: "";
    shouldConnect: "CONNECT";
  };
  eventsCausingServices: {
    copySelectedElements: "SELECTED_ELEMENTS.COPY" | "SELECTED_ELEMENTS.CUT";
    loadImageInfo: "DRAW_UPLOADED_IMAGE";
    loadImages:
      | "error.platform.visualizer machine.loading:invocation[0]"
      | "xstate.init";
    loadPreviewImage: "IMAGE_UPLOAD";
    readClipboardText: "SELECTED_ELEMENTS.PASTE";
  };
  matchesStates:
    | "connecting"
    | "copying"
    | "cutting"
    | "dragging"
    | "drawing"
    | "drawing element selected"
    | "drawing or writing ended"
    | "error logging"
    | "idle"
    | "image drawing"
    | "loading"
    | "panning"
    | "pasting"
    | "persisting"
    | "preview image loading"
    | "resizing"
    | "updating point"
    | "version released"
    | "writing";
  tags: never;
}
