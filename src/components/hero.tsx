"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowUpRight, Heart, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import type { Member, Preferences, Profile } from "@/lib/types";
import { VerifiedBadge } from "@/components/ui";
import { getMatchInsight } from "@/lib/matching";

export default function Hero({
  profiles,
  member,
  preferences,
  onStart,
  onProfile,
}: {
  profiles: Profile[];
  member: Member;
  preferences: Preferences;
  onStart: () => void;
  onProfile: (profile: Profile) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mainY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 150]);
  const mainScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 0.82]);
  const mainRotate = useTransform(scrollYProgress, [0, 1], [-3, reduced ? -3 : 7]);
  const leftX = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 180]);
  const rightX = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -170]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -70]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.5]);
  const maya = profiles.find((profile) => profile.id === "maya") ?? profiles[0];
  const theo = profiles.find((profile) => profile.id === "theo") ?? profiles[1];
  const sofia = profiles.find((profile) => profile.id === "sofia") ?? profiles[2];

  if (!maya || !theo || !sofia) return null;
  const heroInsight = getMatchInsight(maya, member, preferences);
  const heroScore = heroInsight.score;

  return (
    <section className="hero" ref={ref}>
      <motion.div className="hero-glow" style={{ scale: glowScale }} />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-noise" aria-hidden="true" />

      <div className="hero-inner page-shell">
        <motion.div className="hero-copy" style={{ y: copyY }}>
          <motion.div
            className="eyebrow hero-eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
          >
            <Sparkles size={14} /> Dating, with intention
          </motion.div>
          <h1 className="hero-title">
            {["Less swiping.", "More", "something real."].map((line, index) => (
              <span className="title-mask" key={line}>
                <motion.span
                  className={index === 2 ? "title-accent" : ""}
                  initial={{ y: "110%", rotate: 2 }}
                  animate={{ y: "0%", rotate: 0 }}
                  transition={{ delay: 0.12 + index * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.8 }}
          >
            Meet people through what moves them—not how fast you can judge a photo. Thoughtful matches, honest intentions and conversations with somewhere to go.
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.76, duration: 0.8 }}
          >
            <button className="button button-lime button-large" onClick={onStart}>
              Meet your people <ArrowUpRight size={19} />
            </button>
            <button className="text-link light" onClick={() => onProfile(maya)}>
              See how matching works <ArrowDown size={16} />
            </button>
          </motion.div>
          <motion.div
            className="hero-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <span><ShieldCheck size={16} /> Intentions up front</span>
            <span><Heart size={16} /> No like counts</span>
          </motion.div>
        </motion.div>

        <div className="hero-collage" aria-label="A preview of the Velora community">
          <motion.button
            className="hero-card hero-card-main"
            style={{ y: mainY, scale: mainScale, rotate: mainRotate }}
            initial={{ opacity: 0, y: 80, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: -3 }}
            transition={{ delay: 0.35, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onProfile(maya)}
          >
            <Image src={maya.photo} alt={maya.photoAlt} fill priority sizes="(max-width: 800px) 72vw, 33vw" />
            <span className="hero-card-shade" />
            <span className="hero-card-top"><span className="live-dot" /> {maya.lastActive}</span>
            <span className="hero-card-copy">
              <span className="hero-match-pill">{heroScore}% aligned</span>
              <strong>{maya.name}, {maya.age} <VerifiedBadge /></strong>
              <small>{maya.occupation} · {maya.neighborhood}</small>
              <span className="hero-card-prompt">“{maya.promptAnswer.split(".")[0]}.”</span>
            </span>
          </motion.button>

          <motion.button
            className="hero-card hero-card-side hero-card-left"
            style={{ x: leftX }}
            initial={{ opacity: 0, x: -80, rotate: -16 }}
            animate={{ opacity: 1, x: 0, rotate: -10 }}
            transition={{ delay: 0.62, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onProfile(theo)}
          >
            <Image src={theo.photo} alt={theo.photoAlt} fill sizes="220px" />
            <span className="hero-card-shade" />
            <span className="side-card-name">{theo.name}, {theo.age}</span>
          </motion.button>

          <motion.button
            className="hero-card hero-card-side hero-card-right"
            style={{ x: rightX }}
            initial={{ opacity: 0, x: 80, rotate: 15 }}
            animate={{ opacity: 1, x: 0, rotate: 9 }}
            transition={{ delay: 0.78, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onProfile(sofia)}
          >
            <Image src={sofia.photo} alt={sofia.photoAlt} fill sizes="220px" />
            <span className="hero-card-shade" />
            <span className="side-card-name">{sofia.name}, {sofia.age}</span>
          </motion.button>

          <motion.div
            className="hero-note"
            initial={{ opacity: 0, scale: 0.7, rotate: 8 }}
            animate={{ opacity: 1, scale: 1, rotate: 4 }}
            transition={{ delay: 1.05, type: "spring", stiffness: 180 }}
          >
            <span>shared wavelength</span>
            <strong>{heroInsight.shared.length ? heroInsight.shared.map((interest) => interest.toLowerCase()).join(" · ") : "kind intentions · curious minds"}</strong>
          </motion.div>
        </div>
      </div>

      <motion.button
        className="hero-scroll"
        onClick={onStart}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        aria-label="Scroll to discover"
      >
        <span>Your daily edit is waiting</span>
        <span className="scroll-circle"><ArrowDown size={17} /></span>
      </motion.button>
    </section>
  );
}
