// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: "draw" | "generateDraw";
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    addElement: "DRAW_START";
    changeElementShape: "CHANGE_ELEMENT_SHAPE";
    deleteElement: "ELEMENT.DELETE";
    draw: "ELEMENT.DELETE" | "ELEMENT.UPDATE" | "ELEMENT.UPDATE_END";
    generateDraw: "ELEMENT.UPDATE" | "ELEMENT.UPDATE_END";
    stopElement: "ELEMENT.DELETE";
    updateElement: "ELEMENT.UPDATE" | "ELEMENT.UPDATE_END";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {};
  matchesStates: "drawing" | "idle";
  tags: never;
}
