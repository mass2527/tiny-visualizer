// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: "draw";
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    addElement: "DRAW_START";
    assignDragStartPoint: "DRAG_START" | "ELEMENT.DRAG";
    changeElementShape: "CHANGE_ELEMENT_SHAPE";
    deleteElement: "ELEMENT.DELETE";
    draw:
      | "CHANGE_ELEMENT_SHAPE"
      | "DRAW_START"
      | "ELEMENT.DELETE"
      | "ELEMENT.DRAG"
      | "ELEMENT.DRAG_END"
      | "ELEMENT.UPDATE"
      | "ELEMENT.UPDATE_END";
    stopElement: "ELEMENT.DELETE";
    unselectElements: "CHANGE_ELEMENT_SHAPE" | "DRAW_START";
    updateElement:
      | "ELEMENT.DRAG"
      | "ELEMENT.DRAG_END"
      | "ELEMENT.UPDATE"
      | "ELEMENT.UPDATE_END";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {};
  matchesStates: "dragging" | "drawing" | "idle";
  tags: never;
}
