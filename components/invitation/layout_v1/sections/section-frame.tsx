"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  getChildVariants,
  getRevealVariants,
  getStaggerVariants,
  sectionViewport,
} from "@/components/invitation/layout_v1/motion";

type InvitationSectionFrameProps = {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: "default" | "aurora" | "gold";
  surface?: "default" | "bare";
  children: React.ReactNode;
};

export function InvitationSectionFrame({
  id,
  eyebrow,
  title,
  subtitle,
  tone = "default",
  surface = "default",
  children,
}: InvitationSectionFrameProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const revealVariants = getRevealVariants(reducedMotion);
  const staggerVariants = getStaggerVariants(reducedMotion);
  const childVariants = getChildVariants(reducedMotion);

  return (
    <motion.section
      id={id}
      className={`invitation-section invitation-section--${tone} ${
        surface === "bare" ? "invitation-section--bare" : ""
      }`}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={sectionViewport}
    >
      {surface === "bare" ? null : (
        <>
          <div className="invitation-section__curve invitation-section__curve--top" />
          <div className="invitation-section__curve invitation-section__curve--bottom" />
        </>
      )}
      <motion.div
        className={`invitation-section__inner ${
          surface === "bare" ? "invitation-section__inner--bare" : ""
        }`}
        variants={staggerVariants}
      >
        <motion.p className="mission-eyebrow" variants={childVariants}>
          {eyebrow}
        </motion.p>
        <motion.h2 className="mission-title" variants={childVariants}>
          {title}
        </motion.h2>
        {subtitle ? (
          <motion.p className="mission-subtitle" variants={childVariants}>
            {subtitle}
          </motion.p>
        ) : null}
        <motion.div className="invitation-section__body" variants={childVariants}>
          {children}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
