import React, {useState, useEffect, useRef } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#07070A", surface: "#0D0D12", border: "#16161E", faint: "#0F0F16",
  text: "#E8E4DC", muted: "#3A3A48", dim: "#555566",
  workout: "#5B8DEF", skincare: "#C9A96E", diet: "#E07B5A",
  nofap: "#E05A7B", haircare: "#7EB8A4",
};
const COLORS = { workout: C.workout, skincare: C.skincare, diet: C.diet, nofap: C.nofap, haircare: C.haircare };

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
  { id: "h4", label: "Workout", category: "workout", type: "binary", icon: "◆" },
  { id: "h5", label: "Hit Protein Goal", category: "diet", type: "binary", icon: "◉" },
  { id: "h6", label: "Water Intake", category: "diet", type: "quantitative", unit: "L", target: 3, icon: "◉" },
  { id: "h7", label: "All 6 Meals", category: "diet", type: "binary", icon: "◉" },
  { id: "h8", label: "Supplements Taken", category: "diet", type: "binary", icon: "◉" },
  { id: "h9", label: "NoFap", category: "nofap", type: "binary", icon: "⬡" },
  { id: "h10", label: "Phone Out of Bedroom", category: "nofap", type: "binary", icon: "⬡" },
  { id: "h11", label: "Hair Oil Massage", category: "haircare", type: "binary", icon: "◈" },
  { id: "h12", label: "Scalp Massage", category: "haircare", type: "binary", icon: "◈" },
  { id: "h13", label: "No Junk Food", category: "diet", type: "binary", icon: "◉" },
];

// ─── WORKOUT DATA ─────────────────────────────────────────────────────────────
const WORKOUT_DAYS = [
  { day: "Day 1", focus: "ARMS — Heavy", sections: [
    { title: "Triceps", exercises: ["Close-Grip Bench Press","Rope Overhead Cable Extension","Bar Pressdowns"] },
    { title: "Biceps", exercises: ["Bayesian Cable Curls","Preacher Curls","Hammer Curls"] },
    { title: "Forearms", exercises: ["Wrist Curls","Reverse Wrist Curls"] },
  ]},
  { day: "Day 2", focus: "CHEST + DELTS", sections: [
    { title: "Chest", exercises: ["Incline Barbell Bench Press","Machine Chest Press","Chest Dips"] },
    { title: "Delts", exercises: ["Standing Cable Lateral Raises","Machine Shoulder Press"] },
    { title: "Abs", exercises: ["Cable Crunches","Leg Raises"] },
  ]},
  { day: "Day 3", focus: "BACK", sections: [
    { title: "Back", exercises: ["Weighted Pull-Ups","Barbell Bent Over Rows","Chest-Supported Machine Row","Rear Delt Machine Fly"] },
    { title: "Traps", exercises: ["Barbell Shrugs"] },
    { title: "Forearms", exercises: ["Wrist Curls","Reverse Wrist Curls"] },
  ]},
  { day: "Day 4", focus: "SHOULDERS + ARMS", sections: [
    { title: "Delts", exercises: ["Seated Dumbbell Lateral Raise","Machine Shoulder Press","Reverse Fly"] },
    { title: "Arms SS-A", exercises: ["Rope Overhead Extensions","Bayesian Cable Curls"] },
    { title: "Arms SS-B", exercises: ["Bar Pressdowns","Hammer Curls"] },
    { title: "Abs", exercises: ["Cable Woodchoppers","Hanging Leg Raises"] },
  ]},
  { day: "Day 5", focus: "CHEST + BACK", sections: [
    { title: "Chest", exercises: ["Incline DB Press","Cable Flyes"] },
    { title: "Back", exercises: ["Straight-Arm Lat Pulldowns","Assisted Pull-Ups","Chest-Supported Row"] },
    { title: "Abs", exercises: ["Cable Crunches","Leg Raises"] },
  ]},
  { day: "Day 6", focus: "ARMS + LEGS", sections: [
    { title: "Triceps", exercises: ["Weighted Dips","Skullcrushers","Bar Pressdowns"] },
    { title: "Biceps", exercises: ["Barbell Curl","Incline Dumbbell Curls","Hammer Curl Dropset"] },
    { title: "Forearms", exercises: ["Wrist Curls","Reverse Wrist Curls"] },
    { title: "Legs", exercises: ["Leg Press","Lying Leg Curl"] },
  ]},
  { day: "Day 7", focus: "REST", sections: [] },
];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
function useLS(key, def) {
  const [val, setVal] = useState(() => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } });
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
        content: `Give me the nutritional info for: "${query}". 
Return ONLY a JSON array of 1-4 matching food items (no markdown, no backticks, just raw JSON).
Format: [{"name":"Food Name (amount)","calories":0,"protein":0,"carbs":0,"fat":0,"fibre":0,"amount":"100g"}]
Use realistic Indian food database values. All numbers should be per the specified amount.
If amount is not specified, use 100g as default. Be accurate for Indian foods like dal, roti, rice, paneer, soya chunks etc.`
      }]
    })
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || "[]";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return []; }
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dashboard");
  const [logs, setLogs] = useLS("anant_v3_logs", {});
  const [workoutLogs, setWorkoutLogs] = useLS("anant_v3_workout", {});
  const [foodLogs, setFoodLogs] = useLS("anant_v3_food", {});
  const [nofapStart, setNofapStart] = useLS("anant_v3_nofap", todayKey());
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [subView, setSubView] = useState(null); // "workoutlog" | "foodlog" | "analytics"

  const [selectedDate, setSelectedDate] = useState(todayKey());
const today = selectedDate;
const todayLogs = logs[today] || {};
  function toggleHabit(id) {
    setLogs(p => { const d = { ...(p[today] || {}) }; d[id] = { ...d[id], done: !d[id]?.done }; return { ...p, [today]: d }; });
  }
  function setQty(id, val) {
    setLogs(p => { const d = { ...(p[today] || {}) }; d[id] = { done: parseFloat(val) > 0, value: parseFloat(val) }; return { ...p, [today]: d }; });
  }
  function getStreak(id) {
    let s = 0, d = new Date();
    while (true) { const k = d.toISOString().split("T")[0]; if (logs[k]?.[id]?.done) { s++; d.setDate(d.getDate() - 1); } else break; }
    return s;
  }
  function getNofapStreak() { return Math.floor((new Date() - new Date(nofapStart)) / 86400000); }
  function getTodayPct() { return Math.round((HABITS.filter(h => todayLogs[h.id]?.done).length / HABITS.length) * 100); }
  function getWeeklyPct() {
    const days = last7(); let done = 0;
    days.forEach(d => HABITS.forEach(h => { if (logs[d]?.[h.id]?.done) done++; }));
    return Math.round((done / (HABITS.length * 7)) * 100);
  }
  function getTodayMacros() {
    const entries = foodLogs[today] || [];
    return entries.reduce((acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
      fibre: acc.fibre + (e.fibre || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 });
  }

  // Show sub-views fullscreen
  if (subView === "workoutlog") return <WorkoutLogger workoutLogs={workoutLogs} setWorkoutLogs={setWorkoutLogs} onBack={() => setSubView(null)} />;
  if (subView === "foodlog") return <FoodLogger foodLogs={foodLogs} setFoodLogs={setFoodLogs} onBack={() => setSubView(null)} />;
  if (subView === "analytics") return <AnalyticsView logs={logs} workoutLogs={workoutLogs} foodLogs={foodLogs} nofapStreak={getNofapStreak()} onBack={() => setSubView(null)} />;

  return (
    <div style={{minHeight:"-webkit-fill-available", minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:"'DM Mono',monospace", width:"100vw", maxWidth:"100%", margin:"0 auto", paddingBottom:80, overflowX:"hidden"}}>
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
      <div style={{ padding:"60px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:4, color:C.muted, textTransform:"uppercase" }}>Self System</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:700, lineHeight:1, marginTop:4 }}>Anant</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
  <button onClick={() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  }} style={{ background:"none", border:"none", color:C.muted, fontSize:16, cursor:"pointer" }}>‹</button>
  <div style={{ fontSize:10, color: selectedDate === todayKey() ? C.muted : C.nofap, letterSpacing:1 }}>
    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}
  </div>
  <button onClick={() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split("T")[0];
    if (next <= todayKey()) setSelectedDate(next);
  }} style={{ background:"none", border:"none", color:C.muted, fontSize:16, cursor:"pointer" }}>›</button>
</div>
          <div style={{ fontSize:24, color:C.skincare, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, marginTop:4 }}>{getTodayPct()}%</div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>TODAY</div>
        </div>
      </div>

      <div className="fade" key={view} style={{ padding:"20px 20px 0" }}>
        {view==="dashboard" && <Dashboard logs={logs} nofapStreak={getNofapStreak()} weeklyPct={getWeeklyPct()} todayPct={getTodayPct()} getStreak={getStreak} setView={setView} setSelectedRoutine={setSelectedRoutine} todayLogs={todayLogs} setSubView={setSubView} todayMacros={getTodayMacros()} />}
        {view==="habits" && <HabitsView todayLogs={todayLogs} toggleHabit={toggleHabit} setQty={setQty} getStreak={getStreak} />}
        {view==="routines" && <RoutinesView selected={selectedRoutine} setSelected={setSelectedRoutine} nofapStreak={getNofapStreak()} setNofapStart={setNofapStart} />}
        {view==="log" && <LogHub setSubView={setSubView} todayMacros={getTodayMacros()} workoutLogs={workoutLogs} />}
      </div>

      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"rgba(7,7,10,0.97)", backdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`, display:"flex", padding:"12px 0 22px" }}>
        {[["dashboard","◎","Home"],["habits","◉","Today"],["log","◈","Log"],["routines","◆","Plans"]].map(([key,icon,label]) => (
          <button key={key} className="press" onClick={() => setView(key)} style={{ flex:1, background:"none", border:"none", display:"flex", flexDirection:"column", alignItems:"center", gap:5, color:view===key ? C.skincare : C.muted }}>
            <span style={{ fontSize:17 }}>{icon}</span>
            <span style={{ fontSize:9, letterSpacing:1.5, textTransform:"uppercase" }}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ logs, nofapStreak, weeklyPct, todayPct, getStreak, setView, setSelectedRoutine, todayLogs, setSubView, todayMacros }) {
  const doneTodayCount = HABITS.filter(h => todayLogs[h.id]?.done).length;
  const topStreaks = HABITS.map(h => ({ ...h, streak: getStreak(h.id) })).sort((a,b) => b.streak-a.streak).slice(0,3);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", justifyContent:"center", padding:"4px 0 8px" }}>
        <Ring value={todayPct} size={120} color={C.skincare} label={`${doneTodayCount}/${HABITS.length}`} sublabel="done" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        <Stat label="NoFap" value={`${nofapStreak}d`} color={C.nofap} />
        <Stat label="Weekly" value={`${weeklyPct}%`} color={C.workout} />
        <Stat label="Calories" value={Math.round(todayMacros.calories)} color={C.diet} />
      </div>

      {/* Quick Log buttons */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[["◆","Log Workout","workoutlog",C.workout],["◉","Log Food","foodlog",C.diet],["◎","Analytics","analytics",C.skincare]].map(([icon,label,sub,color]) => (
          <button key={sub} className="press" onClick={() => setSubView(sub)} style={{ background:C.surface, border:`1px solid ${color}25`, borderRadius:10, padding:"14px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:6, color:C.text }}>
            <span style={{ color, fontSize:18 }}>{icon}</span>
            <span style={{ fontSize:10, color:C.muted, textAlign:"center", lineHeight:1.3 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Today macros strip */}
      <div style={{ background:C.surface, border:`1px solid ${C.diet}18`, borderRadius:12, padding:"12px 14px" }}>
        <div style={{ fontSize:9, color:C.diet, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>Today's Nutrition</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4 }}>
          {[["Cal",Math.round(todayMacros.calories),""],["Pro",Math.round(todayMacros.protein),"g"],["Carb",Math.round(todayMacros.carbs),"g"],["Fat",Math.round(todayMacros.fat),"g"],["Fibre",Math.round(todayMacros.fibre),"g"]].map(([l,v,u]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:14, color:C.diet, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{v}{u}</div>
              <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.muted, marginBottom:4 }}>
            <span>Protein</span><span>{Math.round(todayMacros.protein)}/178g</span>
          </div>
          <div style={{ background:C.faint, borderRadius:3, height:3 }}>
            <div style={{ width:`${Math.min(100,(todayMacros.protein/178)*100)}%`, height:"100%", background:C.diet, borderRadius:3 }} />
          </div>
        </div>
      </div>

      {/* Top streaks */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
        <div style={{ fontSize:9, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>Streaks</div>
        {topStreaks.map((h,i) => (
          <div key={h.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<topStreaks.length-1?`1px solid ${C.border}`:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:COLORS[h.category], fontSize:11 }}>{h.icon}</span>
              <span style={{ fontSize:12, color:h.streak>0?C.text:C.muted }}>{h.label}</span>
            </div>
            <span style={{ fontSize:15, color:COLORS[h.category], fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{h.streak}<span style={{ fontSize:10, color:C.muted }}>d</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOG HUB ──────────────────────────────────────────────────────────────────
function LogHub({ setSubView, todayMacros, workoutLogs }) {
  const todayW = workoutLogs[todayKey()] || {};
  const totalSets = Object.values(todayW).reduce((a,ex) => a + (ex.sets?.length || 0), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:10, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>Log</div>

      <button className="press" onClick={() => setSubView("workoutlog")} style={{ background:C.surface, border:`1px solid ${C.workout}25`, borderRadius:14, padding:18, display:"flex", alignItems:"center", gap:14, color:C.text, textAlign:"left" }}>
        <span style={{ color:C.workout, fontSize:24 }}>◆</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>Workout Logger</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>Log sets, reps & weights per exercise</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:14, color:C.workout, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{totalSets}</div>
          <div style={{ fontSize:9, color:C.muted }}>sets today</div>
        </div>
      </button>

      <button className="press" onClick={() => setSubView("foodlog")} style={{ background:C.surface, border:`1px solid ${C.diet}25`, borderRadius:14, padding:18, display:"flex", alignItems:"center", gap:14, color:C.text, textAlign:"left" }}>
        <span style={{ color:C.diet, fontSize:24 }}>◉</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>Food Logger</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>Search foods, track macros & calories</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:14, color:C.diet, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{Math.round(todayMacros.protein)}g</div>
          <div style={{ fontSize:9, color:C.muted }}>protein today</div>
        </div>
      </button>

      <button className="press" onClick={() => setSubView("analytics")} style={{ background:C.surface, border:`1px solid ${C.skincare}25`, borderRadius:14, padding:18, display:"flex", alignItems:"center", gap:14, color:C.text, textAlign:"left" }}>
        <span style={{ color:C.skincare, fontSize:24 }}>◎</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>Analytics</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>Daily · Weekly · Monthly · Yearly</div>
        </div>
        <span style={{ color:C.muted, fontSize:14 }}>›</span>
      </button>
    </div>
  );
}

// ─── WORKOUT LOGGER ───────────────────────────────────────────────────────────
function WorkoutLogger({ workoutLogs, setWorkoutLogs, onBack }) {
  const today = todayKey();
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [dayIdx, setDayIdx] = useState(todayIdx);
  const [activeEx, setActiveEx] = useState(null); // exercise name being logged
  const [logMode, setLogMode] = useState("grouped"); // "grouped" | "individual"
  const [form, setForm] = useState({ sets:"3", reps:"10", weight:"", notes:"" });
  const [indivSets, setIndivSets] = useState([{ reps:"", weight:"" }]);

  const dayData = WORKOUT_DAYS[dayIdx];
  const todayLog = workoutLogs[today] || {};

  function getExLog(exName) { return todayLog[exName] || { sets:[] }; }

  function saveGrouped(exName) {
    const newSets = Array.from({ length: parseInt(form.sets) || 1 }, () => ({
      reps: parseInt(form.reps) || 0,
      weight: parseFloat(form.weight) || 0,
      timestamp: Date.now(),
    }));
    setWorkoutLogs(p => ({
      ...p,
      [today]: { ...p[today], [exName]: { sets: [...getExLog(exName).sets, ...newSets], notes: form.notes } }
    }));
    setActiveEx(null);
    setForm({ sets:"3", reps:"10", weight:"", notes:"" });
  }

  function saveIndividual(exName) {
    const newSets = indivSets.filter(s => s.reps || s.weight).map(s => ({
      reps: parseInt(s.reps) || 0,
      weight: parseFloat(s.weight) || 0,
      timestamp: Date.now(),
    }));
    setWorkoutLogs(p => ({
      ...p,
      [today]: { ...p[today], [exName]: { sets: [...getExLog(exName).sets, ...newSets] } }
    }));
    setActiveEx(null);
    setIndivSets([{ reps:"", weight:"" }]);
  }

  function deleteSet(exName, idx) {
    setWorkoutLogs(p => {
      const ex = { ...getExLog(exName) };
      ex.sets = ex.sets.filter((_,i) => i !== idx);
      return { ...p, [today]: { ...p[today], [exName]: ex } };
    });
  }

  function getBestSet(exName) {
    const allLogs = Object.values(workoutLogs);
    let best = null;
    allLogs.forEach(dayL => {
      const ex = dayL[exName];
      if (ex?.sets) ex.sets.forEach(s => { if (!best || s.weight > best.weight) best = s; });
    });
    return best;
  }

  const allExercises = dayData.sections.flatMap(s => s.exercises);
  const loggedCount = allExercises.filter(ex => getExLog(ex).sets.length > 0).length;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Mono',monospace", maxWidth:480, margin:"0 auto", padding:"60px 20px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.muted, fontSize:12, letterSpacing:1 }}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700 }}>Workout Log</div>
          <div style={{ fontSize:10, color:C.muted }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:16, color:C.workout, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{loggedCount}/{allExercises.length}</div>
          <div style={{ fontSize:9, color:C.muted }}>logged</div>
        </div>
      </div>

      {/* Day selector */}
      <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:8, marginBottom:16 }}>
        {WORKOUT_DAYS.map((d,i) => (
          <button key={i} className="press" onClick={() => setDayIdx(i)} style={{ background:dayIdx===i?C.workout:C.surface, border:`1px solid ${dayIdx===i?C.workout:C.border}`, borderRadius:7, padding:"6px 10px", color:dayIdx===i?"#000":C.muted, fontSize:10, whiteSpace:"nowrap" }}>
            {d.day.replace("Day ","D")}
          </button>
        ))}
      </div>

      <div style={{ fontSize:12, color:C.workout, marginBottom:16 }}>{dayData.focus}</div>

      {dayData.sections.length === 0 ? (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:24, textAlign:"center", color:C.muted, fontSize:13 }}>Rest day. Recover well.</div>
      ) : (
        dayData.sections.map((sec, si) => (
          <div key={si} style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{sec.title}</div>
            {sec.exercises.map(exName => {
              const exLog = getExLog(exName);
              const best = getBestSet(exName);
              const isActive = activeEx === exName;
              return (
                <div key={exName} style={{ background:C.surface, border:`1px solid ${exLog.sets.length>0?C.workout+"30":C.border}`, borderRadius:10, marginBottom:6, overflow:"hidden" }}>
                  <div className="press" style={{ padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }} onClick={() => { setActiveEx(isActive ? null : exName); setForm({ sets:"3", reps:"10", weight:"", notes:"" }); setIndivSets([{reps:"",weight:""}]); }}>
                    <div>
                      <div style={{ fontSize:12, color:exLog.sets.length>0?C.text:"#888" }}>{exName}</div>
                      {best && <div style={{ fontSize:10, color:C.workout, marginTop:2 }}>Best: {best.weight}kg × {best.reps}</div>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {exLog.sets.length > 0 && <span style={{ fontSize:11, color:C.workout }}>{exLog.sets.length} sets</span>}
                      <span style={{ color:C.muted, fontSize:14 }}>{isActive?"↑":"+"}</span>
                    </div>
                  </div>

                  {/* Logged sets */}
                  {exLog.sets.length > 0 && (
                    <div style={{ borderTop:`1px solid ${C.border}`, padding:"8px 14px" }}>
                      <div style={{ display:"flex", gap:4, fontSize:9, color:C.muted, letterSpacing:1, marginBottom:6 }}>
                        <span style={{ width:28 }}>SET</span><span style={{ width:60 }}>WEIGHT</span><span style={{ width:50 }}>REPS</span><span style={{ marginLeft:"auto" }}></span>
                      </div>
                      {exLog.sets.map((s,idx) => (
                        <div key={idx} style={{ display:"flex", gap:4, fontSize:12, alignItems:"center", padding:"3px 0" }}>
                          <span style={{ width:28, color:C.muted }}>{idx+1}</span>
                          <span style={{ width:60, color:C.workout }}>{s.weight}kg</span>
                          <span style={{ width:50, color:C.text }}>{s.reps} reps</span>
                          <button onClick={() => deleteSet(exName,idx)} style={{ marginLeft:"auto", background:"none", border:"none", color:C.muted, fontSize:11 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Log form */}
                  {isActive && (
                    <div style={{ borderTop:`1px solid ${C.border}`, padding:14, background:C.faint }}>
                      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                        {["grouped","individual"].map(m => (
                          <button key={m} className="press" onClick={() => setLogMode(m)} style={{ flex:1, background:logMode===m?C.workout:C.surface, border:`1px solid ${logMode===m?C.workout:C.border}`, borderRadius:6, padding:"6px", color:logMode===m?"#000":C.muted, fontSize:10, textTransform:"capitalize" }}>
                            {m === "grouped" ? "Group Entry" : "Set by Set"}
                          </button>
                        ))}
                      </div>

                      {logMode === "grouped" ? (
                        <div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                            {[["Sets",form.sets,"sets"],["Reps",form.reps,"reps"],["Weight",form.weight,"kg"]].map(([label,val,field]) => (
                              <div key={field}>
                                <div style={{ fontSize:9, color:C.muted, letterSpacing:1, marginBottom:4 }}>{label.toUpperCase()}</div>
                                <input type="number" value={val} onChange={e => setForm(p=>({...p,[field]:e.target.value}))} placeholder="0" style={{ width:"100%" }} />
                              </div>
                            ))}
                          </div>
                          <input value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Notes (optional)" style={{ width:"100%", marginBottom:10 }} />
                          <button className="press" onClick={() => saveGrouped(exName)} style={{ width:"100%", background:C.workout, border:"none", borderRadius:8, padding:"10px", color:"#000", fontSize:12, fontWeight:500 }}>
                            Save {form.sets} Sets
                          </button>
                        </div>
                      ) : (
                        <div>
                          {indivSets.map((s,idx) => (
                            <div key={idx} style={{ display:"grid", gridTemplateColumns:"auto 1fr 1fr auto", gap:8, marginBottom:8, alignItems:"center" }}>
                              <span style={{ fontSize:11, color:C.muted, width:20 }}>{idx+1}</span>
                              <input type="number" value={s.weight} onChange={e => { const n=[...indivSets]; n[idx].weight=e.target.value; setIndivSets(n); }} placeholder="kg" />
                              <input type="number" value={s.reps} onChange={e => { const n=[...indivSets]; n[idx].reps=e.target.value; setIndivSets(n); }} placeholder="reps" />
                              <button onClick={() => setIndivSets(p=>p.filter((_,i)=>i!==idx))} style={{ background:"none", border:"none", color:C.muted, fontSize:12 }}>✕</button>
                            </div>
                          ))}
                          <button className="press" onClick={() => setIndivSets(p=>[...p,{reps:"",weight:""}])} style={{ background:"none", border:`1px dashed ${C.muted}`, borderRadius:7, padding:"7px", color:C.muted, fontSize:11, width:"100%", marginBottom:10 }}>
                            + Add Set
                          </button>
                          <button className="press" onClick={() => saveIndividual(exName)} style={{ width:"100%", background:C.workout, border:"none", borderRadius:8, padding:"10px", color:"#000", fontSize:12 }}>
                            Save Sets
                          </button>
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
  const today = todayKey();
  const entries = foodLogs[today] || [];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editQty, setEditQty] = useState({}); // { resultIdx: multiplier }

  const totals = entries.reduce((a,e) => ({
    calories: a.calories+(e.calories||0), protein: a.protein+(e.protein||0),
    carbs: a.carbs+(e.carbs||0), fat: a.fat+(e.fat||0), fibre: a.fibre+(e.fibre||0),
  }), { calories:0, protein:0, carbs:0, fat:0, fibre:0 });

  async function search() {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResults([]);
    try {
      const res = await searchFoodNutrition(query);
      setResults(res);
      if (!res.length) setError("No results found. Try a different query.");
    } catch { setError("Search failed. Check connection."); }
    setLoading(false);
  }

  function addEntry(item, multiplier = 1) {
    const entry = {
      id: Date.now(),
      name: item.name,
      amount: item.amount,
      calories: Math.round((item.calories||0) * multiplier),
      protein: Math.round((item.protein||0) * multiplier * 10)/10,
      carbs: Math.round((item.carbs||0) * multiplier * 10)/10,
      fat: Math.round((item.fat||0) * multiplier * 10)/10,
      fibre: Math.round((item.fibre||0) * multiplier * 10)/10,
      time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),
    };
    setFoodLogs(p => ({ ...p, [today]: [...(p[today]||[]), entry] }));
    setResults([]); setQuery("");
  }

  function removeEntry(id) {
    setFoodLogs(p => ({ ...p, [today]: (p[today]||[]).filter(e => e.id !== id) }));
  }

  const macroTargets = { calories:3030, protein:178, carbs:300, fat:80, fibre:30 };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Mono',monospace", maxWidth:480, margin:"0 auto", padding:"60px 20px 100px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.muted, fontSize:12 }}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700 }}>Food Log</div>
          <div style={{ fontSize:10, color:C.muted }}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}</div>
        </div>
      </div>

      {/* Macro summary */}
      <div style={{ background:C.surface, border:`1px solid ${C.diet}20`, borderRadius:12, padding:14, marginBottom:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, marginBottom:12 }}>
          {[["Cal",totals.calories,macroTargets.calories,""],["Pro",totals.protein,macroTargets.protein,"g"],["Carb",totals.carbs,macroTargets.carbs,"g"],["Fat",totals.fat,macroTargets.fat,"g"],["Fibre",totals.fibre,macroTargets.fibre,"g"]].map(([l,v,t,u]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:15, color:v>=t?C.haircare:C.diet, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{Math.round(v)}{u}</div>
              <div style={{ fontSize:8, color:C.muted, marginTop:1 }}>{l}/{t}{u}</div>
            </div>
          ))}
        </div>
        {/* Protein bar */}
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.muted, marginBottom:4 }}>
          <span>Protein Goal</span><span>{Math.round(totals.protein)}/178g</span>
        </div>
        <div style={{ background:C.faint, borderRadius:3, height:4 }}>
          <div style={{ width:`${Math.min(100,(totals.protein/178)*100)}%`, height:"100%", background:totals.protein>=178?C.haircare:C.diet, borderRadius:3, transition:"width 0.4s" }} />
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex", gap:8 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && search()} placeholder='e.g. "4 whole eggs" or "50g soya chunks"' style={{ flex:1 }} />
          <button className="press" onClick={search} style={{ background:C.diet, border:"none", borderRadius:7, padding:"8px 14px", color:"#000", fontSize:12 }}>
            {loading ? "..." : "Search"}
          </button>
        </div>
        {error && <div style={{ fontSize:11, color:C.nofap, marginTop:6 }}>{error}</div>}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:14, overflow:"hidden" }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:3, padding:"10px 14px 6px", textTransform:"uppercase" }}>Results</div>
          {results.map((item, idx) => {
            const mult = parseFloat(editQty[idx]) || 1;
            return (
              <div key={idx} style={{ borderTop:`1px solid ${C.border}`, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:C.text }}>{item.name}</div>
                    <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
                      {Math.round((item.calories||0)*mult)} kcal · {Math.round((item.protein||0)*mult*10)/10}g P · {Math.round((item.carbs||0)*mult*10)/10}g C · {Math.round((item.fat||0)*mult*10)/10}g F
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ fontSize:9, color:C.muted }}>×</div>
                  <input type="number" step="0.5" min="0.5" value={editQty[idx]||"1"} onChange={e => setEditQty(p=>({...p,[idx]:e.target.value}))} style={{ width:60 }} />
                  <div style={{ fontSize:9, color:C.muted }}>serving</div>
                  <button className="press" onClick={() => addEntry(item, mult)} style={{ marginLeft:"auto", background:C.diet, border:"none", borderRadius:6, padding:"6px 14px", color:"#000", fontSize:11 }}>
                    + Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Today's entries */}
      {entries.length > 0 && (
        <div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>Today's Entries</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {entries.map(entry => (
              <div key={entry.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:C.text }}>{entry.name}</span>
                    <span style={{ fontSize:10, color:C.muted }}>{entry.time}</span>
                  </div>
                  <div style={{ fontSize:10, color:C.diet, marginTop:3 }}>
                    {entry.calories} kcal · {entry.protein}g protein · {entry.carbs}g carbs · {entry.fat}g fat
                    {entry.fibre > 0 && ` · ${entry.fibre}g fibre`}
                  </div>
                </div>
                <button onClick={() => removeEntry(entry.id)} style={{ background:"none", border:"none", color:C.muted, fontSize:12, marginLeft:10, flexShrink:0 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && results.length === 0 && !loading && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted, fontSize:12, lineHeight:1.8 }}>
          Search for any food above.<br/>Type the amount too for accurate macros.<br/><span style={{ fontSize:10 }}>e.g. "150g chicken breast" or "2 roti"</span>
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsView({ logs, workoutLogs, foodLogs, nofapStreak, onBack }) {
  const [period, setPeriod] = useState("weekly");

  function getHabitData(range) {
    return range.map(d => ({
      date: d,
      label: new Date(d+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short"}),
      pct: Math.round((HABITS.filter(h => logs[d]?.[h.id]?.done).length / HABITS.length) * 100),
      done: HABITS.filter(h => logs[d]?.[h.id]?.done).length,
    }));
  }

  function getProteinData(range) {
    return range.map(d => {
      const entries = foodLogs[d] || [];
      const p = entries.reduce((a,e) => a+(e.protein||0), 0);
      return { date:d, label:new Date(d+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short"}), value:Math.round(p) };
    });
  }

  function getCalorieData(range) {
    return range.map(d => {
      const entries = foodLogs[d] || [];
      const c = entries.reduce((a,e) => a+(e.calories||0), 0);
      return { date:d, label:new Date(d+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short"}), value:Math.round(c) };
    });
  }

  function getWorkoutVolume(range) {
    return range.map(d => {
      const dayLog = workoutLogs[d] || {};
      const sets = Object.values(dayLog).reduce((a,ex) => a+(ex.sets?.length||0), 0);
      const vol = Object.values(dayLog).reduce((a,ex) => a+(ex.sets||[]).reduce((b,s) => b+(s.weight*s.reps),0), 0);
      return { date:d, label:new Date(d+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short"}), sets, volume:Math.round(vol) };
    });
  }

  function getCategoryConsistency(range) {
    return Object.keys(COLORS).map(cat => {
      const catH = HABITS.filter(h => h.category===cat);
      if (!catH.length) return null;
      let total=0, done=0;
      range.forEach(d => catH.forEach(h => { total++; if(logs[d]?.[h.id]?.done) done++; }));
      return { cat, pct:Math.round((done/total)*100) };
    }).filter(Boolean);
  }

  const ranges = {
    daily: [todayKey()],
    weekly: last7(),
    monthly: last30(),
    yearly: Array.from({length:12},(_,i) => { const d=new Date(); d.setMonth(d.getMonth()-11+i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }),
  };

  const range = period==="yearly" ? last30() : ranges[period] || last7();
  const habitData = getHabitData(range);
  const proteinData = getProteinData(range);
  const calorieData = getCalorieData(range);
  const workoutData = getWorkoutVolume(range);
  const catConsistency = getCategoryConsistency(range);

  // Aggregate for monthly/yearly display
  function aggData(data, n=7) {
    if (data.length <= n) return data;
    const step = Math.floor(data.length / n);
    return Array.from({length:n},(_,i) => {
      const chunk = data.slice(i*step, (i+1)*step);
      const avg = chunk.reduce((a,x) => a+(x.value||x.pct||0),0)/chunk.length;
      return { ...chunk[0], value:Math.round(avg), pct:Math.round(avg), label:chunk[0].label };
    });
  }

  const dispHabit = aggData(habitData.map(d=>({...d,value:d.pct})));
  const dispProtein = aggData(proteinData);
  const dispCalorie = aggData(calorieData);
  const dispWorkout = aggData(workoutData.map(d=>({...d,value:d.sets})));

  // Summary stats
  const avgCompletion = habitData.length ? Math.round(habitData.reduce((a,d)=>a+d.pct,0)/habitData.length) : 0;
  const avgProtein = proteinData.length ? Math.round(proteinData.reduce((a,d)=>a+d.value,0)/proteinData.length) : 0;
  const totalSets = workoutData.reduce((a,d)=>a+d.sets,0);
  const totalVolume = workoutData.reduce((a,d)=>a+d.volume,0);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Mono',monospace", maxWidth:480, margin:"0 auto", padding:"60px 20px 100px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.muted, fontSize:12 }}>← Back</button>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700 }}>Analytics</div>
      </div>

      {/* Period selector */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {["daily","weekly","monthly","yearly"].map(p => (
          <button key={p} className="press" onClick={() => setPeriod(p)} style={{ flex:1, background:period===p?C.skincare:C.surface, border:`1px solid ${period===p?C.skincare:C.border}`, borderRadius:7, padding:"7px 4px", color:period===p?"#000":C.muted, fontSize:10, textTransform:"capitalize" }}>
            {p}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.skincare}18`, borderRadius:10, padding:12, textAlign:"center" }}>
          <div style={{ fontSize:22, color:C.skincare, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{avgCompletion}%</div>
          <div style={{ fontSize:9, color:C.muted, marginTop:3 }}>Avg Completion</div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.diet}18`, borderRadius:10, padding:12, textAlign:"center" }}>
          <div style={{ fontSize:22, color:C.diet, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{avgProtein}g</div>
          <div style={{ fontSize:9, color:C.muted, marginTop:3 }}>Avg Protein/Day</div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.workout}18`, borderRadius:10, padding:12, textAlign:"center" }}>
          <div style={{ fontSize:22, color:C.workout, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{totalSets}</div>
          <div style={{ fontSize:9, color:C.muted, marginTop:3 }}>Total Sets</div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.nofap}18`, borderRadius:10, padding:12, textAlign:"center" }}>
          <div style={{ fontSize:22, color:C.nofap, fontFamily:"'Cormorant Garamond',serif", fontWeight:700 }}>{nofapStreak}d</div>
          <div style={{ fontSize:9, color:C.muted, marginTop:3 }}>NoFap Streak</div>
        </div>
      </div>

      {/* Habit completion chart */}
      <ChartCard title="Habit Completion" color={C.skincare} data={dispHabit} valueKey="value" unit="%" maxVal={100} />

      {/* Protein chart */}
      <ChartCard title="Daily Protein (g)" color={C.diet} data={dispProtein} valueKey="value" unit="g" maxVal={200} target={178} />

      {/* Calories chart */}
      <ChartCard title="Daily Calories" color={C.haircare} data={dispCalorie} valueKey="value" unit="" maxVal={4000} target={3030} />

      {/* Workout sets chart */}
      <ChartCard title="Workout Sets" color={C.workout} data={dispWorkout} valueKey="value" unit="" maxVal={30} />

      {/* Category consistency */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginTop:14 }}>
        <div style={{ fontSize:9, color:C.skincare, letterSpacing:3, textTransform:"uppercase", marginBottom:14 }}>Category Consistency</div>
        {catConsistency.map(({ cat, pct }) => (
          <div key={cat} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:11, color:"#888", textTransform:"capitalize" }}>{cat}</span>
              <span style={{ fontSize:11, color:COLORS[cat] }}>{pct}%</span>
            </div>
            <div style={{ background:C.faint, borderRadius:3, height:3 }}>
              <div style={{ width:`${pct}%`, height:"100%", background:COLORS[cat], borderRadius:3, transition:"width 0.8s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Best lifts */}
      <BestLifts workoutLogs={workoutLogs} />
    </div>
  );
}

function ChartCard({ title, color, data, valueKey, unit, maxVal, target }) {
  const max = Math.max(...data.map(d=>d[valueKey]||0), maxVal*0.1);
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:9, color, letterSpacing:3, textTransform:"uppercase" }}>{title}</div>
        {target && <div style={{ fontSize:9, color:C.muted }}>Target: {target}{unit}</div>}
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:70 }}>
        {data.map((d,i) => {
          const val = d[valueKey]||0;
          const h = Math.max(3, (val/Math.max(max,1))*60);
          const isAbove = target && val >= target;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ fontSize:8, color:val>0?color:C.muted }}>{val>0?`${val}${unit}`:""}</div>
              <div style={{ width:"100%", background:isAbove?`${C.haircare}80`:`${color}${Math.max(30,Math.round(30+(val/Math.max(max,1))*80)).toString(16)}`, borderRadius:"3px 3px 0 0", height:`${h}px`, transition:"height 0.5s ease" }} />
              <div style={{ fontSize:8, color:C.muted }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BestLifts({ workoutLogs }) {
  const [selected, setSelected] = useState(null);
  const [period, setPeriod] = useState("weekly");

  const allExercises = [...new Set(Object.values(workoutLogs).flatMap(d => Object.keys(d)))];

  function getExerciseHistory(exName) {
    return Object.entries(workoutLogs)
      .filter(([_, d]) => d[exName]?.sets?.length > 0)
      .map(([date, d]) => {
        const sets = d[exName].sets;
        const maxWeight = Math.max(...sets.map(s => s.weight || 0));
        const volume = sets.reduce((a, s) => a + ((s.weight || 0) * (s.reps || 0)), 0);
        return { date, maxWeight, volume, sets: sets.length };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function getPeriodData(history) {
    if (period === "weekly") return history.slice(-7);
    if (period === "monthly") return history.slice(-30);
    return history;
  }

  function getWeekComparison(exName) {
    const history = getExerciseHistory(exName);
    const thisWeek = history.filter(h => h.date >= dateKey(-7));
    const lastWeek = history.filter(h => h.date >= dateKey(-14) && h.date < dateKey(-7));
    const thisMax = thisWeek.length ? Math.max(...thisWeek.map(h => h.maxWeight)) : 0;
    const lastMax = lastWeek.length ? Math.max(...lastWeek.map(h => h.maxWeight)) : 0;
    return { thisMax, lastMax, diff: thisMax - lastMax };
  }

  const bests = {};
  Object.values(workoutLogs).forEach(dayLog => {
    Object.entries(dayLog).forEach(([exName, exData]) => {
      (exData.sets || []).forEach(s => {
        if (!bests[exName] || s.weight > bests[exName].weight) bests[exName] = s;
      });
    });
  });

  const entries = Object.entries(bests).sort((a, b) => b[1].weight - a[1].weight);
  if (!entries.length) return null;

  const selectedHistory = selected ? getPeriodData(getExerciseHistory(selected)) : [];
  const maxVol = selectedHistory.length ? Math.max(...selectedHistory.map(h => h.volume), 1) : 1;
  const maxWt = selectedHistory.length ? Math.max(...selectedHistory.map(h => h.maxWeight), 1) : 1;

  return (
    <div style={{ marginTop: 14 }}>
      {/* Period selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["weekly", "monthly", "yearly"].map(p => (
          <button key={p} className="press" onClick={() => setPeriod(p)} style={{ flex: 1, background: period === p ? C.workout : C.surface, border: `1px solid ${period === p ? C.workout : C.border}`, borderRadius: 7, padding: "7px 4px", color: period === p ? "#000" : C.muted, fontSize: 10, textTransform: "capitalize", fontFamily: "inherit" }}>
            {p}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: C.workout, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>Personal Bests — Tap to see progress</div>
        {entries.map(([name, set], i) => {
          const comp = getWeekComparison(name);
          const isSelected = selected === name;
          return (
            <div key={name}>
              <div className="press" onClick={() => setSelected(isSelected ? null : name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < entries.length - 1 ? `1px solid ${C.border}` : "none", background: isSelected ? `${C.workout}08` : "transparent" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#AAA" }}>{name}</div>
                  {comp.diff !== 0 && (
                    <div style={{ fontSize: 10, color: comp.diff > 0 ? C.haircare : C.nofap, marginTop: 2 }}>
                      {comp.diff > 0 ? "↑" : "↓"} {Math.abs(comp.diff)}kg vs last week
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: C.workout }}>{set.weight}kg × {set.reps}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>all time best</div>
                </div>
              </div>

              {/* Expanded chart */}
              {isSelected && selectedHistory.length > 0 && (
                <div style={{ padding: "12px 0 8px" }}>
                  {/* Max weight chart */}
                  <div style={{ fontSize: 9, color: C.workout, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Max Weight (kg)</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, marginBottom: 14 }}>
                    {selectedHistory.map((h, idx) => (
                      <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{ fontSize: 8, color: C.workout }}>{h.maxWeight > 0 ? h.maxWeight : ""}</div>
                        <div style={{ width: "100%", background: `${C.workout}70`, borderRadius: "3px 3px 0 0", height: `${Math.max(3, (h.maxWeight / maxWt) * 50)}px`, transition: "height 0.5s ease" }} />
                        <div style={{ fontSize: 7, color: C.muted }}>{new Date(h.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      </div>
                    ))}
                  </div>

                  {/* Volume chart */}
                  <div style={{ fontSize: 9, color: C.skincare, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>Volume (kg × reps)</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60, marginBottom: 8 }}>
                    {selectedHistory.map((h, idx) => (
                      <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{ fontSize: 8, color: C.skincare }}>{h.volume > 0 ? h.volume : ""}</div>
                        <div style={{ width: "100%", background: `${C.skincare}70`, borderRadius: "3px 3px 0 0", height: `${Math.max(3, (h.volume / maxVol) * 50)}px`, transition: "height 0.5s ease" }} />
                        <div style={{ fontSize: 7, color: C.muted }}>{new Date(h.date + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      </div>
                    ))}
                  </div>

                  {/* Week summary */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 8 }}>
                    {[
                      ["This Week Max", `${comp.thisMax}kg`, C.workout],
                      ["Last Week Max", `${comp.lastMax}kg`, C.muted],
                      ["Progress", `${comp.diff >= 0 ? "+" : ""}${comp.diff}kg`, comp.diff > 0 ? C.haircare : comp.diff < 0 ? C.nofap : C.muted]
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ background: C.faint, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 13, color, fontFamily: "'Cormorant Garamond',serif", fontWeight: 700 }}>{val}</div>
                        <div style={{ fontSize: 8, color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{label}</div>
                      </div>
                    ))}
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

// ─── HABITS VIEW ──────────────────────────────────────────────────────────────
function HabitsView({ todayLogs, toggleHabit, setQty, getStreak }) {
  const done = HABITS.filter(h => todayLogs[h.id]?.done).length;
  const categories = [...new Set(HABITS.map(h => h.category))];
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:10, color:C.muted, letterSpacing:3, textTransform:"uppercase" }}>Today</div>
        <div style={{ fontSize:12, color:C.skincare }}>{done}/{HABITS.length}</div>
      </div>
      {categories.map(cat => {
        const catH = HABITS.filter(h => h.category===cat);
        return (
          <div key={cat} style={{ marginBottom:14 }}>
            <div style={{ fontSize:9, color:COLORS[cat], letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>{cat}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {catH.map(h => {
                const log = todayLogs[h.id]||{};
                const streak = getStreak(h.id);
                return (
                  <div key={h.id} style={{ background:log.done?`${COLORS[h.category]}0E`:C.surface, border:`1px solid ${log.done?COLORS[h.category]+"35":C.border}`, borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }} onClick={() => h.type==="binary"&&toggleHabit(h.id)}>
                    <button onClick={e=>{e.stopPropagation();toggleHabit(h.id);}} style={{ width:24, height:24, borderRadius:6, background:log.done?COLORS[h.category]:"transparent", border:`2px solid ${log.done?COLORS[h.category]:C.muted}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {log.done&&<span style={{ color:"#000", fontSize:11, fontWeight:700 }}>✓</span>}
                    </button>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:log.done?C.text:"#666" }}>{h.label}</div>
                      {streak>0&&<div style={{ fontSize:10, color:COLORS[h.category], marginTop:2, opacity:0.7 }}>{streak}d streak</div>}
                    </div>
                    {h.type==="quantitative"&&(
                      <div style={{ display:"flex", alignItems:"center", gap:5 }} onClick={e=>e.stopPropagation()}>
                        <input type="number" min={0} step={0.5} value={log.value||""} placeholder={`/${h.target}`} onChange={e=>setQty(h.id,e.target.value)} style={{ width:60, padding:"5px 8px", fontSize:12 }} />
                        <span style={{ fontSize:10, color:C.muted }}>{h.unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ROUTINES VIEW (condensed, same as v2) ────────────────────────────────────
function RoutinesView({ selected, setSelected, nofapStreak, setNofapStart }) {
  const routineList = [
    { id:"workout", label:"Workout", icon:"◆", color:C.workout, meta:"6 days/week · Arms focused" },
    { id:"skincare", label:"Skincare", icon:"✦", color:C.skincare, meta:"AM + PM · 4 steps" },
    { id:"diet", label:"Diet", icon:"◉", color:C.diet, meta:"6 meals · ~3030 kcal · ~178g protein" },
    { id:"nofap", label:"NoFap", icon:"⬡", color:C.nofap, meta:"Full celibacy · Streak + Protocol" },
    { id:"haircare", label:"Hair Care", icon:"◈", color:C.haircare, meta:"Wash days + Daily + Weekly" },
  ];

  if (!selected) return (
    <div>
      <div style={{ fontSize:10, color:C.muted, letterSpacing:3, textTransform:"uppercase", marginBottom:14 }}>All Plans</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {routineList.map(r => (
          <button key={r.id} className="press" onClick={() => setSelected(r.id)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16, display:"flex", alignItems:"center", gap:14, color:C.text, textAlign:"left" }}>
            <span style={{ color:r.color, fontSize:20, width:24 }}>{r.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>{r.label}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{r.meta}</div>
            </div>
            <span style={{ color:C.muted, fontSize:14 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:C.muted, fontSize:11, marginBottom:20, letterSpacing:1 }}>← Back</button>
      <RoutineDetail id={selected} nofapStreak={nofapStreak} setNofapStart={setNofapStart} />
    </div>
  );
}

function RoutineDetail({ id, nofapStreak, setNofapStart }) {
  if (id === "workout") return <WorkoutPlan />;
  if (id === "skincare") return <SkincarePlan />;
  if (id === "diet") return <DietPlan />;
  if (id === "nofap") return <NofapPlan nofapStreak={nofapStreak} setNofapStart={setNofapStart} />;
  if (id === "haircare") return <HaircarePlan />;
  return null;
}

function WorkoutPlan() {
  const todayIdx = new Date().getDay()===0?6:new Date().getDay()-1;
  const [active, setActive] = useState(todayIdx);
  const d = WORKOUT_DAYS[active];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:C.faint, border:`1px solid ${C.workout}20`, borderRadius:10, padding:"10px 12px", fontSize:11, color:C.workout, lineHeight:1.5 }}>
        Daily Medial Delt Activation (Days 1–6): Cable Lateral Raises — 2×15-20, light, strict form.
      </div>
      <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:4 }}>
        {WORKOUT_DAYS.map((day,i) => (
          <button key={i} className="press" onClick={() => setActive(i)} style={{ background:active===i?C.workout:C.surface, border:`1px solid ${active===i?C.workout:C.border}`, borderRadius:7, padding:"6px 10px", color:active===i?"#000":C.muted, fontSize:10, whiteSpace:"nowrap" }}>
            {day.day.replace("Day ","D")}
          </button>
        ))}
      </div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
        <div style={{ fontSize:13, color:C.workout, marginBottom:12 }}>{d.focus}</div>
        {d.sections.length===0 ? <div style={{ fontSize:12, color:C.muted }}>Rest. Recover.</div> : d.sections.map((sec,si) => (
          <div key={si} style={{ marginBottom:14 }}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>{sec.title}</div>
            {sec.exercises.map((ex,ei) => (
              <div key={ei} style={{ fontSize:12, color:"#CCC", padding:"7px 0", borderBottom:ei<sec.exercises.length-1?`1px solid ${C.border}`:"none" }}>{ex}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkincarePlan() {
  const am = [
    {step:1,task:"Ponds Charcoal Face Wash",note:"Lukewarm water. Gentle circular motions."},
    {step:2,task:"Lightweight Moisturizer",note:"Neutrogena Oil-Free or Dot & Key. Apply while face is slightly damp."},
    {step:3,task:"Joy Hello Sun SPF 50",note:"NON-NEGOTIABLE. 2 finger lengths every morning."},
    {step:4,task:"Vaseline on lips",note:"Thin layer."},
  ];
  const pm = [
    {step:1,task:"Ponds Charcoal Face Wash",note:"Removes sunscreen, pollution, oil buildup."},
    {step:2,task:"Minimalist 10% Niacinamide",note:"2–3 drops, press gently. Your dark mark treatment."},
    {step:3,task:"Lightweight Moisturizer",note:"Slightly more generous than morning."},
    {step:4,task:"Vaseline on lips",note:"Thicker layer — overnight repair."},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {[{title:"Morning",steps:am},{title:"Night",steps:pm}].map(({title,steps}) => (
        <div key={title} style={{ background:C.surface, border:`1px solid ${C.skincare}18`, borderRadius:12, padding:14 }}>
          <div style={{ fontSize:9, color:C.skincare, letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>{title}</div>
          {steps.map((s,i) => (
            <div key={i} style={{ padding:"9px 0", borderBottom:i<steps.length-1?`1px solid ${C.border}`:"none" }}>
              <div style={{ display:"flex", gap:8 }}>
                <span style={{ color:C.skincare, fontSize:11, flexShrink:0 }}>{s.step}.</span>
                <div>
                  <div style={{ fontSize:12 }}>{s.task}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2, lineHeight:1.4 }}>{s.note}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      <div style={{ background:C.faint, border:`1px solid ${C.skincare}15`, borderRadius:12, padding:14 }}>
        <div style={{ fontSize:9, color:C.skincare, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>To Buy</div>
        {[["Lightweight Moisturizer","~₹300–400"],["Minimalist 10% Niacinamide","~₹300"]].map(([item,price]) => (
          <div key={item} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}`, fontSize:12 }}>
            <span style={{ color:C.text }}>{item}</span><span style={{ color:C.skincare }}>{price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DietPlan() {
  const meals = [
    {time:"9:30 AM",label:"Meal 1",items:["2 peanut butter sandwiches","4 whole eggs","1 glass whole milk","10 almonds","Vitamin D3 + Multivitamin"],macros:"~40g P · ~700 kcal"},
    {time:"1:00 PM",label:"Meal 2",items:["50g soya chunks (dry)","1.5 cups cooked rice","1 glass buttermilk"],macros:"~30g P · ~500 kcal"},
    {time:"3:00 PM",label:"Meal 3",items:["1 banana","2 tbsp peanut butter OR peanuts"],macros:"~8g P · ~280 kcal"},
    {time:"5:30 PM",label:"Meal 4 (Post-Workout)",items:["1 scoop whey","1 cup oats","1 banana","1 tbsp peanut butter","1 glass milk","Creatine 5g"],macros:"~50g P · ~650 kcal"},
    {time:"8:30 PM",label:"Meal 5",items:["150g chicken OR paneer","1.5 cups rice OR 2 roti","Spinach / mixed veg","1 glass buttermilk","Ashwagandha here"],macros:"~40g P · ~650 kcal"},
    {time:"10:30 PM",label:"Meal 6",items:["1 glass warm milk","1 tbsp peanut butter"],macros:"~10g P · ~250 kcal"},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ background:`${C.diet}12`, border:`1px solid ${C.diet}30`, borderRadius:10, padding:"11px 14px", fontSize:12, color:C.diet }}>~3030 kcal/day · ~178g protein/day</div>
      {meals.map((m,i) => (
        <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:13, color:C.diet }}>{m.label}</span>
            <span style={{ fontSize:10, color:C.muted }}>{m.time}</span>
          </div>
          {m.items.map((item,j) => (
            <div key={j} style={{ fontSize:12, color:"#888", padding:"3px 0", borderBottom:j<m.items.length-1?`1px solid ${C.border}`:"none" }}>· {item}</div>
          ))}
          <div style={{ fontSize:10, color:C.muted, marginTop:8 }}>{m.macros}</div>
        </div>
      ))}
    </div>
  );
}

function NofapPlan({ nofapStreak, setNofapStart }) {
  const milestones = [3,7,14,21,30,60,90,180,365];
  const next = milestones.find(m=>m>nofapStreak)||365;
  const pct = Math.min(100,(nofapStreak/next)*100);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:`${C.nofap}10`, border:`1px solid ${C.nofap}25`, borderRadius:14, padding:20, textAlign:"center" }}>
        <div style={{ fontSize:56, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:C.nofap, lineHeight:1 }}>{nofapStreak}</div>
        <div style={{ fontSize:10, color:`${C.nofap}80`, letterSpacing:3, marginTop:4 }}>DAYS CLEAN</div>
        <div style={{ margin:"14px 0 6px", background:C.faint, borderRadius:4, height:4 }}>
          <div style={{ width:`${pct}%`, height:"100%", background:C.nofap, borderRadius:4 }} />
        </div>
        <div style={{ fontSize:10, color:C.muted }}>Next milestone: {next} days</div>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {milestones.map(m => (
          <div key={m} style={{ padding:"5px 10px", borderRadius:6, fontSize:11, background:nofapStreak>=m?`${C.nofap}18`:C.surface, border:`1px solid ${nofapStreak>=m?C.nofap+"50":C.border}`, color:nofapStreak>=m?C.nofap:C.muted }}>
            {m}d{nofapStreak>=m?" ✓":""}
          </div>
        ))}
      </div>
      <button onClick={() => { if(window.confirm("Reset streak to today?")) setNofapStart(todayKey()); }} style={{ background:"none", border:`1px solid ${C.nofap}25`, borderRadius:8, color:`${C.nofap}50`, padding:10, fontSize:10, letterSpacing:1, textTransform:"uppercase" }}>Reset Streak</button>
    </div>
  );
}

function HaircarePlan() {
  const washDay = [
    {step:1,task:"Pre-wash oil (1–2 hrs before)",note:"Coconut oil + 5–6 drops rosemary. Massage 5–7 mins. Work through lengths."},
    {step:2,task:"Shampoo",note:"Scalp only. Rinse thoroughly."},
    {step:3,task:"Conditioner",note:"Mid-lengths to ends only. 2–3 mins. Cold water final rinse."},
    {step:4,task:"Dry + Style",note:"Squeeze with t-shirt. Air dry to 60%. Apply serum. Comb into slickback. Air dry."},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.haircare}18`, borderRadius:12, padding:14 }}>
        <div style={{ fontSize:9, color:C.haircare, letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>Wash Day (2–3x/week)</div>
        {washDay.map((s,i) => (
          <div key={i} style={{ padding:"9px 0", borderBottom:i<washDay.length-1?`1px solid ${C.border}`:"none" }}>
            <div style={{ display:"flex", gap:8 }}>
              <span style={{ color:C.haircare, fontSize:11, flexShrink:0 }}>{s.step}.</span>
              <div>
                <div style={{ fontSize:12 }}>{s.task}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2, lineHeight:1.4 }}>{s.note}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
        <div style={{ fontSize:9, color:C.haircare, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>Daily</div>
        {["Spray water on palms if frizzy, scrunch through","1–2 drops serum on ends if needed","Scalp massage 3–5 mins — no oil needed"].map((t,i) => (
          <div key={i} style={{ fontSize:12, color:"#888", padding:"5px 0", borderBottom:i<2?`1px solid ${C.border}`:"none" }}>· {t}</div>
        ))}
      </div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:14 }}>
        <div style={{ fontSize:9, color:C.haircare, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>Weekly</div>
        {["Replace coconut oil with castor oil once a week — reduces breakage","Onion juice on scalp 30 mins before wash (optional — hairline maintenance)"].map((t,i) => (
          <div key={i} style={{ fontSize:12, color:"#888", padding:"5px 0", borderBottom:i<1?`1px solid ${C.border}`:"none" }}>· {t}</div>
        ))}
      </div>
    </div>
  );
}

// ─── SHARED ───────────────────────────────────────────────────────────────────
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
