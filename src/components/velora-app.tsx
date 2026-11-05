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
  MessageCircle,
  PhoneOff,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Lenis from "lenis";
import { useEffect, useRef, useState } from "react";
import Connections from "@/components/connections";
import Discovery from "@/components/discovery";
import Hero from "@/components/hero";
import Messages from "@/components/messages";
import ProfileDetails from "@/components/profile-details";
import ProfileSettings from "@/components/profile-settings";
import { EditorialSections, IntentionScene } from "@/components/story-sections";
import { Avatar, Logo, Modal, Toast } from "@/components/ui";
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

export default function VeloraApp({ initialState }: { initialState: AppState }) {
  const [state, setState] = useState(initialState);
  const [view, setView] = useState<View>("discover");
  const [busy, setBusy] = useState(false);
  const [externalProfile, setExternalProfile] = useState<Profile | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [celebrationMatchId, setCelebrationMatchId] = useState<string | null>(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const studioRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenisRef.current = lenis;
    let frame = 0;
    const raf = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
    frame = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(frame); lenis.destroy(); lenisRef.current = null; };
  }, []);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }

  function scrollToStudio() {
    if (lenisRef.current) lenisRef.current.scrollTo(studioRef.current ?? 0, { offset: -72 });
    else studioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goTo(nextView: View, shouldScroll = true) {
    setView(nextView);
    if (nextView === "messages" && !selectedMatchId && state.matches[0]) setSelectedMatchId(state.matches[0].id);
    if (shouldScroll) requestAnimationFrame(scrollToStudio);
  }

  async function api(url: string, init: RequestInit): Promise<ApiResult> {
    const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
    const data = (await response.json()) as ApiResult;
    if (!response.ok) throw new Error(data.error || "Something went wrong");
    setState(data.state);
    return data;
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
      const result = await api("/api/interactions", { method: "POST", body: JSON.stringify({ profileId: profile.id, action }) });
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
      const result = await api("/api/interactions", { method: "POST", body: JSON.stringify({ action: "undo" }) });
      const restored = result.state.profiles.find((profile) => profile.id === result.restoredProfileId);
      notify(restored ? `${restored.name} is back in your edit` : "Your last choice was restored");
    } catch (error) { notify(error instanceof Error ? error.message : "Nothing to undo"); }
    finally { setBusy(false); }
  }

  async function savePreferences(preferences: Preferences) {
    try {
      await api("/api/preferences", { method: "PUT", body: JSON.stringify(preferences) });
      notify("Your discovery preferences are saved");
    } catch (error) { notify(error instanceof Error ? error.message : "Preferences could not be saved"); throw error; }
  }

  async function saveMember(member: Member) {
    try {
      await api("/api/member", { method: "PUT", body: JSON.stringify(member) });
      notify("Your profile and privacy settings are saved");
    } catch (error) { notify(error instanceof Error ? error.message : "Profile could not be saved"); throw error; }
  }

  async function sendMessage(matchId: string, text: string) {
    const previous = state;
    setState((current) => ({
      ...current,
      matches: current.matches.map((match) => match.id === matchId ? {
        ...match,
        lastMessageAt: new Date().toISOString(),
        messages: [...match.messages, { id: -Date.now(), matchId, sender: "you", body: text, createdAt: new Date().toISOString() }],
      } : match),
    }));
    try { await api("/api/messages", { method: "POST", body: JSON.stringify({ matchId, text }) }); }
    catch (error) { setState(previous); notify(error instanceof Error ? error.message : "Message could not be sent"); throw error; }
  }

  async function markRead(matchId: string) {
    setState((current) => ({ ...current, matches: current.matches.map((match) => match.id === matchId ? { ...match, unread: 0 } : match) }));
    try { await api("/api/messages", { method: "PATCH", body: JSON.stringify({ matchId }) }); }
    catch { /* The next refresh will reconcile the unread state. */ }
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

  const unread = state.member.notifications ? state.matches.reduce((total, match) => total + match.unread, 0) : 0;
  const celebrationMatch = state.matches.find((match) => match.id === celebrationMatchId) ?? null;
  const matchedIds = new Set(state.matches.map((match) => match.profileId));

  return (
    <main>
      <header className="site-header">
        <div className="page-shell header-inner">
          <button className="logo-button" onClick={() => { if (lenisRef.current) lenisRef.current.scrollTo(0); else window.scrollTo({ top: 0, behavior: "smooth" }); }}><Logo /></button>
          <nav className="top-nav" aria-label="Main navigation">
            {navItems.slice(0, 3).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)}>{item.label}{item.id === "messages" && unread ? <span>{unread}</span> : null}</button>)}
          </nav>
          <button className="header-profile" onClick={() => goTo("profile")}><span><small>Your space</small><strong>{state.member.name}</strong></span><Avatar src={state.member.photo} alt="Your profile" size={38} /></button>
        </div>
      </header>

      <Hero profiles={state.profiles} member={state.member} preferences={state.preferences} onStart={() => goTo("discover")} onProfile={(profile) => { setExternalProfile(profile); goTo("discover"); }} />

      <section className="app-studio" id="studio" ref={studioRef}>
        <div className="studio-topbar page-shell"><div><span className="live-dot dark-dot" /><span>Private preview community</span><i /> <span>London</span></div><span>Built for meaningful connection <Sparkles size={14} /></span></div>
        <div className="studio-shell page-shell">
          <aside className="studio-sidebar">
            <div className="sidebar-member"><Avatar src={state.member.photo} alt="" size={48} /><div><strong>{state.member.name}, {state.member.age}</strong><span>{state.member.city}</span></div></div>
            <nav aria-label="Your Velora space">
              {navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id, false)}><item.icon size={19} /><span>{item.label}</span>{item.id === "messages" && unread ? <b>{unread}</b> : null}{view === item.id ? <motion.i layoutId="sidebar-active" /> : null}</button>)}
            </nav>
            <div className="sidebar-intention"><Heart size={17} /><span>Here for</span><strong>{state.member.lookingFor}</strong><button onClick={() => goTo("profile", false)}>Edit profile <ArrowUpRight size={13} /></button></div>
            <button className="sidebar-safety" onClick={() => setSafetyOpen(true)}><ShieldCheck size={18} /><span><strong>Safety centre</strong><small>Date with confidence</small></span><ArrowUpRight size={14} /></button>
            <div className="sidebar-foot"><LockKeyhole size={13} /> Your choices stay private</div>
          </aside>
          <div className="studio-main">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                {view === "discover" ? <Discovery state={state} busy={busy} onAction={handleAction} onUndo={handleUndo} onSavePreferences={savePreferences} externalProfile={externalProfile} onCloseExternal={() => setExternalProfile(null)} onMessage={openProfileMessage} /> : null}
                {view === "matches" ? <Connections state={state} onAction={handleAction} onOpenChat={openChat} onViewProfile={setExternalProfile} /> : null}
                {view === "messages" ? <Messages state={state} selectedMatchId={selectedMatchId} onSelect={setSelectedMatchId} onSend={sendMessage} onRead={(matchId) => void markRead(matchId)} onViewProfile={(match: Match) => setExternalProfile(match.profile)} onSafety={() => setSafetyOpen(true)} /> : null}
                {view === "profile" ? <ProfileSettings state={state} onSave={saveMember} onSafety={() => setSafetyOpen(true)} onToast={notify} /> : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <IntentionScene />
      <EditorialSections onStart={() => goTo("discover")} onSafety={() => setSafetyOpen(true)} />

      {view !== "discover" ? <ProfileDetails profile={externalProfile} member={state.member} preferences={state.preferences} matched={Boolean(externalProfile && matchedIds.has(externalProfile.id))} onClose={() => setExternalProfile(null)} onAction={handleAction} onMessage={openProfileMessage} /> : null}

      <Modal open={Boolean(celebrationMatch)} onClose={() => setCelebrationMatchId(null)} label="It's a match" className="match-modal">
        {celebrationMatch ? <div className="match-celebration"><span className="eyebrow dark"><Sparkles size={14} /> The feeling is mutual</span><div className="match-avatar-pair"><motion.span initial={{ x: -40, rotate: -12 }} animate={{ x: 0, rotate: -7 }}><Avatar src={state.member.photo} alt="You" size={112} /></motion.span><motion.span initial={{ x: 40, rotate: 12 }} animate={{ x: 0, rotate: 7 }}><Avatar src={celebrationMatch.profile.photo} alt={celebrationMatch.profile.name} size={112} /></motion.span><i><Heart size={22} fill="currentColor" /></i></div><h2>You & {celebrationMatch.profile.name}</h2><p>You liked each other. Start with the detail that made you pause.</p><div className="match-shared">{celebrationMatch.profile.interests.filter((interest) => state.member.interests.includes(interest)).slice(0, 3).map((interest) => <span key={interest}><Check size={12} /> {interest}</span>)}</div><button className="button button-coral button-large" onClick={() => openChat(celebrationMatch.id)}><MessageCircle size={18} /> Say hello <ArrowRight size={18} /></button><button className="text-link dark" onClick={() => setCelebrationMatchId(null)}>Keep discovering</button></div> : null}
      </Modal>

      <Modal open={safetyOpen} onClose={() => setSafetyOpen(false)} label="Velora safety centre" className="safety-modal">
        <div className="safety-modal-header"><span><ShieldCheck size={28} /></span><div><span className="eyebrow dark">The Velora safety playbook</span><h2>Trust your pace.</h2><p>Practical steps for looking after yourself and the person you are meeting.</p></div></div>
        <div className="safety-playbook">
          <article><span>01</span><div><h3>Keep early conversations here</h3><p>There is no need to share your phone number, home address, workplace or financial details. Be wary of anyone who pressures you to move elsewhere immediately.</p></div></article>
          <article><span>02</span><div><h3>Make the first meeting public</h3><p>Choose a familiar café, gallery or busy public place. Arrange your own transport, tell a trusted person the plan and keep your phone charged.</p></div></article>
          <article><span>03</span><div><h3>Watch consistency, not intensity</h3><p>Take time to notice whether words and actions line up. Love-bombing, guilt, urgency and requests for money are reasons to step back—not hurdles to overcome.</p></div></article>
          <article><span>04</span><div><h3>You can leave at any point</h3><p>You never owe someone continued conversation, a second date or an explanation for discomfort. Ask venue staff for help if you feel unsafe.</p></div></article>
        </div>
        <div className="safety-emergency"><PhoneOff size={20} /><p><strong>Immediate danger?</strong> Contact local emergency services. Velora is a product preview and does not provide emergency response or crisis support.</p></div>
        <button className="button button-dark" onClick={() => setSafetyOpen(false)}>I understand <Check size={17} /></button>
      </Modal>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)}><span><item.icon size={20} />{item.id === "messages" && unread ? <b>{unread}</b> : null}</span><small>{item.label === "My profile" ? "Profile" : item.label}</small></button>)}</nav>
      {busy ? <span className="global-saving" aria-label="Saving"><LoaderCircle className="spin" size={16} /> Saving</span> : null}
      <Toast message={toast} />
    </main>
  );
}
