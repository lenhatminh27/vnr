export const GRID_SIZE = 20;

export type ElementCategory =
  | "Nature"
  | "People"
  | "Animals"
  | "Buildings"
  | "Decorations";

export interface Size {
  width: number;
  height: number;
}

export interface RatioPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const FRAME_PRESETS: RatioPreset[] = [
  { id: "square", label: "1:1", width: 1600, height: 1600 },
  { id: "landscape", label: "4:3", width: 1600, height: 1200 },
  { id: "wide", label: "16:9", width: 1600, height: 900 },
  { id: "portrait", label: "4:5", width: 1600, height: 2000 },
  { id: "story", label: "9:16", width: 1080, height: 1920 },
];

export const DEFAULT_FRAME_PRESET = FRAME_PRESETS[2];

export interface ElementLibraryItem {
  id: string;
  name: string;
  category: ElementCategory;
  imageUrl: string;
  defaultWidth: number;
  defaultHeight: number;
}

export type CanvasObjectType = "library" | "image" | "text" | "stroke";

export interface CanvasObjectBase {
  id: string;
  objectType: CanvasObjectType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

export interface VisualCanvasObject extends CanvasObjectBase {
  width: number;
  height: number;
}

export interface LibraryCanvasObject extends VisualCanvasObject {
  objectType: "library";
  libraryId: string;
  src: string;
}

export interface ImageCanvasObject extends VisualCanvasObject {
  objectType: "image";
  src: string;
}

export interface TextCanvasObject extends VisualCanvasObject {
  objectType: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontStyle?: "normal" | "bold";
}

export interface StrokeCanvasObject extends VisualCanvasObject {
  objectType: "stroke";
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export type CanvasObject =
  | LibraryCanvasObject
  | ImageCanvasObject
  | TextCanvasObject
  | StrokeCanvasObject;

export interface EditorState {
  objects: CanvasObject[];
  selectedObjectId: string | null;
  background: string;
  zoom: number;
  snapToGrid: boolean;
  canvasSize: Size;
  framePresetId: string;
  brushColor: string;
  brushSize: number;
}
