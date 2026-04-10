"use client";

import Image from "next/image";
import { ImagePlus, Search, Type } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ELEMENT_CATEGORIES } from "@/data/elements";
import type { ElementCategory, ElementLibraryItem } from "@/types/editor";

interface ElementSidebarProps {
  items: ElementLibraryItem[];
  onAddItem: (item: ElementLibraryItem) => void;
  onAddText: () => void;
  onUploadImage: (file: File) => void;
}

export function ElementSidebar({ items, onAddItem, onAddText, onUploadImage }: ElementSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ElementCategory | "All">("All");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, items, search]);

  return (
    <aside className="panel-surface flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b-[2px] border-black px-2.5 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-black/60">Library</p>
            <h2 className="mt-0.5 text-base text-black">Assets</h2>
          </div>
          <div className="wire-card px-1.5 py-0.5 text-xs text-black">{items.length}</div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onAddText}
            className="wire-btn justify-center !px-2 !py-1.5 !text-sm"
          >
            <Type size={14} />
            Text
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="wire-btn justify-center !px-2 !py-1.5 !text-sm"
          >
            <ImagePlus size={14} />
            Image
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onUploadImage(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </div>

        <div className="wire-card mt-2 flex items-center gap-2 px-2.5 py-1.5">
          <Search size={14} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="w-full border-none bg-transparent text-sm outline-none placeholder:text-black/40"
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className={`wire-btn !rounded-full !px-2 !py-0.5 !text-xs ${activeCategory === "All" ? "wire-btn-active" : ""}`}
          >
            All
          </button>
          {ELEMENT_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`wire-btn !rounded-full !px-2 !py-0.5 !text-xs ${activeCategory === category ? "wire-btn-active" : ""}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-2">
        <div className="grid gap-2">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/json", JSON.stringify(item));
                event.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onAddItem(item)}
              className="wire-card group flex items-center gap-2 px-2 py-1.5 text-left transition hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border-[2px] border-black bg-[#f1ede0]">
                <Image src={item.imageUrl} alt={item.name} width={44} height={44} className="h-9 w-9 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm text-black">{item.name}</div>
                <div className="text-xs text-black/65">{item.category}</div>
              </div>
            </button>
          ))}

          {!filteredItems.length && (
            <div className="col-span-2 rounded-[14px] border-[2px] border-dashed border-black px-4 py-6 text-center text-sm text-black/70">
              No element matches the current filter.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
