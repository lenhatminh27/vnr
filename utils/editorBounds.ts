import type { CanvasObject } from "@/types/editor";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getObjectBounds(object: CanvasObject): Bounds {
  if (object.objectType === "stroke") {
    const xPoints = object.points.filter((_, index) => index % 2 === 0);
    const yPoints = object.points.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xPoints, 0);
    const maxX = Math.max(...xPoints, object.width);
    const minY = Math.min(...yPoints, 0);
    const maxY = Math.max(...yPoints, object.height);

    return {
      x: object.x + minX,
      y: object.y + minY,
      width: Math.max(object.strokeWidth, maxX - minX),
      height: Math.max(object.strokeWidth, maxY - minY),
    };
  }

  return {
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
  };
}
