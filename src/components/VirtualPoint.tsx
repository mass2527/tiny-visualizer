import { MouseEventHandler } from "react";

export const VIRTUAL_POINT_WIDTH = 8;
export const VIRTUAL_POINT_HEIGHT = 8;

export type VirtualPointProps = {
  type?: "square" | "circle";
  left: number;
  top: number;
  width?: number;
  height?: number;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
};

function VirtualPoint({
  type = "square",
  left,
  top,
  width = VIRTUAL_POINT_WIDTH,
  height = VIRTUAL_POINT_HEIGHT,
  onMouseDown,
}: VirtualPointProps) {
  return (
    <div
      role="button"
      className={`absolute border border-blue9 bg-white cursor-pointer
      ${type === "circle" ? "rounded-full" : "rounded-sm"}`}
      style={{
        left: left - width / 2,
        top: top - height / 2,
        width,
        height,
      }}
      onMouseDown={onMouseDown}
    />
  );
}

export default VirtualPoint;
