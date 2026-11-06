"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Heart,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Connections from "@/components/connections";
import Discovery from "@/components/discovery";
import Messages from "@/components/messages";
import ProfileDetails from "@/components/profile-details";
import ProfileSettings from "@/components/profile-settings";
import SafetyModal from "@/components/safety-modal";
import { Avatar, Logo, Modal, Toast } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import type { AppState, DiscoveryAction, Match, Member, Preferences, Profile, View } from "@/lib/types";

type ApiResult = {
  state: AppState;
  outcome?: { action: DiscoveryAction; profileId: string; matchId?: string };
  restoredProfileId?: string;
  error?: string;
};

const navItems = [
  { id: "discover" as const, label: "Discover", icon: Compass },
  { id: "matches" as const, label: "Matches", icon: Heart },
  { id: "messages" as const, label: "Messages", icon: MessageCircle },
  { id: "profile" as const, label: "My profile", icon: UserRound },
];

export default function LimhApp({ initialState }: { initialState: AppState }) {
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<View>("discover");
  const [busy, setBusy] = useState(false);
  const [externalProfile, setExternalProfile] = useState<Profile | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [celebrationMatchId, setCelebrationMatchId] = useState<string | null>(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewRef = useRef(view);
  const selectedMatchRef = useRef(selectedMatchId);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    selectedMatchRef.current = selectedMatchId;
  }, [selectedMatchId]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  async function api(url: string, init: RequestInit): Promise<ApiResult> {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
    const data = (await response.json()) as ApiResult;
    if (!response.ok) throw new Error(data.error || "Something went wrong");
    setState(data.state);
    return data;
  }

  async function markRead(matchId: string) {
    setState((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === matchId ? { ...match, unread: 0 } : match,
      ),
    }));
    try {
      await api("/api/messages", { method: "PATCH", body: JSON.stringify({ matchId }) });
    } catch {
      /* The next refresh reconciles the unread state. */
    }
  }

  /** Live updates: new messages, matches and likes arrive over SSE. */
  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch("/api/app", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as ApiResult;
        if (!data.state) return;
        setState(data.state);

        // If the new message arrived in the conversation on screen, read it.
        const openId = selectedMatchRef.current;
        if (viewRef.current === "messages" && openId) {
          const open = data.state.matches.find((match) => match.id === openId);
          if (open?.unread) {
            setState((current) => ({
              ...current,
              matches: current.matches.map((match) =>
                match.id === openId ? { ...match, unread: 0 } : match,
              ),
            }));
            void fetch("/api/messages", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ matchId: openId }),
            }).catch(() => undefined);
          }
        }
      } catch {
        // Offline for a moment; the stream will reconnect.
      }
    };

    try {
      source = new EventSource("/api/events");
      source.addEventListener("update", () => void refresh());
    } catch {
      source = null;
    }

    return () => {
      cancelled = true;
      source?.close();
    };
  }, []);

  function goTo(nextView: View) {
    setView(nextView);
    if (nextView === "messages" && !selectedMatchId && state.matches[0]) {
      const first = state.matches[0];
      setSelectedMatchId(first.id);
      if (first.unread) void markRead(first.id);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleAction(profile: Profile, action: DiscoveryAction) {
    if (busy) return;
    const previous = state;
    setBusy(true);
    setState((current) => ({
      ...current,
      interactions: [
        { profileId: profile.id, action, createdAt: new Date().toISOString() },
        ...current.interactions.filter((item) => item.profileId !== profile.id),
      ],
    }));
    try {
      const result = await api("/api/interactions", {
        method: "POST",
        body: JSON.stringify({ profileId: profile.id, action }),
      });
      if (result.outcome?.matchId) setCelebrationMatchId(result.outcome.matchId);
      else if (action === "superlike") notify(`Your spark is on its way to ${profile.name}`);
    } catch (error) {
      setState(previous);
      notify(error instanceof Error ? error.message : "That choice could not be saved");
    } finally {
      setBusy(false);
    }
  }

  async function handleUndo() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api("/api/interactions", {
        method: "POST",
        body: JSON.stringify({ action: "undo" }),
      });
      const restored = result.state.profiles.find((profile) => profile.id === result.restoredProfileId);
      notify(restored ? `${restored.name} is back in your edit` : "Your last choice was restored");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Nothing to undo");
    } finally {
      setBusy(false);
    }
  }

  async function savePreferences(preferences: Preferences) {
    try {
      await api("/api/preferences", { method: "PUT", body: JSON.stringify(preferences) });
      notify("Your discovery preferences are saved");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Preferences could not be saved");
      throw error;
    }
  }

  async function saveMember(member: Member) {
    try {
      await api("/api/member", { method: "PUT", body: JSON.stringify(member) });
      notify("Your profile and privacy settings are saved");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Profile could not be saved");
      throw error;
    }
  }

  async function sendMessage(matchId: string, text: string) {
    const previous = state;
    setState((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              lastMessageAt: new Date().toISOString(),
              messages: [
                ...match.messages,
                {
                  id: -Date.now(),
                  matchId,
                  sender: "you",
                  body: text,
                  createdAt: new Date().toISOString(),
                  readAt: null,
                },
              ],
            }
          : match,
      ),
    }));
    try {
      await api("/api/messages", { method: "POST", body: JSON.stringify({ matchId, text }) });
    } catch (error) {
      setState(previous);
      notify(error instanceof Error ? error.message : "Message could not be sent");
      throw error;
    }
  }

  function openChat(matchId: string) {
    setCelebrationMatchId(null);
    setExternalProfile(null);
    setSelectedMatchId(matchId);
    goTo("messages");
    const match = state.matches.find((item) => item.id === matchId);
    if (match?.unread) void markRead(matchId);
  }

  function openProfileMessage(profile: Profile) {
    const match = state.matches.find((item) => item.profileId === profile.id);
    if (match) openChat(match.id);
  }

  async function handleBlock(profile: Profile) {
    try {
      await api("/api/safety/block", {
        method: "POST",
        body: JSON.stringify({ userId: profile.id, blocked: true }),
      });
      setExternalProfile(null);
      if (state.matches.some((match) => match.profileId === profile.id)) setSelectedMatchId(null);
      notify(`You blocked ${profile.name}. They can no longer see or message you.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not block this profile");
      throw error;
    }
  }

  async function handleReport(profile: Profile, reason: string, details: string) {
    try {
      await api("/api/safety/report", {
        method: "POST",
        body: JSON.stringify({ userId: profile.id, reason, details, block: true }),
      });
      setExternalProfile(null);
      notify("Report received. We have blocked them for you as well.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not send the report");
      throw error;
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  async function handleDeleteAccount() {
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      notify(data.error || "Could not delete the account");
      return;
    }
    window.location.assign("/");
  }

  const unread = state.member.notifications
    ? state.matches.reduce((total, match) => total + match.unread, 0)
    : 0;
  const celebrationMatch = state.matches.find((match) => match.id === celebrationMatchId) ?? null;
  const matchedIds = new Set(state.matches.map((match) => match.profileId));

  return (
    <main className="app-page">
      <header className="app-header">
        <div className="page-shell header-inner">
          <button className="logo-button" onClick={() => goTo("discover")} aria-label="Love Is My Heart discover">
            <Logo />
          </button>
          <nav className="top-nav" aria-label="Main navigation">
            {navItems.slice(0, 3).map((item) => (
              <button
                key={item.id}
                className={view === item.id ? "active" : ""}
                onClick={() => goTo(item.id)}
              >
                {item.label}
                {item.id === "messages" && unread ? <span>{unread}</span> : null}
              </button>
            ))}
          </nav>
          <button className="header-profile" onClick={() => goTo("profile")}>
            <span>
              <small>Your space</small>
              <strong>{state.member.name}</strong>
            </span>
            <Avatar src={state.member.photo} alt="Your profile" size={38} />
          </button>
        </div>
      </header>

      <section className="app-studio" id="studio">
        <div className="studio-topbar page-shell">
          <div>
            <span className="live-dot dark-dot" />
            <span>{state.demoMode ? "Preview community" : "Love Is My Heart community"}</span>
            <i />
            <span>{state.member.city}</span>
          </div>
          <span>
            {state.demoMode ? "Sample profiles reply automatically" : "Built for meaningful connection"}{" "}
            <Sparkles size={14} />
          </span>
        </div>

        {state.demoMode ? (
          <div className="demo-banner page-shell">
            <Sparkles size={15} />
            <p>
              <strong>You are in the demo community.</strong> Sample profiles are labelled and
              reply from their own profile text. Create a real account to match with actual people.
            </p>
          </div>
        ) : null}

        <div className="studio-shell page-shell">
          <aside className="studio-sidebar">
            <div className="sidebar-member">
              <Avatar src={state.member.photo} alt="" size={48} />
              <div>
                <strong>
                  {state.member.name}, {state.member.age}
                </strong>
                <span>
                  {state.member.area ? `${state.member.area}, ` : ""}
                  {state.member.city}
                </span>
              </div>
            </div>
            <nav aria-label="Your LIMH space">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={view === item.id ? "active" : ""}
                  onClick={() => goTo(item.id)}
                >
                  <item.icon size={19} />
                  <span>{item.label}</span>
                  {item.id === "messages" && unread ? <b>{unread}</b> : null}
                  {view === item.id ? <motion.i layoutId="sidebar-active" /> : null}
                </button>
              ))}
            </nav>
            <div className="sidebar-intention">
              <Heart size={17} />
              <span>Here for</span>
              <strong>{state.member.lookingFor}</strong>
              <button onClick={() => goTo("profile")}>
                Edit profile <ArrowUpRight size={13} />
              </button>
            </div>
            <button className="sidebar-safety" onClick={() => setSafetyOpen(true)}>
              <ShieldCheck size={18} />
              <span>
                <strong>Safety centre</strong>
                <small>Date with confidence</small>
              </span>
              <ArrowUpRight size={14} />
            </button>
            <button className="sidebar-signout" onClick={handleSignOut}>
              <LogOut size={15} /> Sign out
            </button>
            <div className="sidebar-foot">
              <LockKeyhole size={13} /> Your choices stay private
            </div>
          </aside>

          <div className="studio-main">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {view === "discover" ? (
                  <Discovery
                    state={state}
                    busy={busy}
                    onAction={handleAction}
                    onUndo={handleUndo}
                    onSavePreferences={savePreferences}
                    externalProfile={externalProfile}
                    onCloseExternal={() => setExternalProfile(null)}
                    onMessage={openProfileMessage}
                    onBlock={handleBlock}
                    onReport={handleReport}
                  />
                ) : null}
                {view === "matches" ? (
                  <Connections
                    state={state}
                    onAction={handleAction}
                    onOpenChat={openChat}
                    onViewProfile={setExternalProfile}
                  />
                ) : null}
                {view === "messages" ? (
                  <Messages
                    state={state}
                    selectedMatchId={selectedMatchId}
                    onSelect={setSelectedMatchId}
                    onSend={sendMessage}
                    onRead={(matchId) => void markRead(matchId)}
                    onViewProfile={(match: Match) => setExternalProfile(match.profile)}
                    onSafety={() => setSafetyOpen(true)}
                  />
                ) : null}
                {view === "profile" ? (
                  <ProfileSettings
                    state={state}
                    onSave={saveMember}
                    onSafety={() => setSafetyOpen(true)}
                    onToast={notify}
                    onSignOut={handleSignOut}
                    onDeleteAccount={handleDeleteAccount}
                  />
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {view !== "discover" ? (
        <ProfileDetails
          profile={externalProfile}
          member={state.member}
          preferences={state.preferences}
          matched={Boolean(externalProfile && matchedIds.has(externalProfile.id))}
          onClose={() => setExternalProfile(null)}
          onAction={handleAction}
          onMessage={openProfileMessage}
          onBlock={handleBlock}
          onReport={handleReport}
        />
      ) : null}

      <Modal
        open={Boolean(celebrationMatch)}
        onClose={() => setCelebrationMatchId(null)}
        label="It's a match"
        className="match-modal"
      >
        {celebrationMatch ? (
          <div className="match-celebration">
            <span className="eyebrow dark">
              <Sparkles size={14} /> The feeling is mutual
            </span>
            <div className="match-avatar-pair">
              <motion.span initial={{ x: -40, rotate: -12 }} animate={{ x: 0, rotate: -7 }}>
                <Avatar src={state.member.photo} alt="You" size={112} />
              </motion.span>
              <motion.span initial={{ x: 40, rotate: 12 }} animate={{ x: 0, rotate: 7 }}>
                <Avatar src={celebrationMatch.profile.photo} alt={celebrationMatch.profile.name} size={112} />
              </motion.span>
              <i>
                <Heart size={22} fill="currentColor" />
              </i>
            </div>
            <h2>
              You &amp; {celebrationMatch.profile.name}
            </h2>
            <p>You liked each other. Start with the detail that made you pause.</p>
            <div className="match-shared">
              {celebrationMatch.profile.interests
                .filter((interest) => state.member.interests.includes(interest))
                .slice(0, 3)
                .map((interest) => (
                  <span key={interest}>
                    <Check size={12} /> {interest}
                  </span>
                ))}
            </div>
            <button className="button button-coral button-large" onClick={() => openChat(celebrationMatch.id)}>
              <MessageCircle size={18} /> Say hello <ArrowRight size={18} />
            </button>
            <button className="text-link dark" onClick={() => setCelebrationMatchId(null)}>
              Keep discovering
            </button>
          </div>
        ) : null}
      </Modal>

      <SafetyModal open={safetyOpen} onClose={() => setSafetyOpen(false)} />

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)}>
            <span>
              <item.icon size={20} />
              {item.id === "messages" && unread ? <b>{unread}</b> : null}
            </span>
            <small>{item.label === "My profile" ? "Profile" : item.label}</small>
          </button>
        ))}
      </nav>
      {busy ? (
        <span className="global-saving" aria-label="Saving">
          <LoaderCircle className="spin" size={16} /> Saving
        </span>
      ) : null}
      <Toast message={toast} />
    </main>
  );
}
