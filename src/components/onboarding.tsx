"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  LoaderCircle,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import PhotoUploader from "@/components/photo-uploader";
import { Logo, Toast } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { CITIES } from "@/lib/cities";
import { INTERESTS, INTENTIONS } from "@/lib/catalog";

const PROMPTS = [
  "A perfect first date",
  "We will get along if",
  "The quickest way to my heart",
  "A life goal of mine",
  "My simple pleasures",
  "I will know it is a good date if",
  "Something I want to learn with you",
  "A green flag I look for",
];

const GENDERS = ["Woman", "Man", "Non-binary", "Prefer not to say"];

type Draft = {
  name: string;
  age: number;
  gender: string;
  city: string;
  area: string;
  occupation: string;
  bio: string;
  photos: string[];
  interests: string[];
  lookingFor: string;
  promptQuestion: string;
  promptAnswer: string;
  idealSunday: string;
};

export default function Onboarding({
  defaultName,
  defaultCity,
}: {
  defaultName: string;
  defaultCity: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    name: defaultName,
    age: 28,
    gender: "Prefer not to say",
    city: defaultCity,
    area: "",
    occupation: "",
    bio: "",
    photos: [],
    interests: [],
    lookingFor: "Long-term relationship",
    promptQuestion: PROMPTS[0],
    promptAnswer: "",
    idealSunday: "",
  });

  const cityOptions = useMemo(
    () =>
      [...CITIES].sort((a, b) =>
        a.country === b.country ? a.name.localeCompare(b.name) : a.country.localeCompare(b.country),
      ),
    [],
  );

  const completeness = useMemo(() => {
    const checks = [
      draft.name.length >= 2,
      draft.age >= 18,
      Boolean(draft.city),
      draft.bio.length >= 20,
      draft.photos.length > 0,
      draft.interests.length >= 3,
      draft.promptAnswer.length >= 10,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleInterest(interest: string) {
    setDraft((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest].slice(-6),
    }));
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (draft.name.trim().length < 2) return setError("Tell us the first name people should see");
      if (draft.age < 18) return setError("Love Is My Heart is for adults aged 18 and over");
      if (!draft.city) return setError("Choose your city so distances stay honest");
    }
    if (step === 1 && draft.bio.trim().length < 20) {
      return setError("A couple of honest sentences is all we need — at least 20 characters");
    }
    setStep((current) => Math.min(2, current + 1));
  }

  async function finish() {
    setError(null);
    if (draft.interests.length < 3) return setError("Choose at least three interests");
    if (draft.promptAnswer.trim().length < 10) {
      return setError("Give your prompt answer a little more of you");
    }

    setBusy(true);
    try {
      const response = await fetch("/api/member", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          languages: [],
          height: "",
          education: "",
          drinking: "Socially",
          smoking: "Never",
          workout: "",
          anthem: "",
          showOnline: true,
          readReceipts: true,
          notifications: true,
          onboardingComplete: true,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save your profile");
      setToast("Your profile is live. Welcome to Love Is My Heart.");
      router.push("/app");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your profile");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <Link href="/" aria-label="Love Is My Heart home">
          <Logo dark />
        </Link>
        <div>
          <span>{completeness}% complete</span>
          <button className="text-link dark" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="onboarding-shell">
        <aside className="onboarding-rail">
          <span className="eyebrow dark">
            <Sparkles size={13} /> Build your profile
          </span>
          <h1>
            Show up as
            <br />
            <em>yourself.</em>
          </h1>
          <p>A specific profile gives the right person something real to respond to.</p>
          <ol>
            {["The essentials", "Your face & your words", "What moves you"].map((label, index) => (
              <li key={label} className={index === step ? "active" : index < step ? "done" : ""}>
                <span>{index < step ? <Check size={13} /> : `0${index + 1}`}</span>
                <div>
                  <strong>{label}</strong>
                  <small>
                    {index === 0
                      ? "Name, age and city"
                      : index === 1
                        ? "Photos and a short bio"
                        : "Interests, intention and a prompt"}
                  </small>
                </div>
              </li>
            ))}
          </ol>
          <div className="onboarding-avatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.photos[0] ?? "/placeholder.jpg"} alt="" />
            <div>
              <strong>
                {draft.name || "Your name"}
                {draft.age ? `, ${draft.age}` : ""}
              </strong>
              <small>
                <MapPin size={12} /> {draft.city}
              </small>
            </div>
          </div>
        </aside>

        <section className="onboarding-card">
          <div className="onboarding-progress">
            <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>

          {step === 0 ? (
            <div className="onboarding-step">
              <span className="eyebrow dark">Step one</span>
              <h2>The essentials.</h2>
              <p>The basics people see first. You can change any of this later.</p>

              <div className="onboarding-grid two">
                <label>
                  First name
                  <input
                    value={draft.name}
                    maxLength={40}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="Alex"
                  />
                </label>
                <label>
                  Age
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={draft.age}
                    onChange={(event) => update("age", Number(event.target.value))}
                  />
                </label>
              </div>

              <label>
                I am
                <div className="select-wrap">
                  <select value={draft.gender} onChange={(event) => update("gender", event.target.value)}>
                    {GENDERS.map((gender) => (
                      <option key={gender}>{gender}</option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>

              <div className="onboarding-grid two">
                <label>
                  Home city
                  <div className="select-wrap">
                    <select value={draft.city} onChange={(event) => update("city", event.target.value)}>
                      {cityOptions.map((city) => (
                        <option key={`${city.name}-${city.country}`} value={city.name}>
                          {city.name}, {city.country}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={17} />
                  </div>
                </label>
                <label>
                  Area or neighbourhood
                  <input
                    value={draft.area}
                    maxLength={80}
                    onChange={(event) => update("area", event.target.value)}
                    placeholder="e.g. Hackney"
                  />
                </label>
              </div>

              <label>
                What do you do? <small className="label-note">Optional</small>
                <input
                  value={draft.occupation}
                  maxLength={80}
                  onChange={(event) => update("occupation", event.target.value)}
                  placeholder="Documentary producer, teacher, night-shift baker…"
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="onboarding-step">
              <span className="eyebrow dark">Step two</span>
              <h2>Your face, your words.</h2>
              <p>A photo that looks like you and a bio that sounds like you beat a perfect pitch.</p>

              <label className="onboarding-label">Photos</label>
              <PhotoUploader photos={draft.photos} onChange={(photos) => update("photos", photos)} />

              <label>
                About you
                <textarea
                  rows={6}
                  maxLength={500}
                  value={draft.bio}
                  onChange={(event) => update("bio", event.target.value)}
                  placeholder="What are you like when you are not trying to impress anyone? What makes you lose track of time?"
                />
                <small className="character-count">
                  {draft.bio.length}/500 · at least 20 characters
                </small>
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onboarding-step">
              <span className="eyebrow dark">Step three</span>
              <h2>What moves you?</h2>
              <p>These shape your matches and give people a way in.</p>

              <div className="filter-label">
                <label>Your interests</label>
                <small>{draft.interests.length}/6 · choose at least 3</small>
              </div>
              <div className="filter-interests profile-interest-picker">
                {INTERESTS.map((interest) => (
                  <button
                    type="button"
                    key={interest}
                    className={draft.interests.includes(interest) ? "selected" : ""}
                    onClick={() => toggleInterest(interest)}
                  >
                    {draft.interests.includes(interest) ? <Check size={13} /> : <Sparkles size={12} />}
                    {interest}
                  </button>
                ))}
              </div>

              <label>
                Here for
                <div className="select-wrap">
                  <select
                    value={draft.lookingFor}
                    onChange={(event) => update("lookingFor", event.target.value)}
                  >
                    {INTENTIONS.filter((intention) => intention !== "Any intention").map((intention) => (
                      <option key={intention}>{intention}</option>
                    ))}
                  </select>
                  <ChevronDown size={17} />
                </div>
              </label>

              <div className="onboarding-grid two">
                <label>
                  Pick a prompt
                  <div className="select-wrap">
                    <select
                      value={draft.promptQuestion}
                      onChange={(event) => update("promptQuestion", event.target.value)}
                    >
                      {PROMPTS.map((prompt) => (
                        <option key={prompt}>{prompt}</option>
                      ))}
                    </select>
                    <ChevronDown size={17} />
                  </div>
                </label>
                <label>
                  The perfect slow Sunday <small className="label-note">Optional</small>
                  <input
                    value={draft.idealSunday}
                    maxLength={400}
                    onChange={(event) => update("idealSunday", event.target.value)}
                    placeholder="Coffee, a long walk, cooking something ambitious…"
                  />
                </label>
              </div>

              <label>
                Your answer
                <textarea
                  rows={4}
                  maxLength={300}
                  value={draft.promptAnswer}
                  onChange={(event) => update("promptAnswer", event.target.value)}
                  placeholder="Say something specific enough that the right person could reply."
                />
                <small className="character-count">{draft.promptAnswer.length}/300</small>
              </label>
            </div>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}

          <div className="onboarding-actions">
            {step > 0 ? (
              <button className="button button-outline" onClick={() => setStep((current) => current - 1)}>
                <ArrowLeft size={17} /> Back
              </button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <button className="button button-dark" onClick={next}>
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button className="button button-coral button-large" onClick={finish} disabled={busy}>
                {busy ? <LoaderCircle className="spin" size={18} /> : <Heart size={18} fill="currentColor" />}
                Finish my profile
              </button>
            )}
          </div>
        </section>
      </div>
      <Toast message={toast} />
    </main>
  );
}
