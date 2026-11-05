"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Heart, MessageCircle, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Avatar, VerifiedBadge } from "@/components/ui";
import { getMatchInsight } from "@/lib/matching";
import type { AppState, DiscoveryAction, Profile } from "@/lib/types";

type Tab = "matches" | "likes" | "sent";

export default function Connections({
  state,
  onAction,
  onOpenChat,
  onViewProfile,
}: {
  state: AppState;
  onAction: (profile: Profile, action: DiscoveryAction) => void;
  onOpenChat: (matchId: string) => void;
  onViewProfile: (profile: Profile) => void;
}) {
  const [tab, setTab] = useState<Tab>("matches");
  const interacted = useMemo(() => new Map(state.interactions.map((item) => [item.profileId, item.action])), [state.interactions]);
  const matched = useMemo(() => new Set(state.matches.map((match) => match.profileId)), [state.matches]);
  const likesYou = state.profiles.filter((profile) => profile.likesYou && !matched.has(profile.id) && !interacted.has(profile.id));
  const sent = state.interactions.filter((item) => (item.action === "like" || item.action === "superlike") && !matched.has(item.profileId));
  const counts: Record<Tab, number> = { matches: state.matches.length, likes: likesYou.length, sent: sent.length };

  return (
    <div className="connections-view">
      <div className="view-heading">
        <div><span className="eyebrow dark">Your people</span><h2>Connection, at your pace.</h2><p>No countdowns. No games. Pick up wherever feels right.</p></div>
      </div>
      <div className="connection-tabs" role="tablist" aria-label="Connections">
        {([["matches", "Matches"], ["likes", "Likes you"], ["sent", "Sent likes"]] as const).map(([value, label]) => (
          <button role="tab" aria-selected={tab === value} className={tab === value ? "active" : ""} key={value} onClick={() => setTab(value)}>
            {label}<span>{counts[value]}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {tab === "matches" ? (
            state.matches.length ? (
              <div className="match-list-grid">
                {state.matches.map((match, index) => {
                  const last = match.messages[match.messages.length - 1];
                  return (
                    <motion.article className="match-card" key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                      <button className="match-card-photo" onClick={() => onViewProfile(match.profile)} aria-label={`View ${match.profile.name}'s profile`}>
                        <Image src={match.profile.photo} alt={match.profile.photoAlt} fill sizes="(max-width: 650px) 90vw, 300px" />
                        <span className="match-card-score"><Sparkles size={12} /> {getMatchInsight(match.profile, state.member, state.preferences).score}%</span>
                        {match.unread ? <span className="unread-float">{match.unread} new</span> : null}
                      </button>
                      <div className="match-card-copy">
                        <div><h3>{match.profile.name}, {match.profile.age} {match.profile.verified ? <VerifiedBadge /> : null}</h3><span>{match.profile.neighborhood}</span></div>
                        <p>{last ? `${last.sender === "you" ? "You: " : ""}${last.body}` : "You found each other. Say something real."}</p>
                        <button className="button button-dark" onClick={() => onOpenChat(match.id)}><MessageCircle size={16} /> Open conversation <ArrowUpRight size={15} /></button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            ) : <EmptyConnections icon="match" title="Your next great conversation starts here." copy="Like someone who likes you back and your match will appear here—immediately." />
          )
          : tab === "likes" ? (
            likesYou.length ? (
              <div className="likes-grid">
                {likesYou.map((profile, index) => {
                  const insight = getMatchInsight(profile, state.member, state.preferences);
                  return (
                    <motion.article className="like-card" key={profile.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.06 }}>
                      <button className="like-photo" onClick={() => onViewProfile(profile)}><Image src={profile.photo} alt={profile.photoAlt} fill sizes="260px" /><span className="like-photo-shade" /><span className="like-name">{profile.name}, {profile.age}</span></button>
                      <div className="like-copy"><span><Sparkles size={13} /> {insight.score}% aligned</span><p>{insight.reasons[0]}</p><div><button className="mini-action pass" onClick={() => onAction(profile, "pass")} aria-label={`Pass on ${profile.name}`}><X size={19} /></button><button className="button button-coral" onClick={() => onAction(profile, "like")}><Heart size={16} fill="currentColor" /> Like back</button></div></div>
                    </motion.article>
                  );
                })}
              </div>
            ) : <EmptyConnections icon="heart" title="No new likes waiting." copy="When someone in this preview likes you, they will appear here. Your sent likes are always visible too." />
          ) : (
            sent.length ? (
              <div className="sent-list">
                {sent.map((interaction) => {
                  const profile = state.profiles.find((item) => item.id === interaction.profileId);
                  if (!profile) return null;
                  return <article key={interaction.profileId}><Avatar src={profile.photo} alt={profile.photoAlt} size={58} /><div><h3>{profile.name}, {profile.age}</h3><p>{interaction.action === "superlike" ? "You sent a spark" : "You liked their profile"} · {new Date(interaction.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p></div><span className="sent-status">{interaction.action === "superlike" ? <Sparkles size={14} /> : <Heart size={14} />} Sent</span><button className="text-link dark" onClick={() => onViewProfile(profile)}>View profile <ArrowUpRight size={14} /></button></article>;
                })}
              </div>
            ) : <EmptyConnections icon="send" title="Nothing sent yet—and that is okay." copy="Take your time in Discover. When a profile resonates, your like will be kept here." />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EmptyConnections({ icon, title, copy }: { icon: "match" | "heart" | "send"; title: string; copy: string }) {
  return <div className="empty-connections"><span>{icon === "match" ? <MessageCircle size={28} /> : icon === "heart" ? <Heart size={28} /> : <ArrowUpRight size={28} />}</span><h3>{title}</h3><p>{copy}</p></div>;
}
