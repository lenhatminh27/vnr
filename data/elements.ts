import type { ElementLibraryItem } from "@/types/editor";

export const ELEMENT_CATEGORIES = [
  "Nature",
  "People",
  "Animals",
  "Buildings",
  "Decorations",
] as const;

export const elementLibrary: ElementLibraryItem[] = [
  { id: "tree-oak", name: "Oak Tree", category: "Nature", imageUrl: "/elements/tree.svg", defaultWidth: 180, defaultHeight: 220 },
  { id: "cloud-soft", name: "Soft Cloud", category: "Nature", imageUrl: "/elements/cloud.svg", defaultWidth: 180, defaultHeight: 110 },
  { id: "flower-bloom", name: "Bloom Flower", category: "Nature", imageUrl: "/elements/flower.svg", defaultWidth: 120, defaultHeight: 120 },
  { id: "sun-happy", name: "Sunny Glow", category: "Nature", imageUrl: "/elements/sun.svg", defaultWidth: 140, defaultHeight: 140 },
  { id: "boy-smile", name: "Happy Boy", category: "People", imageUrl: "/elements/boy.svg", defaultWidth: 150, defaultHeight: 250 },
  { id: "girl-wave", name: "Girl Wave", category: "People", imageUrl: "/elements/girl.svg", defaultWidth: 150, defaultHeight: 250 },
  { id: "family-group", name: "Family", category: "People", imageUrl: "/elements/family.svg", defaultWidth: 250, defaultHeight: 220 },
  { id: "cat-cute", name: "Cute Cat", category: "Animals", imageUrl: "/elements/cat.svg", defaultWidth: 140, defaultHeight: 120 },
  { id: "dog-playful", name: "Playful Dog", category: "Animals", imageUrl: "/elements/dog.svg", defaultWidth: 170, defaultHeight: 140 },
  { id: "bird-blue", name: "Blue Bird", category: "Animals", imageUrl: "/elements/bird.svg", defaultWidth: 120, defaultHeight: 90 },
  { id: "house-home", name: "Warm House", category: "Buildings", imageUrl: "/elements/house.svg", defaultWidth: 260, defaultHeight: 220 },
  { id: "school", name: "School", category: "Buildings", imageUrl: "/elements/school.svg", defaultWidth: 260, defaultHeight: 210 },
  { id: "heart", name: "Heart", category: "Decorations", imageUrl: "/elements/heart.svg", defaultWidth: 90, defaultHeight: 90 },
  { id: "star", name: "Star", category: "Decorations", imageUrl: "/elements/star.svg", defaultWidth: 100, defaultHeight: 100 },
  { id: "frame", name: "Doodle Frame", category: "Decorations", imageUrl: "/elements/frame.svg", defaultWidth: 300, defaultHeight: 220 },
];
