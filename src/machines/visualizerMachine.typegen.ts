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
    assignCurrentPoint: "MOUSE_MOVE";
    assignDragStartPoint: "DRAG_START";
    assignElementOptions: "CHANGE_ELEMENT_OPTIONS";
    changeElementShape: "CHANGE_ELEMENT_SHAPE";
    copySelectedElements: "SELECTED_ELEMENTS.COPY" | "SELECTED_ELEMENTS.CUT";
    deleteElement: "DELETE_SELECTION";
    deleteSelectedElements:
      | "SELECTED_ELEMENTS.CUT"
      | "SELECTED_ELEMENTS.DELETE";
    drag: "DRAG" | "DRAG_END";
    draw: "DRAW" | "DRAW_END";
    drawElements:
      | ""
      | "CHANGE_ELEMENT_SHAPE"
      | "DELETE_SELECTION"
      | "DRAG"
      | "DRAG_END"
      | "DRAW"
      | "DRAW_END"
      | "DRAW_START"
      | "SELECTED_ELEMENTS.CUT"
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.PASTE"
      | "xstate.stop";
    loadSavedContext: "xstate.init";
    pasteSelectedElements: "SELECTED_ELEMENTS.PASTE";
    persist:
      | ""
      | "CHANGE_ELEMENT_OPTIONS"
      | "CHANGE_ELEMENT_SHAPE"
      | "IS_ELEMENT_SHAPE_FIXED_TOGGLE"
      | "SELECTED_ELEMENTS.COPY"
      | "SELECTED_ELEMENTS.CUT"
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.PASTE";
    resetElementShape: "DRAW_END";
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
    | "drag ended"
    | "dragging"
    | "draw ended"
    | "drawing"
    | "element shape reset"
    | "idle"
    | "loading"
    | "persisting";
  tags: never;
}
