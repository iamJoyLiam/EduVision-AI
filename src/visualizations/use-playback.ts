import { useCallback, useEffect, useRef, useState } from "react";
import type { PlaybackState } from "./helpers";

interface UsePlaybackOptions {
  totalSteps: number;
  duration: number;
  resetDeps: unknown[];
  loop?: boolean;
}

export interface UsePlaybackReturn extends PlaybackState {
  play: () => void;
  pause: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (multiplier: number) => void;
  setStep: (step: number) => void;
}

export function usePlayback(options: UsePlaybackOptions): UsePlaybackReturn {
  const { totalSteps, duration, resetDeps, loop = false } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);

  const startRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setIsPlaying(false);
    setStep(0);
    setElapsed(0);
    accumulatedRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  useEffect(() => {
    if (!isPlaying) return;

    const startTime = performance.now();
    startRef.current = startTime;

    const tick = (now: number) => {
      const rawElapsed = accumulatedRef.current + ((now - startTime) / 1000) * speed;
      const clampedElapsed = loop
        ? rawElapsed % duration
        : Math.min(rawElapsed, duration);

      setElapsed(clampedElapsed);

      const derivedStep = Math.min(
        Math.floor((clampedElapsed / duration) * totalSteps),
        totalSteps - 1,
      );
      setStep(derivedStep);

      if (!loop && clampedElapsed >= duration) {
        setIsPlaying(false);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, speed, duration, totalSteps, loop]);

  const play = useCallback(() => {
    accumulatedRef.current = elapsed;
    setIsPlaying(true);
  }, [elapsed]);

  const pause = useCallback(() => {
    accumulatedRef.current = elapsed;
    setIsPlaying(false);
  }, [elapsed]);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    setElapsed(0);
    setStep(0);
    setIsPlaying(false);
  }, []);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const setStepDirect = useCallback(
    (s: number) => {
      setIsPlaying(false);
      setStep(Math.max(0, Math.min(s, totalSteps - 1)));
    },
    [totalSteps],
  );

  const progress = duration > 0 ? elapsed / duration : 0;

  return {
    isPlaying,
    step,
    elapsed,
    progress: Math.min(progress, 1),
    speed,
    play,
    pause,
    reset,
    stepForward,
    stepBackward,
    setSpeed,
    setStep: setStepDirect,
  };
}
