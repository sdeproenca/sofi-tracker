import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import LoginScreen from "./LoginScreen";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

// ---- CONSTANTS ----
const MOODS = ["😭", "😞", "😐", "😊", "🤩"];
const MOOD_LABELS = ["Terrible", "Mal", "Normal", "Bien", "Increíble"];
const MOOD_COLORS = ["#E74C3C", "#E88D67", "#BDB6A8", "#6DAF7B", "#3D8B53"];

const CYCLE_PHASES = [
  { id: "menstrual", label: "Menstrual", emoji: "🔴", color: "#D46A6A" },
  { id: "follicular", label: "Folicular", emoji: "🌱", color: "#7FB685" },
  { id: "ovulation", label: "Ovulación", emoji: "🌸", color: "#D4A0C0" },
  { id: "luteal", label: "Lútea", emoji: "🍂", color: "#C6A664" },
];

const WEATHER_TYPES = [
  { id: "sun", emoji: "☀️", label: "Sol" },
  { id: "partlyCloudy", emoji: "⛅", label: "Parcial" },
  { id: "cloudy", emoji: "☁️", label: "Nublado" },
  { id: "rain", emoji: "🌧️", label: "Lluvia" },
  { id: "storm", emoji: "⛈️", label: "Tormenta" },
  { id: "wind", emoji: "💨", label: "Viento" },
];

const WEATHER_TEMPS = [
  { id: "hot", emoji: "🥵", label: "Calor" },
  { id: "normal", emoji: "😊", label: "Normal" },
  { id: "cold", emoji: "🥶", label: "Frío" },
];

const GYM_TYPES = [
  { id: "lifting", label: "Lifting", emoji: "🏋️" },
  { id: "walking", label: "Walking", emoji: "🚶‍♀️" },
  { id: "mma", label: "MMA", emoji: "🥊" },
  { id: "kickboxing", label: "Kickboxing", emoji: "🦶" },
  { id: "lucha", label: "Lucha", emoji: "🤼" },
  { id: "bjj", label: "BJJ", emoji: "🥋" },
];

const DEFAULT_HOUR_CATEGORIES = [
  { id: "jobSearch", label: "Job Search", emoji: "🔍", color: "#5B7FB5", hasNotes: true, notePlaceholder: "Ej: Apliqué a 3 roles..." },
  { id: "portfolio", label: "Portfolio", emoji: "🛠️", color: "#8B6FB5", hasNotes: true, notePlaceholder: "Ej: Avancé automación de notas..." },
  { id: "gym", label: "Gym", emoji: "💪", color: "#B5725B", hasNotes: false },
  { id: "aiCourses", label: "AI Courses", emoji: "🤖", color: "#5BB5A6", hasNotes: true, notePlaceholder: "Ej: Módulo MCP avanzado..." },
  { id: "content", label: "Contenido", emoji: "📱", color: "#B5A05B", hasNotes: true, notePlaceholder: "Ej: Post LinkedIn sobre PM+AI..." },
];

const MORNING_PROMPTS = [
  "Escribí sin filtro durante 10 minutos. No importa qué — dejá que fluya.",
  "¿Qué soñaste anoche? Si no te acordás, ¿qué fue lo primero que pensaste al despertar?",
  "Describí cómo se siente tu cuerpo ahora mismo, de la cabeza a los pies.",
  "Escribile una carta a tu yo de hace un año. ¿Qué le dirías?",
  "¿Qué estás postergando? Escribí sobre eso sin juzgarte.",
  "Si hoy no tuvieras ninguna obligación, ¿qué harías? Describilo en detalle.",
  "¿Qué te da miedo en este momento? Ponele nombre.",
  "Escribí sobre un lugar donde te sentiste completamente en paz.",
  "¿Qué conversación necesitás tener que estás evitando?",
  "Hacé un inventario de lo que ocupa espacio en tu cabeza hoy.",
  "Describí tu día ideal con el máximo detalle sensorial posible.",
  "¿Qué creencia vieja ya no te sirve? ¿Cómo sería soltarla?",
  "Escribí sobre algo que te enoja. Dejá que salga todo.",
  "Si tu estado emocional fuera un paisaje, ¿cómo se vería?",
  "¿Qué aprendiste esta semana que no sabías antes?",
  "Escribí un diálogo entre tu yo ambiciosa y tu yo que necesita descansar.",
  "¿Cuándo fue la última vez que te sorprendiste a vos misma? ¿Qué pasó?",
  "Listá 10 cosas que te hacen reír. No pienses mucho, escribí rápido.",
  "¿Qué parte de tu rutina actual te nutre? ¿Cuál te drena?",
  "Escribí como si narraras una película: describí tu mañana en tercera persona.",
  "¿Qué te gustaría que alguien te dijera hoy?",
  "Pensá en una decisión que tomaste recientemente. ¿Cómo te sentís al respecto?",
  "Escribí sobre algo pequeño que te hizo feliz ayer.",
  "¿Qué significa para vos sentirte 'productiva'? ¿Siempre es lo mismo?",
  "Si pudieras dominar una habilidad de la noche a la mañana, ¿cuál sería y por qué?",
  "Escribí sobre una persona que admirás. ¿Qué cualidades ves en ella?",
  "¿Qué necesitás perdonarte hoy?",
  "Describí tu relación actual con el tiempo. ¿Te alcanza? ¿Te sobra?",
  "Escribí lo primero que se te viene a la mente 20 veces seguidas.",
  "¿Qué versión de vos misma querés ser al final de este mes?",
  "Flujo libre: no pares de escribir durante todo el espacio. Lo que sea. Ya.",
];

const NIGHT_PROMPTS = [
  "Nombá 3 cosas buenas de hoy, por chiquitas que sean.",
  "¿Qué momento de hoy te gustaría revivir?",
  "¿Hubo algo que te costó hoy? ¿Qué harías diferente mañana?",
  "¿A quién le agradecés hoy y por qué?",
  "¿Qué lograste hoy que ayer no existía?",
  "En una palabra: ¿cómo termina este día?",
  "¿Qué fue lo más inesperado que pasó hoy?",
  "¿Dónde pusiste tu energía hoy? ¿Valió la pena?",
  "¿Qué aprendiste hoy sobre vos misma?",
  "Si tuvieras que ponerle título a este día, ¿cuál sería?",
  "¿Cuidaste tu cuerpo hoy? ¿Cómo?",
  "¿Qué dejaste sin hacer? ¿Te pesa o está bien?",
  "Nombá algo que te hizo sonreír hoy.",
  "¿Tuviste un momento de calma hoy? Describilo.",
  "¿Qué querés soltar antes de dormir?",
  "¿Qué te dio energía hoy? ¿Qué te la sacó?",
  "¿Hablaste con alguien que te hizo bien hoy?",
  "Mañana va a ser un buen día si...",
  "¿Qué estás sintiendo ahora mismo, en este instante?",
  "¿Hubo algo que te incomodó hoy? ¿Qué te dice eso?",
  "¿Cumpliste alguna promesa que te hiciste? ¿Cuál?",
  "¿Qué querés recordar de hoy dentro de un año?",
  "Escribí una nota de agradecimiento a tu cuerpo por lo que hizo hoy.",
  "¿Qué te dio miedo hoy? ¿Lo enfrentaste?",
  "¿Tu día fue más hacia construir o hacia descansar? ¿Necesitabas eso?",
  "¿Qué canción describe tu día de hoy?",
  "¿Qué consejo le darías a alguien que tuvo tu mismo día?",
  "¿Hiciste algo hoy solo porque tenías ganas? ¿Qué fue?",
  "Si pudieras cambiar una sola cosa de hoy, ¿cuál sería?",
  "¿De qué estás orgullosa hoy, aunque sea mínimo?",
  "Cerrá los ojos 5 segundos. Ahora escribí lo primero que apareció.",
];

const getPrompt = (date, prompts) => {
  const day = new Date(date + "T12:00:00").getDate();
  return prompts[(day - 1) % prompts.length];
};

// ---- HELPERS ----
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const makeEmptyEntry = (date, categories) => {
  const hours = {};
  const notes = {};
  categories.forEach((c) => { hours[c.id] = 0; if (c.hasNotes) notes[c.id] = ""; });
  return { date, hours, gymTypes: [], notes, mood: null, cyclePhase: null, weatherType: null, weatherTemp: null, morningJournal: "", nightReflection: "", savedAt: null };
};

const formatDateShort = (d) => new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
const formatDateLong = (d) => new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// ---- DEMO DATA ----
const generateDemoData = (categories) => {
  const entries = {};
  const phases = ["menstrual","menstrual","menstrual","menstrual","menstrual","follicular","follicular","follicular","follicular","follicular","follicular","follicular","ovulation","ovulation","ovulation","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal","luteal"];
  const weathers = ["sun","sun","sun","partlyCloudy","partlyCloudy","cloudy","rain","sun","sun","partlyCloudy","sun","sun","cloudy","rain","storm","partlyCloudy","sun","sun","sun","partlyCloudy","cloudy","sun","sun","wind","partlyCloudy","sun","rain","cloudy","sun","sun","partlyCloudy"];
  const temps = ["hot","hot","hot","normal","normal","normal","cold","normal","hot","normal","hot","hot","normal","cold","cold","normal","hot","hot","normal","normal","normal","hot","hot","normal","normal","hot","cold","normal","hot","hot","normal"];
  const gymOpts = ["lifting","walking","mma","kickboxing","lucha","bjj"];
  const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  for (let d = 1; d <= 31; d++) {
    const r = rng(d * 42 + 7);
    const dateStr = `2026-03-${String(d).padStart(2, "0")}`;
    const hours = {};
    const notes = {};
    categories.forEach((c) => {
      if (c.id === "gym") { hours[c.id] = r() > 0.4 ? [0.5, 1, 1.5][Math.floor(r() * 3)] : 0; }
      else { hours[c.id] = [0, 0.5, 1, 1.5, 2][Math.floor(r() * 5)]; }
      if (c.hasNotes && hours[c.id] > 0) notes[c.id] = `Demo: trabajé en ${c.label}`;
    });
    const baseMood = phases[d-1] === "menstrual" ? 1.5 : phases[d-1] === "luteal" ? 2 : phases[d-1] === "ovulation" ? 3.5 : 3;
    const gymBonus = hours.gym > 0 ? 0.7 : 0;
    const weatherMalus = weathers[d-1] === "rain" || weathers[d-1] === "storm" ? -0.5 : weathers[d-1] === "sun" ? 0.3 : 0;
    const mood = Math.max(0, Math.min(4, Math.round(baseMood + gymBonus + weatherMalus + (r() - 0.5))));
    const gymTypes = hours.gym > 0 ? [...new Set([gymOpts[Math.floor(r() * 6)], ...(r() > 0.6 ? [gymOpts[Math.floor(r() * 6)]] : [])])] : [];
    entries[dateStr] = { date: dateStr, hours, gymTypes, notes, mood, cyclePhase: phases[d-1], weatherType: weathers[d-1], weatherTemp: temps[d-1],
      morningJournal: "Demo — " + getPrompt(dateStr, MORNING_PROMPTS).substring(0, 50) + "...",
      nightReflection: "Demo — " + getPrompt(dateStr, NIGHT_PROMPTS).substring(0, 40) + "...",
      savedAt: new Date(2026, 2, d, 22, 30).toISOString(), isDemo: true };
  }
  return entries;
};

// ---- SHARED COMPONENTS ----
function ChipSelector({ options, value, onChange, multi = false }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => {
        const sel = multi ? (value || []).includes(opt.id) : value === opt.id;
        return (
          <button key={opt.id}
            onClick={() => { if (multi) { const arr = value || []; onChange(sel ? arr.filter((x) => x !== opt.id) : [...arr, opt.id]); } else { onChange(sel ? null : opt.id); } }}
            style={{ padding: "6px 14px", borderRadius: 20, border: sel ? `2px solid ${opt.color || "#C67B5C"}` : "2px solid #E8E2D8", background: sel ? `${opt.color || "#C67B5C"}18` : "#fff", cursor: "pointer", fontSize: 14, fontFamily: "'Work Sans', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 16 }}>{opt.emoji}</span>
            <span style={{ color: sel ? "#2D2A26" : "#8A8478", fontWeight: sel ? 500 : 400 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function HourSlider({ category, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{category.emoji}</span>
      <span style={{ width: 90, fontSize: 13, color: "#6B6560", fontFamily: "'Work Sans', sans-serif" }}>{category.label}</span>
      <input type="range" min={0} max={6} step={0.5} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ flex: 1, accentColor: category.color, height: 6 }} />
      <span style={{ width: 40, textAlign: "center", fontSize: 14, fontWeight: 600, color: value > 0 ? "#2D2A26" : "#C4BEB4", fontFamily: "'Work Sans', sans-serif" }}>{value}h</span>
    </div>
  );
}

function MoodSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {MOODS.map((emoji, i) => (
        <button key={i} onClick={() => onChange(value === i ? null : i)}
          style={{ fontSize: value === i ? 36 : 28, background: value === i ? `${MOOD_COLORS[i]}20` : "transparent", border: value === i ? `2px solid ${MOOD_COLORS[i]}` : "2px solid transparent", borderRadius: 14, padding: "8px 10px", cursor: "pointer", transition: "all 0.2s", transform: value === i ? "scale(1.1)" : "scale(1)", opacity: value !== null && value !== i ? 0.4 : 1 }}
          title={MOOD_LABELS[i]}>{emoji}</button>
      ))}
    </div>
  );
}

function Section({ title, children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(45,42,38,0.06)", ...style }}>
      <h3 style={{ margin: "0 0 14px 0", fontSize: 15, fontWeight: 600, color: "#6B6560", fontFamily: "'Work Sans', sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>{title}</h3>
      {children}
    </div>
  );
}

// ---- LOG FORM ----
function LogForm({ entry, setEntry, onSave, existing, categories }) {
  const totalHours = Object.values(entry.hours).reduce((a, b) => a + b, 0);
  const notes = entry.notes || {};
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: "#2D2A26", margin: "0 0 4px 0" }}>{existing ? "Editar" : "Nuevo"} registro</h2>
        <p style={{ color: "#8A8478", fontSize: 14, margin: 0 }}>{formatDateLong(entry.date)}</p>
      </div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <input type="date" value={entry.date} onChange={(e) => setEntry(makeEmptyEntry(e.target.value, categories))} style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, padding: "6px 12px", borderRadius: 8, border: "1px solid #E8E2D8", color: "#2D2A26" }} />
      </div>
      <Section title="¿Cómo estuvo el día?"><MoodSelector value={entry.mood} onChange={(v) => setEntry({ ...entry, mood: v })} /></Section>
      <Section title="Clima">
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, color: "#8A8478", margin: "0 0 6px 0" }}>Cielo</p>
          <ChipSelector options={WEATHER_TYPES} value={entry.weatherType} onChange={(v) => setEntry({ ...entry, weatherType: v })} />
        </div>
        <div>
          <p style={{ fontSize: 12, color: "#8A8478", margin: "0 0 6px 0" }}>Temperatura</p>
          <ChipSelector options={WEATHER_TEMPS} value={entry.weatherTemp} onChange={(v) => setEntry({ ...entry, weatherTemp: v })} />
        </div>
      </Section>
      <Section title={`Horas · ${totalHours}h total`}>
        {categories.map((cat) => (
          <div key={cat.id}>
            <HourSlider category={cat} value={entry.hours[cat.id] || 0} onChange={(v) => setEntry({ ...entry, hours: { ...entry.hours, [cat.id]: v } })} />
            {cat.hasNotes && (entry.hours[cat.id] || 0) > 0 && (
              <div style={{ marginTop: 6, marginBottom: 4, marginLeft: 38 }}>
                <input type="text" value={notes[cat.id] || ""} onChange={(e) => setEntry({ ...entry, notes: { ...notes, [cat.id]: e.target.value } })}
                  placeholder={cat.notePlaceholder || "¿Qué hiciste?"} style={{ width: "100%", border: "1px solid #E8E2D8", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "'Work Sans', sans-serif", color: "#2D2A26", background: "#FDFCFA", boxSizing: "border-box" }} />
              </div>
            )}
            {cat.id === "gym" && (entry.hours.gym || 0) > 0 && (
              <div style={{ marginTop: 8, marginBottom: 4, marginLeft: 38 }}>
                <p style={{ fontSize: 12, color: "#8A8478", margin: "0 0 6px 0" }}>Tipo de entreno</p>
                <ChipSelector options={GYM_TYPES} value={entry.gymTypes || []} multi onChange={(v) => setEntry({ ...entry, gymTypes: v })} />
              </div>
            )}
          </div>
        ))}
      </Section>
      <Section title="Fase del ciclo"><ChipSelector options={CYCLE_PHASES} value={entry.cyclePhase} onChange={(v) => setEntry({ ...entry, cyclePhase: v })} /></Section>
      <Section title="Morning Pages ☀️">
        <p style={{ fontSize: 13, color: "#C67B5C", fontStyle: "italic", fontFamily: "'Fraunces', serif", margin: "0 0 10px 0", lineHeight: 1.5 }}>{getPrompt(entry.date, MORNING_PROMPTS)}</p>
        <textarea value={entry.morningJournal} onChange={(e) => setEntry({ ...entry, morningJournal: e.target.value })} placeholder="Escribí lo que necesites soltar esta mañana..." rows={5}
          style={{ width: "100%", border: "1px solid #E8E2D8", borderRadius: 10, padding: 14, fontSize: 14, fontFamily: "'Work Sans', sans-serif", resize: "vertical", color: "#2D2A26", background: "#FDFCFA", boxSizing: "border-box" }} />
        <div style={{ textAlign: "right", fontSize: 11, color: "#B0A99E", marginTop: 4 }}>{entry.morningJournal.length} caracteres</div>
      </Section>
      <Section title="Reflexión nocturna 🌙">
        <p style={{ fontSize: 13, color: "#8B6FB5", fontStyle: "italic", fontFamily: "'Fraunces', serif", margin: "0 0 10px 0", lineHeight: 1.5 }}>{getPrompt(entry.date, NIGHT_PROMPTS)}</p>
        <textarea value={entry.nightReflection} onChange={(e) => setEntry({ ...entry, nightReflection: e.target.value })} placeholder="¿Qué pasó hoy? ¿Qué salió bien? ¿Qué ajustarías?" rows={4}
          style={{ width: "100%", border: "1px solid #E8E2D8", borderRadius: 10, padding: 14, fontSize: 14, fontFamily: "'Work Sans', sans-serif", resize: "vertical", color: "#2D2A26", background: "#FDFCFA", boxSizing: "border-box" }} />
        <div style={{ textAlign: "right", fontSize: 11, color: "#B0A99E", marginTop: 4 }}>{entry.nightReflection.length} caracteres</div>
      </Section>
      <button onClick={onSave} style={{ width: "100%", padding: "14px 0", background: "#C67B5C", color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 40 }}
        onMouseOver={(e) => (e.target.style.background = "#B06A4D")} onMouseOut={(e) => (e.target.style.background = "#C67B5C")}>
        {existing ? "Actualizar registro" : "Guardar registro"} ✓
      </button>
    </div>
  );
}

// ---- CALENDAR ----
function CalendarView({ entries, onSelectDate }) {
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => setViewDate((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }))} style={calNavBtn}>←</button>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, color: "#2D2A26", margin: 0, textTransform: "capitalize" }}>{monthLabel}</h2>
        <button onClick={() => setViewDate((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }))} style={calNavBtn}>→</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px rgba(45,42,38,0.06)" }}>
        {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#8A8478", padding: "4px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const dateStr = `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const entry = entries[dateStr];
          const isToday = dateStr === today();
          const hasMood = entry?.mood !== null && entry?.mood !== undefined;
          const bg = hasMood ? `${MOOD_COLORS[entry.mood]}30` : isToday ? "#F0EBE3" : "transparent";
          const cycle = entry?.cyclePhase ? CYCLE_PHASES.find((c) => c.id === entry.cyclePhase) : null;
          const weather = entry?.weatherType ? WEATHER_TYPES.find((w) => w.id === entry.weatherType) : null;
          const subEmojis = [cycle?.emoji, weather?.emoji].filter(Boolean).join("");
          return (
            <button key={dateStr} onClick={() => onSelectDate(dateStr)}
              style={{ aspectRatio: "1", border: isToday ? "2px solid #C67B5C" : "2px solid transparent", borderRadius: 10, background: bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 14, color: entry ? "#2D2A26" : "#B0A99E", fontWeight: isToday ? 700 : 400, transition: "transform 0.15s", padding: 2 }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.08)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}>
              <span>{day}</span>
              {subEmojis ? <span style={{ fontSize: 9, lineHeight: 1, marginTop: 1 }}>{subEmojis}</span> : entry && <span style={{ width: 4, height: 4, borderRadius: 2, background: "#C67B5C", marginTop: 2 }} />}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        {MOODS.map((m, i) => (
          <span key={i} style={{ fontSize: 12, color: "#6B6560", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: MOOD_COLORS[i], display: "inline-block" }} />{MOOD_LABELS[i]}
          </span>
        ))}
      </div>
    </div>
  );
}

const calNavBtn = { background: "#fff", border: "1px solid #E8E2D8", borderRadius: 10, width: 40, height: 40, cursor: "pointer", fontSize: 18, color: "#6B6560", display: "flex", alignItems: "center", justifyContent: "center" };

// ---- FICHA ----
function FichaView({ entry, onClose, onEdit, categories }) {
  if (!entry) return null;
  const total = Object.values(entry.hours).reduce((a, b) => a + b, 0);
  const cycle = CYCLE_PHASES.find((c) => c.id === entry.cyclePhase);
  const weather = WEATHER_TYPES.find((w) => w.id === entry.weatherType);
  const temp = WEATHER_TEMPS.find((t) => t.id === entry.weatherTemp);
  const gymArr = (entry.gymTypes || []).map((id) => GYM_TYPES.find((g) => g.id === id)).filter(Boolean);
  const notes = entry.notes || {};

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#C67B5C", fontSize: 14, cursor: "pointer", marginBottom: 12, padding: 0, fontWeight: 500 }}>← Volver</button>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 2px 12px rgba(45,42,38,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          {entry.isDemo && <span style={{ display: "inline-block", background: "#D4A0C020", border: "1px solid #D4A0C0", borderRadius: 12, padding: "2px 10px", fontSize: 11, color: "#D4A0C0", marginBottom: 8, fontWeight: 500 }}>🎭 Demo</span>}
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, color: "#2D2A26", margin: "0 0 4px 0" }}>{formatDateLong(entry.date)}</h2>
          {entry.mood !== null && <div style={{ fontSize: 42, margin: "8px 0" }}>{MOODS[entry.mood]}</div>}
          {entry.mood !== null && <span style={{ fontSize: 14, color: MOOD_COLORS[entry.mood], fontWeight: 600 }}>{MOOD_LABELS[entry.mood]}</span>}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          {[total > 0 && `⏱️ ${total}h`, weather && `${weather.emoji} ${weather.label}`, temp && `${temp.emoji} ${temp.label}`, cycle && `${cycle.emoji} ${cycle.label}`, ...gymArr.map((g) => `${g.emoji} ${g.label}`)].filter(Boolean).map((tag, i) => (
            <span key={i} style={{ background: "#F5F1EB", padding: "5px 12px", borderRadius: 16, fontSize: 13, color: "#4A4540" }}>{tag}</span>
          ))}
        </div>
        {total > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#8A8478", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px 0" }}>Horas</h4>
            <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", gap: 2 }}>
              {categories.filter((c) => (entry.hours[c.id] || 0) > 0).map((c) => (
                <div key={c.id} style={{ width: `${((entry.hours[c.id] || 0) / total) * 100}%`, background: c.color, borderRadius: 4, minWidth: 8 }} />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
              {categories.filter((c) => (entry.hours[c.id] || 0) > 0).map((c) => (
                <div key={c.id} style={{ fontSize: 12, color: "#6B6560" }}>
                  <span style={{ color: c.color, fontWeight: 700 }}>●</span> {c.label}: {entry.hours[c.id]}h
                  {c.hasNotes && notes[c.id] && <span style={{ color: "#8A8478", marginLeft: 6 }}>— {notes[c.id]}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {entry.morningJournal && (<div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 13, fontWeight: 600, color: "#8A8478", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 8px 0" }}>Morning Pages ☀️</h4><p style={{ fontSize: 14, color: "#4A4540", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{entry.morningJournal}</p></div>)}
        {entry.nightReflection && (<div style={{ marginBottom: 16 }}><h4 style={{ fontSize: 13, fontWeight: 600, color: "#8A8478", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 8px 0" }}>Reflexión nocturna 🌙</h4><p style={{ fontSize: 14, color: "#4A4540", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{entry.nightReflection}</p></div>)}
        <button onClick={onEdit} style={{ width: "100%", padding: "10px 0", background: "transparent", color: "#C67B5C", border: "1px solid #C67B5C", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>Editar ✏️</button>
      </div>
    </div>
  );
}

// ---- DASHBOARD ----
function ComparisonBar({ label, avg, count, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
        <span style={{ color: "#4A4540" }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{count > 0 ? `${MOODS[Math.round(avg)]} ${avg.toFixed(1)}` : "—"}</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: "#F0EBE3", overflow: "hidden" }}>
        <div style={{ width: count > 0 ? `${(avg / 4) * 100}%` : "0%", height: "100%", background: color, borderRadius: 5, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: 10, color: "#B0A99E" }}>{count} días</span>
    </div>
  );
}

function MoodStory({ data, onSelectDate, categories }) {
  const W = Math.max(data.length * 28, 400);
  const colW = W / data.length;
  return (
    <div style={{ overflowX: "auto", marginBottom: 8 }}>
      <div style={{ minWidth: W, position: "relative" }}>
        <svg width={W} height={120} style={{ display: "block" }}>
          {[0,1,2,3,4].map((v) => <line key={v} x1={0} y1={100 - v * 22} x2={W} y2={100 - v * 22} stroke="#F0EBE3" strokeWidth={1} />)}
          {[0,2,4].map((v) => <text key={v} x={4} y={100 - v * 22 + 4} fontSize={11} fill="#B0A99E">{MOODS[v]}</text>)}
          {data.length > 1 && (() => {
            const pts = data.map((e, i) => e.mood !== null ? { x: colW * i + colW / 2, y: 100 - e.mood * 22 } : null).filter(Boolean);
            if (pts.length < 2) return null;
            return <path d={pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")} fill="none" stroke="#C67B5C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
          })()}
          {data.map((e, i) => e.mood === null ? null : (
            <g key={i} style={{ cursor: "pointer" }} onClick={() => onSelectDate(e.date)}>
              <circle cx={colW * i + colW / 2} cy={100 - e.mood * 22} r={6} fill={MOOD_COLORS[e.mood]} stroke="#fff" strokeWidth={2} />
            </g>
          ))}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
          <div style={{ display: "flex", height: 14, borderRadius: 4, overflow: "hidden" }}>
            {data.map((e, i) => { const p = e.cyclePhase ? CYCLE_PHASES.find((c) => c.id === e.cyclePhase) : null;
              return <div key={i} onClick={() => onSelectDate(e.date)} style={{ width: colW, background: p ? `${p.color}60` : "#F5F1EB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>{p?.emoji}</div>;
            })}
          </div>
          <div style={{ display: "flex", height: 14, borderRadius: 4, overflow: "hidden" }}>
            {data.map((e, i) => { const w = e.weatherType ? WEATHER_TYPES.find((x) => x.id === e.weatherType) : null;
              return <div key={i} onClick={() => onSelectDate(e.date)} style={{ width: colW, background: "#F5F1EB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8 }}>{w?.emoji}</div>;
            })}
          </div>
          <div style={{ display: "flex", height: 14, borderRadius: 4, overflow: "hidden" }}>
            {data.map((e, i) => (
              <div key={i} onClick={() => onSelectDate(e.date)} style={{ width: colW, background: "#F5F1EB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(e.hours.gym || 0) > 0 && <div style={{ width: 8, height: 8, borderRadius: 4, background: "#B5725B" }} />}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", height: 18, borderRadius: 4, overflow: "hidden", gap: 1 }}>
            {data.map((e, i) => { const total = Object.values(e.hours).reduce((a, b) => a + b, 0);
              return <div key={i} onClick={() => onSelectDate(e.date)} style={{ width: colW, background: "#F5F1EB", cursor: "pointer", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 1px" }}>
                {total > 0 && <div style={{ width: "70%", height: `${Math.min(total / 8, 1) * 100}%`, background: "#5B7FB5", borderRadius: "2px 2px 0 0", minHeight: 2 }} />}
              </div>;
            })}
          </div>
          <div style={{ display: "flex", height: 16 }}>
            {data.map((e, i) => <div key={i} onClick={() => onSelectDate(e.date)} style={{ width: colW, textAlign: "center", fontSize: 8, color: "#B0A99E", cursor: "pointer", lineHeight: "16px" }}>{new Date(e.date + "T12:00:00").getDate()}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ entries, onSelectDate, categories }) {
  const [range, setRange] = useState("month");
  const allDates = useMemo(() => Object.keys(entries).sort(), [entries]);
  const filteredDates = useMemo(() => {
    const now = new Date();
    return allDates.filter((d) => { const dt = new Date(d + "T12:00:00");
      if (range === "week") return (now - dt) / 86400000 >= 0 && (now - dt) / 86400000 < 7;
      if (range === "month") return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
      if (range === "3months") return (now - dt) / 86400000 >= 0 && (now - dt) / 86400000 < 90;
      return true;
    });
  }, [allDates, range]);
  const data = useMemo(() => filteredDates.map((d) => entries[d]), [filteredDates, entries]);

  if (allDates.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, maxWidth: 560, margin: "0 auto" }}>
      <span style={{ fontSize: 48, display: "block", marginBottom: 16 }}>📊</span>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: "#2D2A26", margin: "0 0 8px 0" }}>Sin datos todavía</h2>
    </div>
  );

  const me = data.filter((e) => e.mood !== null);
  const avgMood = me.length > 0 ? me.reduce((a, e) => a + e.mood, 0) / me.length : null;
  const totalHours = data.reduce((a, e) => a + Object.values(e.hours).reduce((x, y) => x + y, 0), 0);
  const gymDays = data.filter((e) => (e.hours.gym || 0) > 0).length;
  const streakDays = (() => { let s = 0; for (const d of [...allDates].sort().reverse()) { if (entries[d].savedAt) s++; else break; } return s; })();
  const avgBy = (fn) => { const f = me.filter(fn); return { avg: f.length > 0 ? Math.round((f.reduce((a, e) => a + e.mood, 0) / f.length) * 100) / 100 : 0, count: f.length }; };

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: "#2D2A26", margin: "0 0 6px 0", textAlign: "center" }}>Dashboard</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 24 }}>
        {[{ id: "week", label: "7 días" }, { id: "month", label: "Este mes" }, { id: "3months", label: "3 meses" }, { id: "all", label: "Todo" }].map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)} style={{ padding: "6px 14px", borderRadius: 18, border: range === r.id ? "2px solid #C67B5C" : "2px solid #E8E2D8", background: range === r.id ? "#C67B5C12" : "#fff", color: range === r.id ? "#C67B5C" : "#8A8478", fontWeight: range === r.id ? 600 : 400, cursor: "pointer", fontSize: 13 }}>{r.label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[{ label: "Mood prom.", value: avgMood !== null ? MOODS[Math.round(avgMood)] : "—", sub: avgMood !== null ? avgMood.toFixed(1) : "" }, { label: "Horas total", value: `${totalHours}h`, sub: `${data.length} días` }, { label: "Días gym", value: gymDays, sub: `de ${data.length}` }, { label: "Racha", value: streakDays, sub: "días" }].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "14px 10px", textAlign: "center", boxShadow: "0 1px 4px rgba(45,42,38,0.06)" }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#8A8478", marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "#B0A99E" }}>{s.sub}</div>
          </div>
        ))}
      </div>
      {data.length > 1 && <Section title="Mood Story"><p style={{ fontSize: 11, color: "#B0A99E", margin: "0 0 10px 0" }}>Línea = mood · debajo: ciclo, clima, gym, horas · click → ficha</p><MoodStory data={data} onSelectDate={onSelectDate} categories={categories} /></Section>}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#6B6560", textTransform: "uppercase", letterSpacing: 1, margin: "24px 0 12px 0" }}>¿Qué impacta tu mood?</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Section title="Gym" style={{ marginBottom: 12 }}>
          <ComparisonBar label="Con gym 💪" {...avgBy((e) => (e.hours.gym || 0) > 0)} color="#6DAF7B" />
          <ComparisonBar label="Sin gym" {...avgBy((e) => (e.hours.gym || 0) === 0)} color="#BDB6A8" />
        </Section>
        <Section title="Fase del ciclo" style={{ marginBottom: 12 }}>
          {CYCLE_PHASES.map((p) => ({ label: `${p.emoji} ${p.label}`, ...avgBy((e) => e.cyclePhase === p.id), color: p.color })).filter((x) => x.count > 0).map((c, i) => <ComparisonBar key={i} {...c} />)}
        </Section>
        <Section title="Clima" style={{ marginBottom: 12 }}>
          {WEATHER_TYPES.map((w) => ({ label: `${w.emoji} ${w.label}`, ...avgBy((e) => e.weatherType === w.id), color: "#6BB3D9" })).filter((x) => x.count > 0).map((w, i) => <ComparisonBar key={i} {...w} />)}
        </Section>
        <Section title="Temperatura" style={{ marginBottom: 12 }}>
          {WEATHER_TEMPS.map((t) => ({ label: `${t.emoji} ${t.label}`, ...avgBy((e) => e.weatherTemp === t.id), color: "#E88D67" })).filter((x) => x.count > 0).map((t, i) => <ComparisonBar key={i} {...t} />)}
        </Section>
      </div>
      {data.length > 0 && (
        <Section title="Horas por categoría">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.map((e) => ({ date: formatDateShort(e.date), ...e.hours }))} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#C4BEB4" />
              <YAxis tick={{ fontSize: 10 }} stroke="#C4BEB4" />
              <Tooltip content={({ active, payload, label }) => (!active || !payload?.length) ? null : (
                <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", fontSize: 12 }}>
                  <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>{label}</p>
                  {payload.map((p, i) => <p key={i} style={{ margin: 0, color: p.color }}>{p.name}: {p.value}h</p>)}
                </div>
              )} />
              {categories.map((c) => <Bar key={c.id} dataKey={c.id} stackId="hours" fill={c.color} name={c.label} radius={[0,0,0,0]} />)}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
            {categories.map((c) => <span key={c.id} style={{ fontSize: 11, color: "#6B6560" }}><span style={{ color: c.color, fontWeight: 700 }}>●</span> {c.label}</span>)}
          </div>
        </Section>
      )}
    </div>
  );
}

// ---- SETTINGS ----
const PRESET_COLORS = ["#5B7FB5", "#8B6FB5", "#B5725B", "#5BB5A6", "#B5A05B", "#D46A6A", "#7FB685", "#D4A0C0", "#C6A664", "#6BB3D9", "#E88D67", "#8BA888"];

function SettingsView({ categories, setCategories }) {
  const [editing, setEditing] = useState(null);
  const [newCat, setNewCat] = useState({ label: "", emoji: "📌", color: "#5B7FB5", hasNotes: true, notePlaceholder: "" });

  const handleAdd = () => {
    if (!newCat.label.trim()) return;
    const id = newCat.label.trim().toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
    setCategories([...categories, { ...newCat, id, label: newCat.label.trim(), notePlaceholder: newCat.notePlaceholder || `Ej: Detalle de ${newCat.label.trim()}...` }]);
    setNewCat({ label: "", emoji: "📌", color: "#5B7FB5", hasNotes: true, notePlaceholder: "" });
  };

  const handleRemove = (id) => { if (categories.length <= 1) return; setCategories(categories.filter((c) => c.id !== id)); };
  const handleUpdate = (id, field, value) => setCategories(categories.map((c) => c.id === id ? { ...c, [field]: value } : c));
  const moveUp = (i) => { if (i === 0) return; const arr = [...categories]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setCategories(arr); };
  const moveDown = (i) => { if (i >= categories.length - 1) return; const arr = [...categories]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setCategories(arr); };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 500, color: "#2D2A26", margin: "0 0 4px 0" }}>Configuración</h2>
        <p style={{ color: "#8A8478", fontSize: 14, margin: 0 }}>Personalizá las categorías de horas</p>
      </div>
      {categories.map((cat, i) => (
        <div key={cat.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 10, boxShadow: "0 1px 4px rgba(45,42,38,0.06)", borderLeft: `4px solid ${cat.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editing === cat.id ? 12 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{cat.emoji}</span>
              <div>
                <span style={{ fontWeight: 600, color: "#2D2A26", fontSize: 15 }}>{cat.label}</span>
                {cat.hasNotes && <span style={{ fontSize: 11, color: "#B0A99E", marginLeft: 8 }}>+ notas</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button onClick={() => moveUp(i)} disabled={i === 0} style={{ ...miniBtn, opacity: i === 0 ? 0.3 : 1 }}>↑</button>
              <button onClick={() => moveDown(i)} disabled={i >= categories.length - 1} style={{ ...miniBtn, opacity: i >= categories.length - 1 ? 0.3 : 1 }}>↓</button>
              <button onClick={() => setEditing(editing === cat.id ? null : cat.id)} style={{ ...miniBtn, color: "#C67B5C" }}>✏️</button>
              <button onClick={() => handleRemove(cat.id)} style={{ ...miniBtn, color: "#E74C3C" }}>✕</button>
            </div>
          </div>
          {editing === cat.id && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: "1px solid #F0EBE3" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={cat.emoji} onChange={(e) => handleUpdate(cat.id, "emoji", e.target.value)} style={settingsInput} placeholder="Emoji" maxLength={4} />
                <input value={cat.label} onChange={(e) => handleUpdate(cat.id, "label", e.target.value)} style={{ ...settingsInput, flex: 1 }} placeholder="Nombre" />
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {PRESET_COLORS.map((c) => (
                  <button key={c} onClick={() => handleUpdate(cat.id, "color", c)} style={{ width: 24, height: 24, borderRadius: 12, background: c, border: cat.color === c ? "2px solid #2D2A26" : "2px solid transparent", cursor: "pointer" }} />
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6B6560", cursor: "pointer" }}>
                <input type="checkbox" checked={cat.hasNotes} onChange={(e) => handleUpdate(cat.id, "hasNotes", e.target.checked)} />
                Activar campo de notas cuando hay horas
              </label>
              {cat.hasNotes && (
                <input value={cat.notePlaceholder || ""} onChange={(e) => handleUpdate(cat.id, "notePlaceholder", e.target.value)} style={settingsInput} placeholder="Placeholder para notas" />
              )}
            </div>
          )}
        </div>
      ))}
      <Section title="Agregar categoría" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={newCat.emoji} onChange={(e) => setNewCat({ ...newCat, emoji: e.target.value })} style={{ ...settingsInput, width: 50, textAlign: "center" }} placeholder="📌" maxLength={4} />
          <input value={newCat.label} onChange={(e) => setNewCat({ ...newCat, label: e.target.value })} style={{ ...settingsInput, flex: 1 }} placeholder="Nombre de la categoría" />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          {PRESET_COLORS.map((c) => (
            <button key={c} onClick={() => setNewCat({ ...newCat, color: c })} style={{ width: 24, height: 24, borderRadius: 12, background: c, border: newCat.color === c ? "2px solid #2D2A26" : "2px solid transparent", cursor: "pointer" }} />
          ))}
        </div>
        <button onClick={handleAdd} disabled={!newCat.label.trim()}
          style={{ width: "100%", padding: "10px 0", background: newCat.label.trim() ? "#C67B5C" : "#E8E2D8", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: newCat.label.trim() ? "pointer" : "default" }}>
          + Agregar categoría
        </button>
      </Section>
    </div>
  );
}

const miniBtn = { background: "none", border: "1px solid #E8E2D8", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6560" };
const settingsInput = { border: "1px solid #E8E2D8", borderRadius: 8, padding: "6px 10px", fontSize: 13, fontFamily: "'Work Sans', sans-serif", color: "#2D2A26", background: "#FDFCFA", boxSizing: "border-box" };

// ---- MAIN APP ----
const smallNavBtn = { background: "#fff", border: "1px solid #E8E2D8", borderRadius: 8, width: 32, height: 32, fontSize: 14, color: "#6B6560", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [view, setView] = useState("log");
  const [entries, setEntries] = useState({});
  const [categories, setCategories] = useState(DEFAULT_HOUR_CATEGORIES);
  const [formEntry, setFormEntry] = useState(makeEmptyEntry(today(), DEFAULT_HOUR_CATEGORIES));
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([{ view: "log", date: null }]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Show login if not authenticated
  if (authLoading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#8A8478" }}>Cargando...</div>;
  if (!user) return <LoginScreen />;

  // ---- FIRESTORE LOAD ----
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      try {
        // Load categories
        const catDoc = await getDoc(doc(db, "users", user.uid, "profile", "categories"));
        if (catDoc.exists()) setCategories(catDoc.data().list);

        // Load entries
        const entriesSnap = await getDocs(collection(db, "users", user.uid, "entries"));
        const loaded = {};
        entriesSnap.forEach((d) => { loaded[d.id] = d.data(); });
        setEntries(loaded);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // ---- FIRESTORE SAVE ENTRY ----
  const persistEntries = useCallback(async (ne) => {
    setEntries(ne);
    if (!user) return;
    // Only save the entries that changed (we save all on bulk ops like demo)
    for (const [date, entry] of Object.entries(ne)) {
      await setDoc(doc(db, "users", user.uid, "entries", date), entry);
    }
  }, [user]);

  // ---- FIRESTORE SAVE CATEGORIES ----
  useEffect(() => {
    if (!user || loading) return;
    setDoc(doc(db, "users", user.uid, "profile", "categories"), { list: categories }).catch(console.error);
  }, [categories, user, loading]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const navigate = useCallback((nv, date = null) => {
    setHistory((p) => [...p.slice(0, historyIdx + 1), { view: nv, date }]);
    setHistoryIdx((i) => i + 1);
    setView(nv); setSelectedDate(date);
  }, [historyIdx]);

  const canGoBack = historyIdx > 0, canGoForward = historyIdx < history.length - 1;
  const goBack = () => { if (!canGoBack) return; const p = history[historyIdx - 1]; setHistoryIdx((i) => i - 1); setView(p.view); setSelectedDate(p.date); if (p.view === "log" && p.date) setFormEntry(entries[p.date] ? { ...entries[p.date] } : makeEmptyEntry(p.date, categories)); };
  const goForward = () => { if (!canGoForward) return; const n = history[historyIdx + 1]; setHistoryIdx((i) => i + 1); setView(n.view); setSelectedDate(n.date); if (n.view === "log" && n.date) setFormEntry(entries[n.date] ? { ...entries[n.date] } : makeEmptyEntry(n.date, categories)); };

  const hasDemoData = Object.values(entries).some((e) => e.isDemo);
  const handleLoadDemo = () => { const demo = generateDemoData(categories); persistEntries({ ...entries, ...demo }); showToast("🎭 Demo cargado"); navigate("calendar"); };
  const handleClearDemo = async () => {
    const clean = {};
    for (const [k, v] of Object.entries(entries)) { if (!v.isDemo) clean[k] = v; }
    setEntries(clean);
    // Delete demo docs from Firestore
    for (const [k, v] of Object.entries(entries)) {
      if (v.isDemo) {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "users", user.uid, "entries", k));
      }
    }
    showToast("🗑️ Demo borrado");
  };

  const handleSave = async () => {
    const e = { ...formEntry, savedAt: new Date().toISOString() };
    delete e.isDemo;
    const newEntries = { ...entries, [e.date]: e };
    setEntries(newEntries);
    await setDoc(doc(db, "users", user.uid, "entries", e.date), e);
    showToast("✓ Guardado");
  };

  const handleSelectDate = (date) => {
    if (entries[date]) { navigate("ficha", date); }
    else { setFormEntry(makeEmptyEntry(date, categories)); navigate("log", date); }
  };

  const handleEditFromFicha = () => {
    if (selectedDate && entries[selectedDate]) { setFormEntry({ ...entries[selectedDate] }); navigate("log", selectedDate); }
  };

  const handleExport = () => {
    const dates = Object.keys(entries).sort(); if (!dates.length) return;
    const catIds = categories.map((c) => c.id);
    const h = ["Fecha", "Mood", "Clima", "Temp", "Ciclo", ...categories.map((c) => `${c.label} (h)`), "Total", "Gym Types", ...categories.filter((c) => c.hasNotes).map((c) => `${c.label} Note`), "Morning", "Night"];
    const rows = dates.map((d) => {
      const e = entries[d]; const n = e.notes || {}; const t = catIds.reduce((a, id) => a + (e.hours[id] || 0), 0);
      return [d, e.mood ?? "", WEATHER_TYPES.find((x) => x.id === e.weatherType)?.label || "", WEATHER_TEMPS.find((x) => x.id === e.weatherTemp)?.label || "", CYCLE_PHASES.find((x) => x.id === e.cyclePhase)?.label || "",
        ...catIds.map((id) => e.hours[id] || 0), t, (e.gymTypes || []).join("+"),
        ...categories.filter((c) => c.hasNotes).map((c) => `"${(n[c.id] || "").replace(/"/g, '""')}"`),
        `"${(e.morningJournal || "").replace(/"/g, '""')}"`, `"${(e.nightReflection || "").replace(/"/g, '""')}"`].join(",");
    });
    const blob = new Blob([[h.join(","), ...rows].join("\n")], { type: "text/csv" });
    const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `sofi_tracker_${today()}.csv`; a.click(); URL.revokeObjectURL(u);
    showToast("📁 CSV exportado");
  };

  useEffect(() => { if (view === "log" && entries[formEntry.date]) setFormEntry({ ...entries[formEntry.date] }); }, [view]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#8A8478" }}>Cargando...</div>;

  const tabs = [{ id: "log", label: "Registro", icon: "✏️" }, { id: "calendar", label: "Calendario", icon: "📅" }, { id: "dashboard", label: "Dashboard", icon: "📊" }, { id: "settings", label: "Config", icon: "⚙️" }];

  return (
    <div style={{ minHeight: "100vh", background: "#FBF8F3", paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(135deg, #C67B5C08, #6DAF7B08)", padding: "16px 20px 10px", borderBottom: "1px solid #F0EBE3" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={goBack} disabled={!canGoBack} style={{ ...smallNavBtn, opacity: canGoBack ? 1 : 0.3, cursor: canGoBack ? "pointer" : "default" }}>←</button>
            <button onClick={goForward} disabled={!canGoForward} style={{ ...smallNavBtn, opacity: canGoForward ? 1 : 0.3, cursor: canGoForward ? "pointer" : "default" }}>→</button>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 500, color: "#2D2A26", margin: 0 }}>Sofi Tracker</h1>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {!hasDemoData && <button onClick={handleLoadDemo} style={{ background: "none", border: "1px solid #D4A0C0", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#D4A0C0", cursor: "pointer" }}>🎭 Demo</button>}
            {hasDemoData && <button onClick={handleClearDemo} style={{ background: "none", border: "1px solid #E88D67", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#E88D67", cursor: "pointer" }}>🗑️ Demo</button>}
            <button onClick={handleExport} style={{ background: "none", border: "1px solid #E8E2D8", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#8A8478", cursor: "pointer" }}>CSV ↓</button>
            <button onClick={logout} style={{ background: "none", border: "1px solid #E8E2D8", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#8A8478", cursor: "pointer" }}>Salir</button>
          </div>
        </div>
      </div>
      <div style={{ background: "#fff", borderBottom: "1px solid #F0EBE3", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 620, margin: "0 auto", display: "flex" }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => navigate(tab.id)}
              style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderBottom: (view === tab.id || (view === "ficha" && tab.id === "calendar")) ? "2px solid #C67B5C" : "2px solid transparent", color: (view === tab.id || (view === "ficha" && tab.id === "calendar")) ? "#C67B5C" : "#8A8478", fontWeight: view === tab.id ? 600 : 400, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "24px 16px" }}>
        {view === "log" && <LogForm entry={formEntry} setEntry={setFormEntry} onSave={handleSave} existing={!!entries[formEntry.date]} categories={categories} />}
        {view === "calendar" && <CalendarView entries={entries} onSelectDate={handleSelectDate} />}
        {view === "ficha" && selectedDate && entries[selectedDate] && <FichaView entry={entries[selectedDate]} onClose={() => navigate("calendar")} onEdit={handleEditFromFicha} categories={categories} />}
        {view === "dashboard" && <DashboardView entries={entries} onSelectDate={handleSelectDate} categories={categories} />}
        {view === "settings" && <SettingsView categories={categories} setCategories={setCategories} />}
      </div>
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#2D2A26", color: "#fff", padding: "10px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 100 }}>{toast}</div>}
    </div>
  );
}
