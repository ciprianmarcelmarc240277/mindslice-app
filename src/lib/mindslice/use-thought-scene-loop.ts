"use client";

import { useEffect, useEffectEvent, useState } from "react";
import {
  getTypewriterDelay,
  THOUGHT_OVERLAY_HOLD_MS,
  type InfluenceMode,
} from "@/lib/mindslice/thought-scene-engine";

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

  const advanceSlice = useEffectEvent(onAdvanceSlice);
  const advanceImage = useEffectEvent(onAdvanceImage);

  useEffect(() => {
    let cancelled = false;
    const timeoutIds: number[] = [];

    const writeCharacter = (index: number) => {
      if (cancelled) {
        return;
      }

      setAnimatedThought(currentThought.slice(0, index + 1));

      if (index >= currentThought.length - 1) {
        const holdTimeoutId = window.setTimeout(
          () => eraseCharacter(currentThought.length - 1),
          THOUGHT_OVERLAY_HOLD_MS,
        );
        timeoutIds.push(holdTimeoutId);
        return;
      }

      const nextTimeoutId = window.setTimeout(
        () => writeCharacter(index + 1),
        getTypewriterDelay(currentThought[index], influenceMode),
      );
      timeoutIds.push(nextTimeoutId);
    };

    const eraseCharacter = (index: number) => {
      if (cancelled) {
        return;
      }

      setAnimatedThought(currentThought.slice(0, index));

      if (index <= 0) {
        setIsThoughtOverlayVisible(false);
        return;
      }

      const nextTimeoutId = window.setTimeout(
        () => eraseCharacter(index - 1),
        getTypewriterDelay(currentThought[index - 1], influenceMode),
      );
      timeoutIds.push(nextTimeoutId);
    };

    const initialTimeoutId = window.setTimeout(() => {
      setThoughtAnimationKey((previous) => previous + 1);
      setAnimatedThought("");
      setIsThoughtOverlayVisible(true);
      writeCharacter(0);
    }, 0);
    timeoutIds.push(initialTimeoutId);

    return () => {
      cancelled = true;
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [currentDirection, currentIndex, currentThought, influenceMode]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timeout = window.setTimeout(() => {
      advanceSlice();
    }, sliceCycleDuration);

    return () => window.clearTimeout(timeout);
  }, [isActive, sliceCycleDuration]);

  useEffect(() => {
    if (!isActive || referenceImageCount <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      advanceImage();
    }, 4200);

    return () => window.clearInterval(interval);
  }, [isActive, referenceImageCount]);

  return {
    animatedThought,
    isThoughtOverlayVisible,
    thoughtAnimationKey,
  };
}
