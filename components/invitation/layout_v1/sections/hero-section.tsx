"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { HeroSectionData } from "@/types/invitations";

type HeroSectionProps = {
  data: HeroSectionData;
};

export function HeroSection({ data }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.4], [0, prefersReducedMotion ? 0 : 40]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  return (
    <motion.section className="section-shell hero-scene" style={{ y, opacity, backgroundImage: `url(${data.background_image_url})` }}>
      <div className="hero-overlay" />
      <motion.div
        className="starfield"
        animate={prefersReducedMotion ? undefined : { opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="planet"
        animate={prefersReducedMotion ? undefined : { y: [0, 8, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="planet-sm"
        animate={prefersReducedMotion ? undefined : { y: [0, -8, 0], x: [0, 4, 0] }}
        transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div className="hero-content">
        <div className="hero-badge">{data.badge}</div>
        <p className="eyebrow">{data.accent}</p>
        <h1>{data.title}</h1>
        <p className="lede">{data.subtitle}</p>
      </div>
    </motion.section>
  );
}
