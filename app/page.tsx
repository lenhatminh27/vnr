"use client"

import type Konva from "konva"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ElementSidebar } from "@/components/ElementSidebar"
import { PropertiesPanel } from "@/components/PropertiesPanel"
import { TopToolbar } from "@/components/TopToolbar"
import { elementLibrary } from "@/data/elements"
import { useEditorHistory } from "@/hooks/useEditorHistory"
import type {
  CanvasObject,
  EditorState,
  ElementLibraryItem,
  ImageCanvasObject,
  Size,
  StrokeCanvasObject,
} from "@/types/editor"
import { DEFAULT_FRAME_PRESET, FRAME_PRESETS, GRID_SIZE } from "@/types/editor"
import { exportStageToPng } from "@/utils/exportCanvas"

const CanvasEditor = dynamic(
  () =>
    import("@/components/CanvasEditor").then((module) => module.CanvasEditor),
  {
    ssr: false,
  },
)

const STORAGE_KEY = "personalized-art-editor-state"

const INITIAL_STATE: EditorState = {
  objects: [],
  selectedObjectId: null,
  background: "#ffffff",
  zoom: 0.55,
  snapToGrid: true,
  framePresetId: DEFAULT_FRAME_PRESET.id,
  canvasSize: {
    width: DEFAULT_FRAME_PRESET.width,
    height: DEFAULT_FRAME_PRESET.height,
  },
  brushColor: "#0f172a",
  brushSize: 10,
}

function createLibraryObject(
  item: ElementLibraryItem,
  x = 160,
  y = 140,
  zIndex = 0,
): CanvasObject {
  return {
    id: `${item.id}-${crypto.randomUUID()}`,
    objectType: "library",
    libraryId: item.id,
    name: item.name,
    src: item.imageUrl,
    x,
    y,
    width: item.defaultWidth,
    height: item.defaultHeight,
    rotation: 0,
    opacity: 1,
    zIndex,
  }
}

function createTextObject(zIndex: number): CanvasObject {
  return {
    id: `text-${crypto.randomUUID()}`,
    objectType: "text",
    name: "Headline",
    text: "Your message here",
    x: 120,
    y: 120,
    width: 360,
    height: 140,
    fontSize: 56,
    fontFamily: "Inter",
    fill: "#0f172a",
    rotation: 0,
    opacity: 1,
    zIndex,
  }
}

function createImageObject(
  name: string,
  src: string,
  width: number,
  height: number,
  x: number,
  y: number,
  zIndex: number,
): ImageCanvasObject {
  return {
    id: `upload-${crypto.randomUUID()}`,
    objectType: "image",
    name,
    src,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    zIndex,
  }
}

function clampToCanvas(value: number, max: number) {
  return Math.min(Math.max(value, 0), max)
}

function snap(value: number, enabled: boolean) {
  if (!enabled) {
    return value
  }
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

function normalizeZIndexes(objects: CanvasObject[]) {
  return [...objects]
    .sort((left, right) => left.zIndex - right.zIndex)
    .map((object, index) => ({ ...object, zIndex: index }))
}

function fitObjectToCanvas(object: CanvasObject, canvasSize: Size) {
  const nextWidth = Math.min(object.width, canvasSize.width)
  const nextHeight = Math.min(object.height, canvasSize.height)
  return {
    ...object,
    width: nextWidth,
    height: nextHeight,
    x: clampToCanvas(object.x, Math.max(0, canvasSize.width - nextWidth)),
    y: clampToCanvas(object.y, Math.max(0, canvasSize.height - nextHeight)),
  }
}

function getExportBounds(objects: CanvasObject[], canvasSize: Size) {
  if (!objects.length) {
    return {
      x: 0,
      y: 0,
      width: canvasSize.width,
      height: canvasSize.height,
    }
  }

  const minX = Math.min(...objects.map((object) => object.x))
  const minY = Math.min(...objects.map((object) => object.y))
  const maxX = Math.max(...objects.map((object) => object.x + object.width))
  const maxY = Math.max(...objects.map((object) => object.y + object.height))

  const x = clampToCanvas(minX, canvasSize.width)
  const y = clampToCanvas(minY, canvasSize.height)
  const width = Math.max(1, Math.min(canvasSize.width - x, maxX - x))
  const height = Math.max(1, Math.min(canvasSize.height - y, maxY - y))

  return { x, y, width, height }
}

function getExportCrop(objects: CanvasObject[], canvasSize: Size) {
  const bounds = getExportBounds(objects, canvasSize)
  const targetRatio = canvasSize.width / canvasSize.height
  const boundsRatio = bounds.width / bounds.height

  let cropWidth = bounds.width
  let cropHeight = bounds.height

  if (boundsRatio > targetRatio) {
    cropHeight = cropWidth / targetRatio
  } else {
    cropWidth = cropHeight * targetRatio
  }

  cropWidth = Math.min(canvasSize.width, cropWidth)
  cropHeight = Math.min(canvasSize.height, cropHeight)

  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2

  const x = Math.min(
    Math.max(centerX - cropWidth / 2, 0),
    canvasSize.width - cropWidth,
  )
  const y = Math.min(
    Math.max(centerY - cropHeight / 2, 0),
    canvasSize.height - cropHeight,
  )

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(1, Math.round(cropWidth)),
    height: Math.max(1, Math.round(cropHeight)),
  }
}

export default function HomePage() {
  const stageRef = useRef<Konva.Stage | null>(null)
  const copyBufferRef = useRef<CanvasObject | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [activeTool, setActiveTool] = useState<"select" | "paint">("select")
  const history = useEditorHistory<EditorState>(INITIAL_STATE)
  const { state, set, undo, redo, reset, canUndo, canRedo } = history

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as EditorState
        reset({
          ...INITIAL_STATE,
          ...parsed,
          selectedObjectId: null,
        })
      }
    } catch {
      reset(INITIAL_STATE)
    } finally {
      setHydrated(true)
    }
  }, [reset])

  useEffect(() => {
    if (!hydrated) {
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [hydrated, state])

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selectedObject = useMemo(
    () =>
      state.objects.find((object) => object.id === state.selectedObjectId) ??
      null,
    [state.objects, state.selectedObjectId],
  )

  const setEditorState = useCallback(
    (updater: (current: EditorState) => EditorState, skipHistory = false) => {
      set((current) => updater(current), skipHistory)
    },
    [set],
  )

  const addItemToCanvas = useCallback(
    (item: ElementLibraryItem, x = 140, y = 120) => {
      setEditorState((current) => {
        const zIndex = current.objects.length
        const nextObject = createLibraryObject(
          item,
          clampToCanvas(
            snap(x, current.snapToGrid),
            current.canvasSize.width - item.defaultWidth,
          ),
          clampToCanvas(
            snap(y, current.snapToGrid),
            current.canvasSize.height - item.defaultHeight,
          ),
          zIndex,
        )

        return {
          ...current,
          selectedObjectId: nextObject.id,
          objects: [...current.objects, nextObject],
        }
      })
    },
    [setEditorState],
  )

  const updateObject = useCallback(
    (objectId: string, updates: Partial<CanvasObject>) => {
      setEditorState((current) => ({
        ...current,
        objects: current.objects.map((object) => {
          if (object.id !== objectId) {
            return object
          }

          const nextWidth = Math.max(20, updates.width ?? object.width)
          const nextHeight = Math.max(20, updates.height ?? object.height)

          if (object.objectType === "stroke") {
            const scaleX = nextWidth / object.width
            const scaleY = nextHeight / object.height
            return {
              ...object,
              ...(updates as Partial<StrokeCanvasObject>),
              x:
                updates.x !== undefined
                  ? clampToCanvas(
                      snap(updates.x, current.snapToGrid),
                      current.canvasSize.width - nextWidth,
                    )
                  : object.x,
              y:
                updates.y !== undefined
                  ? clampToCanvas(
                      snap(updates.y, current.snapToGrid),
                      current.canvasSize.height - nextHeight,
                    )
                  : object.y,
              width: nextWidth,
              height: nextHeight,
              points:
                updates.width !== undefined || updates.height !== undefined
                  ? object.points.map((point, index) =>
                      index % 2 === 0 ? point * scaleX : point * scaleY,
                    )
                  : object.points,
            }
          }

          if (object.objectType === "text") {
            return {
              ...object,
              ...(updates as Partial<typeof object>),
              x:
                updates.x !== undefined
                  ? clampToCanvas(
                      snap(updates.x, current.snapToGrid),
                      current.canvasSize.width - nextWidth,
                    )
                  : object.x,
              y:
                updates.y !== undefined
                  ? clampToCanvas(
                      snap(updates.y, current.snapToGrid),
                      current.canvasSize.height - nextHeight,
                    )
                  : object.y,
              width: nextWidth,
              height: nextHeight,
            }
          }

          if (object.objectType === "library") {
            return {
              ...object,
              ...(updates as Partial<typeof object>),
              x:
                updates.x !== undefined
                  ? clampToCanvas(
                      snap(updates.x, current.snapToGrid),
                      current.canvasSize.width - nextWidth,
                    )
                  : object.x,
              y:
                updates.y !== undefined
                  ? clampToCanvas(
                      snap(updates.y, current.snapToGrid),
                      current.canvasSize.height - nextHeight,
                    )
                  : object.y,
              width: nextWidth,
              height: nextHeight,
            }
          }

          return {
            ...object,
            ...(updates as Partial<typeof object>),
            x:
              updates.x !== undefined
                ? clampToCanvas(
                    snap(updates.x, current.snapToGrid),
                    current.canvasSize.width - nextWidth,
                  )
                : object.x,
            y:
              updates.y !== undefined
                ? clampToCanvas(
                    snap(updates.y, current.snapToGrid),
                    current.canvasSize.height - nextHeight,
                  )
                : object.y,
            width: nextWidth,
            height: nextHeight,
          }
        }),
      }))
    },
    [setEditorState],
  )

  const deleteSelected = useCallback(() => {
    if (!state.selectedObjectId) {
      return
    }
    setEditorState((current) => ({
      ...current,
      selectedObjectId: null,
      objects: normalizeZIndexes(
        current.objects.filter(
          (object) => object.id !== current.selectedObjectId,
        ),
      ),
    }))
  }, [setEditorState, state.selectedObjectId])

  const duplicateSelected = useCallback(() => {
    if (!selectedObject) {
      return
    }
    setEditorState((current) => {
      const duplicated: CanvasObject = {
        ...selectedObject,
        id: `${selectedObject.objectType}-${crypto.randomUUID()}`,
        x: clampToCanvas(
          selectedObject.x + 32,
          current.canvasSize.width - selectedObject.width,
        ),
        y: clampToCanvas(
          selectedObject.y + 32,
          current.canvasSize.height - selectedObject.height,
        ),
        zIndex: current.objects.length,
        ...(selectedObject.objectType === "stroke"
          ? { points: [...selectedObject.points] }
          : {}),
      }

      return {
        ...current,
        selectedObjectId: duplicated.id,
        objects: [...current.objects, duplicated],
      }
    })
  }, [selectedObject, setEditorState])

  const bringToFront = useCallback(() => {
    if (!selectedObject) {
      return
    }
    setEditorState((current) => {
      const others = current.objects.filter(
        (object) => object.id !== selectedObject.id,
      )
      return {
        ...current,
        objects: normalizeZIndexes([
          ...others,
          { ...selectedObject, zIndex: current.objects.length },
        ]),
      }
    })
  }, [selectedObject, setEditorState])

  const sendToBack = useCallback(() => {
    if (!selectedObject) {
      return
    }
    setEditorState((current) => {
      const others = current.objects.filter(
        (object) => object.id !== selectedObject.id,
      )
      return {
        ...current,
        objects: normalizeZIndexes([
          { ...selectedObject, zIndex: -1 },
          ...others,
        ]),
      }
    })
  }, [selectedObject, setEditorState])

  const resetCanvas = useCallback(() => {
    reset(INITIAL_STATE)
    window.localStorage.removeItem(STORAGE_KEY)
    setActiveTool("select")
  }, [reset])

  const exportCanvas = useCallback(() => {
    if (!stageRef.current) {
      return
    }
    const previousSelection = state.selectedObjectId
    const crop = getExportCrop(state.objects, state.canvasSize)
    setEditorState((current) => ({ ...current, selectedObjectId: null }), true)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (stageRef.current) {
          exportStageToPng(stageRef.current, {
            fileName: `artboard-${state.framePresetId}.png`,
            pixelRatio: 2,
            crop,
          })
          setToast(
            `Exported PNG at ${FRAME_PRESETS.find((preset) => preset.id === state.framePresetId)?.label ?? "custom"} ratio`,
          )
        }
        setEditorState(
          (current) => ({ ...current, selectedObjectId: previousSelection }),
          true,
        )
      })
    })
  }, [
    setEditorState,
    state.canvasSize,
    state.framePresetId,
    state.objects,
    state.selectedObjectId,
  ])

  const pasteCopied = useCallback(() => {
    if (!copyBufferRef.current) {
      return
    }

    setEditorState((current) => {
      const source = copyBufferRef.current!
      const duplicated: CanvasObject = {
        ...source,
        id: `${source.objectType}-${crypto.randomUUID()}`,
        x: clampToCanvas(
          source.x + 36,
          current.canvasSize.width - source.width,
        ),
        y: clampToCanvas(
          source.y + 36,
          current.canvasSize.height - source.height,
        ),
        zIndex: current.objects.length,
        ...(source.objectType === "stroke"
          ? { points: [...source.points] }
          : {}),
      }

      return {
        ...current,
        selectedObjectId: duplicated.id,
        objects: [...current.objects, duplicated],
      }
    })
  }, [setEditorState])

  const addTextObject = useCallback(() => {
    setEditorState((current) => {
      const nextObject = createTextObject(current.objects.length)
      return {
        ...current,
        selectedObjectId: nextObject.id,
        objects: [
          ...current.objects,
          fitObjectToCanvas(nextObject, current.canvasSize),
        ],
      }
    })
  }, [setEditorState])

  const addUploadedImage = useCallback(
    async (file: File) => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })

      const naturalSize = await new Promise<Size>((resolve, reject) => {
        const image = new window.Image()
        image.onload = () =>
          resolve({ width: image.width, height: image.height })
        image.onerror = () => reject(new Error("Unable to load image"))
        image.src = dataUrl
      })

      setEditorState((current) => {
        const maxWidth = current.canvasSize.width * 0.45
        const maxHeight = current.canvasSize.height * 0.45
        const scale = Math.min(
          maxWidth / naturalSize.width,
          maxHeight / naturalSize.height,
          1,
        )
        const nextObject = createImageObject(
          file.name.replace(/\.[^/.]+$/, ""),
          dataUrl,
          Math.round(naturalSize.width * scale),
          Math.round(naturalSize.height * scale),
          120,
          120,
          current.objects.length,
        )

        return {
          ...current,
          selectedObjectId: nextObject.id,
          objects: [
            ...current.objects,
            fitObjectToCanvas(nextObject, current.canvasSize),
          ],
        }
      })

      setToast("Image uploaded to canvas")
    },
    [setEditorState],
  )

  const addStrokeObject = useCallback(
    (stroke: Omit<StrokeCanvasObject, "id" | "zIndex">) => {
      setEditorState((current) => {
        const nextStroke: StrokeCanvasObject = {
          ...stroke,
          id: `stroke-${crypto.randomUUID()}`,
          zIndex: current.objects.length,
        }
        return {
          ...current,
          selectedObjectId: nextStroke.id,
          objects: [
            ...current.objects,
            fitObjectToCanvas(nextStroke, current.canvasSize),
          ],
        }
      })
    },
    [setEditorState],
  )

  const changeFramePreset = useCallback(
    (presetId: string) => {
      const preset = FRAME_PRESETS.find((item) => item.id === presetId)
      if (!preset) {
        return
      }

      setEditorState((current) => ({
        ...current,
        framePresetId: preset.id,
        canvasSize: { width: preset.width, height: preset.height },
        objects: normalizeZIndexes(
          current.objects.map((object) =>
            fitObjectToCanvas(object, {
              width: preset.width,
              height: preset.height,
            }),
          ),
        ),
      }))
    },
    [setEditorState],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      if (isTyping) {
        return
      }

      const modifier = event.metaKey || event.ctrlKey
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        deleteSelected()
        return
      }

      if (modifier && event.key.toLowerCase() === "c" && selectedObject) {
        event.preventDefault()
        copyBufferRef.current = {
          ...selectedObject,
          ...(selectedObject.objectType === "stroke"
            ? { points: [...selectedObject.points] }
            : {}),
        }
        setToast("Copied selected object")
        return
      }

      if (modifier && event.key.toLowerCase() === "v") {
        event.preventDefault()
        pasteCopied()
        return
      }

      if (modifier && event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault()
        redo()
        return
      }

      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault()
        undo()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [deleteSelected, pasteCopied, redo, selectedObject, undo])

  if (!hydrated) {
    return <main className="min-h-screen p-6" />
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#ece8dd]">
      <div className="flex h-full w-full min-w-0 flex-col">
        <div className="shrink-0 p-2 pb-1.5">
          <TopToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onExport={exportCanvas}
            onReset={resetCanvas}
            zoom={state.zoom}
            onZoomChange={(nextZoom) =>
              setEditorState(
                (current) => ({ ...current, zoom: nextZoom }),
                true,
              )
            }
            snapToGrid={state.snapToGrid}
            onToggleSnap={() =>
              setEditorState(
                (current) => ({ ...current, snapToGrid: !current.snapToGrid }),
                true,
              )
            }
            framePresetId={state.framePresetId}
            framePresets={FRAME_PRESETS}
            onChangeFramePreset={changeFramePreset}
            activeTool={activeTool}
            onChangeTool={setActiveTool}
          />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_272px] gap-2 px-2 pb-2">
          <div className="min-h-0">
            <ElementSidebar
              items={elementLibrary}
              onAddItem={addItemToCanvas}
              onAddText={addTextObject}
              onUploadImage={addUploadedImage}
            />
          </div>

          <div className="min-h-0 flex flex-col gap-2">
            <div className="wire-card min-h-0 flex-1 overflow-hidden bg-[#d9d4c7] p-2">
              <CanvasEditor
                objects={state.objects}
                selectedObjectId={state.selectedObjectId}
                background={state.background}
                zoom={state.zoom}
                onZoomChange={(nextZoom) =>
                  setEditorState(
                    (current) => ({ ...current, zoom: nextZoom }),
                    true,
                  )
                }
                snapToGrid={state.snapToGrid}
                canvasSize={state.canvasSize}
                activeTool={activeTool}
                brushColor={state.brushColor}
                brushSize={state.brushSize}
                stageRef={stageRef}
                onSelectObject={(selectedObjectId) =>
                  setEditorState(
                    (current) => ({ ...current, selectedObjectId }),
                    true,
                  )
                }
                onUpdateObject={updateObject}
                onCreateStroke={addStrokeObject}
                onDropLibraryItem={(x, y, payload) => {
                  try {
                    const item = JSON.parse(payload) as ElementLibraryItem
                    addItemToCanvas(item, x, y)
                  } catch {
                    setToast("Unable to drop this element")
                  }
                }}
              />
            </div>
          </div>

          <div className="min-h-0">
            <PropertiesPanel
              selectedObject={selectedObject}
              background={state.background}
              onChangeBackground={(background) =>
                setEditorState((current) => ({ ...current, background }))
              }
              onUpdateObject={updateObject}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
              onBringForward={bringToFront}
              onSendBackward={sendToBack}
              layerList={state.objects}
              selectedObjectId={state.selectedObjectId}
              onSelectLayer={(selectedObjectId) =>
                setEditorState(
                  (current) => ({ ...current, selectedObjectId }),
                  true,
                )
              }
              framePresetId={state.framePresetId}
              framePresets={FRAME_PRESETS}
              onChangeFramePreset={changeFramePreset}
              brushColor={state.brushColor}
              brushSize={state.brushSize}
              onChangeBrushColor={(brushColor) =>
                setEditorState((current) => ({ ...current, brushColor }), true)
              }
              onChangeBrushSize={(brushSize) =>
                setEditorState((current) => ({ ...current, brushSize }), true)
              }
            />
          </div>
        </div>
      </div>

      {toast && (
        <div className="wire-card fixed bottom-5 right-5 bg-[#ffe56f] px-4 py-3 text-lg text-black">
          {toast}
        </div>
      )}
    </main>
  )
}
