// lib/words.ts

export type WordEntry = {
  word: string;
  hint: string; // single hint shown to the impostor
};

export const WORDS: WordEntry[] = [
  { word: "PIZZA", hint: "CHEESE" },
  { word: "UMBRELLA", hint: "RAIN" },
  { word: "PYRAMID", hint: "EGYPT" },
  { word: "HEADPHONES", hint: "MUSIC" },
  { word: "BEACH", hint: "SAND" },
  { word: "HOSPITAL", hint: "DOCTOR" },
  { word: "KANGAROO", hint: "POUCH" },
  { word: "OPERA", hint: "SINGING" },
  { word: "VOLCANO", hint: "LAVA" },
  { word: "LAPTOP", hint: "KEYBOARD" },
  { word: "BICYCLE", hint: "PEDAL" },
  { word: "TELESCOPE", hint: "STARS" },
];


