"use client";

import type Konva from "konva";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type { CanvasObject, StrokeCanvasObject, TextCanvasObject } from "@/types/editor";
import { GRID_SIZE, type Size } from "@/types/editor";

interface CanvasEditorProps {
  objects: CanvasObject[];
  selectedObjectId: string | null;
  background: string;
  zoom: number;
  onZoomChange: (nextZoom: number) => void;
  snapToGrid: boolean;
  canvasSize: Size;
  activeTool: "select" | "paint";
  brushColor: string;
  brushSize: number;
  onSelectObject: (objectId: string | null) => void;
  onUpdateObject: (objectId: string, updates: Partial<CanvasObject>) => void;
  onCreateStroke: (stroke: Omit<StrokeCanvasObject, "id" | "zIndex">) => void;
  onDropLibraryItem: (x: number, y: number, payload: string) => void;
  stageRef: RefObject<Konva.Stage | null>;
}

function useHtmlImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const nextImage = new window.Image();
    nextImage.src = src;
    nextImage.onload = () => setImage(nextImage);
  }, [src]);

  return image;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function snap(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function getPointerPosition(stage: Konva.Stage) {
  const position = stage.getPointerPosition();
  if (!position) {
    return null;
  }

  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  return transform.point(position);
}

function VisualObjectItem({
  object,
  isSelected,
  onSelect,
  onUpdate,
  snapToGrid,
  canvasSize,
}: {
  object: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasObject>) => void;
  snapToGrid: boolean;
  canvasSize: Size;
}) {
  const image = useHtmlImage("src" in object ? object.src : "");
  const imageRef = useRef<Konva.Image>(null);
  const textRef = useRef<Konva.Text>(null);
  const rectRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const currentNode = textRef.current ?? imageRef.current ?? rectRef.current;
    if (isSelected && transformerRef.current && currentNode) {
      transformerRef.current.nodes([currentNode]);
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, object.height, object.rotation, object.width, object.x, object.y]);

  const handleTransformEnd = () => {
    const node = textRef.current ?? imageRef.current ?? rectRef.current;
    if (!node) {
      return;
    }

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const nextWidth = clamp(Math.max(30, object.width * scaleX), 30, canvasSize.width);
    const nextHeight = clamp(Math.max(30, object.height * scaleY), 30, canvasSize.height);
    node.scaleX(1);
    node.scaleY(1);

    const nextUpdates: Partial<CanvasObject> = {
      x: clamp(node.x(), 0, canvasSize.width - nextWidth),
      y: clamp(node.y(), 0, canvasSize.height - nextHeight),
      width: snapToGrid ? snap(nextWidth) : nextWidth,
      height: snapToGrid ? snap(nextHeight) : nextHeight,
      rotation: object.rotation,
    };

    if (object.objectType === "text") {
      const nextFontSize = Math.max(12, object.fontSize * ((scaleX + scaleY) / 2));
      (nextUpdates as Partial<TextCanvasObject>).fontSize = nextFontSize;
    }

    onUpdate(nextUpdates);
  };

  const sharedVisualProps = {
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    draggable: true,
    onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
      event.cancelBubble = true;
      onSelect();
    },
    onTap: (event: Konva.KonvaEventObject<Event>) => {
      event.cancelBubble = true;
      onSelect();
    },
    onDragStart: onSelect,
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      const widthBoundary = canvasSize.width - object.width;
      const heightBoundary = canvasSize.height - object.height;
      const rawX = clamp(event.target.x(), 0, Math.max(0, widthBoundary));
      const rawY = clamp(event.target.y(), 0, Math.max(0, heightBoundary));
      onUpdate({
        x: snapToGrid ? snap(rawX) : rawX,
        y: snapToGrid ? snap(rawY) : rawY,
      });
    },
    onTransformEnd: handleTransformEnd,
  };

  return (
    <>
      {object.objectType === "text" ? (
        <Text
          ref={textRef}
          {...sharedVisualProps}
          text={object.text}
          width={object.width}
          height={object.height}
          fontSize={object.fontSize}
          fontStyle={object.fontStyle}
          fontFamily={object.fontFamily}
          fill={object.fill}
          opacity={object.opacity}
          lineHeight={1.15}
        />
      ) : image ? (
        <KonvaImage
          ref={imageRef}
          {...sharedVisualProps}
          image={image}
          width={object.width}
          height={object.height}
          opacity={object.opacity}
        />
      ) : (
        <Rect
          ref={rectRef}
          {...sharedVisualProps}
          width={object.width}
          height={object.height}
          fill="#e2e8f0"
          cornerRadius={24}
          opacity={0.7}
        />
      )}

      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 30 || newBox.height < 30) {
              return oldBox;
            }
            return newBox;
          }}
          anchorCornerRadius={12}
          anchorStroke="#111111"
          anchorFill="#fffdf7"
          borderStroke="#111111"
          borderStrokeWidth={3}
        />
      )}
    </>
  );
}

function StrokeItem({
  object,
  isSelected,
  onSelect,
  onUpdate,
  snapToGrid,
  canvasSize,
}: {
  object: StrokeCanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasObject>) => void;
  snapToGrid: boolean;
  canvasSize: Size;
}) {
  return (
    <>
      <Line
        points={object.points}
        x={object.x}
        y={object.y}
        draggable
        stroke={object.stroke}
        strokeWidth={object.strokeWidth}
        lineCap="round"
        lineJoin="round"
        tension={0.2}
        opacity={object.opacity}
        onClick={(event) => {
          event.cancelBubble = true;
          onSelect();
        }}
        onTap={(event) => {
          event.cancelBubble = true;
          onSelect();
        }}
        onDragStart={onSelect}
        onDragEnd={(event) => {
          const rawX = clamp(event.target.x(), 0, Math.max(0, canvasSize.width - object.width));
          const rawY = clamp(event.target.y(), 0, Math.max(0, canvasSize.height - object.height));
          onUpdate({
            x: snapToGrid ? snap(rawX) : rawX,
            y: snapToGrid ? snap(rawY) : rawY,
          });
        }}
      />
      {isSelected && (
        <Rect
          x={object.x - 8}
          y={object.y - 8}
          width={object.width + 16}
          height={object.height + 16}
          stroke="#111111"
          dash={[10, 8]}
          cornerRadius={8}
          strokeWidth={3}
        />
      )}
    </>
  );
}

export function CanvasEditor({
  objects,
  selectedObjectId,
  background,
  zoom,
  onZoomChange,
  snapToGrid,
  canvasSize,
  activeTool,
  brushColor,
  brushSize,
  onSelectObject,
  onUpdateObject,
  onCreateStroke,
  onDropLibraryItem,
  stageRef,
}: CanvasEditorProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draftPoints, setDraftPoints] = useState<number[]>([]);
  const [isPainting, setIsPainting] = useState(false);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      const isZoomGesture = event.ctrlKey || event.metaKey;
      if (isZoomGesture) {
        event.preventDefault();
        const nextZoom = clamp(zoom - event.deltaY * 0.0015, 0.35, 2.5);
        onZoomChange(nextZoom);
      }
    };

    scrollArea.addEventListener("wheel", handleWheel, { passive: false });
    return () => scrollArea.removeEventListener("wheel", handleWheel);
  }, [onZoomChange, zoom]);

  const beginPaint = (stage: Konva.Stage) => {
    const pointer = getPointerPosition(stage);
    if (!pointer) {
      return;
    }
    setIsPainting(true);
    setDraftPoints([pointer.x, pointer.y, pointer.x, pointer.y]);
  };

  const extendPaint = (stage: Konva.Stage) => {
    const pointer = getPointerPosition(stage);
    if (!pointer || !isPainting) {
      return;
    }
    setDraftPoints((current) => [...current, pointer.x, pointer.y]);
  };

  const finishPaint = () => {
    if (!isPainting || draftPoints.length < 4) {
      setIsPainting(false);
      setDraftPoints([]);
      return;
    }

    const xs = draftPoints.filter((_, index) => index % 2 === 0);
    const ys = draftPoints.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const normalizedPoints = draftPoints.map((point, index) => (index % 2 === 0 ? point - minX : point - minY));

    onCreateStroke({
      objectType: "stroke",
      name: "Brush Stroke",
      x: minX,
      y: minY,
      width: Math.max(...xs) - minX,
      height: Math.max(...ys) - minY,
      rotation: 0,
      opacity: 1,
      points: normalizedPoints,
      stroke: brushColor,
      strokeWidth: brushSize,
    });
    setIsPainting(false);
    setDraftPoints([]);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#ece8dd]">
      <div ref={scrollAreaRef} className="flex-1 overflow-auto">
        <div
          className="flex items-center justify-center"
          style={{
            minWidth: `max(100%, ${canvasSize.width * zoom}px)`,
            minHeight: `max(100%, ${canvasSize.height * zoom}px)`,
          }}
        >
          <div
            ref={containerRef}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const payload = event.dataTransfer.getData("application/json");
              if (!payload || !containerRef.current) {
                return;
              }

              const bounds = containerRef.current.getBoundingClientRect();
              const relativeX = (event.clientX - bounds.left) / zoom;
              const relativeY = (event.clientY - bounds.top) / zoom;
              onDropLibraryItem(relativeX, relativeY, payload);
            }}
            className="relative"
          >
            <div
              className={`origin-top-left overflow-hidden border-[3px] border-black bg-white ${activeTool === "paint" ? "cursor-crosshair" : "cursor-default"}`}
              style={{
                width: canvasSize.width * zoom,
                height: canvasSize.height * zoom,
              }}
            >
            <Stage
              ref={stageRef}
              width={canvasSize.width}
              height={canvasSize.height}
              scaleX={zoom}
              scaleY={zoom}
              onMouseDown={(event) => {
                const isBackground = event.target === event.target.getStage() || event.target.id() === "canvas-background";
                if (isBackground) {
                  if (activeTool === "paint" && stageRef.current) {
                    beginPaint(stageRef.current);
                    return;
                  }
                  onSelectObject(null);
                }
              }}
              onTouchStart={(event) => {
                const isBackground = event.target === event.target.getStage() || event.target.id() === "canvas-background";
                if (isBackground) {
                  if (activeTool === "paint" && stageRef.current) {
                    beginPaint(stageRef.current);
                    return;
                  }
                  onSelectObject(null);
                }
              }}
              onMouseMove={() => {
                if (activeTool === "paint" && stageRef.current) {
                  extendPaint(stageRef.current);
                }
              }}
              onTouchMove={() => {
                if (activeTool === "paint" && stageRef.current) {
                  extendPaint(stageRef.current);
                }
              }}
              onMouseUp={finishPaint}
              onTouchEnd={finishPaint}
              style={{ background }}
            >
              <Layer>
                <Rect id="canvas-background" width={canvasSize.width} height={canvasSize.height} fill={background} />
                {objects.length === 0 && (
                  <Group x={canvasSize.width / 2 - 210} y={canvasSize.height / 2 - 56}>
                    <Rect width={360} height={100} fill="#fff8c4" stroke="#111111" strokeWidth={3} cornerRadius={16} />
                    <Text
                      x={24}
                      y={24}
                      width={312}
                      align="center"
                      text="Drag in assets, add text, upload images, or switch to Paint mode."
                      fontSize={20}
                      lineHeight={1.35}
                      fill="#111111"
                    />
                  </Group>
                )}
                {[...objects]
                  .sort((left, right) => left.zIndex - right.zIndex)
                  .map((object) =>
                    object.objectType === "stroke" ? (
                      <StrokeItem
                        key={object.id}
                        object={object}
                        isSelected={object.id === selectedObjectId}
                        snapToGrid={snapToGrid}
                        canvasSize={canvasSize}
                        onSelect={() => onSelectObject(object.id)}
                        onUpdate={(updates) => onUpdateObject(object.id, updates)}
                      />
                    ) : (
                      <VisualObjectItem
                        key={object.id}
                        object={object}
                        isSelected={object.id === selectedObjectId}
                        snapToGrid={snapToGrid}
                        canvasSize={canvasSize}
                        onSelect={() => onSelectObject(object.id)}
                        onUpdate={(updates) => onUpdateObject(object.id, updates)}
                      />
                    ),
                  )}
                {draftPoints.length > 3 && (
                  <Line
                    points={draftPoints}
                    stroke={brushColor}
                    strokeWidth={brushSize}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.2}
                  />
                )}
              </Layer>
            </Stage>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
