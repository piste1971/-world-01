"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "landing" | "register" | "candidate" | "mission" | "case";
type MissionPhase =
  | "request"
  | "incoming"
  | "audio-ready"
  | "audio-playing"
  | "audio-complete"
  | "custody"
  | "routing"
  | "delivered"
  | "witness";
type Language = "en" | "it";

type AgentProfile = {
  id: string;
  nickname: string;
  email: string;
  country: string;
  city: string;
  languages: string;
  skills: string[];
  fieldAvailable: boolean;
};

const SKILLS = [
  "Logic",
  "Research",
  "Field",
  "Tech",
  "Visual",
  "Social",
  "Languages",
  "Navigation",
];

const waveform = [
  22, 38, 62, 35, 78, 48, 91, 41, 69, 96, 52, 75, 34, 83, 56, 88, 45,
  64, 31, 73, 42, 86, 51, 79, 28, 61, 39, 82, 49, 67, 25, 76, 43, 89, 53,
  71, 37, 81, 46, 63, 29, 74, 40, 87, 50, 68, 33, 58,
];

function makeAgentId() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [lang, setLang] = useState<Language>("en");
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [phase, setPhase] = useState<MissionPhase>("request");
  const [emailOpen, setEmailOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState<"idle" | "wrong" | "right">(
    "idle",
  );
  const [form, setForm] = useState({
    nickname: "",
    email: "",
    country: "",
    city: "",
    languages: "",
    skills: [] as string[],
    fieldAvailable: false,
  });

  const t = (english: string, italian: string) =>
    lang === "it" ? italian : english;
  const destination = profile?.city?.toUpperCase() || "FLORENCE";

  useEffect(() => {
    const saved = window.localStorage.getItem("world01_candidate");
    if (saved) {
      try {
        const restored = JSON.parse(saved) as AgentProfile;
        const frame = window.requestAnimationFrame(() => setProfile(restored));
        return () => window.cancelAnimationFrame(frame);
      } catch {
        window.localStorage.removeItem("world01_candidate");
      }
    }
  }, []);

  useEffect(() => {
    const timings: Partial<Record<MissionPhase, [MissionPhase, number]>> = {
      request: ["incoming", 2200],
      incoming: ["audio-ready", 4200],
      "audio-playing": ["audio-complete", 6500],
      "audio-complete": ["custody", 2200],
      custody: ["routing", 3300],
      routing: ["delivered", 2800],
    };
    const transition = timings[phase];
    if (!transition || view !== "mission") return;
    const timer = window.setTimeout(() => setPhase(transition[0]), transition[1]);
    return () => window.clearTimeout(timer);
  }, [phase, view]);

  const track = (event: string) => {
    const current = JSON.parse(
      window.localStorage.getItem("world01_events") || "[]",
    ) as Array<{ event: string; time: string }>;
    current.push({ event, time: new Date().toISOString() });
    window.localStorage.setItem(
      "world01_events",
      JSON.stringify(current.slice(-100)),
    );
  };

  const toggleSkill = (skill: string) => {
    setForm((current) => {
      const selected = current.skills.includes(skill);
      if (!selected && current.skills.length >= 3) return current;
      return {
        ...current,
        skills: selected
          ? current.skills.filter((item) => item !== skill)
          : [...current.skills, skill],
      };
    });
  };

  const register = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.skills.length === 0) return;
    const next: AgentProfile = {
      ...form,
      id: makeAgentId(),
      nickname: form.nickname.trim(),
      email: form.email.trim(),
      country: form.country.trim(),
      city: form.city.trim(),
      languages: form.languages.trim(),
    };
    window.localStorage.setItem("world01_candidate", JSON.stringify(next));
    setProfile(next);
    track("candidate_created");
    setView("candidate");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startMission = () => {
    setPhase("request");
    setView("mission");
    track("mission_000_started");
    window.scrollTo({ top: 0 });
  };

  const openAgentEntry = () => {
    setView(profile ? "candidate" : "register");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openLanding = () => {
    setView("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const playRelay = () => {
    setPhase("audio-playing");
    track("relay_audio_played");
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const relay = new SpeechSynthesisUtterance(
        "Northbound platform. The next train terminates at High Barnet.",
      );
      relay.lang = "en-GB";
      relay.rate = 0.78;
      relay.pitch = 0.82;
      relay.volume = 0.68;
      window.speechSynthesis.speak(relay);
    }
  };

  const receiveEmail = () => {
    setEmailOpen(false);
    setPhase("witness");
    track("relay_email_opened");
  };

  const verifyOrigin = () => {
    if (answer === "london") {
      setAnswerState("right");
      track("case_000a_verified");
      return;
    }
    setAnswerState("wrong");
    track("case_000a_rejected");
  };

  const resetPrototype = () => {
    window.localStorage.removeItem("world01_candidate");
    window.localStorage.removeItem("world01_events");
    window.speechSynthesis?.cancel();
    setProfile(null);
    setView("landing");
    setPhase("request");
    setEmailOpen(false);
    setAnswer("");
    setAnswerState("idle");
    setForm({
      nickname: "",
      email: "",
      country: "",
      city: "",
      languages: "",
      skills: [],
      fieldAvailable: false,
    });
    window.scrollTo({ top: 0 });
  };

  const headerStatus = useMemo(() => {
    if (view === "landing" || view === "register") return "PRIVATE PROTOTYPE";
    if (view === "candidate") return "CANDIDATE NODE";
    return "MISSION CHANNEL 000";
  }, [view]);

  return (
    <main className={`app-shell view-${view}`}>
      <div className="ambient-map" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />

      <header className="site-header">
        <button
          className="wordmark"
          onClick={openLanding}
          aria-label="WORLD//01 home"
        >
          WORLD<span>{"//"}</span>01
        </button>
        <div className="header-status">
          <i /> {headerStatus}
        </div>
        <div className="language-switch" aria-label="Language">
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
          <span>/</span>
          <button className={lang === "it" ? "active" : ""} onClick={() => setLang("it")}>IT</button>
        </div>
      </header>

      {view === "landing" && (
        <Landing
          t={t}
          hasCandidate={Boolean(profile)}
          onJoin={openAgentEntry}
        />
      )}

      {view === "register" && (
        <section className="registration-screen page-frame">
          <div className="section-index">AGENT INTAKE / 00</div>
          <div className="registration-grid">
            <div className="registration-intro">
              <p className="eyebrow">{t("FOUNDING WAVE", "ONDATA FONDATRICE")}</p>
              <h1>{t("Your city is a capability.", "La tua città è una capacità.")}</h1>
              <p>
                {t(
                  "We do not need your precise address. We need to know what you can verify, where you can operate and how you collaborate.",
                  "Non ci serve il tuo indirizzo preciso. Dobbiamo sapere cosa puoi verificare, dove puoi operare e come collabori.",
                )}
              </p>
              <div className="privacy-note">
                <span>PRIVACY PROTOCOL</span>
                {t(
                  "Only the information entered here is used in this prototype. Agent IDs are random and non-sequential.",
                  "In questo prototipo vengono usati soltanto i dati inseriti qui. Gli Agent ID sono casuali e non sequenziali.",
                )}
              </div>
            </div>

            <form className="agent-form" onSubmit={register}>
              <label>
                <span>{t("Nickname", "Nickname")}</span>
                <input required maxLength={24} value={form.nickname} onChange={(e) => setForm((current) => ({ ...current, nickname: e.target.value }))} placeholder="NORTHSTAR" />
              </label>
              <label>
                <span>Email</span>
                <input required type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} placeholder="agent@example.com" />
              </label>
              <div className="form-row">
                <label>
                  <span>{t("Country", "Paese")}</span>
                  <input required value={form.country} onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))} placeholder={t("Italy", "Italia")} />
                </label>
                <label>
                  <span>{t("City", "Città")}</span>
                  <input required value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} placeholder="Florence" />
                </label>
              </div>
              <label>
                <span>{t("Languages", "Lingue")}</span>
                <input required value={form.languages} onChange={(e) => setForm((current) => ({ ...current, languages: e.target.value }))} placeholder={t("Italian, English", "Italiano, inglese")} />
              </label>

              <fieldset>
                <legend>{t("Select up to three skills", "Seleziona fino a tre competenze")}</legend>
                <div className="skill-grid">
                  {SKILLS.map((skill) => (
                    <button
                      type="button"
                      key={skill}
                      className={form.skills.includes(skill) ? "selected" : ""}
                      aria-pressed={form.skills.includes(skill)}
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <small>{form.skills.length}/3</small>
              </fieldset>

              <label className="field-consent">
                <input
                  type="checkbox"
                  checked={form.fieldAvailable}
                  onChange={(e) => setForm((current) => ({ ...current, fieldAvailable: e.target.checked }))}
                />
                <span>
                  <strong>{t("Available for optional Field Missions", "Disponibile per missioni Field facoltative")}</strong>
                  {t(
                    "Public and safe locations only. No exact address requested.",
                    "Soltanto luoghi pubblici e sicuri. Nessun indirizzo preciso richiesto.",
                  )}
                </span>
              </label>

              <button className="primary-button full" type="submit" disabled={form.skills.length === 0}>
                {t("GENERATE AGENT ID", "GENERA AGENT ID")}
              </button>
            </form>
          </div>
        </section>
      )}

      {view === "candidate" && profile && (
        <CandidateCard profile={profile} t={t} onBegin={startMission} />
      )}

      {view === "mission" && profile && (
        <MissionConsole
          phase={phase}
          profile={profile}
          destination={destination}
          lang={lang}
          onPlay={playRelay}
          onOpenEmail={() => setEmailOpen(true)}
          onOpenCase={() => {
            setView("case");
            track("case_000a_opened");
          }}
        />
      )}

      {view === "case" && profile && (
        <CaseZeroA
          lang={lang}
          profile={profile}
          answer={answer}
          answerState={answerState}
          onAnswer={(value) => {
            setAnswer(value);
            setAnswerState("idle");
          }}
          onVerify={verifyOrigin}
        />
      )}

      {emailOpen && profile && (
        <EmailOverlay
          email={profile.email}
          lang={lang}
          onClose={() => setEmailOpen(false)}
          onReceive={receiveEmail}
        />
      )}

      <footer className="site-footer">
        <span>WORLD//01 / THE WORLD IS THE ROOM</span>
        <span>{t("FICTIONAL GAME EXPERIENCE", "ESPERIENZA DI GIOCO NARRATIVA")}</span>
        {profile && <button onClick={resetPrototype}>{t("Reset prototype", "Azzera prototipo")}</button>}
      </footer>
    </main>
  );
}

function Landing({
  t,
  hasCandidate,
  onJoin,
}: {
  t: (en: string, it: string) => string;
  hasCandidate: boolean;
  onJoin: () => void;
}) {
  return (
    <>
      <section className="hero page-frame">
        <div className="hero-copy">
          <p className="eyebrow">MERIDIAN RELAY / PUBLIC CHANNEL 01</p>
          <h1>
            {t("WE NEED PEOPLE", "CERCHIAMO PERSONE")}
            <br />
            <span>{t("IN EVERY CITY.", "IN OGNI CITTÀ.")}</span>
          </h1>
          <p className="hero-declaration">
            {t("NOT PLAYERS. AGENTS.", "NON GIOCATORI. AGENTI.")}
          </p>
          <p className="hero-body">
            {t(
              "WORLD//01 is building a global network of people able to verify information across distance. Some missions happen online. Others need someone already in the right city.",
              "WORLD//01 sta costruendo una rete globale di persone capaci di verificare informazioni oltre le distanze. Alcune missioni si svolgono online. Altre richiedono qualcuno che si trovi già nella città giusta.",
            )}
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onJoin}>
              {hasCandidate ? t("RETURN TO AGENT FILE", "TORNA AL DOSSIER AGENT") : t("BECOME AN AGENT", "DIVENTA UN AGENT")}
            </button>
            <span>MISSION 000 / FREE ACCESS</span>
          </div>
        </div>

        <div className="hero-network" aria-label="WORLD//01 network illustration">
          <div className="network-card">
            <div className="network-card-head">
              <span>NETWORK STATUS</span>
              <b>PRIVATE PROTOTYPE</b>
            </div>
            <svg viewBox="0 0 800 440" role="img" aria-label="Relay route between cities">
              <path className="continent ghost-a" d="M42 187 C112 95 208 76 302 132 C365 170 426 154 470 112" />
              <path className="continent ghost-b" d="M437 133 C525 78 669 98 754 183 C704 247 613 273 547 242 C497 218 468 245 420 285" />
              <path className="relay-line" d="M633 180 Q455 72 286 202" />
              <circle className="node source" cx="633" cy="180" r="6" />
              <circle className="node-ring source-ring" cx="633" cy="180" r="17" />
              <circle className="node target" cx="286" cy="202" r="6" />
              <circle className="node-ring target-ring" cx="286" cy="202" r="17" />
              <text x="650" y="173">TOKYO</text>
              <text x="207" y="232">FLORENCE</text>
            </svg>
            <div className="network-card-foot">
              <span>PUBLIC COUNTERS DISABLED</span>
              <span>NO SIMULATED AGENTS</span>
            </div>
          </div>
        </div>
      </section>

      <section className="principle page-frame">
        <p className="section-index">CORE PROTOCOL / 01</p>
        <blockquote>
          “{t(
            "You do not need to be in the right place. You need to find someone who is.",
            "Non devi trovarti nel posto giusto. Devi riuscire a trovare qualcuno che lo sia.",
          )}”
        </blockquote>
      </section>

      <section className="protocol page-frame">
        <div className="section-heading">
          <p className="section-index">RELAY SEQUENCE / 02</p>
          <h2>{t("The recruitment is the mission.", "Il reclutamento è la missione.")}</h2>
        </div>
        <div className="protocol-grid">
          {[
            ["01", t("A geographic need appears", "Compare una necessità geografica")],
            ["02", t("The team finds a local person", "La squadra trova una persona sul posto")],
            ["03", t("A safe Field Mission is completed", "Viene completata una missione Field sicura")],
            ["04", t("The new connection advances everyone", "La nuova connessione fa avanzare tutti")],
          ].map(([number, label]) => (
            <article key={number}>
              <span>{number}</span>
              <div className="protocol-line" />
              <p>{label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="modes page-frame">
        <article>
          <p className="eyebrow">REMOTE OPERATIONS</p>
          <h3>{t("Play from anywhere.", "Gioca da qualsiasi luogo.")}</h3>
          <p>{t("Research, maps, documents, audio, images and other Agents become your instruments.", "Ricerche, mappe, documenti, audio, immagini e altri Agent diventano i tuoi strumenti.")}</p>
        </article>
        <article>
          <p className="eyebrow">FIELD OPERATIONS</p>
          <h3>{t("Your city may be needed.", "La tua città potrebbe essere necessaria.")}</h3>
          <p>{t("Short optional missions in safe public places. No restricted access, danger or simulated emergency.", "Brevi missioni facoltative in luoghi pubblici e sicuri. Nessun accesso vietato, pericolo o finta emergenza.")}</p>
        </article>
      </section>

      <section className="final-cta page-frame">
        <p className="eyebrow">MISSION 000 / FREE ACCESS</p>
        <h2>{t("Your city is not a location. It is a node.", "La tua città non è soltanto un luogo. È un nodo.")}</h2>
        <button className="primary-button" onClick={onJoin}>
          {hasCandidate ? t("RETURN TO AGENT FILE", "TORNA AL DOSSIER AGENT") : t("BECOME AN AGENT", "DIVENTA UN AGENT")}
        </button>
      </section>
    </>
  );
}

function CandidateCard({ profile, t, onBegin }: { profile: AgentProfile; t: (en: string, it: string) => string; onBegin: () => void }) {
  return (
    <section className="candidate-screen page-frame">
      <div className="agent-dossier">
        <div className="dossier-top"><span>WORLD//01 / CANDIDATE RECORD</span><span>NON-SEQUENTIAL ID</span></div>
        <div className="agent-number">AGENT #{profile.id}</div>
        <div className="candidate-status"><i /> STATUS: CANDIDATE</div>
        <div className="dossier-data">
          <div><small>CALLSIGN</small><strong>{profile.nickname.toUpperCase()}</strong></div>
          <div><small>NODE</small><strong>{profile.city.toUpperCase()} / {profile.country.toUpperCase()}</strong></div>
          <div><small>LANGUAGES</small><strong>{profile.languages.toUpperCase()}</strong></div>
          <div><small>FIELD STATUS</small><strong>{profile.fieldAvailable ? "AVAILABLE" : "REMOTE ONLY"}</strong></div>
        </div>
        <div className="skill-strip">{profile.skills.map((skill) => <span key={skill}>{skill.toUpperCase()}</span>)}</div>
        <div className="mission-brief">
          <div><span>MISSION</span><strong>000 / FIRST CONTACT</strong></div>
          <div><span>ESTIMATED TIME</span><strong>15–20 MINUTES</strong></div>
          <div><span>CHANNELS</span><strong>BROWSER / EMAIL / AUDIO</strong></div>
        </div>
        <p className="candidate-copy">{t("Mission 000 will test how you observe, verify and connect information. It will not request access to your contacts or precise location.", "Mission 000 verificherà come osservi, controlli e colleghi le informazioni. Non richiederà accesso ai tuoi contatti o alla posizione precisa.")}</p>
        <button className="primary-button full" onClick={onBegin}>BEGIN MISSION 000</button>
      </div>
    </section>
  );
}

function MissionConsole({ phase, profile, destination, lang, onPlay, onOpenEmail, onOpenCase }: { phase: MissionPhase; profile: AgentProfile; destination: string; lang: Language; onPlay: () => void; onOpenEmail: () => void; onOpenCase: () => void }) {
  const translation = (it: string) => lang === "it" ? <small className="system-translation">{it}</small> : null;
  const showRoute = phase !== "request";
  return (
    <section className="mission-screen">
      <div className="mission-frame">
        <div className="mission-topline"><span>AGENT #{profile.id}</span><span>MERIDIAN RELAY / MISSION 000</span></div>
        <div className={`mission-map ${showRoute ? "visible" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 1000 500">
            <path className="mission-route" d="M825 222 Q628 68 486 205" />
            <circle className="mission-node source" cx="825" cy="222" r="7" />
            <circle className="mission-node target" cx="486" cy="205" r="7" />
            <text x="845" y="215">TOKYO</text><text x="397" y="238">{destination}</text>
          </svg>
        </div>
        <div className={`mission-content phase-${phase}`} aria-live="polite">
          {phase === "request" && <div className="center-status"><p>MISSION 000</p><h1>ENTRY REQUEST RECEIVED</h1>{translation("Richiesta di accesso ricevuta")}<div className="status-pair"><span>AGENT<br /><b>#{profile.id}</b></span><span>STATUS<br /><b>CANDIDATE</b></span></div><div className="waiting-dot" /></div>}
          {phase === "incoming" && <div className="relay-panel left-panel"><p className="relay-alert">INCOMING RELAY DETECTED</p>{translation("Relay in arrivo rilevato")}<dl><div><dt>SOURCE</dt><dd>CANDIDATE #003921</dd></div><div><dt>LOCATION</dt><dd>TOKYO</dd></div><div><dt>DESTINATION</dt><dd>{destination}</dd></div><div><dt>RECORDED</dt><dd>03H 17M AGO</dd></div><div><dt>PACKET INTEGRITY</dt><dd className="accent">100%</dd></div></dl></div>}
          {(phase === "audio-ready" || phase === "audio-playing") && <div className="audio-panel relay-panel"><div className="panel-heading"><span>AUDIO FRAGMENT 1/2</span><small>SOURCE / CANDIDATE #003921 / TOKYO</small></div><div className={`waveform ${phase === "audio-playing" ? "playing" : ""}`}>{waveform.map((height, index) => <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 35}ms` }} />)}</div><div className="audio-time"><span>{phase === "audio-playing" ? "00:05" : "00:00"}</span><span>00:07</span></div>{phase === "audio-ready" ? <button className="primary-button compact" onClick={onPlay}>PLAY RELAY</button> : <p className="playback-label">PLAYBACK IN PROGRESS</p>}</div>}
          {phase === "audio-complete" && <div className="relay-panel center-panel"><p className="relay-alert">PLAYBACK COMPLETE</p><h2>VERIFYING RELAY ORIGIN</h2>{translation("Verifica dell’origine del relay")}<div className="thin-rule" /><p>CANDIDATE #003921 / TOKYO</p><small>SIGNATURE MATCH FOUND</small></div>}
          {phase === "custody" && <div className="relay-panel center-panel custody-panel"><p className="relay-alert">RELAY RECEIVED</p><h2>CHAIN OF CUSTODY TRANSFERRED</h2>{translation("Custodia del relay trasferita")}<div className="transfer-grid"><span><small>FROM</small>CANDIDATE #003921 / TOKYO</span><span><small>TO</small>AGENT #{profile.id} / {destination}</span></div><p className="transfer-complete">TRANSFER COMPLETE</p></div>}
          {phase === "routing" && <div className="relay-panel center-panel"><p className="relay-alert">SECOND FRAGMENT</p><h2>ROUTING TO REGISTERED CHANNEL</h2>{translation("Invio al canale registrato")}<p>{profile.email.replace(/^(.{2}).*(@.*)$/, "$1••••$2").toUpperCase()}</p><div className="thin-rule" /><small>DELIVERY PENDING</small></div>}
          {phase === "delivered" && <div className="delivery-layout"><div className="relay-panel delivery-panel"><p className="relay-alert">SECOND FRAGMENT ROUTED</p><h2>DELIVERY CONFIRMED</h2>{translation("Consegna confermata")}<div className="transfer-grid"><span><small>CHANNEL</small>REGISTERED EMAIL</span><span><small>PAYLOAD</small>FRAGMENT 2 OF 2</span></div><button className="primary-button compact" onClick={onOpenEmail}>OPEN RELAY EMAIL</button></div><button className="email-notification" onClick={onOpenEmail}><small>NEW MESSAGE</small><strong>MERIDIAN RELAY</strong><span>FRAGMENT 2 OF 2</span></button></div>}
          {phase === "witness" && <div className="relay-panel center-panel witness-panel"><p className="relay-alert">RELAY STATUS</p><h2>SOURCE VERIFICATION: INCOMPLETE</h2>{translation("Verifica della fonte incompleta")}<div className="transfer-grid"><span><small>FIRST WITNESS</small>CANDIDATE #003921</span><span><small>SECOND WITNESS</small>PENDING</span></div><p className="witness-line">THIS RECORD CANNOT BE VERIFIED BY ITS SOURCE.</p><strong>YOU ARE THE SECOND WITNESS.</strong>{translation("Tu sei il secondo testimone")}<button className="primary-button compact" onClick={onOpenCase}>OPEN CASE 000-A</button></div>}
        </div>
        <div className="mission-bottomline"><span>THE WORLD IS THE ROOM</span><span>ARCHIVE CHANNEL 00</span></div>
      </div>
    </section>
  );
}

function EmailOverlay({ email, lang, onClose, onReceive }: { email: string; lang: Language; onClose: () => void; onReceive: () => void }) {
  return <div className="overlay" role="dialog" aria-modal="true" aria-label="Relay email"><div className="relay-email"><div className="email-header"><span>MERIDIAN RELAY / SECURE MESSAGE</span><button onClick={onClose} aria-label="Close">×</button></div><div className="email-meta"><div><small>TO</small><strong>{email}</strong></div><div><small>SUBJECT</small><strong>FRAGMENT 2 OF 2 / CASE 000-A</strong></div><div><small>INTEGRITY</small><strong>VERIFIED</strong></div></div><div className="email-body"><p>Agent,</p><p>The relay label identifies the node that transmitted the recording. It does not prove where the recording originated.</p>{lang === "it" && <p className="translated-paragraph">L’etichetta identifica il nodo che ha trasmesso la registrazione. Non dimostra dove la registrazione sia stata effettuata.</p>}<div className="evidence-card"><div className="evidence-top"><span>ACOUSTIC ROUTING CARD</span><span>MRD/000-A</span></div><div className="evidence-grid"><span><small>RELAY NODE</small>TOKYO / UTC+09</span><span><small>VOICE MARKER</small>HIGH BARNET</span><span><small>LATITUDE BAND</small>51.4–51.7 N</span><span><small>LONGITUDE BAND</small>000.3 W–000.1 E</span></div><div className="evidence-wave">{waveform.slice(0, 30).map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div><p>Do not confirm the relay node. Verify the recording origin.</p>{lang === "it" && <p className="translated-paragraph">Non confermare il nodo del relay. Verifica l’origine della registrazione.</p>}</div><button className="primary-button full" onClick={onReceive}>MARK FRAGMENT AS RECEIVED</button></div></div>;
}

function CaseZeroA({ lang, profile, answer, answerState, onAnswer, onVerify }: { lang: Language; profile: AgentProfile; answer: string; answerState: "idle" | "wrong" | "right"; onAnswer: (value: string) => void; onVerify: () => void }) {
  return <section className="case-screen page-frame"><div className="case-heading"><div><p className="eyebrow">MISSION 000 / CASE 000-A</p><h1>VERIFY THE SOURCE</h1>{lang === "it" && <small>Verifica la fonte</small>}</div><span>AGENT #{profile.id}</span></div><div className="case-grid"><div className="case-file"><div className="case-file-head"><span>RELAY RECORD</span><span>CHAIN 01/02</span></div><dl><div><dt>RELAY SOURCE</dt><dd>TOKYO</dd></div><div><dt>RECORDING ORIGIN</dt><dd className="pending">UNCONFIRMED</dd></div><div><dt>VOICE MARKER</dt><dd>HIGH BARNET</dd></div><div><dt>COORDINATE BAND</dt><dd>51.4–51.7 N / 000.3 W–000.1 E</dd></div></dl><div className="case-waveform">{waveform.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><blockquote>“Northbound platform. The next train terminates at High Barnet.”</blockquote></div><div className="verification-form"><p className="section-index">SECOND WITNESS PROTOCOL</p><h2>Where did the recording originate?</h2>{lang === "it" && <p className="translated-paragraph">Da quale città proviene la registrazione?</p>}<p className="case-instruction">Use the voice marker and coordinate band. The city that transmitted the relay may not be the city captured in the recording.</p><div className="answer-grid">{["tokyo", "london", "berlin", "florence"].map((city) => <button key={city} className={answer === city ? "selected" : ""} onClick={() => onAnswer(city)}>{city.toUpperCase()}</button>)}</div><button className="primary-button full" disabled={!answer || answerState === "right"} onClick={onVerify}>VERIFY ORIGIN</button>{answerState === "wrong" && <div className="answer-message error"><strong>VERIFICATION REJECTED</strong><span>Relay node and recording origin are not the same.</span></div>}{answerState === "right" && <div className="answer-message success"><strong>ORIGIN VERIFIED — LONDON</strong><span>SOURCE AND ORIGIN ARE NOT THE SAME.</span>{lang === "it" && <small>La fonte e l’origine non sono la stessa cosa.</small>}<div className="verified-seal">SECOND WITNESS / VERIFIED</div><p>CASE 000-A COMPLETE · NEXT RELAY NOT YET RELEASED</p></div>}</div></div></section>;
}
