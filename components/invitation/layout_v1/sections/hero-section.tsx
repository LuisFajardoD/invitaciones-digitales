"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Orbitron } from "next/font/google";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { TypewriterTitle } from "@/components/invitation/layout_v1/typewriter";
import { formatTimeLabel } from "@/lib/utils";
import type { HeroSectionData, InvitationRecord } from "@/types/invitations";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

type HeroSectionProps = {
  data: HeroSectionData;
  invitation: InvitationRecord;
  previewMode?: boolean;
};

export function HeroSection({ data, invitation, previewMode = false }: HeroSectionProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll();
  const [typewriterDone, setTypewriterDone] = useState(false);
  const shellY = useTransform(scrollYProgress, [0, 0.35], [0, prefersReducedMotion ? 0 : 72]);
  const moonY = useTransform(scrollYProgress, [0, 0.32], [0, prefersReducedMotion ? 0 : 34]);
  const planetY = useTransform(scrollYProgress, [0, 0.32], [0, prefersReducedMotion ? 0 : -22]);
  const cometOneX = useTransform(scrollYProgress, [0, 0.4], [0, prefersReducedMotion ? 0 : 64]);
  const cometTwoX = useTransform(scrollYProgress, [0, 0.4], [0, prefersReducedMotion ? 0 : -42]);
  const hasArt = Boolean(data.background_image_url);
  const scheduleLabel = buildScheduleLabel(invitation);
  const titleLines = useMemo(() => buildTitleLines(data.title), [data.title]);

  return (
    <motion.section
      className="hero-cinematic"
      style={{
        y: shellY,
        backgroundImage: hasArt
          ? `linear-gradient(180deg, rgba(2, 9, 20, 0.14), rgba(2, 9, 20, 0.84)), url(${data.background_image_url})`
          : undefined,
      }}
      data-preview={previewMode ? "true" : "false"}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0.24 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hero-cinematic__sky" />
      <motion.div
        className="hero-cinematic__starfield"
        animate={prefersReducedMotion ? undefined : { opacity: [0.46, 0.82, 0.46] }}
        transition={{ duration: 6.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="hero-cinematic__planet hero-cinematic__planet--main"
        style={{ y: moonY }}
        animate={prefersReducedMotion ? undefined : { rotate: [0, 4, 0], scale: [1, 1.045, 1] }}
        transition={{ duration: 10.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <span className="hero-cinematic__moon-sheen" />
        <span className="hero-cinematic__moon-crater hero-cinematic__moon-crater--one" />
        <span className="hero-cinematic__moon-crater hero-cinematic__moon-crater--two" />
        <span className="hero-cinematic__moon-crater hero-cinematic__moon-crater--three" />
        <span className="hero-cinematic__moon-crater hero-cinematic__moon-crater--four" />
      </motion.div>

      <motion.div
        className="hero-cinematic__planet hero-cinematic__planet--small"
        style={{ y: planetY }}
        animate={prefersReducedMotion ? undefined : { y: [0, -12, 0], x: [0, 8, 0] }}
        transition={{ duration: 7.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <span className="hero-cinematic__planet-atmosphere" />
        <span className="hero-cinematic__planet-band hero-cinematic__planet-band--one" />
        <span className="hero-cinematic__planet-band hero-cinematic__planet-band--two" />
      </motion.div>

      <motion.div
        className="hero-cinematic__comet hero-cinematic__comet--one"
        style={{ x: cometOneX }}
        animate={prefersReducedMotion ? undefined : { x: ["-8vw", "28vw"], y: [0, 14, 28], opacity: [0, 0.95, 0] }}
        transition={{ duration: 6.2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1.2, ease: "easeInOut" }}
      />

      <motion.div
        className="hero-cinematic__comet hero-cinematic__comet--two"
        style={{ x: cometTwoX }}
        animate={
          prefersReducedMotion
            ? undefined
            : { x: ["-6vw", "22vw"], y: [0, 10, 22], opacity: [0, 0.78, 0] }
        }
        transition={{ duration: 8.8, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.8, ease: "easeInOut" }}
      />

      <motion.div
        className="hero-cinematic__astronaut-art"
        initial={{ opacity: 0 }}
        animate={
          prefersReducedMotion
            ? { opacity: 0.24 }
            : {
                opacity: [0.18, 0.28, 0.18],
                x: [-22, 22, -22],
                y: [-14, 14, -14],
                rotate: [-2, 2, -2],
              }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0.4, ease: "easeOut" }
            : {
                duration: 22,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
        aria-hidden="true"
      >
        <Image
          src="/assets/astronaut-luis-arturo.webp"
          alt=""
          aria-hidden="true"
          width={630}
          height={820}
          priority
        />
      </motion.div>

      <div className="hero-cinematic__content">
        <motion.p
          className={`${orbitron.className} hero-cinematic__telemetry`}
          initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          animate={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.28, delay: prefersReducedMotion ? 0 : 0.08 }}
        >
          PROTOCOLO DE DESPEGUE
        </motion.p>

        <TypewriterTitle
          lines={titleLines}
          reducedMotion={prefersReducedMotion}
          delayMs={280}
          onComplete={() => setTypewriterDone(true)}
          className={`${orbitron.className} hero-typewriter`}
        />

        <motion.p
          className="hero-cinematic__subtitle"
          initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          animate={
            prefersReducedMotion || typewriterDone
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 18 }
          }
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.3, delay: prefersReducedMotion ? 0 : 0.12 }}
        >
          {data.subtitle}
        </motion.p>

        {scheduleLabel ? (
          <motion.div
            className="hero-cinematic__hud"
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={
              prefersReducedMotion || typewriterDone
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 14 }
            }
            transition={{ duration: prefersReducedMotion ? 0.12 : 0.28, delay: prefersReducedMotion ? 0 : 0.18 }}
          >
            <span>{scheduleLabel}</span>
          </motion.div>
        ) : null}
      </div>

      <div className="hero-cinematic__wave" />
    </motion.section>
  );
}

function buildTitleLines(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) {
    return [title.trim()];
  }

  return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
}

function buildScheduleLabel(invitation: InvitationRecord) {
  const eventInfo = invitation.sections.event_info;
  const eventDate = new Date(invitation.event_start_at);
  const baseDateText = (eventInfo.date_text || "").trim();
  const hasExplicitYear = /\b\d{4}\b/.test(baseDateText);
  const year = Number.isNaN(eventDate.getTime()) || hasExplicitYear ? "" : ` de ${eventDate.getFullYear()}`;
  const dateChunk = [eventInfo.weekday_text, `${baseDateText}${year}`.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
  const timeChunk = eventInfo.time_text || formatTimeLabel(invitation.event_start_at, invitation.timezone);
  return [dateChunk, timeChunk].filter(Boolean).join(" ");
}
