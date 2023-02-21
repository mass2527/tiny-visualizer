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
    "error.platform.visualizer machine.pasting:invocation[0]": {
      type: "error.platform.visualizer machine.pasting:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    copySelectedElements:
      | "done.invoke.visualizer machine.copying:invocation[0]"
      | "done.invoke.visualizer machine.cutting:invocation[0]";
    readClipboardText: "done.invoke.visualizer machine.pasting:invocation[0]";
  };
  missingImplementations: {
    actions: "loadSavedContext";
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    addElement: "DRAW_START" | "WRITE_START";
    addVersionToHistory:
      | ""
      | "CHANGE_ELEMENT_OPTIONS"
      | "DRAG_END"
      | "SELECTED_ELEMENTS.DELETE"
      | "done.invoke.visualizer machine.pasting:invocation[0]";
    assignCurrentPoint: "MOUSE_MOVE";
    assignDrawStartPoint: "DRAW_START" | "WRITE_START";
    assignElementOptions: "CHANGE_ELEMENT_OPTIONS";
    assignPreviousPoint: "DRAG" | "DRAG_START";
    assignZoom: "CHANGE_ZOOM";
    assignZoomToCurrentPoint: "CHANGE_ZOOM_WITH_PINCH";
    changeElementShape: "CHANGE_ELEMENT_SHAPE";
    deleteSelectedElements:
      | "SELECTED_ELEMENTS.DELETE"
      | "done.invoke.visualizer machine.cutting:invocation[0]";
    deleteSelection: "DELETE_SELECTION";
    drag: "DRAG" | "DRAG_END";
    draw: "DRAW" | "DRAW_END";
    endWrite: "WRITE_END";
    loadSavedContext: "xstate.init";
    logError:
      | "error.platform.visualizer machine.copying:invocation[0]"
      | "error.platform.visualizer machine.cutting:invocation[0]"
      | "error.platform.visualizer machine.pasting:invocation[0]";
    pan: "PAN";
    pasteSelectedElements: "done.invoke.visualizer machine.pasting:invocation[0]";
    persist:
      | ""
      | "CHANGE_ELEMENT_SHAPE"
      | "CHANGE_ZOOM"
      | "CHANGE_ZOOM_WITH_PINCH"
      | "HISTORY_UPDATE"
      | "IS_ELEMENT_SHAPE_FIXED_TOGGLE"
      | "PAN"
      | "done.invoke.visualizer machine.copying:invocation[0]"
      | "done.invoke.visualizer machine.cutting:invocation[0]";
    resetDrawingElementId: "DELETE_SELECTION" | "DRAW_END" | "WRITE_END";
    selectDrawingElement: "DRAW_END" | "WRITE_END";
    toggleIsElementShapeFixed: "IS_ELEMENT_SHAPE_FIXED_TOGGLE";
    unselectElements: "CHANGE_ELEMENT_SHAPE" | "DRAW_START";
    updateElementShape: "DRAW_END" | "WRITE_END";
    updateHistory: "HISTORY_UPDATE";
    updateIntersecting: "DRAW" | "DRAW_END";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    copySelectedElements: "SELECTED_ELEMENTS.COPY" | "SELECTED_ELEMENTS.CUT";
    readClipboardText: "SELECTED_ELEMENTS.PASTE";
  };
  matchesStates:
    | "copying"
    | "cutting"
    | "dragging"
    | "drawing"
    | "drawing or writing ended"
    | "error logging"
    | "idle"
    | "loading"
    | "pasting"
    | "persisting"
    | "version released"
    | "writing";
  tags: never;
}
