"use client";

import { Flag, Heart, LoaderCircle, MapPin, Music2, Ruler, ShieldBan, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Modal, VerifiedBadge } from "@/components/ui";
import { distanceLabel } from "@/lib/cities";
import { getMatchInsight } from "@/lib/matching";
import type { DiscoveryAction, Member, Preferences, Profile, SafetyReportReason } from "@/lib/types";

const REPORT_REASONS: SafetyReportReason[] = [
  "Fake profile or catfishing",
  "Inappropriate messages",
  "Harassment or hate speech",
  "Spam or financial scam",
  "Under 18",
  "Something else",
];

export default function ProfileDetails({
  profile,
  member,
  preferences,
  matched,
  onClose,
  onAction,
  onMessage,
  onBlock,
  onReport,
}: {
  profile: Profile | null;
  member: Member;
  preferences: Preferences;
  matched: boolean;
  onClose: () => void;
  onAction: (profile: Profile, action: DiscoveryAction) => void;
  onMessage?: (profile: Profile) => void;
  onBlock?: (profile: Profile) => void | Promise<void>;
  onReport?: (profile: Profile, reason: string, details: string) => void | Promise<void>;
}) {
  const insight = profile ? getMatchInsight(profile, member, preferences) : null;
  const [activePhoto, setActivePhoto] = useState(profile?.photo ?? "");
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [lastProfileId, setLastProfileId] = useState(profile?.id);

  // Reset the photo/report state when a different profile is opened. Adjusting
  // state during render is the recommended alternative to a reset effect.
  if (profile?.id !== lastProfileId) {
    setLastProfileId(profile?.id);
    setActivePhoto(profile?.photo ?? "");
    setReportOpen(false);
    setDetails("");
  }

  const photos = profile ? (profile.photos.length ? profile.photos : [profile.photo]) : [];

  return (
    <Modal
      open={Boolean(profile)}
      onClose={onClose}
      label={profile ? `${profile.name}'s profile` : "Profile"}
      className="profile-modal"
    >
      {profile && insight ? (
        <div className="profile-modal-grid">
          <div className="profile-modal-photo">
            <Image
              src={activePhoto || profile.photo}
              alt={profile.photoAlt}
              fill
              sizes="(max-width: 800px) 100vw, 44vw"
            />
            <div className="profile-photo-gradient" />
            {photos.length > 1 ? (
              <div className="profile-photo-strip">
                {photos.map((photo) => (
                  <button
                    key={photo}
                    className={photo === activePhoto ? "active" : ""}
                    onClick={() => setActivePhoto(photo)}
                    aria-label="View photo"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
            <div className="profile-modal-photo-copy">
              <span className={`status-label ${profile.lastActive === "Active now" ? "online" : ""}`}>
                {profile.lastActive}
              </span>
              <h2>
                {profile.name}, {profile.age} {profile.verified ? <VerifiedBadge /> : null}
              </h2>
              <p>{profile.occupation}</p>
            </div>
          </div>
          <div className="profile-modal-content">
            {profile.isDemo ? (
              <div className="demo-note">
                <Sparkles size={14} />
                <span>
                  <strong>Sample profile.</strong> Part of the Love Is My Heart preview community — replies
                  here are generated from this profile, not written by a real person.
                </span>
              </div>
            ) : null}
            <div className="profile-match-summary">
              <span className="score-ring">
                <strong>{insight.score}%</strong>
                <small>aligned</small>
              </span>
              <div>
                <span className="eyebrow dark">Why you two</span>
                <p>{insight.reasons.join(" · ")}</p>
              </div>
            </div>
            <div className="profile-location">
              <MapPin size={15} /> {profile.area}, {profile.city} · {distanceLabel(profile.distance)}
            </div>
            <p className="profile-bio">{profile.bio}</p>
            <div className="chip-list">
              {profile.interests.map((interest) => (
                <span
                  className={insight.shared.includes(interest) ? "chip chip-shared" : "chip"}
                  key={interest}
                >
                  {insight.shared.includes(interest) ? <Sparkles size={12} /> : null}
                  {interest}
                </span>
              ))}
            </div>
            <div className="prompt-card">
              <span>{profile.promptQuestion}</span>
              <blockquote>“{profile.promptAnswer}”</blockquote>
            </div>
            {profile.idealSunday ? (
              <div className="profile-detail-section">
                <h3>The perfect slow Sunday</h3>
                <p>{profile.idealSunday}</p>
              </div>
            ) : null}
            <div className="profile-facts">
              {profile.height ? (
                <span>
                  <Ruler size={15} /> {profile.height}
                </span>
              ) : null}
              {profile.anthem ? (
                <span>
                  <Music2 size={15} /> {profile.anthem}
                </span>
              ) : null}
              {profile.education ? <span>{profile.education}</span> : null}
              {profile.languages.length ? <span>{profile.languages.join(" · ")}</span> : null}
              <span>Drinks {profile.drinking.toLowerCase()}</span>
              {profile.workout ? <span>{profile.workout}</span> : null}
            </div>
            <div className="profile-intention">
              <Heart size={17} /> Looking for <strong>{profile.lookingFor}</strong>
            </div>
            <div className="profile-modal-actions">
              {matched ? (
                <button className="button button-dark" onClick={() => onMessage?.(profile)}>
                  Open conversation
                </button>
              ) : (
                <>
                  <button
                    className="button button-outline"
                    onClick={() => {
                      onAction(profile, "pass");
                      onClose();
                    }}
                  >
                    <X size={18} /> Not for me
                  </button>
                  <button
                    className="button button-coral"
                    onClick={() => {
                      onAction(profile, "like");
                      onClose();
                    }}
                  >
                    <Heart size={18} fill="currentColor" /> Like {profile.name}
                  </button>
                </>
              )}
            </div>

            {onBlock || onReport ? (
              <div className="profile-safety-row">
                {!reportOpen ? (
                  <>
                    {onBlock ? (
                      <button
                        className="text-link dark"
                        onClick={async () => {
                          setSafetyBusy(true);
                          try {
                            await onBlock(profile);
                            onClose();
                          } finally {
                            setSafetyBusy(false);
                          }
                        }}
                        disabled={safetyBusy}
                      >
                        <ShieldBan size={14} /> Block {profile.name}
                      </button>
                    ) : null}
                    {onReport ? (
                      <button className="text-link dark" onClick={() => setReportOpen(true)}>
                        <Flag size={14} /> Report
                      </button>
                    ) : null}
                  </>
                ) : (
                  <form
                    className="report-form"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (!onReport) return;
                      setSafetyBusy(true);
                      try {
                        await onReport(profile, reason, details);
                        onClose();
                      } finally {
                        setSafetyBusy(false);
                      }
                    }}
                  >
                    <strong>Report {profile.name}</strong>
                    <p>Reports are private. We will also block them for you.</p>
                    <select value={reason} onChange={(event) => setReason(event.target.value)}>
                      {REPORT_REASONS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      placeholder="Anything else we should know? (optional)"
                      value={details}
                      onChange={(event) => setDetails(event.target.value)}
                    />
                    <div>
                      <button type="button" className="text-link dark" onClick={() => setReportOpen(false)}>
                        Cancel
                      </button>
                      <button className="button button-dark" disabled={safetyBusy}>
                        {safetyBusy ? <LoaderCircle className="spin" size={16} /> : <Flag size={15} />}
                        Send report
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
