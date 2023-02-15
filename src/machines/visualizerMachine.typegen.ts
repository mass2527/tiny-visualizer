// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: "addHistory" | "loadSavedContext";
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    addElement: "DRAW_START";
    addHistory:
      | "CHANGE_ELEMENT_OPTIONS"
      | "DRAG_END"
      | "DRAW_END"
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.PASTE";
    assignCurrentPoint: "MOUSE_MOVE";
    assignDrawStartPoint: "DRAW_START";
    assignElementOptions: "CHANGE_ELEMENT_OPTIONS";
    assignOrigin: "PAN";
    assignPreviousPoint: "DRAG" | "DRAG_START";
    assignZoom: "CHANGE_ZOOM";
    assignZoomToCurrentPoint: "CHANGE_ZOOM_WITH_PINCH";
    changeElementShape: "CHANGE_ELEMENT_SHAPE";
    changeVersion: "VERSION_CHANGE";
    copySelectedElements: "SELECTED_ELEMENTS.COPY" | "SELECTED_ELEMENTS.CUT";
    deleteSelectedElements:
      | "SELECTED_ELEMENTS.CUT"
      | "SELECTED_ELEMENTS.DELETE";
    deleteSelection: "DELETE_SELECTION";
    drag: "DRAG" | "DRAG_END";
    draw: "DRAW" | "DRAW_END";
    loadSavedContext: "xstate.init";
    pasteSelectedElements: "SELECTED_ELEMENTS.PASTE";
    persist:
      | ""
      | "CHANGE_ELEMENT_OPTIONS"
      | "CHANGE_ELEMENT_SHAPE"
      | "CHANGE_ZOOM"
      | "CHANGE_ZOOM_WITH_PINCH"
      | "DRAG_END"
      | "DRAW_END"
      | "IS_ELEMENT_SHAPE_FIXED_TOGGLE"
      | "PAN"
      | "SELECTED_ELEMENTS.COPY"
      | "SELECTED_ELEMENTS.CUT"
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.PASTE";
    resetDrawingElementId: "DELETE_SELECTION" | "DRAW_END";
    selectDrawingElement: "DRAW_END";
    toggleIsElementShapeFixed: "IS_ELEMENT_SHAPE_FIXED_TOGGLE";
    unselectElements: "CHANGE_ELEMENT_SHAPE" | "DRAW_START";
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
    | "persisting";
  tags: never;
}
