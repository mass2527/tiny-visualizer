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
    assignDragStartPoint: "DRAG_START";
    changeElementShape: "CHANGE_ELEMENT_SHAPE";
    deleteElement: "DELETE_SELECTION";
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
      | "xstate.stop";
    loadSavedContext: "xstate.init";
    persist: "" | "CHANGE_ELEMENT_SHAPE";
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
