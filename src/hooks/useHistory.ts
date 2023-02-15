import { useMemo } from "react";
import { useCallback, useReducer } from "react";
import { calculateNormalizedValue } from "../utils";

type State<T> = {
  versions: T[];
  currentVersionIndex: number;
};

type Action<T> =
  | {
      type: "ADD";
      version: T;
    }
  | {
      type: "CHANGE";
      change: 1 | -1;
    };

export function useHistory<T extends Record<string, unknown>>(
  value: T | (() => T)
) {
  const [{ versions, currentVersionIndex }, sendEvent] = useReducer(
    (state: State<T>, action: Action<T>): State<T> => {
      switch (action.type) {
        case "ADD":
          const isLatestVersion =
            state.versions.length - 1 === state.currentVersionIndex;
          const updatedVersions = isLatestVersion
            ? [...state.versions, action.version]
            : [
                ...state.versions.slice(0, state.currentVersionIndex + 1),
                action.version,
              ];

          return {
            versions: updatedVersions,
            currentVersionIndex: state.currentVersionIndex + 1,
          };
        case "CHANGE":
          const minimumVersionIndex = 0;
          const maximumVersionIndex = state.versions.length - 1;

          const updatedVersionIndex = calculateNormalizedValue({
            minimum: minimumVersionIndex,
            value: state.currentVersionIndex + action.change,
            maximum: maximumVersionIndex,
          });

          return {
            ...state,
            currentVersionIndex: updatedVersionIndex,
          };
      }
    },
    undefined,
    () => {
      const initialVersion = typeof value === "function" ? value() : value;

      return {
        versions: [initialVersion],
        currentVersionIndex: 0,
      };
    }
  );

  const addHistory = useCallback((version: T) => {
    sendEvent({
      type: "ADD",
      version,
    });
  }, []);

  const changeVersion = useCallback((change: 1 | -1) => {
    sendEvent({
      type: "CHANGE",
      change,
    });
  }, []);

  const canUndo = useMemo(() => {
    return currentVersionIndex !== 0;
  }, [currentVersionIndex]);

  return {
    addHistory,
    changeVersion,
    canUndo,
    canRedo: currentVersionIndex !== versions.length - 1,
    versions,
    currentVersionIndex,
  };
}
