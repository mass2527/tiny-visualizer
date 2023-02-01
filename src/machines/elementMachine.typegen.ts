// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    drag: "DRAG" | "DRAG_END";
    select: "UPDATE_END";
    unselect: "UNSELECT";
    update: "UPDATE" | "UPDATE_END";
    updateDraw: "DRAG" | "DRAG_END" | "UPDATE" | "UPDATE_END";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {};
  matchesStates: "deleted" | "idle";
  tags: never;
}
