"use client";

import { Copy, Layers3, PencilLine, Trash2 } from "lucide-react";
import { useState } from "react";
import type { CanvasObject, RatioPreset, TextCanvasObject } from "@/types/editor";

interface PropertiesPanelProps {
  selectedObject: CanvasObject | null;
  background: string;
  onChangeBackground: (color: string) => void;
  onUpdateObject: (objectId: string, updates: Partial<CanvasObject>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  layerList: CanvasObject[];
  selectedObjectId: string | null;
  onSelectLayer: (objectId: string) => void;
  framePresetId: string;
  framePresets: RatioPreset[];
  onChangeFramePreset: (presetId: string) => void;
  brushColor: string;
  brushSize: number;
  onChangeBrushColor: (color: string) => void;
  onChangeBrushSize: (size: number) => void;
}

const BACKGROUND_SWATCHES = ["#ffffff", "#fff4d6", "#dff7f1", "#ebefff", "#ffe1eb", "#f1f5f9"];
const TEXT_SWATCHES = ["#0f172a", "#2563eb", "#db2777", "#f97316", "#059669", "#7c3aed"];

function Field({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-600">
      {label}
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        className="wire-input w-full min-w-0 !text-sm !px-2 !py-1"
      />
    </label>
  );
}

export function PropertiesPanel({
  selectedObject,
  background,
  onChangeBackground,
  onUpdateObject,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  layerList,
  selectedObjectId,
  onSelectLayer,
  framePresetId,
  framePresets,
  onChangeFramePreset,
  brushColor,
  brushSize,
  onChangeBrushColor,
  onChangeBrushSize,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"design" | "layers">("design");
  const textObject = selectedObject?.objectType === "text" ? (selectedObject as TextCanvasObject) : null;

  return (
    <aside className="panel-surface flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b-[2px] border-black px-2.5 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-black/60">Inspector</p>
            <h2 className="mt-0.5 text-base text-black">{selectedObject ? selectedObject.name : "Nothing selected"}</h2>
          </div>
          <div className="wire-card flex p-1">
            <button
              type="button"
              onClick={() => setActiveTab("design")}
              className={`rounded-[8px] px-2 py-1 text-sm ${activeTab === "design" ? "bg-[#ffe56f] text-black border-[2px] border-black" : "text-black/60"}`}
            >
              Design
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("layers")}
              className={`rounded-[8px] px-2 py-1 text-sm ${activeTab === "layers" ? "bg-[#ffe56f] text-black border-[2px] border-black" : "text-black/60"}`}
            >
              Layers
            </button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-2">
        {activeTab === "layers" ? (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <Layers3 size={16} className="text-slate-400" />
              <h3 className="text-sm text-black">Layers</h3>
            </div>
            <div className="space-y-1.5">
              {[...layerList].reverse().map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => onSelectLayer(layer.id)}
                  className={`wire-card flex w-full items-center justify-between px-2 py-1.5 text-left text-sm ${
                    selectedObjectId === layer.id ? "bg-[#ffe56f]" : ""
                  }`}
                >
                  <span className="truncate">{layer.name}</span>
                  <span className="rounded-full border-[2px] border-black bg-[#f1ede0] px-1.5 py-0.5 text-[10px] text-black">{layer.objectType}</span>
                </button>
              ))}
              {!layerList.length && (
                <div className="rounded-[14px] border-[2px] border-dashed border-black px-3 py-4 text-sm text-black/70">
                  Add content to populate layers.
                </div>
              )}
            </div>
          </section>
        ) : (
          <div className="space-y-3">
            <section className="wire-card space-y-2.5 p-3">
              <h3 className="text-sm text-black">Frame</h3>
              <select
                value={framePresetId}
                onChange={(event) => onChangeFramePreset(event.target.value)}
                className="wire-input w-full min-w-0 !text-sm !px-1 !py-0.5"
              >
                {framePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>

              <div>
                <div className="mb-1.5 text-xs text-black">Background</div>
                <div className="flex flex-wrap gap-1.5">
                  {BACKGROUND_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => onChangeBackground(swatch)}
                      className={`h-8 w-8 rounded-[10px] border-[2px] ${background === swatch ? "border-black" : "border-black/30"}`}
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="wire-card space-y-2.5 p-3">
              <div className="flex items-center gap-2">
                <PencilLine size={16} className="text-slate-400" />
                <h3 className="text-sm text-black">Brush</h3>
              </div>
              <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                Color
                <input
                  type="color"
                  value={brushColor}
                  onChange={(event) => onChangeBrushColor(event.target.value)}
                  className="h-10 w-full rounded-[12px] border-[2px] border-black bg-white p-1"
                />
              </label>
              <Field label="Size" value={brushSize} min={1} max={64} onChange={(value) => onChangeBrushSize(Math.max(1, Math.min(64, value)))} />
            </section>

            {selectedObject ? (
              <section className="wire-card space-y-3 p-3">
                <h3 className="text-sm text-black">Selection</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="X" value={selectedObject.x} onChange={(value) => onUpdateObject(selectedObject.id, { x: value })} />
                  <Field label="Y" value={selectedObject.y} onChange={(value) => onUpdateObject(selectedObject.id, { y: value })} />
                  <Field
                    label="Width"
                    min={20}
                    value={selectedObject.width}
                    onChange={(value) => onUpdateObject(selectedObject.id, { width: Math.max(20, value) })}
                  />
                  <Field
                    label="Height"
                    min={20}
                    value={selectedObject.height}
                    onChange={(value) => onUpdateObject(selectedObject.id, { height: Math.max(20, value) })}
                  />
                  <Field label="Rotation" value={selectedObject.rotation} onChange={(value) => onUpdateObject(selectedObject.id, { rotation: value })} />
                  <Field
                    label="Opacity"
                    step={0.05}
                    min={0.05}
                    max={1}
                    value={selectedObject.opacity}
                    onChange={(value) => onUpdateObject(selectedObject.id, { opacity: Math.min(1, Math.max(0.05, value)) })}
                  />
                </div>

                {textObject && (
                  <div className="wire-card space-y-2.5 p-2.5">
                    <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                      Text
                      <textarea
                        value={textObject.text}
                        onChange={(event) => onUpdateObject(textObject.id, { text: event.target.value } as Partial<CanvasObject>)}
                        rows={4}
                        className="wire-input w-full min-w-0 resize-none !text-sm !px-2 !py-1"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Field
                        label="Font size"
                        min={10}
                        value={textObject.fontSize}
                        onChange={(value) => onUpdateObject(textObject.id, { fontSize: Math.max(10, value) } as Partial<CanvasObject>)}
                      />
                      <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                        Font
                        <select
                          value={textObject.fontFamily}
                          onChange={(event) => onUpdateObject(textObject.id, { fontFamily: event.target.value } as Partial<CanvasObject>)}
                          className="wire-input w-full min-w-0 !text-sm !px-1 !py-0.5"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Trebuchet MS">Trebuchet MS</option>
                          <option value="Courier New">Courier New</option>
                        </select>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TEXT_SWATCHES.map((swatch) => (
                        <button
                          key={swatch}
                          type="button"
                          onClick={() => onUpdateObject(textObject.id, { fill: swatch } as Partial<CanvasObject>)}
                          className={`h-7 w-7 rounded-full border-[2px] ${textObject.fill === swatch ? "border-black" : "border-black/30"}`}
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedObject.objectType === "stroke" && (
                  <div className="wire-card space-y-2.5 p-2.5">
                    <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                      Stroke color
                      <input
                        type="color"
                        value={selectedObject.stroke}
                        onChange={(event) => onUpdateObject(selectedObject.id, { stroke: event.target.value } as Partial<CanvasObject>)}
                        className="h-10 w-full rounded-[12px] border-[2px] border-black bg-white p-1"
                      />
                    </label>
                    <Field
                      label="Stroke width"
                      min={1}
                      max={64}
                      value={selectedObject.strokeWidth}
                      onChange={(value) => onUpdateObject(selectedObject.id, { strokeWidth: Math.max(1, Math.min(64, value)) } as Partial<CanvasObject>)}
                    />
                  </div>
                )}

                <div className="grid gap-1.5">
                  <button type="button" onClick={onBringForward} className="wire-btn justify-center !text-sm">
                    Front
                  </button>
                  <button type="button" onClick={onSendBackward} className="wire-btn justify-center !text-sm">
                    Back
                  </button>
                </div>

                <div className="grid gap-1.5 pt-1">
                  <button type="button" onClick={onDuplicate} className="wire-btn wire-btn-active justify-center !text-sm">
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <button type="button" onClick={onDelete} className="wire-btn justify-center bg-[#ffd6d6] !text-sm">
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </section>
            ) : (
              <section className="rounded-[14px] border-[2px] border-dashed border-black bg-[#f7f2df] px-4 py-6 text-sm leading-5 text-black/70">
                Select an object to edit its properties.
              </section>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
