"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type TypewriterProps = {
  lines: string[];
  reducedMotion: boolean;
  delayMs?: number;
  onComplete?: () => void;
  className?: string;
};

export function TypewriterTitle({
  lines,
  reducedMotion,
  delayMs = 260,
  onComplete,
  className,
}: TypewriterProps) {
  const [displayedLines, setDisplayedLines] = useState(() => lines.map(() => ""));
  const [activeLine, setActiveLine] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const safeLines = useMemo(() => lines.filter(Boolean), [lines]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    setDisplayedLines(safeLines.map(() => ""));
    setActiveLine(0);
    setTypingDone(false);

    if (!safeLines.length) {
      return;
    }

    if (reducedMotion) {
      setDisplayedLines(safeLines);
      setTypingDone(true);
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    const timers: number[] = [];
    const register = (fn: () => void, timeout: number) => {
      const id = window.setTimeout(fn, timeout);
      timers.push(id);
    };

    let cursor = delayMs;
    const charStep = 72;
    const linePause = 180;

    safeLines.forEach((line, lineIndex) => {
      setActiveLine(lineIndex);
      for (let charIndex = 1; charIndex <= line.length; charIndex += 1) {
        const nextText = line.slice(0, charIndex);
        register(() => {
          setDisplayedLines((current) =>
            current.map((value, idx) => (idx === lineIndex ? nextText : value)),
          );
          setActiveLine(lineIndex);
        }, cursor);
        cursor += charStep;
      }
      cursor += linePause;
    });

    register(() => {
      setTypingDone(true);
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }, cursor);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [delayMs, reducedMotion, safeLines]);

  return (
    <div className={className}>
      {safeLines.map((line, index) => {
        const shown = displayedLines[index] || "\u00A0";
        const showCursor = !reducedMotion && !typingDone && activeLine === index;

        return (
          <div key={`${line}-${index}`} className="hero-typewriter__row">
            <span className="hero-typewriter__line">
              {shown}
              {showCursor ? (
                <motion.span
                  className="hero-typewriter__cursor"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.85, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
