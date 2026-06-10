import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://xxhmytltastgfgrjrrnf.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4aG15dGx0YXN0Z2Zncmpycm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzE4MjgsImV4cCI6MjA5NjM0NzgyOH0.2Qjm0tzIFhIXj3FjCO9Mxy_FdM84huDarSNdy6w5PpA");

// ─── SYNC ─────────────────────────────────────────────────────────────────────
async function pushToCloud(userId, key, value) {
  const col = {
    anant_v3_logs: "logs", anant_v3_workout: "workout_logs",
    anant_v3_food: "food_logs", anant_v3_weight: "weight_logs",
    anant_v3_xp: "xp_logs", anant_v3_achievements: "achievements",
    anant_v3_sleep: "sleep_logs", anant_v3_measurements: "measurements",
    anant_v3_checkin: "checkin_logs", anant_v3_journal: "journal_logs",
    anant_v3_quests: "quests", anant_v3_profile: "profile",
    anant_v3_workout_plan: "workout_plan", anant_v3_skincare_plan: "skincare_plan",
    anant_v3_diet_plan: "diet_plan", anant_v3_haircare_plan: "haircare_plan",
    anant_v3_spiritual_plan: "spiritual_plan", anant_v3_nofap_history: "nofap_history",
    anant_v3_custom_habits: "custom_habits", anant_v3_plan_list: "plan_list",
    anant_v3_custom_plans: "custom_plans", anant_v3_seasons: "seasons",
  }[key];
  if (!col) return;
  await supabase.from("user_data").upsert({ user_id: userId, [col]: value, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}
async function pullFromCloud(userId, setters) {
  const { data, error } = await supabase.from("user_data").select("*").eq("user_id", userId).single();
  if (error || !data) return;
  const map = {
    logs: setters.setLogs, workout_logs: setters.setWorkoutLogs,
    food_logs: setters.setFoodLogs, weight_logs: setters.setWeightLogs,
    xp_logs: setters.setXpLogs, achievements: setters.setAchievements,
    sleep_logs: setters.setSleepLogs, measurements: setters.setMeasurements,
    checkin_logs: setters.setCheckinLogs, journal_logs: setters.setJournalLogs,
    quests: setters.setQuests, profile: setters.setUserProfile,
    workout_plan: setters.setWorkoutPlan, skincare_plan: setters.setSkincarePlan,
    diet_plan: setters.setDietPlan, haircare_plan: setters.setHaircarePlan,
    spiritual_plan: setters.setSpiritualPlan, nofap_history: setters.setNofapHistory,
    custom_habits: setters.setCustomHabits, plan_list: setters.setPlanList,
    seasons: setters.setSeasons,
  };
  Object.entries(map).forEach(([col, setter]) => { if (data[col] && setter) setter(data[col]); });
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuthComplete }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit() {
    setLoading(true); setMsg("");

    if (!username.trim()) { setMsg("Username is required."); setLoading(false); return; }
    if (username.includes(" ")) { setMsg("Username cannot contain spaces."); setLoading(false); return; }

    if (mode === "signup") {
      if (!email.trim()) { setMsg("Email is required."); setLoading(false); return; }
      // Check username uniqueness
      const { data: existing } = await supabase.from("user_data").select("user_id").eq("username", username.toLowerCase().trim()).maybeSingle();
      if (existing) { setMsg("Username already taken. Choose another."); setLoading(false); return; }
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) { setMsg(error.message); setLoading(false); return; }
      if (data?.user) {
        await supabase.from("user_data").upsert({ user_id: data.user.id, username: username.toLowerCase().trim(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        setMsg("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } else {
      // signin — resolve username to email
      let loginEmail = email.trim();
      if (!loginEmail.includes("@")) {
        setMsg("Please enter your email address to sign in."); setLoading(false); return;
      }
      // Verify the username matches this account after sign in
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) { setMsg(error.message); setLoading(false); return; }
      if (authData?.user) {
        // Check username matches
        const { data: userData } = await supabase.from("user_data").select("username").eq("user_id", authData.user.id).maybeSingle();
        if (userData?.username && userData.username !== username.toLowerCase().trim()) {
          await supabase.auth.signOut();
          setMsg("Username does not match this account."); setLoading(false); return;
        }
        // If no username set yet (old account), set it now
        if (!userData?.username) {
          const { data: taken } = await supabase.from("user_data").select("user_id").eq("username", username.toLowerCase().trim()).maybeSingle();
          if (taken) { await supabase.auth.signOut(); setMsg("Username already taken. Choose another."); setLoading(false); return; }
          await supabase.from("user_data").upsert({ user_id: authData.user.id, username: username.toLowerCase().trim(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        }
        onAuthComplete?.();
        onClose();
      }
    }
    setLoading(false);
  }

  const inputStyle = { background: "#0F0F16", border: "1px solid #16161E", borderRadius: 10, padding: "12px 14px", color: "#E8E4DC", fontFamily: "inherit", fontSize: 13, outline: "none", width: "100%" };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(7,7,10,0.95)", zIndex: 999999, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#0D0D12", borderRadius: "20px 20px 0 0", padding: "28px 24px 52px", fontFamily: "'DM Mono',monospace" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, color: "#E8E4DC", marginBottom: 4 }}>
          {mode === "signin" ? "Welcome back." : "Create account."}
        </div>
        <div style={{ fontSize: 11, color: "#3A3A48", marginBottom: 20 }}>
          {mode === "signin" ? "Enter your username and email to sign in." : "Choose a unique username to get started."}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {/* Username — always shown */}
          <div>
            <div style={{ fontSize: 9, color: "#3A3A48", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Username</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#3A3A48", fontSize: 13 }}>@</span>
              <input
                placeholder="yourname"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, "").toLowerCase())}
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>
            <div style={{ fontSize: 9, color: "#3A3A48", marginTop: 4 }}>Letters, numbers, _ and . only</div>
          </div>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
        </div>
        {msg && (
          <div style={{ fontSize: 11, color: msg.includes("created") || msg.includes("Check") ? "#7EB8A4" : "#E05A7B", marginBottom: 12, lineHeight: 1.5, background: msg.includes("created") ? "#7EB8A415" : "#E05A7B15", borderRadius: 8, padding: "8px 12px" }}>
            {msg}
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", background: "#C9A96E", border: "none", borderRadius: 10, padding: "13px", color: "#000", fontSize: 13, fontFamily: "inherit", fontWeight: 600, marginBottom: 12, opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
        <button onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setMsg(""); setUsername(""); setEmail(""); setPassword(""); }} style={{ width: "100%", background: "none", border: "1px solid #16161E", borderRadius: 10, padding: "11px", color: "#3A3A48", fontSize: 12, fontFamily: "inherit", marginBottom: 8 }}>
          {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
        <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "#3A3A48", fontSize: 11, fontFamily: "inherit" }}>
          Continue as guest →
        </button>
      </div>
    </div>
  );
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const THEME_MALE = {
  bg: "#07070A", surface: "#0D0D12", border: "#16161E", faint: "#0F0F16",
  text: "#E8E4DC", muted: "#3A3A48", dim: "#555566",
  workout: "#5B8DEF", skincare: "#C9A96E", diet: "#E07B5A",
  nofap: "#E05A7B", haircare: "#7EB8A4", spiritual: "#C9A96E",
  accent: "#C9A96E", accentAlt: "#5B8DEF",
  navActive: "#C9A96E", navInactive: "#3A3A48",
  ring: "#C9A96E", ringBg: "#0F0F16",
  btnPrimary: "#C9A96E", btnPrimaryText: "#000",
  statHealth: "#E07B5A", statProductivity: "#A07EE0", statAnalytics: "#C9A96E",
  glowAccent: "rgba(201,169,110,0.12)",
};

const THEME_FEMALE = {
  bg: "#050507", surface: "#101018", border: "#232332", faint: "#14141D",
  text: "#E8E6E2", muted: "#686C7A", dim: "#4D5160",
  workout: "#A18AC4", skincare: "#C98C9C", diet: "#C98C9C",
  nofap: "#A18AC4", haircare: "#C7CBD6", spiritual: "#D8D5CE",
  accent: "#A18AC4", accentAlt: "#C98C9C",
  navActive: "#D8D5CE", navInactive: "#5E6170",
  ring: "#A18AC4", ringBg: "#1D1D2A",
  btnPrimary: "#A18AC4", btnPrimaryText: "#050507",
  statHealth: "#C98C9C", statProductivity: "#A18AC4", statAnalytics: "#D8D5CE",
  glowAccent: "rgba(161,138,196,0.12)",
  elevated: "#1A1A25",
  activeBorder: "#A18AC4",
  secondaryText: "#A5A8B5",
  champagne: "#D8D5CE",
  pearl: "#C7CBD6",
  rose: "#C98C9C",
  lavender: "#A18AC4",
};

// Will be set dynamically — default to male
let C = { ...THEME_MALE };

const ThemeContext = createContext({ theme: THEME_MALE, isFemale: false });
const useTheme = () => useContext(ThemeContext);

const COLORS_MALE = {
  workout: THEME_MALE.workout, skincare: THEME_MALE.skincare, diet: THEME_MALE.diet,
  nofap: THEME_MALE.nofap, haircare: THEME_MALE.haircare, spiritual: THEME_MALE.skincare,
  productivity: "#A07EE0", sleep: "#7c6fa0"
};
const COLORS_FEMALE = {
  workout: THEME_FEMALE.workout, skincare: THEME_FEMALE.skincare, diet: THEME_FEMALE.diet,
  nofap: THEME_FEMALE.nofap, haircare: THEME_FEMALE.haircare, spiritual: THEME_FEMALE.spiritual,
  productivity: "#A18AC4", sleep: "#C7CBD6"
};

let COLORS = { ...COLORS_MALE };

// ─── XP SYSTEM ────────────────────────────────────────────────────────────────
const XP_VALUES = {
  h1: 15, h2: 15, h3: 10, h4: 50, h5: 20, h6: 15,
  h7: 20, h8: 10, h9: 40, h11: 15, h14: 25, h15: 25, h13: 20,
};

const RANKS = [
  { rank: "E",   title: "The Awakened",  xpRequired: 0,      color: "#888888" },
  { rank: "D",   title: "Iron Will",     xpRequired: 500,    color: "#4CAF50" },
  { rank: "C",   title: "Shadow Walker", xpRequired: 2000,   color: "#2196F3" },
  { rank: "B",   title: "Blood Forged",  xpRequired: 5000,   color: "#9C27B0" },
  { rank: "A",   title: "Sovereign",     xpRequired: 12000,  color: "#FF5722" },
  { rank: "S",   title: "The Ruthless",  xpRequired: 25000,  color: "#FFD700" },
  { rank: "SS",  title: "Monarch",       xpRequired: 50000,  color: "#FF0000" },
  { rank: "SSS", title: "The Absolute",  xpRequired: 100000, color: "#C0C0C0" },
];

const CATEGORY_LEVELS = {
  workout:     { name: "Body",       icon: "◆", levels: ["Untrained","Novice","Fighter","Warrior","Elite","Champion","Legend"] },
  diet:        { name: "Vitality",   icon: "◉", levels: ["Malnourished","Fueled","Nourished","Optimized","Peak","Supreme","Godlike"] },
  nofap:       { name: "Discipline", icon: "⬡", levels: ["Broken","Awakening","Control","Mastery","Iron","Unbreakable","Transcendent"] },
  skincare:    { name: "Aesthetics", icon: "✦", levels: ["Neglected","Basic","Groomed","Refined","Sharp","Pristine","Flawless"] },
  haircare:    { name: "Presence",   icon: "◈", levels: ["Unkempt","Tended","Styled","Polished","Striking","Dominant","Iconic"] },
  spiritual:   { name: "Mind",       icon: "✦", levels: ["Asleep","Stirring","Aware","Focused","Centered","Enlightened","Sovereign"] },
  productivity:{ name: "Skill",      icon: "♪", levels: ["Idle","Practicing","Developing","Proficient","Advanced","Master","Virtuoso"] },
};

const ACHIEVEMENTS_LIST = [
  { id: "first_habit",   title: "First Step",      desc: "Complete your first habit",       icon: "⚡", xp: 50   },
  { id: "first_workout", title: "Iron Awakening",  desc: "Log your first workout",          icon: "◆", xp: 100  },
  { id: "streak_7",      title: "Week Warrior",    desc: "Any habit 7 day streak",          icon: "🔥", xp: 150  },
  { id: "streak_30",     title: "Month of Steel",  desc: "Any habit 30 day streak",         icon: "⚔", xp: 500  },
  { id: "streak_90",     title: "Unbreakable",     desc: "Any habit 90 day streak",         icon: "👑", xp: 1000 },
  { id: "nofap_7",       title: "First Battle Won",desc: "7 days NoFap",                    icon: "⬡", xp: 200  },
  { id: "nofap_30",      title: "Sovereign Mind",  desc: "30 days NoFap",                   icon: "⬡", xp: 500  },
  { id: "nofap_90",      title: "The Monk",        desc: "90 days NoFap",                   icon: "⬡", xp: 1000 },
  { id: "full_day",      title: "Perfect Day",     desc: "Complete all habits in a day",    icon: "✦", xp: 200  },
  { id: "full_week",     title: "Perfect Week",    desc: "Complete all habits 7 days",      icon: "★", xp: 500  },
  { id: "weight_logged", title: "Know Thyself",    desc: "Log your body weight",            icon: "◎", xp: 50   },
  { id: "protein_7",     title: "Protein Hunter",  desc: "Hit protein goal 7 days",         icon: "◉", xp: 200  },
];

// ─── HABITS ───────────────────────────────────────────────────────────────────
const HABITS = [
  { id: "h1",  label: "Morning Skincare",  category: "skincare",     type: "binary",       icon: "✦" },
  { id: "h2",  label: "Night Skincare",    category: "skincare",     type: "binary",       icon: "✦" },
  { id: "h3",  label: "Sunscreen",         category: "skincare",     type: "binary",       icon: "✦" },
  { id: "h4",  label: "Workout",           category: "workout",      type: "binary",       icon: "◆", skipDay: 6 },
  { id: "h5",  label: "Hit Protein Goal",  category: "diet",         type: "binary",       icon: "◉" },
  { id: "h6",  label: "Water Intake",      category: "diet",         type: "quantitative", icon: "◉", unit: "L", target: 3 },
  { id: "h7",  label: "All 6 Meals",       category: "diet",         type: "binary",       icon: "◉" },
  { id: "h8",  label: "Supplements Taken", category: "diet",         type: "binary",       icon: "◉" },
  { id: "h9",  label: "NoFap",             category: "nofap",        type: "binary",       icon: "⬡" },
  { id: "h10", label: "Guitar Practice",   category: "productivity", type: "binary",       icon: "♪" },
  { id: "h11", label: "No Junk Food",      category: "diet",         type: "binary",       icon: "◉" },
  { id: "h12", label: "Pooja", category: "spiritual", type: "binary", icon: "✦" },
{ id: "h13", label: "Sleep Schedule", category: "sleep", type: "binary", icon: "☽" },
];

// ─── ONBOARDING DATA ──────────────────────────────────────────────────────────
const STRUGGLE_OPTIONS = [
  "Low motivation", "Anxiety & overthinking", "Poor sleep", "Procrastination",
  "Social media addiction", "Lack of discipline", "Brain fog", "Low confidence",
  "Stress", "Unhealthy eating", "No workout consistency", "Spiritual disconnection",
  "Negative self-talk", "Phone addiction", "Loneliness",
];

const GOAL_OPTIONS = [
  "Build muscle & physique", "Lose weight", "Improve skin & appearance",
  "Master discipline", "Spiritual growth", "Learn guitar / music",
  "Career & productivity focus", "Better sleep schedule", "Clean eating",
  "NoFap / mental clarity", "Build confidence", "Reduce stress & anxiety",
  "Daily journaling", "Morning routine", "Read more books",
];

const DEFAULT_PROFILE = {
  name: "", gender: null, age: "", height: "", weight: "",
  struggles: [], goals: [], alterEgo: { name: "", title: "" },
  onboardingComplete: false,
};
const MOOD_LABELS = ["Dead Inside", "Struggling", "Holding On", "Locked In", "Unstoppable"];
const ENERGY_LABELS = ["Drained", "Low", "Decent", "Charged", "On Fire"];
const SLEEP_LABELS = ["<4h", "4-5h", "5-6h", "6-7h", "7-8h", "8h+"];
const STRESS_LABELS = ["None", "Mild", "Building", "Heavy", "Overwhelming"];
const FOCUS_LABELS = ["Scattered", "Distracted", "Average", "Sharp", "Laser"];
const MOTIVATION_LABELS = ["Zero", "Weak", "Present", "Strong", "Burning"];


// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getTotalXP(xpLogs) {
  return Object.values(xpLogs).reduce((a, d) => a + (typeof d === "number" ? d : 0), 0);
}
function getCurrentRank(xp) {
  let c = RANKS[0];
  for (const r of RANKS) { if (xp >= r.xpRequired) c = r; }
  return c;
}
function getNextRank(xp) {
  return RANKS.find(r => r.xpRequired > xp) || RANKS[RANKS.length - 1];
}
// FIX: reads from logs (habit objects) not xpLogs (numbers)
function getCategoryXP(logs, category) {
  const catHabits = HABITS.filter(h => h.category === category);
  let total = 0;
  Object.values(logs).forEach(dayLogs => {
    if (typeof dayLogs === "object") {
      catHabits.forEach(h => {
        if (dayLogs[h.id]?.done) total += XP_VALUES[h.id] || 10;
      });
    }
  });
  return total;
}
function getCategoryLevel(xp) {
  const t = [0, 200, 600, 1500, 3500, 7000, 15000];
  let l = 0;
  t.forEach((v, i) => { if (xp >= v) l = i; });
  return l;
}
function todayKey() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}
function dateKey(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}
function last7()  { return Array.from({ length: 7  }, (_, i) => dateKey(-(6  - i))); }
function last30() { return Array.from({ length: 30 }, (_, i) => dateKey(-(29 - i))); }

// ─── DEMON SYSTEM ─────────────────────────────────────────────────────────────
function getDemonData(logs) {
  const demons = [];
  Object.keys(COLORS).forEach(cat => {
    const catHabits = HABITS.filter(h => h.category === cat);
    if (!catHabits.length) return;
    let missStreak = 0;
    let d = new Date();
    for (let i = 0; i < 30; i++) {
      const k = new Date(d.getTime() - i * 86400000).toISOString().split("T")[0];
      const allMissed = catHabits.every(h => !logs[k]?.[h.id]?.done);
      if (allMissed) missStreak++;
      else break;
    }
    if (missStreak >= 3) {
      const isMajor = missStreak >= 7;
      demons.push({
        cat, missStreak, isMajor,
        name: isMajor ? `The ${cat.charAt(0).toUpperCase() + cat.slice(1)} Devourer` : `${cat.charAt(0).toUpperCase() + cat.slice(1)} Shadow`,
        hp: Math.min(100, Math.round((missStreak / 14) * 100)),
        color: COLORS[cat] || C.muted,
        taunt: isMajor
          ? `${missStreak} days of silence. It's getting stronger.`
          : `${missStreak} days missed. Don't let it grow.`,
      });
    }
  });
  return demons;
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
function useLS(key, def) {
  const [val, setVal] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      if (!v) return def;
      return JSON.parse(v);
    } catch {
      try { localStorage.removeItem(key); } catch {}
      return def;
    }
  });

 useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      const EVICTABLE = [
        "anant_v3_ai_reviews",
        "anant_v3_journal",
        "anant_v3_checkin",
        "anant_v3_quests",
      ];
      for (const k of EVICTABLE) {
        if (k !== key) {
          try { localStorage.removeItem(k); } catch {}
        }
      }
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) pushToCloud(session.user.id, key, val);
      });
    } catch {}
  }, [val, key]);
  return [val, setVal];
}

// ─── AI FOOD SEARCH ───────────────────────────────────────────────────────────
async function searchFoodNutrition(query) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Give me the nutritional info for: "${query}". Return ONLY a JSON array of 1-4 matching food items (no markdown, no backticks, just raw JSON). Format: [{"name":"Food Name (amount)","calories":0,"protein":0,"carbs":0,"fat":0,"fibre":0,"amount":"100g"}] Use realistic Indian food database values.`
      }]
    })
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || "[]";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); } catch { return []; }
}

// ─── EDIT HELPERS ─────────────────────────────────────────────────────────────
const editBtnStyle = (editing) => ({
  background: editing ? "#C9A96E" : "none",
  border: `1px solid ${editing ? "#C9A96E" : "#3A3A48"}`,
  borderRadius: 7, padding: "5px 12px",
  color: editing ? "#000" : "#3A3A48",
  fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: 1, cursor: "pointer",
});
const editInput = {
  background: "#0F0F16", border: "1px solid #2A2A3A", borderRadius: 6,
  color: "#E8E4DC", fontFamily: "'DM Mono',monospace", fontSize: 12,
  padding: "5px 8px", outline: "none", width: "100%",
};
function EditHeader({ title, editing, setEditing, onReset }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: "#3A3A48", letterSpacing: 3, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {editing && <button onClick={onReset} style={{ ...editBtnStyle(false), color: "#E05A7B", borderColor: "#E05A7B" }}>Reset</button>}
        <button onClick={() => setEditing(e => !e)} style={editBtnStyle(editing)}>{editing ? "✓ Done" : "✎ Edit"}</button>
      </div>
    </div>
  );
}
function AddButton({ onClick, label = "+ Add", color = "#3A3A48" }) {
  return (
    <button onClick={onClick} style={{ width: "100%", background: "none", border: `1px dashed ${color}60`, borderRadius: 7, padding: "7px", color, fontSize: 11, fontFamily: "inherit", marginTop: 6, cursor: "pointer" }}>
      {label}
    </button>
  );
}
function RemoveBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: "#E05A7B", fontSize: 14, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>✕</button>
  );
}

// ─── DEFAULT PLAN DATA ────────────────────────────────────────────────────────
const WORKOUT_DAYS = [
  { day: "Day 1", focus: "ARMS — Heavy Hypertrophy", sections: [
    { title: "Triceps", exercises: [
      "Close-Grip Bench Press — 4×5-7 | 2-3 min rest | Elbows 45°, not flared",
      "Straight Bar Overhead Cable Extension — 3×10-12 | Full stretch at bottom",
      "Unilateral Cable Pressdowns — 3×12-15 each | Last set: Dropset",
    ]},
    { title: "Biceps", exercises: [
      "Bayesian Cable Curls — 4×8-10 | Weak side first | Elbow slightly behind body",
      "Preacher Curls (EZ-bar) — 3×10-12 | 2 sec controlled descent every rep",
      "Hammer Curls (DB) — 3×12-15 | Last set: Dropset",
    ]},
    { title: "Forearms", exercises: [
      "Reverse EZ-bar Curls — 3×12-15",
      "Dumbbell Wrist Curls (seated, forearm on thigh) — 3×15-20",
    ]},
    { title: "Medial Delt Activation", exercises: [
      "Cable Lateral Raises — 2×15-20 | Light, strict, slow",
    ]},
  ]},
  { day: "Day 2", focus: "CHEST + MEDIAL DELTS", sections: [
    { title: "Chest", exercises: [
      "Incline Barbell Bench Press — 4×5-7 | Progressive overload every session",
      "Cable Flyes (Low-to-High) — 3×13-15 | Cables at lowest pulley, pull upward and inward",
      "Chest Dips (forward lean) — 3×8-12 | Add weight when 12 clean reps is easy",
    ]},
    { title: "Delts", exercises: [
      "Cable Lateral Raises — 4×15-18 | Lead with elbow, 2 sec descent",
      "Machine Shoulder Press — 3×10-12 | No full lockout, keep tension on delts",
    ]},
    { title: "Abs", exercises: [
      "Cable Crunches — 3×15-20 | Ribcage toward pelvis",
      "Hanging Leg Raises — 3×12-15",
    ]},
    { title: "Medial Delt Activation", exercises: [
      "Cable Lateral Raises — 2×15-20 | Light, strict, slow",
    ]},
  ]},
  { day: "Day 3", focus: "BACK — Width + Thickness", sections: [
    { title: "Width", exercises: [
      "Single-Arm Cable Row — 4×8-10 | Weak side first",
      "Weighted Pull-Ups — 4×5-7 | Dead hang at bottom | Use dip belt",
      "Straight-Arm Lat Pulldown — 3×12-15",
    ]},
    { title: "Thickness", exercises: [
      "Barbell Bent-Over Rows — 3×8-10 | Brace core hard",
    ]},
    { title: "Traps", exercises: [
      "Barbell Shrugs — 3×12-15 | Last set: Dropset | Hold top 1 sec",
      "Rear Delt Machine Fly — 3×15-18 | Light weight, full range",
    ]},
    { title: "Medial Delt Activation", exercises: [
      "Cable Lateral Raises — 2×15-20 | Light, strict, slow",
    ]},
  ]},
  { day: "Day 4", focus: "SHOULDERS + ARMS — Volume + Pump", sections: [
    { title: "Delts", exercises: [
      "Machine Shoulder Press — 4×10-12 | 90 sec rest",
      "Cable Lateral Raises — 4×15-18",
      "Reverse Pec Deck Fly — 3×15-18",
    ]},
    { title: "Superset A — 3 rounds", exercises: [
      "Straight Bar Overhead Extension — 12-15 reps",
      "Bayesian Cable Curl — 12-15 reps",
    ]},
    { title: "Superset B — 3 rounds", exercises: [
      "Unilateral Cable Pressdowns — 12-15 reps each",
      "Hammer Curls (DB) — 12-15 reps",
    ]},
    { title: "Abs", exercises: [
      "Cable Woodchoppers — 3×15 each side",
      "Hanging Leg Raises — 3×12-15",
    ]},
    { title: "Medial Delt Activation", exercises: [
      "Cable Lateral Raises — 2×15-20 | Light, strict, slow",
    ]},
  ]},
  { day: "Day 5", focus: "CHEST + BACK — Pump Day", sections: [
    { title: "Chest", exercises: [
      "Incline DB Press — 3×12-15 | 3 sec eccentric",
      "Pec Deck Fly — 3×13-15 | Squeeze inner chest at peak",
      "Machine Chest Press — 3×12-15 | Last set: Double Dropset",
    ]},
    { title: "Back", exercises: [
      "Straight-Arm Lat Pulldown — 3×12-15",
      "Assisted Pull-Ups or Lat Pulldown — 3×10-12",
      "Barbell Bent-Over Rows — 3×8-10",
    ]},
    { title: "Abs", exercises: [
      "Cable Crunches — 3×15-20",
      "Leg Raises — 3×15-20",
    ]},
    { title: "Medial Delt Activation", exercises: [
      "Cable Lateral Raises — 2×15-20 | Light, strict, slow",
    ]},
  ]},
  { day: "Day 6", focus: "ARMS — Compound Power", sections: [
    { title: "Triceps", exercises: [
      "Weighted Dips (upright) — 4×6-8 | Use dip belt",
      "Skullcrushers (EZ-bar) — 3×8-10",
      "Unilateral Cable Pressdowns — 3×12-15 | Last set: Mechanical Dropset",
    ]},
    { title: "Biceps", exercises: [
      "Barbell Curl — 4×6-8 | Zero swinging | 2 min rest",
      "Incline DB Curls — 3×10-12 | Pure long head stretch",
      "Hammer Curls (DB) — 2 sets full Dropsets",
    ]},
    { title: "Forearms", exercises: [
      "Reverse EZ-bar Curls — 3×12-15",
      "Farmer's Carries — 3×35 meters",
    ]},
    { title: "Medial Delt Activation", exercises: [
      "Cable Lateral Raises — 2×15-20 | Light, strict, slow",
    ]},
  ]},
  { day: "Day 7", focus: "REST", sections: [] },
];
const DEFAULT_SKINCARE = {
  morning: [
    { step: 1, task: "Ponds Charcoal Face Wash",   note: "Lukewarm water. Gentle circular motions." },
    { step: 2, task: "Lightweight Moisturizer",     note: "Apply while face is slightly damp." },
    { step: 3, task: "Joy Hello Sun SPF 50",        note: "NON-NEGOTIABLE. 2 finger lengths every morning." },
    { step: 4, task: "Vaseline on lips",            note: "Thin layer." },
  ],
  night: [
    { step: 1, task: "Ponds Charcoal Face Wash",   note: "Removes sunscreen, pollution, oil buildup." },
    { step: 2, task: "Minimalist 10% Niacinamide", note: "2–3 drops, press gently. Your dark mark treatment." },
    { step: 3, task: "Lightweight Moisturizer",    note: "Slightly more generous than morning." },
    { step: 4, task: "Vaseline on lips",           note: "Thicker layer — overnight repair." },
  ],
  toBuy: [
    { item: "Lightweight Moisturizer",     price: "~₹300–400" },
    { item: "Minimalist 10% Niacinamide", price: "~₹300" },
  ],
};

const DEFAULT_DIET = {
  target: "~3030 kcal/day · ~178g protein/day",
  meals: [
    { time: "9:30 AM",  label: "Meal 1",              items: ["2 peanut butter sandwiches","4 whole eggs","1 glass whole milk","10 almonds","Vitamin D3 + Multivitamin"], macros: "~40g P · ~700 kcal" },
    { time: "1:00 PM",  label: "Meal 2",              items: ["50g soya chunks (dry)","1.5 cups cooked rice","1 glass buttermilk"], macros: "~30g P · ~500 kcal" },
    { time: "3:00 PM",  label: "Meal 3",              items: ["1 banana","2 tbsp peanut butter OR peanuts"], macros: "~8g P · ~280 kcal" },
    { time: "5:30 PM",  label: "Meal 4 (Post-Workout)",items: ["1 scoop whey","1 cup oats","1 banana","1 tbsp peanut butter","1 glass whole milk","Creatine 5g"], macros: "~50g P · ~650 kcal" },
    { time: "8:30 PM",  label: "Meal 5",              items: ["150g chicken OR paneer","1.5 cups rice OR 2 roti","Spinach / mixed veg","1 glass buttermilk","Ashwagandha here"], macros: "~40g P · ~650 kcal" },
    { time: "10:30 PM", label: "Meal 6",              items: ["1 glass warm milk","1 tbsp peanut butter"], macros: "~10g P · ~250 kcal" },
  ],
};

const DEFAULT_HAIRCARE = {
  washDay: [
    { step: 1, task: "Pre-wash oil (1–2 hrs before)", note: "Coconut oil + 5–6 drops rosemary. Massage 5–7 mins." },
    { step: 2, task: "Shampoo",                       note: "Scalp only. Rinse thoroughly." },
    { step: 3, task: "Conditioner",                   note: "Mid-lengths to ends only. 2–3 mins. Cold water final rinse." },
    { step: 4, task: "Dry + Style",                   note: "Squeeze with t-shirt. Air dry to 60%. Apply serum. Comb into slickback." },
  ],
  daily: [
    "Spray water on palms if frizzy, scrunch through",
    "1–2 drops serum on ends if needed",
    "Scalp massage 3–5 mins — no oil needed",
  ],
  weekly: [
    "Replace coconut oil with castor oil once a week — reduces breakage",
    "Onion juice on scalp 30 mins before wash (optional — hairline maintenance)",
  ],
};

const DEFAULT_SPIRITUAL = [
  { time: "MORNING", color: "#C9A96E", steps: [
    { title: "Pooja — 3 mins", items: [
      "Wash hands before approaching mandir",
      "Light diya and agarbatti",
      "Ring the bell",
      "Offer water with right hand",
      "Hands folded, eyes closed, one slow breath",
      "Say internally: \"You know what I need. I am showing up every day. Please meet me halfway.\"",
      "Hold your wish for 20 seconds — then surrender it",
      "One clockwise pradakshina and bow",
    ]},
    { title: "Affirmations — 1–2 mins", items: [
      "After bowing, eyes closed, say slowly:",
      "\"I am becoming someone who receives what they truly need.\"",
      "\"I am becoming someone who handles hard days without catastrophising.\"",
      "\"What is meant for me is already making its way to me.\"",
    ]},
  ]},
  { time: "THROUGHOUT THE DAY", color: "#7EB8A4", steps: [
    { title: "Thought Interrupt — 30 sec", items: [
      "When a worst-case thought hits — don't fight it",
      "Ask: \"That's one possibility. What's another?\"",
      "Answer: \"Or — it works out. It actually comes through.\"",
      "You don't need to believe it fully. Just say it.",
    ]},
  ]},
  { time: "NIGHT", color: "#5B8DEF", steps: [
    { title: "Gratitude — 3 mins", items: [
      "3 specific things from today that were okay or good",
      "Small and specific beats big and vague",
      "Then add: \"I am grateful that what I need is already on its way to me.\"",
    ]},
    { title: "Visualisation — 1–2 mins", items: [
      "Last thing before sleep",
      "Don't visualise the thing — visualise the moment after",
      "The relief. The exhale. The \"it happened.\"",
      "Hold that feeling for 60 seconds",
      "Let sleep take you from that feeling",
    ]},
  ]},
];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ ...DEFAULT_PROFILE });
  const TOTAL_STEPS = 6;

  const isFemale = profile.gender === "female";
  const OC = isFemale ? THEME_FEMALE : THEME_MALE;

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const containerStyle = {
    position: "fixed", inset: 0, background: OC.bg, zIndex: 999999,
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "flex-end", fontFamily: "'DM Mono',monospace", color: OC.text,
    padding: 0,
  };

  const sheetStyle = {
    width: "100%", maxWidth: 480, background: OC.surface,
    borderRadius: "24px 24px 0 0", padding: "32px 24px 52px",
    display: "flex", flexDirection: "column", gap: 20,
    maxHeight: "90vh", overflowY: "auto",
  };

  const btnPrimary = {
    width: "100%", background: OC.btnPrimary || OC.accent,
    border: "none", borderRadius: 12, padding: "14px",
    color: OC.btnPrimaryText || "#000", fontSize: 13,
    fontFamily: "inherit", fontWeight: 600, cursor: "pointer",
    letterSpacing: 0.5,
  };

  const btnSecondary = {
    width: "100%", background: "none",
    border: `1px solid ${OC.border}`, borderRadius: 12, padding: "12px",
    color: OC.muted, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
  };

  const chipStyle = (selected, color) => ({
    padding: "8px 14px", borderRadius: 20, fontSize: 11,
    fontFamily: "inherit", cursor: "pointer",
    background: selected ? `${color}20` : OC.faint,
    border: `1px solid ${selected ? color : OC.border}`,
    color: selected ? color : OC.muted,
    transition: "all 0.2s",
  });

  const inputStyle = {
    background: OC.faint, border: `1px solid ${OC.border}`,
    borderRadius: 10, padding: "12px 14px", color: OC.text,
    fontFamily: "inherit", fontSize: 13, outline: "none", width: "100%",
  };

  const labelStyle = { fontSize: 9, color: OC.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 };

  // Progress dots
  const ProgressDots = () => (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 4 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 20 : 6, height: 4, borderRadius: 2,
          background: i <= step ? (OC.accent || OC.skincare) : OC.border,
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  );

  const Heading = ({ children }) => (
    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: OC.text }}>
      {children}
    </div>
  );

  const Sub = ({ children }) => (
    <div style={{ fontSize: 12, color: OC.muted, lineHeight: 1.7, marginTop: -8 }}>
      {children}
    </div>
  );

  // ── Step 0: Welcome ──
  if (step === 0) return (
    <div style={containerStyle}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⚡</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700, color: OC.text, marginBottom: 10, lineHeight: 1 }}>
          Self System
        </div>
        <div style={{ fontSize: 13, color: OC.muted, lineHeight: 1.8, maxWidth: 300 }}>
          Your personal operating system for discipline, growth, and becoming who you're meant to be.
        </div>
      </div>
      <div style={{ ...sheetStyle, borderRadius: "24px 24px 0 0" }}>
        <ProgressDots />
        <Heading>Let's build your system.</Heading>
        <Sub>This takes 2 minutes. Your data stays on your device.</Sub>
        <button onClick={next} style={btnPrimary}>Begin →</button>
      </div>
    </div>
  );

  // ── Step 1: Gender ──
  if (step === 1) return (
    <div style={containerStyle}>
      <div style={{ flex: 1 }} />
      <div style={sheetStyle}>
        <ProgressDots />
        <Heading>You are...</Heading>
        <Sub>This personalizes your theme and experience.</Sub>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { value: "male", label: "Male", icon: "◆", desc: "Dark · Iron · Focused" },
            { value: "female", label: "Female", icon: "✦", desc: "Elegant · Soft · Powerful" },
          ].map(opt => {
            const selected = profile.gender === opt.value;
            const accent = opt.value === "male" ? THEME_MALE.skincare : THEME_FEMALE.lavender;
            return (
              <div key={opt.value} onClick={() => setProfile(p => ({ ...p, gender: opt.value }))}
                style={{ background: selected ? `${accent}15` : OC.faint, border: `2px solid ${selected ? accent : OC.border}`, borderRadius: 14, padding: "20px 16px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ fontSize: 24, color: accent, marginBottom: 8 }}>{opt.icon}</div>
                <div style={{ fontSize: 14, color: selected ? accent : OC.text, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, marginBottom: 4 }}>{opt.label}</div>
                <div style={{ fontSize: 10, color: OC.muted }}>{opt.desc}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={back} style={btnSecondary}>← Back</button>
          <button onClick={() => { if (profile.gender) next(); }} style={{ ...btnPrimary, opacity: profile.gender ? 1 : 0.4 }}>Continue →</button>
        </div>
      </div>
    </div>
  );

  // ── Step 2: Basic Info ──
  if (step === 2) return (
    <div style={containerStyle}>
      <div style={{ flex: 1 }} />
      <div style={sheetStyle}>
        <ProgressDots />
        <Heading>About you.</Heading>
        <Sub>Used to personalize your targets and insights.</Sub>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={labelStyle}>Your Name</div>
            <input style={inputStyle} placeholder="What should we call you?" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Age", key: "age", placeholder: "21", suffix: "yrs" },
              { label: "Height", key: "height", placeholder: "175", suffix: "cm" },
              { label: "Weight", key: "weight", placeholder: "70", suffix: "kg" },
            ].map(({ label, key, placeholder, suffix }) => (
              <div key={key}>
                <div style={labelStyle}>{label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: OC.faint, border: `1px solid ${OC.border}`, borderRadius: 10, padding: "10px 10px" }}>
                  <input type="number" style={{ background: "transparent", border: "none", color: OC.text, fontFamily: "inherit", fontSize: 14, outline: "none", width: "100%" }} placeholder={placeholder} value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} />
                  <span style={{ fontSize: 9, color: OC.muted, flexShrink: 0 }}>{suffix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={back} style={btnSecondary}>← Back</button>
          <button onClick={() => { if (profile.name.trim()) next(); }} style={{ ...btnPrimary, opacity: profile.name.trim() ? 1 : 0.4 }}>Continue →</button>
        </div>
      </div>
    </div>
  );

  // ── Step 3: Struggles ──
  if (step === 3) return (
    <div style={containerStyle}>
      <div style={{ flex: 1 }} />
      <div style={sheetStyle}>
        <ProgressDots />
        <Heading>What are you fighting?</Heading>
        <Sub>Select everything that resonates. No judgment.</Sub>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {STRUGGLE_OPTIONS.map(s => {
            const selected = profile.struggles.includes(s);
            const color = isFemale ? THEME_FEMALE.rose : THEME_MALE.nofap;
            return (
              <button key={s} onClick={() => setProfile(p => ({ ...p, struggles: selected ? p.struggles.filter(x => x !== s) : [...p.struggles, s] }))} style={chipStyle(selected, color)}>
                {s}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={back} style={btnSecondary}>← Back</button>
          <button onClick={next} style={btnPrimary}>Continue →</button>
        </div>
      </div>
    </div>
  );

  // ── Step 4: Goals ──
  if (step === 4) return (
    <div style={containerStyle}>
      <div style={{ flex: 1 }} />
      <div style={sheetStyle}>
        <ProgressDots />
        <Heading>What are you building?</Heading>
        <Sub>Select your primary goals. You can add more later.</Sub>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {GOAL_OPTIONS.map(g => {
            const selected = profile.goals.includes(g);
            const color = isFemale ? THEME_FEMALE.lavender : THEME_MALE.workout;
            return (
              <button key={g} onClick={() => setProfile(p => ({ ...p, goals: selected ? p.goals.filter(x => x !== g) : [...p.goals, g] }))} style={chipStyle(selected, color)}>
                {g}
              </button>
            );
          })}
        </div>
        <div>
          <div style={labelStyle}>Custom Goal</div>
          <input style={inputStyle} placeholder="Add your own goal..." onKeyDown={e => {
            if (e.key === "Enter" && e.target.value.trim()) {
              setProfile(p => ({ ...p, goals: [...p.goals, e.target.value.trim()] }));
              e.target.value = "";
            }
          }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={back} style={btnSecondary}>← Back</button>
          <button onClick={next} style={btnPrimary}>Continue →</button>
        </div>
      </div>
    </div>
  );

  // ── Step 5: Alter Ego ──
  if (step === 5) return (
    <div style={containerStyle}>
      <div style={{ flex: 1 }} />
      <div style={sheetStyle}>
        <ProgressDots />
        <Heading>Your Alter Ego.</Heading>
        <Sub>Who is the version of you that has already won? Name them. Become them.</Sub>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={labelStyle}>Alter Ego Name</div>
            <input style={inputStyle} placeholder={isFemale ? "e.g. The Empress, Dark Rose..." : "e.g. The Shadow, Iron King..."} value={profile.alterEgo.name} onChange={e => setProfile(p => ({ ...p, alterEgo: { ...p.alterEgo, name: e.target.value } }))} />
          </div>
          <div>
            <div style={labelStyle}>Title / Rank</div>
            <input style={inputStyle} placeholder={isFemale ? "e.g. Sovereign of the Night..." : "e.g. The Unbreakable, SSS Ranked..."} value={profile.alterEgo.title} onChange={e => setProfile(p => ({ ...p, alterEgo: { ...p.alterEgo, title: e.target.value } }))} />
          </div>
          <div style={{ background: OC.faint, border: `1px solid ${OC.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: OC.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Preview</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: isFemale ? THEME_FEMALE.lavender : THEME_MALE.skincare }}>
              {profile.alterEgo.name || (isFemale ? "The Empress" : "The Shadow")}
            </div>
            <div style={{ fontSize: 11, color: OC.muted, marginTop: 3 }}>
              {profile.alterEgo.title || (isFemale ? "Sovereign of the Night" : "The Unbreakable")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={back} style={btnSecondary}>← Back</button>
          <button onClick={() => onComplete({ ...profile, onboardingComplete: true })} style={btnPrimary}>
            {isFemale ? "Enter the Empire ✦" : "Enter the System ◆"}
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}
function StorageGuard() {
  useEffect(() => {
    const KEYS = [
      "anant_v3_logs", "anant_v3_workout", "anant_v3_food",
      "anant_v3_weight", "anant_v3_xp", "anant_v3_achievements",
      "anant_v3_sleep", "anant_v3_measurements", "anant_v3_checkin",
      "anant_v3_journal", "anant_v3_ai_reviews", "anant_v3_quests",
      "anant_v3_nofap_history", "anant_v3_seasons",
    ];
    KEYS.forEach(k => {
      try {
        const v = localStorage.getItem(k);
        if (v) JSON.parse(v);
      } catch {
        console.warn(`Clearing corrupted key: ${k}`);
        localStorage.removeItem(k);
      }
    });
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        total += (localStorage.getItem(k) || "").length;
      }
      if (total > 3 * 1024 * 1024) {
        localStorage.removeItem("anant_v3_ai_reviews");
        console.warn("Storage over 3MB, cleared AI reviews");
      }
    } catch {}
  }, []);
  return null;
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "#C9A96E", fontFamily: "'DM Mono',monospace", fontSize: 12 }}>
          Something went wrong loading this section. Pull to refresh.
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [userProfile, setUserProfile] = useLS("anant_v3_profile", DEFAULT_PROFILE);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [supaUser, setSupaUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authGatePassed, setAuthGatePassed] = useLS("anant_v3_auth_gate", false);
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSupaUser(session?.user ?? null);
    if (session?.user) pullFromCloud(session.user.id, { setLogs, setWorkoutLogs, setFoodLogs, setWeightLogs, setXpLogs, setAchievements, setSleepLogs, setMeasurements, setCheckinLogs, setJournalLogs, setQuests, setUserProfile });
    if (session?.user) pushToCloud(session.user.id, "anant_v3_logs", logs);
  });
 const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSupaUser(session?.user ?? null);
    if (session?.user) {
      pullFromCloud(session.user.id, { setLogs, setWorkoutLogs, setFoodLogs, setWeightLogs, setXpLogs, setAchievements, setSleepLogs, setMeasurements, setCheckinLogs, setJournalLogs, setQuests, setUserProfile });
      const allKeys = [
        ["anant_v3_logs", logs], ["anant_v3_workout", workoutLogs],
        ["anant_v3_food", foodLogs], ["anant_v3_weight", weightLogs],
        ["anant_v3_xp", xpLogs], ["anant_v3_achievements", achievements],
        ["anant_v3_sleep", sleepLogs], ["anant_v3_measurements", measurements],
        ["anant_v3_checkin", checkinLogs], ["anant_v3_journal", journalLogs],
        ["anant_v3_quests", quests], ["anant_v3_profile", userProfile],
        ["anant_v3_workout_plan", workoutPlan], ["anant_v3_skincare_plan", skincarePlan],
        ["anant_v3_diet_plan", dietPlan], ["anant_v3_haircare_plan", haircarePlan],
        ["anant_v3_spiritual_plan", spiritualPlan], ["anant_v3_nofap_history", nofapHistory],
      ];
      allKeys.forEach(([key, val]) => pushToCloud(session.user.id, key, val));
    }
  });
  return () => subscription.unsubscribe();
}, []);

  // Determine theme from profile
  const isFemale = userProfile?.gender === "female";
  const activeTheme = isFemale ? THEME_FEMALE : THEME_MALE;
  // Mutate global C and COLORS to match current theme
  

  useEffect(() => {
    if (authGatePassed && !userProfile?.onboardingComplete) setShowOnboarding(true);
  }, [authGatePassed]); // eslint-disable-line

  const [view, setView] = useState("dashboard");
  const [logs, setLogs] = useLS("anant_v3_logs", {});
  const [workoutLogs, setWorkoutLogs] = useLS("anant_v3_workout", {});
  const [foodLogs, setFoodLogs] = useLS("anant_v3_food", {});
  const [weightLogs, setWeightLogs] = useLS("anant_v3_weight", {});
  const [nofapStart, setNofapStart] = useLS("anant_v3_nofap", todayKey());
  const [nofapHistory, setNofapHistory] = useLS("anant_v3_nofap_history", []);
  const [xpLogs, setXpLogs] = useLS("anant_v3_xp", {});
  const [achievements, setAchievements] = useLS("anant_v3_achievements", []);
  const [workoutPlan, setWorkoutPlan] = useLS("anant_v3_workout_plan", WORKOUT_DAYS);
  const [skincarePlan, setSkincarePlan] = useLS("anant_v3_skincare_plan", DEFAULT_SKINCARE);
  const [dietPlan, setDietPlan] = useLS("anant_v3_diet_plan", DEFAULT_DIET);
  const [haircarePlan, setHaircarePlan] = useLS("anant_v3_haircare_plan", DEFAULT_HAIRCARE);
  const [spiritualPlan, setSpiritualPlan] = useLS("anant_v3_spiritual_plan", DEFAULT_SPIRITUAL);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shadowMode, setShadowMode] = useState(false);
  useEffect(() => { window.__shadowMode = shadowMode; }, [shadowMode]);
  useMemo(() => { // eslint-disable-line
    if (shadowMode) {
      Object.assign(C, {
        ...THEME_MALE,
        bg: "#020204", surface: "#080810", border: "#0F0F1A", faint: "#060608",
        text: "#FF0000", muted: "#4A0000", dim: "#2A0000",
        accent: "#FF0000", skincare: "#FF0000", workout: "#CC0000",
      });
      Object.assign(COLORS, { ...COLORS_MALE, workout: "#CC0000", skincare: "#FF0000", diet: "#AA0000", nofap: "#FF0000" });
    } else {
      Object.assign(C, activeTheme);
      Object.assign(COLORS, isFemale ? COLORS_FEMALE : COLORS_MALE);
    }
  }, [isFemale, shadowMode]); // eslint-disable-line
  const [checkinLogs, setCheckinLogs] = useLS("anant_v3_checkin", {});
  const [xpToast, setXpToast] = useState(null);
  const [rankUpData, setRankUpData] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [subView, setSubView] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const today = selectedDate;
  const todayLogs = logs[today] || {};
const [journalLogs, setJournalLogs] = useLS("anant_v3_journal", {});
const [aiReviews, setAiReviews] = useLS("anant_v3_ai_reviews", {});
const [checkinDone, setCheckinDone] = useState(false);


  // XP backfill — runs once on mount
  useEffect(() => {
    const startDate = "2026-04-18";
    const days = [];
    let d = new Date(startDate);
    const todayD = new Date(todayKey());
    while (d <= todayD) { days.push(d.toISOString().split("T")[0]); d.setDate(d.getDate() + 1); }
setXpLogs(p => {
      const updated = { ...p };
      let changed = false;
      days.forEach(day => {
        if (updated[`bf_${day}`]) return;
        const dayLogs = logs[day] || {};
        let dayXP = 0;
        HABITS.forEach(h => { if (dayLogs[h.id]?.done) dayXP += XP_VALUES[h.id] || 10; });
        if (dayXP > 0) { updated[day] = (updated[day] || 0) + dayXP; updated[`bf_${day}`] = true; changed = true; }
      });
      return changed ? updated : p;
    });
  }, []); // eslint-disable-line

const [showCheckin, setShowCheckin] = useState(false); 
  const [sleepLogs, setSleepLogs] = useLS("anant_v3_sleep", {});
  const [measurements, setMeasurements] = useLS("anant_v3_measurements", {});
  const [quests, setQuests] = useLS("anant_v3_quests", {});

  useEffect(() => {
  const key = todayKey();
  if (!checkinLogs[key] && !checkinDone) {
    setShowCheckin(true);
  }
}, [todayKey()]); // This ensures it checks on new day

  function toggleHabit(id) {
    const currentlyDone = todayLogs[id]?.done;
    setLogs(p => {
      const d = { ...(p[today] || {}) };
      d[id] = { ...d[id], done: !d[id]?.done };
      return { ...p, [today]: d };
    });
    if (!currentlyDone) {
      const baseXP = XP_VALUES[id] || 10;
      const streak = getStreak(id);
      const multiplier = streak >= 90 ? 5 : streak >= 30 ? 3 : streak >= 7 ? 2 : 1;
      const earned = baseXP * multiplier;
      setXpLogs(p => ({ ...p, [today]: (p[today] || 0) + earned }));
      const oldRank = getCurrentRank(getTotalXP(xpLogs));
      const newTotalXP = getTotalXP(xpLogs) + earned;
      const newRank = getCurrentRank(newTotalXP);
      const isRankUp = newRank.rank !== oldRank.rank;
      if (isRankUp) {
        setRankUpData(newRank);
        setTimeout(() => setRankUpData(null), 3500);
      } else {
        setXpToast(`+${earned} XP`);
        setTimeout(() => setXpToast(null), 2000);
      }
      checkAchievements(id);
    } else {
      setXpLogs(p => ({ ...p, [today]: Math.max(0, (p[today] || 0) - (XP_VALUES[id] || 10)) }));
    }
  }

  function checkAchievements(habitId) {
    const newA = [];
    const totalDone = HABITS.filter(h => todayLogs[h.id]?.done).length;
    if (totalDone === 0) newA.push("first_habit");
    if (habitId === "h4") newA.push("first_workout");
    if (totalDone + 1 >= HABITS.length) newA.push("full_day");
    const streak = getStreak(habitId);
    if (streak >= 6)  newA.push("streak_7");
    if (streak >= 29) newA.push("streak_30");
    if (streak >= 89) newA.push("streak_90");
    newA.forEach(achId => {
      if (!achievements.includes(achId)) {
        const ach = ACHIEVEMENTS_LIST.find(a => a.id === achId);
        if (ach) {
          setAchievements(p => [...p, achId]);
          setXpLogs(p => ({ ...p, [today]: (p[today] || 0) + ach.xp }));
          setXpToast(`🏆 ${ach.title} +${ach.xp} XP`);
          setTimeout(() => setXpToast(null), 3000);
        }
      }
    });
  }

  function setQty(id, val) {
    setLogs(p => {
      const d = { ...(p[today] || {}) };
      d[id] = { done: parseFloat(val) > 0, value: parseFloat(val) };
      return { ...p, [today]: d };
    });
  }

  // FIX: dayOfWeek correctly used, not shadowed
  function getStreak(id) {
    const habit = HABITS.find(h => h.id === id);
    let s = 0, d = new Date();
    while (true) {
      const k = d.toISOString().split("T")[0];
      const dow = d.getDay();
      if (logs[k]?.[id]?.done) { s++; d.setDate(d.getDate() - 1); }
      else if (habit?.skipDay !== undefined && dow === habit.skipDay) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  }

  function getNofapStreak() {
  let streak = 0;
  let d = new Date();
  while (true) {
    const k = new Date(d.getTime() - streak * 86400000).toISOString().split("T")[0];
    if (logs[k]?.h9?.done) streak++;
    else break;
  }
  return streak;
}

  function getTodayPct() { return Math.round((HABITS.filter(h => todayLogs[h.id]?.done).length / HABITS.length) * 100); }
  function getWeeklyPct() {
    const days = last7(); let done = 0;
    days.forEach(d => HABITS.forEach(h => { if (logs[d]?.[h.id]?.done) done++; }));
    return Math.round((done / (HABITS.length * 7)) * 100);
  }
  function getTodayMacros() {
    const MEAL_EST = {
      m1: { protein: 40, calories: 700, carbs: 55, fat: 28, fibre: 5 },
      m2: { protein: 30, calories: 500, carbs: 70, fat: 8,  fibre: 6 },
      m3: { protein: 8,  calories: 280, carbs: 32, fat: 14, fibre: 3 },
      m4: { protein: 50, calories: 650, carbs: 80, fat: 16, fibre: 7 },
      m5: { protein: 40, calories: 650, carbs: 65, fat: 18, fibre: 8 },
      m6: { protein: 10, calories: 250, carbs: 18, fat: 12, fibre: 1 },
    };
    const dayLog = foodLogs[today] || {};
    return Object.entries(dayLog).reduce((acc, [id, entry]) => {
      const done = entry === true || (typeof entry === "object" && entry?.done);
      if (!done) return acc;
      const macros = (typeof entry === "object" && entry?.macros) ? entry.macros : (MEAL_EST[id] || {});
      return {
        calories: acc.calories + (macros.calories || 0),
        protein:  acc.protein  + (macros.protein  || 0),
        carbs:    acc.carbs    + (macros.carbs    || 0),
        fat:      acc.fat      + (macros.fat      || 0),
        fibre:    acc.fibre    + (macros.fibre    || 0),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
  }

  if (subView === "workoutlog") return <WorkoutLogger workoutLogs={workoutLogs} setWorkoutLogs={setWorkoutLogs} workoutPlan={workoutPlan} onBack={() => setSubView(null)} />;
  if (subView === "foodlog")    return <FoodLogger foodLogs={foodLogs} setFoodLogs={setFoodLogs} onBack={() => setSubView(null)} />;
  if (subView === "analytics")  return <AnalyticsView logs={logs} workoutLogs={workoutLogs} foodLogs={foodLogs} nofapStreak={getNofapStreak()} weightLogs={weightLogs} checkinLogs={checkinLogs} sleepLogs={sleepLogs} onBack={() => setSubView(null)} setView={setView} setSelectedDate={setSelectedDate} />;
  if (subView === "measurements") return <MeasurementsView measurements={measurements} setMeasurements={setMeasurements} onBack={() => setSubView(null)} />;
  if (subView === "heatmap") return <HeatmapFullView logs={logs} checkinLogs={checkinLogs} sleepLogs={sleepLogs} onBack={() => setSubView(null)} setSelectedDate={setSelectedDate} setView={setView} />;
  if (subView === "journal") return <JournalFullView journalLogs={journalLogs} setJournalLogs={setJournalLogs} checkinLogs={checkinLogs} logs={logs} workoutLogs={workoutLogs} onBack={() => setSubView(null)} />;
  if (subView === "aicoach") return <AICoachFullView logs={logs} workoutLogs={workoutLogs} foodLogs={foodLogs} checkinLogs={checkinLogs} journalLogs={journalLogs} xpLogs={xpLogs} aiReviews={aiReviews} setAiReviews={setAiReviews} nofapStreak={getNofapStreak()} onBack={() => setSubView(null)} />;
  if (subView === "quests") return <DailyQuestsFullView quests={quests} setQuests={setQuests} logs={logs} setLogs={setLogs} xpLogs={xpLogs} setXpLogs={setXpLogs} checkinLogs={checkinLogs} sleepLogs={sleepLogs} workoutLogs={workoutLogs} foodLogs={foodLogs} onBack={() => setSubView(null)} />;
  if (subView === "sleep") return <SleepFullView 
  sleepLogs={sleepLogs} 
  setSleepLogs={setSleepLogs} 
  logs={logs} 
  setLogs={setLogs} 
  xpLogs={xpLogs} 
  setXpLogs={setXpLogs} 
  onBack={() => setSubView(null)} 
  selectedDate={selectedDate} 
/>;
 if (subView === "profile") return <ProfilePage userProfile={userProfile} setUserProfile={setUserProfile} onBack={() => setSubView(null)} isFemale={isFemale} shadowMode={shadowMode} setShadowMode={setShadowMode} supaUser={supaUser} />;
  if (subView === "settings") return <SettingsPage userProfile={userProfile} setUserProfile={setUserProfile} onBack={() => setSubView(null)} isFemale={isFemale} onResetOnboarding={() => { setShowOnboarding(true); setSubView(null); }} />;
  if (subView === "about") return <AboutPage onBack={() => setSubView(null)} />; if (subView === "backup") return <BackupFullView logs={logs} workoutLogs={workoutLogs} foodLogs={foodLogs} weightLogs={weightLogs} xpLogs={xpLogs} achievements={achievements} sleepLogs={sleepLogs} measurements={measurements} checkinLogs={checkinLogs} journalLogs={journalLogs} aiReviews={aiReviews} quests={quests} setLogs={setLogs} setWorkoutLogs={setWorkoutLogs} setFoodLogs={setFoodLogs} setWeightLogs={setWeightLogs} setXpLogs={setXpLogs} setAchievements={setAchievements} setSleepLogs={setSleepLogs} setMeasurements={setMeasurements} setCheckinLogs={setCheckinLogs} setJournalLogs={setJournalLogs} setAiReviews={setAiReviews} setQuests={setQuests} onBack={() => setSubView(null)} />;

  // Auth gate — shown before anything else if user hasn't passed it yet
  if (!authGatePassed) return (
    <ThemeContext.Provider value={{ theme: activeTheme, isFemale }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Cormorant+Garamond:wght@600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button{cursor:pointer;font-family:inherit}`}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#07070A", zIndex: 999999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", fontFamily: "'DM Mono',monospace", padding: "0 0 0 0" }}>
        {/* Top section */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚡</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 40, fontWeight: 700, color: "#E8E4DC", marginBottom: 10, lineHeight: 1 }}>Self System</div>
          <div style={{ fontSize: 12, color: "#3A3A48", lineHeight: 1.9, maxWidth: 280 }}>
            Your personal operating system for discipline, growth, and becoming who you're meant to be.
          </div>
        </div>
        {/* Bottom sheet */}
        <div style={{ width: "100%", maxWidth: 480, background: "#0D0D12", borderRadius: "24px 24px 0 0", padding: "32px 24px 52px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color: "#E8E4DC", marginBottom: 4 }}>Get started.</div>
          <div style={{ fontSize: 12, color: "#3A3A48", lineHeight: 1.7, marginBottom: 4 }}>
            Create an account to sync your data across devices, or continue as a guest.
          </div>
          <button onClick={() => setShowAuthModal(true)} style={{ width: "100%", background: "#C9A96E", border: "none", borderRadius: 12, padding: "14px", color: "#000", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>
            Sign In / Sign Up
          </button>
          <button onClick={() => { setAuthGatePassed(true); }} style={{ width: "100%", background: "none", border: "1px solid #16161E", borderRadius: 12, padding: "13px", color: "#3A3A48", fontSize: 12, fontFamily: "inherit" }}>
            Continue as Guest →
          </button>
        </div>
      </div>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onAuthComplete={() => { setAuthGatePassed(true); setShowAuthModal(false); }} />}
    </ThemeContext.Provider>
  );

  if (showOnboarding) return (
    <ThemeContext.Provider value={{ theme: activeTheme, isFemale }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Cormorant+Garamond:wght@600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0} button{cursor:pointer;font-family:inherit}`}</style>
      <OnboardingFlow onComplete={(data) => {
        setUserProfile(data);
        setShowOnboarding(false);
      }} />
    </ThemeContext.Provider>
  );
  return (
    <ThemeContext.Provider value={{ theme: activeTheme, isFemale }}>
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", width: "100vw", maxWidth: "100%", margin: "0 auto", paddingBottom: 80, overflowX: "hidden", position: "relative" }}>
      <StorageGuard />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Cormorant+Garamond:wght@600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:0}
        .press{transition:transform 0.15s ease,opacity 0.15s ease;cursor:pointer}
        .press:active{transform:scale(0.96);opacity:0.8}
        .fade{animation:fd 0.28s cubic-bezier(0.4,0,0.2,1)}
        @keyframes fd{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .habit-row{transition:background 0.2s ease,border-color 0.2s ease,transform 0.15s ease}
        .habit-row:active{transform:scale(0.98)}
        .sidebar-item{transition:background 0.15s ease,color 0.15s ease}
        .sidebar-item:hover{background:rgba(255,255,255,0.04)}
        .ring-track{transition:stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)}
        input,textarea{background:#0D0D12;border:1px solid #16161E;color:#E8E4DC;border-radius:7px;padding:8px 10px;font-family:inherit;font-size:13px;outline:none;transition:border 0.2s}
        input:focus,textarea:focus{border-color:#2A2A3A}
        button{cursor:pointer;font-family:inherit}
      `}</style>

      {/* Header */}
      <div style={{ padding: "60px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: shadowMode ? "1px solid #FF000030" : "none", paddingBottom: shadowMode ? 12 : 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", padding: "0 0 4px 0", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ width: 20, height: 2, background: C.muted, borderRadius: 2 }} />
            <div style={{ width: 14, height: 2, background: C.muted, borderRadius: 2 }} />
            <div style={{ width: 17, height: 2, background: C.muted, borderRadius: 2 }} />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div style={{ fontSize: 10, letterSpacing: 4, color: C.muted, textTransform: "uppercase" }}>Self System</div>
  <button onClick={() => setShowAuthModal(true)} style={{ background: "none", border: `1px solid ${supaUser ? "#7EB8A4" : C.border}`, borderRadius: 6, padding: "2px 8px", color: supaUser ? "#7EB8A4" : C.muted, fontSize: 9, fontFamily: "inherit", letterSpacing: 1 }}>
    {supaUser ? "☁ Synced" : "☁ Sync"}
  </button>
</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{userProfile?.name || "Anant"}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split("T")[0]); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer" }}>‹</button>
            <div style={{ fontSize: 10, color: selectedDate === todayKey() ? C.muted : C.nofap, letterSpacing: 1 }}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </div>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); const next = d.toISOString().split("T")[0]; if (next <= todayKey()) setSelectedDate(next); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 16, cursor: "pointer" }}>›</button>
          </div>
          <div style={{ fontSize: 24, color: C.skincare, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, marginTop: 4 }}>{getTodayPct()}%</div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2 }}>TODAY</div>
          {(() => {
            const totalXP = getTotalXP(xpLogs);
            const rank = getCurrentRank(totalXP);
            return <div style={{ fontSize: 9, color: shadowMode ? "#FF0000" : rank.color, letterSpacing: 1, marginTop: 2, textShadow: `0 0 8px ${shadowMode ? "#FF0000" : rank.color}` }}>{shadowMode ? "⚠ SHADOW MODE" : `[${rank.rank}] ${rank.title}`}</div>;
          })()}
        </div>
      </div>

{/* Sidebar */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99990, display: "flex" }} onClick={() => setSidebarOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "82%", maxWidth: 320, height: "100%", background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflowY: "auto", animation: "slideIn 0.25s ease" }}>
            <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>

            {/* Profile Card */}
            <div style={{ padding: "60px 20px 20px", background: C.faint, borderBottom: `1px solid ${C.border}` }}>
              {(() => {
                const totalXP = getTotalXP(xpLogs);
                const rank = getCurrentRank(totalXP);
                const nextRank = getNextRank(totalXP);
                const pct = nextRank.xpRequired === rank.xpRequired ? 100 : Math.round(((totalXP - rank.xpRequired) / (nextRank.xpRequired - rank.xpRequired)) * 100);
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
                        <svg width={52} height={52} style={{ transform: "rotate(-90deg)" }}>
                          <circle cx={26} cy={26} r={22} fill="none" stroke={C.faint} strokeWidth={4} />
                          <circle cx={26} cy={26} r={22} fill="none" stroke={rank.color} strokeWidth={4} strokeLinecap="round" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 - (pct / 100) * 2 * Math.PI * 22} />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: rank.color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{rank.rank}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: C.text }}>{userProfile?.name || "Anant"}</div>
                        {userProfile?.alterEgo?.name && <div style={{ fontSize: 10, color: rank.color, letterSpacing: 1, marginTop: 2 }}>{userProfile.alterEgo.name}</div>}
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{totalXP.toLocaleString()} XP · {rank.title}</div>
                      </div>
                    </div>
                    <div style={{ background: C.border, borderRadius: 3, height: 3, marginBottom: 12 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: rank.color, borderRadius: 3 }} />
                    </div>
                    <button onClick={() => { setSubView("profile"); setSidebarOpen(false); }} style={{ width: "100%", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", color: C.muted, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>✎ Edit Profile</button>
                  </div>
                );
              })()}
            </div>

            {/* Nav Sections */}
            <div style={{ flex: 1, padding: "16px 0" }}>

              {/* Main Navigation */}
              <div style={{ padding: "0 16px", marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Navigate</div>
                {[
                  { icon: "◎", label: "Home", action: () => { setView("dashboard"); setSidebarOpen(false); } },
                  { icon: "◉", label: "Today", action: () => { setView("habits"); setSidebarOpen(false); } },
                  { icon: "◈", label: "Log", action: () => { setView("log"); setSidebarOpen(false); } },
                  { icon: "◆", label: "Plans", action: () => { setView("routines"); setSidebarOpen(false); } },
                  { icon: "★", label: "Rank", action: () => { setView("stats"); setSidebarOpen(false); } },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action} style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 9, color: C.text, fontFamily: "inherit", fontSize: 13, cursor: "pointer", textAlign: "left", marginBottom: 2 }}>
                    <span style={{ color: C.accent, fontSize: 14, width: 18 }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ height: 1, background: C.border, margin: "8px 16px" }} />

              {/* Deep Features */}
              <div style={{ padding: "0 16px", marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Features</div>
                {[
                  { icon: "◎", label: "Analytics", action: () => { setSubView("analytics"); setSidebarOpen(false); } },
                  { icon: "◈", label: "Habit Heatmap", action: () => { setSubView("heatmap"); setSidebarOpen(false); } },
                  { icon: "✦", label: "Journal", action: () => { setSubView("journal"); setSidebarOpen(false); } },
                  { icon: "◉", label: "AI Coach", action: () => { setSubView("aicoach"); setSidebarOpen(false); } },
                  { icon: "◆", label: "Body Measurements", action: () => { setSubView("measurements"); setSidebarOpen(false); } },
                  { icon: "★", label: "Daily Quests", action: () => { setSubView("quests"); setSidebarOpen(false); } },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action} style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 9, color: C.text, fontFamily: "inherit", fontSize: 13, cursor: "pointer", textAlign: "left", marginBottom: 2 }}>
                    <span style={{ color: C.accent, fontSize: 14, width: 18 }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ height: 1, background: C.border, margin: "8px 16px" }} />

              {/* Threats */}
              {getDemonData(logs).length > 0 && (
                <div style={{ padding: "0 16px", marginBottom: 6 }}>
                  <div style={{ fontSize: 9, color: C.nofap, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>⚠ Threats</div>
                  {getDemonData(logs).map(d => (
                    <div key={d.cat} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, marginBottom: 3, background: `${d.color}10` }}>
                      <span style={{ fontSize: 14 }}>{d.isMajor ? "👹" : "👤"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: d.color }}>{d.name}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>{d.missStreak}d · Power {d.hp}/100</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ height: 1, background: C.border, margin: "8px 0 14px" }} />
                </div>
              )}

              {/* Tools */}
              <div style={{ padding: "0 16px", marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Tools</div>
                {[
                  { icon: "☽", label: "Sleep Schedule", action: () => { setSubView("sleep"); setSidebarOpen(false); } },
                  { icon: "◇", label: "Data Backup", action: () => { setSubView("backup"); setSidebarOpen(false); } },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action} style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 9, color: C.text, fontFamily: "inherit", fontSize: 13, cursor: "pointer", textAlign: "left", marginBottom: 2 }}>
                    <span style={{ color: C.accent, fontSize: 14, width: 18 }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ height: 1, background: C.border, margin: "8px 16px" }} />

              {/* Bottom */}
              <div style={{ padding: "0 16px" }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Settings</div>
                <button onClick={() => { setSubView("profile"); setSidebarOpen(false); }} style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 9, color: C.muted, fontFamily: "inherit", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 14, width: 18 }}>◎</span> Profile
                </button>
                <button onClick={() => { setSubView("settings"); setSidebarOpen(false); }} style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 9, color: C.muted, fontFamily: "inherit", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 14, width: 18 }}>⚙</span> Settings
                </button>
                <button onClick={() => { setSubView("about"); setSidebarOpen(false); }} style={{ width: "100%", background: "none", border: "none", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 9, color: C.muted, fontFamily: "inherit", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 14, width: 18 }}>✦</span> About
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XP Toast */}
      {/* XP Toast */}
      {xpToast && (
        <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: "rgba(7,7,10,0.95)", border: "1px solid #FF000060", borderRadius: 10, padding: "10px 20px", color: "#FF0000", fontSize: 13, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, zIndex: 99999, letterSpacing: 1, boxShadow: "0 0 20px #FF000040" }}>
          {xpToast}
        </div>
      )}

      {/* Rank Up Overlay */}
      {rankUpData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999998, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <style>{`
            @keyframes rankFlash{0%{opacity:0}10%{opacity:0.18}30%{opacity:0.12}100%{opacity:0}}
            @keyframes rankCard{0%{opacity:0;transform:scale(0.8) translateY(20px)}20%{opacity:1;transform:scale(1.05) translateY(0)}80%{opacity:1;transform:scale(1) translateY(0)}100%{opacity:0;transform:scale(0.95) translateY(-10px)}}
          `}</style>
          {/* Flash */}
          <div style={{ position: "absolute", inset: 0, background: rankUpData.color, animation: "rankFlash 3.5s ease forwards" }} />
          {/* Card */}
          <div style={{ position: "relative", background: "rgba(7,7,10,0.97)", border: `2px solid ${rankUpData.color}`, borderRadius: 20, padding: "36px 40px", textAlign: "center", animation: "rankCard 3.5s ease forwards", boxShadow: `0 0 60px ${rankUpData.color}60, 0 0 120px ${rankUpData.color}20` }}>
            <div style={{ fontSize: 11, color: rankUpData.color, letterSpacing: 5, textTransform: "uppercase", marginBottom: 10 }}>Rank Up</div>
            <div style={{ fontSize: 72, color: rankUpData.color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, lineHeight: 1, textShadow: `0 0 30px ${rankUpData.color}` }}>{rankUpData.rank}</div>
            <div style={{ fontSize: 18, color: "#C0C0C0", fontFamily: "'Cormorant Garamond',serif", marginTop: 8, letterSpacing: 2 }}>{rankUpData.title}</div>
            <div style={{ fontSize: 11, color: rankUpData.color, marginTop: 16, opacity: 0.8 }}>You are becoming unstoppable.</div>
          </div>
        </div>
      )}
{showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onAuthComplete={() => setShowAuthModal(false)} />}
      {showCheckin && (
  <DailyCheckin
    onComplete={(data) => {
      setCheckinLogs(p => ({ ...p, [todayKey()]: data }));
      setShowCheckin(false);
      setCheckinDone(true);
    }}
    onSkip={() => { setShowCheckin(false); setCheckinDone(true); }}
  />
)}


      {/* Views */}
      <div className="fade" key={view} style={{ padding: "20px 20px 0" }}>
        {view === "dashboard" && <Dashboard logs={logs} nofapStreak={getNofapStreak()} weeklyPct={getWeeklyPct()} todayPct={getTodayPct()} getStreak={getStreak} setView={setView} setSelectedRoutine={setSelectedRoutine} todayLogs={todayLogs} setSubView={setSubView} todayMacros={getTodayMacros()} />}
        {view === "habits"    && <HabitsView todayLogs={todayLogs} toggleHabit={toggleHabit} setQty={setQty} getStreak={getStreak} />}
        {view === "routines"  && <RoutinesView selected={selectedRoutine} setSelected={setSelectedRoutine} nofapStreak={getNofapStreak()} setNofapStart={setNofapStart} nofapHistory={nofapHistory} setNofapHistory={setNofapHistory} workoutPlan={workoutPlan} setWorkoutPlan={setWorkoutPlan} skincarePlan={skincarePlan} setSkincarePlan={setSkincarePlan} dietPlan={dietPlan} setDietPlan={setDietPlan} haircarePlan={haircarePlan} setHaircarePlan={setHaircarePlan} spiritualPlan={spiritualPlan} setSpiritualPlan={setSpiritualPlan} />}
        {view === "log" && <LogHub setSubView={setSubView} todayMacros={getTodayMacros()} workoutLogs={workoutLogs} setWorkoutLogs={setWorkoutLogs} weightLogs={weightLogs} setWeightLogs={setWeightLogs} logs={logs} setLogs={setLogs} foodLogs={foodLogs} setFoodLogs={setFoodLogs} nofapStreak={getNofapStreak()} setNofapStart={setNofapStart} xpLogs={xpLogs} setXpLogs={setXpLogs} checkinLogs={checkinLogs} journalLogs={journalLogs} setJournalLogs={setJournalLogs} aiReviews={aiReviews} setAiReviews={setAiReviews} setAchievements={setAchievements} achievements={achievements} sleepLogs={sleepLogs} setSleepLogs={setSleepLogs} measurements={measurements} setMeasurements={setMeasurements} quests={quests} setQuests={setQuests} selectedDate={selectedDate} />}
        {view === "stats"     && <StatsView xpLogs={xpLogs} achievements={achievements} logs={logs} getStreak={getStreak} nofapStreak={getNofapStreak()} />}
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", background: shadowMode ? "rgba(2,2,4,0.98)" : "rgba(7,7,10,0.97)", backdropFilter: "blur(16px)", borderTop: `1px solid ${shadowMode ? "#FF000030" : C.border}`, display: "flex", padding: "12px 0 env(safe-area-inset-bottom, 16px)", zIndex: 9999 }}>
        {[["dashboard","◎","Home"],["habits","◉","Today"],["log","◈","Log"],["routines","◆","Plans"],["stats","★","Rank"]].map(([key, icon, label]) => (
          <button key={key} className="press" onClick={() => setView(key)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, color: view === key ? (shadowMode ? "#FF0000" : C.skincare) : C.muted }}>
            <span style={{ fontSize: 17 }}>{icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
    </ThemeContext.Provider>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ logs, nofapStreak, weeklyPct, todayPct, getStreak, setView, setSelectedRoutine, todayLogs, setSubView, todayMacros }) {
  const doneTodayCount = HABITS.filter(h => todayLogs[h.id]?.done).length;
  const topStreaks = HABITS.map(h => ({ ...h, streak: getStreak(h.id) })).sort((a, b) => b.streak - a.streak).slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 12px" }}>
        <Ring value={todayPct} size={120} color={C.skincare} label={`${doneTodayCount}/${HABITS.length}`} sublabel="done" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Stat label="NoFap"   value={`${nofapStreak}d`}                  color={C.nofap} />
        <Stat label="Weekly"  value={`${weeklyPct}%`}                    color={C.workout} />
        <Stat label="Calories" value={Math.round(todayMacros.calories)} color={C.diet} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["◆","Log Workout","workoutlog",C.workout],["◉","Meal Log","foodlog",C.diet],["◎","Analytics","analytics",C.skincare]].map(([icon, label, sub, color]) => (
          <button key={sub} className="press" onClick={() => setSubView(sub)} style={{ background: C.surface, border: `1px solid ${color}25`, borderRadius: 10, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: C.text }}>
            <span style={{ color, fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 10, color: C.muted, textAlign: "center", lineHeight: 1.3 }}>{label}</span>
          </button>
        ))}
      </div>
      {/* Nutrition strip */}
      <div style={{ background: C.surface, border: `1px solid ${C.diet}18`, borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 9, color: C.diet, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Today's Nutrition</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
          {[["Cal",Math.round(todayMacros.calories),""],["Pro",Math.round(todayMacros.protein),"g"],["Carb",Math.round(todayMacros.carbs),"g"],["Fat",Math.round(todayMacros.fat),"g"],["Fibre",Math.round(todayMacros.fibre),"g"]].map(([l, v, u]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, color: C.diet, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{v}{u}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginBottom: 4 }}>
            <span>Protein</span><span>{Math.round(todayMacros.protein)}/178g</span>
          </div>
          <div style={{ background: C.faint, borderRadius: 3, height: 3 }}>
            <div style={{ width: `${Math.min(100, (todayMacros.protein / 178) * 100)}%`, height: "100%", background: C.diet, borderRadius: 3 }} />
          </div>
        </div>
      </div>
{/* Demons */}
      {(() => {
        const demons = getDemonData(logs);
        if (!demons.length) return null;
        return (
          <div style={{ background: C.surface, border: `1px solid ${C.nofap}25`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 9, color: C.nofap, letterSpacing: 3, textTransform: "uppercase", marginBottom: 3 }}>Active Threats</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700 }}>Your Demons</div>
              </div>
              <div style={{ fontSize: 22, color: C.nofap, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{demons.length}</div>
            </div>
            {demons.map(d => <DemonCard key={d.cat} demon={d} />)}
          </div>
        );
      })()}
      {/* Streaks */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Streaks</div>
        {topStreaks.map((h, i) => (
          <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < topStreaks.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: COLORS[h.category], fontSize: 11 }}>{h.icon}</span>
              <span style={{ fontSize: 12, color: h.streak > 0 ? C.text : C.muted }}>{h.label}</span>
            </div>
            <span style={{ fontSize: 15, color: COLORS[h.category], fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{h.streak}<span style={{ fontSize: 10, color: C.muted }}>d</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HABITS VIEW ──────────────────────────────────────────────────────────────
function HabitsView({ todayLogs, toggleHabit, setQty, getStreak }) {
  const [editing, setEditing] = useState(false);
  const [habits, setHabits] = useLS("anant_v3_custom_habits", HABITS);
  useEffect(() => {
    setHabits(p => {
      const ids = p.map(h => h.id);
      const missing = HABITS.filter(h => !ids.includes(h.id));
      return missing.length ? [...p, ...missing] : p;
    });
  }, []); // eslint-disable-line
  const done = habits.filter(h => todayLogs[h.id]?.done).length;
  const categories = [...new Set(habits.map(h => h.category))];
  const ALL_CATEGORIES = ["skincare","workout","diet","nofap","haircare","spiritual","productivity","sleep"];

  function addHabit(cat, label = "New Habit") {
    const newId = `custom_${Date.now()}`;
    setHabits(p => [...p, { id: newId, label, category: cat, type: "binary", icon: "◉" }]);
  }
  function removeHabit(id) { setHabits(p => p.filter(h => h.id !== id)); }
  function updateHabit(id, field, val) { setHabits(p => p.map(h => h.id === id ? { ...h, [field]: val } : h)); }

 return (
    <div style={{ paddingBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase" }}>Today</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: C.skincare }}>{done}/{habits.length}</div>
          <button onClick={() => setEditing(e => !e)} style={editBtnStyle(editing)}>{editing ? "✓ Done" : "✎ Edit"}</button>
        </div>
      </div>
      {categories.map(cat => {
        const catH = habits.filter(h => h.category === cat);
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: COLORS[cat] || C.muted }} />
              <div style={{ fontSize: 9, color: COLORS[cat] || C.muted, letterSpacing: 3, textTransform: "uppercase" }}>{cat}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catH.map(h => {
                const log = todayLogs[h.id] || {};
                const streak = getStreak(h.id);
                return (
                 <div key={h.id} className="habit-row" style={{ background: log.done ? `${COLORS[h.category] || C.muted}0E` : C.surface, border: `1px solid ${log.done ? (COLORS[h.category] || C.muted) + "35" : C.border}`, borderRadius: 12, padding: "15px 16px", display: "flex", alignItems: "center", gap: 14, minHeight: 64 }}
                    onClick={() => !editing && h.type === "binary" && toggleHabit(h.id)}>
                    {!editing && (
                      <button onClick={e => { e.stopPropagation(); toggleHabit(h.id); }} style={{ width: 28, height: 28, borderRadius: 8, background: log.done ? COLORS[h.category] : "transparent", border: `2px solid ${log.done ? COLORS[h.category] : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s ease" }}>
                        {log.done && <span style={{ color: "#000", fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </button>
                    )}
                    <div style={{ flex: 1 }}>
                      {editing ? (
                        <input style={{ ...editInput, fontSize: 12 }} value={h.label} onChange={e => updateHabit(h.id, "label", e.target.value)} />
                      ) : (
                        <>
                         <div style={{ fontSize: 13, color: log.done ? C.text : "#777", fontWeight: log.done ? 500 : 400 }}>{h.label}</div>
                          {streak > 0 && <div style={{ fontSize: 10, color: COLORS[h.category], marginTop: 3, opacity: 0.8 }}>{streak}d streak 🔥</div>}
                        </>
                      )}
                    </div>
                    {editing ? (
                      <RemoveBtn onClick={() => removeHabit(h.id)} />
                    ) : h.type === "quantitative" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }} onClick={e => e.stopPropagation()}>
                        <input type="number" min={0} step={0.5} value={log.value || ""} placeholder={`/${h.target}`} onChange={e => setQty(h.id, e.target.value)} style={{ width: 60, padding: "5px 8px", fontSize: 12 }} />
                        <span style={{ fontSize: 10, color: C.muted }}>{h.unit}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {editing && <AddButton onClick={() => addHabit(cat)} label={`+ Add to ${cat}`} color={COLORS[cat] || C.muted} />}
          </div>
        );
      })}
      {editing && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Add habit to existing category</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {ALL_CATEGORIES.filter(c => !categories.includes(c)).map(c => (
              <button key={c} onClick={() => addHabit(c)} style={{ background: C.faint, border: `1px dashed ${COLORS[c] || C.muted}60`, borderRadius: 6, padding: "5px 10px", color: COLORS[c] || C.muted, fontSize: 10, fontFamily: "inherit" }}>+ {c}</button>
            ))}
          </div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Create new category</div>
          <NewCategoryInput onAdd={(catName) => {
            const normalized = catName.toLowerCase().trim();
            if (!normalized) return;
            addHabit(normalized);
          }} />
        </div>
      )}
    </div>
  );
}

function NewCategoryInput({ onAdd }) {
  const [name, setName] = useState("");
  const [firstHabit, setFirstHabit] = useState("");
  const [open, setOpen] = useState(false);

  function handleAdd() {
    if (!name.trim()) return;
    onAdd(name.trim(), firstHabit.trim() || "New Habit");
    setName(""); setFirstHabit(""); setOpen(false);
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width: "100%", background: C.faint, border: `1px dashed ${C.accent}60`, borderRadius: 8, padding: "9px", color: C.accent, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
      + Create New Category
    </button>
  );

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.accent}30`, borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 9, color: C.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>New Category</div>
      <input
        placeholder="Category name (e.g. reading, coding...)"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontFamily: "inherit", fontSize: 12, outline: "none" }}
      />
      <input
        placeholder="First habit name (optional)"
        value={firstHabit}
        onChange={e => setFirstHabit(e.target.value)}
        style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, fontFamily: "inherit", fontSize: 12, outline: "none" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { setOpen(false); setName(""); setFirstHabit(""); }} style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px", color: C.muted, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
        <button onClick={handleAdd} style={{ flex: 2, background: C.accent, border: "none", borderRadius: 8, padding: "8px", color: "#000", fontSize: 11, fontFamily: "inherit", cursor: "pointer", fontWeight: 600 }}>+ Add Category</button>
      </div>
    </div>
  );
}

function SleepCard({ sleepLogs, setSleepLogs, logs, setLogs, xpLogs, setXpLogs }) {
  const today = todayKey();
  const SLEEP_COLOR = "#7c6fa0";
  const XP_AMOUNT = 20;

  const parseTime = (t) => {
    if (!t) return { h: "", m: "", ampm: "PM" };
    const [hStr, mStr] = t.split(":");
    let h = parseInt(hStr); const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return { h: String(h), m, ampm };
  };

  const toTime24 = (h, m, ampm) => {
    if (!h) return "";
    let hour = parseInt(h);
    if (ampm === "AM" && hour === 12) hour = 0;
    if (ampm === "PM" && hour !== 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:${m || "00"}`;
  };

  // Always derive from sleepLogs[today] directly — no stale state
  const entry = sleepLogs[today] || {};
  const sleptOnTime = entry.sleptOnTime || false;
  const wokeOnTime = entry.wokeOnTime || false;

  const [bed, setBed] = useState(() => parseTime(entry.bedtime));
  const [wake, setWake] = useState(() => parseTime(entry.wakeTime));
  const [displayDate, setDisplayDate] = useState(today);

  // Reset pickers when TODAY changes (new day) OR when user navigates dates
  useEffect(() => {
    const e = sleepLogs[displayDate] || {};
    setBed(parseTime(e.bedtime));
    setWake(parseTime(e.wakeTime));
  }, [displayDate]); // eslint-disable-line

  // Also reset when today changes (midnight rollover)
  useEffect(() => {
    setDisplayDate(today);
  }, [today]); // eslint-disable-line

  const currentEntry = sleepLogs[displayDate] || {};
  const currentSleptOnTime = currentEntry.sleptOnTime || false;
  const currentWokeOnTime = currentEntry.wokeOnTime || false;

  const grantXP = (date) => {
    setXpLogs(p => ({ ...p, [date]: (p[date] || 0) + XP_AMOUNT }));
    setLogs(p => ({ ...p, [date]: { ...(p[date] || {}), h13: { done: true } } }));
  };
  const revokeXP = (date) => {
    setXpLogs(p => ({ ...p, [date]: Math.max(0, (p[date] || 0) - XP_AMOUNT) }));
    setLogs(p => ({ ...p, [date]: { ...(p[date] || {}), h13: { done: false } } }));
  };

  const updateEntry = (patch) => {
    const current = sleepLogs[displayDate] || {};
    const updated = { ...current, ...patch };
    setSleepLogs(p => ({ ...p, [displayDate]: updated }));
    const bothDone = updated.sleptOnTime && updated.wokeOnTime;
    const wasBothDone = current.sleptOnTime && current.wokeOnTime;
    if (bothDone && !wasBothDone) grantXP(displayDate);
    if (!bothDone && wasBothDone) revokeXP(displayDate);
  };

  const updateBedtime = (newBed) => {
    setBed(newBed);
    const t = toTime24(newBed.h, newBed.m, newBed.ampm);
    if (t) updateEntry({ bedtime: t });
  };

  const updateWakeTime = (newWake) => {
    setWake(newWake);
    const t = toTime24(newWake.h, newWake.m, newWake.ampm);
    if (t) updateEntry({ wakeTime: t });
  };

  const resetBedtime = () => {
    setBed({ h: "", m: "", ampm: "PM" });
    updateEntry({ bedtime: "" });
  };

  const resetWakeTime = () => {
    setWake({ h: "", m: "", ampm: "AM" });
    updateEntry({ wakeTime: "" });
  };

  const getDuration = () => {
    const bt = toTime24(bed.h, bed.m, bed.ampm);
    const wt = toTime24(wake.h, wake.m, wake.ampm);
    if (!bt || !wt) return null;
    const [bh, bm] = bt.split(":").map(Number);
    const [wh, wm] = wt.split(":").map(Number);
    let mins = (wh * 60 + wm) - (bh * 60 + bm);
    if (mins < 0) mins += 24 * 60;
    return parseFloat((mins / 60).toFixed(1));
  };
  const duration = getDuration();

  const last7Data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
    const k = ist.toISOString().split("T")[0];
    const e = sleepLogs[k] || {};
    const label = new Date(k + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" });
    let hours = 0;
    if (e.bedtime && e.wakeTime) {
      const [bh, bm] = e.bedtime.split(":").map(Number);
      const [wh, wm] = e.wakeTime.split(":").map(Number);
      let mins = (wh * 60 + wm) - (bh * 60 + bm);
      if (mins < 0) mins += 24 * 60;
      hours = parseFloat((mins / 60).toFixed(1));
    }
    return { k, label, both: (e.sleptOnTime && e.wokeOnTime) || false, hours };
  });

  const streak = (() => {
    let s = 0; let d = new Date();
    while (true) {
      const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      const k = ist.toISOString().split("T")[0];
      const e = sleepLogs[k];
      if (e && e.sleptOnTime && e.wokeOnTime) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  })();
  const weekScore = last7Data.filter(d => d.both).length;

  const TimePickerInline = ({ label, value, onChange, onReset }) => {
    const HOURS = ["1","2","3","4","5","6","7","8","9","10","11","12"];
    const MINS = ["00","05","10","15","20","25","30","35","40","45","50","55"];
    return (
      <div style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
          {value.h && (
            <button onClick={onReset} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 8px", color: C.muted, fontSize: 9, fontFamily: "inherit", cursor: "pointer" }}>Reset</button>
          )}
        </div>
        {value.h ? (
          <div style={{ fontSize: 20, color: SLEEP_COLOR, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, marginBottom: 10 }}>
            {value.h}:{value.m || "00"} {value.ampm}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>Not set</div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>HOUR</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {HOURS.map(h => (
                <button key={h} onClick={() => onChange({ ...value, h })} style={{ width: 28, height: 24, borderRadius: 5, background: value.h === h ? SLEEP_COLOR : C.surface, border: `1px solid ${value.h === h ? SLEEP_COLOR : C.border}`, color: value.h === h ? "#fff" : C.muted, fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>{h}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>MIN</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {MINS.map(m => (
                <button key={m} onClick={() => onChange({ ...value, m })} style={{ width: 28, height: 24, borderRadius: 5, background: value.m === m ? SLEEP_COLOR : C.surface, border: `1px solid ${value.m === m ? SLEEP_COLOR : C.border}`, color: value.m === m ? "#fff" : C.muted, fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1, marginBottom: 5 }}>AM/PM</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {["AM","PM"].map(ap => (
                <button key={ap} onClick={() => onChange({ ...value, ampm: ap })} style={{ width: 36, height: 24, borderRadius: 5, background: value.ampm === ap ? SLEEP_COLOR : C.surface, border: `1px solid ${value.ampm === ap ? SLEEP_COLOR : C.border}`, color: value.ampm === ap ? "#fff" : C.muted, fontSize: 10, fontFamily: "inherit", cursor: "pointer" }}>{ap}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${SLEEP_COLOR}30`, borderRadius: 14, padding: 16, marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: SLEEP_COLOR, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Sleep Schedule</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>Rest & Recovery</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Log on the date you woke up</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, color: SLEEP_COLOR, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, lineHeight: 1 }}>{streak > 0 ? streak : weekScore}</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{streak > 0 ? "day streak 🔥" : `${weekScore}/7 this week`}</div>
        </div>
      </div>

      {/* Date navigator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: C.faint, borderRadius: 10, padding: "8px 12px" }}>
        <button onClick={() => { const d = new Date(displayDate); d.setDate(d.getDate() - 1); setDisplayDate(d.toISOString().split("T")[0]); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 18, cursor: "pointer" }}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: displayDate === today ? C.muted : SLEEP_COLOR }}>
          {new Date(displayDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          {displayDate === today && <span style={{ fontSize: 9, color: C.muted }}> · Today</span>}
        </div>
        <button onClick={() => { const d = new Date(displayDate); d.setDate(d.getDate() + 1); const next = d.toISOString().split("T")[0]; if (next <= today) setDisplayDate(next); }} style={{ background: "none", border: "none", color: displayDate === today ? C.dim : C.muted, fontSize: 18, cursor: displayDate === today ? "default" : "pointer" }}>›</button>
      </div>

      {/* Target */}
      <div style={{ background: `${SLEEP_COLOR}12`, border: `1px solid ${SLEEP_COLOR}20`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: C.muted }}>Target</div>
        <div style={{ display: "flex", gap: 14 }}>
          {[["11:00 PM","Sleep by"],["6:00 AM","Wake at"],["7h","Duration"]].map(([val, sub]) => (
            <div key={sub} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: SLEEP_COLOR }}>{val}</div>
              <div style={{ fontSize: 9, color: C.muted }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {[{ key: "sleptOnTime", val: currentSleptOnTime, label: "Slept by 11:00 PM" }, { key: "wokeOnTime", val: currentWokeOnTime, label: "Woke at 6:00 AM" }].map(({ key, val, label }) => (
          <div key={key} onClick={() => updateEntry({ [key]: !val })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: val ? `${SLEEP_COLOR}12` : C.faint, border: `1px solid ${val ? SLEEP_COLOR + "40" : C.border}`, transition: "all 0.2s" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: val ? SLEEP_COLOR : "transparent", border: `2px solid ${val ? SLEEP_COLOR : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {val && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: val ? C.text : "#888" }}>{label}</span>
            {val && <span style={{ marginLeft: "auto", fontSize: 10, color: SLEEP_COLOR }}>✦</span>}
          </div>
        ))}
      </div>

      {/* Time pickers */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <TimePickerInline label="Bedtime (previous night)" value={bed} onChange={updateBedtime} onReset={resetBedtime} />
        <TimePickerInline label="Wake Time (this morning)" value={wake} onChange={updateWakeTime} onReset={resetWakeTime} />
      </div>

      {/* Duration */}
      {duration !== null && (
        <div style={{ background: `${duration >= 7 ? SLEEP_COLOR : C.nofap}12`, border: `1px solid ${duration >= 7 ? SLEEP_COLOR : C.nofap}30`, borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.muted }}>Duration logged</span>
          <span style={{ fontSize: 16, color: duration >= 7 ? SLEEP_COLOR : C.nofap, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{duration}h {duration >= 7 ? "✦" : "⚠"}</span>
        </div>
      )}

      {currentSleptOnTime && currentWokeOnTime && (
        <div style={{ background: `${SLEEP_COLOR}15`, border: `1px solid ${SLEEP_COLOR}30`, borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.muted }}>XP earned</span>
          <span style={{ fontSize: 13, color: SLEEP_COLOR }}>+{XP_AMOUNT} XP ✦</span>
        </div>
      )}

      {/* 7-day chart */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Last 7 Nights</div>
        <div style={{ display: "flex", gap: 4 }}>
          {last7Data.map((d, i) => (
            <div key={i} onClick={() => setDisplayDate(d.k)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <div style={{ width: "100%", height: 36, borderRadius: 5, background: d.both ? `${SLEEP_COLOR}70` : C.faint, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${d.k === displayDate ? SLEEP_COLOR : d.both ? SLEEP_COLOR + "50" : C.border}` }}>
                {d.hours > 0 && <span style={{ fontSize: 8, color: d.both ? "#fff" : C.muted }}>{d.hours}h</span>}
              </div>
              <div style={{ fontSize: 8, color: d.k === displayDate ? SLEEP_COLOR : C.muted }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DAILY QUESTS ─────────────────────────────────────────────────────────────
const QUEST_POOL = [
  { id: "q_all_skincare", label: "Complete all skincare steps", category: "skincare", xp: 25, check: (logs, t) => ["h1","h2","h3"].every(h => logs[t]?.[h]?.done) },
  { id: "q_workout", label: "Log a workout today", category: "workout", xp: 50, check: (_, __, wl, t) => Object.values(wl[t] || {}).some(ex => ex.sets?.length > 0) },
  { id: "q_protein", label: "Hit your protein goal", category: "diet", xp: 30, check: (logs, t) => logs[t]?.h5?.done },
  { id: "q_all_meals", label: "Complete all 6 meals", category: "diet", xp: 35, check: (logs, t) => logs[t]?.h7?.done },
  { id: "q_water", label: "Hit 3L water intake", category: "diet", xp: 25, check: (logs, t) => (logs[t]?.h6?.value || 0) >= 3 },
  { id: "q_nofap", label: "Stay clean today", category: "nofap", xp: 40, check: (logs, t) => logs[t]?.h9?.done },
  { id: "q_guitar", label: "Practice guitar today", category: "productivity", xp: 30, check: (logs, t) => logs[t]?.h10?.done },
  { id: "q_pooja", label: "Complete your pooja", category: "spiritual", xp: 25, check: (logs, t) => logs[t]?.h12?.done },
  { id: "q_sleep", label: "Sleep & wake on schedule", category: "sleep", xp: 30, check: (_, t, __, ___, sl) => sl[t]?.sleptOnTime && sl[t]?.wokeOnTime },
  { id: "q_no_junk", label: "Zero junk food today", category: "diet", xp: 25, check: (logs, t) => logs[t]?.h11?.done },
  { id: "q_supplements", label: "Take all supplements", category: "diet", xp: 20, check: (logs, t) => logs[t]?.h8?.done },
  { id: "q_sunscreen", label: "Apply sunscreen", category: "skincare", xp: 15, check: (logs, t) => logs[t]?.h3?.done },
  { id: "q_perfect_day", label: "Complete 10+ habits", category: "workout", xp: 75, check: (logs, t) => HABITS.filter(h => logs[t]?.[h.id]?.done).length >= 10 },
  { id: "q_all_diet", label: "Complete all diet habits", category: "diet", xp: 60, check: (logs, t) => ["h5","h7","h8","h11"].every(h => logs[t]?.[h]?.done) },
];

function getWeakCategories(logs, checkinLogs) {
  const range = Array.from({ length: 14 }, (_, i) => dateKey(-(13 - i)));
  const catScores = {};
  Object.keys(COLORS).forEach(cat => {
    const catH = HABITS.filter(h => h.category === cat);
    if (!catH.length) return;
    let done = 0, total = 0;
    range.forEach(d => catH.forEach(h => { total++; if (logs[d]?.[h.id]?.done) done++; }));
    catScores[cat] = total ? done / total : 0;
  });
  return Object.entries(catScores).sort((a, b) => a[1] - b[1]).map(([cat]) => cat);
}

function generateDailyQuests(logs, checkinLogs, sleepLogs, workoutLogs, foodLogs) {
  const weak = getWeakCategories(logs, checkinLogs);
  const today = todayKey();
  // Weight quests by weak category
  const weighted = QUEST_POOL.map(q => ({
    ...q,
    weight: weak.indexOf(q.category) !== -1 ? (5 - Math.min(weak.indexOf(q.category), 4)) : 1
  }));
  // Shuffle weighted
  const pool = [];
  weighted.forEach(q => { for (let i = 0; i < q.weight; i++) pool.push(q); });
  const shuffled = pool.sort(() => {
    // deterministic seed from today's date
    const seed = parseInt(today.replace(/-/g, "")) % 997;
    return (Math.sin(seed + pool.indexOf(pool[0])) * 10000) % 1 - 0.5;
  });
  const seen = new Set();
  const picked = [];
  for (const q of shuffled) {
    if (!seen.has(q.id) && picked.length < 3) { seen.add(q.id); picked.push(q); }
  }
  return picked;
}

function DailyQuestsCard({ quests, setQuests, logs, setLogs, xpLogs, setXpLogs, checkinLogs, sleepLogs, workoutLogs, foodLogs, viewDate }) {
  const today = todayKey();
  const displayDate = viewDate || today;
  const isToday = displayDate === today;
  const todayQuests = quests[displayDate];

  useEffect(() => {
    if (!quests[today]) {
      const generated = generateDailyQuests(logs, checkinLogs, sleepLogs, workoutLogs, foodLogs);
      setQuests(p => ({ ...p, [today]: generated.map(q => ({ ...q, completed: false, xpAwarded: false })) }));
    }
  }, []); // eslint-disable-line

  // Generate quests for displayDate if viewing a past date that has none but has log data
  useEffect(() => {
    if (!quests[displayDate] && displayDate !== today) {
      const generated = generateDailyQuests(logs, checkinLogs, sleepLogs, workoutLogs, foodLogs);
      // Use deterministic generation based on the display date
      setQuests(p => ({ ...p, [displayDate]: generated.map(q => ({ ...q, completed: false, xpAwarded: false })) }));
    }
  }, [displayDate]); // eslint-disable-line

  // Auto-complete quests based on habit state — only for today
  useEffect(() => {
    if (!isToday) return;
    const currentQuests = quests[today];
    if (!currentQuests) return;
    let changed = false;
    const updated = currentQuests.map(q => {
      if (q.completed) return q;
      const poolQuest = QUEST_POOL.find(p => p.id === q.id);
      if (!poolQuest?.check) return q;
      const done = poolQuest.check(logs, today, workoutLogs, foodLogs, sleepLogs);
      if (done) { changed = true; return { ...q, completed: true }; }
      return q;
    });
    if (changed) {
      updated.forEach((q, i) => {
        if (q.completed && !currentQuests[i].xpAwarded) {
          setXpLogs(p => ({ ...p, [today]: (p[today] || 0) + q.xp }));
          updated[i] = { ...q, xpAwarded: true };
        }
      });
      setQuests(p => ({ ...p, [today]: updated }));
    }
  }, [logs, sleepLogs, workoutLogs]); // eslint-disable-line

  if (!todayQuests) return null;
  const completedCount = todayQuests.filter(q => q.completed).length;

  return (
    <div style={{ background: C.surface, border: `1px solid #FFD70025`, borderRadius: 14, padding: 16, marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: "#FFD700", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Daily Quests</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            {isToday ? "Today's Challenges" : new Date(displayDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
          </div>
          {!isToday && <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Past day — read only</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, color: "#FFD700", fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{completedCount}/3</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>completed</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {todayQuests.map((q) => (
          <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: q.completed ? `#FFD70010` : C.faint, border: `1px solid ${q.completed ? "#FFD70040" : C.border}`, transition: "all 0.3s" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: q.completed ? "#FFD700" : "transparent", border: `2px solid ${q.completed ? "#FFD700" : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {q.completed && <span style={{ color: "#000", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: q.completed ? C.text : "#888" }}>{q.label}</div>
              <div style={{ fontSize: 10, color: COLORS[q.category] || C.muted, marginTop: 2 }}>{q.category}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#FFD700" }}>+{q.xp} XP</div>
              {q.completed && <div style={{ fontSize: 9, color: C.muted }}>earned ✦</div>}
            </div>
          </div>
        ))}
      </div>
      {completedCount === 3 && (
        <div style={{ marginTop: 12, background: "#FFD70015", border: "1px solid #FFD70030", borderRadius: 8, padding: "8px 14px", textAlign: "center", fontSize: 12, color: "#FFD700" }}>
          All quests complete. Legendary day. ✦
        </div>
      )}
    </div>
  );
}

// ─── MEASUREMENTS VIEW ────────────────────────────────────────────────────────
const MEASUREMENT_FIELDS = [
  { id: "chest", label: "Chest", unit: "cm", icon: "◆" },
  { id: "shoulder", label: "Shoulder Width", unit: "cm", icon: "◆" },
  { id: "waist", label: "Waist", unit: "cm", icon: "◆" },
  { id: "hips", label: "Hips", unit: "cm", icon: "◆" },
  { id: "neck", label: "Neck", unit: "cm", icon: "◆" },
  { id: "arm_l", label: "Left Arm", unit: "cm", icon: "◆" },
  { id: "arm_r", label: "Right Arm", unit: "cm", icon: "◆" },
  { id: "forearm_l", label: "Left Forearm", unit: "cm", icon: "◆" },
  { id: "forearm_r", label: "Right Forearm", unit: "cm", icon: "◆" },
  { id: "thigh_l", label: "Left Thigh", unit: "cm", icon: "◆" },
  { id: "thigh_r", label: "Right Thigh", unit: "cm", icon: "◆" },
  { id: "calf_l", label: "Left Calf", unit: "cm", icon: "◆" },
  { id: "calf_r", label: "Right Calf", unit: "cm", icon: "◆" },
];

function MeasurementsView({ measurements, setMeasurements, onBack }) {
  const today = todayKey();
  const [inputs, setInputs] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedField, setSelectedField] = useState(null);

  const allDates = Object.keys(measurements).sort();
  const latest = allDates.length ? measurements[allDates[allDates.length - 1]] : {};
  const prev = allDates.length > 1 ? measurements[allDates[allDates.length - 2]] : {};

  function saveAll() {
    const filtered = Object.fromEntries(Object.entries(inputs).filter(([_, v]) => v !== ""));
    if (Object.keys(filtered).length === 0) return;
    setMeasurements(p => ({ ...p, [today]: { ...(p[today] || {}), ...Object.fromEntries(Object.entries(filtered).map(([k, v]) => [k, parseFloat(v)])) } }));
    setInputs({});
    setShowForm(false);
  }

  function getHistory(fieldId) {
    return allDates.map(d => ({ date: d, value: measurements[d]?.[fieldId] })).filter(d => d.value != null).slice(-8);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1 }}>← Back</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Body Measurements</div>
      </div>

      {/* Log new measurements button */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ width: "100%", background: C.faint, border: `1px dashed ${C.haircare}40`, borderRadius: 10, padding: 12, color: C.haircare, fontSize: 12, fontFamily: "inherit", marginBottom: 16 }}>
          + Log Today's Measurements
        </button>
      ) : (
        <div style={{ background: C.surface, border: `1px solid ${C.haircare}25`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.haircare, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Log Measurements — {today}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {MEASUREMENT_FIELDS.map(f => (
              <div key={f.id} style={{ background: C.faint, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{f.label}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" step="0.1" placeholder={latest[f.id] ? `${latest[f.id]}` : "—"} value={inputs[f.id] || ""} onChange={e => setInputs(p => ({ ...p, [f.id]: e.target.value }))} style={{ width: 80, fontSize: 16, padding: "6px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontFamily: "inherit", outline: "none", textAlign: "right" }} />
                  <span style={{ fontSize: 11, color: C.muted, width: 20 }}>cm</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setShowForm(false); setInputs({}); }} style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, color: C.muted, fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={saveAll} style={{ flex: 2, background: C.haircare, border: "none", borderRadius: 8, padding: 10, color: "#000", fontSize: 12, fontFamily: "inherit" }}>Save</button>
          </div>
        </div>
      )}

      {/* Current measurements grid */}
      {allDates.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.haircare}25`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.haircare, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Current Measurements</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {MEASUREMENT_FIELDS.map(f => {
              const val = latest[f.id];
              const prevVal = prev[f.id];
              const diff = val && prevVal ? (val - prevVal).toFixed(1) : null;
              return (
               <div key={f.id} onClick={() => setSelectedField(selectedField === f.id ? null : f.id)} style={{ background: C.faint, borderRadius: 10, padding: "12px 16px", cursor: "pointer", border: `1px solid ${selectedField === f.id ? C.haircare + "50" : C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{f.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {diff && <div style={{ fontSize: 10, color: parseFloat(diff) >= 0 ? C.haircare : C.nofap }}>{parseFloat(diff) >= 0 ? "+" : ""}{diff}cm</div>}
                    <span style={{ fontSize: 20, color: C.haircare, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{val ? `${val}` : "—"}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>cm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History graph for selected field */}
      {selectedField && (() => {
        const history = getHistory(selectedField);
        const field = MEASUREMENT_FIELDS.find(f => f.id === selectedField);
        if (history.length < 2) return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 12, textAlign: "center", fontSize: 11, color: C.muted }}>Log at least 2 entries to see progress</div>;
        const max = Math.max(...history.map(h => h.value));
        const min = Math.min(...history.map(h => h.value));
        return (
          <div style={{ background: C.surface, border: `1px solid ${C.haircare}25`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.haircare, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>{field.label} — Progress</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 70 }}>
              {history.map((h, i) => {
                const barH = min === max ? 40 : Math.max(8, ((h.value - min) / (max - min)) * 60);
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 8, color: C.haircare }}>{h.value}</div>
                    <div style={{ width: "100%", background: `${C.haircare}70`, borderRadius: "3px 3px 0 0", height: `${barH}px` }} />
                    <div style={{ fontSize: 7, color: C.muted }}>{new Date(h.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {allDates.length === 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>
          No measurements logged yet. Tap above to start tracking.
        </div>
      )}
    </div>
  );
}

// ─── HEATMAP VIEW ─────────────────────────────────────────────────────────────
function HeatmapView({ logs, checkinLogs, sleepLogs, setView, setSelectedDate }) {
  const [months, setMonths] = useState(3);
  const [mode, setMode] = useState("overall");
  const [selectedCat, setSelectedCat] = useState("workout");
  const [popup, setPopup] = useState(null);
  const SLEEP_COLOR = "#7c6fa0";

  const endDate = new Date(todayKey() + "T12:00:00");
  const startDate = new Date(endDate);
  if (months === "all") startDate.setFullYear(startDate.getFullYear() - 2);
  else startDate.setMonth(startDate.getMonth() - months);

  const days = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    days.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }

  function getDayValue(date) {
    if (mode === "overall") {
      const done = HABITS.filter(h => logs[date]?.[h.id]?.done).length;
      return done / HABITS.length;
    } else {
      const catH = HABITS.filter(h => h.category === selectedCat);
      if (!catH.length) return 0;
      const done = catH.filter(h => logs[date]?.[h.id]?.done).length;
      return done / catH.length;
    }
  }

  function getColor(val) {
    if (val === 0) return C.faint;
    const color = mode === "overall" ? C.skincare : (COLORS[selectedCat] || C.skincare);
    const alpha = Math.round(20 + val * 200).toString(16).padStart(2, "0");
    return `${color}${alpha}`;
  }

  // Group by weeks
  const weeks = [];
  let week = [];
  const firstDay = new Date(days[0] + "T12:00:00").getDay();
  for (let i = 0; i < firstDay; i++) week.push(null);
  days.forEach(d => {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

  const DAY_LABELS = ["S","M","T","W","T","F","S"];

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.skincare}25`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Habit Heatmap</div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[3, 6, "all"].map(m => (
          <button key={m} onClick={() => setMonths(m)} style={{ background: months === m ? C.skincare : C.faint, border: `1px solid ${months === m ? C.skincare : C.border}`, borderRadius: 6, padding: "4px 10px", color: months === m ? "#000" : C.muted, fontSize: 10, fontFamily: "inherit" }}>
            {m === "all" ? "All" : `${m}mo`}
          </button>
        ))}
        <div style={{ width: 1, background: C.border }} />
        <button onClick={() => setMode("overall")} style={{ background: mode === "overall" ? C.skincare : C.faint, border: `1px solid ${mode === "overall" ? C.skincare : C.border}`, borderRadius: 6, padding: "4px 10px", color: mode === "overall" ? "#000" : C.muted, fontSize: 10, fontFamily: "inherit" }}>Overall</button>
        <button onClick={() => setMode("category")} style={{ background: mode === "category" ? C.skincare : C.faint, border: `1px solid ${mode === "category" ? C.skincare : C.border}`, borderRadius: 6, padding: "4px 10px", color: mode === "category" ? "#000" : C.muted, fontSize: 10, fontFamily: "inherit" }}>Category</button>
      </div>

      {mode === "category" && (
        <div style={{ display: "flex", gap: 5, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
          {Object.keys(COLORS).map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat)} style={{ background: selectedCat === cat ? COLORS[cat] : C.faint, border: `1px solid ${selectedCat === cat ? COLORS[cat] : C.border}`, borderRadius: 6, padding: "4px 8px", color: selectedCat === cat ? "#000" : C.muted, fontSize: 9, fontFamily: "inherit", whiteSpace: "nowrap", textTransform: "capitalize" }}>{cat}</button>
          ))}
        </div>
      )}

      {/* Day labels */}
      <div style={{ display: "flex", gap: 2, marginBottom: 2, paddingLeft: 0 }}>
        {DAY_LABELS.map((l, i) => <div key={i} style={{ width: 12, fontSize: 7, color: C.muted, textAlign: "center" }}>{l}</div>)}
      </div>

      {/* Grid - rotated to columns = weeks */}
      <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {week.map((day, di) => {
              const val = day ? getDayValue(day) : 0;
              return (
                <div key={di} onClick={() => day && setPopup(day)} style={{ width: 12, height: 12, borderRadius: 2, background: day ? getColor(val) : "transparent", cursor: day ? "pointer" : "default", border: day === todayKey() ? `1px solid ${C.skincare}` : "none" }} />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: 8, color: C.muted }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: getColor(v) }} />
        ))}
        <span style={{ fontSize: 8, color: C.muted }}>More</span>
      </div>

      {/* Popup */}
      {popup && (() => {
        const dayLogs = logs[popup] || {};
        const checkin = checkinLogs[popup];
        const sleep = sleepLogs[popup];
        const done = HABITS.filter(h => dayLogs[h.id]?.done);
        const notDone = HABITS.filter(h => !dayLogs[h.id]?.done);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(7,7,10,0.85)", zIndex: 99998, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setPopup(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: C.surface, borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700 }}>
                  {new Date(popup + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <button onClick={() => { setSelectedDate(popup); setView("habits"); setPopup(null); }} style={{ background: C.skincare, border: "none", borderRadius: 6, padding: "6px 12px", color: "#000", fontSize: 10, fontFamily: "inherit" }}>Open Day →</button>
              </div>

              {checkin && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {[["Mood", MOOD_LABELS[checkin.mood], C.skincare], ["Energy", ENERGY_LABELS[checkin.energy], C.workout], ["Sleep", SLEEP_LABELS[checkin.sleep], C.haircare], ["Stress", STRESS_LABELS[checkin.stress], C.nofap]].map(([label, val, color]) => val && (
                    <div key={label} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 6, padding: "4px 8px", fontSize: 9, color }}>{label}: {val}</div>
                  ))}
                </div>
              )}

              {sleep?.sleptOnTime && sleep?.wokeOnTime && (
                <div style={{ background: `${SLEEP_COLOR}15`, border: `1px solid ${SLEEP_COLOR}30`, borderRadius: 8, padding: "6px 12px", marginBottom: 12, fontSize: 10, color: SLEEP_COLOR }}>
                  ☽ Sleep schedule hit {sleep.bedtime && sleep.wakeTime ? `· ${sleep.bedtime} → ${sleep.wakeTime}` : ""}
                </div>
              )}

              <div style={{ fontSize: 9, color: C.skincare, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Completed ({done.length})</div>
              {done.map(h => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: COLORS[h.category] || C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 9, color: "#000" }}>✓</span>
                  </div>
                  <span style={{ fontSize: 12 }}>{h.label}</span>
                </div>
              ))}
              {notDone.length > 0 && (
                <>
                  <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", margin: "12px 0 8px" }}>Missed ({notDone.length})</div>
                  {notDone.map(h => (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}`, opacity: 0.4 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: C.border }} />
                      <span style={{ fontSize: 12, color: C.muted }}>{h.label}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── DATA BACKUP ──────────────────────────────────────────────────────────────
function DataBackupCard({ logs, workoutLogs, foodLogs, weightLogs, xpLogs, achievements, sleepLogs, measurements, checkinLogs, journalLogs, aiReviews, nofapHistory, quests, setLogs, setWorkoutLogs, setFoodLogs, setWeightLogs, setXpLogs, setAchievements, setSleepLogs, setMeasurements, setCheckinLogs, setJournalLogs, setAiReviews, setNofapHistory, setQuests }) {
  const [expanded, setExpanded] = useState(false);
  const [importMode, setImportMode] = useState(null);
  const [selected, setSelected] = useState({ logs: true, workout: true, food: true, weight: true, xp: true, achievements: true, sleep: true, measurements: true, checkin: true, journal: true, aiReviews: false, nofap: true, quests: true });

  const ALL_DATA = { logs, workoutLogs, foodLogs, weightLogs, xpLogs, achievements, sleepLogs, measurements, checkinLogs, journalLogs, aiReviews, nofapHistory, quests };
  const SETTERS = { logs: setLogs, workoutLogs: setWorkoutLogs, foodLogs: setFoodLogs, weightLogs: setWeightLogs, xpLogs: setXpLogs, achievements: setAchievements, sleepLogs: setSleepLogs, measurements: setMeasurements, checkinLogs: setCheckinLogs, journalLogs: setJournalLogs, aiReviews: setAiReviews, nofapHistory: setNofapHistory, quests: setQuests };
  const LABELS = { logs: "Habit Logs", workoutLogs: "Workout Logs", foodLogs: "Food Logs", weightLogs: "Body Weight", xp: "XP & Rank", achievements: "Achievements", sleep: "Sleep Logs", measurements: "Body Measurements", checkin: "Daily Check-ins", journal: "Journal", aiReviews: "AI Reviews", nofap: "NoFap History", quests: "Quest History" };

  function exportSelected() {
    const out = {};
    if (selected.logs) out.logs = logs;
    if (selected.workout) out.workoutLogs = workoutLogs;
    if (selected.food) out.foodLogs = foodLogs;
    if (selected.weight) out.weightLogs = weightLogs;
    if (selected.xp) out.xpLogs = xpLogs;
    if (selected.achievements) out.achievements = achievements;
    if (selected.sleep) out.sleepLogs = sleepLogs;
    if (selected.measurements) out.measurements = measurements;
    if (selected.checkin) out.checkinLogs = checkinLogs;
    if (selected.journal) out.journalLogs = journalLogs;
    if (selected.aiReviews) out.aiReviews = aiReviews;
    if (selected.nofap) out.nofapHistory = nofapHistory;
    if (selected.quests) out.quests = quests;
    const blob = new Blob([JSON.stringify({ version: "anant_v3", exportDate: todayKey(), data: out }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `self-system-backup-${todayKey()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportAll() {
    const blob = new Blob([JSON.stringify({ version: "anant_v3", exportDate: todayKey(), data: ALL_DATA }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `self-system-full-backup-${todayKey()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e, mode) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const d = parsed.data || parsed;
        const keyMap = { logs: "logs", workoutLogs: "workoutLogs", foodLogs: "foodLogs", weightLogs: "weightLogs", xpLogs: "xpLogs", achievements: "achievements", sleepLogs: "sleepLogs", measurements: "measurements", checkinLogs: "checkinLogs", journalLogs: "journalLogs", aiReviews: "aiReviews", nofapHistory: "nofapHistory", quests: "quests" };
        Object.entries(keyMap).forEach(([key, dataKey]) => {
          if (d[dataKey] !== undefined && SETTERS[key]) {
            if (mode === "overwrite") SETTERS[key](d[dataKey]);
            else if (mode === "merge") SETTERS[key](p => Array.isArray(p) ? [...p, ...d[dataKey]] : { ...p, ...d[dataKey] });
          }
        });
        alert("Import successful!");
      } catch { alert("Invalid backup file."); }
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.workout}25`, borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div className="press" onClick={() => setExpanded(e => !e)} style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700 }}>Data Backup</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Export · Import · Protect your progress</div>
        </div>
        <span style={{ color: C.muted, fontSize: 14 }}>{expanded ? "↑" : "↓"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={exportAll} style={{ flex: 1, background: C.workout, border: "none", borderRadius: 8, padding: 10, color: "#000", fontSize: 11, fontFamily: "inherit" }}>↓ Export All</button>
            <button onClick={exportSelected} style={{ flex: 1, background: C.faint, border: `1px solid ${C.workout}40`, borderRadius: 8, padding: 10, color: C.workout, fontSize: 11, fontFamily: "inherit" }}>↓ Export Selected</button>
          </div>

          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Select data to export</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {Object.entries(selected).map(([key, val]) => (
              <div key={key} onClick={() => setSelected(p => ({ ...p, [key]: !p[key] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: val ? `${C.workout}10` : C.faint, border: `1px solid ${val ? C.workout + "30" : C.border}`, borderRadius: 8, cursor: "pointer" }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: val ? C.workout : "transparent", border: `2px solid ${val ? C.workout : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {val && <span style={{ color: "#000", fontSize: 9, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 11, color: val ? C.text : C.muted }}>{LABELS[key] || key}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Import backup</div>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1, background: C.faint, border: `1px solid ${C.nofap}30`, borderRadius: 8, padding: 10, color: C.nofap, fontSize: 11, fontFamily: "inherit", textAlign: "center", cursor: "pointer" }}>
              ↑ Merge
              <input type="file" accept=".json" style={{ display: "none" }} onChange={e => handleImport(e, "merge")} />
            </label>
            <label style={{ flex: 1, background: C.faint, border: `1px solid #FF000030`, borderRadius: 8, padding: 10, color: "#FF0000", fontSize: 11, fontFamily: "inherit", textAlign: "center", cursor: "pointer" }}>
              ↑ Overwrite
              <input type="file" accept=".json" style={{ display: "none" }} onChange={e => handleImport(e, "overwrite")} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
       
          
// ─── LOG HUB ──────────────────────────────────────────────────────────────────
function LogHub({ setSubView, todayMacros, workoutLogs, setWorkoutLogs, weightLogs, setWeightLogs, logs, setLogs, foodLogs, setFoodLogs, nofapStreak, setNofapStart, xpLogs, setXpLogs, checkinLogs, journalLogs, setJournalLogs, aiReviews, setAiReviews, setAchievements, achievements, sleepLogs, setSleepLogs, measurements, setMeasurements, quests, setQuests, selectedDate }) {
  const today = todayKey();
  const todayW = workoutLogs[today] || {};
  const totalSets = Object.values(todayW).reduce((a, ex) => a + (ex.sets?.length || 0), 0);
  const [weightInput, setWeightInput] = useState("");
  const [showWeightInput, setShowWeightInput] = useState(false);
  const weights = Object.entries(weightLogs).sort((a, b) => a[0].localeCompare(b[0]));
  const latestWeight = weights.length ? weights[weights.length - 1][1] : null;
  const startWeight = weights.length ? weights[0][1] : 40;
  const targetWeight = 65;
  const progress = latestWeight ? Math.min(100, ((latestWeight - startWeight) / (targetWeight - startWeight)) * 100) : 0;
  const days = last7();
  const weekHabitPct = Math.round((days.reduce((a, d) => a + HABITS.filter(h => logs[d]?.[h.id]?.done).length, 0) / (HABITS.length * 7)) * 100);
  const weekProtein = Math.round(days.reduce((a, d) => { const e = foodLogs[d] || []; return Array.isArray(e) ? a + e.reduce((b, x) => b + (x.protein || 0), 0) : a; }, 0) / 7);
  const weekWorkouts = days.filter(d => Object.values(workoutLogs[d] || {}).some(ex => ex.sets?.length > 0)).length;
  const weightChange = weights.length >= 2 ? (weights[weights.length - 1][1] - weights[weights.length - 2][1]).toFixed(1) : null;

  function logWeight() {
    if (!weightInput) return;
    setWeightLogs(p => ({ ...p, [today]: parseFloat(weightInput) }));
    setWeightInput(""); setShowWeightInput(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Log</div>

      <SleepCard sleepLogs={sleepLogs} setSleepLogs={setSleepLogs} logs={logs} setLogs={setLogs} xpLogs={xpLogs} setXpLogs={setXpLogs} />

      {/* Weight tracker */}
      <div style={{ background: C.surface, border: `1px solid ${C.haircare}25`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700 }}>Body Weight</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Goal: 65kg</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, color: C.haircare, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{latestWeight || "—"}<span style={{ fontSize: 12 }}>kg</span></div>
            {weightChange && <div style={{ fontSize: 10, color: parseFloat(weightChange) >= 0 ? C.haircare : C.nofap }}>{parseFloat(weightChange) >= 0 ? "+" : ""}{weightChange}kg last log</div>}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginBottom: 4 }}>
            <span>{startWeight}kg start</span>
            <span>{latestWeight ? `${(targetWeight - latestWeight).toFixed(1)}kg to go` : "Log your weight"}</span>
            <span>65kg</span>
          </div>
          <div style={{ background: C.faint, borderRadius: 4, height: 6 }}>
            <div style={{ width: `${Math.max(0, progress)}%`, height: "100%", background: C.haircare, borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
        </div>
        {weights.length > 1 && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 50, marginBottom: 12 }}>
            {weights.slice(-10).map(([date, w]) => {
              const max = Math.max(...weights.slice(-10).map(x => x[1]));
              const min = Math.min(...weights.slice(-10).map(x => x[1]));
              const h = min === max ? 30 : Math.max(8, ((w - min) / (max - min)) * 45);
              return (
                <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ fontSize: 8, color: C.haircare }}>{w}</div>
                  <div style={{ width: "100%", background: `${C.haircare}70`, borderRadius: "3px 3px 0 0", height: `${h}px` }} />
                  <div style={{ fontSize: 7, color: C.muted }}>{new Date(date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                </div>
              );
            })}
          </div>
        )}
        {showWeightInput ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder="e.g. 41.5" style={{ flex: 1 }} autoFocus />
            <button onClick={logWeight} style={{ background: C.haircare, border: "none", borderRadius: 7, padding: "8px 14px", color: "#000", fontSize: 12 }}>Save</button>
            <button onClick={() => setShowWeightInput(false)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 10px", color: C.muted, fontSize: 12 }}>✕</button>
          </div>
        ) : (
          <button className="press" onClick={() => setShowWeightInput(true)} style={{ width: "100%", background: C.faint, border: `1px dashed ${C.haircare}40`, borderRadius: 8, padding: "9px", color: C.haircare, fontSize: 11, fontFamily: "inherit" }}>+ Log today's weight</button>
        )}
      </div>

      {/* Weekly review */}
      <div style={{ background: C.surface, border: `1px solid ${C.skincare}25`, borderRadius: 14, padding: 16 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Weekly Review</div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 14 }}>Last 7 days</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[["Habits",`${weekHabitPct}%`,C.skincare],["Avg Protein",`${weekProtein}g`,C.diet],["Workouts",`${weekWorkouts}/6`,C.workout],["NoFap",`${nofapStreak}d`,C.nofap]].map(([label, val, color]) => (
            <div key={label} style={{ background: C.faint, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Daily completion</div>
        <div style={{ display: "flex", gap: 4 }}>
          {days.map(d => {
            const pct = Math.round((HABITS.filter(h => logs[d]?.[h.id]?.done).length / HABITS.length) * 100);
            return (
              <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", background: pct > 0 ? `${C.skincare}${Math.round(40 + (pct / 100) * 180).toString(16)}` : C.faint, borderRadius: 4, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: pct > 50 ? "#000" : C.muted }}>{pct > 0 ? `${pct}%` : ""}</span>
                </div>
                <div style={{ fontSize: 8, color: d === todayKey() ? C.skincare : C.muted }}>{new Date(d + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" })}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick access buttons */}
      <button className="press" onClick={() => setSubView("workoutlog")} style={{ background: C.surface, border: `1px solid ${C.workout}25`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, color: C.text, textAlign: "left" }}>
        <span style={{ color: C.workout, fontSize: 22 }}>◆</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>Workout Logger</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Log sets, reps & weights</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, color: C.workout, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{totalSets}</div>
          <div style={{ fontSize: 9, color: C.muted }}>sets today</div>
        </div>
      </button>
      <button className="press" onClick={() => setSubView("foodlog")} style={{ background: C.surface, border: `1px solid ${C.diet}25`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, color: C.text, textAlign: "left" }}>
        <span style={{ color: C.diet, fontSize: 22 }}>◉</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>Meal Log</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Track your 6 meals</div>
        </div>
        <span style={{ color: C.muted, fontSize: 14 }}>›</span>
      </button>
      <button className="press" onClick={() => setSubView("analytics")} style={{ background: C.surface, border: `1px solid ${C.skincare}25`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, color: C.text, textAlign: "left" }}>
        <span style={{ color: C.skincare, fontSize: 22 }}>◎</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>Analytics</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Daily · Weekly · Monthly · Yearly</div>
        </div>
        <span style={{ color: C.muted, fontSize: 14 }}>›</span>
      </button>
      <DailyQuestsCard quests={quests} setQuests={setQuests} logs={logs} setLogs={setLogs} xpLogs={xpLogs} setXpLogs={setXpLogs} checkinLogs={checkinLogs} sleepLogs={sleepLogs} workoutLogs={workoutLogs} foodLogs={foodLogs} viewDate={selectedDate} />
      <button className="press" onClick={() => setSubView("measurements")} style={{ background: C.surface, border: `1px solid ${C.haircare}25`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, color: C.text, textAlign: "left" }}>
        <span style={{ color: C.haircare, fontSize: 22 }}>◈</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>Body Measurements</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Track chest, arms, waist & more</div>
        </div>
        <span style={{ color: C.muted, fontSize: 14 }}>›</span>
      </button>
     <ResetProgress logs={logs} setLogs={setLogs} workoutLogs={workoutLogs} setWorkoutLogs={setWorkoutLogs} weightLogs={weightLogs} setWeightLogs={setWeightLogs} setNofapStart={setNofapStart} xpLogs={xpLogs} setXpLogs={setXpLogs} setAchievements={setAchievements} />
    </div>
  );
}

// ─── DEMON CARD ───────────────────────────────────────────────────────────────
function DemonCard({ demon }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div onClick={() => setExpanded(e => !e)} style={{ background: C.surface, border: `1px solid ${demon.color}40`, borderRadius: 14, padding: 16, marginBottom: 8, cursor: "pointer" }}>
      <style>{`@keyframes demonPulse{0%,100%{box-shadow:0 0 0 0 ${demon.color}30}50%{box-shadow:0 0 0 6px ${demon.color}10}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, animation: demon.isMajor ? "demonPulse 2s ease infinite" : "none" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${demon.color}15`, border: `1px solid ${demon.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {demon.isMajor ? "👹" : "👤"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: demon.color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{demon.name}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{demon.missStreak}d missed</div>
          </div>
          {/* HP Bar */}
          <div style={{ background: C.faint, borderRadius: 3, height: 5, marginBottom: 4 }}>
            <div style={{ width: `${demon.hp}%`, height: "100%", background: `linear-gradient(90deg, ${demon.color}, ${demon.color}80)`, borderRadius: 3, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 9, color: C.muted }}>Power: {demon.hp}/100</div>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: `${demon.color}10`, borderRadius: 8, border: `1px solid ${demon.color}25` }}>
          <div style={{ fontSize: 12, color: demon.color, fontStyle: "italic", lineHeight: 1.6, marginBottom: 8 }}>"{demon.taunt}"</div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            Defeat this demon by completing <span style={{ color: demon.color }}>{demon.cat}</span> habits for 3 consecutive days.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({ userProfile, setUserProfile, onBack, isFemale, shadowMode, setShadowMode, supaUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...userProfile });
  const theme = isFemale ? THEME_FEMALE : THEME_MALE;
  const accent = theme.accent;

  function save() {
    setUserProfile({ ...form });
    setEditing(false);
  }

  const inputStyle = {
    background: C.faint, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "11px 14px", color: C.text,
    fontFamily: "inherit", fontSize: 13, outline: "none", width: "100%",
  };
  const labelStyle = { fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 };

  const totalXP = getTotalXP({});
  const rank = getCurrentRank(0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1, fontFamily: "inherit", cursor: "pointer" }}>← Back</button>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Profile</div>
        </div>
        <button onClick={() => editing ? save() : setEditing(true)} style={{ background: editing ? accent : "none", border: `1px solid ${editing ? accent : C.border}`, borderRadius: 8, padding: "6px 14px", color: editing ? (isFemale ? "#050507" : "#000") : C.muted, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
          {editing ? "✓ Save" : "✎ Edit"}
        </button>
      </div>

      {/* Identity Card */}
      <div style={{ background: C.surface, border: `1px solid ${accent}30`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Identity</div>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={labelStyle}>Name</div>
              <input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={labelStyle}>Age</div>
                <input type="number" style={inputStyle} value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
              </div>
              <div>
                <div style={labelStyle}>Gender</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["male","female"].map(g => (
                    <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))} style={{ flex: 1, background: form.gender === g ? `${accent}20` : C.faint, border: `1px solid ${form.gender === g ? accent : C.border}`, borderRadius: 8, padding: "10px 6px", color: form.gender === g ? accent : C.muted, fontSize: 11, fontFamily: "inherit", cursor: "pointer", textTransform: "capitalize" }}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={labelStyle}>Height (cm)</div>
                <input type="number" style={inputStyle} value={form.height} onChange={e => setForm(p => ({ ...p, height: e.target.value }))} />
              </div>
              <div>
                <div style={labelStyle}>Weight (kg)</div>
                <input type="number" style={inputStyle} value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{userProfile.name || "—"}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : "—"} · {userProfile.age ? `${userProfile.age} yrs` : "—"} · {userProfile.height ? `${userProfile.height}cm` : "—"} · {userProfile.weight ? `${userProfile.weight}kg` : "—"}</div>
          </div>
        )}
      </div>

      {/* Alter Ego */}
      <div style={{ background: C.surface, border: `1px solid ${accent}20`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Alter Ego</div>
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={labelStyle}>Alter Ego Name</div>
              <input style={inputStyle} value={form.alterEgo?.name || ""} onChange={e => setForm(p => ({ ...p, alterEgo: { ...p.alterEgo, name: e.target.value } }))} placeholder={isFemale ? "The Empress..." : "The Shadow..."} />
            </div>
            <div>
              <div style={labelStyle}>Title</div>
              <input style={inputStyle} value={form.alterEgo?.title || ""} onChange={e => setForm(p => ({ ...p, alterEgo: { ...p.alterEgo, title: e.target.value } }))} placeholder={isFemale ? "Sovereign of the Night..." : "The Unbreakable..."} />
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: accent, marginBottom: 4 }}>{userProfile.alterEgo?.name || "—"}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{userProfile.alterEgo?.title || "—"}</div>
          </div>
        )}
      </div>

      {/* Struggles */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>What I'm Fighting</div>
        {editing ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STRUGGLE_OPTIONS.map(s => {
              const sel = form.struggles?.includes(s);
              return (
                <button key={s} onClick={() => setForm(p => ({ ...p, struggles: sel ? p.struggles.filter(x => x !== s) : [...(p.struggles || []), s] }))} style={{ padding: "7px 12px", borderRadius: 20, fontSize: 11, fontFamily: "inherit", cursor: "pointer", background: sel ? `${accent}20` : C.faint, border: `1px solid ${sel ? accent : C.border}`, color: sel ? accent : C.muted }}>
                  {s}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(userProfile.struggles || []).length === 0 ? <div style={{ fontSize: 12, color: C.muted }}>None selected</div> :
              (userProfile.struggles || []).map(s => (
                <div key={s} style={{ padding: "5px 10px", borderRadius: 20, fontSize: 11, background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}>{s}</div>
              ))}
          </div>
        )}
      </div>

      {/* Goals */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>My Goals</div>
        {editing ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {GOAL_OPTIONS.map(g => {
              const sel = form.goals?.includes(g);
              return (
                <button key={g} onClick={() => setForm(p => ({ ...p, goals: sel ? p.goals.filter(x => x !== g) : [...(p.goals || []), g] }))} style={{ padding: "7px 12px", borderRadius: 20, fontSize: 11, fontFamily: "inherit", cursor: "pointer", background: sel ? `${accent}20` : C.faint, border: `1px solid ${sel ? accent : C.border}`, color: sel ? accent : C.muted }}>
                  {g}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(userProfile.goals || []).length === 0 ? <div style={{ fontSize: 12, color: C.muted }}>None selected</div> :
              (userProfile.goals || []).map(g => (
                <div key={g} style={{ padding: "5px 10px", borderRadius: 20, fontSize: 11, background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}>{g}</div>
              ))}
          </div>
        )}
      </div>

{/* Account */}
      {supaUser && (
        <div style={{ marginBottom: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Account</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{supaUser.email}</div>
          <button onClick={() => { supabase.auth.signOut(); onBack(); }} style={{ width: "100%", background: "none", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px", color: C.nofap, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      )}

      {/* Shadow Mode */}
      <div style={{ marginTop: 16, background: shadowMode ? "#020204" : C.surface, border: `2px solid ${shadowMode ? "#FF0000" : C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 9, color: shadowMode ? "#FF0000" : C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
          {shadowMode ? "⚠ SHADOW MODE ACTIVE" : "Shadow Mode"}
        </div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 14 }}>
          {shadowMode
            ? "The shadow self has taken over. All systems operating at maximum intensity."
            : ("Activate your alter ego. " + (userProfile.alterEgo?.name ? ("Become " + userProfile.alterEgo.name + ".") : "Become who you were meant to be.") + " Dark UI, intense voice, no mercy.")}
        </div>
        <button onClick={() => setShadowMode(s => !s)} style={{ width: "100%", background: shadowMode ? "#FF0000" : "none", border: `2px solid ${shadowMode ? "#FF0000" : C.border}`, borderRadius: 10, padding: "13px", color: shadowMode ? "#000" : C.muted, fontSize: 12, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
          {shadowMode ? "◆ Deactivate Shadow Mode" : "◆ Activate Shadow Mode"}
        </button>
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ userProfile, setUserProfile, onBack, isFemale, onResetOnboarding }) {
  const accent = isFemale ? THEME_FEMALE.accent : THEME_MALE.accent;

  const Row = ({ icon, label, value, onClick, danger }) => (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, cursor: onClick ? "pointer" : "default" }}>
      <span style={{ fontSize: 16, color: danger ? C.nofap : accent, width: 22 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: danger ? C.nofap : C.text }}>{label}</div>
        {value && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{value}</div>}
      </div>
      {onClick && <span style={{ color: C.muted, fontSize: 14 }}>›</span>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1, fontFamily: "inherit", cursor: "pointer" }}>← Back</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Settings</div>
      </div>

      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 }}>Account</div>
      <Row icon="◎" label="Name" value={userProfile.name || "Not set"} />
      <Row icon={isFemale ? "✦" : "◆"} label="Theme" value={isFemale ? "Moonlit Empress (Female)" : "Iron Dark (Male)"} />
      <Row icon="⚡" label="Alter Ego" value={userProfile.alterEgo?.name || "Not set"} />

      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", margin: "20px 0 10px", paddingLeft: 4 }}>App</div>
      <Row icon="◈" label="Re-run Onboarding" value="Reset your profile setup" onClick={onResetOnboarding} />

      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", margin: "20px 0 10px", paddingLeft: 4 }}>Notifications</div>
      <Row icon="☽" label="Daily Check-in Reminder" value="Coming soon" />
      <Row icon="◉" label="Habit Reminders" value="Coming soon" />

      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", margin: "20px 0 10px", paddingLeft: 4 }}>Data</div>
      <div style={{ background: `${C.nofap}10`, border: `1px solid ${C.nofap}25`, borderRadius: 12, padding: "14px 16px", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: C.nofap, marginBottom: 4 }}>⚠ Danger Zone</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>To reset or export your data, use Data Backup in the sidebar Tools section.</div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <div style={{ fontSize: 10, color: C.muted }}>Self System · Built for growth</div>
        <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>v3.0 · Your data stays on your device</div>
      </div>
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage({ onBack }) {
  const sections = [
    { icon: "⚡", title: "What is Self System?", body: "A personal operating system built for people serious about becoming their best version. No fluff. No social features. Just you, your habits, and your data." },
    { icon: "◆", title: "How it works", body: "Track habits daily, log workouts and meals, monitor sleep, journal your thoughts, and let the AI Coach analyze your patterns. XP and ranks keep you accountable." },
    { icon: "◎", title: "Your data", body: "Everything stays on your device. No accounts, no servers, no tracking. Export your data anytime from Data Backup." },
    { icon: "✦", title: "Alter Ego", body: "Define the version of you that has already achieved everything you want. The app addresses you as that person in AI reviews and coaching prompts." },
    { icon: "☽", title: "Themes", body: "Two themes available — Iron Dark (masculine, focused) and Moonlit Empress (elegant, powerful). Set during onboarding based on your identity." },
    { icon: "★", title: "Ranks & XP", body: "Every habit completed, every clean day, every workout logged earns XP. Rise from E-Rank (The Awakened) to SSS-Rank (The Absolute)." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1, fontFamily: "inherit", cursor: "pointer" }}>← Back</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>About</div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚡</div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 700, marginBottom: 6 }}>Self System</div>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Your Personal Operating System</div>
      </div>

      {sections.map((s, i) => (
        <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 16, color: C.accent }}>{s.icon}</span>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 700 }}>{s.title}</div>
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>{s.body}</div>
        </div>
      ))}

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <div style={{ fontSize: 10, color: C.muted }}>Made with discipline.</div>
        <div style={{ fontSize: 9, color: C.dim, marginTop: 4 }}>v3.0 · 2026</div>
      </div>
    </div>
  );
}

// ─── FULL SCREEN WRAPPERS (Sidebar navigation targets) ───────────────────────
function HeatmapFullView({ logs, checkinLogs, sleepLogs, onBack, setSelectedDate, setView }) {
  const handleJumpToDay = (date) => {
    setSelectedDate(date);
    setView("habits");
    onBack();
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1 }}>← Back</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Habit Heatmap</div>
      </div>
      <HeatmapView logs={logs} checkinLogs={checkinLogs} sleepLogs={sleepLogs} setView={setView} setSelectedDate={handleJumpToDay} />
    </div>
  );
}

function JournalFullView({ journalLogs, setJournalLogs, checkinLogs, logs, workoutLogs, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1 }}>← Back</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Journal</div>
      </div>
      <JournalCard journalLogs={journalLogs} setJournalLogs={setJournalLogs} checkinLogs={checkinLogs} logs={logs} workoutLogs={workoutLogs} />
    </div>
  );
}

function AICoachFullView({ logs, workoutLogs, foodLogs, checkinLogs, journalLogs, xpLogs, aiReviews, setAiReviews, nofapStreak, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1 }}>← Back</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>AI Coach</div>
      </div>
      <AIReviewCard logs={logs} workoutLogs={workoutLogs} foodLogs={foodLogs} checkinLogs={checkinLogs} journalLogs={journalLogs} xpLogs={xpLogs} aiReviews={aiReviews} setAiReviews={setAiReviews} nofapStreak={nofapStreak} />
    </div>
  );
}

function DailyQuestsFullView({ quests, setQuests, logs, setLogs, xpLogs, setXpLogs, checkinLogs, sleepLogs, workoutLogs, foodLogs, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1 }}>← Back</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Daily Quests</div>
      </div>
      <DailyQuestsCard quests={quests} setQuests={setQuests} logs={logs} setLogs={setLogs} xpLogs={xpLogs} setXpLogs={setXpLogs} checkinLogs={checkinLogs} sleepLogs={sleepLogs} workoutLogs={workoutLogs} foodLogs={foodLogs} />
    </div>
  );
}
// ─── SLEEP FULL VIEW ─────────────────────────────────────────────────────────
function SleepFullView({ sleepLogs, setSleepLogs, logs, setLogs, xpLogs, setXpLogs, onBack, selectedDate }) {
  const currentDate = selectedDate || todayKey();

  const saved = sleepLogs[currentDate] || {};

  const [bedtimeHour, setBedtimeHour] = useState(saved.bedtimeHour || 23);
  const [bedtimeMin, setBedtimeMin] = useState(saved.bedtimeMin || 0);
  const [bedtimeAMPM, setBedtimeAMPM] = useState(saved.bedtimeAMPM || "PM");

  const [wakeHour, setWakeHour] = useState(saved.wakeHour || 6);
  const [wakeMin, setWakeMin] = useState(saved.wakeMin || 0);
  const [wakeAMPM, setWakeAMPM] = useState(saved.wakeAMPM || "AM");

  // Reset form when date changes
  useEffect(() => {
    setBedtimeHour(saved.bedtimeHour || 23);
    setBedtimeMin(saved.bedtimeMin || 0);
    setBedtimeAMPM(saved.bedtimeAMPM || "PM");
    setWakeHour(saved.wakeHour || 6);
    setWakeMin(saved.wakeMin || 0);
    setWakeAMPM(saved.wakeAMPM || "AM");
  }, [currentDate]);

  function calculateDuration() {
    let bh = bedtimeHour;
    if (bedtimeAMPM === "PM" && bh !== 12) bh += 12;
    if (bedtimeAMPM === "AM" && bh === 12) bh = 0;
    
    let wh = wakeHour;
    if (wakeAMPM === "PM" && wh !== 12) wh += 12;
    if (wakeAMPM === "AM" && wh === 12) wh = 0;

    let minutes = (wh * 60 + wakeMin) - (bh * 60 + bedtimeMin);
    if (minutes < 0) minutes += 24 * 60;
    return (minutes / 60).toFixed(1);
  }

  function saveSleep() {
    const duration = parseFloat(calculateDuration());
    
    setSleepLogs(prev => ({
      ...prev,
      [currentDate]: {
        sleptBy: `${bedtimeHour}:${bedtimeMin.toString().padStart(2, '0')} ${bedtimeAMPM}`,
        wokeAt: `${wakeHour}:${wakeMin.toString().padStart(2, '0')} ${wakeAMPM}`,
        bedtimeHour, bedtimeMin, bedtimeAMPM,
        wakeHour, wakeMin, wakeAMPM,
        duration
      }
    }));

    if (!sleepLogs[currentDate]) {
      setXpLogs(p => ({ ...p, [currentDate]: (p[currentDate] || 0) + 20 }));
    }

    setLogs(p => ({
      ...p,
      [currentDate]: {
        ...(p[currentDate] || {}),
        h13: { done: true }
      }
    }));
  }

  const duration = calculateDuration();

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 28, marginBottom: 10 }}>←</button>
      
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Rest & Recovery</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>
        {new Date(currentDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
      </div>

      <div style={{ background: C.surface, borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: C.haircare }}>TARGET</div>
          <div style={{ fontSize: 13 }}>11:00 PM — 6:00 AM (7h)</div>
        </div>
        <div style={{ textAlign: "right", color: C.haircare, fontSize: 13 }}>
          {duration}h logged
        </div>
      </div>

      <div style={{ background: C.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>BEDTIME (PREVIOUS NIGHT)</div>
        <input 
          type="time" 
          value={`${bedtimeHour.toString().padStart(2,'0')}:${bedtimeMin.toString().padStart(2,'0')}`} 
          onChange={(e) => {
            const [h, m] = e.target.value.split(':').map(Number);
            setBedtimeHour(h);
            setBedtimeMin(m);
          }}
          style={{ width: "100%", background: C.faint, border: "none", color: C.text, fontSize: 18, padding: 12, borderRadius: 8 }}
        />
      </div>

      <div style={{ background: C.surface, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>WAKE TIME (THIS MORNING)</div>
        <input 
          type="time" 
          value={`${wakeHour.toString().padStart(2,'0')}:${wakeMin.toString().padStart(2,'0')}`} 
          onChange={(e) => {
            const [h, m] = e.target.value.split(':').map(Number);
            setWakeHour(h);
            setWakeMin(m);
          }}
          style={{ width: "100%", background: C.faint, border: "none", color: C.text, fontSize: 18, padding: 12, borderRadius: 8 }}
        />
      </div>

      <button 
        onClick={saveSleep}
        style={{ width: "100%", background: C.haircare, color: "#000", padding: "16px", borderRadius: 12, fontSize: 15, fontWeight: 600 }}
      >
        Save Sleep Log
      </button>
    </div>
  );
}
// ─── WORKOUT LOGGER ───────────────────────────────────────────────────────────
function WorkoutLogger({ workoutLogs, setWorkoutLogs, workoutPlan: plan, onBack }) {
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState(todayKey());
  const today = selectedWorkoutDate;
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [dayIdx, setDayIdx] = useState(todayIdx);
  const [activeEx, setActiveEx] = useState(null);
  const [logMode, setLogMode] = useState("grouped");
  const [form, setForm] = useState({ sets: "3", reps: "10", weight: "", notes: "" });
  const [indivSets, setIndivSets] = useState([{ reps: "", weight: "" }]);
  const dayData = plan[dayIdx] || WORKOUT_DAYS[dayIdx];
  const todayLog = workoutLogs[today] || {};

  function getExLog(exName) { return todayLog[exName] || { sets: [] }; }
  function saveGrouped(exName) {
    const newSets = Array.from({ length: parseInt(form.sets) || 1 }, () => ({ reps: parseInt(form.reps) || 0, weight: parseFloat(form.weight) || 0, timestamp: Date.now() }));
    setWorkoutLogs(p => ({ ...p, [today]: { ...p[today], [exName]: { sets: [...getExLog(exName).sets, ...newSets], notes: form.notes } } }));
    setActiveEx(null); setForm({ sets: "3", reps: "10", weight: "", notes: "" });
  }
  function saveIndividual(exName) {
    const newSets = indivSets.filter(s => s.reps || s.weight).map(s => ({ reps: parseInt(s.reps) || 0, weight: parseFloat(s.weight) || 0, timestamp: Date.now() }));
    setWorkoutLogs(p => ({ ...p, [today]: { ...p[today], [exName]: { sets: [...getExLog(exName).sets, ...newSets] } } }));
    setActiveEx(null); setIndivSets([{ reps: "", weight: "" }]);
  }
  function deleteSet(exName, idx) {
    setWorkoutLogs(p => {
      const ex = { ...getExLog(exName) };
      ex.sets = ex.sets.filter((_, i) => i !== idx);
      return { ...p, [today]: { ...p[today], [exName]: ex } };
    });
  }
  function getBestSet(exName) {
    let best = null;
    Object.values(workoutLogs).forEach(dayL => {
      const ex = dayL[exName];
      if (ex?.sets) ex.sets.forEach(s => { if (!best || s.weight > best.weight) best = s; });
    });
    return best;
  }
  const allExercises = dayData.sections.flatMap(s => s.exercises);
  const loggedCount = allExercises.filter(ex => getExLog(ex).sets.length > 0).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, letterSpacing: 1 }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Workout Log</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => { const d = new Date(selectedWorkoutDate); d.setDate(d.getDate() - 1); setSelectedWorkoutDate(d.toISOString().split("T")[0]); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 14 }}>‹</button>
            <div style={{ fontSize: 10, color: selectedWorkoutDate === todayKey() ? C.muted : C.nofap }}>{new Date(selectedWorkoutDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</div>
            <button onClick={() => { const d = new Date(selectedWorkoutDate); d.setDate(d.getDate() + 1); const next = d.toISOString().split("T")[0]; if (next <= todayKey()) setSelectedWorkoutDate(next); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 14 }}>›</button>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, color: C.workout, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{loggedCount}/{allExercises.length}</div>
          <div style={{ fontSize: 9, color: C.muted }}>logged</div>
        </div>
      </div>

      {/* Day selector */}
      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
        {WORKOUT_DAYS.map((d, i) => (
          <button key={i} className="press" onClick={() => setDayIdx(i)} style={{ background: dayIdx === i ? C.workout : C.surface, border: `1px solid ${dayIdx === i ? C.workout : C.border}`, borderRadius: 7, padding: "6px 10px", color: dayIdx === i ? "#000" : C.muted, fontSize: 10, whiteSpace: "nowrap" }}>
            {d.day.replace("Day ", "D")}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.workout, marginBottom: 16 }}>{dayData.focus}</div>

      {dayData.sections.length === 0 ? (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Rest day. Recover well.</div>
      ) : (
        dayData.sections.map((sec, si) => (
          <div key={si} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{sec.title}</div>
            {sec.exercises.map(exName => {
              const exLog = getExLog(exName);
              const best = getBestSet(exName);
              const isActive = activeEx === exName;
              return (
                <div key={exName} style={{ background: C.surface, border: `1px solid ${exLog.sets.length > 0 ? C.workout + "30" : C.border}`, borderRadius: 10, marginBottom: 6, overflow: "hidden" }}>
                  <div className="press" style={{ padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => { setActiveEx(isActive ? null : exName); setForm({ sets: "3", reps: "10", weight: "", notes: "" }); setIndivSets([{ reps: "", weight: "" }]); }}>
                    <div>
                      <div style={{ fontSize: 12, color: exLog.sets.length > 0 ? C.text : "#888" }}>{exName}</div>
                      {best && <div style={{ fontSize: 10, color: C.workout, marginTop: 2 }}>Best: {best.weight}kg × {best.reps}</div>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {exLog.sets.length > 0 && <span style={{ fontSize: 11, color: C.workout }}>{exLog.sets.length} sets</span>}
                      <span style={{ color: C.muted, fontSize: 14 }}>{isActive ? "↑" : "+"}</span>
                    </div>
                  </div>
                  {exLog.sets.length > 0 && (
                    <div style={{ borderTop: `1px solid ${C.border}`, padding: "8px 14px" }}>
                      {exLog.sets.map((s, idx) => (
                        <div key={idx} style={{ display: "flex", gap: 4, fontSize: 12, alignItems: "center", padding: "3px 0" }}>
                          <span style={{ width: 28, color: C.muted }}>{idx + 1}</span>
                          <span style={{ width: 60, color: C.workout }}>{s.weight}kg</span>
                          <span style={{ width: 50, color: C.text }}>{s.reps} reps</span>
                          <button onClick={() => deleteSet(exName, idx)} style={{ marginLeft: "auto", background: "none", border: "none", color: C.muted, fontSize: 11 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isActive && (
                    <div style={{ borderTop: `1px solid ${C.border}`, padding: 14, background: C.faint }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        {["grouped", "individual"].map(m => (
                          <button key={m} className="press" onClick={() => setLogMode(m)} style={{ flex: 1, background: logMode === m ? C.workout : C.surface, border: `1px solid ${logMode === m ? C.workout : C.border}`, borderRadius: 6, padding: "6px", color: logMode === m ? "#000" : C.muted, fontSize: 10, textTransform: "capitalize" }}>
                            {m === "grouped" ? "Group Entry" : "Set by Set"}
                          </button>
                        ))}
                      </div>
                      {logMode === "grouped" ? (
                        <div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                            {[["SETS","sets","numeric",form.sets],["REPS","reps","numeric",form.reps],["WEIGHT","weight","decimal",form.weight]].map(([label, key, mode, val]) => (
                              <div key={key}>
                                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                                <input type="text" inputMode={mode} value={val} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={key === "weight" ? "kg" : ""} style={{ width: "100%", fontSize: 16 }} />
                              </div>
                            ))}
                          </div>
                          <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" style={{ width: "100%", marginBottom: 10 }} />
                          <button className="press" onClick={() => saveGrouped(exName)} style={{ width: "100%", background: C.workout, border: "none", borderRadius: 8, padding: "10px", color: "#000", fontSize: 12, fontWeight: 500 }}>Save {form.sets} Sets</button>
                        </div>
                      ) : (
                        <div>
                          {indivSets.map((s, idx) => (
                            <div key={idx} style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: C.muted, width: 20 }}>{idx + 1}</span>
                              <input type="number" value={s.weight} onChange={e => { const n = [...indivSets]; n[idx].weight = e.target.value; setIndivSets(n); }} placeholder="kg" />
                              <input type="number" value={s.reps} onChange={e => { const n = [...indivSets]; n[idx].reps = e.target.value; setIndivSets(n); }} placeholder="reps" />
                              <button onClick={() => setIndivSets(p => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: C.muted, fontSize: 12 }}>✕</button>
                            </div>
                          ))}
                          <button className="press" onClick={() => setIndivSets(p => [...p, { reps: "", weight: "" }])} style={{ background: "none", border: `1px dashed ${C.muted}`, borderRadius: 7, padding: "7px", color: C.muted, fontSize: 11, width: "100%", marginBottom: 10 }}>+ Add Set</button>
                          <button className="press" onClick={() => saveIndividual(exName)} style={{ width: "100%", background: C.workout, border: "none", borderRadius: 8, padding: "10px", color: "#000", fontSize: 12 }}>Save Sets</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

// ─── FOOD LOGGER ──────────────────────────────────────────────────────────────
function FoodLogger({ foodLogs, setFoodLogs, onBack }) {
  const [selectedFoodDate, setSelectedFoodDate] = useState(todayKey());
  const today = selectedFoodDate;
  const mealLogs = foodLogs[today] || {};

  const MEALS = [
    { id: "m1", label: "Meal 1 — Breakfast",    time: "9:30 AM",  items: ["2 peanut butter sandwiches","4 whole eggs","1 glass whole milk","10 almonds","Vitamin D3 + Multivitamin"], estMacros: { protein: 40, calories: 700, carbs: 55, fat: 28, fibre: 5 } },
    { id: "m2", label: "Meal 2 — Lunch",         time: "1:00 PM",  items: ["50g soya chunks (dry)","1.5 cups cooked rice","1 glass buttermilk"], estMacros: { protein: 30, calories: 500, carbs: 70, fat: 8, fibre: 6 } },
    { id: "m3", label: "Meal 3 — Pre-Workout",   time: "3:00 PM",  items: ["1 banana","2 tbsp peanut butter OR peanuts"], estMacros: { protein: 8, calories: 280, carbs: 32, fat: 14, fibre: 3 } },
    { id: "m4", label: "Meal 4 — Post-Workout",  time: "5:30 PM",  items: ["1 scoop whey","1 cup oats","1 banana","1 tbsp peanut butter","1 glass whole milk","Creatine 5g"], estMacros: { protein: 50, calories: 650, carbs: 80, fat: 16, fibre: 7 } },
    { id: "m5", label: "Meal 5 — Dinner",        time: "8:30 PM",  items: ["150g chicken OR paneer","1.5 cups rice OR 2 roti","Spinach / mixed veg","1 glass buttermilk","Ashwagandha here"], estMacros: { protein: 40, calories: 650, carbs: 65, fat: 18, fibre: 8 } },
    { id: "m6", label: "Meal 6 — Before Bed",    time: "10:30 PM", items: ["1 glass warm milk","1 tbsp peanut butter"], estMacros: { protein: 10, calories: 250, carbs: 18, fat: 12, fibre: 1 } },
  ];

  const [editingMacros, setEditingMacros] = useState(null);
  const [macroInputs, setMacroInputs] = useState({});

  function getMealStreak(mealId) {
    let streak = 0; let d = new Date();
    while (true) {
      const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      const k = ist.toISOString().split("T")[0];
      const entry = foodLogs[k];
      if (entry && (entry[mealId] === true || entry[mealId]?.done)) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    return streak;
  }

  function toggleMeal(id) {
    setFoodLogs(p => {
      const day = { ...(p[today] || {}) };
      const current = day[id];
      if (!current) {
        const meal = MEALS.find(m => m.id === id);
        day[id] = { done: true, macros: { ...meal.estMacros }, isEstimated: true };
      } else {
        day[id] = current.done ? { ...current, done: false } : { ...current, done: true };
      }
      return { ...p, [today]: day };
    });
  }

  function saveMacros(id) {
    setFoodLogs(p => {
      const day = { ...(p[today] || {}) };
      const current = day[id] || { done: true };
      day[id] = {
        ...current,
        macros: {
          calories: parseFloat(macroInputs.calories) || 0,
          protein: parseFloat(macroInputs.protein) || 0,
          carbs: parseFloat(macroInputs.carbs) || 0,
          fat: parseFloat(macroInputs.fat) || 0,
          fibre: parseFloat(macroInputs.fibre) || 0,
        },
        isEstimated: false,
      };
      return { ...p, [today]: day };
    });
    setEditingMacros(null);
  }

  const doneCount = MEALS.filter(m => {
    const e = mealLogs[m.id];
    return e === true || e?.done;
  }).length;

  const totalMacros = MEALS.reduce((acc, meal) => {
    const e = mealLogs[meal.id];
    if (!e || (typeof e === "object" && !e.done)) return acc;
    const macros = (typeof e === "object" && e.macros) ? e.macros : meal.estMacros;
    return {
      calories: acc.calories + (macros.calories || 0),
      protein:  acc.protein  + (macros.protein  || 0),
      carbs:    acc.carbs    + (macros.carbs    || 0),
      fat:      acc.fat      + (macros.fat      || 0),
      fibre:    acc.fibre    + (macros.fibre    || 0),
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12 }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Food Log</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => { const d = new Date(selectedFoodDate); d.setDate(d.getDate() - 1); setSelectedFoodDate(d.toISOString().split("T")[0]); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 14 }}>‹</button>
            <div style={{ fontSize: 10, color: selectedFoodDate === todayKey() ? C.muted : C.nofap }}>{new Date(selectedFoodDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</div>
            <button onClick={() => { const d = new Date(selectedFoodDate); d.setDate(d.getDate() + 1); const next = d.toISOString().split("T")[0]; if (next <= todayKey()) setSelectedFoodDate(next); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 14 }}>›</button>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, color: C.diet, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{doneCount}/6</div>
          <div style={{ fontSize: 9, color: C.muted }}>meals done</div>
        </div>
      </div>

      {/* Macro summary */}
      <div style={{ background: C.surface, border: `1px solid ${C.diet}25`, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: C.diet, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Today's Totals</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
          {[["Cal", Math.round(totalMacros.calories), ""], ["Pro", Math.round(totalMacros.protein), "g"], ["Carb", Math.round(totalMacros.carbs), "g"], ["Fat", Math.round(totalMacros.fat), "g"], ["Fibre", Math.round(totalMacros.fibre), "g"]].map(([l, v, u]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, color: C.diet, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{v}{u}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginBottom: 4 }}>
            <span>Protein</span><span>{Math.round(totalMacros.protein)}/178g</span>
          </div>
          <div style={{ background: C.faint, borderRadius: 3, height: 3 }}>
            <div style={{ width: `${Math.min(100, (totalMacros.protein / 178) * 100)}%`, height: "100%", background: C.diet, borderRadius: 3 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MEALS.map(meal => {
          const entry = mealLogs[meal.id];
          const done = entry === true || (typeof entry === "object" && entry?.done);
          const isEstimated = !entry || entry === true || entry?.isEstimated;
          const macros = (typeof entry === "object" && entry?.macros) ? entry.macros : meal.estMacros;
          const isEditingThis = editingMacros === meal.id;

          return (
            <div key={meal.id} style={{ background: done ? `${C.diet}12` : C.surface, border: `1px solid ${done ? C.diet + "40" : C.border}`, borderRadius: 12, padding: 14, transition: "all 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }} onClick={() => toggleMeal(meal.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: done ? C.diet : "transparent", border: `2px solid ${done ? C.diet : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                    {done && <span style={{ color: "#000", fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, color: done ? C.text : "#888" }}>{meal.label}</span>
                    {getMealStreak(meal.id) > 0 && <div style={{ fontSize: 10, color: C.diet, marginTop: 2, opacity: 0.8 }}>{getMealStreak(meal.id)}d streak</div>}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: C.muted }}>{meal.time}</span>
              </div>

              {meal.items.map((item, j) => (
                <div key={j} style={{ fontSize: 12, color: done ? "#888" : "#555", padding: "3px 0", borderBottom: j < meal.items.length - 1 ? `1px solid ${C.border}` : "none", marginLeft: 32 }}>· {item}</div>
              ))}

              {/* Macros row */}
              <div style={{ marginLeft: 32, marginTop: 8 }}>
                {!isEditingThis ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: done ? C.diet : C.muted }}>
                      {Math.round(macros.protein)}g P · {Math.round(macros.calories)} kcal
                      {isEstimated && done && <span style={{ color: C.muted, fontSize: 9 }}> (est.)</span>}
                    </div>
                    {done && (
                      <button onClick={e => { e.stopPropagation(); setEditingMacros(meal.id); setMacroInputs({ calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fat: macros.fat, fibre: macros.fibre }); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", color: C.muted, fontSize: 9, fontFamily: "inherit", cursor: "pointer" }}>
                        ✎ Edit macros
                      </button>
                    )}
                  </div>
                ) : (
                  <div onClick={e => e.stopPropagation()}>
                    <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Actual Macros</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 10 }}>
                      {[["Cal","calories"],["Pro","protein"],["Carb","carbs"],["Fat","fat"],["Fibre","fibre"]].map(([label, key]) => (
                        <div key={key}>
                          <div style={{ fontSize: 8, color: C.muted, marginBottom: 3 }}>{label}</div>
                          <input type="number" value={macroInputs[key] || ""} onChange={e => setMacroInputs(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 6px", color: C.text, fontFamily: "inherit", fontSize: 12, outline: "none" }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditingMacros(null)} style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px", color: C.muted, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
                      <button onClick={() => saveMacros(meal.id)} style={{ flex: 2, background: C.diet, border: "none", borderRadius: 7, padding: "7px", color: "#000", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>Save</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsView({ logs, workoutLogs, foodLogs, nofapStreak, weightLogs, checkinLogs, sleepLogs, onBack, setView, setSelectedDate }) {
  const [period, setPeriod] = useState("weekly");
  function getHabitData(range) { return range.map(d => ({ date: d, label: new Date(d + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" }), pct: Math.round((HABITS.filter(h => logs[d]?.[h.id]?.done).length / HABITS.length) * 100) })); }
  function getProteinData(range) { return range.map(d => { const e = Array.isArray(foodLogs[d]) ? foodLogs[d] : []; return { date: d, label: new Date(d + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" }), value: Math.round(e.reduce((a, x) => a + (x.protein || 0), 0)) }; }); }
  function getCalorieData(range) { return range.map(d => { const e = Array.isArray(foodLogs[d]) ? foodLogs[d] : []; return { date: d, label: new Date(d + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" }), value: Math.round(e.reduce((a, x) => a + (x.calories || 0), 0)) }; }); }
  function getWorkoutVolume(range) { return range.map(d => { const dayLog = workoutLogs[d] || {}; const sets = Object.values(dayLog).reduce((a, ex) => a + (ex.sets?.length || 0), 0); return { date: d, label: new Date(d + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" }), value: sets }; }); }
  function getCatConsistency(range) {
    return Object.keys(COLORS).map(cat => {
      const catH = HABITS.filter(h => h.category === cat);
      if (!catH.length) return null;
      let total = 0, done = 0;
      range.forEach(d => catH.forEach(h => { total++; if (logs[d]?.[h.id]?.done) done++; }));
      return { cat, pct: Math.round((done / total) * 100) };
    }).filter(Boolean);
  }
  function aggData(data, n = 7) {
    if (data.length <= n) return data;
    const step = Math.floor(data.length / n);
    return Array.from({ length: n }, (_, i) => {
      const chunk = data.slice(i * step, (i + 1) * step);
      const avg = chunk.reduce((a, x) => a + (x.value || x.pct || 0), 0) / chunk.length;
      return { ...chunk[0], value: Math.round(avg), pct: Math.round(avg) };
    });
  }
  const ranges = { daily: [todayKey()], weekly: last7(), monthly: last30(), yearly: Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 11 + i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }) };
  const range = ranges[period] || last7();
  const habitData = getHabitData(range);
  const proteinData = getProteinData(range);
  const calorieData = getCalorieData(range);
  const workoutData = getWorkoutVolume(range);
  const catConsistency = getCatConsistency(range);
  const avgCompletion = habitData.length ? Math.round(habitData.reduce((a, d) => a + d.pct, 0) / habitData.length) : 0;
  const avgProtein = proteinData.length ? Math.round(proteinData.reduce((a, d) => a + d.value, 0) / proteinData.length) : 0;
  const totalSets = workoutData.reduce((a, d) => a + d.value, 0);
  const dispHabit = aggData(habitData.map(d => ({ ...d, value: d.pct })));
  const dispProtein = aggData(proteinData);
  const dispCalorie = aggData(calorieData);
  const dispWorkout = aggData(workoutData);

  // Correlation analysis
  const correlations = (() => {
    const r = last30();
    const results = [];
    const pairs = [
      { a: "protein", b: "energy", labelA: "High protein", labelB: "energy" },
      { a: "protein", b: "mood", labelA: "High protein", labelB: "mood" },
      { a: "sleep_score", b: "mood", labelA: "Good sleep", labelB: "mood" },
      { a: "sleep_score", b: "focus", labelA: "Good sleep", labelB: "focus" },
      { a: "sleep_score", b: "energy", labelA: "Good sleep", labelB: "energy" },
      { a: "workout", b: "motivation", labelA: "Workout days", labelB: "motivation" },
      { a: "workout", b: "energy", labelA: "Workout days", labelB: "energy" },
      { a: "nofap", b: "focus", labelA: "NoFap days", labelB: "focus" },
      { a: "nofap", b: "motivation", labelA: "NoFap days", labelB: "motivation" },
    ];
    pairs.forEach(({ a, b, labelA, labelB }) => {
      const daysWithBoth = r.filter(d => {
        const hasA = a === "protein" ? logs[d]?.h5?.done : a === "sleep_score" ? (checkinLogs[d]?.sleep != null) : a === "workout" ? Object.values(workoutLogs[d] || {}).some(ex => ex.sets?.length > 0) : a === "nofap" ? logs[d]?.h9?.done : false;
        const hasB = checkinLogs[d]?.[b] != null;
        return hasA && hasB;
      });
      const daysWithoutA = r.filter(d => {
        const noA = a === "protein" ? !logs[d]?.h5?.done : a === "sleep_score" ? (checkinLogs[d]?.sleep != null && checkinLogs[d]?.sleep < 3) : a === "workout" ? !Object.values(workoutLogs[d] || {}).some(ex => ex.sets?.length > 0) : a === "nofap" ? !logs[d]?.h9?.done : false;
        return noA && checkinLogs[d]?.[b] != null;
      });
      if (daysWithBoth.length < 5 || daysWithoutA.length < 5) return;
      const avgWith = daysWithBoth.reduce((s, d) => s + (checkinLogs[d]?.[b] || 0), 0) / daysWithBoth.length;
      const avgWithout = daysWithoutA.reduce((s, d) => s + (checkinLogs[d]?.[b] || 0), 0) / daysWithoutA.length;
      const diff = avgWith - avgWithout;
      if (Math.abs(diff) > 0.3) results.push({ labelA, labelB, diff: diff.toFixed(1), positive: diff > 0, n: daysWithBoth.length });
    });
    return results.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5);
  })();
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", maxWidth: 480, margin: "0 auto", padding: "60px 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 12 }}>← Back</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700 }}>Analytics</div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["daily","weekly","monthly","yearly"].map(p => (
          <button key={p} className="press" onClick={() => setPeriod(p)} style={{ flex: 1, background: period === p ? C.skincare : C.surface, border: `1px solid ${period === p ? C.skincare : C.border}`, borderRadius: 7, padding: "7px 4px", color: period === p ? "#000" : C.muted, fontSize: 10, textTransform: "capitalize" }}>{p}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[[`${avgCompletion}%`,"Avg Completion",C.skincare],[`${avgProtein}g`,"Avg Protein/Day",C.diet],[`${totalSets}`,"Total Sets",C.workout],[`${nofapStreak}d`,"NoFap Streak",C.nofap]].map(([val, label, color]) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${color}18`, borderRadius: 10, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 22, color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      <ChartCard title="Habit Completion" color={C.skincare} data={dispHabit} valueKey="value" unit="%" maxVal={100} />
      <ChartCard title="Daily Protein (g)" color={C.diet} data={dispProtein} valueKey="value" unit="g" maxVal={200} target={178} />
      <ChartCard title="Daily Calories" color={C.haircare} data={dispCalorie} valueKey="value" unit="" maxVal={4000} target={3030} />
      <ChartCard title="Workout Sets" color={C.workout} data={dispWorkout} valueKey="value" unit="" maxVal={30} />
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginTop: 14 }}>
        <div style={{ fontSize: 9, color: C.skincare, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Category Consistency</div>
        {catConsistency.map(({ cat, pct }) => (
          <div key={cat} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "#888", textTransform: "capitalize" }}>{cat}</span>
              <span style={{ fontSize: 11, color: COLORS[cat] }}>{pct}%</span>
            </div>
            <div style={{ background: C.faint, borderRadius: 3, height: 3 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: COLORS[cat], borderRadius: 3, transition: "width 0.8s ease" }} />
            </div>
          </div>
        ))}
      </div>
      <BestLifts workoutLogs={workoutLogs} />

      {/* Correlation Insights */}
      {correlations.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid #A07EE025`, borderRadius: 12, padding: 14, marginTop: 14 }}>
          <div style={{ fontSize: 9, color: "#A07EE0", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Correlation Insights</div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>Based on last 30 days of data</div>
          {correlations.map((c, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < correlations.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: C.text, flex: 1, lineHeight: 1.4 }}>
                  {c.labelA} → {c.positive ? "higher" : "lower"} {c.labelB}
                </div>
                <div style={{ fontSize: 13, color: c.positive ? C.haircare : C.nofap, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, marginLeft: 8 }}>
                  {c.positive ? "+" : ""}{c.diff}
                </div>
              </div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{c.n} days analyzed</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, color, data, valueKey, unit, maxVal, target }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), maxVal * 0.1);
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 9, color, letterSpacing: 3, textTransform: "uppercase" }}>{title}</div>
        {target && <div style={{ fontSize: 9, color: C.muted }}>Target: {target}{unit}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70, overflowX: "auto" }}>
        {data.map((d, i) => {
          const val = d[valueKey] || 0;
          const h = Math.max(3, (val / Math.max(max, 1)) * 60);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 8, color: val > 0 ? color : C.muted }}>{val > 0 ? `${val}${unit}` : ""}</div>
              <div style={{ width: "100%", background: `${color}${Math.max(30, Math.round(30 + (val / Math.max(max, 1)) * 80)).toString(16)}`, borderRadius: "3px 3px 0 0", height: `${h}px`, transition: "height 0.5s ease" }} />
              <div style={{ fontSize: 8, color: C.muted }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BestLifts({ workoutLogs }) {
  const [selected, setSelected] = useState(null);
  const bests = {};
  Object.values(workoutLogs).forEach(dayLog => {
    Object.entries(dayLog).forEach(([exName, exData]) => {
      (exData.sets || []).forEach(s => { if (!bests[exName] || s.weight > bests[exName].weight) bests[exName] = s; });
    });
  });
  const entries = Object.entries(bests).sort((a, b) => b[1].weight - a[1].weight);
  if (!entries.length) return null;
  function getHistory(exName) {
    return Object.entries(workoutLogs).filter(([_, d]) => d[exName]?.sets?.length > 0)
      .map(([date, d]) => { const sets = d[exName].sets; return { date, maxWeight: Math.max(...sets.map(s => s.weight || 0)), volume: sets.reduce((a, s) => a + ((s.weight || 0) * (s.reps || 0)), 0) }; })
      .sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  }
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: C.workout, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Personal Bests</div>
        {entries.map(([name, set], i) => {
          const isSelected = selected === name;
          const history = isSelected ? getHistory(name) : [];
          return (
            <div key={name}>
              <div className="press" onClick={() => setSelected(isSelected ? null : name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < entries.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontSize: 12, color: "#AAA" }}>{name}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: C.workout }}>{set.weight}kg × {set.reps}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>all time best</div>
                </div>
              </div>
              {isSelected && history.length > 0 && (
                <div style={{ padding: "12px 0 8px" }}>
                  <div style={{ fontSize: 9, color: C.workout, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Last 7 Sessions — Max Weight</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, marginBottom: 8 }}>
                    {history.map((h, idx) => {
                      const maxWt = Math.max(...history.map(x => x.maxWeight), 1);
                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{ fontSize: 8, color: C.workout }}>{h.maxWeight > 0 ? h.maxWeight : ""}</div>
                          <div style={{ width: "100%", background: `${C.workout}70`, borderRadius: "3px 3px 0 0", height: `${Math.max(3, (h.maxWeight / maxWt) * 50)}px` }} />
                          <div style={{ fontSize: 7, color: C.muted }}>{new Date(h.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROUTINES VIEW ────────────────────────────────────────────────────────────
function RoutinesView({ selected, setSelected, nofapStreak, setNofapStart, nofapHistory, setNofapHistory, workoutPlan, setWorkoutPlan, skincarePlan, setSkincarePlan, dietPlan, setDietPlan, haircarePlan, setHaircarePlan, spiritualPlan, setSpiritualPlan }) {
  const [editing, setEditing] = useState(false);
  const DEFAULT_PLANS = [
    { id: "workout",   label: "Workout",      icon: "◆", color: "#5B8DEF", meta: "6 days/week · Arms focused" },
    { id: "skincare",  label: "Skincare",     icon: "✦", color: "#C9A96E", meta: "AM + PM · 4 steps" },
    { id: "diet",      label: "Diet",         icon: "◉", color: "#E07B5A", meta: "6 meals · ~3030 kcal · ~178g protein" },
    { id: "nofap",     label: "NoFap",        icon: "⬡", color: "#E05A7B", meta: "Full celibacy · Streak + Protocol" },
    { id: "haircare",  label: "Hair Care",    icon: "◈", color: "#7EB8A4", meta: "Wash days + Daily + Weekly" },
    { id: "spiritual", label: "Spirituality", icon: "✦", color: "#C9A96E", meta: "Morning · Day · Night" },
  ];
  const [planList, setPlanList] = useLS("anant_v3_plan_list", DEFAULT_PLANS);

  function removePlan(id) { setPlanList(p => p.filter(r => r.id !== id)); }
  function updatePlanMeta(id, field, val) { setPlanList(p => p.map(r => r.id === id ? { ...r, [field]: val } : r)); }
  function addPlan() {
    const newId = `custom_${Date.now()}`;
    setPlanList(p => [...p, { id: newId, label: "New Plan", icon: "◉", color: "#7EB8A4", meta: "Add a description" }]);
  }

  if (!selected) return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 700, lineHeight: 1 }}>Your Plans</div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, marginTop: 4 }}>Tap to view or edit any plan</div>
        </div>
        <button onClick={() => setEditing(e => !e)} style={editBtnStyle(editing)}>{editing ? "✓ Done" : "✎ Edit"}</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {planList.map(r => (
          <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            {editing ? (
              <>
                <span style={{ color: r.color, fontSize: 20, width: 24, flexShrink: 0 }}>{r.icon}</span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <input style={{ ...editInput, fontSize: 13 }} value={r.label} onChange={e => updatePlanMeta(r.id, "label", e.target.value)} />
                  <input style={{ ...editInput, color: C.muted, fontSize: 10 }} value={r.meta} onChange={e => updatePlanMeta(r.id, "meta", e.target.value)} />
                </div>
                <RemoveBtn onClick={() => removePlan(r.id)} />
              </>
            ) : (
             <button className="press" onClick={() => setSelected(r.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", color: C.text, textAlign: "left", flex: 1, padding: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${r.color}15`, border: `1px solid ${r.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: r.color, fontSize: 18 }}>{r.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{r.meta}</div>
                </div>
                <span style={{ color: C.muted, fontSize: 16 }}>›</span>
              </button> 
            )}
          </div>
        ))}
        {editing && <AddButton onClick={addPlan} label="+ Add Plan" color={C.skincare} />}
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: 11, marginBottom: 20, letterSpacing: 1, fontFamily: "inherit", cursor: "pointer" }}>← Back</button>
      {selected === "workout"   && <WorkoutPlan   plan={workoutPlan}   setPlan={setWorkoutPlan} />}
      {selected === "skincare"  && <SkincarePlan  plan={skincarePlan}  setPlan={setSkincarePlan} />}
      {selected === "diet"      && <DietPlan      plan={dietPlan}      setPlan={setDietPlan} />}
      {selected === "nofap"     && <NofapPlan     nofapStreak={nofapStreak} setNofapStart={setNofapStart} nofapHistory={nofapHistory} setNofapHistory={setNofapHistory} />}
     {selected === "haircare"  && <HaircarePlan  plan={haircarePlan}  setPlan={setHaircarePlan} />}
      {selected === "spiritual" && <SpiritualPlan plan={spiritualPlan} setPlan={setSpiritualPlan} />}
      {!["workout","skincare","diet","nofap","haircare","spiritual"].includes(selected) && (
        <CustomPlanEditor planId={selected} planList={planList} setPlanList={setPlanList} />
      )}
    </div>
  );
}

// ─── CUSTOM PLAN EDITOR ───────────────────────────────────────────────────────
function CustomPlanEditor({ planId, planList, setPlanList }) {
  const plan = planList.find(p => p.id === planId);
  const [customPlans, setCustomPlans] = useLS("anant_v3_custom_plans", {});
  const content = customPlans[planId] || { sections: [] };

  function setContent(updater) {
    setCustomPlans(p => {
      const current = p[planId] || { sections: [] };
      const updated = typeof updater === "function" ? updater(current) : updater;
      return { ...p, [planId]: updated };
    });
  }

  function addSection() {
    setContent(p => ({ ...p, sections: [...p.sections, { id: `s_${Date.now()}`, title: "New Section", items: [] }] }));
  }
  function removeSection(sid) {
    setContent(p => ({ ...p, sections: p.sections.filter(s => s.id !== sid) }));
  }
  function updateSectionTitle(sid, val) {
    setContent(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, title: val } : s) }));
  }
  function addItem(sid) {
    setContent(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: [...s.items, { id: `i_${Date.now()}`, text: "", note: "" }] } : s) }));
  }
  function removeItem(sid, iid) {
    setContent(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: s.items.filter(it => it.id !== iid) } : s) }));
  }
  function updateItem(sid, iid, field, val) {
    setContent(p => ({ ...p, sections: p.sections.map(s => s.id === sid ? { ...s, items: s.items.map(it => it.id === iid ? { ...it, [field]: val } : it) } : s) }));
  }
  function updatePlanColor(val) {
    setPlanList(p => p.map(pl => pl.id === planId ? { ...pl, color: val } : pl));
  }
  function updatePlanIcon(val) {
    setPlanList(p => p.map(pl => pl.id === planId ? { ...pl, icon: val } : pl));
  }

  const color = plan?.color || C.skincare;
  const ICON_OPTIONS = ["◆", "◉", "◈", "✦", "⬡", "★", "♪", "◎", "◇", "▲", "⚡", "☽"];
  const COLOR_OPTIONS = [C.workout, C.skincare, C.diet, C.nofap, C.haircare, "#A07EE0", "#7c6fa0", "#FFD700", "#4CAF50", "#FF5722"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Plan header */}
      <div style={{ background: C.surface, border: `1px solid ${color}30`, borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, color, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Plan Settings</div>

        {/* Icon picker */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>Icon</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => updatePlanIcon(ic)} style={{ width: 36, height: 36, borderRadius: 8, background: plan?.icon === ic ? `${color}20` : C.faint, border: `1px solid ${plan?.icon === ic ? color : C.border}`, color: plan?.icon === ic ? color : C.muted, fontSize: 16, fontFamily: "inherit", cursor: "pointer" }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>Color</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {COLOR_OPTIONS.map(col => (
              <button key={col} onClick={() => updatePlanColor(col)} style={{ width: 28, height: 28, borderRadius: "50%", background: col, border: `2px solid ${plan?.color === col ? "#fff" : "transparent"}`, cursor: "pointer", boxShadow: plan?.color === col ? `0 0 8px ${col}` : "none" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      {content.sections.length === 0 ? (
        <div style={{ background: C.surface, border: `1px dashed ${color}30`, borderRadius: 12, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, lineHeight: 1.7 }}>
            No content yet. Add a section to start building your plan.
          </div>
          <button onClick={addSection} style={{ background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8, padding: "10px 20px", color, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
            + Add First Section
          </button>
        </div>
      ) : (
        content.sections.map((sec, si) => (
          <div key={sec.id} style={{ background: C.surface, border: `1px solid ${color}18`, borderRadius: 12, padding: 14 }}>
            {/* Section header */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <input
                style={{ ...editInput, flex: 1, color, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}
                value={sec.title}
                onChange={e => updateSectionTitle(sec.id, e.target.value)}
                placeholder="Section title"
              />
              <RemoveBtn onClick={() => removeSection(sec.id)} />
            </div>

            {/* Items */}
            {sec.items.map((item, ii) => (
              <div key={item.id} style={{ borderBottom: ii < sec.items.length - 1 ? `1px solid ${C.border}` : "none", padding: "8px 0" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color, fontSize: 10, flexShrink: 0, marginTop: 8 }}>·</span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                    <input
                      style={editInput}
                      value={item.text}
                      onChange={e => updateItem(sec.id, item.id, "text", e.target.value)}
                      placeholder="Step / task / item"
                    />
                    <input
                      style={{ ...editInput, color: C.muted, fontSize: 11 }}
                      value={item.note}
                      onChange={e => updateItem(sec.id, item.id, "note", e.target.value)}
                      placeholder="Note (optional)"
                    />
                  </div>
                  <RemoveBtn onClick={() => removeItem(sec.id, item.id)} />
                </div>
              </div>
            ))}

            <AddButton onClick={() => addItem(sec.id)} label="+ Add item" color={color} />
          </div>
        ))
      )}

      {content.sections.length > 0 && (
          <AddButton onClick={addSection} label="+ Add Section" color={color} />
        )}
      </div>
    );
}

// ─── WORKOUT PLAN (editable) ──────────────────────────────────────────────────
function WorkoutPlan({ plan, setPlan }) {
  const [active, setActive] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [editing, setEditing] = useState(false);
  const d = plan[active];
  function updateFocus(val)         { setPlan(p => p.map((day, i) => i === active ? { ...day, focus: val } : day)); }
  function updateDayName(val)       { setPlan(p => p.map((day, i) => i === active ? { ...day, day: val } : day)); }
  function updateSectionTitle(si, val) { setPlan(p => p.map((day, i) => i === active ? { ...day, sections: day.sections.map((sec, j) => j === si ? { ...sec, title: val } : sec) } : day)); }
  function updateExercise(si, ei, val) { setPlan(p => p.map((day, i) => i === active ? { ...day, sections: day.sections.map((sec, j) => j === si ? { ...sec, exercises: sec.exercises.map((ex, k) => k === ei ? val : ex) } : sec) } : day)); }
  function addExercise(si)          { setPlan(p => p.map((day, i) => i === active ? { ...day, sections: day.sections.map((sec, j) => j === si ? { ...sec, exercises: [...sec.exercises, "New exercise"] } : sec) } : day)); }
  function removeExercise(si, ei)   { setPlan(p => p.map((day, i) => i === active ? { ...day, sections: day.sections.map((sec, j) => j === si ? { ...sec, exercises: sec.exercises.filter((_, k) => k !== ei) } : sec) } : day)); }
  function addSection()             { setPlan(p => p.map((day, i) => i === active ? { ...day, sections: [...day.sections, { title: "New Section", exercises: ["New exercise"] }] } : day)); }
  function removeSection(si)        { setPlan(p => p.map((day, i) => i === active ? { ...day, sections: day.sections.filter((_, j) => j !== si) } : day)); }
  function addDay()                 { setPlan(p => [...p, { day: `Day ${p.length + 1}`, focus: "New Day", sections: [] }]); }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <EditHeader title="Workout Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(WORKOUT_DAYS); setEditing(false); }} />
      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4 }}>
        {plan.map((day, i) => (
          <button key={i} className="press" onClick={() => setActive(i)} style={{ background: active === i ? C.workout : C.surface, border: `1px solid ${active === i ? C.workout : C.border}`, borderRadius: 7, padding: "6px 10px", color: active === i ? "#000" : C.muted, fontSize: 10, whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {day.day.replace("Day ", "D")}
          </button>
        ))}
        {editing && <button onClick={addDay} style={{ background: "none", border: `1px dashed ${C.muted}`, borderRadius: 7, padding: "6px 10px", color: C.muted, fontSize: 10, whiteSpace: "nowrap", fontFamily: "inherit", cursor: "pointer" }}>+ Day</button>}
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        {editing ? (
          <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <input style={editInput} value={d.day}   onChange={e => updateDayName(e.target.value)} placeholder="Day name" />
            <input style={editInput} value={d.focus} onChange={e => updateFocus(e.target.value)}   placeholder="Focus" />
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.workout, marginBottom: 12 }}>{d.focus}</div>
        )}
        {d.sections.length === 0 && !editing ? (
          <div style={{ fontSize: 12, color: C.muted }}>Rest. Recover.</div>
        ) : (
          d.sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                {editing ? (
                  <><input style={{ ...editInput, fontSize: 10 }} value={sec.title} onChange={e => updateSectionTitle(si, e.target.value)} /><RemoveBtn onClick={() => removeSection(si)} /></>
                ) : (
                  <div style={{ fontSize: 9, color: C.dim, letterSpacing: 2, textTransform: "uppercase" }}>{sec.title}</div>
                )}
              </div>
              {sec.exercises.map((ex, ei) => (
                <div key={ei} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: ei < sec.exercises.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  {editing ? (
                    <><input style={editInput} value={ex} onChange={e => updateExercise(si, ei, e.target.value)} /><RemoveBtn onClick={() => removeExercise(si, ei)} /></>
                  ) : (
                    <div style={{ fontSize: 12, color: "#CCC" }}>{ex}</div>
                  )}
                </div>
              ))}
              {editing && <AddButton onClick={() => addExercise(si)} label="+ Exercise" color={C.workout} />}
            </div>
          ))
        )}
        {editing && <AddButton onClick={addSection} label="+ Section" color={C.workout} />}
      </div>
    </div>
  );
}

// ─── SKINCARE PLAN (editable) ─────────────────────────────────────────────────
function SkincarePlan({ plan, setPlan }) {
  const [editing, setEditing] = useState(false);
  function updateStep(period, idx, field, val)  { setPlan(p => ({ ...p, [period]: p[period].map((s, i) => i === idx ? { ...s, [field]: val } : s) })); }
  function addStep(period)                       { const n = plan[period].length + 1; setPlan(p => ({ ...p, [period]: [...p[period], { step: n, task: "New step", note: "" }] })); }
  function removeStep(period, idx)              { setPlan(p => ({ ...p, [period]: p[period].filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })) })); }
  function updateToBuy(idx, field, val)         { setPlan(p => ({ ...p, toBuy: p.toBuy.map((t, i) => i === idx ? { ...t, [field]: val } : t) })); }
  function addToBuy()                            { setPlan(p => ({ ...p, toBuy: [...p.toBuy, { item: "New item", price: "~₹0" }] })); }
  function removeToBuy(idx)                      { setPlan(p => ({ ...p, toBuy: p.toBuy.filter((_, i) => i !== idx) })); }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <EditHeader title="Skincare Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(DEFAULT_SKINCARE); setEditing(false); }} />
      {[{ key: "morning", label: "Morning" }, { key: "night", label: "Night" }].map(({ key, label }) => (
        <div key={key} style={{ background: C.surface, border: `1px solid ${C.skincare}18`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: C.skincare, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>{label}</div>
          {plan[key].map((s, i) => (
            <div key={i} style={{ padding: "9px 0", borderBottom: i < plan[key].length - 1 ? `1px solid ${C.border}` : "none" }}>
              {editing ? (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ color: C.skincare, fontSize: 11, flexShrink: 0, marginTop: 6 }}>{s.step}.</span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                    <input style={editInput} value={s.task} onChange={e => updateStep(key, i, "task", e.target.value)} placeholder="Step name" />
                    <input style={{ ...editInput, color: "#888" }} value={s.note} onChange={e => updateStep(key, i, "note", e.target.value)} placeholder="Note" />
                  </div>
                  <RemoveBtn onClick={() => removeStep(key, i)} />
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: C.skincare, fontSize: 11, flexShrink: 0 }}>{s.step}.</span>
                  <div>
                    <div style={{ fontSize: 12 }}>{s.task}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{s.note}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {editing && <AddButton onClick={() => addStep(key)} label="+ Step" color={C.skincare} />}
        </div>
      ))}
      <div style={{ background: C.faint, border: `1px solid ${C.skincare}15`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: C.skincare, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>To Buy</div>
        {plan.toBuy.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "6px 0", borderBottom: i < plan.toBuy.length - 1 ? `1px solid ${C.border}` : "none" }}>
            {editing ? (
              <><input style={{ ...editInput, flex: 2 }} value={t.item} onChange={e => updateToBuy(i, "item", e.target.value)} /><input style={{ ...editInput, flex: 1 }} value={t.price} onChange={e => updateToBuy(i, "price", e.target.value)} /><RemoveBtn onClick={() => removeToBuy(i)} /></>
            ) : (
              <><span style={{ flex: 1, fontSize: 12 }}>{t.item}</span><span style={{ fontSize: 11, color: C.skincare }}>{t.price}</span></>
            )}
          </div>
        ))}
        {editing && <AddButton onClick={addToBuy} label="+ Item" color={C.skincare} />}
      </div>
    </div>
  );
}

// ─── DIET PLAN (editable) ─────────────────────────────────────────────────────
function DietPlan({ plan, setPlan }) {
  const [editing, setEditing] = useState(false);
  function updateTarget(val)              { setPlan(p => ({ ...p, target: val })); }
  function updateMealField(idx, field, val) { setPlan(p => ({ ...p, meals: p.meals.map((m, i) => i === idx ? { ...m, [field]: val } : m) })); }
  function updateMealItem(mIdx, iIdx, val)  { setPlan(p => ({ ...p, meals: p.meals.map((m, i) => i === mIdx ? { ...m, items: m.items.map((it, j) => j === iIdx ? val : it) } : m) })); }
  function addMealItem(mIdx)              { setPlan(p => ({ ...p, meals: p.meals.map((m, i) => i === mIdx ? { ...m, items: [...m.items, "New item"] } : m) })); }
  function removeMealItem(mIdx, iIdx)     { setPlan(p => ({ ...p, meals: p.meals.map((m, i) => i === mIdx ? { ...m, items: m.items.filter((_, j) => j !== iIdx) } : m) })); }
  function addMeal()                      { setPlan(p => ({ ...p, meals: [...p.meals, { time: "00:00 AM", label: `Meal ${p.meals.length + 1}`, items: ["New item"], macros: "~0g P · ~0 kcal" }] })); }
  function removeMeal(idx)               { setPlan(p => ({ ...p, meals: p.meals.filter((_, i) => i !== idx) })); }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <EditHeader title="Diet Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(DEFAULT_DIET); setEditing(false); }} />
      {editing ? (
        <input style={editInput} value={plan.target} onChange={e => updateTarget(e.target.value)} />
      ) : (
        <div style={{ background: `${C.diet}12`, border: `1px solid ${C.diet}30`, borderRadius: 10, padding: "11px 14px", fontSize: 12, color: C.diet }}>{plan.target}</div>
      )}
      {plan.meals.map((m, idx) => (
        <div key={idx} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start" }}>
            {editing ? (
              <div style={{ display: "flex", gap: 6, flex: 1, marginRight: 8 }}>
                <input style={{ ...editInput, flex: 2 }} value={m.label} onChange={e => updateMealField(idx, "label", e.target.value)} placeholder="Meal name" />
                <input style={{ ...editInput, flex: 1 }} value={m.time}  onChange={e => updateMealField(idx, "time",  e.target.value)} placeholder="Time" />
              </div>
            ) : (
              <><span style={{ fontSize: 13, color: C.diet }}>{m.label}</span><span style={{ fontSize: 10, color: C.muted }}>{m.time}</span></>
            )}
            {editing && <RemoveBtn onClick={() => removeMeal(idx)} />}
          </div>
          {m.items.map((item, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: j < m.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
              {editing ? (
                <><input style={editInput} value={item} onChange={e => updateMealItem(idx, j, e.target.value)} /><RemoveBtn onClick={() => removeMealItem(idx, j)} /></>
              ) : (
                <div style={{ fontSize: 12, color: "#888" }}>· {item}</div>
              )}
            </div>
          ))}
          {editing && <AddButton onClick={() => addMealItem(idx)} label="+ Item" color={C.diet} />}
          <div style={{ marginTop: 8 }}>
            {editing ? (
              <input style={{ ...editInput, color: C.muted }} value={m.macros} onChange={e => updateMealField(idx, "macros", e.target.value)} placeholder="Macros" />
            ) : (
              <div style={{ fontSize: 10, color: C.muted }}>{m.macros}</div>
            )}
          </div>
        </div>
      ))}
      {editing && <AddButton onClick={addMeal} label="+ Add Meal" color={C.diet} />}
    </div>
  );
}

// ─── HAIRCARE PLAN (editable) ─────────────────────────────────────────────────
function HaircarePlan({ plan, setPlan }) {
  const [editing, setEditing] = useState(false);
  function updateWashStep(idx, field, val)  { setPlan(p => ({ ...p, washDay: p.washDay.map((s, i) => i === idx ? { ...s, [field]: val } : s) })); }
  function addWashStep()                    { setPlan(p => ({ ...p, washDay: [...p.washDay, { step: p.washDay.length + 1, task: "New step", note: "" }] })); }
  function removeWashStep(idx)              { setPlan(p => ({ ...p, washDay: p.washDay.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })) })); }
  function updateListItem(listKey, idx, val){ setPlan(p => ({ ...p, [listKey]: p[listKey].map((s, i) => i === idx ? val : s) })); }
  function addListItem(listKey)             { setPlan(p => ({ ...p, [listKey]: [...p[listKey], "New item"] })); }
  function removeListItem(listKey, idx)     { setPlan(p => ({ ...p, [listKey]: p[listKey].filter((_, i) => i !== idx) })); }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <EditHeader title="Hair Care Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(DEFAULT_HAIRCARE); setEditing(false); }} />
      <div style={{ background: C.surface, border: `1px solid ${C.haircare}18`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: C.haircare, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Wash Day (2–3x/week)</div>
        {plan.washDay.map((s, i) => (
          <div key={i} style={{ padding: "9px 0", borderBottom: i < plan.washDay.length - 1 ? `1px solid ${C.border}` : "none" }}>
            {editing ? (
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color: C.haircare, fontSize: 11, flexShrink: 0, marginTop: 6 }}>{s.step}.</span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <input style={editInput} value={s.task} onChange={e => updateWashStep(i, "task", e.target.value)} />
                  <input style={{ ...editInput, color: "#888" }} value={s.note} onChange={e => updateWashStep(i, "note", e.target.value)} />
                </div>
                <RemoveBtn onClick={() => removeWashStep(i)} />
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: C.haircare, fontSize: 11, flexShrink: 0 }}>{s.step}.</span>
                <div>
                  <div style={{ fontSize: 12 }}>{s.task}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{s.note}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        {editing && <AddButton onClick={addWashStep} label="+ Step" color={C.haircare} />}
      </div>
      {[{ key: "daily", label: "Daily" }, { key: "weekly", label: "Weekly" }].map(({ key, label }) => (
        <div key={key} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: C.haircare, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
          {plan[key].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: i < plan[key].length - 1 ? `1px solid ${C.border}` : "none" }}>
              {editing ? (
                <><input style={editInput} value={t} onChange={e => updateListItem(key, i, e.target.value)} /><RemoveBtn onClick={() => removeListItem(key, i)} /></>
              ) : (
                <div style={{ fontSize: 12, color: "#888" }}>· {t}</div>
              )}
            </div>
          ))}
          {editing && <AddButton onClick={() => addListItem(key)} label="+ Item" color={C.haircare} />}
        </div>
      ))}
    </div>
  );
}

// ─── SPIRITUAL PLAN (editable) ────────────────────────────────────────────────
function SpiritualPlan({ plan, setPlan }) {
  const [editing, setEditing] = useState(false);
  function updateSectionTime(si, val)    { setPlan(p => p.map((s, i) => i === si ? { ...s, time: val } : s)); }
  function updateStepTitle(si, ti, val)  { setPlan(p => p.map((s, i) => i === si ? { ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, title: val } : st) } : s)); }
  function updateItem(si, ti, ii, val)   { setPlan(p => p.map((s, i) => i === si ? { ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, items: st.items.map((it, k) => k === ii ? val : it) } : st) } : s)); }
  function addItem(si, ti)               { setPlan(p => p.map((s, i) => i === si ? { ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, items: [...st.items, "New item"] } : st) } : s)); }
  function removeItem(si, ti, ii)        { setPlan(p => p.map((s, i) => i === si ? { ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, items: st.items.filter((_, k) => k !== ii) } : st) } : s)); }
  function addStep(si)                   { setPlan(p => p.map((s, i) => i === si ? { ...s, steps: [...s.steps, { title: "New step", items: ["New item"] }] } : s)); }
  function removeStep(si, ti)            { setPlan(p => p.map((s, i) => i === si ? { ...s, steps: s.steps.filter((_, j) => j !== ti) } : s)); }
  function addSection()                  { setPlan(p => [...p, { time: "NEW SECTION", color: C.skincare, steps: [{ title: "New step", items: ["New item"] }] }]); }
  function removeSection(si)             { setPlan(p => p.filter((_, i) => i !== si)); }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <EditHeader title="Spirituality Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(DEFAULT_SPIRITUAL); setEditing(false); }} />
      {plan.map((section, si) => (
        <div key={si}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {editing ? (
              <><input style={{ ...editInput, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", flex: 1 }} value={section.time} onChange={e => updateSectionTime(si, e.target.value)} /><RemoveBtn onClick={() => removeSection(si)} /></>
            ) : (
              <div style={{ fontSize: 9, color: section.color, letterSpacing: 3, textTransform: "uppercase" }}>{section.time}</div>
            )}
          </div>
          {section.steps.map((step, ti) => (
            <div key={ti} style={{ background: C.surface, border: `1px solid ${section.color}18`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                {editing ? (
                  <><input style={{ ...editInput, color: section.color }} value={step.title} onChange={e => updateStepTitle(si, ti, e.target.value)} /><RemoveBtn onClick={() => removeStep(si, ti)} /></>
                ) : (
                  <div style={{ fontSize: 12, color: section.color }}>{step.title}</div>
                )}
              </div>
              {step.items.map((item, ii) => (
                <div key={ii} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: ii < step.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  {editing ? (
                    <><input style={{ ...editInput, color: "#888" }} value={item} onChange={e => updateItem(si, ti, ii, e.target.value)} /><RemoveBtn onClick={() => removeItem(si, ti, ii)} /></>
                  ) : (
                    <div style={{ fontSize: 12, color: item.startsWith('"') ? C.text : "#888", fontStyle: item.startsWith('"') ? "italic" : "normal", lineHeight: 1.5 }}>{item}</div>
                  )}
                </div>
              ))}
              {editing && <AddButton onClick={() => addItem(si, ti)} label="+ Item" color={section.color} />}
            </div>
          ))}
          {editing && <AddButton onClick={() => addStep(si)} label="+ Step" color={section.color} />}
        </div>
      ))}
      {editing && <AddButton onClick={addSection} label="+ Section" color={C.skincare} />}
    </div>
  );
}

// ─── NOFAP PLAN ───────────────────────────────────────────────────────────────
function NofapPlan({ nofapStreak, setNofapStart, nofapHistory, setNofapHistory }) {
  const milestones = [3, 7, 14, 21, 30, 60, 90, 180, 365];
  const next = milestones.find(m => m > nofapStreak) || 365;
  const pct = Math.min(100, (nofapStreak / next) * 100);
  const [showRelapse, setShowRelapse] = useState(false);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [relapseNote, setRelapseNote] = useState("");
  const history = Array.isArray(nofapHistory) ? nofapHistory : [];
  const deadline = new Date("2027-01-14");
  const daysToDeadline = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
  const longestStreak = history.length ? Math.max(...history.map(h => h.streak), nofapStreak) : nofapStreak;
  const totalCleanDays = history.reduce((a, h) => a + h.streak, 0) + nofapStreak;
  const avgStreak = history.length ? Math.round(history.reduce((a, h) => a + h.streak, 0) / history.length) : nofapStreak;
  const triggerCounts = {};
  history.forEach(h => { (h.triggers || []).forEach(t => { triggerCounts[t] = (triggerCounts[t] || 0) + 1; }); });
  const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0];
  const TRIGGERS = ["Boredom","Late night on phone","Stress / overthinking","Social media","Loneliness","Lack of structure","Curiosity","Emotional pain"];

  function logRelapse() {
    setNofapHistory(p => [...(Array.isArray(p) ? p : []), { date: todayKey(), streak: nofapStreak, triggers: selectedTriggers, note: relapseNote }]);
    setNofapStart(todayKey()); setShowRelapse(false); setSelectedTriggers([]); setRelapseNote("");
  }

  if (showRelapse) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button onClick={() => setShowRelapse(false)} style={{ background: "none", border: "none", color: C.muted, fontSize: 11, letterSpacing: 1, alignSelf: "flex-start", fontFamily: "inherit" }}>← Back</button>
      <div style={{ background: `${C.nofap}10`, border: `1px solid ${C.nofap}25`, borderRadius: 14, padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 18, color: C.nofap, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, marginBottom: 6 }}>Time's Slipping.</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 10 }}>You had a {nofapStreak} day streak.</div>
        <div style={{ background: `${C.nofap}15`, borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 20, color: C.nofap, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{daysToDeadline} days remaining</div>
          <div style={{ fontSize: 11, color: `${C.nofap}70`, marginTop: 4, lineHeight: 1.5 }}>Until January 14, 2027.</div>
        </div>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: C.nofap, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>What triggered it?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TRIGGERS.map(t => {
            const sel = selectedTriggers.includes(t);
            return (
              <button key={t} onClick={() => setSelectedTriggers(p => sel ? p.filter(x => x !== t) : [...p, t])} style={{ background: sel ? `${C.nofap}20` : C.faint, border: `1px solid ${sel ? C.nofap : C.border}`, borderRadius: 20, padding: "6px 12px", color: sel ? C.nofap : C.muted, fontSize: 11, fontFamily: "inherit" }}>
                {t}
              </button>
            );
          })}
        </div>
      </div>
      <textarea value={relapseNote} onChange={e => setRelapseNote(e.target.value)} placeholder="Notes (optional)" style={{ width: "100%", minHeight: 80, resize: "none", fontSize: 12, lineHeight: 1.6 }} />
      <button onClick={logRelapse} style={{ background: C.nofap, border: "none", borderRadius: 10, padding: "14px", color: "#000", fontSize: 13, fontFamily: "inherit", fontWeight: 500 }}>Log Relapse & Reset Streak</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: `${C.nofap}10`, border: `1px solid ${C.nofap}25`, borderRadius: 14, padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 56, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, color: C.nofap, lineHeight: 1 }}>{nofapStreak}</div>
        <div style={{ fontSize: 10, color: `${C.nofap}80`, letterSpacing: 3, textTransform: "uppercase", marginTop: 4 }}>Days Clean</div>
        <div style={{ margin: "14px 0 6px", background: C.faint, borderRadius: 4, height: 4 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: C.nofap, borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>Next milestone: {next} days</div>
        <div style={{ background: `${C.nofap}15`, borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 18, color: C.nofap, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{daysToDeadline} days</div>
          <div style={{ fontSize: 9, color: `${C.nofap}70`, letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Until Jan 14, 2027</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["Longest",`${longestStreak}d`,C.nofap],["Total Clean",`${totalCleanDays}d`,C.haircare],["Avg Streak",`${avgStreak}d`,C.skincare]].map(([label, val, color]) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${color}18`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 18, color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
      {topTrigger && (
        <div style={{ background: C.surface, border: `1px solid ${C.nofap}18`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: C.nofap, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Most Common Trigger</div>
          <div style={{ fontSize: 14, color: C.text }}>{topTrigger[0]} <span style={{ fontSize: 11, color: C.muted }}>({topTrigger[1]}x)</span></div>
        </div>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {milestones.map(m => (
          <div key={m} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, background: nofapStreak >= m ? `${C.nofap}18` : C.surface, border: `1px solid ${nofapStreak >= m ? C.nofap + "50" : C.border}`, color: nofapStreak >= m ? C.nofap : C.muted }}>
            {m}d{nofapStreak >= m ? " ✓" : ""}
          </div>
        ))}
      </div>
      {history.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Streak History</div>
          {[...history].reverse().slice(0, 5).map((h, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < Math.min(history.length, 5) - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.text }}>{h.streak} days</span>
                <span style={{ fontSize: 10, color: C.muted }}>{new Date(h.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
              {h.triggers?.length > 0 && <div style={{ fontSize: 10, color: C.nofap, marginTop: 3 }}>{h.triggers.join(", ")}</div>}
              {h.note && <div style={{ fontSize: 11, color: C.muted, marginTop: 3, fontStyle: "italic" }}>{h.note}</div>}
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setShowRelapse(true)} style={{ background: "none", border: `1px solid ${C.nofap}40`, borderRadius: 8, color: C.nofap, padding: 12, fontSize: 11, fontFamily: "inherit", letterSpacing: 1, textTransform: "uppercase" }}>
        I Relapsed — Log & Reset
      </button>
    </div>
  );
}

// ─── STATS VIEW ───────────────────────────────────────────────────────────────
function StatsView({ xpLogs, achievements, logs, getStreak, nofapStreak }) {
  const totalXP = getTotalXP(xpLogs);
  const rank = getCurrentRank(totalXP);
  const nextRank = getNextRank(totalXP);
  const xpToNext = nextRank.xpRequired - totalXP;
  const rankProgress = nextRank.xpRequired === rank.xpRequired ? 100 : Math.round(((totalXP - rank.xpRequired) / (nextRank.xpRequired - rank.xpRequired)) * 100);
  const SL_RED = "#FF0000", SL_SILVER = "#C0C0C0", SL_BLUE = "#4169E1";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 20 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Player Status</div>
      {/* Rank card */}
      <div style={{ background: "linear-gradient(135deg, #0A0A0F 0%, #0D0D1A 100%)", border: `1px solid ${rank.color}40`, borderRadius: 16, padding: 20, textAlign: "center", boxShadow: `0 0 30px ${rank.color}20` }}>
        <div style={{ fontSize: 11, color: rank.color, letterSpacing: 4, textTransform: "uppercase", marginBottom: 8, textShadow: `0 0 10px ${rank.color}` }}>RANK</div>
        <div style={{ fontSize: 72, color: rank.color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, lineHeight: 1, textShadow: `0 0 20px ${rank.color}, 0 0 40px ${rank.color}60` }}>{rank.rank}</div>
        <div style={{ fontSize: 16, color: SL_SILVER, fontFamily: "'Cormorant Garamond',serif", marginTop: 6, letterSpacing: 2 }}>{rank.title}</div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginBottom: 6 }}>
            <span>{totalXP.toLocaleString()} XP</span>
            <span>{xpToNext > 0 ? `${xpToNext.toLocaleString()} to ${nextRank.rank}` : "MAX RANK"}</span>
          </div>
          <div style={{ background: "#1A1A2E", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${rankProgress}%`, height: "100%", background: `linear-gradient(90deg, ${rank.color}, ${SL_SILVER})`, borderRadius: 4, transition: "width 0.8s ease", boxShadow: `0 0 10px ${rank.color}` }} />
          </div>
        </div>
      </div>
      {/* Category stats */}
      <div style={{ background: C.surface, border: `1px solid ${SL_BLUE}30`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: SL_BLUE, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14, textShadow: `0 0 8px ${SL_BLUE}` }}>Category Stats</div>
        {Object.entries(CATEGORY_LEVELS).map(([cat, data]) => {
          const catXP = getCategoryXP(logs, cat); // FIX: uses logs not xpLogs
          const level = getCategoryLevel(catXP);
          const levelName = data.levels[level];
          const nextLevelXP = [0, 200, 600, 1500, 3500, 7000, 15000][Math.min(level + 1, 6)];
          const pct = level >= 6 ? 100 : Math.round((catXP / nextLevelXP) * 100);
          return (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: COLORS[cat] || SL_SILVER, fontSize: 11 }}>{data.icon}</span>
                  <span style={{ fontSize: 11, color: C.text }}>{data.name}</span>
                  <span style={{ fontSize: 9, color: COLORS[cat] || SL_SILVER, background: `${COLORS[cat] || SL_SILVER}15`, padding: "2px 6px", borderRadius: 4 }}>Lv.{level} {levelName}</span>
                </div>
                <span style={{ fontSize: 10, color: C.muted }}>{catXP} XP</span>
              </div>
              <div style={{ background: "#1A1A2E", borderRadius: 3, height: 4 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: COLORS[cat] || SL_SILVER, borderRadius: 3, boxShadow: `0 0 6px ${COLORS[cat] || SL_SILVER}80` }} />
              </div>
            </div>
          );
        })}
      </div>
      {/* Achievements */}
      <div style={{ background: C.surface, border: `1px solid ${SL_RED}30`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: SL_RED, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14, textShadow: `0 0 8px ${SL_RED}` }}>
          Achievements — {achievements.length}/{ACHIEVEMENTS_LIST.length}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ACHIEVEMENTS_LIST.map(ach => {
            const unlocked = achievements.includes(ach.id);
            return (
              <div key={ach.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: unlocked ? "#1A0A0A" : C.surface, border: `1px solid ${unlocked ? SL_RED + "40" : C.border}`, borderRadius: 10, opacity: unlocked ? 1 : 0.4, transition: "all 0.3s" }}>
                <div style={{ fontSize: 20, filter: unlocked ? "none" : "grayscale(100%)" }}>{ach.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: unlocked ? SL_SILVER : C.muted }}>{ach.title}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{ach.desc}</div>
                </div>
                <div style={{ fontSize: 11, color: unlocked ? SL_RED : C.muted }}>+{ach.xp} XP</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Today's XP */}
      <div style={{ background: "linear-gradient(135deg, #0A0A0F, #0D0D1A)", border: `1px solid ${SL_RED}30`, borderRadius: 12, padding: 14, textAlign: "center" }}>
        <div style={{ fontSize: 9, color: SL_RED, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Today's XP Earned</div>
        <div style={{ fontSize: 36, color: SL_RED, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, textShadow: `0 0 15px ${SL_RED}` }}>{xpLogs[todayKey()] || 0}</div>
        <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>Total: {totalXP.toLocaleString()} XP</div>
      </div>
    </div>
  );
}

// ─── DAILY CHECK-IN POPUP ─────────────────────────────────────────────────────
function DailyCheckin({ onComplete, onSkip }) {
    const [step, setStep] = useState(0);
  const [data, setData] = useState({ mood: null, energy: null, sleep: null, stress: null, focus: null, motivation: null });
  const fields = [
    { key: "mood",       label: "How are you feeling?",     labels: MOOD_LABELS,       color: C.skincare },
    { key: "energy",     label: "Energy level?",            labels: ENERGY_LABELS,     color: C.workout },
    { key: "sleep",      label: "How much did you sleep?",  labels: SLEEP_LABELS,      color: C.haircare },
    { key: "stress",     label: "Stress level?",            labels: STRESS_LABELS,     color: C.nofap },
    { key: "focus",      label: "Mental focus?",            labels: FOCUS_LABELS,      color: C.diet },
    { key: "motivation", label: "Motivation today?",        labels: MOTIVATION_LABELS, color: "#A07EE0" },
  ];
  const current = fields[step];
  const allDone = step >= fields.length;

  if (allDone) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(7,7,10,0.97)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Day logged.</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Your baseline is set. Now execute.</div>
          <button onClick={() => onComplete(data)} style={{ width: "100%", background: C.skincare, border: "none", borderRadius: 10, padding: 14, color: "#000", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>Let's go →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(7,7,10,0.97)", zIndex: 99998, display: "flex", alignItems: "flex-end", justifyContent: "center", WebkitTransform: "translateZ(0)", transform: "translateZ(0)" }}>
      <div style={{ width: "100%", maxWidth: 480, background: C.surface, borderRadius: "20px 20px 0 0", padding: "28px 24px 48px", WebkitTransform: "translateZ(0)", transform: "translateZ(0)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => { if (step > 0) setStep(s => s - 1); }} style={{ background: "none", border: "none", color: step > 0 ? C.muted : "transparent", fontSize: 22, fontFamily: "inherit", padding: "0 4px", lineHeight: 1, cursor: step > 0 ? "pointer" : "default" }}>‹</button>
            <div style={{ display: "flex", gap: 4 }}>
              {fields.map((_, i) => (
                <div key={i} style={{ width: i === step ? 20 : 6, height: 4, borderRadius: 2, background: i <= step ? current.color : C.muted, transition: "all 0.3s" }} />
              ))}
            </div>
          </div>
          <button onClick={onSkip} style={{ background: "none", border: "none", color: C.muted, fontSize: 11, fontFamily: "inherit" }}>skip</button>
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, marginBottom: 24, marginTop: 16 }}>{current.label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {current.labels.map((label, i) => {
            const selected = data[current.key] === i;
            return (
              <button key={i} onClick={() => {
                setData(p => ({ ...p, [current.key]: i }));
                setTimeout(() => setStep(s => s + 1), 300);
              }} style={{ background: selected ? `${current.color}20` : C.faint, border: `1px solid ${selected ? current.color : C.border}`, borderRadius: 10, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", color: selected ? current.color : C.text, fontSize: 13, fontFamily: "inherit", transition: "all 0.2s" }}>
                <span>{label}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{i + 1}/5</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}   //

// ─── JOURNAL CARD ─────────────────────────────────────────────────────────────
function JournalCard({ journalLogs, setJournalLogs, checkinLogs, logs, workoutLogs }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const entry = journalLogs[selectedDate] || {};
  const checkin = checkinLogs[selectedDate];

  function getPrompts() {
    const fixed = [
      { key: "good",   label: "What went well today?" },
      { key: "bad",    label: "What got in the way?" },
      { key: "lesson", label: "What did you learn?" },
    ];
    const dynamic = [];
    const dayLogs = logs[selectedDate] || {};
    const workoutDone = Object.values(workoutLogs[selectedDate] || {}).some(ex => ex.sets?.length > 0);
    const habitsDone = HABITS.filter(h => dayLogs[h.id]?.done).length;
    const guitarDone = dayLogs["h10"]?.done;
    if (!workoutDone) dynamic.push({ key: "workout_miss", label: "You skipped the gym. What happened?" });
    if (!guitarDone)  dynamic.push({ key: "guitar_miss",  label: "No guitar today. What got in the way?" });
    if (habitsDone < HABITS.length * 0.5) dynamic.push({ key: "low_day", label: "Tough day — what drained you?" });
    if (checkin?.mood <= 1) dynamic.push({ key: "mood_low", label: "You were struggling today. What was going on?" });
    if (checkin?.stress >= 3) dynamic.push({ key: "stress", label: "Stress was high. What was the source?" });
    return [...dynamic.slice(0, 2), ...fixed];
  }

  function updateEntry(key, val) {
    setJournalLogs(p => ({ ...p, [selectedDate]: { ...(p[selectedDate] || {}), [key]: val } }));
  }

  const prompts = getPrompts();
  const hasEntry = Object.values(entry).some(v => v?.trim?.().length > 0);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.skincare}25`, borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div className="press" onClick={() => setExpanded(e => !e)} style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700 }}>Journal</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{hasEntry ? "Entry logged" : "No entry yet"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {hasEntry && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.skincare }} />}
          <span style={{ color: C.muted, fontSize: 14 }}>{expanded ? "↑" : "↓"}</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split("T")[0]); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 14 }}>‹</button>
            <div style={{ fontSize: 10, color: selectedDate === todayKey() ? C.muted : C.nofap, flex: 1, textAlign: "center" }}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
            </div>
            <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); const next = d.toISOString().split("T")[0]; if (next <= todayKey()) setSelectedDate(next); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 14 }}>›</button>
          </div>
          {checkin && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[["Mood", MOOD_LABELS[checkin.mood], C.skincare], ["Energy", ENERGY_LABELS[checkin.energy], C.workout], ["Sleep", SLEEP_LABELS[checkin.sleep], C.haircare]].map(([label, val, color]) => val && (
                <div key={label} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 6, padding: "4px 10px", fontSize: 10, color }}>
                  {label}: {val}
                </div>
              ))}
            </div>
          )}
          {prompts.map(p => (
            <div key={p.key} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.skincare, marginBottom: 6, letterSpacing: 0.5 }}>{p.label}</div>
              <textarea
                value={entry[p.key] || ""}
                onChange={e => updateEntry(p.key, e.target.value)}
                placeholder="..."
                style={{ width: "100%", minHeight: 72, resize: "none", fontSize: 12, lineHeight: 1.6, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontFamily: "inherit" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI REVIEW CARD ───────────────────────────────────────────────────────────
function AIReviewCard({ logs, workoutLogs, foodLogs, checkinLogs, journalLogs, xpLogs, aiReviews, setAiReviews, nofapStreak }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePeriod, setActivePeriod] = useState("weekly");

  const PERIODS = [
    { key: "weekly",     label: "Week",    days: 7,   minDays: 5   },
    { key: "monthly",    label: "Month",   days: 30,  minDays: 20  },
    { key: "quarterly",  label: "Quarter", days: 90,  minDays: 60  },
    { key: "halfyearly", label: "6 Month", days: 180, minDays: 120 },
    { key: "yearly",     label: "Year",    days: 365, minDays: 240 },
  ];

  function getRange(days) {
    return Array.from({ length: days }, (_, i) => dateKey(-(days - 1 - i)));
  }

  function getDaysWithData(days) {
    return getRange(days).filter(d => Object.keys(logs[d] || {}).length > 0).length;
  }

  function buildPrompt(period) {
    const days = period.days;
    const range = getRange(days);
    const habitCompletion = Math.round((range.reduce((a, d) => a + HABITS.filter(h => logs[d]?.[h.id]?.done).length, 0) / (HABITS.length * days)) * 100);
    const workoutDays = range.filter(d => Object.values(workoutLogs[d] || {}).some(ex => ex.sets?.length > 0)).length;
    const guitarDays = range.filter(d => logs[d]?.h10?.done).length;
    const nofapDays = range.filter(d => logs[d]?.h9?.done).length;
    const avgMood = (() => { const vals = range.map(d => checkinLogs[d]?.mood).filter(v => v != null); return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "N/A"; })();
    const avgEnergy = (() => { const vals = range.map(d => checkinLogs[d]?.energy).filter(v => v != null); return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "N/A"; })();
    const avgSleep = (() => { const vals = range.map(d => checkinLogs[d]?.sleep).filter(v => v != null); return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "N/A"; })();
    const journalEntries = range.filter(d => journalLogs[d]).map(d => {
      const e = journalLogs[d];
      return `${d}: Good: ${e.good || "-"} | Bad: ${e.bad || "-"} | Lesson: ${e.lesson || "-"}`;
    }).join("\n");
    const totalXP = getTotalXP(xpLogs);
    const totalSets = range.reduce((a, d) => a + Object.values(workoutLogs[d] || {}).reduce((b, ex) => b + (ex.sets?.length || 0), 0), 0);

    const storedProfile = (() => { try { const v = localStorage.getItem("anant_v3_profile"); return v ? JSON.parse(v) : null; } catch { return null; } })();
    const userName = storedProfile?.name || "Anant";
    const alterEgo = storedProfile?.alterEgo?.name ? `Their alter ego — the version of themselves they are becoming — is called "${storedProfile.alterEgo.name}"${storedProfile.alterEgo.title ? `, titled "${storedProfile.alterEgo.title}"` : ""}. Address them occasionally as this alter ego when giving praise or pushing them harder.` : "";
    const shadowModeActive = (() => { try { return window.__shadowMode || false; } catch { return false; } })();
    const shadowTone = shadowModeActive ? " The user is currently in SHADOW MODE — their alter ego is fully activated. Be significantly harsher, more demanding, and address them exclusively as their alter ego. No softness. Pure intensity." : "";
    const userGoals = (storedProfile?.goals || []).slice(0, 4).join(", ");
   return `You are a personal coach reviewing ${period.label.toLowerCase()} data for ${userName}, focused on physique, discipline, and self-improvement.${alterEgo ? " " + alterEgo : ""}${userGoals ? ` Their goals include: ${userGoals}.` : ""}${shadowTone}

DATA (last ${days} days):
- Habit completion: ${habitCompletion}%
- Workout days: ${workoutDays}/${days}
- Guitar practice days: ${guitarDays}/${days}
- NoFap days: ${nofapDays}/${days}
- Total workout sets: ${totalSets}
- NoFap streak: ${nofapStreak} days
- Total XP: ${totalXP}
- Avg mood: ${avgMood}/4 (0=Dead Inside, 4=Unstoppable)
- Avg energy: ${avgEnergy}/4
- Avg sleep: ${avgSleep}/5 (0=<4h, 5=8h+)

JOURNAL ENTRIES:
${journalEntries || "No journal entries this period."}

Write a ${period.label.toLowerCase()} review. Be balanced and motivating but brutally honest. Structure it as:
1. PERFORMANCE SUMMARY (2-3 sentences, key numbers)
2. WHAT'S WORKING (specific patterns you noticed)
3. WHAT NEEDS WORK (specific weak points)
4. KEY INSIGHT (one powerful observation connecting multiple data points)
5. NEXT ${period.label.toUpperCase()} FOCUS (2-3 specific actionable targets)

Keep it concise, direct, masculine. No fluff. Talk to him like a coach who believes in him but won't coddle him.`;
  }

  async function generateReview(period) {
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt(period) }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Could not generate review.";
      const reviewKey = `${period.key}_${todayKey()}`;
      setAiReviews(p => ({ ...p, [reviewKey]: { text, date: todayKey(), period: period.key } }));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function getLatestReview(periodKey) {
    const keys = Object.keys(aiReviews).filter(k => k.startsWith(periodKey));
    if (!keys.length) return null;
    keys.sort().reverse();
    return aiReviews[keys[0]];
  }

  function shouldAutoGenerate(period) {
    const latest = getLatestReview(period.key);
    if (!latest) return true;
    const daysSince = Math.floor((new Date(todayKey()) - new Date(latest.date)) / 86400000);
    const thresholds = { weekly: 7, monthly: 30, quarterly: 90, halfyearly: 180, yearly: 365 };
    return daysSince >= thresholds[period.key];
  }

  useEffect(() => {
    if (expanded) {
      const period = PERIODS.find(p => p.key === activePeriod);
      if (period && getDaysWithData(period.days) >= period.minDays && shouldAutoGenerate(period)) {
        generateReview(period);
      }
    }
  }, [expanded, activePeriod]);

  const activePeriodObj = PERIODS.find(p => p.key === activePeriod);
  const daysWithData = getDaysWithData(activePeriodObj.days);
  const unlocked = daysWithData >= activePeriodObj.minDays;
  const latestReview = getLatestReview(activePeriod);

  return (
    <div style={{ background: C.surface, border: `1px solid #A07EE025`, borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div className="press" onClick={() => setExpanded(e => !e)} style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700 }}>AI Coach</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Performance reviews · Pattern analysis</div>
        </div>
        <span style={{ color: C.muted, fontSize: 14 }}>{expanded ? "↑" : "↓"}</span>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
            {PERIODS.map(p => {
              const days = getDaysWithData(p.days);
              const isUnlocked = days >= p.minDays;
              return (
                <button key={p.key} onClick={() => isUnlocked && setActivePeriod(p.key)} style={{ background: activePeriod === p.key ? "#A07EE0" : C.faint, border: `1px solid ${activePeriod === p.key ? "#A07EE0" : C.border}`, borderRadius: 7, padding: "6px 10px", color: activePeriod === p.key ? "#000" : isUnlocked ? C.text : C.muted, fontSize: 10, whiteSpace: "nowrap", fontFamily: "inherit", opacity: isUnlocked ? 1 : 0.4 }}>
                  {p.label}{!isUnlocked ? ` (${days}/${p.minDays}d)` : ""}
                </button>
              );
            })}
          </div>
          {!unlocked ? (
            <div style={{ background: C.faint, borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>Not enough data yet</div>
              <div style={{ fontSize: 11, color: C.dim }}>{daysWithData}/{activePeriodObj.minDays} days logged to unlock {activePeriodObj.label.toLowerCase()} review</div>
              <div style={{ background: C.border, borderRadius: 3, height: 4, marginTop: 10 }}>
                <div style={{ width: `${Math.min(100, (daysWithData / activePeriodObj.minDays) * 100)}%`, height: "100%", background: "#A07EE0", borderRadius: 3 }} />
              </div>
            </div>
          ) : loading ? (
            <div style={{ background: C.faint, borderRadius: 10, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#A07EE0", marginBottom: 8 }}>Analyzing your data...</div>
              <div style={{ fontSize: 11, color: C.muted }}>Your coach is reviewing everything.</div>
            </div>
          ) : latestReview ? (
            <div>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
                Generated {new Date(latestReview.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap", background: C.faint, borderRadius: 10, padding: 14 }}>
                {latestReview.text}
              </div>
              <button onClick={() => generateReview(activePeriodObj)} style={{ marginTop: 10, width: "100%", background: "none", border: `1px solid #A07EE040`, borderRadius: 8, padding: "9px", color: "#A07EE0", fontSize: 11, fontFamily: "inherit" }}>
                ↺ Regenerate
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}


// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Ring({ value, size, color, label, sublabel }) {
  const r = (size - 14) / 2, circ = 2 * Math.PI * r, offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.faint} strokeWidth={7} />
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 20, color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, marginTop: 2 }}>{sublabel?.toUpperCase()}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${color}25`, borderRadius: 12, padding: "16px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 22, color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 5 }}>{label}</div>
    </div>
  );
}
function ResetProgress({ logs, setLogs, workoutLogs, setWorkoutLogs, weightLogs, setWeightLogs, setNofapStart, xpLogs, setXpLogs, setAchievements }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedResets, setSelectedResets] = useState({ streaks: true, workout: true, weight: false, food: false });
  const [seasons, setSeasons] = useLS("anant_v3_seasons", []);

  const totalDays = Object.keys(logs).filter(k => !k.startsWith("bf_")).length;
  const totalSessions = Object.keys(workoutLogs).length;
  const bestStreak = Math.max(0, ...HABITS.map(h => {
    let s = 0, best = 0, d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = new Date(d.getTime() - i * 86400000).toISOString().split("T")[0];
      if (logs[k]?.[h.id]?.done) { s++; best = Math.max(best, s); } else s = 0;
    }
    return best;
  }));

  const [rebirthScreen, setRebirthScreen] = useState(false);

  function doReset() {
    const season = {
      number: seasons.length + 1,
      date: todayKey(),
      reason: reason || "Fresh start",
      stats: { totalDays, totalSessions, bestStreak, totalXP: getTotalXP(xpLogs) }
    };
    setSeasons(p => [...p, season]);
    if (selectedResets.streaks) setLogs({});
    if (selectedResets.workout) setWorkoutLogs({});
    if (selectedResets.weight) setWeightLogs({});
    if (selectedResets.streaks) setNofapStart(todayKey());
    if (selectedResets.xp) { setXpLogs({}); setAchievements([]); }
    setShowConfirm(false);
    setReason("");
    setRebirthScreen(true);
    setTimeout(() => setRebirthScreen(false), 4000);
  }

  if (rebirthScreen) return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 999999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", padding: 32, textAlign: "center" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:0.4;transform:scale(0.97)}50%{opacity:1;transform:scale(1.03)}}`}</style>
      <div style={{ animation: "pulse 1.8s ease infinite", marginBottom: 24 }}>
        <div style={{ fontSize: 64 }}>◆</div>
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.2 }}>
        Season {seasons.length} Complete.
      </div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.9, maxWidth: 300, marginBottom: 28 }}>
        {totalDays} days logged · {bestStreak}d best streak · {getTotalXP(xpLogs).toLocaleString()} XP earned
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: C.accent, letterSpacing: 2 }}>
        The next chapter begins now.
      </div>
    </div>
  );

  if (showConfirm) return (
    <div style={{ background: C.surface, border: `1px solid #FF000030`, borderRadius: 14, padding: 20, marginTop: 12 }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: "#FF0000", marginBottom: 4 }}>Start New Season</div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>Season {seasons.length + 1} begins today. Your past data is archived, not deleted.</div>

      <div style={{ background: C.faint, borderRadius: 10, padding: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>This Season's Stats (being archived)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["Days Logged", totalDays], ["Workout Sessions", totalSessions], ["Best Streak", `${bestStreak}d`], ["Total XP", getTotalXP(xpLogs).toLocaleString()]].map(([label, val]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, color: C.skincare, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{val}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>What to reset</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {[["streaks", "Habit streaks & logs"], ["workout", "Workout logs & weights"], ["weight", "Body weight history"], ["food", "Food logs"], ["xp", "XP & Rank (full reset)"]].map(([key, label]) => (
          <div key={key} onClick={() => setSelectedResets(p => ({ ...p, [key]: !p[key] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: selectedResets[key] ? "#FF000010" : C.faint, border: `1px solid ${selectedResets[key] ? "#FF000040" : C.border}`, borderRadius: 8, cursor: "pointer" }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: selectedResets[key] ? "#FF0000" : "transparent", border: `2px solid ${selectedResets[key] ? "#FF0000" : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {selectedResets[key] && <span style={{ color: "#000", fontSize: 10, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 12, color: selectedResets[key] ? C.text : C.muted }}>{label}</span>
          </div>
        ))}
      </div>

      <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why are you resetting? (injury, new program, fresh start...)" style={{ width: "100%", minHeight: 70, resize: "none", fontSize: 12, lineHeight: 1.6, marginBottom: 12 }} />

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setShowConfirm(false)} style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px", color: C.muted, fontSize: 12, fontFamily: "inherit" }}>Cancel</button>
        <button onClick={doReset} style={{ flex: 2, background: "#FF0000", border: "none", borderRadius: 8, padding: "11px", color: "#fff", fontSize: 12, fontFamily: "inherit", fontWeight: 600 }}>Start Season {seasons.length + 1}</button>
      </div>

      {seasons.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Past Seasons</div>
          {[...seasons].reverse().map((s, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < seasons.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: C.skincare }}>Season {s.number}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{new Date(s.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{s.reason}</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>{s.stats.totalDays}d logged · {s.stats.totalSessions} sessions · {s.stats.bestStreak}d best streak · {s.stats.totalXP?.toLocaleString()} XP</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <button onClick={() => setShowConfirm(true)} style={{ width: "100%", background: "none", border: `1px solid #FF000030`, borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12, color: "#FF000080", fontFamily: "inherit", marginTop: 4, textAlign: "left" }}>
      <span style={{ fontSize: 18 }}>↺</span>
      <div>
        <div style={{ fontSize: 13, color: "#FF0000" }}>Start New Season</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Reset progress · Archive this season's data</div>
      </div>
      {seasons.length > 0 && <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted }}>Season {seasons.length + 1}</span>}
    </button>
  );
}
