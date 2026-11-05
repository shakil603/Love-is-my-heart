"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Lightbulb,
  LoaderCircle,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Modal, VerifiedBadge } from "@/components/ui";
import { conversationStarter } from "@/lib/matching";
import type { AppState, Match } from "@/lib/types";

type DateIdea = { title: string; detail: string; area: string };

function dateIdeas(match: Match): DateIdea[] {
  const interests = match.profile.interests;
  const ideas: DateIdea[] = [];
  if (interests.includes("Independent cinema")) ideas.push({ title: "A film & a proper debrief", detail: "The Garden Cinema, followed by a drink nearby", area: "Covent Garden" });
  if (interests.includes("Art galleries")) ideas.push({ title: "Art, then coffee", detail: "Tate Modern and a slow walk along the river", area: "Bankside" });
  if (interests.includes("Street food") || interests.includes("Cooking")) ideas.push({ title: "A market lunch", detail: "Pick three dishes to share at Borough Market", area: "London Bridge" });
  if (interests.includes("Live music") || interests.includes("Electronic music")) ideas.push({ title: "A small gig", detail: "An early set at The Social, with time to talk first", area: "Fitzrovia" });
  if (interests.includes("Bookshops")) ideas.push({ title: "Books & a glass of wine", detail: "Browse Review Bookshop, then choose a bottle to share", area: "Peckham" });
  if (interests.includes("Hiking")) ideas.push({ title: "A walk with a view", detail: "The Hampstead Heath circular, ending at a neighbourhood pub", area: "Hampstead" });
  ideas.push({ title: "Coffee with no rush", detail: `A quiet table for two near ${match.profile.neighborhood}`, area: match.profile.neighborhood });
  return ideas.slice(0, 3);
}

export default function Messages({
  state,
  selectedMatchId,
  onSelect,
  onSend,
  onRead,
  onViewProfile,
  onSafety,
}: {
  state: AppState;
  selectedMatchId: string | null;
  onSelect: (matchId: string | null) => void;
  onSend: (matchId: string, text: string) => Promise<void>;
  onRead: (matchId: string) => void;
  onViewProfile: (match: Match) => void;
  onSafety: () => void;
}) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:30");
  const bottomRef = useRef<HTMLDivElement>(null);
  const selected = state.matches.find((match) => match.id === selectedMatchId) ?? null;
  const filtered = state.matches.filter((match) => match.profile.name.toLowerCase().includes(query.toLowerCase()));
  const ideas = useMemo(() => (selected ? dateIdeas(selected) : []), [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected?.messages.length, selectedMatchId]);

  function chooseMatch(matchId: string) {
    onSelect(matchId);
    setDraft("");
    const match = state.matches.find((item) => item.id === matchId);
    if (match?.unread) onRead(matchId);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      await onSend(selected.id, draft.trim());
      setDraft("");
    } catch {
      // Keep the draft intact when the network request fails.
    } finally {
      setSending(false);
    }
  }

  async function sendDateIdea() {
    if (!selected || !date || !time) return;
    const idea = ideas[ideaIndex];
    const formatted = new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const text = `Date idea — ${idea.title}\n${idea.detail} (${idea.area}).\n${formatted} at ${time}. Would you be up for it?`;
    setSending(true);
    try {
      await onSend(selected.id, text);
      setPlannerOpen(false);
    } catch {
      // Keep the planner open so no date details are lost.
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="messages-view">
      <div className="view-heading messages-heading"><div><span className="eyebrow dark">Your inbox</span><h2>Say something real.</h2></div><button className="text-link dark" onClick={onSafety}><ShieldCheck size={16} /> Dating safely</button></div>
      <div className={`messenger ${selected ? "has-selection" : ""}`}>
        <aside className="conversation-sidebar">
          <div className="conversation-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" aria-label="Search conversations" />{query ? <button onClick={() => setQuery("")}>Clear</button> : null}</div>
          <div className="conversation-count">{filtered.length} {filtered.length === 1 ? "conversation" : "conversations"}</div>
          <div className="conversation-list">
            {filtered.map((match) => {
              const last = match.messages[match.messages.length - 1];
              return <button key={match.id} className={`conversation-item ${selectedMatchId === match.id ? "active" : ""}`} onClick={() => chooseMatch(match.id)}><span className="conversation-avatar"><Avatar src={match.profile.photo} alt="" size={52} />{match.profile.lastActive === "Active now" ? <i /> : null}</span><span className="conversation-preview"><strong>{match.profile.name}{match.unread ? <b>{match.unread}</b> : null}</strong><small>{last ? `${last.sender === "you" ? "You: " : ""}${last.body}` : "Start your story"}</small></span><time suppressHydrationWarning>{new Date(match.lastMessageAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</time></button>;
            })}
            {!filtered.length ? <div className="no-search-results"><Search size={22} /><p>No conversations match “{query}”.</p></div> : null}
          </div>
          <div className="inbox-note"><ShieldCheck size={18} /><p><strong>Your space, your boundaries.</strong> Keep early chats here and never feel pressured to share contact details.</p></div>
        </aside>

        {selected ? (
          <section className="chat-panel">
            <header className="chat-header"><button className="mobile-chat-back icon-button" onClick={() => onSelect(null)} aria-label="Back to conversations"><ArrowLeft size={20} /></button><button className="chat-person" onClick={() => onViewProfile(selected)}><Avatar src={selected.profile.photo} alt={selected.profile.photoAlt} size={44} /><span><strong>{selected.profile.name} {selected.profile.verified ? <VerifiedBadge /> : null}</strong><small>{selected.profile.lastActive} · {selected.profile.neighborhood}</small></span></button><button className="button button-outline plan-button" onClick={() => setPlannerOpen(true)}><CalendarDays size={16} /> Plan a date</button></header>
            <div className="message-scroll">
              <div className="chat-origin"><Avatar src={selected.profile.photo} alt="" size={68} /><h3>You and {selected.profile.name} found each other.</h3><p>{getSharedCopy(selected, state.member.interests)}</p></div>
              <AnimatePresence initial={false}>
                {selected.messages.map((message) => message.sender === "system" ? (
                  <motion.div className="system-message" key={message.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Sparkles size={13} /><span>{message.body}</span></motion.div>
                ) : (
                  <motion.div className={`message-row ${message.sender === "you" ? "from-you" : "from-them"}`} key={message.id} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                    {message.sender === "them" ? <Avatar src={selected.profile.photo} alt="" size={30} /> : null}
                    <div><p>{message.body}</p><span suppressHydrationWarning>{new Date(message.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}{message.sender === "you" && state.member.readReceipts ? <Check size={13} aria-label="Sent" /> : null}</span></div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
            <div className="starter-row"><Lightbulb size={14} /><button onClick={() => setDraft(conversationStarter(selected.profile, state.member))}>Need an opening? Try one based on {selected.profile.name}&apos;s profile</button></div>
            <form className="message-composer" onSubmit={submit}><textarea rows={1} maxLength={1000} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder={`Message ${selected.profile.name}…`} aria-label={`Message ${selected.profile.name}`} /><span>{draft.length > 800 ? `${draft.length}/1000` : ""}</span><button type="submit" disabled={!draft.trim() || sending} aria-label="Send message">{sending ? <LoaderCircle className="spin" size={19} /> : <Send size={19} />}</button></form>
          </section>
        ) : (
          <div className="no-chat-selected"><span><Send size={27} /></span><h3>Choose a conversation</h3><p>Thoughtful hellos welcome. There is no timer here.</p></div>
        )}
      </div>

      <Modal open={plannerOpen} onClose={() => setPlannerOpen(false)} label="Plan a date" className="planner-modal">
        {selected ? <><div className="filter-header"><span className="eyebrow dark">Make a gentle plan</span><h2>Somewhere you can actually talk.</h2><p>Choose an idea and send it as a real message. You can agree on details together.</p></div><div className="date-ideas">{ideas.map((idea, index) => <button className={ideaIndex === index ? "selected" : ""} key={idea.title} onClick={() => setIdeaIndex(index)}><span>{index + 1}</span><div><strong>{idea.title}</strong><p>{idea.detail}</p><small><MapPin size={12} /> {idea.area}</small></div></button>)}</div><div className="date-time-grid"><label>Date<input type="date" required value={date} min={new Date().toISOString().split("T")[0]} onChange={(event) => setDate(event.target.value)} /></label><label>Time<div><Clock3 size={16} /><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div></label></div><button className="button button-coral planner-send" onClick={sendDateIdea} disabled={!date || !time || sending}>{sending ? <LoaderCircle className="spin" size={18} /> : <CalendarDays size={18} />} Send date idea to {selected.profile.name}<ArrowUpRight size={17} /></button></> : null}
      </Modal>
    </div>
  );
}

function getSharedCopy(match: Match, memberInterests: string[]) {
  const shared = match.profile.interests.filter((interest) => memberInterests.includes(interest));
  return shared.length ? `You both have ${shared.slice(0, 2).join(" and ").toLowerCase()} on your wavelength.` : `A shared intention brought you together. The rest is yours to discover.`;
}
