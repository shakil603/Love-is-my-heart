"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronDown,
  Heart,
  Info,
  LoaderCircle,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import ProfileDetails from "@/components/profile-details";
import { Modal, Toggle, VerifiedBadge } from "@/components/ui";
import { INTERESTS, INTENTIONS } from "@/lib/catalog";
import { distanceLabel } from "@/lib/cities";
import { getMatchInsight, passesPreferences } from "@/lib/matching";
import type { AppState, DiscoveryAction, Preferences, Profile } from "@/lib/types";

type SortMode = "for-you" | "nearby" | "new";

export default function Discovery({
  state,
  busy,
  onAction,
  onUndo,
  onSavePreferences,
  externalProfile,
  onCloseExternal,
  onMessage,
  onBlock,
  onReport,
}: {
  state: AppState;
  busy: boolean;
  onAction: (profile: Profile, action: DiscoveryAction) => void;
  onUndo: () => void;
  onSavePreferences: (preferences: Preferences) => Promise<void>;
  externalProfile: Profile | null;
  onCloseExternal: () => void;
  onMessage: (profile: Profile) => void;
  onBlock?: (profile: Profile) => void | Promise<void>;
  onReport?: (profile: Profile, reason: string, details: string) => void | Promise<void>;
}) {
  const [sort, setSort] = useState<SortMode>("for-you");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState(state.preferences);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [exitDirection, setExitDirection] = useState(1);

  function openFilters() {
    setDraft(state.preferences);
    setFilterOpen(true);
  }

  const interacted = useMemo(() => new Set(state.interactions.map((item) => item.profileId)), [state.interactions]);
  const matched = useMemo(() => new Set(state.matches.map((item) => item.profileId)), [state.matches]);
  const eligible = useMemo(
    () => state.profiles.filter((profile) => passesPreferences(profile, state.preferences)),
    [state.profiles, state.preferences],
  );
  const candidates = useMemo(() => {
    const list = eligible.filter((profile) => !interacted.has(profile.id) && !matched.has(profile.id));
    return list.sort((a, b) => {
      if (sort === "nearby") return a.distance - b.distance;
      if (sort === "new") return Number(b.newHere) - Number(a.newHere) || a.distance - b.distance;
      return getMatchInsight(b, state.member, state.preferences).score - getMatchInsight(a, state.member, state.preferences).score;
    });
  }, [eligible, interacted, matched, sort, state.member, state.preferences]);
  const current = candidates[0];
  const insight = current ? getMatchInsight(current, state.member, state.preferences) : null;

  function act(profile: Profile, action: DiscoveryAction) {
    setExitDirection(action === "pass" ? -1 : 1);
    onAction(profile, action);
  }

  async function applyFilters() {
    setSaving(true);
    try {
      await onSavePreferences(draft);
      setFilterOpen(false);
    } catch {
      // The parent shows the error and keeps this dialog open for another try.
    } finally {
      setSaving(false);
    }
  }

  function toggleInterest(interest: string) {
    setDraft((previous) => ({
      ...previous,
      interests: previous.interests.includes(interest)
        ? previous.interests.filter((item) => item !== interest)
        : [...previous.interests, interest].slice(-6),
    }));
  }

  return (
    <div className="discovery-view">
      <div className="view-heading discovery-heading">
        <div>
          <span className="eyebrow dark">Your daily edit</span>
          <h2>People worth slowing down for.</h2>
          <p>{eligible.length} people fit your preferences · {candidates.length} still to meet</p>
        </div>
        <button className="button button-outline filter-button" onClick={openFilters}>
          <SlidersHorizontal size={17} /> Preferences
          {(state.preferences.verifiedOnly || state.preferences.interests.length > 0) ? <span className="filter-dot" /> : null}
        </button>
      </div>

      <div className="discovery-toolbar">
        <div className="segmented-control" aria-label="Sort profiles">
          {([["for-you", "For you"], ["nearby", "Nearby"], ["new", "New here"]] as const).map(([value, label]) => (
            <button key={value} className={sort === value ? "active" : ""} onClick={() => setSort(value)}>
              {sort === value ? <motion.span layoutId="sort-pill" className="segment-active" /> : null}
              <span>{label}</span>
            </button>
          ))}
        </div>
        <span className="keyboard-hint">Drag the card, or take your time below</span>
      </div>

      {current && insight ? (
        <div className="discovery-layout">
          <div className="deck-column">
            <div className="card-deck">
              <AnimatePresence initial={false} custom={exitDirection} mode="popLayout">
                {candidates.slice(0, 3).reverse().map((profile, reverseIndex) => {
                  const depth = candidates.slice(0, 3).length - 1 - reverseIndex;
                  const isTop = depth === 0;
                  const profileInsight = getMatchInsight(profile, state.member, state.preferences);
                  return (
                    <motion.article
                      key={profile.id}
                      className={`discovery-card ${isTop ? "is-top" : "is-behind"}`}
                      style={{ zIndex: 5 - depth }}
                      initial={false}
                      animate={{ scale: 1 - depth * 0.045, y: depth * 17, rotate: depth % 2 ? 2.5 : 0 }}
                      custom={exitDirection}
                      variants={{ exit: (direction: number) => ({ x: direction * 560, rotate: direction * 20, opacity: 0 }) }}
                      exit="exit"
                      transition={{ type: "spring", stiffness: 280, damping: 28 }}
                      drag={isTop ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.8}
                      whileDrag={{ scale: 1.02, cursor: "grabbing" }}
                      onDragEnd={(_, info) => {
                        if (!isTop) return;
                        if (info.offset.x > 110 || info.velocity.x > 650) act(profile, "like");
                        else if (info.offset.x < -110 || info.velocity.x < -650) act(profile, "pass");
                      }}
                    >
                      <Image src={profile.photo} alt={profile.photoAlt} fill priority={isTop} sizes="(max-width: 700px) 90vw, 430px" draggable={false} />
                      <div className="discovery-card-shade" />
                      <div className="card-topline">
                        <span className="compatibility-pill"><Sparkles size={13} /> {profileInsight.score}% aligned</span>
                        {profile.isDemo ? <span className="new-pill demo-pill">Sample profile</span> : profile.newHere ? <span className="new-pill">New here</span> : null}
                      </div>
                      <motion.div className="swipe-stamp like-stamp" style={{ opacity: 0 }} whileDrag={{ opacity: 0 }}>LIKE</motion.div>
                      <div className="discovery-card-copy">
                        <span className={`status-label ${profile.lastActive === "Active now" ? "online" : ""}`}>{profile.lastActive}</span>
                        <h3>{profile.name}, {profile.age} {profile.verified ? <VerifiedBadge /> : null}</h3>
                        <p>{profile.occupation}</p>
                        <span className="card-location"><MapPin size={14} /> {profile.area || profile.city} · {distanceLabel(profile.distance)}</span>
                        <div className="card-interest-row">
                          {profile.interests.slice(0, 3).map((interest) => <span key={interest}>{interest}</span>)}
                        </div>
                      </div>
                      {isTop ? <button className="card-info-button" onClick={() => setSelected(profile)} aria-label={`View ${profile.name}'s full profile`}><Info size={19} /></button> : null}
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="deck-actions">
              <button className="deck-action secondary" onClick={onUndo} disabled={busy || state.interactions.length === 0} aria-label="Undo last choice" title="Undo last choice"><Undo2 size={20} /></button>
              <button className="deck-action pass" onClick={() => act(current, "pass")} disabled={busy} aria-label={`Pass on ${current.name}`}><X size={27} /></button>
              <button className="deck-action super" onClick={() => act(current, "superlike")} disabled={busy} aria-label={`Send ${current.name} a spark`}><Sparkles size={22} /></button>
              <button className="deck-action like" onClick={() => act(current, "like")} disabled={busy} aria-label={`Like ${current.name}`}><Heart size={28} fill="currentColor" /></button>
              <button className="deck-action secondary" onClick={() => setSelected(current)} aria-label="Read full profile"><Info size={20} /></button>
            </div>
            <p className="deck-caption"><RotateCcw size={13} /> Changed your mind? Undo restores your last choice.</p>
          </div>

          <motion.aside className="match-context" key={current.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="context-score">
              <span className="eyebrow dark">A considered match</span>
              <div><strong>{insight.score}<sup>%</sup></strong><span>your<br />wavelength</span></div>
            </div>
            <div className="context-reasons">
              {insight.reasons.map((reason, index) => (
                <motion.div key={reason} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                  <span><Check size={14} /></span><p>{reason}</p>
                </motion.div>
              ))}
            </div>
            <div className="context-prompt">
              <span>{current.promptQuestion}</span>
              <blockquote>“{current.promptAnswer}”</blockquote>
            </div>
            <div className="context-intention"><Heart size={17} /><div><small>Here for</small><strong>{current.lookingFor}</strong></div></div>
            <button className="text-link dark" onClick={() => setSelected(current)}>Read {current.name}&apos;s story <ChevronDown size={16} /></button>
            <p className="context-note">Compatibility is a conversation starter, not a verdict. You always make the final call.</p>
          </motion.aside>
        </div>
      ) : (
        <motion.div className="empty-discovery" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <span className="empty-orbit"><Heart size={30} /></span>
          <span className="eyebrow dark">You are all caught up</span>
          <h3>{eligible.length === 0 ? "Your preferences are a little too specific." : "That is everyone in this edit."}</h3>
          <p>{eligible.length === 0 ? "Widen your distance, age range or interests to meet more people." : "Quality over an endless queue. Undo a choice, or explore the people who already like you."}</p>
          <div>
            <button className="button button-dark" onClick={openFilters}><SlidersHorizontal size={17} /> Adjust preferences</button>
            {state.interactions.length ? <button className="button button-outline" onClick={onUndo}><Undo2 size={17} /> Undo last choice</button> : null}
          </div>
        </motion.div>
      )}

      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} label="Discovery preferences" className="filter-modal">
        <div className="filter-header"><span className="eyebrow dark">Make it yours</span><h2>Who would you like to meet?</h2><p>These choices shape your edit and are saved for next time.</p></div>
        <div className="filter-section">
          <div className="filter-label"><label>Age range</label><strong>{draft.minAge}–{draft.maxAge}</strong></div>
          <div className="dual-range">
            <input aria-label="Minimum age" type="range" min="18" max="70" value={draft.minAge} onChange={(event) => setDraft({ ...draft, minAge: Math.min(Number(event.target.value), draft.maxAge) })} />
            <input aria-label="Maximum age" type="range" min="20" max="80" value={draft.maxAge} onChange={(event) => setDraft({ ...draft, maxAge: Math.max(Number(event.target.value), draft.minAge) })} />
          </div>
        </div>
        <div className="filter-section">
          <div className="filter-label"><label htmlFor="distance">Maximum distance</label><strong>{draft.maxDistance} km</strong></div>
          <input id="distance" className="single-range" type="range" min="1" max="500" value={draft.maxDistance} onChange={(event) => setDraft({ ...draft, maxDistance: Number(event.target.value) })} />
          <div className="range-labels"><span>1 km</span><span>500 km</span></div>
        </div>
        <div className="filter-section">
          <label htmlFor="intention">Relationship intention</label>
          <div className="select-wrap"><select id="intention" value={draft.lookingFor} onChange={(event) => setDraft({ ...draft, lookingFor: event.target.value })}>{INTENTIONS.map((intention) => <option key={intention}>{intention}</option>)}</select><ChevronDown size={17} /></div>
        </div>
        <div className="filter-section">
          <div className="filter-label"><label>Shared interests</label><small>Choose up to 6</small></div>
          <div className="filter-interests">{INTERESTS.map((interest) => <button key={interest} className={draft.interests.includes(interest) ? "selected" : ""} onClick={() => toggleInterest(interest)}>{draft.interests.includes(interest) ? <Check size={13} /> : null}{interest}</button>)}</div>
        </div>
        <div className="filter-switch"><div><strong>Verified members only</strong><small>Only show people who confirmed their email</small></div><Toggle checked={draft.verifiedOnly} onChange={(verifiedOnly) => setDraft({ ...draft, verifiedOnly })} label="Verified profiles only" /></div>
        <button className="button button-dark filter-apply" disabled={saving} onClick={applyFilters}>{saving ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />} Show my matches</button>
      </Modal>

      <ProfileDetails
        profile={selected ?? externalProfile}
        member={state.member}
        preferences={state.preferences}
        matched={Boolean((selected ?? externalProfile) && matched.has((selected ?? externalProfile)!.id))}
        onClose={() => { setSelected(null); onCloseExternal(); }}
        onAction={onAction}
        onMessage={onMessage}
        onBlock={onBlock}
        onReport={onReport}
      />
    </div>
  );
}
