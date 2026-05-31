import React, {useState, useEffect, useRef } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#07070A", surface: "#0D0D12", border: "#16161E", faint: "#0F0F16",
  text: "#E8E4DC", muted: "#3A3A48", dim: "#555566",
  workout: "#5B8DEF", skincare: "#C9A96E", diet: "#E07B5A",
  nofap: "#E05A7B", haircare: "#7EB8A4", spiritual: "#C9A96E"
};
const COLORS = { workout: C.workout, skincare: C.skincare, diet: C.diet, nofap: C.nofap, haircare: C.haircare, spiritual: C.skincare, productivity: "#A07EE0" };
// ─── XP SYSTEM ────────────────────────────────────────────────────────────────
const XP_VALUES = {
  h1: 15, h2: 15, h3: 10, h4: 50, h5: 20, h6: 15,
  h7: 20, h8: 10, h9: 40, h11: 15, h14: 25, h15: 25, h13: 20,
};

const RANKS = [
  { rank:"E", title:"The Awakened", xpRequired:0, color:"#888888" },
  { rank:"D", title:"Iron Will", xpRequired:500, color:"#4CAF50" },
  { rank:"C", title:"Shadow Walker", xpRequired:2000, color:"#2196F3" },
  { rank:"B", title:"Blood Forged", xpRequired:5000, color:"#9C27B0" },
  { rank:"A", title:"Sovereign", xpRequired:12000, color:"#FF5722" },
  { rank:"S", title:"The Ruthless", xpRequired:25000, color:"#FFD700" },
  { rank:"SS", title:"Monarch", xpRequired:50000, color:"#FF0000" },
  { rank:"SSS", title:"The Absolute", xpRequired:100000, color:"#C0C0C0" },
];

const CATEGORY_LEVELS = {
  workout: { name:"Body", icon:"◆", levels:["Untrained","Novice","Fighter","Warrior","Elite","Champion","Legend"] },
  diet: { name:"Vitality", icon:"◉", levels:["Malnourished","Fueled","Nourished","Optimized","Peak","Supreme","Godlike"] },
  nofap: { name:"Discipline", icon:"⬡", levels:["Broken","Awakening","Control","Mastery","Iron","Unbreakable","Transcendent"] },
  skincare: { name:"Aesthetics", icon:"✦", levels:["Neglected","Basic","Groomed","Refined","Sharp","Pristine","Flawless"] },
  haircare: { name:"Presence", icon:"◈", levels:["Unkempt","Tended","Styled","Polished","Striking","Dominant","Iconic"] },
  spiritual: { name:"Mind", icon:"✦", levels:["Asleep","Stirring","Aware","Focused","Centered","Enlightened","Sovereign"] },
  productivity: { name:"Skill", icon:"♪", levels:["Idle","Practicing","Developing","Proficient","Advanced","Master","Virtuoso"] },
};

const ACHIEVEMENTS_LIST = [
  { id:"first_habit", title:"First Step", desc:"Complete your first habit", icon:"⚡", xp:50 },
  { id:"first_workout", title:"Iron Awakening", desc:"Log your first workout", icon:"◆", xp:100 },
  { id:"streak_7", title:"Week Warrior", desc:"Any habit 7 day streak", icon:"🔥", xp:150 },
  { id:"streak_30", title:"Month of Steel", desc:"Any habit 30 day streak", icon:"⚔", xp:500 },
  { id:"streak_90", title:"Unbreakable", desc:"Any habit 90 day streak", icon:"👑", xp:1000 },
  { id:"nofap_7", title:"First Battle Won", desc:"7 days NoFap", icon:"⬡", xp:200 },
  { id:"nofap_30", title:"Sovereign Mind", desc:"30 days NoFap", icon:"⬡", xp:500 },
  { id:"nofap_90", title:"The Monk", desc:"90 days NoFap", icon:"⬡", xp:1000 },
  { id:"full_day", title:"Perfect Day", desc:"Complete all habits in a day", icon:"✦", xp:200 },
  { id:"full_week", title:"Perfect Week", desc:"Complete all habits 7 days in a row", icon:"★", xp:500 },
  { id:"weight_logged", title:"Know Thyself", desc:"Log your body weight", icon:"◎", xp:50 },
  { id:"protein_7", title:"Protein Hunter", desc:"Hit protein goal 7 days", icon:"◉", xp:200 },
];

function getTotalXP(xpLogs) {
  return Object.values(xpLogs).reduce((a, day) => a + (typeof day === "number" ? day : 0), 0);
}

function getCurrentRank(totalXP) {
  let current = RANKS[0];
  for (const r of RANKS) { if (totalXP >= r.xpRequired) current = r; }
  return current;
}

function getNextRank(totalXP) {
  return RANKS.find(r => r.xpRequired > totalXP) || RANKS[RANKS.length-1];
}

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

function getCategoryLevel(categoryXP) {
  const thresholds = [0, 200, 600, 1500, 3500, 7000, 15000];
  let level = 0;
  thresholds.forEach((t, i) => { if (categoryXP >= t) level = i; });
  return level;
}
function todayKey() {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return ist.toISOString().split("T")[0];
}
function dateKey(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().split("T")[0]; }
function last7() { return Array.from({ length: 7 }, (_, i) => dateKey(-(6 - i))); }
function last30() { return Array.from({ length: 30 }, (_, i) => dateKey(-(29 - i))); }
function weekKey(date = new Date()) {
  const d = new Date(date); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}
function monthKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`; }
function yearKey(date = new Date()) { return `${date.getFullYear()}`; }

// ─── HABITS ───────────────────────────────────────────────────────────────────
const HABITS = [
  { id: "h1", label: "Morning Skincare", category: "skincare", type: "binary", icon: "✦" },
  { id: "h2", label: "Night Skincare", category: "skincare", type: "binary", icon: "✦" },
  { id: "h3", label: "Sunscreen", category: "skincare", type: "binary", icon: "✦" },
  { id: "h4", label: "Workout", category: "workout", type: "binary", icon: "◆", skipDay: 6 },
  { id: "h5", label: "Hit Protein Goal", category: "diet", type: "binary", icon: "◉" },
  { id: "h6", label: "Water Intake", category: "diet", type: "quantitative", unit: "L", target: 3, icon: "◉" },
  { id: "h7", label: "All 6 Meals", category: "diet", type: "binary", icon: "◉" },
  { id: "h8", label: "Supplements Taken", category: "diet", type: "binary", icon: "◉" },
  { id: "h9", label: "NoFap", category: "nofap", type: "binary", icon: "⬡" },
  { id: "h10", label: "Guitar Practice", category: "productivity", type: "binary", icon: "♪" },
  { id: "h11", label: "No Junk Food", category: "diet", type: "binary", icon: "◉" },
  { id: "h12", label: "Pooja", category: "spiritual", type: "binary", icon: "✦" },
];

// ─── WORKOUT DATA ─────────────────────────────────────────────────────────────

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
  ]},
  { day: "Day 7", focus: "REST", sections: [] },
];

const DEFAULT_SKINCARE = {
  morning: [
    { step: 1, task: "Ponds Charcoal Face Wash", note: "Lukewarm water. Gentle circular motions." },
    { step: 2, task: "Lightweight Moisturizer", note: "Apply while face is slightly damp." },
    { step: 3, task: "Joy Hello Sun SPF 50", note: "NON-NEGOTIABLE. 2 finger lengths every morning." },
    { step: 4, task: "Vaseline on lips", note: "Thin layer." },
  ],
  night: [
    { step: 1, task: "Ponds Charcoal Face Wash", note: "Removes sunscreen, pollution, oil buildup." },
    { step: 2, task: "Minimalist 10% Niacinamide", note: "2–3 drops, press gently. Your dark mark treatment." },
    { step: 3, task: "Lightweight Moisturizer", note: "Slightly more generous than morning." },
    { step: 4, task: "Vaseline on lips", note: "Thicker layer — overnight repair." },
  ],
  toBuy: [
    { item: "Lightweight Moisturizer", price: "~₹300–400" },
    { item: "Minimalist 10% Niacinamide", price: "~₹300" },
  ],
};

const DEFAULT_DIET = {
  target: "~3030 kcal/day · ~178g protein/day",
  meals: [
    { time: "9:30 AM", label: "Meal 1", items: ["2 peanut butter sandwiches", "4 whole eggs", "1 glass whole milk", "10 almonds", "Vitamin D3 + Multivitamin"], macros: "~40g P · ~700 kcal" },
    { time: "1:00 PM", label: "Meal 2", items: ["50g soya chunks (dry)", "1.5 cups cooked rice", "1 glass buttermilk"], macros: "~30g P · ~500 kcal" },
    { time: "3:00 PM", label: "Meal 3", items: ["1 banana", "2 tbsp peanut butter OR peanuts"], macros: "~8g P · ~280 kcal" },
    { time: "5:30 PM", label: "Meal 4 (Post-Workout)", items: ["1 scoop whey", "1 cup oats", "1 banana", "1 tbsp peanut butter", "1 glass whole milk", "Creatine 5g"], macros: "~50g P · ~650 kcal" },
    { time: "8:30 PM", label: "Meal 5", items: ["150g chicken OR paneer", "1.5 cups rice OR 2 roti", "Spinach / mixed veg", "1 glass buttermilk", "Ashwagandha here"], macros: "~40g P · ~650 kcal" },
    { time: "10:30 PM", label: "Meal 6", items: ["1 glass warm milk", "1 tbsp peanut butter"], macros: "~10g P · ~250 kcal" },
  ],
};

const DEFAULT_HAIRCARE = {
  washDay: [
    { step: 1, task: "Pre-wash oil (1–2 hrs before)", note: "Coconut oil + 5–6 drops rosemary. Massage 5–7 mins." },
    { step: 2, task: "Shampoo", note: "Scalp only. Rinse thoroughly." },
    { step: 3, task: "Conditioner", note: "Mid-lengths to ends only. 2–3 mins. Cold water final rinse." },
    { step: 4, task: "Dry + Style", note: "Squeeze with t-shirt. Air dry to 60%. Apply serum. Comb into slickback." },
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
  {
    time: "MORNING",
    color: "#C9A96E",
    steps: [
      {
        title: "Pooja — 3 mins",
        items: [
          "Wash hands before approaching mandir",
          "Light diya and agarbatti",
          "Ring the bell",
          "Offer water with right hand",
          "Hands folded, eyes closed, one slow breath",
          "Say internally: \"You know what I need. I am showing up every day. Please meet me halfway.\"",
          "Hold your wish for 20 seconds — then surrender it",
          "One clockwise pradakshina and bow",
        ]
      },
      {
        title: "Affirmations — 1–2 mins",
        items: [
          "After bowing, eyes closed, say slowly:",
          "\"I am becoming someone who receives what they truly need.\"",
          "\"I am becoming someone who handles hard days without catastrophising.\"",
          "\"What is meant for me is already making its way to me.\"",
        ]
      }
    ]
  },
  {
    time: "THROUGHOUT THE DAY",
    color: "#7EB8A4",
    steps: [
      {
        title: "Thought Interrupt — 30 sec",
        items: [
          "When a worst-case thought hits — don't fight it",
          "Ask: \"That's one possibility. What's another?\"",
          "Answer: \"Or — it works out. It actually comes through.\"",
          "You don't need to believe it fully. Just say it.",
        ]
      }
    ]
  },
  {
    time: "NIGHT",
    color: "#5B8DEF",
    steps: [
      {
        title: "Gratitude — 3 mins",
        items: [
          "3 specific things from today that were okay or good",
          "Small and specific beats big and vague",
          "Then add: \"I am grateful that what I need is already on its way to me.\"",
        ]
      },
      {
        title: "Visualisation — 1–2 mins",
        items: [
          "Last thing before sleep",
          "Don't visualise the thing — visualise the moment after",
          "The relief. The exhale. The \"it happened.\"",
          "Hold that feeling for 60 seconds",
          "Let sleep take you from that feeling",
        ]
      }
    ]
  }
];

// ─── SHARED EDIT HELPERS ──────────────────────────────────────────────────────
const editBtnStyle = (editing) => ({
  background: editing ? "#C9A96E" : "none",
  border: `1px solid ${editing ? "#C9A96E" : "#3A3A48"}`,
  borderRadius: 7,
  padding: "5px 12px",
  color: editing ? "#000" : "#3A3A48",
  fontSize: 10,
  fontFamily: "'DM Mono',monospace",
  letterSpacing: 1,
  cursor: "pointer",
});

const editInput = {
  background: "#0F0F16",
  border: "1px solid #2A2A3A",
  borderRadius: 6,
  color: "#E8E4DC",
  fontFamily: "'DM Mono',monospace",
  fontSize: 12,
  padding: "5px 8px",
  outline: "none",
  width: "100%",
};

function EditHeader({ title, editing, setEditing, onReset }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: "#3A3A48", letterSpacing: 3, textTransform: "uppercase" }}>{title}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {editing && (
          <button onClick={onReset} style={{ ...editBtnStyle(false), color: "#E05A7B", borderColor: "#E05A7B" }}>Reset</button>
        )}
        <button onClick={() => setEditing(e => !e)} style={editBtnStyle(editing)}>
          {editing ? "✓ Done" : "✎ Edit"}
        </button>
      </div>
    </div>
  );
}

function AddButton({ onClick, label = "+ Add", color = "#3A3A48" }) {
  return (
    <button onClick={onClick} style={{ width: "100%", background: "none", border: `1px dashed ${color}60`, borderRadius: 7, padding: "7px", color: color, fontSize: 11, fontFamily: "inherit", marginTop: 6, cursor: "pointer" }}>
      {label}
    </button>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: "#E05A7B", fontSize: 14, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>✕</button>
  );
}

// ─── ROUTINES VIEW ────────────────────────────────────────────────────────────
function RoutinesView({ selected, setSelected, nofapStreak, setNofapStart, nofapHistory, setNofapHistory,
  workoutPlan, setWorkoutPlan, skincarePlan, setSkincarePlan, dietPlan, setDietPlan,
  haircarePlan, setHaircarePlan, spiritualPlan, setSpiritualPlan }) {

  const routineList = [
    { id: "workout", label: "Workout", icon: "◆", color: "#5B8DEF", meta: "6 days/week · Arms focused" },
    { id: "skincare", label: "Skincare", icon: "✦", color: "#C9A96E", meta: "AM + PM · 4 steps" },
    { id: "diet", label: "Diet", icon: "◉", color: "#E07B5A", meta: "6 meals · ~3030 kcal · ~178g protein" },
    { id: "nofap", label: "NoFap", icon: "⬡", color: "#E05A7B", meta: "Full celibacy · Streak + Protocol" },
    { id: "haircare", label: "Hair Care", icon: "◈", color: "#7EB8A4", meta: "Wash days + Daily + Weekly" },
    { id: "spiritual", label: "Spirituality", icon: "✦", color: "#C9A96E", meta: "Morning · Day · Night" },
  ];

  if (!selected) return (
    <div>
      <div style={{ fontSize: 10, color: "#3A3A48", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>All Plans</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {routineList.map(r => (
          <button key={r.id} className="press" onClick={() => setSelected(r.id)} style={{ background: "#0D0D12", border: "1px solid #16161E", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14, color: "#E8E4DC", textAlign: "left" }}>
            <span style={{ color: r.color, fontSize: 20, width: 24 }}>{r.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontFamily: "'Cormorant Garamond',serif", fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 10, color: "#3A3A48", marginTop: 3 }}>{r.meta}</div>
            </div>
            <span style={{ color: "#3A3A48", fontSize: 14 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#3A3A48", fontSize: 11, marginBottom: 20, letterSpacing: 1, fontFamily: "inherit", cursor: "pointer" }}>← Back</button>
      <RoutineDetail id={selected}
        nofapStreak={nofapStreak} setNofapStart={setNofapStart} nofapHistory={nofapHistory} setNofapHistory={setNofapHistory}
        workoutPlan={workoutPlan} setWorkoutPlan={setWorkoutPlan}
        skincarePlan={skincarePlan} setSkincarePlan={setSkincarePlan}
        dietPlan={dietPlan} setDietPlan={setDietPlan}
        haircarePlan={haircarePlan} setHaircarePlan={setHaircarePlan}
        spiritualPlan={spiritualPlan} setSpiritualPlan={setSpiritualPlan}
      />
    </div>
  );
}

function RoutineDetail({ id, nofapStreak, setNofapStart, nofapHistory, setNofapHistory,
  workoutPlan, setWorkoutPlan, skincarePlan, setSkincarePlan, dietPlan, setDietPlan,
  haircarePlan, setHaircarePlan, spiritualPlan, setSpiritualPlan }) {
  if (id === "workout") return <WorkoutPlan plan={workoutPlan} setPlan={setWorkoutPlan} />;
  if (id === "skincare") return <SkincarePlan plan={skincarePlan} setPlan={setSkincarePlan} />;
  if (id === "diet") return <DietPlan plan={dietPlan} setPlan={setDietPlan} />;
  if (id === "nofap") return <NofapPlan nofapStreak={nofapStreak} setNofapStart={setNofapStart} nofapHistory={nofapHistory} setNofapHistory={setNofapHistory} />;
  if (id === "haircare") return <HaircarePlan plan={haircarePlan} setPlan={setHaircarePlan} />;
  if (id === "spiritual") return <SpiritualPlan plan={spiritualPlan} setPlan={setSpiritualPlan} />;
  return null;
}

// ─── WORKOUT PLAN ─────────────────────────────────────────────────────────────
function WorkoutPlan({ plan, setPlan }) {
  const [active, setActive] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [editing, setEditing] = useState(false);
  const d = plan[active];

  function updateFocus(val) {
    setPlan(p => p.map((day, i) => i === active ? { ...day, focus: val } : day));
  }
  function updateDayName(val) {
    setPlan(p => p.map((day, i) => i === active ? { ...day, day: val } : day));
  }
  function updateSectionTitle(si, val) {
    setPlan(p => p.map((day, i) => i === active ? {
      ...day, sections: day.sections.map((sec, j) => j === si ? { ...sec, title: val } : sec)
    } : day));
  }
  function updateExercise(si, ei, val) {
    setPlan(p => p.map((day, i) => i === active ? {
      ...day, sections: day.sections.map((sec, j) => j === si ? {
        ...sec, exercises: sec.exercises.map((ex, k) => k === ei ? val : ex)
      } : sec)
    } : day));
  }
  function addExercise(si) {
    setPlan(p => p.map((day, i) => i === active ? {
      ...day, sections: day.sections.map((sec, j) => j === si ? {
        ...sec, exercises: [...sec.exercises, "New exercise"]
      } : sec)
    } : day));
  }
  function removeExercise(si, ei) {
    setPlan(p => p.map((day, i) => i === active ? {
      ...day, sections: day.sections.map((sec, j) => j === si ? {
        ...sec, exercises: sec.exercises.filter((_, k) => k !== ei)
      } : sec)
    } : day));
  }
  function addSection() {
    setPlan(p => p.map((day, i) => i === active ? {
      ...day, sections: [...day.sections, { title: "New Section", exercises: ["New exercise"] }]
    } : day));
  }
  function removeSection(si) {
    setPlan(p => p.map((day, i) => i === active ? {
      ...day, sections: day.sections.filter((_, j) => j !== si)
    } : day));
  }
  function addDay() {
    setPlan(p => [...p, { day: `Day ${p.length + 1}`, focus: "New Day", sections: [] }]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <EditHeader title="Workout Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(WORKOUT_DAYS); setEditing(false); }} />

      <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4 }}>
        {plan.map((day, i) => (
          <button key={i} className="press" onClick={() => setActive(i)} style={{ background: active === i ? "#5B8DEF" : "#0D0D12", border: `1px solid ${active === i ? "#5B8DEF" : "#16161E"}`, borderRadius: 7, padding: "6px 10px", color: active === i ? "#000" : "#555566", fontSize: 10, whiteSpace: "nowrap", fontFamily: "inherit", cursor: "pointer" }}>
            {day.day.replace("Day ", "D")}
          </button>
        ))}
        {editing && <button onClick={addDay} style={{ background: "none", border: "1px dashed #3A3A48", borderRadius: 7, padding: "6px 10px", color: "#3A3A48", fontSize: 10, whiteSpace: "nowrap", fontFamily: "inherit", cursor: "pointer" }}>+ Day</button>}
      </div>

      <div style={{ background: "#0D0D12", border: "1px solid #16161E", borderRadius: 12, padding: 16 }}>
        {editing ? (
          <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <input style={editInput} value={d.day} onChange={e => updateDayName(e.target.value)} placeholder="Day name" />
            <input style={editInput} value={d.focus} onChange={e => updateFocus(e.target.value)} placeholder="Focus" />
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#5B8DEF", marginBottom: 12 }}>{d.focus}</div>
        )}

        {d.sections.length === 0 && !editing ? (
          <div style={{ fontSize: 12, color: "#3A3A48" }}>Rest. Recover.</div>
        ) : (
          d.sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                {editing ? (
                  <>
                    <input style={{ ...editInput, fontSize: 10 }} value={sec.title} onChange={e => updateSectionTitle(si, e.target.value)} />
                    <RemoveBtn onClick={() => removeSection(si)} />
                  </>
                ) : (
                  <div style={{ fontSize: 9, color: "#555566", letterSpacing: 2, textTransform: "uppercase" }}>{sec.title}</div>
                )}
              </div>
              {sec.exercises.map((ex, ei) => (
                <div key={ei} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: ei < sec.exercises.length - 1 ? "1px solid #16161E" : "none" }}>
                  {editing ? (
                    <>
                      <input style={editInput} value={ex} onChange={e => updateExercise(si, ei, e.target.value)} />
                      <RemoveBtn onClick={() => removeExercise(si, ei)} />
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: "#CCC" }}>{ex}</div>
                  )}
                </div>
              ))}
              {editing && <AddButton onClick={() => addExercise(si)} label="+ Exercise" color="#5B8DEF" />}
            </div>
          ))
        )}
        {editing && <AddButton onClick={addSection} label="+ Section" color="#5B8DEF" />}
      </div>
    </div>
  );
}

// ─── SKINCARE PLAN ────────────────────────────────────────────────────────────
function SkincarePlan({ plan, setPlan }) {
  const [editing, setEditing] = useState(false);

  function updateStep(period, idx, field, val) {
    setPlan(p => ({
      ...p,
      [period]: p[period].map((s, i) => i === idx ? { ...s, [field]: val } : s)
    }));
  }
  function addStep(period) {
    const n = plan[period].length + 1;
    setPlan(p => ({ ...p, [period]: [...p[period], { step: n, task: "New step", note: "" }] }));
  }
  function removeStep(period, idx) {
    setPlan(p => ({ ...p, [period]: p[period].filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })) }));
  }
  function updateToBuy(idx, field, val) {
    setPlan(p => ({ ...p, toBuy: p.toBuy.map((t, i) => i === idx ? { ...t, [field]: val } : t) }));
  }
  function addToBuy() {
    setPlan(p => ({ ...p, toBuy: [...p.toBuy, { item: "New item", price: "~₹0" }] }));
  }
  function removeToBuy(idx) {
    setPlan(p => ({ ...p, toBuy: p.toBuy.filter((_, i) => i !== idx) }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <EditHeader title="Skincare Plan" editing={editing} setEditing={setEditing} onReset={() => { setSkincarePlan(DEFAULT_SKINCARE); setEditing(false); }} />

      {[{ key: "morning", label: "Morning" }, { key: "night", label: "Night" }].map(({ key, label }) => (
        <div key={key} style={{ background: "#0D0D12", border: "1px solid #C9A96E18", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: "#C9A96E", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>{label}</div>
          {plan[key].map((s, i) => (
            <div key={i} style={{ padding: "9px 0", borderBottom: i < plan[key].length - 1 ? "1px solid #16161E" : "none" }}>
              {editing ? (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ color: "#C9A96E", fontSize: 11, flexShrink: 0, marginTop: 6 }}>{s.step}.</span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                    <input style={editInput} value={s.task} onChange={e => updateStep(key, i, "task", e.target.value)} placeholder="Step name" />
                    <input style={{ ...editInput, color: "#888" }} value={s.note} onChange={e => updateStep(key, i, "note", e.target.value)} placeholder="Note" />
                  </div>
                  <RemoveBtn onClick={() => removeStep(key, i)} />
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#C9A96E", fontSize: 11, flexShrink: 0 }}>{s.step}.</span>
                  <div>
                    <div style={{ fontSize: 12 }}>{s.task}</div>
                    <div style={{ fontSize: 11, color: "#3A3A48", marginTop: 2, lineHeight: 1.4 }}>{s.note}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {editing && <AddButton onClick={() => addStep(key)} label="+ Step" color="#C9A96E" />}
        </div>
      ))}

      <div style={{ background: "#0F0F16", border: "1px solid #C9A96E15", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: "#C9A96E", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>To Buy</div>
        {plan.toBuy.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #16161E" }}>
            {editing ? (
              <>
                <input style={{ ...editInput, flex: 2 }} value={t.item} onChange={e => updateToBuy(i, "item", e.target.value)} />
                <input style={{ ...editInput, flex: 1 }} value={t.price} onChange={e => updateToBuy(i, "price", e.target.value)} />
                <RemoveBtn onClick={() => removeToBuy(i)} />
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 12 }}>{t.item}</span>
                <span style={{ fontSize: 11, color: "#C9A96E" }}>{t.price}</span>
              </>
            )}
          </div>
        ))}
        {editing && <AddButton onClick={addToBuy} label="+ Item" color="#C9A96E" />}
      </div>
    </div>
  );
}

// ─── DIET PLAN ────────────────────────────────────────────────────────────────
function DietPlan({ plan, setPlan }) {
  const [editing, setEditing] = useState(false);

  function updateTarget(val) {
    setPlan(p => ({ ...p, target: val }));
  }
  function updateMealField(idx, field, val) {
    setPlan(p => ({ ...p, meals: p.meals.map((m, i) => i === idx ? { ...m, [field]: val } : m) }));
  }
  function updateMealItem(mIdx, iIdx, val) {
    setPlan(p => ({ ...p, meals: p.meals.map((m, i) => i === mIdx ? { ...m, items: m.items.map((it, j) => j === iIdx ? val : it) } : m) }));
  }
  function addMealItem(mIdx) {
    setPlan(p => ({ ...p, meals: p.meals.map((m, i) => i === mIdx ? { ...m, items: [...m.items, "New item"] } : m) }));
  }
  function removeMealItem(mIdx, iIdx) {
    setPlan(p => ({ ...p, meals: p.meals.map((m, i) => i === mIdx ? { ...m, items: m.items.filter((_, j) => j !== iIdx) } : m) }));
  }
  function addMeal() {
    setPlan(p => ({ ...p, meals: [...p.meals, { time: "00:00 AM", label: `Meal ${p.meals.length + 1}`, items: ["New item"], macros: "~0g P · ~0 kcal" }] }));
  }
  function removeMeal(idx) {
    setPlan(p => ({ ...p, meals: p.meals.filter((_, i) => i !== idx) }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <EditHeader title="Diet Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(DEFAULT_DIET); setEditing(false); }} />

      {editing ? (
        <input style={editInput} value={plan.target} onChange={e => updateTarget(e.target.value)} />
      ) : (
        <div style={{ background: "#E07B5A12", border: "1px solid #E07B5A30", borderRadius: 10, padding: "11px 14px", fontSize: 12, color: "#E07B5A" }}>{plan.target}</div>
      )}

      {plan.meals.map((m, idx) => (
        <div key={idx} style={{ background: "#0D0D12", border: "1px solid #16161E", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "flex-start" }}>
            {editing ? (
              <div style={{ display: "flex", gap: 6, flex: 1, marginRight: 8 }}>
                <input style={{ ...editInput, flex: 2 }} value={m.label} onChange={e => updateMealField(idx, "label", e.target.value)} placeholder="Meal name" />
                <input style={{ ...editInput, flex: 1 }} value={m.time} onChange={e => updateMealField(idx, "time", e.target.value)} placeholder="Time" />
              </div>
            ) : (
              <>
                <span style={{ fontSize: 13, color: "#E07B5A" }}>{m.label}</span>
                <span style={{ fontSize: 10, color: "#3A3A48" }}>{m.time}</span>
              </>
            )}
            {editing && <RemoveBtn onClick={() => removeMeal(idx)} />}
          </div>

          {m.items.map((item, j) => (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: j < m.items.length - 1 ? "1px solid #16161E" : "none" }}>
              {editing ? (
                <>
                  <input style={editInput} value={item} onChange={e => updateMealItem(idx, j, e.target.value)} />
                  <RemoveBtn onClick={() => removeMealItem(idx, j)} />
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#888" }}>· {item}</div>
              )}
            </div>
          ))}
          {editing && <AddButton onClick={() => addMealItem(idx)} label="+ Item" color="#E07B5A" />}

          <div style={{ marginTop: 8 }}>
            {editing ? (
              <input style={{ ...editInput, color: "#3A3A48" }} value={m.macros} onChange={e => updateMealField(idx, "macros", e.target.value)} placeholder="Macros" />
            ) : (
              <div style={{ fontSize: 10, color: "#3A3A48" }}>{m.macros}</div>
            )}
          </div>
        </div>
      ))}
      {editing && <AddButton onClick={addMeal} label="+ Add Meal" color="#E07B5A" />}
    </div>
  );
}

// ─── HAIRCARE PLAN ────────────────────────────────────────────────────────────
function HaircarePlan({ plan, setPlan }) {
  const [editing, setEditing] = useState(false);

  function updateWashStep(idx, field, val) {
    setPlan(p => ({ ...p, washDay: p.washDay.map((s, i) => i === idx ? { ...s, [field]: val } : s) }));
  }
  function addWashStep() {
    setPlan(p => ({ ...p, washDay: [...p.washDay, { step: p.washDay.length + 1, task: "New step", note: "" }] }));
  }
  function removeWashStep(idx) {
    setPlan(p => ({ ...p, washDay: p.washDay.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })) }));
  }
  function updateListItem(listKey, idx, val) {
    setPlan(p => ({ ...p, [listKey]: p[listKey].map((s, i) => i === idx ? val : s) }));
  }
  function addListItem(listKey) {
    setPlan(p => ({ ...p, [listKey]: [...p[listKey], "New item"] }));
  }
  function removeListItem(listKey, idx) {
    setPlan(p => ({ ...p, [listKey]: p[listKey].filter((_, i) => i !== idx) }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <EditHeader title="Hair Care Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(DEFAULT_HAIRCARE); setEditing(false); }} />

      {/* Wash Day */}
      <div style={{ background: "#0D0D12", border: "1px solid #7EB8A418", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, color: "#7EB8A4", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Wash Day (2–3x/week)</div>
        {plan.washDay.map((s, i) => (
          <div key={i} style={{ padding: "9px 0", borderBottom: i < plan.washDay.length - 1 ? "1px solid #16161E" : "none" }}>
            {editing ? (
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color: "#7EB8A4", fontSize: 11, flexShrink: 0, marginTop: 6 }}>{s.step}.</span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <input style={editInput} value={s.task} onChange={e => updateWashStep(i, "task", e.target.value)} />
                  <input style={{ ...editInput, color: "#888" }} value={s.note} onChange={e => updateWashStep(i, "note", e.target.value)} />
                </div>
                <RemoveBtn onClick={() => removeWashStep(i)} />
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#7EB8A4", fontSize: 11, flexShrink: 0 }}>{s.step}.</span>
                <div>
                  <div style={{ fontSize: 12 }}>{s.task}</div>
                  <div style={{ fontSize: 11, color: "#3A3A48", marginTop: 2, lineHeight: 1.4 }}>{s.note}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        {editing && <AddButton onClick={addWashStep} label="+ Step" color="#7EB8A4" />}
      </div>

      {/* Daily & Weekly */}
      {[{ key: "daily", label: "Daily" }, { key: "weekly", label: "Weekly" }].map(({ key, label }) => (
        <div key={key} style={{ background: "#0D0D12", border: "1px solid #16161E", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 9, color: "#7EB8A4", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
          {plan[key].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: i < plan[key].length - 1 ? "1px solid #16161E" : "none" }}>
              {editing ? (
                <>
                  <input style={editInput} value={t} onChange={e => updateListItem(key, i, e.target.value)} />
                  <RemoveBtn onClick={() => removeListItem(key, i)} />
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#888" }}>· {t}</div>
              )}
            </div>
          ))}
          {editing && <AddButton onClick={() => addListItem(key)} label="+ Item" color="#7EB8A4" />}
        </div>
      ))}
    </div>
  );
}

// ─── SPIRITUAL PLAN ───────────────────────────────────────────────────────────
function SpiritualPlan({ plan, setPlan }) {
  const [editing, setEditing] = useState(false);

  function updateSectionTime(si, val) {
    setPlan(p => p.map((s, i) => i === si ? { ...s, time: val } : s));
  }
  function updateStepTitle(si, ti, val) {
    setPlan(p => p.map((s, i) => i === si ? {
      ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, title: val } : st)
    } : s));
  }
  function updateItem(si, ti, ii, val) {
    setPlan(p => p.map((s, i) => i === si ? {
      ...s, steps: s.steps.map((st, j) => j === ti ? {
        ...st, items: st.items.map((it, k) => k === ii ? val : it)
      } : st)
    } : s));
  }
  function addItem(si, ti) {
    setPlan(p => p.map((s, i) => i === si ? {
      ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, items: [...st.items, "New item"] } : st)
    } : s));
  }
  function removeItem(si, ti, ii) {
    setPlan(p => p.map((s, i) => i === si ? {
      ...s, steps: s.steps.map((st, j) => j === ti ? { ...st, items: st.items.filter((_, k) => k !== ii) } : st)
    } : s));
  }
  function addStep(si) {
    setPlan(p => p.map((s, i) => i === si ? { ...s, steps: [...s.steps, { title: "New step", items: ["New item"] }] } : s));
  }
  function removeStep(si, ti) {
    setPlan(p => p.map((s, i) => i === si ? { ...s, steps: s.steps.filter((_, j) => j !== ti) } : s));
  }
  function addSection() {
    setPlan(p => [...p, { time: "NEW SECTION", color: "#C9A96E", steps: [{ title: "New step", items: ["New item"] }] }]);
  }
  function removeSection(si) {
    setPlan(p => p.filter((_, i) => i !== si));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <EditHeader title="Spirituality Plan" editing={editing} setEditing={setEditing} onReset={() => { setPlan(DEFAULT_SPIRITUAL); setEditing(false); }} />

      {plan.map((section, si) => (
        <div key={si}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {editing ? (
              <>
                <input style={{ ...editInput, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", flex: 1 }} value={section.time} onChange={e => updateSectionTime(si, e.target.value)} />
                <RemoveBtn onClick={() => removeSection(si)} />
              </>
            ) : (
              <div style={{ fontSize: 9, color: section.color, letterSpacing: 3, textTransform: "uppercase" }}>{section.time}</div>
            )}
          </div>

          {section.steps.map((step, ti) => (
            <div key={ti} style={{ background: "#0D0D12", border: `1px solid ${section.color}18`, borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                {editing ? (
                  <>
                    <input style={{ ...editInput, color: section.color }} value={step.title} onChange={e => updateStepTitle(si, ti, e.target.value)} />
                    <RemoveBtn onClick={() => removeStep(si, ti)} />
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: section.color }}>{step.title}</div>
                )}
              </div>
              {step.items.map((item, ii) => (
                <div key={ii} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: ii < step.items.length - 1 ? "1px solid #16161E" : "none" }}>
                  {editing ? (
                    <>
                      <input style={{ ...editInput, color: "#888" }} value={item} onChange={e => updateItem(si, ti, ii, e.target.value)} />
                      <RemoveBtn onClick={() => removeItem(si, ti, ii)} />
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: item.startsWith('"') ? "#E8E4DC" : "#888", fontStyle: item.startsWith('"') ? "italic" : "normal", lineHeight: 1.5 }}>{item}</div>
                  )}
                </div>
              ))}
              {editing && <AddButton onClick={() => addItem(si, ti)} label="+ Item" color={section.color} />}
            </div>
          ))}
          {editing && <AddButton onClick={() => addStep(si)} label="+ Step" color={section.color} />}
        </div>
      ))}
      {editing && <AddButton onClick={addSection} label="+ Section" color="#C9A96E" />}
    </div>
  );
}


// ─── SHARED ───────────────────────────────────────────────────────────────────
function StatsView({ xpLogs, achievements, logs, getStreak, nofapStreak }) {
  const totalXP = getTotalXP(xpLogs);
  const rank = getCurrentRank(totalXP);
  const nextRank = getNextRank(totalXP);
  const xpToNext = nextRank.xpRequired - totalXP;
  const rankProgress = nextRank.xpRequired === rank.xpRequired ? 100 : Math.round(((totalXP - rank.xpRequired) / (nextRank.xpRequired - rank.xpRequired)) * 100);

  const SL_RED = "#FF0000";
  const SL_SILVER = "#C0C0C0";
  const SL_BLUE = "#4169E1";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, paddingBottom:20 }}>
      <div style={{ fontSize:10, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>Player Status</div>

      {/* Main rank card */}
      <div style={{ background:"linear-gradient(135deg, #0A0A0F 0%, #0D0D1A 100%)", border:`1px solid ${rank.color}40`, borderRadius:16, padding:20, textAlign:"center", boxShadow:`0 0 30px ${rank.color}20` }}>
        <div style={{ fontSize:11, color:rank.color, letterSpacing:4, textTransform:"uppercase", marginBottom:8, textShadow:`0 0 10px ${rank.color}` }}>RANK</div>
        <div style={{ fontSize:72, color:rank.color, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, lineHeight:1, textShadow:`0 0 20px ${rank.color}, 0 0 40px ${rank.color}60` }}>{rank.rank}</div>
        <div style={{ fontSize:16, color:SL_SILVER, fontFamily:"'Cormorant Garamond',serif", marginTop:6, letterSpacing:2 }}>{rank.title}</div>
        <div style={{ marginTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.muted, marginBottom:6 }}>
            <span>{totalXP.toLocaleString()} XP</span>
            <span>{xpToNext > 0 ? `${xpToNext.toLocaleString()} to ${nextRank.rank}` : "MAX RANK"}</span>
          </div>
          <div style={{ background:"#1A1A2E", borderRadius:4, height:8, overflow:"hidden" }}>
            <div style={{ width:`${rankProgress}%`, height:"100%", background:`linear-gradient(90deg, ${rank.color}, ${SL_SILVER})`, borderRadius:4, transition:"width 0.8s ease", boxShadow:`0 0 10px ${rank.color}` }} />
          </div>
        </div>
      </div>

      {/* Category levels */}
      <div style={{ background:C.surface, border:`1px solid ${SL_BLUE}30`, borderRadius:12, padding:14 }}>
        <div style={{ fontSize:9, color:SL_BLUE, letterSpacing:3, textTransform:"uppercase", marginBottom:14, textShadow:`0 0 8px ${SL_BLUE}` }}>Category Stats</div>
        {Object.entries(CATEGORY_LEVELS).map(([cat, data]) => {
          const catXP = getCategoryXP(logs, cat);
          const level = getCategoryLevel(catXP);
          const levelName = data.levels[level];
          const nextLevelXP = [0,200,600,1500,3500,7000,15000][Math.min(level+1, 6)];
          const pct = level >= 6 ? 100 : Math.round((catXP / nextLevelXP) * 100);
          return (
            <div key={cat} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ color:COLORS[cat]||SL_SILVER, fontSize:11 }}>{data.icon}</span>
                  <span style={{ fontSize:11, color:C.text }}>{data.name}</span>
                  <span style={{ fontSize:9, color:COLORS[cat]||SL_SILVER, background:`${COLORS[cat]||SL_SILVER}15`, padding:"2px 6px", borderRadius:4 }}>Lv.{level} {levelName}</span>
                </div>
                <span style={{ fontSize:10, color:C.muted }}>{catXP} XP</span>
              </div>
              <div style={{ background:"#1A1A2E", borderRadius:3, height:4 }}>
                <div style={{ width:`${pct}%`, height:"100%", background:COLORS[cat]||SL_SILVER, borderRadius:3, boxShadow:`0 0 6px ${COLORS[cat]||SL_SILVER}80` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Achievements */}
      <div style={{ background:C.surface, border:`1px solid ${SL_RED}30`, borderRadius:12, padding:14 }}>
        <div style={{ fontSize:9, color:SL_RED, letterSpacing:3, textTransform:"uppercase", marginBottom:14, textShadow:`0 0 8px ${SL_RED}` }}>
          Achievements — {achievements.length}/{ACHIEVEMENTS_LIST.length}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {ACHIEVEMENTS_LIST.map(ach => {
            const unlocked = achievements.includes(ach.id);
            return (
              <div key={ach.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:unlocked?"#1A0A0A":"#0D0D12", border:`1px solid ${unlocked?SL_RED+"40":C.border}`, borderRadius:10, opacity:unlocked?1:0.4, transition:"all 0.3s" }}>
                <div style={{ fontSize:20, filter:unlocked?"none":"grayscale(100%)" }}>{ach.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:unlocked?SL_SILVER:C.muted }}>{ach.title}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{ach.desc}</div>
                </div>
                <div style={{ fontSize:11, color:unlocked?SL_RED:C.muted }}>+{ach.xp} XP</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's XP */}
      <div style={{ background:"linear-gradient(135deg, #0A0A0F, #0D0D1A)", border:`1px solid ${SL_RED}30`, borderRadius:12, padding:14, textAlign:"center" }}>
        <div style={{ fontSize:9, color:SL_RED, letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>Today's XP Earned</div>
        <div style={{ fontSize:36, color:SL_RED, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, textShadow:`0 0 15px ${SL_RED}` }}>{xpLogs[todayKey()] || 0}</div>
        <div style={{ fontSize:9, color:C.muted, marginTop:4 }}>Total: {totalXP.toLocaleString()} XP</div>
      </div>
    </div>
  );
}

function Ring({ value, size, color, label, sublabel }) {
  const r=(size-14)/2, circ=2*Math.PI*r, offset=circ-(value/100)*circ;
  return (
    <div style={{ position:"relative", width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.faint} strokeWidth={7} />
        <circle className="ring-track" cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:20, color, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{label}</div>
        <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, marginTop:2 }}>{sublabel?.toUpperCase()}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${color}18`, borderRadius:10, padding:"12px 10px", textAlign:"center" }}>
      <div style={{ fontSize:20, color, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{value}</div>
      <div style={{ fontSize:9, color:C.muted, letterSpacing:2, textTransform:"uppercase", marginTop:4 }}>{label}</div>
    </div>
  );
}
