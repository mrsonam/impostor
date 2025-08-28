import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import main from "@/app/assets/images/main.png";
import detective from "@/app/assets/images/detective.png";


export default function OverlayCard() {
  const [visible, setVisible] = useState(true);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgVisible, setImgVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastDeltaY = useRef(0);

  // Prevent scroll when overlay is visible
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    // Cancel any pending animation frame on unmount
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Fade in the image after it loads
  useEffect(() => {
    if (imgLoaded) {
      // Delay to ensure transition triggers
      const timeout = setTimeout(() => setImgVisible(true), 10);
      return () => clearTimeout(timeout);
    } else {
      setImgVisible(false);
    }
  }, [imgLoaded]);

  if (!visible) return null;

  function animateTo(target: number, duration = 350, cb?: () => void) {
    // Smoothly animate translateY to target value
    setAnimating(true);
    const start = performance.now();
    const initial = translateY;
    const delta = target - initial;

    function step(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeInOutCubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const value = initial + delta * ease;
      setTranslateY(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setTranslateY(target);
        setAnimating(false);
        if (cb) cb();
      }
    }
    rafRef.current = requestAnimationFrame(step);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (animating) return;
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
    lastDeltaY.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartY === null || animating) return;
    const deltaY = e.touches[0].clientY - touchStartY;
    if (deltaY < 0) {
      // Add a little resistance for smoother feel
      const resistance = Math.abs(deltaY) > 120 ? 0.5 : 1;
      const newDelta = deltaY * resistance;
      setTranslateY(newDelta);
      lastDeltaY.current = newDelta;
    }
  }

  function handleTouchEnd() {
    if (animating) return;
    setIsDragging(false);
    if (translateY < -80) {
      // Swiped up enough
      animateTo(-window.innerHeight, 400, () => {
        setVisible(false);
        sessionStorage.setItem("overlayDismissed", "1");
      });
    } else {
      // Not enough, reset
      animateTo(0, 350);
    }
    setTouchStartY(null);
  }

  // Also allow click to dismiss for accessibility
  function handleClick() {
    if (animating) return;
    animateTo(-window.innerHeight, 400, () => {
      setVisible(false);
      sessionStorage.setItem("overlayDismissed", "1");
    });
  }

  return (
    <div
      className="fixed inset-0 z-5000 "
      style={{
        pointerEvents: animating ? "none" : "auto",
        opacity: 1,
        transition: "opacity 0.2s",
        touchAction: "none",
        background: imgLoaded ? undefined : "#640d14", // Ensures solid bg before image loads
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
      tabIndex={0}
    >
      {/* Loader overlay while image is loading */}
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#640d14] z-10">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="animate-spin h-8 w-8 text-yellow-300 mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span className="text-[#ffb703] text-xl font-extrabold drop-shadow-lg mb-1 tracking-wide uppercase">
              <Image
                src={detective}
                alt="Enter"
                className="inline w-6 h-6 mr-1 align-text-bottom"
                width={24}
                height={24}
              />{" "}
              Find the Impostor!
            </span>
            <span className="bg-white/10 rounded-lg px-4 py-2 text-white/90 text-base font-semibold text-center shadow-md max-w-xs border border-yellow-200/30">
              Watch for suspicious answers and trust your instincts.{" "}
              <span className="text-white font-bold">
                Can you spot the impostor?
              </span>
            </span>
          </div>
        </div>
      )}
      <Image
        src={main}
        alt="Welcome"
        fill
        className="object-cover absolute inset-0"
        draggable={false}
        priority
        sizes="100vw"
        style={{
          userSelect: "none",
          pointerEvents: "none",
          transform: `translateY(${translateY}px) scale(${
            !animating && !isDragging && translateY === 0 ? 1.04 : 1
          })`,
          opacity: imgVisible ? 1 : 0,
          transition: [
            animating || isDragging
              ? "none"
              : "opacity 0.7s cubic-bezier(.4,1.2,.4,1), transform 0.5s cubic-bezier(.34,1.56,.64,1)",
          ].join(", "),
          willChange: "transform,opacity",
          touchAction: "none",
        }}
        onLoad={() => setImgLoaded(true)}
      />
      {/* Overlay text and chevron */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-end pb-5 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.0) 40%)",
        }}
      >
        <div className="flex flex-col items-center animate-bounce">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-2"
          >
            <polyline points="6 15 12 9 18 15" />
          </svg>
          <span className="text-white text-lg font-semibold drop-shadow-md">
            Swipe up to continue
          </span>
        </div>
      </div>
    </div>
  );
}
