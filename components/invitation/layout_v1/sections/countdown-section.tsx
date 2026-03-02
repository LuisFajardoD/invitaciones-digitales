"use client";

import { useEffect, useMemo, useState } from "react";
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
    <section className="section-shell">
      <p className="eyebrow">Countdown</p>
      <h2>{data.label}</h2>
      <div className="countdown-grid">
        {cells.map(([label, value]) => (
          <div key={label} className="countdown-cell">
            <strong>{value}</strong>
            <span className="muted">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
