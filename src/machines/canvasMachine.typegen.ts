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
    changeElementShape: "CHANGE_ELEMENT_SHAPE";
    copySelectedElements: "SELECTED_ELEMENTS.COPY";
    deleteElement: "DELETE_SELECTION";
    deleteSelectedElements: "SELECTED_ELEMENTS.DELETE";
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
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.PASTE"
      | "xstate.stop";
    loadSavedContext: "xstate.init";
    pasteSelectedElements: "SELECTED_ELEMENTS.PASTE";
    persist:
      | ""
      | "CHANGE_ELEMENT_SHAPE"
      | "SELECTED_ELEMENTS.COPY"
      | "SELECTED_ELEMENTS.DELETE"
      | "SELECTED_ELEMENTS.PASTE";
    selectDrawingElement: "DRAW_END";
    unselectElements: "CHANGE_ELEMENT_SHAPE" | "DRAW_START";
    updateIntersecting: "DRAW" | "DRAW_END";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {};
  matchesStates:
    | "drag ended"
    | "dragging"
    | "draw ended"
    | "drawing"
    | "idle"
    | "loading"
    | "persisting";
  tags: never;
}
