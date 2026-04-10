import type Konva from "konva";

interface ExportStageOptions {
  fileName?: string;
  pixelRatio?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function exportStageToPng(stage: Konva.Stage, options: ExportStageOptions = {}) {
  const previousScale = {
    x: stage.scaleX(),
    y: stage.scaleY(),
  };

  stage.scale({ x: 1, y: 1 });
  stage.batchDraw();

  const dataUrl = stage.toDataURL({
    pixelRatio: options.pixelRatio ?? 2,
    x: options.crop?.x,
    y: options.crop?.y,
    width: options.crop?.width,
    height: options.crop?.height,
  });

  stage.scale(previousScale);
  stage.batchDraw();

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = options.fileName ?? "personalized-art.png";
  link.click();
}
