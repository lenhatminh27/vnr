"use client";

import {
  BrushCleaning,
  Download,
  MousePointer2,
  Redo2,
  RotateCcw,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ReactNode } from "react";
import type { RatioPreset } from "@/types/editor";

interface TopToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onReset: () => void;
  zoom: number;
  onZoomChange: (nextZoom: number) => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  framePresetId: string;
  framePresets: RatioPreset[];
  onChangeFramePreset: (presetId: string) => void;
  activeTool: "select" | "paint";
  onChangeTool: (tool: "select" | "paint") => void;
}

function IconButton({
  label,
  active,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`wire-btn !px-2 !py-1 !text-sm ${active ? "wire-btn-active" : ""} disabled:cursor-not-allowed`}
    >
      {icon}
      {label}
    </button>
  );
}

export function TopToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onReset,
  zoom,
  onZoomChange,
  snapToGrid,
  onToggleSnap,
  framePresetId,
  framePresets,
  onChangeFramePreset,
  activeTool,
  onChangeTool,
}: TopToolbarProps) {
  return (
    <div className="panel-surface flex h-auto flex-col gap-1.5 px-2.5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[2px] border-black pb-1.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[10px] border-[2px] border-black bg-[#ffe56f] text-sm text-black">A</div>
          <div>
            <p className="text-[10px] tracking-[0.14em] text-black/60">Workspace</p>
            <h1 className="text-base text-black">Artwork Editor</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-black/55">
          <span>{Math.round(zoom * 100)}%</span>
          <span>{snapToGrid ? "Snap on" : "Snap off"}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="wire-card flex items-center gap-1 p-0.5">
          <IconButton label="Move" active={activeTool === "select"} onClick={() => onChangeTool("select")} icon={<MousePointer2 size={14} />} />
          <IconButton label="Paint" active={activeTool === "paint"} onClick={() => onChangeTool("paint")} icon={<BrushCleaning size={14} />} />
        </div>

        <div className="wire-card flex items-center gap-1.5 px-2 py-1">
          <span className="text-xs text-black/60">Frame</span>
          <select
            value={framePresetId}
            onChange={(event) => onChangeFramePreset(event.target.value)}
            className="bg-transparent pr-4 text-sm text-black outline-none"
          >
            {framePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <IconButton label="Undo" onClick={onUndo} disabled={!canUndo} icon={<Undo2 size={14} />} />
        <IconButton label="Redo" onClick={onRedo} disabled={!canRedo} icon={<Redo2 size={14} />} />

        <div className="wire-card flex items-center gap-1 px-1 py-0.5">
          <button type="button" onClick={() => onZoomChange(Math.max(0.35, zoom - 0.1))} className="wire-btn !px-1.5 !py-1">
            <ZoomOut size={14} />
          </button>
          <span className="min-w-10 text-center text-sm text-black">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))} className="wire-btn !px-1.5 !py-1">
            <ZoomIn size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleSnap}
          className={`wire-btn !px-2 !py-1 !text-sm ${snapToGrid ? "wire-btn-active" : ""}`}
        >
          Snap
        </button>

        <IconButton label="Export" onClick={onExport} icon={<Download size={14} />} />
        <IconButton label="Reset" onClick={onReset} icon={<RotateCcw size={14} />} />
      </div>
    </div>
  );
}
