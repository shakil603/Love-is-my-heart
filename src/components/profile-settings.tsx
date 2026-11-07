"use client";

import { motion } from "motion/react";
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  Heart,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MapPin,
  ShieldCheck,
  ShieldBan,
  Sparkles,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import PhotoUploader from "@/components/photo-uploader";
import { Toggle, VerifiedBadge } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { CITIES } from "@/lib/cities";
import { INTENTIONS, INTERESTS } from "@/lib/catalog";
import type { AppState, Member } from "@/lib/types";

export default function ProfileSettings({
  state,
  onSave,
  onSafety,
  onToast,
  onSignOut,
  onDeleteAccount,
}: {
  state: AppState;
  onSave: (member: Member) => Promise<void>;
  onSafety: () => void;
  onToast: (message: string) => void;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(state.member);
  const [saving, setSaving] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const completeness = useMemo(() => {
    const checks = [
      draft.name.length >= 2,
      draft.bio.length >= 80,
      draft.interests.length >= 4,
      Boolean(draft.photo),
      Boolean(draft.lookingFor),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.member);

  async function save() {
    setSaving(true);
    try {
      await onSave(draft);
    } catch {
      /* The parent reports the error and preserves the draft. */
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

  async function changePassword() {
    setPasswordError(null);
    if (newPassword.length < 8) return setPasswordError("Use at least 8 characters");
    setPasswordBusy(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setPasswordError(result.error.message ?? "Could not change the password");
        return;
      }
      onToast("Your password has been updated");
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPasswordError("Could not change the password");
    } finally {
      setPasswordBusy(false);
    }
  }

  const cityNames = CITIES.map((city) => city.name);
  if (!cityNames.includes(draft.city)) cityNames.push(draft.city);

  return (
    <div className="profile-settings-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow dark">Your corner of LIMH</span>
          <h2>Show up as yourself.</h2>
          <p>A specific profile gives the right person something real to respond to.</p>
        </div>
        <button
          className="button button-dark"
          disabled={!dirty || saving || draft.bio.trim().length < 20}
          onClick={save}
        >
          {saving ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />}
          {dirty ? "Save changes" : "All changes saved"}
        </button>
      </div>

      <div className="settings-layout">
        <div className="settings-forms">
          <motion.section className="settings-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="settings-card-heading">
              <span>01</span>
              <div>
                <h3>The essentials</h3>
                <p>The basics people see first.</p>
              </div>
            </div>
            <div className="profile-name-grid">
              <label>
                First name
                <input
                  value={draft.name}
                  maxLength={40}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </label>
              <label>
                Age
                <input
                  type="number"
                  min="18"
                  max="99"
                  value={draft.age}
                  onChange={(event) => setDraft({ ...draft, age: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="profile-name-grid">
              <label>
                Home city
                <div className="select-wrap">
                  <select
                    value={draft.city}
                    onChange={(event) => setDraft({ ...draft, city: event.target.value })}
                  >
                    {cityNames.map((city) => (
                      <option key={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>
              <label>
                Area or neighbourhood
                <div className="input-with-icon">
                  <MapPin size={16} />
                  <input
                    value={draft.area}
                    maxLength={80}
                    onChange={(event) => setDraft({ ...draft, area: event.target.value })}
                  />
                </div>
              </label>
            </div>
            <div className="profile-name-grid">
              <label>
                What you do
                <input
                  value={draft.occupation}
                  maxLength={80}
                  onChange={(event) => setDraft({ ...draft, occupation: event.target.value })}
                />
              </label>
              <label>
                Relationship intention
                <div className="select-wrap">
                  <select
                    value={draft.lookingFor}
                    onChange={(event) => setDraft({ ...draft, lookingFor: event.target.value })}
                  >
                    {INTENTIONS.filter((item) => item !== "Any intention").map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>
            </div>
            <p className="settings-note">
              {draft.verified ? <VerifiedBadge /> : null} Verification comes from confirming your
              email address. Love Is My Heart never asks for ID documents.
            </p>
          </motion.section>

          <motion.section
            className="settings-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
          >
            <div className="settings-card-heading">
              <span>02</span>
              <div>
                <h3>Photos & your own words</h3>
                <p>Skip the elevator pitch. Tell a small truth.</p>
              </div>
            </div>
            <label className="onboarding-label">Your photos</label>
            <PhotoUploader
              photos={draft.photos}
              onChange={(photos) => setDraft({ ...draft, photos, photo: photos[0] ?? "" })}
            />
            <label>
              About you
              <textarea
                rows={5}
                maxLength={500}
                value={draft.bio}
                onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
              />
              <small className="character-count">{draft.bio.length}/500 · at least 20 characters</small>
            </label>
            <div className="filter-label">
              <label>Your interests</label>
              <small>{draft.interests.length}/6 selected</small>
            </div>
            <div className="filter-interests profile-interest-picker">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  className={draft.interests.includes(interest) ? "selected" : ""}
                  onClick={() => toggleInterest(interest)}
                >
                  {draft.interests.includes(interest) ? <Check size={13} /> : <Sparkles size={12} />}
                  {interest}
                </button>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="settings-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <div className="settings-card-heading">
              <span>03</span>
              <div>
                <h3>Privacy, without the maze</h3>
                <p>Clear controls. Changes save with your profile.</p>
              </div>
            </div>
            <div className="privacy-row">
              <Eye size={19} />
              <div>
                <strong>Show my active status</strong>
                <p>Let matches see when you are active.</p>
              </div>
              <Toggle
                checked={draft.showOnline}
                onChange={(showOnline) => setDraft({ ...draft, showOnline })}
                label="Show active status"
              />
            </div>
            <div className="privacy-row">
              <Check size={19} />
              <div>
                <strong>Message status</strong>
                <p>Show sent indicators beneath your messages.</p>
              </div>
              <Toggle
                checked={draft.readReceipts}
                onChange={(readReceipts) => setDraft({ ...draft, readReceipts })}
                label="Message status"
              />
            </div>
            <div className="privacy-row">
              <LockKeyhole size={19} />
              <div>
                <strong>Activity badges</strong>
                <p>Show unread counts in your navigation.</p>
              </div>
              <Toggle
                checked={draft.notifications}
                onChange={(notifications) => setDraft({ ...draft, notifications })}
                label="Activity badges"
              />
            </div>
          </motion.section>

          <section className="settings-card account-card">
            <div className="settings-card-heading">
              <span>04</span>
              <div>
                <h3>Your account</h3>
                <p>Signed in as {state.member.email ?? "your email"}.</p>
              </div>
            </div>

            {!passwordOpen ? (
              <button className="text-link dark account-action" onClick={() => setPasswordOpen(true)}>
                <LockKeyhole size={15} /> Change password
              </button>
            ) : (
              <div className="password-form">
                <label>
                  Current password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                  />
                </label>
                <label>
                  New password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                {passwordError ? <p className="form-error">{passwordError}</p> : null}
                <div>
                  <button className="text-link dark" onClick={() => setPasswordOpen(false)}>
                    Cancel
                  </button>
                  <button className="button button-dark" disabled={passwordBusy} onClick={changePassword}>
                    {passwordBusy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
                    Update password
                  </button>
                </div>
              </div>
            )}

            <div className="account-actions">
              <a className="button button-outline" href="/api/export" download>
                <Download size={16} /> Export my data
              </a>
              <button className="button button-outline" onClick={onSignOut}>
                <LogOut size={16} /> Sign out
              </button>
              <button
                className="button button-outline danger"
                onClick={() => setDeleteArmed(true)}
                disabled={deleting}
              >
                <Trash2 size={16} /> Delete account
              </button>
            </div>

            {deleteArmed ? (
              <div className="delete-confirm">
                <ShieldBan size={20} />
                <div>
                  <strong>Delete everything?</strong>
                  <p>
                    This removes your profile, photos, matches and messages immediately. It
                    cannot be undone.
                  </p>
                  <div>
                    <button className="text-link dark" onClick={() => setDeleteArmed(false)}>
                      Keep my account
                    </button>
                    <button
                      className="button button-coral"
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true);
                        try {
                          await onDeleteAccount();
                        } finally {
                          setDeleting(false);
                        }
                      }}
                    >
                      {deleting ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
                      Yes, delete it all
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

        </div>

        <aside className="profile-preview-column">
          <div className="preview-sticky">
            <div className="preview-label">
              <span>Live profile preview</span>
              <strong>{completeness}% complete</strong>
            </div>
            <div className="profile-preview-card">
              <div className="preview-photo">
                <Image
                  src={draft.photo || "/placeholder.jpg"}
                  alt="Your profile preview"
                  fill
                  sizes="340px"
                />
                <div className="discovery-card-shade" />
                <div>
                  <span className={`status-label ${draft.showOnline ? "online" : ""}`}>
                    {draft.showOnline ? "Active status visible" : "Active status hidden"}
                  </span>
                  <h3>
                    {draft.name || "Your name"}, {draft.age}{" "}
                    {draft.verified ? <VerifiedBadge /> : null}
                  </h3>
                  <p>
                    <MapPin size={13} /> {draft.area ? `${draft.area}, ` : ""}
                    {draft.city}
                  </p>
                </div>
              </div>
              <div className="preview-body">
                <p>{draft.bio || "Write something that sounds like you."}</p>
                <div className="chip-list">
                  {draft.interests.map((interest) => (
                    <span className="chip chip-shared" key={interest}>
                      {interest}
                    </span>
                  ))}
                </div>
                <div className="profile-intention">
                  <Heart size={16} /> {draft.lookingFor}
                </div>
              </div>
            </div>
            <div className="completion-bar">
              <motion.span animate={{ width: `${completeness}%` }} />
            </div>
            <p className="preview-tip">
              <Sparkles size={14} /> Profiles with four or more interests give matches more ways to
              begin.
            </p>
            <button className="safety-link-card" onClick={onSafety}>
              <ShieldCheck size={23} />
              <span>
                <strong>A quick safety check</strong>
                <small>Practical guidance for chats and first dates</small>
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
