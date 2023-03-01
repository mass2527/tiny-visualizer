import { MouseEventHandler } from "react";

export const VIRTUAL_POINT_WIDTH = 8;
export const VIRTUAL_POINT_HEIGHT = 8;

function VirtualPoint({
  type = "square",
  left,
  top,
  width = VIRTUAL_POINT_WIDTH,
  height = VIRTUAL_POINT_HEIGHT,
  onMouseDown,
}: {
  type?: "square" | "circle";
  left: number;
  top: number;
  width?: number;
  height?: number;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      role='button'
      style={{
        position: "absolute",
        left: left - width / 2,
        top: top - height / 2,
        width,
        height,
        backgroundColor: "dodgerblue",
        cursor: "pointer",
        borderRadius: type === "circle" ? "50%" : undefined,
      }}
      onMouseDown={onMouseDown}
    />
  );
}

export default VirtualPoint;
