import React, { useState, useEffect, useRef } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#07070A", surface: "#0D0D12", border: "#16161E", faint: "#0F0F16",
  text: "#E8E4DC", muted: "#3A3A48", dim: "#555566",
  workout: "#5B8DEF", skincare: "#C9A96E", diet: "#E07B5A",
  nofap: "#E05A7B", haircare: "#7EB8A4", spiritual: "#C9A96E"
};
const COLORS = {
  workout: C.workout, skincare: C.skincare, diet: C.diet,
  nofap: C.nofap, haircare: C.haircare, spiritual: C.skincare, productivity: "#A07EE0", sleep: "#7c6fa0"
};
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

// ─── STORAGE ──────────────────────────────────────────────────────────────────
function useLS(key, def) {
  const [val, setVal] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [val, key]);
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
export default function App() {
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
  const [xpToast, setXpToast] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [subView, setSubView] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const today = selectedDate;
  const todayLogs = logs[today] || {};
 const [checkinLogs, setCheckinLogs] = useLS("anant_v3_checkin", {});
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

  useEffect(() => {
    const key = todayKey();
    if (!checkinLogs[key] && !checkinDone) {
      setShowCheckin(true);
    }
  }, []);

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
      setXpToast(`+${earned} XP`);
      setTimeout(() => setXpToast(null), 2000);
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
    const entries = Array.isArray(foodLogs[today]) ? foodLogs[today] : [];
    return entries.reduce((acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein:  acc.protein  + (e.protein  || 0),
      carbs:    acc.carbs    + (e.carbs    || 0),
      fat:      acc.fat      + (e.fat      || 0),
      fibre:    acc.fibre    + (e.fibre    || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
  }

  if (subView === "workoutlog") return <WorkoutLogger workoutLogs={workoutLogs} setWorkoutLogs={setWorkoutLogs} workoutPlan={workoutPlan} onBack={() => setSubView(null)} />;
  if (subView === "foodlog")    return <FoodLogger foodLogs={foodLogs} setFoodLogs={setFoodLogs} onBack={() => setSubView(null)} />;
  if (subView === "analytics")  return <AnalyticsView logs={logs} workoutLogs={workoutLogs} foodLogs={foodLogs} nofapStreak={getNofapStreak()} weightLogs={weightLogs} onBack={() => setSubView(null)} />;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "'DM Mono',monospace", width: "100vw", maxWidth: "100%", margin: "0 auto", paddingBottom: 80, overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Cormorant+Garamond:wght@600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:0}
        .press{transition:transform 0.15s ease,opacity 0.15s ease;cursor:pointer}
        .press:active{transform:scale(0.96);opacity:0.8}
        .fade{animation:fd 0.25s ease}
        @keyframes fd{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ring-track{transition:stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)}
        input,textarea{background:#0D0D12;border:1px solid #16161E;color:#E8E4DC;border-radius:7px;padding:8px 10px;font-family:inherit;font-size:13px;outline:none;transition:border 0.2s}
        input:focus,textarea:focus{border-color:#2A2A3A}
        button{cursor:pointer;font-family:inherit}
      `}</style>

      {/* Header */}
      <div style={{ padding: "60px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: C.muted, textTransform: "uppercase" }}>Self System</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>Anant</div>
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
            return <div style={{ fontSize: 9, color: rank.color, letterSpacing: 1, marginTop: 2, textShadow: `0 0 8px ${rank.color}` }}>[{rank.rank}] {rank.title}</div>;
          })()}
        </div>
      </div>

      {/* XP Toast */}
      {xpToast && (
        <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: "rgba(7,7,10,0.95)", border: "1px solid #FF000060", borderRadius: 10, padding: "10px 20px", color: "#FF0000", fontSize: 13, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, zIndex: 99999, letterSpacing: 1, boxShadow: "0 0 20px #FF000040" }}>
          {xpToast}
        </div>
      )}
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
        {view === "log" && <LogHub setSubView={setSubView} todayMacros={getTodayMacros()} workoutLogs={workoutLogs} setWorkoutLogs={setWorkoutLogs} weightLogs={weightLogs} setWeightLogs={setWeightLogs} logs={logs} setLogs={setLogs} foodLogs={foodLogs} setFoodLogs={setFoodLogs} nofapStreak={getNofapStreak()} setNofapStart={setNofapStart} xpLogs={xpLogs} setXpLogs={setXpLogs} checkinLogs={checkinLogs} journalLogs={journalLogs} setJournalLogs={setJournalLogs} aiReviews={aiReviews} setAiReviews={setAiReviews} setAchievements={setAchievements} sleepLogs={sleepLogs} setSleepLogs={setSleepLogs} />}
        {view === "stats"     && <StatsView xpLogs={xpLogs} achievements={achievements} logs={logs} getStreak={getStreak} nofapStreak={getNofapStreak()} />}
      </div>

      {/* Bottom Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", background: "rgba(7,7,10,0.97)", backdropFilter: "blur(16px)", borderTop: `1px solid ${C.border}`, display: "flex", padding: "12px 0 env(safe-area-inset-bottom, 16px)", zIndex: 9999 }}>
        {[["dashboard","◎","Home"],["habits","◉","Today"],["log","◈","Log"],["routines","◆","Plans"],["stats","★","Rank"]].map(([key, icon, label]) => (
          <button key={key} className="press" onClick={() => setView(key)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, color: view === key ? C.skincare : C.muted }}>
            <span style={{ fontSize: 17 }}>{icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ logs, nofapStreak, weeklyPct, todayPct, getStreak, setView, setSelectedRoutine, todayLogs, setSubView, todayMacros }) {
  const doneTodayCount = HABITS.filter(h => todayLogs[h.id]?.done).length;
  const topStreaks = HABITS.map(h => ({ ...h, streak: getStreak(h.id) })).sort((a, b) => b.streak - a.streak).slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 8px" }}>
        <Ring value={todayPct} size={120} color={C.skincare} label={`${doneTodayCount}/${HABITS.length}`} sublabel="done" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
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

  function addHabit(cat) {
    const newId = `custom_${Date.now()}`;
    setHabits(p => [...p, { id: newId, label: "New Habit", category: cat, type: "binary", icon: "◉" }]);
  }
  function removeHabit(id) { setHabits(p => p.filter(h => h.id !== id)); }
  function updateHabit(id, field, val) { setHabits(p => p.map(h => h.id === id ? { ...h, [field]: val } : h)); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase" }}>Today</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 12, color: C.skincare }}>{done}/{habits.length}</div>
          <button onClick={() => setEditing(e => !e)} style={editBtnStyle(editing)}>{editing ? "✓ Done" : "✎ Edit"}</button>
        </div>
      </div>
      {categories.map(cat => {
        const catH = habits.filter(h => h.category === cat);
        return (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: COLORS[cat] || C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{cat}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {catH.map(h => {
                const log = todayLogs[h.id] || {};
                const streak = getStreak(h.id);
                return (
                  <div key={h.id} style={{ background: log.done ? `${COLORS[h.category] || C.muted}0E` : C.surface, border: `1px solid ${log.done ? (COLORS[h.category] || C.muted) + "35" : C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}
                    onClick={() => !editing && h.type === "binary" && toggleHabit(h.id)}>
                    {!editing && (
                      <button onClick={e => { e.stopPropagation(); toggleHabit(h.id); }} style={{ width: 24, height: 24, borderRadius: 6, background: log.done ? COLORS[h.category] : "transparent", border: `2px solid ${log.done ? COLORS[h.category] : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {log.done && <span style={{ color: "#000", fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </button>
                    )}
                    <div style={{ flex: 1 }}>
                      {editing ? (
                        <input style={{ ...editInput, fontSize: 12 }} value={h.label} onChange={e => updateHabit(h.id, "label", e.target.value)} />
                      ) : (
                        <>
                          <div style={{ fontSize: 12, color: log.done ? C.text : "#666" }}>{h.label}</div>
                          {streak > 0 && <div style={{ fontSize: 10, color: COLORS[h.category], marginTop: 2, opacity: 0.7 }}>{streak}d streak</div>}
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
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Add habit to new category</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ALL_CATEGORIES.filter(c => !categories.includes(c)).map(c => (
              <button key={c} onClick={() => addHabit(c)} style={{ background: C.faint, border: `1px dashed ${COLORS[c] || C.muted}60`, borderRadius: 6, padding: "5px 10px", color: COLORS[c] || C.muted, fontSize: 10, fontFamily: "inherit" }}>+ {c}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SleepCard({ sleepLogs, setSleepLogs, logs, setLogs, xpLogs, setXpLogs }) {
  const today = todayKey();
  const entry = sleepLogs[today] || {};
  const [bedtime, setBedtime] = useState(entry.bedtime || "");
  const [wakeTime, setWakeTime] = useState(entry.wakeTime || "");
  const SLEEP_COLOR = "#7c6fa0";
  const XP_AMOUNT = 20;

  const sleptOnTime = entry.sleptOnTime || false;
  const wokeOnTime = entry.wokeOnTime || false;

  const streak = (() => {
    let s = 0;
    let d = new Date();
    while (true) {
      const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      const k = ist.toISOString().split("T")[0];
      const e = sleepLogs[k];
      if (e && e.sleptOnTime && e.wokeOnTime) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  })();

  // Last 7 days for mini chart
  const last7Data = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
    const k = ist.toISOString().split("T")[0];
    const e = sleepLogs[k] || {};
    const label = new Date(k + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" });
    // calculate hours slept if both times logged
    let hours = 0;
    if (e.bedtime && e.wakeTime) {
      const [bh, bm] = e.bedtime.split(":").map(Number);
      const [wh, wm] = e.wakeTime.split(":").map(Number);
      let mins = (wh * 60 + wm) - (bh * 60 + bm);
      if (mins < 0) mins += 24 * 60;
      hours = parseFloat((mins / 60).toFixed(1));
    }
    return { k, label, slept: e.sleptOnTime || false, woke: e.wokeOnTime || false, hours, both: (e.sleptOnTime && e.wokeOnTime) || false };
  });

  const grantXP = () => {
    setXpLogs(p => ({ ...p, [today]: (p[today] || 0) + XP_AMOUNT }));
    setLogs(p => ({ ...p, [today]: { ...(p[today] || {}), h13: { done: true } } }));
  };
  const revokeXP = () => {
    setXpLogs(p => ({ ...p, [today]: Math.max(0, (p[today] || 0) - XP_AMOUNT) }));
    setLogs(p => ({ ...p, [today]: { ...(p[today] || {}), h13: { done: false } } }));
  };

  const updateEntry = (patch) => {
    const updated = { ...entry, ...patch };
    setSleepLogs(p => ({ ...p, [today]: updated }));
    const bothDone = updated.sleptOnTime && updated.wokeOnTime;
    const wasBothDone = entry.sleptOnTime && entry.wokeOnTime;
    if (bothDone && !wasBothDone) grantXP();
    if (!bothDone && wasBothDone) revokeXP();
  };

  const weekScore = last7Data.filter(d => d.both).length;

  return (
    <div style={{ background: C.surface, border: `1px solid ${SLEEP_COLOR}30`, borderRadius: 14, padding: 16, marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: SLEEP_COLOR, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Sleep Schedule</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>Rest & Recovery</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, color: SLEEP_COLOR, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, lineHeight: 1 }}>
            {streak > 0 ? streak : weekScore}
          </div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
            {streak > 0 ? "day streak 🔥" : `${weekScore}/7 this week`}
          </div>
        </div>
      </div>

      {/* Target bar */}
      <div style={{ background: `${SLEEP_COLOR}12`, border: `1px solid ${SLEEP_COLOR}20`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: C.muted }}>Target</div>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: SLEEP_COLOR }}>11:00 PM</div>
            <div style={{ fontSize: 9, color: C.muted }}>Sleep by</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: SLEEP_COLOR }}>6:00 AM</div>
            <div style={{ fontSize: 9, color: C.muted }}>Wake at</div>
          </div>
          <div style={{ width: 1, background: C.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: SLEEP_COLOR }}>7h</div>
            <div style={{ fontSize: 9, color: C.muted }}>Duration</div>
          </div>
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {[
          { key: "sleptOnTime", val: sleptOnTime, label: "Slept by 11:00 PM" },
          { key: "wokeOnTime",  val: wokeOnTime,  label: "Woke at 6:00 AM"  },
        ].map(({ key, val, label }) => (
          <div key={key} onClick={() => updateEntry({ [key]: !val })}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: val ? `${SLEEP_COLOR}12` : C.faint, border: `1px solid ${val ? SLEEP_COLOR + "40" : C.border}`, transition: "all 0.2s" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: val ? SLEEP_COLOR : "transparent", border: `2px solid ${val ? SLEEP_COLOR : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {val && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: val ? C.text : "#888" }}>{label}</span>
            {val && <span style={{ marginLeft: "auto", fontSize: 10, color: SLEEP_COLOR }}>✦</span>}
          </div>
        ))}
      </div>

      {/* Time inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Actual Bedtime", val: bedtime, setter: setBedtime, key: "bedtime" },
          { label: "Actual Wake Time", val: wakeTime, setter: setWakeTime, key: "wakeTime" },
        ].map(({ label, val, setter, key }) => (
          <div key={key} style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <input type="time" style={{ background: "transparent", border: "none", color: SLEEP_COLOR, fontSize: 16, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}
              value={val} onChange={e => { setter(e.target.value); updateEntry({ [key]: e.target.value }); }} />
          </div>
        ))}
      </div>

      {/* Hours slept display */}
      {bedtime && wakeTime && (() => {
        const [bh, bm] = bedtime.split(":").map(Number);
        const [wh, wm] = wakeTime.split(":").map(Number);
        let mins = (wh * 60 + wm) - (bh * 60 + bm);
        if (mins < 0) mins += 24 * 60;
        const hrs = (mins / 60).toFixed(1);
        const good = parseFloat(hrs) >= 7;
        return (
          <div style={{ background: `${good ? SLEEP_COLOR : C.nofap}12`, border: `1px solid ${good ? SLEEP_COLOR : C.nofap}30`, borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.muted }}>Duration logged</span>
            <span style={{ fontSize: 16, color: good ? SLEEP_COLOR : C.nofap, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{hrs}h {good ? "✦" : "⚠"}</span>
          </div>
        );
      })()}

      {/* XP badge */}
      {sleptOnTime && wokeOnTime && (
        <div style={{ background: `${SLEEP_COLOR}15`, border: `1px solid ${SLEEP_COLOR}30`, borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.muted }}>XP earned today</span>
          <span style={{ fontSize: 13, color: SLEEP_COLOR }}>+{XP_AMOUNT} XP ✦</span>
        </div>
      )}

      {/* 7-day mini chart */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Last 7 Nights</div>
        <div style={{ display: "flex", gap: 4 }}>
          {last7Data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: 36, borderRadius: 5, background: d.both ? `${SLEEP_COLOR}70` : d.slept || d.woke ? `${SLEEP_COLOR}25` : C.faint, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${d.both ? SLEEP_COLOR + "50" : C.border}` }}>
                {d.hours > 0 && <span style={{ fontSize: 8, color: d.both ? "#fff" : C.muted }}>{d.hours}h</span>}
              </div>
              <div style={{ fontSize: 8, color: d.k === today ? SLEEP_COLOR : C.muted }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
       
          <div style={{ fontSize: 22, color: SLEEP_COLOR, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, lineHeight: 1 }}>{streak > 0 ? streak : weekScore}</div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{streak > 0 ? "day streak 🔥" : `${weekScore}/7 this week`}</div>
        </div>
      </div>
      <div style={{ background: `${SLEEP_COLOR}12`, border: `1px solid ${SLEEP_COLOR}20`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: C.muted }}>Target</div>
        <div style={{ display: "flex", gap: 14 }}>
          {[["11:00 PM","Sleep by"],["6:00 AM","Wake at"],["7h","Duration"]].map(([val, label], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: SLEEP_COLOR }}>{val}</div>
              <div style={{ fontSize: 9, color: C.muted }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {[{ key: "sleptOnTime", val: sleptOnTime, label: "Slept by 11:00 PM" }, { key: "wokeOnTime", val: wokeOnTime, label: "Woke at 6:00 AM" }].map(({ key, val, label }) => (
          <div key={key} onClick={() => updateEntry({ [key]: !val })}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: val ? `${SLEEP_COLOR}12` : C.faint, border: `1px solid ${val ? SLEEP_COLOR + "40" : C.border}`, transition: "all 0.2s" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: val ? SLEEP_COLOR : "transparent", border: `2px solid ${val ? SLEEP_COLOR : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {val && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: val ? C.text : "#888" }}>{label}</span>
            {val && <span style={{ marginLeft: "auto", fontSize: 10, color: SLEEP_COLOR }}>✦</span>}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[{ label: "Actual Bedtime", val: bedtime, setter: setBedtime, key: "bedtime" }, { label: "Actual Wake Time", val: wakeTime, setter: setWakeTime, key: "wakeTime" }].map(({ label, val, setter, key }) => (
          <div key={key} style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <input type="time" style={{ background: "transparent", border: "none", color: SLEEP_COLOR, fontSize: 16, fontFamily: "'DM Mono',monospace", outline: "none", width: "100%" }}
              value={val} onChange={e => { setter(e.target.value); updateEntry({ [key]: e.target.value }); }} />
          </div>
        ))}
      </div>
      {bedtime && wakeTime && (() => {
        const [bh, bm] = bedtime.split(":").map(Number);
        const [wh, wm] = wakeTime.split(":").map(Number);
        let mins = (wh * 60 + wm) - (bh * 60 + bm);
        if (mins < 0) mins += 24 * 60;
        const hrs = (mins / 60).toFixed(1);
        const good = parseFloat(hrs) >= 7;
        return (
          <div style={{ background: `${good ? SLEEP_COLOR : C.nofap}12`, border: `1px solid ${good ? SLEEP_COLOR : C.nofap}30`, borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.muted }}>Duration logged</span>
            <span style={{ fontSize: 16, color: good ? SLEEP_COLOR : C.nofap, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{hrs}h {good ? "✦" : "⚠"}</span>
          </div>
        );
      })()}
      {sleptOnTime && wokeOnTime && (
        <div style={{ background: `${SLEEP_COLOR}15`, border: `1px solid ${SLEEP_COLOR}30`, borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.muted }}>XP earned today</span>
          <span style={{ fontSize: 13, color: SLEEP_COLOR }}>+20 XP ✦</span>
        </div>
      )}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Last 7 Nights</div>
        <div style={{ display: "flex", gap: 4 }}>
          {last7Data.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: 36, borderRadius: 5, background: d.both ? `${SLEEP_COLOR}70` : d.slept || d.woke ? `${SLEEP_COLOR}25` : C.faint, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${d.both ? SLEEP_COLOR + "50" : C.border}` }}>
                {d.hours > 0 && <span style={{ fontSize: 8, color: d.both ? "#fff" : C.muted }}>{d.hours}h</span>}
              </div>
              <div style={{ fontSize: 8, color: d.k === today ? SLEEP_COLOR : C.muted }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LOG HUB ──────────────────────────────────────────────────────────────────
function LogHub({ setSubView, todayMacros, workoutLogs, setWorkoutLogs, weightLogs, setWeightLogs, logs, setLogs, foodLogs, setFoodLogs, nofapStreak, setNofapStart, xpLogs, setXpLogs, checkinLogs, journalLogs, setJournalLogs, aiReviews, setAiReviews, setAchievements, sleepLogs, setSleepLogs }) {
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
      <JournalCard journalLogs={journalLogs} setJournalLogs={setJournalLogs} checkinLogs={checkinLogs} logs={logs} workoutLogs={workoutLogs} />
<AIReviewCard logs={logs} workoutLogs={workoutLogs} foodLogs={foodLogs} checkinLogs={checkinLogs} journalLogs={journalLogs} xpLogs={xpLogs} aiReviews={aiReviews} setAiReviews={setAiReviews} nofapStreak={nofapStreak} />
  <ResetProgress logs={logs} setLogs={setLogs} workoutLogs={workoutLogs} setWorkoutLogs={setWorkoutLogs} weightLogs={weightLogs} setWeightLogs={setWeightLogs} setNofapStart={setNofapStart} xpLogs={xpLogs} setXpLogs={setXpLogs} setAchievements={setAchievements} />
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
    { id: "m1", label: "Meal 1 — Breakfast",    time: "9:30 AM",  items: ["2 peanut butter sandwiches","4 whole eggs","1 glass whole milk","10 almonds","Vitamin D3 + Multivitamin"], macros: "~40g P · ~700 kcal" },
    { id: "m2", label: "Meal 2 — Lunch",         time: "1:00 PM",  items: ["50g soya chunks (dry)","1.5 cups cooked rice","1 glass buttermilk"], macros: "~30g P · ~500 kcal" },
    { id: "m3", label: "Meal 3 — Pre-Workout",   time: "3:00 PM",  items: ["1 banana","2 tbsp peanut butter OR peanuts"], macros: "~8g P · ~280 kcal" },
    { id: "m4", label: "Meal 4 — Post-Workout",  time: "5:30 PM",  items: ["1 scoop whey","1 cup oats","1 banana","1 tbsp peanut butter","1 glass whole milk","Creatine 5g"], macros: "~50g P · ~650 kcal" },
    { id: "m5", label: "Meal 5 — Dinner",        time: "8:30 PM",  items: ["150g chicken OR paneer","1.5 cups rice OR 2 roti","Spinach / mixed veg","1 glass buttermilk","Ashwagandha here"], macros: "~40g P · ~650 kcal" },
    { id: "m6", label: "Meal 6 — Before Bed",    time: "10:30 PM", items: ["1 glass warm milk","1 tbsp peanut butter"], macros: "~10g P · ~250 kcal" },
  ];
  function getMealStreak(mealId) {
    let streak = 0, d = new Date();
    while (true) {
      const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      const k = ist.toISOString().split("T")[0];
      if (foodLogs[k]?.[mealId]) { streak++; d.setDate(d.getDate() - 1); } else break;
    }
    return streak;
  }
  function toggleMeal(id) {
    setFoodLogs(p => { const day = { ...(p[today] || {}) }; day[id] = !day[id]; return { ...p, [today]: day }; });
  }
  const doneCount = MEALS.filter(m => mealLogs[m.id]).length;

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
      <div style={{ background: `${C.diet}12`, border: `1px solid ${C.diet}30`, borderRadius: 10, padding: "11px 14px", fontSize: 12, color: C.diet, marginBottom: 14 }}>~3030 kcal/day · ~178g protein/day</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MEALS.map(meal => {
          const done = mealLogs[meal.id];
          return (
            <div key={meal.id} onClick={() => toggleMeal(meal.id)} style={{ background: done ? `${C.diet}12` : C.surface, border: `1px solid ${done ? C.diet + "40" : C.border}`, borderRadius: 12, padding: 14, cursor: "pointer", transition: "all 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: done ? C.diet : "transparent", border: `2px solid ${done ? C.diet : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
              <div style={{ fontSize: 10, color: done ? C.diet : C.muted, marginTop: 8, marginLeft: 32 }}>{meal.macros}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsView({ logs, workoutLogs, foodLogs, nofapStreak, weightLogs, onBack }) {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase" }}>All Plans</div>
        <button onClick={() => setEditing(e => !e)} style={editBtnStyle(editing)}>{editing ? "✓ Done" : "✎ Edit"}</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {planList.map(r => (
          <div key={r.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
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
                <span style={{ color: r.color, fontSize: 20, width: 24 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{r.meta}</div>
                </div>
                <span style={{ color: C.muted, fontSize: 14 }}>›</span>
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
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>
          Custom plan — content editor coming soon.
        </div>
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(7,7,10,0.97)", zIndex: 99998, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, background: C.surface, borderRadius: "20px 20px 0 0", padding: "28px 24px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {fields.map((_, i) => (
              <div key={i} style={{ width: i === step ? 20 : 6, height: 4, borderRadius: 2, background: i <= step ? current.color : C.muted, transition: "all 0.3s" }} />
            ))}
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
}

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

    return `You are a personal coach reviewing ${period.label.toLowerCase()} data for Anant, a 21-year-old in India focused on physique, guitar, discipline, and self-improvement.

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
    <div style={{ background: C.surface, border: `1px solid ${color}18`, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 20, color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>{label}</div>
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

  function doReset() {
    const season = {
      number: seasons.length + 1,
      date: todayKey(),
      reason: reason || "Fresh start",
      stats: {
        totalDays,
        totalSessions,
        bestStreak,
        totalXP: getTotalXP(xpLogs),
      }
    };
    setSeasons(p => [...p, season]);
    if (selectedResets.streaks) setLogs({});
    if (selectedResets.workout) setWorkoutLogs({});
    if (selectedResets.weight)  setWeightLogs({});
    if (selectedResets.streaks) setNofapStart(todayKey()); if (selectedResets.xp) { setXpLogs({}); setAchievements([]); } if (selectedResets.xp) setXpLogs({});
    setShowConfirm(false);
    setReason("");
  }

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

