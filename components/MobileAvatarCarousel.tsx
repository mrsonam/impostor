"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export type HomeAvatarOption = {
  src: string;
  alt: string;
  icon: string;
  full: string;
  characterName: string;
};

type Props = {
  avatars: HomeAvatarOption[];
  selectedSrc: string;
  onSelect: (a: HomeAvatarOption) => void;
};

export function MobileAvatarCarousel({ avatars, selectedSrc, onSelect }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // scrollIntoView() walks ancestor scrollers and vertically scrolls the mobile
  // snap column — use horizontal scrollLeft on this row only.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const el = itemRefs.current.get(selectedSrc);
    if (!scroller || !el) return;

    const targetLeft =
      el.offsetLeft - scroller.clientWidth / 2 + el.offsetWidth / 2;
    const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    scroller.scrollTo({
      left: Math.min(Math.max(0, targetLeft), maxLeft),
      behavior: "smooth",
    });
  }, [selectedSrc]);

  return (
    <div
      ref={scrollerRef}
      className="flex items-center gap-4 overflow-x-auto overflow-y-hidden px-4 py-4 no-scrollbar snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
    >
      {avatars.map((a) => (
        <motion.button
          key={a.src}
          type="button"
          ref={(node) => {
            if (node) itemRefs.current.set(a.src, node);
            else itemRefs.current.delete(a.src);
          }}
          whileTap={{ scale: 0.9 }}
          className={`relative flex-shrink-0 w-24 aspect-square rounded-[2rem] overflow-hidden border-2 snap-center transition-all ${
            selectedSrc === a.src
              ? "border-orange-500 scale-110 shadow-lg"
              : "border-white/10"
          }`}
          onClick={() => onSelect(a)}
        >
          <Image src={a.icon} alt={a.alt} fill className="object-cover" />
        </motion.button>
      ))}
    </div>
  );
}
