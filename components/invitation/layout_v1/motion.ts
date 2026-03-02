import type { Variants } from "framer-motion";

export const sectionViewport = {
  once: true,
  amount: 0.22,
} as const;

export function getRevealVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.24,
          ease: "easeOut",
        },
      },
    };
  }

  return {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
}

export function getStaggerVariants(reducedMotion: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reducedMotion ? 0.03 : 0.06,
        delayChildren: reducedMotion ? 0.02 : 0.04,
      },
    },
  };
}

export function getChildVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.18,
          ease: "easeOut",
        },
      },
    };
  }

  return {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
}

export function getButtonHoverMotion(reducedMotion: boolean, ghost = false) {
  if (reducedMotion) {
    return undefined;
  }

  if (ghost) {
    return {
      y: -2,
      boxShadow: "0 14px 30px rgba(118, 247, 255, 0.14)",
    };
  }

  return {
    y: -2,
    boxShadow: "0 18px 36px rgba(248, 201, 75, 0.24)",
  };
}

export function getButtonTapMotion(reducedMotion: boolean) {
  if (reducedMotion) {
    return undefined;
  }

  return {
    scale: 0.98,
  };
}
