(() => {
  "use strict";

  const STORAGE_KEY = "limh.demo.v1";

  const CITIES = [
    { name: "Mymensingh", lat: 24.7471, lng: 90.4203 },
    { name: "Dhaka", lat: 23.8103, lng: 90.4125 },
    { name: "Chattogram", lat: 22.3569, lng: 91.7832 },
    { name: "Sylhet", lat: 24.8949, lng: 91.8687 },
    { name: "London", lat: 51.5072, lng: -0.1276 },
  ];

  const INTERESTS = [
    "Bookshops", "Cooking", "Live music", "Independent cinema",
    "Travel slowly", "Architecture", "Art galleries", "Street food",
    "Hiking", "Film photography", "Gardening", "Theatre",
  ];

  const INTENTIONS = [
    "Long-term relationship",
    "Long-term, open to short",
    "Something casual",
    "Any intention",
  ];

  const PROFILES = [
    {
      id: "maya", name: "Maya", age: 28, city: "London", area: "Hackney",
      occupation: "Architect", distanceCity: true, likesYou: true,
      bio: "I draw buildings for a living and collect rooftop chai spots for fun. Equal parts ambitious and easily distracted by a good bookshop. Looking for someone kind, curious and comfortable with silence.",
      interests: ["Architecture", "Bookshops", "Art galleries", "Travel slowly"],
      promptQuestion: "We will get along if", promptAnswer: "You can spend an hour in a bookshop without checking your phone, and still have something to say over dinner.",
      lookingFor: "Long-term relationship", photo: "img/maya.webp",
    },
    {
      id: "nusrat", name: "Nusrat", age: 27, city: "Dhaka", area: "Dhanmondi",
      occupation: "Architect", likesYou: true,
      bio: "I draw buildings for a living and collect rooftop chai spots for fun. Equal parts ambitious and easily distracted by a good bookshop. Looking for someone kind, curious and comfortable with silence.",
      interests: ["Architecture", "Bookshops", "Art galleries", "Travel slowly"],
      promptQuestion: "We will get along if", promptAnswer: "You can spend an hour in a bookshop without checking your phone, and still have something to say over dinner.",
      lookingFor: "Long-term relationship", photo: "img/nusrat.webp",
    },
    {
      id: "sabbir", name: "Sabbir", age: 31, city: "Mymensingh", area: "Ganginarpar",
      occupation: "University lecturer", likesYou: true,
      bio: "I teach literature, over-water my balcony plants and make a genuinely great cup of tea. Looking for someone thoughtful, silly and willing to take the long way home.",
      interests: ["Bookshops", "Gardening", "Theatre", "Cooking"],
      promptQuestion: "A green flag I look for", promptAnswer: "You return books you borrow, and you remember what someone told you a month ago.",
      lookingFor: "Long-term relationship", photo: "img/sabbir.webp",
    },
    {
      id: "sofia", name: "Sofia", age: 27, city: "London", area: "Peckham",
      occupation: "Chef", likesYou: true,
      bio: "Chef, feeder of friends, terrible at sitting still. I will judge your knife skills gently and share the last slice. Looking for warmth, wit and someone who asks real questions.",
      interests: ["Cooking", "Street food", "Live music", "Travel slowly"],
      promptQuestion: "The quickest way to my heart", promptAnswer: "Bring something you cooked and tell me the story behind it.",
      lookingFor: "Long-term, open to short", photo: "img/sofia.webp",
    },
    {
      id: "arif", name: "Arif", age: 30, city: "Dhaka", area: "Gulshan",
      occupation: "Product designer", likesYou: false,
      bio: "I make apps for a living and terrible playlists for fun. Happiest on a long drive with a thermos of tea and someone who knows when to skip a song. Here for something honest and unhurried.",
      interests: ["Live music", "Street food", "Running", "Independent cinema"],
      promptQuestion: "The quickest way to my heart", promptAnswer: "Send me a song you cannot stop playing, then tell me why it matters to you.",
      lookingFor: "Long-term, open to short", photo: "img/arif.webp",
    },
    {
      id: "tania", name: "Tania", age: 26, city: "Chattogram", area: "Agrabad",
      occupation: "Marine biologist", likesYou: false,
      bio: "I spend too much time looking at tide charts and not enough time replying to messages. Warm, direct and always planning the next train ride. Looking for a person, not a project.",
      interests: ["Hiking", "Travel slowly", "Film photography", "Street food"],
      promptQuestion: "My simple pleasures", promptAnswer: "The first cup of tea, a cold sea wind, and finding a shell worth keeping.",
      lookingFor: "Long-term relationship", photo: "img/tania.webp",
    },
    {
      id: "theo", name: "Theo", age: 31, city: "London", area: "Islington",
      occupation: "Documentary photographer", likesYou: false,
      bio: "I chase quiet stories and good light, then spend too long editing them. Most weekends end with a camera, a flask of tea and no fixed plan. Looking for someone curious and unhurried.",
      interests: ["Film photography", "Independent cinema", "Bookshops", "Travel slowly"],
      promptQuestion: "My simple pleasures", promptAnswer: "The first coffee, a cold sea wind, and a photograph nobody posed for.",
      lookingFor: "Long-term relationship", photo: "img/theo.webp",
    },
    {
      id: "farah", name: "Farah", age: 29, city: "Sylhet", area: "Zindabazar",
      occupation: "Documentary filmmaker", likesYou: false,
      bio: "I chase quiet stories and good light. Most weekends you will find me with a camera, a flask of tea and no fixed plan. Looking for warmth, wit and someone who asks real questions.",
      interests: ["Independent cinema", "Film photography", "Travel slowly", "Live music"],
      promptQuestion: "I will know it is a good date if", promptAnswer: "We forget to take a photo because we were actually there.",
      lookingFor: "Long-term, open to short", photo: "img/farah.webp",
    },
  ];

  const ICONS = {
    heart: '<path d="M12 21s-7.5-4.8-7.5-10.4A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.6C19.5 16.2 12 21 12 21Z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    star: '<path d="M12 3l2.6 5.7 6.2.7-4.6 4.2 1.3 6.1L12 16.8 6.5 19.7l1.3-6.1L3.2 9.4l6.2-.7L12 3Z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    send: '<path d="m4 12 16-8-6 16-2.6-6.4L4 12Z"/>',
    back: '<path d="m15 5-7 7 7 7"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    reset: '<path d="M4 4v6h6"/><path d="M4.5 14a8 8 0 1 0 2-8"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 7.6-8 9-4.6-1.4-8-4.5-8-9V6l8-3Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
  };

  const app = document.getElementById("app");
  const overlayRoot = document.getElementById("overlay-root");
  const toastEl = document.getElementById("toast");

  let toastTimer = null;
  let replyTimers = new Map();

  function icon(name, cls) {
    const filled = name === "heart" || name === "star";
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="' +
      (filled ? "currentColor" : "none") +
      '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || "") + "</svg>";
  }

  function heartMark() {
    return '<svg class="heart-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 35S5 26 5 16a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 10-15 19-15 19Z" fill="#D8FF7A"/></svg>';
  }

  function brand() {
    return '<div class="brand-lockup">' + heartMark() +
      '<div class="brand-text"><span class="brand-name">Love Is My Heart</span>' +
      '<span class="brand-short">L I M H</span></div></div>';
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char]));
  }

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function defaultState() {
    return {
      onboarded: false,
      me: {
        name: "", age: 28, city: "Mymensingh", occupation: "", bio: "",
        interests: [], lookingFor: "Long-term relationship",
      },
      decisions: {},
      matches: [],
      prefs: { minAge: 18, maxAge: 45, maxDistance: 8000, lookingFor: "Any intention" },
      settings: { readReceipts: true, notifications: true },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw) || {};
      const base = defaultState();
      const me = Object.assign(base.me, parsed.me || {});
      if (!Array.isArray(me.interests)) me.interests = [];
      const matches = Array.isArray(parsed.matches)
        ? parsed.matches.filter((match) => match && Array.isArray(match.messages))
        : [];
      return Object.assign(base, parsed, {
        me: me,
        prefs: Object.assign(base.prefs, parsed.prefs || {}),
        settings: Object.assign(base.settings, parsed.settings || {}),
        decisions: parsed.decisions && typeof parsed.decisions === "object" ? parsed.decisions : {},
        matches: matches,
      });
    } catch (error) {
      return defaultState();
    }
  }

  let state = loadState();
  let ui = {
    screen: state.onboarded ? "main" : "welcome",
    tab: "discover",
    step: 1,
    draft: null,
    overlay: null,
    typingMatchId: null,
    chatMenu: false,
    busy: false,
  };
  let lastViewKey = "";

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* storage full */ }
  }

  function profileById(id) {
    return PROFILES.find((profile) => profile.id === id) || null;
  }

  function cityByName(name) {
    return CITIES.find((city) => city.name === name) || CITIES[0];
  }

  function haversine(a, b) {
    const toRad = (value) => (value * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }

  function distanceFor(profile) {
    const from = cityByName(state.me.city);
    const to = cityByName(profile.city);
    return Math.round(haversine(from, to));
  }

  function distanceLabel(profile) {
    if (profile.city === state.me.city) return "Same city";
    const km = distanceFor(profile);
    return km < 1000 ? km + " km away" : (km / 1000).toFixed(1) + "k km away";
  }

  function intentionAligns(a, b) {
    if (!a || !b || a === "Any intention" || b === "Any intention") return true;
    if (a === b) return true;
    const longTerm = ["Long-term relationship", "Long-term, open to short"];
    return longTerm.indexOf(a) !== -1 && longTerm.indexOf(b) !== -1;
  }

  function availableProfiles() {
    const prefs = state.prefs;
    return PROFILES
      .filter((profile) => !state.decisions[profile.id])
      .filter((profile) => profile.age >= prefs.minAge && profile.age <= prefs.maxAge)
      .filter((profile) => distanceFor(profile) <= prefs.maxDistance)
      .filter((profile) => intentionAligns(profile.lookingFor, prefs.lookingFor))
      .sort((a, b) => distanceFor(a) - distanceFor(b));
  }

  function unreadFor(match) {
    return match.messages.filter((message) => message.from === "them" && !message.read).length;
  }

  function totalUnread() {
    return state.matches.reduce((sum, match) => sum + unreadFor(match), 0);
  }

  function initials(name) {
    return (name || "You").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  function timeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return mins + "m";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + "h";
    return Math.floor(hours / 24) + "d";
  }

  function clock(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
  }

  /* ------------------------------------------------------------------ welcome */
  function welcomeScreen() {
    return '<section class="welcome">' +
      '<div><div class="welcome-brand">' + brand() + '</div>' +
      '<h1 class="display welcome-title">Dating, with your whole heart.</h1>' +
      '<p class="welcome-copy">A slower, kinder place to meet people. This demo runs entirely on your phone with eight clearly labelled sample profiles, so every screen works without a server.</p>' +
      '<div class="welcome-actions">' +
      '<button class="btn btn-primary btn-block" data-act="start-demo">Start the demo ' + icon("heart") + '</button>' +
      '<a class="btn btn-outline btn-block" href="limh://server">' + icon("server") + ' Connect to a live server</a>' +
      '</div>' +
      '<p class="welcome-foot">Sample profiles only · no real people are messaged · your answers stay on this device.</p>' +
      '</div>' +
      '<div class="feed-card"><span class="eyebrow">LIMH — Love Is My Heart</span>' +
      '<h3>Less swiping. More something real.</h3>' +
      '<p>Discover people by shared interests, real distance and honest intentions. When you are ready, connect the same app to your own self-hosted community.</p></div>' +
      '</section>';
  }

  /* --------------------------------------------------------------- onboarding */
  function onboardingScreen() {
    const draft = ui.draft || (ui.draft = Object.assign({}, state.me, { interests: state.me.interests.slice() }));
    const step = ui.step;
    const stepBar = '<div class="steps">' + [1, 2, 3].map((number) =>
      '<span class="' + (step >= number ? "on" : "") + '"></span>').join("") + '</div>';
    const backButton = '<div style="margin-top:10px"><button class="btn btn-outline btn-block" data-act="ob-back">Back</button></div>';

    if (step === 1) {
      return '<section class="onboarding">' +
        '<div>' + brand() + '<div class="onboarding-intro"><span class="eyebrow">A little about you</span>' +
        '<h1 class="display">Let us start with the basics.</h1>' +
        '<p>Only your first name, age and city are shown in the demo. This stays on your phone.</p></div>' +
        stepBar +
        '<div class="form-card">' +
        '<label class="field"><span>First name</span><input id="ob-name" autocomplete="given-name" value="' + esc(draft.name) + '" placeholder="e.g. Rafi" /></label>' +
        '<div class="field-row"><label class="field"><span>Age</span><input id="ob-age" type="number" inputmode="numeric" min="18" max="99" value="' + esc(draft.age) + '" /></label>' +
        '<label class="field"><span>City</span><select id="ob-city">' + CITIES.map((city) => '<option' + (city.name === draft.city ? " selected" : "") + '>' + city.name + '</option>').join("") + '</select></label></div>' +
        '<label class="field"><span>What do you do?</span><input id="ob-occupation" value="' + esc(draft.occupation) + '" placeholder="e.g. Product designer" /></label>' +
        '<p class="form-error" id="form-error"></p>' +
        '</div></div>' +
        '<div class="onboarding-foot"><button class="btn btn-primary btn-block" data-act="ob-next">Continue ' + icon("arrow") + '</button>' +
        '<p class="onboarding-note">18+ only · Demo data never leaves this device.</p></div></section>';
    }

    if (step === 2) {
      return '<section class="onboarding">' +
        '<div>' + brand() + '<div class="onboarding-intro"><span class="eyebrow">The part people actually read</span>' +
        '<h1 class="display">Give them something to reply to.</h1>' +
        '<p>A short, specific bio and an honest intention make better first conversations than a list of adjectives.</p></div>' +
        stepBar +
        '<div class="form-card">' +
        '<label class="field"><span>Your bio</span><textarea id="ob-bio" placeholder="What makes a good week for you?">' + esc(draft.bio) + '</textarea></label>' +
        '<label class="field"><span>Looking for</span><select id="ob-looking">' + INTENTIONS.map((intention) => '<option' + (intention === draft.lookingFor ? " selected" : "") + '>' + intention + '</option>').join("") + '</select></label>' +
        '<p class="form-error" id="form-error"></p>' +
        '</div></div>' +
        '<div class="onboarding-foot"><button class="btn btn-primary btn-block" data-act="ob-next-bio">Continue ' + icon("arrow") + '</button>' + backButton +
        '<p class="onboarding-note">You can change all of this later in You.</p></div></section>';
    }

    return '<section class="onboarding">' +
      '<div>' + brand() + '<div class="onboarding-intro"><span class="eyebrow">One last thing</span>' +
      '<h1 class="display">A few things you love.</h1>' +
      '<p>Pick three or more. Shared interests are the quickest way into a real first conversation.</p></div>' +
      stepBar +
      '<div class="form-card">' +
      '<div class="field"><span>Your interests</span><div class="interests">' +
      INTERESTS.map((interest) => '<button type="button" class="chip' + (draft.interests.indexOf(interest) !== -1 ? " on" : "") + '" data-interest="' + esc(interest) + '">' + esc(interest) + '</button>').join("") +
      '</div></div><p class="chip-count" id="chip-count">' + draft.interests.length + ' of 12 chosen</p>' +
      '<p class="form-error" id="form-error"></p></div></div>' +
      '<div class="onboarding-foot"><button class="btn btn-primary btn-block" data-act="ob-finish">Enter the community ' + icon("heart") + '</button>' + backButton +
      '<p class="onboarding-note">Sample profiles only · no real people are messaged.</p></div></section>';
  }

  /* ------------------------------------------------------------------ main shell */
  function header() {
    return '<header class="app-header">' + brand() + '<span class="demo-pill"><i></i> Demo community</span></header>';
  }

  function nav() {
    const unread = totalUnread();
    const item = (id, iconName, label) =>
      '<button class="nav-item' + (ui.tab === id ? " active" : "") + '" data-act="tab" data-tab="' + id + '">' +
      icon(iconName) + '<span>' + label + '</span>' +
      (id === "matches" && unread ? '<span class="badge">' + unread + '</span>' : "") + '</button>';
    return '<nav class="bottom-nav">' + item("discover", "compass", "Discover") + item("matches", "chat", "Matches") + item("profile", "user", "You") + '</nav>';
  }

  function mainScreen() {
    let body = "";
    if (ui.tab === "discover") body = discoverScreen();
    else if (ui.tab === "matches") body = matchesScreen();
    else body = profileScreen();
    return '<main class="screen">' + body + '</main>';
  }

  function discoverScreen() {
    const remaining = availableProfiles();
    const profile = remaining[0];
    const total = PROFILES.length;
    const left = remaining.length;
    const seen = total - left;
    const currentDecisions = Object.values(state.decisions).length;
    let body = '<div class="discover-top"><div><span class="eyebrow">Your daily edit</span>' +
      '<h1 class="display screen-heading">People worth slowing down for.</h1>' +
      '<p class="edit-count">' + (left ? left + " still to meet" : "That is everyone for now") + " · " + currentDecisions + " choices made</p></div>" +
      '<button class="filter-trigger" data-act="sheet" data-sheet="filters">' + icon("filter") + ' Filters</button></div>';

    if (!profile) {
      body += '<div class="empty-card">' + heartMark() +
        '<h2>You have seen this edit.</h2>' +
        '<p>' + (seen >= total ? "Eight sample profiles, eight real decisions. Start over to explore different choices, or connect a live server to meet actual people." : "Nobody fits these filters right now. Widen the age range or distance, then come back.") + '</p>' +
        '<button class="btn btn-primary" data-act="reset-decisions">Start the edit again</button>' +
        '<div style="margin-top:10px"><button class="btn btn-outline" data-act="sheet" data-sheet="filters">Adjust filters</button></div></div>';
      return body;
    }

    body += '<div class="deck" id="deck">' +
      '<article class="profile-card" data-profile-id="' + profile.id + '">' +
      '<img class="card-photo" src="' + profile.photo + '" alt="' + esc(profile.name) + '" draggable="false" />' +
      '<div class="card-shade"></div>' +
      '<div class="card-topline"><span class="aligned-pill">Sample profile</span><span class="aligned-pill">' + esc(profile.lastActive || "Active today") + '</span></div>' +
      '<div class="stamp like">LIKE</div><div class="stamp pass">NOPE</div>' +
      '<div class="card-copy">' +
      '<span class="status-line"><i></i> ' + esc(profile.occupation) + ' · ' + esc(profile.city) + '</span>' +
      '<h2>' + esc(profile.name) + ', ' + profile.age + '</h2>' +
      '<div class="card-meta"><span>' + esc(profile.area) + '</span><span>' + distanceLabel(profile) + '</span></div>' +
      '<p class="card-bio">' + esc(profile.bio) + '</p>' +
      '<div class="card-interests">' + profile.interests.map((interest) => '<span>' + esc(interest) + '</span>').join("") + '</div>' +
      '<div class="card-prompt"><small>' + esc(profile.promptQuestion) + '</small><p>' + esc(profile.promptAnswer) + '</p></div>' +
      '</div></article></div>' +
      '<div class="deck-actions">' +
      '<button class="round-action pass" data-act="decide" data-profile="' + profile.id + '" data-decision="pass" aria-label="Pass">' + icon("x") + '</button>' +
      '<button class="round-action star" data-act="decide" data-profile="' + profile.id + '" data-decision="superlike" aria-label="Super like">' + icon("star") + '</button>' +
      '<button class="round-action like" data-act="decide" data-profile="' + profile.id + '" data-decision="like" aria-label="Like">' + icon("heart") + '</button></div>' +
      '';
    return body;
  }

  function matchesScreen() {
    let body = '<span class="eyebrow">Your connections</span><h1 class="display screen-heading">Say something real.</h1>' +
      '<p class="screen-sub">Matches from this demo community. Replies are written locally from each profile, never by a hidden person.</p>';
    if (!state.matches.length) {
      body += '<div class="empty-card">' + heartMark() + '<h2>No matches yet.</h2>' +
        '<p>When you and a sample profile both say yes, the conversation appears here. Try a like or a super like.</p>' +
        '<button class="btn btn-primary" data-act="tab" data-tab="discover">Meet someone</button></div>';
      return body;
    }
    body += '<div class="match-list">' + state.matches.map((match) => {
      const profile = profileById(match.profileId);
      if (!profile) return "";
      const last = match.messages[match.messages.length - 1];
      const unread = unreadFor(match);
      const preview = !last
        ? "Start your story"
        : last.from === "system"
          ? "New match · say hello"
          : (last.from === "me" ? "You: " : "") + last.text;
      return '<button class="match-item" data-act="open-chat" data-match="' + match.id + '">' +
        '<span class="match-avatar"><img src="' + profile.photo + '" alt="" /><i></i></span>' +
        '<span class="match-copy"><strong>' + esc(profile.name) + (unread ? '<b>' + unread + '</b>' : "") + '</strong>' +
        '<p>' + esc(preview) + '</p></span>' +
        '<span class="match-time">' + (last ? timeAgo(last.at) : "") + '</span></button>';
    }).join("") + '</div>';
    return body;
  }

  function profileScreen() {
    const me = state.me;
    return '<span class="eyebrow">Your space</span><h1 class="display screen-heading">This is you.</h1>' +
      '<div class="own-card"><div class="own-photo">' + (me.photo
        ? '<img class="own-photo-img" src="' + esc(me.photo) + '" alt="Your profile photo" />'
        : '<span class="initials">' + esc(initials(me.name)) + '</span>') +
      '<span class="sample-pill own-badge">Your profile · demo</span></div>' +
      '<div class="own-copy"><h2>' + esc(me.name || "You") + ', ' + me.age + '</h2>' +
      '<p>' + (me.occupation ? esc(me.occupation) + " · " : "") + esc(me.city) + '</p>' +
      '<p style="margin-top:8px">' + esc(me.bio || "Add a short bio so people have something to reply to.") + '</p>' +
      '<div class="card-interests" style="margin-top:12px">' + me.interests.map((interest) => '<span style="border-color:var(--line);color:var(--ink)">' + esc(interest) + '</span>').join("") + '</div>' +
      '<div class="own-stats"><span><strong>' + state.matches.length + '</strong>' + (state.matches.length === 1 ? "Match" : "Matches") + '</span><span><strong>' + Object.values(state.decisions).filter((decision) => decision !== "pass").length + '</strong>Likes sent</span><span><strong>8</strong>People in edit</span></div></div></div>' +
      '<div class="settings-list">' +
      '<button class="setting-row" data-act="sheet" data-sheet="edit">' + icon("edit") + '<span><strong>Edit your profile</strong><small>Name, city, bio and interests</small></span>' + icon("chevron") + '</button>' +
      '<button class="setting-row" data-act="sheet" data-sheet="prefs">' + icon("settings") + '<span><strong>Your preferences</strong><small>Age, distance and intention</small></span>' + icon("chevron") + '</button>' +
      '<button class="setting-row" data-act="sheet" data-sheet="privacy">' + icon("shield") + '<span><strong>Privacy &amp; permissions</strong><small>Exactly what this app can access</small></span>' + icon("chevron") + '</button>' +
      '<div class="setting-row">' + icon("chat") + '<span><strong>Read receipts</strong><small>Show when you have read a message</small></span><button class="toggle' + (state.settings.readReceipts ? " on" : "") + '" data-act="toggle" data-key="readReceipts" aria-label="Read receipts"><i></i></button></div>' +
      '<div class="setting-row">' + icon("bell") + '<span><strong>Notifications</strong><small>Quiet updates inside the demo</small></span><button class="toggle' + (state.settings.notifications ? " on" : "") + '" data-act="toggle" data-key="notifications" aria-label="Notifications"><i></i></button></div>' +
      '<a class="setting-row" href="limh://server">' + icon("server") + '<span><strong>Connect a live server</strong><small>Meet real people on your own deployment</small></span>' + icon("chevron") + '</a>' +
      '<button class="setting-row danger" data-act="reset-demo">' + icon("reset") + '<span><strong>Reset this demo</strong><small>Clear profiles, matches and messages</small></span></button>' +
      '</div>' +
      '<p class="demo-note"><strong>Offline demo.</strong> This community is generated on your phone. Sample profiles are labelled, and their replies are composed locally from their own prompts. To meet real people, deploy the server in the README and connect it above.</p>';
  }

  function screenHTML() {
    if (ui.screen === "welcome") return welcomeScreen();
    if (ui.screen === "onboarding") return onboardingScreen();
    return mainScreen();
  }

  function render() {
    const main = ui.screen === "main";
    const viewKey = ui.screen + "|" + (main ? ui.tab : "") + "|" + (ui.screen === "onboarding" ? ui.step : "");
    app.innerHTML = '<div class="app-frame">' + (main ? header() : "") + screenHTML() + (main ? nav() : "") + '</div>';
    if (viewKey !== lastViewKey) {
      lastViewKey = viewKey;
      window.scrollTo(0, 0);
    }
    if (main && ui.tab === "discover") bindSwipe();
  }

  /* ------------------------------------------------------------------ overlays */
  function matchOverlay(match) {
    const profile = profileById(match.profileId);
    if (!profile) return "";
    return '<div class="match-modal"><img class="match-photo" src="' + profile.photo + '" alt="" />' +
      '<span class="eyebrow">A mutual yes</span><h1>It is a match.</h1>' +
      '<p>You and ' + esc(profile.name) + ' liked each other. Start with something specific from their profile.</p>' +
      '<div class="match-actions"><button class="btn btn-lime" data-act="open-chat" data-match="' + match.id + '">Say hello to ' + esc(profile.name) + '</button>' +
      '<button class="btn btn-outline" data-act="close-overlay" style="color:var(--paper);border-color:rgba(245,239,228,0.35)">Keep browsing</button></div></div>';
  }

  function chatOverlay(match) {
    const profile = profileById(match.profileId);
    if (!profile) return "";
    const typing = ui.typingMatchId === match.id;
    const messages = match.messages.map((message) => {
      if (message.from === "system") return '<div class="system-message"><span>' + esc(message.text) + '</span></div>';
      return '<div class="msg ' + (message.from === "me" ? "me" : "them") + '">' + esc(message.text) +
        '<span class="msg-time">' + clock(message.at) + (message.from === "me" && state.settings.readReceipts ? " · Read" : "") + '</span></div>';
    }).join("");
    return '<section class="chat-screen"><header class="chat-header">' +
      '<button class="chat-back" data-act="close-overlay" aria-label="Back">' + icon("back") + '</button>' +
      '<button class="chat-person" data-act="close-overlay"><img src="' + profile.photo + '" alt="" /><span><strong>' + esc(profile.name) + '</strong><small>Sample profile · ' + esc(profile.area) + '</small></span></button>' +
      '<button class="chat-more" data-act="chat-menu" aria-label="Conversation options">' + icon("more") + '</button></header>' +
      '<div class="chat-scroll"><div class="chat-origin"><img src="' + profile.photo + '" alt="" /><h3>You and ' + esc(profile.name) + ' found each other.</h3><p>' + sharedCopy(profile) + '</p></div>' +
      messages + (typing ? '<div class="typing"><i></i><i></i><i></i></div>' : "") +
      (match.messages.some((message) => message.from === "them") ? "" : starters(profile)) + '</div>' +
      '<form class="chat-composer" data-act="send-form"><textarea id="chat-input" rows="1" maxlength="1000" placeholder="Message ' + esc(profile.name) + '…" aria-label="Message"></textarea>' +
      '<button type="submit" aria-label="Send">' + icon("send") + '</button></form>' +
      (ui.chatMenu ? '<div class="chat-menu" data-chat-menu-backdrop><div class="chat-menu-card">' +
        '<span class="eyebrow">Conversation</span><h2>Message ' + esc(profile.name) + '</h2>' +
        '<p>This is a sample profile. Unmatching removes the conversation and the match from this demo.</p>' +
        '<button class="btn btn-outline danger-outline" data-act="unmatch">Unmatch ' + esc(profile.name) + '</button>' +
        '<button class="btn btn-primary" data-act="close-chat-menu">Keep chatting</button>' +
        '</div></div>' : "") + '</section>';
  }

  function starters(profile) {
    const lines = [
      "Hey " + profile.name + "! How is your week going?",
      "What does a perfect Saturday look like for you?",
      profile.interests[0] + " — what got you into it?",
    ];
    return '<div class="chat-starters"><span class="eyebrow">A first line, if you want one</span>' +
      '<p>These sample profiles reply from their own prompts, on this phone.</p>' +
      lines.map((line) => '<button class="starter" data-act="starter" data-text="' + esc(line) + '">' + esc(line) + '</button>').join("") +
      '</div>';
  }

  function sharedCopy(profile) {
    const shared = profile.interests.filter((interest) => state.me.interests.indexOf(interest) !== -1);
    return shared.length ? "You both have " + shared.slice(0, 2).join(" and ").toLowerCase() + " on your wavelength." : "A shared intention brought you together. The rest is yours to discover.";
  }

  function privacySheet() {
    const row = (title, stateText, detail, tone) => '<div class="permission-row"><div class="permission-mark ' + (tone || "off") + '">' + icon(tone === "on" ? "check" : "x") + '</div>' +
      '<div><strong>' + title + '</strong><small>' + detail + '</small></div><span class="permission-state ' + (tone || "off") + '">' + stateText + '</span></div>';
    return sheetShell("Privacy &amp; permissions.", "This app asks only for what a feature actually uses.",
      '<div class="permission-list">' +
      row("Internet", "Required", "Loads the bundled demo, or the server address you choose.", "on") +
      row("Photos", "On demand", "The system picker opens only when you tap Choose. The app never scans your gallery.", "on") +
      row("Notifications", "Not requested", "The demo has no push or background notifications.", "off") +
      row("Camera", "Not requested", "There is no in-app camera; the system picker can still use one if you choose.", "off") +
      row("Microphone", "Not requested", "Voice notes are not built.", "off") +
      row("Contacts, location, phone, SMS, call logs, calendar", "Not requested", "No feature needs them, so they are not in the manifest.", "off") +
      '</div>' +
      '<p class="demo-note">Android Settings lists every permission an app declares, even ones it never asks for. A smaller list is safer and is what Google Play expects. If a future feature needs one of these, it should be added together with the feature and a clear in-app explanation.</p>',
      '<div class="sheet-actions"><button class="btn btn-primary" data-act="close-overlay">Got it</button></div>');
  }

  function sheetOverlay(name) {
    if (name === "filters") return filtersSheet();
    if (name === "edit") return editSheet();
    if (name === "prefs") return prefsSheet();
    if (name === "privacy") return privacySheet();
    return "";
  }

  function sheetShell(title, lead, inner, actions) {
    return '<div class="overlay" data-overlay-backdrop><div class="sheet"><div class="sheet-grab"></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><div><h2>' + title + '</h2><p class="lead">' + lead + '</p></div>' +
      '<button class="chat-back" data-act="close-overlay" aria-label="Close">' + icon("x") + '</button></div>' + inner + actions + '</div></div>';
  }

  function filtersSheet() {
    const prefs = state.prefs;
    return sheetShell("Your filters.", "These decide who appears in your daily edit.",
      '<div class="field-row"><label class="field"><span>Minimum age</span><input id="f-min" type="number" min="18" max="90" value="' + prefs.minAge + '" /></label>' +
      '<label class="field"><span>Maximum age</span><input id="f-max" type="number" min="18" max="90" value="' + prefs.maxAge + '" /></label></div>' +
      '<label class="field"><span>Maximum distance</span><select id="f-distance">' +
      [50, 150, 500, 2000, 8000].map((value) => '<option value="' + value + '"' + (prefs.maxDistance === value ? " selected" : "") + '>' + (value === 8000 ? "Anywhere" : value + " km") + '</option>').join("") + '</select></label>' +
      '<label class="field"><span>Intention</span><select id="f-looking">' + INTENTIONS.map((intention) => '<option' + (intention === prefs.lookingFor ? " selected" : "") + '>' + intention + '</option>').join("") + '</select></label>' +
      '<p class="form-error" id="sheet-error"></p>',
      '<div class="sheet-actions"><button class="btn btn-outline" data-act="close-overlay">Cancel</button><button class="btn btn-primary" data-act="save-filters">Apply filters</button></div>');
  }

  function prefsSheet() {
    const prefs = state.prefs;
    return sheetShell("Your preferences.", "The same controls, in your profile.",
      '<div class="field-row"><label class="field"><span>Minimum age</span><input id="p-min" type="number" min="18" max="90" value="' + prefs.minAge + '" /></label>' +
      '<label class="field"><span>Maximum age</span><input id="p-max" type="number" min="18" max="90" value="' + prefs.maxAge + '" /></label></div>' +
      '<label class="field"><span>Maximum distance</span><select id="p-distance">' +
      [50, 150, 500, 2000, 8000].map((value) => '<option value="' + value + '"' + (prefs.maxDistance === value ? " selected" : "") + '>' + (value === 8000 ? "Anywhere" : value + " km") + '</option>').join("") + '</select></label>' +
      '<label class="field"><span>Intention</span><select id="p-looking">' + INTENTIONS.map((intention) => '<option' + (intention === prefs.lookingFor ? " selected" : "") + '>' + intention + '</option>').join("") + '</select></label>' +
      '<p class="form-error" id="sheet-error"></p>',
      '<div class="sheet-actions"><button class="btn btn-outline" data-act="close-overlay">Cancel</button><button class="btn btn-primary" data-act="save-prefs">Save preferences</button></div>');
  }

  function editSheet() {
    const me = state.me;
    return sheetShell("Edit your profile.", "A specific bio gives people something to reply to.",
      '<div class="photo-edit"><div class="photo-edit-thumb">' + (me.photo
        ? '<img src="' + esc(me.photo) + '" alt="" />'
        : esc(initials(me.name))) + '</div>' +
      '<div class="photo-edit-copy"><strong>Profile photo</strong><small>Choose from the system picker. It stays on this phone.</small></div>' +
      '<button type="button" class="btn btn-outline btn-compact" data-act="change-photo">Choose</button></div>' +
      '<input id="photo-input" type="file" accept="image/*" hidden />' +
      '<label class="field"><span>First name</span><input id="e-name" value="' + esc(me.name) + '" /></label>' +
      '<div class="field-row"><label class="field"><span>Age</span><input id="e-age" type="number" min="18" max="99" value="' + me.age + '" /></label>' +
      '<label class="field"><span>City</span><select id="e-city">' + CITIES.map((city) => '<option' + (city.name === me.city ? " selected" : "") + '>' + city.name + '</option>').join("") + '</select></label></div>' +
      '<label class="field"><span>What do you do?</span><input id="e-occupation" value="' + esc(me.occupation) + '" /></label>' +
      '<label class="field"><span>Your bio</span><textarea id="e-bio">' + esc(me.bio) + '</textarea></label>' +
      '<div class="field"><span>Interests</span><div class="interests">' +
      INTERESTS.map((interest) => '<button type="button" class="chip' + (me.interests.indexOf(interest) !== -1 ? " on" : "") + '" data-edit-interest="' + esc(interest) + '">' + esc(interest) + '</button>').join("") + '</div></div>' +
      '<p class="form-error" id="sheet-error"></p>',
      '<div class="sheet-actions"><button class="btn btn-outline" data-act="close-overlay">Cancel</button><button class="btn btn-primary" data-act="save-profile">Save profile</button></div>');
  }

  function renderOverlay() {
    if (!ui.overlay) {
      overlayRoot.innerHTML = "";
      return;
    }
    const type = ui.overlay.type;
    if (type === "match") {
      const match = state.matches.find((item) => item.id === ui.overlay.id);
      overlayRoot.innerHTML = match ? matchOverlay(match) : "";
    } else if (type === "chat") {
      const match = state.matches.find((item) => item.id === ui.overlay.id);
      overlayRoot.innerHTML = match ? chatOverlay(match) : "";
      const scroll = overlayRoot.querySelector(".chat-scroll");
      if (scroll) requestAnimationFrame(() => { scroll.scrollTop = scroll.scrollHeight; });
    } else if (type === "sheet") {
      overlayRoot.innerHTML = sheetOverlay(ui.overlay.id);
    }
  }

  function renderAll() {
    render();
    renderOverlay();
  }

  function openOverlay(type, id) {
    const had = Boolean(ui.overlay);
    ui.overlay = { type: type, id: id };
    ui.chatMenu = false;
    if (had) history.replaceState({ limhOverlay: true, type: type, id: id }, "");
    else history.pushState({ limhOverlay: true, type: type, id: id }, "");
    renderAll();
  }

  function replaceOverlay(type, id) {
    ui.overlay = { type: type, id: id };
    ui.chatMenu = false;
    if (history.state && history.state.limhOverlay) history.replaceState({ limhOverlay: true, type: type, id: id }, "");
    else history.pushState({ limhOverlay: true, type: type, id: id }, "");
    renderAll();
  }

  function closeOverlay() {
    ui.chatMenu = false;
    if (history.state && history.state.limhOverlay) {
      history.back();
    } else {
      ui.overlay = null;
      renderAll();
    }
  }

  window.addEventListener("popstate", () => {
    ui.chatMenu = false;
    if (ui.overlay) {
      ui.overlay = null;
      renderAll();
    }
  });

  /* ------------------------------------------------------------------ interactions */
  function readValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function setError(id, message) {
    const el = document.getElementById(id || "form-error");
    if (el) el.textContent = message;
  }

  function startDemo() {
    ui.screen = "onboarding";
    ui.step = 1;
    ui.draft = Object.assign({}, state.me, { interests: state.me.interests.slice() });
    render();
  }

  function obNext() {
    const name = readValue("ob-name");
    const age = Number(readValue("ob-age"));
    const city = readValue("ob-city");
    const occupation = readValue("ob-occupation");
    if (name.length < 2) return setError("form-error", "Add the name you want people to see.");
    if (!Number.isFinite(age) || age < 18 || age > 99) return setError("form-error", "You must be 18 or older to use the demo.");
    ui.draft = Object.assign(ui.draft || {}, { name: name, age: age, city: city, occupation: occupation });
    ui.step = 2;
    render();
  }

  function obNextBio() {
    const bio = readValue("ob-bio");
    const lookingFor = readValue("ob-looking");
    if (bio.length < 20) return setError("form-error", "Write at least a couple of sentences about yourself.");
    ui.draft = Object.assign(ui.draft || {}, { bio: bio, lookingFor: lookingFor });
    ui.step = 3;
    render();
  }

  function obBack() {
    if (document.getElementById("ob-bio")) {
      ui.draft = Object.assign(ui.draft || {}, {
        bio: readValue("ob-bio"), lookingFor: readValue("ob-looking"),
      });
    }
    ui.step = Math.max(1, ui.step - 1);
    render();
  }

  function obFinish() {
    const bio = (ui.draft && ui.draft.bio) || "";
    const lookingFor = (ui.draft && ui.draft.lookingFor) || "Long-term relationship";
    const interests = (ui.draft && ui.draft.interests) || [];
    if (bio.length < 20) return setError("form-error", "Write at least a couple of sentences about yourself.");
    if (interests.length < 3) return setError("form-error", "Choose at least three interests.");
    state.me = Object.assign({}, ui.draft, { bio: bio, lookingFor: lookingFor, interests: interests });
    state.onboarded = true;
    save();
    ui.screen = "main";
    ui.tab = "discover";
    ui.draft = null;
    render();
  }

  function decide(profileId, decision) {
    if (ui.busy) return;
    ui.busy = true;
    const card = document.querySelector('.profile-card[data-profile-id="' + profileId + '"]');
    if (card) {
      card.classList.add("leaving");
      card.style.transform = decision === "pass" ? "translateX(-120%) rotate(-10deg)" : "translateX(120%) rotate(10deg)";
    }
    setTimeout(() => {
      const profile = profileById(profileId);
      if (!profile) { ui.busy = false; return; }
      state.decisions[profileId] = decision;
      let match = null;
      if (decision !== "pass" && (decision === "superlike" || profile.likesYou || Math.random() < 0.45)) {
        const existing = state.matches.find((item) => item.profileId === profile.id);
        if (existing) {
          match = existing;
        } else {
          match = {
            id: "m_" + profile.id,
            profileId: profile.id,
            at: Date.now(),
            messages: [{
              id: uid(), from: "system", read: true, at: Date.now(),
              text: "You and " + profile.name + " liked each other. Start with something specific from their profile.",
            }],
          };
          state.matches.unshift(match);
        }
      }
      save();
      ui.busy = false;
      render();
      if (match) openOverlay("match", match.id);
      else showToast(decision === "pass" ? "Passed for now." : "Like sent.");
    }, card ? 220 : 0);
  }

  function bindSwipe() {
    const card = document.querySelector(".profile-card[data-profile-id]");
    if (!card) return;
    let startX = 0, startY = 0, dx = 0, dy = 0, dragging = false;
    const stampLike = card.querySelector(".stamp.like");
    const stampPass = card.querySelector(".stamp.pass");
    card.addEventListener("pointerdown", (event) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      card.setPointerCapture(event.pointerId);
    });
    card.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      dx = event.clientX - startX;
      dy = event.clientY - startY;
      card.style.transition = "none";
      card.style.transform = "translate(" + dx + "px," + dy * 0.25 + "px) rotate(" + dx / 22 + "deg)";
      if (stampLike) stampLike.style.opacity = dx > 20 ? Math.min(1, dx / 100) : 0;
      if (stampPass) stampPass.style.opacity = dx < -20 ? Math.min(1, -dx / 100) : 0;
    });
    card.addEventListener("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      card.style.transition = "";
      if (Math.abs(dx) > 80) {
        decide(card.dataset.profileId, dx > 0 ? "like" : "pass");
      } else {
        card.style.transform = "";
        if (stampLike) stampLike.style.opacity = 0;
        if (stampPass) stampPass.style.opacity = 0;
      }
      dx = 0; dy = 0;
    });
    card.addEventListener("pointercancel", () => {
      dragging = false;
      card.style.transform = "";
      if (stampLike) stampLike.style.opacity = 0;
      if (stampPass) stampPass.style.opacity = 0;
    });
  }

  function openChat(matchId) {
    const match = state.matches.find((item) => item.id === matchId);
    if (!match) return;
    match.messages.forEach((message) => { if (message.from === "them") message.read = true; });
    save();
    if (ui.overlay) replaceOverlay("chat", matchId);
    else openOverlay("chat", matchId);
  }

  function sendMessage() {
    if (!ui.overlay || ui.overlay.type !== "chat") return;
    const input = document.getElementById("chat-input");
    const text = input ? input.value.trim() : "";
    if (!text) return;
    const match = state.matches.find((item) => item.id === ui.overlay.id);
    if (!match) return;
    match.messages.push({ id: uid(), from: "me", text: text.slice(0, 1000), at: Date.now(), read: true });
    save();
    renderOverlay();
    scheduleReply(match.id, text);
  }

  function scheduleReply(matchId, sentText) {
    if (replyTimers.has(matchId)) return;
    ui.typingMatchId = matchId;
    renderOverlay();
    const delay = 2600 + Math.random() * 2600;
    const timer = setTimeout(() => {
      replyTimers.delete(matchId);
      const match = state.matches.find((item) => item.id === matchId);
      if (!match) { ui.typingMatchId = null; renderOverlay(); return; }
      const profile = profileById(match.profileId);
      if (!profile) return;
      match.messages.push({
        id: uid(), from: "them", at: Date.now(),
        read: Boolean(ui.overlay && ui.overlay.type === "chat" && ui.overlay.id === matchId),
        text: replyFor(profile, sentText),
      });
      ui.typingMatchId = null;
      save();
      if (ui.overlay && ui.overlay.type === "chat" && ui.overlay.id === matchId) renderOverlay();
      else { render(); showToast("New message from " + profile.name); }
    }, delay);
    replyTimers.set(matchId, timer);
  }

  const GREETINGS = {
    maya: "Hey! I was just making tea and avoiding my inbox. How has your week been?",
    nusrat: "Hi! Just back from a site visit. How is your day going?",
    sabbir: "Hello! I am between lectures and a very serious cup of tea. How are you?",
    sofia: "Hey! Just finished service and I still smell of garlic. How was your day?",
    arif: "Hey! Good timing — I was avoiding a playlist decision. How is your week?",
    tania: "Hi! Just back from the water. How is your week going?",
    theo: "Hey — just off a shoot and editing too many photos. How was your day?",
    farah: "Hello! Editing footage and drinking cold tea. How is your week?",
  };

  function replyFor(profile, sentText) {
    const text = String(sentText || "").toLowerCase();
    const opener = profile.promptAnswer.split(/(?<=[.!?])\s+/)[0];
    if (/^(hi|hey|hello|salam|assalam|good (morning|afternoon|evening))\b/.test(text)) {
      return GREETINGS[profile.id] || "Hey! Good to hear from you. How is your week going?";
    }
    const shared = profile.interests.find((interest) => text.indexOf(interest.toLowerCase()) !== -1);
    if (shared) {
      return "Yes — " + shared.toLowerCase() + " is very much my thing. " + opener;
    }
    if (text.indexOf("?") !== -1) {
      return "Good question. " + opener + " What about you?";
    }
    if (/love|lovely|beautiful|kind|nice/.test(text)) {
      return "That is kind of you to say. " + opener;
    }
    return "I like that. " + opener + " What about you?";
  }

  function saveFilters() {
    const minAge = Number(readValue("f-min"));
    const maxAge = Number(readValue("f-max"));
    const maxDistance = Number(readValue("f-distance"));
    if (!Number.isFinite(minAge) || !Number.isFinite(maxAge) || minAge < 18 || maxAge > 90 || minAge > maxAge) {
      return setError("sheet-error", "Choose an age range between 18 and 90.");
    }
    state.prefs = { minAge: minAge, maxAge: maxAge, maxDistance: maxDistance, lookingFor: readValue("f-looking") || "Any intention" };
    save();
    closeOverlay();
    showToast("Filters updated.");
  }

  function savePrefs() {
    const minAge = Number(readValue("p-min"));
    const maxAge = Number(readValue("p-max"));
    if (!Number.isFinite(minAge) || !Number.isFinite(maxAge) || minAge < 18 || maxAge > 90 || minAge > maxAge) {
      return setError("sheet-error", "Choose an age range between 18 and 90.");
    }
    state.prefs = { minAge: minAge, maxAge: maxAge, maxDistance: Number(readValue("p-distance")), lookingFor: readValue("p-looking") || "Any intention" };
    save();
    closeOverlay();
    showToast("Preferences saved.");
  }

  function saveProfile() {
    const name = readValue("e-name");
    const age = Number(readValue("e-age"));
    const bio = readValue("e-bio");
    const interests = Array.from(document.querySelectorAll("[data-edit-interest].on")).map((el) => el.getAttribute("data-edit-interest"));
    if (name.length < 2) return setError("sheet-error", "Add a name.");
    if (!Number.isFinite(age) || age < 18) return setError("sheet-error", "You must be 18 or older.");
    if (bio.length < 20) return setError("sheet-error", "Write at least a couple of sentences.");
    if (interests.length < 3) return setError("sheet-error", "Choose at least three interests.");
    state.me = Object.assign({}, state.me, {
      name: name, age: age, city: readValue("e-city"), occupation: readValue("e-occupation"),
      bio: bio, interests: interests,
    });
    save();
    closeOverlay();
    render();
    showToast("Profile saved.");
  }

  function resetDecisions() {
    state.decisions = {};
    save();
    render();
    showToast("A fresh edit.");
  }

  function resetDemo() {
    if (!confirm("Reset the demo? This clears your profile, matches and messages on this phone.")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    ui = { screen: "welcome", tab: "discover", step: 1, draft: null, overlay: null, typingMatchId: null, chatMenu: false, busy: false };
    history.replaceState(null, "");
    renderAll();
  }

  function toggleSetting(key) {
    state.settings[key] = !state.settings[key];
    save();
    render();
  }

  function unmatch() {
    if (!ui.overlay || ui.overlay.type !== "chat") return;
    const match = state.matches.find((item) => item.id === ui.overlay.id);
    if (!match) return;
    const profile = profileById(match.profileId);
    if (!confirm("Unmatch " + (profile ? profile.name : "this person") + "? The conversation will be removed from this demo.")) return;
    state.matches = state.matches.filter((item) => item.id !== match.id);
    save();
    ui.overlay = null;
    ui.chatMenu = false;
    history.replaceState(null, "");
    renderAll();
    showToast("Unmatched.");
  }

  document.addEventListener("change", (event) => {
    if (event.target.id !== "photo-input") return;
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    event.target.value = "";
    if (!file.type || file.type.indexOf("image/") !== 0) {
      setError("sheet-error", "Choose an image file.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const max = 512;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      state.me.photo = canvas.toDataURL("image/jpeg", 0.85);
      save();
      render();
      const thumb = document.querySelector(".photo-edit-thumb");
      if (thumb) thumb.innerHTML = '<img src="' + esc(state.me.photo) + '" alt="" />';
      showToast("Photo updated.");
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      setError("sheet-error", "That image could not be read. Try another one.");
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });

  document.addEventListener("click", (event) => {
    const chatMenuBackdrop = event.target.closest("[data-chat-menu-backdrop]");
    if (chatMenuBackdrop && event.target === chatMenuBackdrop) { ui.chatMenu = false; renderOverlay(); return; }

    const backdrop = event.target.closest("[data-overlay-backdrop]");
    if (backdrop && event.target === backdrop) { closeOverlay(); return; }

    const chip = event.target.closest("[data-interest]");
    if (chip) {
      const interest = chip.getAttribute("data-interest");
      const list = (ui.draft && ui.draft.interests) || [];
      const index = list.indexOf(interest);
      if (index === -1) list.push(interest); else list.splice(index, 1);
      if (ui.draft) ui.draft.interests = list;
      chip.classList.toggle("on");
      const count = document.getElementById("chip-count");
      if (count) count.textContent = list.length + " of 12 chosen";
      return;
    }

    const editChip = event.target.closest("[data-edit-interest]");
    if (editChip) { editChip.classList.toggle("on"); return; }

    const target = event.target.closest("[data-act]");
    if (!target) return;
    const act = target.getAttribute("data-act");

    if (act === "start-demo") startDemo();
    else if (act === "ob-next") obNext();
    else if (act === "ob-next-bio") obNextBio();
    else if (act === "ob-back") obBack();
    else if (act === "ob-finish") obFinish();
    else if (act === "tab") { ui.tab = target.getAttribute("data-tab"); render(); }
    else if (act === "decide") decide(target.getAttribute("data-profile"), target.getAttribute("data-decision"));
    else if (act === "open-chat") openChat(target.getAttribute("data-match"));
    else if (act === "close-overlay") closeOverlay();
    else if (act === "sheet") openOverlay("sheet", target.getAttribute("data-sheet"));
    else if (act === "change-photo") {
      const input = document.getElementById("photo-input");
      if (input) input.click();
    }
    else if (act === "save-filters") saveFilters();
    else if (act === "save-prefs") savePrefs();
    else if (act === "save-profile") saveProfile();
    else if (act === "reset-decisions") resetDecisions();
    else if (act === "reset-demo") resetDemo();
    else if (act === "toggle") toggleSetting(target.getAttribute("data-key"));
    else if (act === "starter") {
      const input = document.getElementById("chat-input");
      if (input) { input.value = target.getAttribute("data-text"); input.focus(); }
    }
    else if (act === "chat-menu") { ui.chatMenu = true; renderOverlay(); }
    else if (act === "close-chat-menu") { ui.chatMenu = false; renderOverlay(); }
    else if (act === "unmatch") unmatch();
  });

  document.addEventListener("submit", (event) => {
    if (event.target.matches('[data-act="send-form"]')) {
      event.preventDefault();
      sendMessage();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && event.target && event.target.id === "chat-input") {
      event.preventDefault();
      sendMessage();
    }
  });

  render();
})();
