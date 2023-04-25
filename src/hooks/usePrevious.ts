import { useEffect, useRef } from "react";

export function usePrevious<T>(value: T) {
  const previousRef = useRef(value);

  useEffect(() => {
    previousRef.current = value;
  }, [value]);

  return previousRef.current;
}
