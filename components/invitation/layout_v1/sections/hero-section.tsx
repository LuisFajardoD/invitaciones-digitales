"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Orbitron } from "next/font/google";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { TypewriterTitle } from "@/components/invitation/layout_v1/typewriter";
import {
  DEFAULT_ASTRONAUT_ASSET,
  normalizeBackgroundMedia,
  normalizeKenBurns,
  normalizeHeroAstronaut,
} from "@/lib/invitation-defaults";
import { usePerfMode } from "@/lib/use-perf-mode";
import { optimizeMediaUrl } from "@/lib/utils";
import type {
  HeroSectionData,
  InvitationRecord,
  KenBurnsConfig,
} from "@/types/invitations";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

type HeroSectionProps = {
  data: HeroSectionData;
  invitation: InvitationRecord;
  previewMode?: boolean;
};

export function HeroSection({ data, previewMode = false }: HeroSectionProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const { lowMotion } = usePerfMode();
  const disableAmbientMotion = prefersReducedMotion || lowMotion;
  const allowKenBurns = !prefersReducedMotion && !lowMotion;
  const { scrollYProgress } = useScroll();
  const [typewriterDone, setTypewriterDone] = useState(false);
  const shellY = useTransform(scrollYProgress, [0, 0.35], [0, disableAmbientMotion ? 0 : 36]);
  const cometOneX = useTransform(scrollYProgress, [0, 0.4], [0, disableAmbientMotion ? 0 : 36]);
  const cometTwoX = useTransform(scrollYProgress, [0, 0.4], [0, disableAmbientMotion ? 0 : -24]);
  const titleLines = useMemo(() => buildTitleLines(data.title), [data.title]);
  const background = normalizeBackgroundMedia(data.background, data.background_image_url);
  const astronaut = normalizeHeroAstronaut(data.astronaut);
  const astronautSrc = astronaut.image_url || DEFAULT_ASTRONAUT_ASSET;
  const usesLocalAstronaut = astronautSrc === DEFAULT_ASTRONAUT_ASSET;

  return (
    <motion.section
      className="hero-cinematic"
      style={{ y: shellY }}
      data-preview={previewMode ? "true" : "false"}
      initial={disableAmbientMotion ? { opacity: 1 } : { opacity: 0, scale: 1.01 }}
      animate={disableAmbientMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: disableAmbientMotion ? 0.18 : 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <HeroBackgroundMedia background={background} allowMotion={allowKenBurns} />
      <motion.div
        className="hero-cinematic__drift hero-cinematic__drift--one"
        aria-hidden="true"
        animate={disableAmbientMotion ? undefined : { x: [0, 20, 0], y: [0, -14, 0], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="hero-cinematic__drift hero-cinematic__drift--two"
        aria-hidden="true"
        animate={disableAmbientMotion ? undefined : { x: [0, -16, 0], y: [0, 12, 0], opacity: [0.14, 0.22, 0.14] }}
        transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      <motion.div
        className="hero-cinematic__orb hero-cinematic__orb--moon"
        animate={disableAmbientMotion ? undefined : { y: [-8, 8, -8], rotate: [-1, 1, -1] }}
        transition={{ duration: 12.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <Image src="/assets/luna.svg" alt="" aria-hidden="true" width={336} height={336} priority />
      </motion.div>

      <motion.div
        className="hero-cinematic__orb hero-cinematic__orb--earth"
        animate={disableAmbientMotion ? undefined : { x: [-6, 6, -6], y: [-12, 12, -12] }}
        transition={{ duration: 15.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <Image src="/assets/tierra.svg" alt="" aria-hidden="true" width={162} height={162} priority />
      </motion.div>

      {!disableAmbientMotion ? (
        <>
          <motion.div
            className="hero-cinematic__comet hero-cinematic__comet--one"
            style={{ x: cometOneX }}
            animate={{ x: ["-4vw", "18vw"], y: [0, 10, 18], opacity: [0, 0.85, 0] }}
            transition={{ duration: 6.2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1.6, ease: "easeInOut" }}
          />
          <motion.div
            className="hero-cinematic__comet hero-cinematic__comet--two"
            style={{ x: cometTwoX }}
            animate={{ x: ["-3vw", "14vw"], y: [0, 8, 16], opacity: [0, 0.68, 0] }}
            transition={{ duration: 8.8, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1.2, ease: "easeInOut" }}
          />
        </>
      ) : null}

      {astronaut.enabled ? (
        <motion.div
          className={`hero-cinematic__astronaut-art hero-cinematic__astronaut-art--${astronaut.position}`}
          animate={
            disableAmbientMotion
              ? undefined
              : {
                  x: [0, 12, 0],
                  y: [0, -10, 0],
                }
          }
          transition={
            disableAmbientMotion
              ? undefined
              : { duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
          }
          aria-hidden="true"
        >
          {usesLocalAstronaut ? (
            <Image
              src={DEFAULT_ASTRONAUT_ASSET}
              alt=""
              aria-hidden="true"
              width={630}
              height={820}
              priority
            />
          ) : (
            <img src={optimizeMediaUrl(astronautSrc, 960)} alt="" aria-hidden="true" loading="eager" />
          )}
        </motion.div>
      ) : null}

      <div className="hero-cinematic__content">
        <div className="hero-cinematic__copy">
          <div className="hero-cinematic__telemetry-wrap">
            <motion.p
              className={`${orbitron.className} hero-cinematic__telemetry`}
              initial={disableAmbientMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: disableAmbientMotion ? 0.1 : 0.22, delay: disableAmbientMotion ? 0 : 0.06 }}
            >
              PROTOCOLO DE DESPEGUE
            </motion.p>
            <div className={`${orbitron.className} hero-cinematic__telemetry-detail`}>
              <span>ID: LA-07</span>
            </div>
            <motion.div
              className="hero-cinematic__telemetry-line"
              initial={disableAmbientMotion ? { scaleX: 1, opacity: 0.82 } : { scaleX: 0, opacity: 0.6 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                duration: disableAmbientMotion ? 0.1 : 0.34,
                delay: disableAmbientMotion ? 0 : 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>

          <TypewriterTitle
            lines={titleLines}
            reducedMotion={disableAmbientMotion}
            delayMs={220}
            onComplete={() => setTypewriterDone(true)}
            className={`${orbitron.className} hero-typewriter`}
          />

          <motion.p
            className="hero-cinematic__subtitle"
            initial={disableAmbientMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={disableAmbientMotion || typewriterDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: disableAmbientMotion ? 0.12 : 0.24, delay: disableAmbientMotion ? 0 : 0.08 }}
          >
            {data.subtitle}
          </motion.p>
        </div>
      </div>
    </motion.section>
  );
}

function HeroBackgroundMedia({
  background,
  allowMotion,
}: {
  background: ReturnType<typeof normalizeBackgroundMedia>;
  allowMotion: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const kenburns = normalizeKenBurns(background.kenburns);
  const kenBurnsClassName = getHeroKenBurnsClassName(kenburns, allowMotion);

  if (background.type === "video" && background.video_url) {
    const poster = optimizeMediaUrl(background.poster_url || background.image_url);

    return (
      <div className="hero-cinematic__media" aria-hidden="true">
        <div className={`hero-cinematic__media-frame${kenBurnsClassName}`}>
          <video
            className="hero-cinematic__video"
            autoPlay
            loop
            muted
            playsInline
            poster={poster || undefined}
          >
            <source src={background.video_url} />
          </video>
        </div>
      </div>
    );
  }

  if (background.type === "image" && background.image_url && !imageFailed) {
    return (
      <div className="hero-cinematic__media" aria-hidden="true">
        <div className={`hero-cinematic__media-frame hero-cinematic__media--default${kenBurnsClassName}`}>
          <img
            className="hero-cinematic__media-image"
            src={optimizeMediaUrl(background.image_url)}
            alt=""
            aria-hidden="true"
            loading="eager"
            onError={() => setImageFailed(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hero-cinematic__media" aria-hidden="true">
      <div className="hero-cinematic__media-frame hero-cinematic__media--default" />
    </div>
  );
}

function buildTitleLines(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) {
    return [title.trim()];
  }

  const firstLine = words.slice(0, 2).join(" ");
  const remaining = words.slice(2);

  if (remaining.length <= 2) {
    return [firstLine, remaining.join(" ")];
  }

  if (remaining.length === 3) {
    return [firstLine, remaining.slice(0, 2).join(" "), remaining.slice(2).join(" ")];
  }

  const targetLength = Math.ceil(
    remaining.join(" ").length / 2,
  );

  const secondLineWords: string[] = [];
  let currentLength = 0;

  for (const word of remaining) {
    const nextLength = currentLength + word.length + (secondLineWords.length ? 1 : 0);
    if (secondLineWords.length && nextLength > targetLength) {
      break;
    }
    secondLineWords.push(word);
    currentLength = nextLength;
  }

  const thirdLineWords = remaining.slice(secondLineWords.length);

  if (!thirdLineWords.length) {
    return [firstLine, secondLineWords.join(" ")];
  }

  return [firstLine, secondLineWords.join(" "), thirdLineWords.join(" ")];
}

function getHeroKenBurnsClassName(kenburns: KenBurnsConfig, allowMotion: boolean) {
  if (!allowMotion || !kenburns.enabled) {
    return "";
  }

  return ` hero-cinematic__media-frame--kenburns hero-cinematic__media-frame--kenburns-${kenburns.strength}`;
}
