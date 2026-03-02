"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { InvitationSectionFrame } from "@/components/invitation/layout_v1/sections/section-frame";
import type { CountdownSectionData } from "@/types/invitations";

type CountdownSectionProps = {
  data: CountdownSectionData;
};

function getRemaining(targetAt: string) {
  const diff = new Date(targetAt).getTime() - Date.now();
  const safe = Math.max(0, diff);
  const days = Math.floor(safe / (1000 * 60 * 60 * 24));
  const hours = Math.floor((safe / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((safe / (1000 * 60)) % 60);
  const seconds = Math.floor((safe / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function CountdownSection({ data }: CountdownSectionProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(data.target_at));
  const reducedMotion = Boolean(useReducedMotion());
  const cells = useMemo(
    () => [
      ["Dias", remaining.days],
      ["Horas", remaining.hours],
      ["Min", remaining.minutes],
      ["Seg", remaining.seconds],
    ],
    [remaining],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemaining(data.target_at));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [data.target_at]);

  return (
    <InvitationSectionFrame
      eyebrow="Cuenta regresiva"
      title={data.label}
      subtitle="Cada segundo nos acerca al despegue."
      tone="default"
    >
      <div className="countdown-grid countdown-grid--mission">
        {cells.map(([label, value]) => (
          <motion.div
            key={label}
            className="countdown-cell countdown-cell--mission"
            animate={reducedMotion ? undefined : { y: [0, -3, 0] }}
            transition={{
              duration: 2.8,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 0.4,
              delay: Number(value) * 0.02,
            }}
          >
            <strong>{value}</strong>
            <span className="mission-caption">{label}</span>
          </motion.div>
        ))}
      </div>
    </InvitationSectionFrame>
  );
}
