"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, EyeOff, Heart, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useRef, useState } from "react";
import { Logo } from "@/components/ui";

const faqs = [
  { question: "How does Velora choose my daily edit?", answer: "Your edit is ranked by shared interests, relationship intentions, age and distance preferences, with a small trust boost for photo verification. The score is always explained, and Nearby or New here sorting lets you take over. It is guidance—not a claim about romantic destiny." },
  { question: "Is this an endless swiping app?", answer: "No. Your current edit has a natural end. When you have seen everyone who fits, Velora invites you to revisit a choice, adjust preferences or focus on existing conversations instead of manufacturing an infinite queue." },
  { question: "What happens when I like someone?", answer: "Your choice is saved to your account. In this private preview community, people who already like you create an immediate mutual match; otherwise the like appears in Sent likes. Nothing disappears after an arbitrary timer." },
  { question: "Can I really take my data with me?", answer: "Yes. Open My profile and choose Export my data. Your browser downloads a readable JSON file containing your current profile, preferences, interactions, matches and messages. The export is generated from the same live state shown in the app." },
  { question: "Who are the people in this preview?", answer: "The preview uses a curated sample community with stock portrait photography so you can explore every product workflow. Your own choices and messages are real, persist in PostgreSQL and remain after a reload; sample profiles do not pretend to send live replies." },
];

export function IntentionScene() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const leftX = useTransform(scrollYProgress, [0.1, 0.52, 0.85], [reduced ? 0 : -220, 0, reduced ? 0 : 80]);
  const rightX = useTransform(scrollYProgress, [0.1, 0.52, 0.85], [reduced ? 0 : 220, 0, reduced ? 0 : -80]);
  const topY = useTransform(scrollYProgress, [0.1, 0.52, 0.85], [reduced ? 0 : -120, 0, reduced ? 0 : 50]);
  const cardScale = useTransform(scrollYProgress, [0.1, 0.52, 0.75], [0.8, 1, reduced ? 1 : 0.86]);
  const centerScale = useTransform(scrollYProgress, [0.35, 0.58, 0.85], [0.4, 1, reduced ? 1 : 1.18]);
  const centerOpacity = useTransform(scrollYProgress, [0.35, 0.52], [0, 1]);
  const wordsOpacity = useTransform(scrollYProgress, [0.52, 0.68], [1, reduced ? 1 : 0]);

  return (
    <section className="intention-scene" ref={ref}>
      <div className="intention-sticky page-shell">
        <div className="scene-heading"><span className="eyebrow">A different chemistry</span><h2>Three things worth<br /><em>matching on.</em></h2></div>
        <div className="convergence-stage">
          <motion.div className="concept-card concept-values" style={{ x: leftX, scale: cardScale, opacity: wordsOpacity }}><Heart size={21} /><span>01 · Intention</span><strong>Want the same<br />kind of tomorrow.</strong><p>Honest about commitment, before the first hello.</p></motion.div>
          <motion.div className="concept-card concept-curiosity" style={{ y: topY, scale: cardScale, opacity: wordsOpacity }}><Sparkles size={21} /><span>02 · Curiosity</span><strong>Notice the details<br />that make them them.</strong><p>Specific prompts, not interchangeable one-liners.</p></motion.div>
          <motion.div className="concept-card concept-chemistry" style={{ x: rightX, scale: cardScale, opacity: wordsOpacity }}><MessageCircle size={21} /><span>03 · Chemistry</span><strong>Leave room for<br />the unexpected.</strong><p>A score can start a conversation. It cannot finish one.</p></motion.div>
          <motion.div className="converged-heart" style={{ scale: centerScale, opacity: centerOpacity }}><span><Heart size={30} fill="currentColor" /></span><strong>A real connection</strong><small>greater than the sum of its data</small></motion.div>
        </div>
      </div>
    </section>
  );
}

export function EditorialSections({ onStart, onSafety }: { onStart: () => void; onSafety: () => void }) {
  const [openFaq, setOpenFaq] = useState(0);
  return (
    <>
      <section className="principles-section">
        <div className="page-shell">
          <motion.div className="principles-intro" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.8 }}><span className="eyebrow dark">Designed for your actual life</span><h2>Less performance.<br /><em>More presence.</em></h2><p>Velora is built around the moments that make dating feel worthwhile: being understood, feeling comfortable and having something to look forward to.</p></motion.div>
          <div className="principles-grid">
            {[{ icon: Users, number: "01", title: "A finite daily edit", copy: "A small, ranked set of people who fit your actual preferences. When you reach the end, you are done—not trapped in a bottomless feed.", detail: "For you · Nearby · New here" }, { icon: EyeOff, number: "02", title: "No popularity theatre", copy: "No public like counts, follower metrics or leaderboards. Compatibility stays private and every explanation is grounded in profile data.", detail: "No streaks · No countdowns" }, { icon: MessageCircle, number: "03", title: "A natural next step", copy: "Turn a shared interest into a message, then send a specific date idea with a place, day and time—all without leaving the conversation.", detail: "Real messages · Real date plans" }].map((item, index) => <motion.article key={item.title} initial={{ opacity: 0, y: 60, rotate: index === 1 ? 0 : index === 0 ? -2 : 2 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}><div className="principle-card-top"><span>{item.number}</span><item.icon size={24} /></div><h3>{item.title}</h3><p>{item.copy}</p><small><Check size={13} /> {item.detail}</small></motion.article>)}
          </div>
        </div>
      </section>

      <section className="safety-section">
        <div className="page-shell safety-layout">
          <motion.div className="safety-visual" initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }}><div className="safety-orbit orbit-one" /><div className="safety-orbit orbit-two" /><span className="safety-center"><ShieldCheck size={44} /></span><span className="safety-float float-one"><Check size={14} /> Photo context</span><span className="safety-float float-two"><EyeOff size={14} /> Privacy controls</span><span className="safety-float float-three"><MessageCircle size={14} /> On-app first dates</span></motion.div>
          <motion.div className="safety-copy" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.35 }}><span className="eyebrow">Care is a feature</span><h2>Butterflies,<br /><em>not blind spots.</em></h2><p>Good dating design should never rush your trust. Keep control of what you share, choose public first meetings and let consistency—not intensity—set the pace.</p><ul><li><Check size={16} /> Clear active-status and message-status controls</li><li><Check size={16} /> Safety guidance inside every conversation</li><li><Check size={16} /> Full data export whenever you want it</li></ul><button className="button button-lime" onClick={onSafety}>Read the safety playbook <ArrowUpRight size={17} /></button></motion.div>
        </div>
      </section>

      <section className="faq-section"><div className="page-shell faq-layout"><div><span className="eyebrow dark">Good questions</span><h2>The honest<br /><em>fine print.</em></h2><p>No mysterious algorithms or imaginary promises. Here is exactly how this preview works.</p></div><div className="faq-list">{faqs.map((faq, index) => <article className={openFaq === index ? "open" : ""} key={faq.question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{String(index + 1).padStart(2, "0")}</span><strong>{faq.question}</strong><ChevronDown size={19} /></button><AnimatePresence initial={false}>{openFaq === index ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{faq.answer}</p></motion.div> : null}</AnimatePresence></article>)}</div></div></section>

      <section className="final-cta"><div className="final-orb orb-a" /><div className="final-orb orb-b" /><motion.div className="page-shell" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }}><span className="eyebrow">Your next chapter, perhaps</span><h2>One good conversation<br />can change <em>everything.</em></h2><p>No pressure. Just people, intention and a place to begin.</p><button className="button button-lime button-large" onClick={onStart}>Meet your daily edit <ArrowUpRight size={19} /></button></motion.div></section>
      <footer className="footer"><div className="page-shell"><Logo /><p>Dating with intention, built with open-source tools.</p><div><button onClick={onSafety}>Safety</button><button onClick={onStart}>Discover</button><span>Private preview · London</span></div><small>Built with Next.js, Motion, Lenis, Lucide and Drizzle. Portraits courtesy of Pexels creators. Velora is a product preview with a curated sample community.</small></div></footer>
    </>
  );
}
