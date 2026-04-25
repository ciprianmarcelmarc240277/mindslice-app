"use client";

import { useEffect, useRef, useState } from "react";
import type { InfluenceMode } from "@/lib/mindslice/thought-scene-engine";

type UseThoughtSceneLoopOptions = {
  currentThought: string;
  currentDirection: string;
  currentIndex: number;
  influenceMode: InfluenceMode | null;
  isActive: boolean;
  sliceCycleDuration: number;
  referenceImageCount: number;
  onAdvanceSlice: () => void;
  onAdvanceImage: () => void;
};

export function useThoughtSceneLoop({
  currentThought,
  currentDirection,
  currentIndex,
  influenceMode,
  isActive,
  sliceCycleDuration,
  referenceImageCount,
  onAdvanceSlice,
  onAdvanceImage,
}: UseThoughtSceneLoopOptions) {
  const [animatedThought, setAnimatedThought] = useState(currentThought);
  const [isThoughtOverlayVisible, setIsThoughtOverlayVisible] = useState(true);
  const [thoughtAnimationKey, setThoughtAnimationKey] = useState(0);
  const advanceSliceRef = useRef(onAdvanceSlice);
  const advanceImageRef = useRef(onAdvanceImage);

  useEffect(() => {
    advanceSliceRef.current = onAdvanceSlice;
  }, [onAdvanceSlice]);

  useEffect(() => {
    advanceImageRef.current = onAdvanceImage;
  }, [onAdvanceImage]);

  useEffect(() => {
    setThoughtAnimationKey((previous) => previous + 1);
    setAnimatedThought(currentThought);
    setIsThoughtOverlayVisible(true);
  }, [currentDirection, currentIndex, currentThought]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const interval = window.setInterval(() => {
      advanceSliceRef.current();
    }, sliceCycleDuration);

    return () => window.clearInterval(interval);
  }, [isActive, sliceCycleDuration]);

  useEffect(() => {
    if (!isActive || referenceImageCount <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      advanceImageRef.current();
    }, 4200);

    return () => window.clearInterval(interval);
  }, [isActive, referenceImageCount]);

  return {
    animatedThought,
    isThoughtOverlayVisible,
    thoughtAnimationKey,
  };
}
