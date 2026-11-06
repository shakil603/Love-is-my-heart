"use client";

import { ArrowRight, Heart, Smartphone, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Hero from "@/components/hero";
import ProfileDetails from "@/components/profile-details";
import SafetyModal from "@/components/safety-modal";
import { EditorialSections, IntentionScene } from "@/components/story-sections";
import { Logo } from "@/components/ui";
import { seedMember, seedPreferences, seedProfiles } from "@/lib/catalog";
import type { Profile } from "@/lib/types";

export default function Landing({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [joining, setJoining] = useState(false);

  function start() {
    router.push("/join");
  }

  async function exploreDemo() {
    setJoining(true);
    try {
      const response = await fetch("/api/demo/session", { method: "POST" });
      if (!response.ok) throw new Error("demo");
      router.push("/app");
      router.refresh();
    } catch {
      router.push("/signin");
    } finally {
      setJoining(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <div className="page-shell header-inner">
          <Link className="logo-button" href="/" aria-label="Love Is My Heart home">
            <Logo />
          </Link>
          <nav className="top-nav" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#safety">Safety</a>
            <a href="#questions">Questions</a>
          </nav>
          <div className="header-actions">
            <Link className="header-signin" href="/signin">
              Sign in
            </Link>
            <Link className="button button-lime" href="/join">
              Join LIMH <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <Hero
        profiles={seedProfiles}
        member={seedMember}
        preferences={seedPreferences}
        onStart={start}
        onProfile={setProfile}
      />

      <section className="landing-strip">
        <div className="page-shell">
          <span>
            <Sparkles size={15} /> A real, self-hosted community
          </span>
          <p>
            Real accounts. Real messages. Real distance between the cities you actually live in.
          </p>
          <div>
            <span>
              <strong>3</strong> things that matter
            </span>
            <span>
              <strong>0</strong> like counters
            </span>
            <span>
              <strong>1</strong> honest profile
            </span>
          </div>
        </div>
      </section>

      <div id="how-it-works">
        <IntentionScene />
      </div>

      <section className="landing-demo" id="the-demo">
        <div className="page-shell landing-demo-inner">
          <div>
            <span className="eyebrow dark">Not ready to sign up?</span>
            <h2>Walk through a live LIMH account.</h2>
            <p>
              The demo signs you into a sample profile with matches, conversations and a full
              discovery deck. Sample profiles are labelled and their replies are generated from
              their own profile text — never a hidden person.
            </p>
            {demoMode ? (
              <button className="button button-dark button-large landing-demo-button" onClick={exploreDemo} disabled={joining}>
                <Heart size={18} fill="currentColor" />
                {joining ? "Opening the demo…" : "Explore the live demo"}
              </button>
            ) : (
              <Link className="button button-dark button-large landing-demo-button" href="/join">
                Create your account <ArrowRight size={18} />
              </Link>
            )}
            <div className="landing-apk">
              <a
                className="button button-outline"
                href="/downloads/love-is-my-heart.apk"
                download
              >
                <Smartphone size={17} /> Download the Android app
              </a>
              <small>APK · Android 7+ · connects to this server</small>
            </div>
          </div>
          <div className="landing-demo-facts">
            <span><strong>Real</strong> accounts and messages</span>
            <span><strong>Real</strong> distance between cities</span>
            <span><strong>No</strong> ads, tracking or like counters</span>
            <span><strong>Yours</strong> to export or delete</span>
          </div>
        </div>
      </section>

      <EditorialSections onStart={start} onSafety={() => setSafetyOpen(true)} />

      <ProfileDetails
        profile={profile}
        member={seedMember}
        preferences={seedPreferences}
        matched={false}
        onClose={() => setProfile(null)}
        onAction={() => {
          setProfile(null);
          start();
        }}
      />
      <SafetyModal open={safetyOpen} onClose={() => setSafetyOpen(false)} />
    </main>
  );
}
