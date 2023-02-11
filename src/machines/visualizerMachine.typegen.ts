// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: "drawElements" | "loadSavedContext";
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    addElement: "DRAW_START";
    addVersionToHistory:
      | ""
      | "CHANGE_ELEMENT_OPTIONS"
      | "DRAG_END"
      | "DRAW_END"
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.PASTE";
    assignCurrentPoint: "MOUSE_MOVE";
    assignDragStartPoint: "DRAG_START";
    assignElementOptions: "CHANGE_ELEMENT_OPTIONS";
    assignOrigin: "PAN";
    assignZoom: "CHANGE_ZOOM";
    assignZoomToCurrentPoint: "CHANGE_ZOOM_WITH_PINCH";
    changeElementShape: "CHANGE_ELEMENT_SHAPE";
    copySelectedElements: "SELECTED_ELEMENTS.COPY" | "SELECTED_ELEMENTS.CUT";
    deleteSelectedElements:
      | "SELECTED_ELEMENTS.CUT"
      | "SELECTED_ELEMENTS.DELETE";
    deleteSelection: "DELETE_SELECTION";
    drag: "DRAG" | "DRAG_END";
    draw: "DRAW" | "DRAW_END";
    drawElements:
      | ""
      | "CHANGE_ELEMENT_SHAPE"
      | "CHANGE_ZOOM"
      | "CHANGE_ZOOM_WITH_PINCH"
      | "DELETE_SELECTION"
      | "DRAG"
      | "DRAG_END"
      | "DRAW"
      | "DRAW_END"
      | "DRAW_START"
      | "HISTORY_UPDATE"
      | "PAN"
      | "SELECTED_ELEMENTS.CUT"
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.PASTE"
      | "xstate.stop";
    loadSavedContext: "xstate.init";
    pasteSelectedElements: "SELECTED_ELEMENTS.PASTE";
    persist:
      | ""
      | "CHANGE_ELEMENT_SHAPE"
      | "CHANGE_ZOOM"
      | "CHANGE_ZOOM_WITH_PINCH"
      | "HISTORY_UPDATE"
      | "IS_ELEMENT_SHAPE_FIXED_TOGGLE"
      | "PAN"
      | "SELECTED_ELEMENTS.COPY"
      | "SELECTED_ELEMENTS.CUT";
    resetDrawingElementId: "DELETE_SELECTION" | "DRAW_END";
    selectDrawingElement: "DRAW_END";
    toggleIsElementShapeFixed: "IS_ELEMENT_SHAPE_FIXED_TOGGLE";
    unselectElements: "CHANGE_ELEMENT_SHAPE" | "DRAW_START";
    updateHistory: "HISTORY_UPDATE";
    updateIntersecting: "DRAW" | "DRAW_END";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isElementShapeFixed: "DRAW_END";
  };
  eventsCausingServices: {};
  matchesStates:
    | "dragging"
    | "drawing"
    | "element shape reset"
    | "idle"
    | "loading"
    | "persisting"
    | "version released";
  tags: never;
}
