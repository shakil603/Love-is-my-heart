"use client";

import { Heart, MapPin, Music2, Ruler, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { Modal, VerifiedBadge } from "@/components/ui";
import { getMatchInsight } from "@/lib/matching";
import type { DiscoveryAction, Member, Preferences, Profile } from "@/lib/types";

export default function ProfileDetails({
  profile,
  member,
  preferences,
  matched,
  onClose,
  onAction,
  onMessage,
}: {
  profile: Profile | null;
  member: Member;
  preferences: Preferences;
  matched: boolean;
  onClose: () => void;
  onAction: (profile: Profile, action: DiscoveryAction) => void;
  onMessage?: (profile: Profile) => void;
}) {
  const insight = profile ? getMatchInsight(profile, member, preferences) : null;
  return (
    <Modal open={Boolean(profile)} onClose={onClose} label={profile ? `${profile.name}'s profile` : "Profile"} className="profile-modal">
      {profile && insight ? (
        <div className="profile-modal-grid">
          <div className="profile-modal-photo">
            <Image src={profile.photo} alt={profile.photoAlt} fill sizes="(max-width: 800px) 100vw, 44vw" />
            <div className="profile-photo-gradient" />
            <div className="profile-modal-photo-copy">
              <span className={`status-label ${profile.lastActive === "Active now" ? "online" : ""}`}>{profile.lastActive}</span>
              <h2>{profile.name}, {profile.age} {profile.verified ? <VerifiedBadge /> : null}</h2>
              <p>{profile.occupation}</p>
            </div>
          </div>
          <div className="profile-modal-content">
            <div className="profile-match-summary">
              <span className="score-ring"><strong>{insight.score}%</strong><small>aligned</small></span>
              <div><span className="eyebrow dark">Why you two</span><p>{insight.reasons.join(" · ")}</p></div>
            </div>
            <div className="profile-location"><MapPin size={15} /> {profile.neighborhood}, {profile.city} · {profile.distance.toFixed(1)} km away</div>
            <p className="profile-bio">{profile.bio}</p>
            <div className="chip-list">
              {profile.interests.map((interest) => <span className={insight.shared.includes(interest) ? "chip chip-shared" : "chip"} key={interest}>{insight.shared.includes(interest) ? <Sparkles size={12} /> : null}{interest}</span>)}
            </div>
            <div className="prompt-card">
              <span>{profile.promptQuestion}</span>
              <blockquote>“{profile.promptAnswer}”</blockquote>
            </div>
            <div className="profile-detail-section">
              <h3>The perfect slow Sunday</h3>
              <p>{profile.idealSunday}</p>
            </div>
            <div className="profile-facts">
              <span><Ruler size={15} /> {profile.height}</span>
              <span><Music2 size={15} /> {profile.anthem}</span>
              <span>{profile.education}</span>
              <span>{profile.languages.join(" · ")}</span>
              <span>Drinks {profile.drinking.toLowerCase()}</span>
              <span>{profile.workout}</span>
            </div>
            <div className="profile-intention"><Heart size={17} /> Looking for <strong>{profile.lookingFor}</strong></div>
            <div className="profile-modal-actions">
              {matched ? (
                <button className="button button-dark" onClick={() => onMessage?.(profile)}>Open conversation</button>
              ) : (
                <>
                  <button className="button button-outline" onClick={() => { onAction(profile, "pass"); onClose(); }}><X size={18} /> Not for me</button>
                  <button className="button button-coral" onClick={() => { onAction(profile, "like"); onClose(); }}><Heart size={18} fill="currentColor" /> Like {profile.name}</button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
