"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const API_URL = "/api/ai";
const MODEL = "claude-sonnet-4-20250514";
const FREE_LIMIT = 15;
const PLATFORMS = ["Instagram","TikTok","YouTube","LinkedIn","X (Twitter)","Facebook","Pinterest","Redbook (小红书)","Douyin (抖音)","WeChat","Lemon8","Threads"];
const GOALS = ["Grow my audience","Build my personal brand","Promote my business","Share my passion / hobby","Educate people","Generate leads or sales","Network professionally","Just stay relevant online"];
const VIBES = ["Professional & polished","Casual & friendly","Bold & edgy","Inspirational","Funny & entertaining","Educational & informative"];
const PILLAR_COLORS = ["#4ecdc4","#f4845f","#c77dff","#e07bb5","#7ed957","#f9c74f"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const WEEKS = [1,2,3,4];
const BRAND = { bg:"#f0f0f0", white:"#ffffff", black:"#111111", rainbow:"linear-gradient(90deg,#4ecdc4,#7ed957,#f9c74f,#f4845f,#e07bb5,#c77dff)", border:"#d8d8d8", muted:"#888" };

function gradText(g) { return { background:g, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }; }
async function callAI(messages, system) {
  const res = await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:MODEL, max_tokens:1200, system:system||"", messages}) });
  const d = await res.json();
  return d?.content?.[0]?.text || "";
}
function parseJSON(txt) { try { return JSON.parse(txt.replace(/```json|```/g,"").trim()); } catch(e) { return null; } }

function EditableBlock(props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(props.text);
  const [fb, setFb] = useState("");
  const [showFb, setShowFb] = useState(false);
  const darkBtn = { background:BRAND.black, color:BRAND.white, border:"none", padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer" };
  const lightBtn = { background:"transparent", color:BRAND.black, border:`1px solid ${BRAND.border}`, padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer" };
  const inputStyle = { width:"100%", padding:"13px 16px", border:`1.5px solid ${BRAND.border}`, fontSize:14, outline:"none", boxSizing:"border-box", background:BRAND.white, fontFamily:"inherit" };
  return (
    <div style={{ marginBottom:12, padding:16, background:"#f9f9f9", border:`1px solid ${BRAND.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>{props.label}</div>
      {editing ? (
        <div>
          <textarea style={{ ...inputStyle, height:100, resize:"vertical" }} value={val} onChange={function(e){ setVal(e.target.value); }} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button style={darkBtn} onClick={function(){ props.onSave(val); setEditing(false); }}>Save</button>
            <button style={lightBtn} onClick={function(){ setVal(props.text); setEditing(false); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{val}</div>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button style={lightBtn} onClick={function(){ setEditing(true); }}>Edit</button>
            <button style={lightBtn} onClick={function(){ setShowFb(!showFb); }}>AI Feedback</button>
          </div>
        </div>
      )}
      {showFb && !editing && (
        <div style={{ marginTop:12 }}>
          <input style={{ ...inputStyle, marginBottom:8 }} placeholder="Tell AI what to improve..." value={fb} onChange={function(e){ setFb(e.target.value); }} />
          <button style={darkBtn} onClick={async function(){
            if (!fb.trim()) return;
            try {
              const res = await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:MODEL, max_tokens:500, messages:[{role:"user", content:"Original: \""+val+"\"\nFeedback: \""+fb+"\"\nRewrite based on feedback. Return only the rewritten text."}]}) });
              const data = await res.json();
              const t = data?.content?.[0]?.text?.trim();
              if (t) { setVal(t); props.onSave(t); }
            } catch(e) {}
            setFb(""); setShowFb(false);
          }}>Rewrite with AI</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [screen, setScreen] = useState("onboarding");
  const [obStep, setObStep] = useState(0);
  const [profile, setProfile] = useState({ name:"", job:"", brand:"", platforms:[], goals:[], vibe:"", activePlatforms:[] });
  const [pack, setPack] = useState(null);
  const [monthPlans, setMonthPlans] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [ideaCount, setIdeaCount] = useState(10);
  const [picked, setPicked] = useState([]);
  const [shoots, setShoots] = useState({});
  const [hooks, setHooks] = useState({});
  const [slots, setSlots] = useState({});
  const [stats, setStats] = useState({ posted:0, streak:0 });
  const [chat, setChat] = useState([]);
  const [savedChats, setSavedChats] = useState([]);
  const [nav, setNav] = useState(0);
  const [loading, setLoading] = useState("");
  const [gens, setGens] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [billing, setBilling] = useState("monthly");
  const [chatInput, setChatInput] = useState("");
  const [monthInput, setMonthInput] = useState("");
  const [curMonth, setCurMonth] = useState(0);
  const [dragItem, setDragItem] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [dragPos, setDragPos] = useState({ x:0, y:0 });
  const chatRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      var session = res.data.session;
      setUser(session ? session.user : null);
      setAuthLoading(false);
      if (session && session.user) loadUserData(session.user.id);
    });
    var sub = supabase.auth.onAuthStateChange(function(_e, session) {
      setUser(session ? session.user : null);
      if (session && session.user) loadUserData(session.user.id);
    });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  async function loadUserData(userId) {
    try {
      var res = await fetch("/api/user/load", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:userId }) });
      var json = await res.json();
      var d = json.data;
      if (!d) return;
      if (d.profile) setProfile(d.profile);
      if (d.pack) { setPack(d.pack); setScreen("app"); }
      if (d.month_plans) setMonthPlans(d.month_plans);
      if (d.ideas) setIdeas(d.ideas);
      if (d.picked) setPicked(d.picked);
      if (d.shoots) setShoots(d.shoots);
      if (d.hooks) setHooks(d.hooks);
      if (d.slots) setSlots(d.slots);
      if (d.stats) setStats(d.stats);
      if (d.saved_chats) setSavedChats(d.saved_chats);
      if (d.gens) setGens(d.gens);
      if (d.is_pro) setIsPro(d.is_pro);
    } catch(e) {}
  }

  async function saveUserData(updates) {
    if (!user) return;
    var mapped = {};
    if (updates.profile !== undefined) mapped.profile = updates.profile;
    if (updates.pack !== undefined) mapped.pack = updates.pack;
    if (updates.monthPlans !== undefined) mapped.month_plans = updates.monthPlans;
    if (updates.ideas !== undefined) mapped.ideas = updates.ideas;
    if (updates.picked !== undefined) mapped.picked = updates.picked;
    if (updates.shoots !== undefined) mapped.shoots = updates.shoots;
    if (updates.hooks !== undefined) mapped.hooks = updates.hooks;
    if (updates.slots !== undefined) mapped.slots = updates.slots;
    if (updates.stats !== undefined) mapped.stats = updates.stats;
    if (updates.savedChats !== undefined) mapped.saved_chats = updates.savedChats;
    if (updates.gens !== undefined) mapped.gens = updates.gens;
    if (updates.isPro !== undefined) mapped.is_pro = updates.isPro;
    try {
      await fetch("/api/user/save", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:user.id, data:mapped }) });
    } catch(e) {}
  }

  async function handleEmailAuth() {
    setAuthSubmitting(true); setAuthError("");
    try {
      if (authMode === "signup") {
        var r1 = await supabase.auth.signUp({ email:authEmail, password:authPassword });
        if (r1.error) throw r1.error;
        if (r1.data.user) { setUser(r1.data.user); setShowAuth(false); await generateStrategy(r1.data.user); }
      } else {
        var r2 = await supabase.auth.signInWithPassword({ email:authEmail, password:authPassword });
        if (r2.error) throw r2.error;
        setUser(r2.data.user); setShowAuth(false);
        await loadUserData(r2.data.user.id); setScreen("app");
      }
    } catch(e) { setAuthError(e.message || "Something went wrong"); }
    setAuthSubmitting(false);
  }

  async function handleGoogleAuth() {
    await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo:window.location.origin } });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null); setPack(null); setScreen("onboarding");
    setProfile({ name:"", job:"", brand:"", platforms:[], goals:[], vibe:"", activePlatforms:[] });
    setObStep(0); setNav(0);
  }

  function canGen() { return isPro || gens < FREE_LIMIT; }
  function useGen(updates) {
    if (!canGen()) return false;
    var n = gens + 1; setGens(n);
    saveUserData(Object.assign({}, updates || {}, { gens:n }));
    return true;
  }

  var activePlatforms = isPro ? profile.platforms : (profile.activePlatforms && profile.activePlatforms.length > 0 ? profile.activePlatforms : profile.platforms.slice(0,3));

  function pillarColor(name) {
    var i = pack && pack.pillars ? pack.pillars.findIndex(function(p){ return p.name === name; }) : -1;
    return PILLAR_COLORS[i >= 0 ? i : 0];
  }

  var inputStyle = { width:"100%", padding:"13px 16px", border:`1.5px solid ${BRAND.border}`, fontSize:15, outline:"none", boxSizing:"border-box", background:BRAND.white, fontFamily:"inherit" };
  var darkBtn = { background:BRAND.black, color:BRAND.white, border:`1.5px solid ${BRAND.black}`, padding:"13px 28px", fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:0.5, textTransform:"uppercase" };
  var outlineBtn = { background:"transparent", border:`1.5px solid ${BRAND.black}`, color:BRAND.black, padding:"10px 22px", fontWeight:700, fontSize:13, cursor:"pointer" };
  var rainbowBtn = { background:BRAND.rainbow, color:BRAND.white, border:"none", padding:"13px 28px", fontWeight:700, fontSize:14, cursor:"pointer" };
  function smBtn(on) { return { background:on?BRAND.black:BRAND.bg, color:on?BRAND.white:BRAND.muted, border:`1px solid ${on?BRAND.black:BRAND.border}`, padding:"8px 14px", fontWeight:600, fontSize:12, cursor:"pointer" }; }
  function tagStyle(on) { return { display:"inline-block", padding:"7px 16px", border:`1.5px solid ${on?BRAND.black:BRAND.border}`, margin:"3px", cursor:"pointer", fontWeight:600, fontSize:12, background:on?BRAND.black:BRAND.white, color:on?BRAND.white:BRAND.black }; }
  function navItemStyle(a, lk) { return { padding:"13px 18px", fontWeight:a?700:500, fontSize:12, cursor:lk?"not-allowed":"pointer", color:lk?BRAND.border:a?BRAND.black:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", whiteSpace:"nowrap", background:"transparent", border:"none", borderBottom:a?`3px solid ${BRAND.black}`:"3px solid transparent" }; }
  var cardStyle = { background:BRAND.white, padding:28, border:`1px solid ${BRAND.border}`, marginBottom:16 };
  var divider = { borderTop:`1px solid ${BRAND.border}`, margin:"20px 0" };
  var labelStyle = { fontSize:11, fontWeight:700, letterSpacing:1, color:BRAND.muted, textTransform:"uppercase", marginBottom:6, display:"block" };

  async function generateStrategy(currentUser) {
    var u = currentUser || user;
    if (!canGen()) { setScreen("upgrade"); return; }
    setLoading("strategy"); setScreen("app");
    try {
      var prompt = "Strategy for: Name:"+profile.name+", Job:"+profile.job+", Brand:"+profile.brand+", Platforms:"+profile.platforms.join(",")+", Goals:"+profile.goals.join(",")+", Vibe:"+profile.vibe+". Return JSON only: {\"angle\":\"2 sentence unique angle\",\"voice\":\"voice description\",\"pillars\":[{\"name\":\"...\",\"emoji\":\"...\",\"description\":\"...\"}]}";
      var txt = await callAI([{role:"user",content:prompt}], "Return JSON only, no markdown.");
      var data = parseJSON(txt);
      if (data) {
        var ap = profile.platforms.slice(0,3);
        var np = Object.assign({}, profile, { activePlatforms:ap });
        setPack(data); setProfile(np);
        if (u) {
          var n = gens+1; setGens(n);
          await fetch("/api/user/save", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:u.id, data:{ pack:data, profile:np, gens:n } }) });
        }
      }
    } catch(e) { setPack({ angle:"Could not generate — check your API key.", voice:"", pillars:[] }); }
    setLoading(""); setNav(0);
  }

  async function genMonthPlan(idx) {
    if (!canGen()) { setScreen("upgrade"); return; }
    setLoading("month"+idx);
    try {
      var focus = monthInput || "growth";
      var pillars = pack && pack.pillars ? pack.pillars.map(function(p){ return p.name; }).join(",") : "";
      var txt = await callAI([{role:"user",content:"Month "+(idx+1)+" plan for "+profile.name+"("+profile.job+"). Pillars:"+pillars+". Focus:"+focus+". Return JSON:{\"focus\":\"theme\",\"weeklyThemes\":[\"w1\",\"w2\",\"w3\",\"w4\"],\"tip\":\"tip\"}"}], "Return JSON only.");
      var data = parseJSON(txt);
      if (data) {
        var u = monthPlans.slice(); u[idx] = Object.assign({}, data, { userInput:focus });
        setMonthPlans(u); useGen({ monthPlans:u });
      }
    } catch(e) {}
    setLoading(""); setMonthInput("");
  }

  async function genIdeas() {
    if (!canGen()) { setScreen("upgrade"); return; }
    setLoading("ideas");
    try {
      var pillars = pack && pack.pillars ? pack.pillars.map(function(p){ return p.name; }).join(",") : "";
      var focus = monthPlans[curMonth] ? monthPlans[curMonth].focus : "growth";
      var txt = await callAI([{role:"user",content:"Generate "+ideaCount+" content ideas for "+profile.name+"("+profile.job+"). Pillars:"+pillars+". Focus:"+focus+". Platforms:"+activePlatforms.join(",")+". Return JSON array:[{\"title\":\"...\",\"pillar\":\"...\",\"platform\":\"...\",\"hook\":\"...\",\"format\":\"Reel|Carousel|Video|Post|Story\"}]"}], "Return JSON only.");
      var data = parseJSON(txt);
      if (data) { setIdeas(data); useGen({ ideas:data }); }
    } catch(e) {}
    setLoading("");
  }

  async function genShoot(idea) {
    if (!canGen()) { setScreen("upgrade"); return; }
    setLoading("shoot_"+idea.title);
    try {
      var txt = await callAI([{role:"user",content:"Shoot plan for: \""+idea.title+"\" ("+idea.format+") on "+idea.platform+". Creator: "+profile.name+", "+profile.job+". Vibe: "+profile.vibe+". Return ONLY this JSON: {\"script\":\"full script here\",\"shotList\":[\"shot 1\",\"shot 2\"],\"repurpose\":[\"idea 1\",\"idea 2\"]}"}], "Return only valid JSON. No markdown.");
      var data = parseJSON(txt);
      var entry = (data && data.script) ? data : { script: txt || "Try again.", shotList:[], repurpose:[] };
      var u = Object.assign({}, shoots); u[idea.title] = entry;
      setShoots(u); useGen({ shoots:u });
    } catch(e) {
      var u2 = Object.assign({}, shoots); u2[idea.title] = { script:"Error — try again.", shotList:[], repurpose:[] };
      setShoots(u2);
    }
    setLoading("");
  }

  async function genHooks(idea) {
    if (!canGen()) { setScreen("upgrade"); return; }
    setLoading("hooks_"+idea.title);
    try {
      var txt = await callAI([{role:"user",content:"Hooks and captions for: \""+idea.title+"\" on "+idea.platform+". Creator: "+profile.name+"("+profile.job+"). Vibe: "+profile.vibe+". Return JSON: {\"hooks\":[{\"type\":\"Question\",\"text\":\"...\"},{\"type\":\"Bold Statement\",\"text\":\"...\"},{\"type\":\"Storytelling\",\"text\":\"...\"},{\"type\":\"Curiosity\",\"text\":\"...\"},{\"type\":\"Controversial\",\"text\":\"...\"}],\"captions\":[{\"platform\":\""+idea.platform+"\",\"text\":\"...\",\"cta\":\"...\"}]}"}], "Return valid JSON only.");
      var data = parseJSON(txt);
      if (data) {
        var u = Object.assign({}, hooks); u[idea.title] = data;
        setHooks(u); useGen({ hooks:u });
      } else {
        var u2 = Object.assign({}, hooks); u2[idea.title] = { hooks:[{type:"Error",text:"Failed — retry"}], captions:[] };
        setHooks(u2);
      }
    } catch(e) {
      var u3 = Object.assign({}, hooks); u3[idea.title] = { hooks:[{type:"Error",text:"Failed — retry"}], captions:[] };
      setHooks(u3);
    }
    setLoading("");
  }

  async function sendChat() {
    if (!chatInput.trim() || !canGen()) { if (!canGen()) setScreen("upgrade"); return; }
    var um = { role:"user", content:chatInput };
    var nm = chat.concat([um]); setChat(nm); setChatInput(""); setLoading("chat");
    try {
      var pillars = pack && pack.pillars ? pack.pillars.map(function(p){ return p.name; }).join(",") : "";
      var txt = await callAI(nm, "You are a content strategy advisor for "+profile.name+"("+profile.job+"). Angle: "+(pack?pack.angle:"")+". Pillars: "+pillars+". Be specific and actionable.");
      var fm = nm.concat([{role:"assistant",content:txt}]); setChat(fm); useGen({ chat:fm });
    } catch(e) {}
    setLoading("");
    setTimeout(function(){ if (chatRef.current) chatRef.current.scrollTop = 9999; }, 100);
  }

  function startDrag(e, item, fromSlot) {
    e.preventDefault();
    var pos = e.touches ? { x:e.touches[0].clientX, y:e.touches[0].clientY } : { x:e.clientX, y:e.clientY };
    setDragItem({ item:item, fromSlot:fromSlot }); setDragPos(pos); dragRef.current = { item:item, fromSlot:fromSlot };
    function onMove(ev) {
      var p = ev.touches ? { x:ev.touches[0].clientX, y:ev.touches[0].clientY } : { x:ev.clientX, y:ev.clientY };
      setDragPos(p);
      var el = document.elementFromPoint(p.x, p.y);
      var slot = el && el.closest("[data-slot]");
      setDragOver(slot ? slot.getAttribute("data-slot") : null);
    }
    function onUp(ev) {
      var p = ev.changedTouches ? { x:ev.changedTouches[0].clientX, y:ev.changedTouches[0].clientY } : { x:ev.clientX, y:ev.clientY };
      var el = document.elementFromPoint(p.x, p.y);
      var slotEl = el && el.closest("[data-slot]");
      var slotKey = slotEl ? slotEl.getAttribute("data-slot") : null;
      if (slotKey) {
        setSlots(function(prev) {
          var ns = Object.assign({}, prev);
          if (dragRef.current.fromSlot && dragRef.current.fromSlot !== slotKey) delete ns[dragRef.current.fromSlot];
          ns[slotKey] = dragRef.current.item;
          saveUserData({ slots:ns }); return ns;
        });
      } else if (dragRef.current.fromSlot && el && el.closest("[data-pool]")) {
        setSlots(function(prev) { var ns = Object.assign({}, prev); delete ns[dragRef.current.fromSlot]; saveUserData({ slots:ns }); return ns; });
      }
      setDragItem(null); setDragOver(null); dragRef.current = null;
      window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp);
    }
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive:false }); window.addEventListener("touchend", onUp);
  }

  var scheduledTitles = Object.values(slots).map(function(i){ return i.title; });
  var unscheduled = picked.filter(function(i){ return scheduledTitles.indexOf(i.title) === -1; });

  if (authLoading) {
    return <div style={{ minHeight:"100vh", background:BRAND.bg, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ fontSize:14, color:BRAND.muted }}>Loading...</div></div>;
  }

  if (showAuth) {
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ maxWidth:440, width:"100%" }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:-1, ...gradText(BRAND.rainbow) }}>CREATORS STUDIO</div>
            <div style={{ fontSize:15, color:BRAND.muted, marginTop:8 }}>Save your progress and get your content strategy</div>
          </div>
          <div style={cardStyle}>
            <div style={{ display:"flex", marginBottom:24, border:`1px solid ${BRAND.border}` }}>
              <button style={{ flex:1, padding:"12px 0", fontWeight:700, fontSize:13, textTransform:"uppercase", background:authMode==="signup"?BRAND.black:BRAND.white, color:authMode==="signup"?BRAND.white:BRAND.muted, border:"none", cursor:"pointer" }} onClick={function(){ setAuthMode("signup"); setAuthError(""); }}>Create Account</button>
              <button style={{ flex:1, padding:"12px 0", fontWeight:700, fontSize:13, textTransform:"uppercase", background:authMode==="login"?BRAND.black:BRAND.white, color:authMode==="login"?BRAND.white:BRAND.muted, border:"none", cursor:"pointer" }} onClick={function(){ setAuthMode("login"); setAuthError(""); }}>Sign In</button>
            </div>
            <button style={{ width:"100%", padding:"13px 0", border:`1.5px solid ${BRAND.border}`, background:BRAND.white, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }} onClick={handleGoogleAuth}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:BRAND.border }}/><span style={{ fontSize:12, color:BRAND.muted }}>or</span><div style={{ flex:1, height:1, background:BRAND.border }}/>
            </div>
            <span style={labelStyle}>Email</span>
            <input style={{ ...inputStyle, marginBottom:14 }} type="email" placeholder="you@example.com" value={authEmail} onChange={function(e){ setAuthEmail(e.target.value); }} />
            <span style={labelStyle}>Password</span>
            <input style={{ ...inputStyle, marginBottom:20 }} type="password" placeholder="Min. 6 characters" value={authPassword} onChange={function(e){ setAuthPassword(e.target.value); }} onKeyDown={function(e){ if(e.key==="Enter") handleEmailAuth(); }} />
            {authError && <div style={{ color:"#f4845f", fontSize:13, marginBottom:16, padding:"10px 14px", background:"#fff5f0", border:"1px solid #ffd4c8" }}>{authError}</div>}
            <button style={{ ...rainbowBtn, width:"100%", textAlign:"center" }} onClick={handleEmailAuth} disabled={authSubmitting}>
              {authSubmitting ? "Please wait..." : authMode==="signup" ? "Create Account & Generate Strategy →" : "Sign In →"}
            </button>
            {authMode==="signup" && <div style={{ fontSize:12, color:BRAND.muted, marginTop:16, textAlign:"center" }}>Already have an account? <span style={{ cursor:"pointer", fontWeight:700, color:BRAND.black }} onClick={function(){ setAuthMode("login"); }}>Sign in</span></div>}
            {authMode==="login" && <div style={{ fontSize:12, color:BRAND.muted, marginTop:16, textAlign:"center" }}>New here? <span style={{ cursor:"pointer", fontWeight:700, color:BRAND.black }} onClick={function(){ setAuthMode("signup"); }}>Create an account</span></div>}
          </div>
          <div style={{ textAlign:"center", marginTop:16 }}>
            <span style={{ fontSize:12, color:BRAND.muted, cursor:"pointer" }} onClick={function(){ setShowAuth(false); }}>← Back to questionnaire</span>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "onboarding") {
    var steps = ["You","Platforms","Goals","Brand","Vibe"];
    function toggle(arr, val, max) { max = max || 99; if (arr.indexOf(val) !== -1) return arr.filter(function(x){ return x !== val; }); if (arr.length >= max) return arr; return arr.concat([val]); }
    var stepOk = [
      !!(profile.name && profile.job),
      profile.platforms.length > 0,
      profile.goals.length > 0,
      true,
      !!profile.vibe
    ];
    var ok = stepOk[obStep];
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:BRAND.black }}>
        <div style={{ background:BRAND.bg, padding:"48px 40px 0", textAlign:"center", borderBottom:`1px solid ${BRAND.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:1, color:BRAND.muted, marginBottom:24 }}>CREATORS STUDIO <span style={{ color:BRAND.border }}>by Curated Niche Studios</span></div>
          <div style={{ fontSize:"clamp(56px,10vw,110px)", fontWeight:900, lineHeight:0.9, letterSpacing:-3, ...gradText(BRAND.rainbow) }}>CREATORS</div>
          <div style={{ fontSize:"clamp(56px,10vw,110px)", fontWeight:900, lineHeight:0.9, letterSpacing:-3, color:BRAND.black, marginBottom:24 }}>STUDIO</div>
          <div style={{ fontSize:15, color:BRAND.muted, marginBottom:40 }}>AI Content System for Creators and Brands</div>
        </div>
        <div style={{ maxWidth:540, margin:"40px auto", padding:"0 24px" }}>
          <div style={{ display:"flex", border:`1px solid ${BRAND.border}`, marginBottom:28 }}>
            {steps.map(function(st, i) {
              return <div key={i} style={{ flex:1, padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", background:i<obStep?BRAND.black:i===obStep?BRAND.white:BRAND.bg, color:i<obStep?BRAND.white:i===obStep?BRAND.black:BRAND.border, borderRight:i<steps.length-1?`1px solid ${BRAND.border}`:"none" }}>{st}</div>;
            })}
          </div>
          <div style={cardStyle}>
            {obStep === 0 && (
              <div>
                <div style={{ fontSize:22, fontWeight:800, marginBottom:16 }}>Tell us about yourself</div>
                <span style={labelStyle}>Your name</span>
                <input style={{ ...inputStyle, marginBottom:14 }} placeholder="e.g. Sarah" value={profile.name} onChange={function(e){ setProfile(function(p){ return Object.assign({},p,{name:e.target.value}); }); }} />
                <span style={labelStyle}>What do you do?</span>
                <input style={inputStyle} placeholder="e.g. Fitness coach, designer..." value={profile.job} onChange={function(e){ setProfile(function(p){ return Object.assign({},p,{job:e.target.value}); }); }} />
              </div>
            )}
            {obStep === 1 && (
              <div>
                <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Which platforms?</div>
                <div style={{ fontSize:13, color:BRAND.muted, marginBottom:14 }}>Select all you want — you can refine later</div>
                <div>
                  {PLATFORMS.map(function(pl) {
                    var on = profile.platforms.indexOf(pl) !== -1;
                    return <span key={pl} style={tagStyle(on)} onClick={function(){ setProfile(function(p){ return Object.assign({},p,{platforms:toggle(p.platforms,pl)}); }); }}>{pl}</span>;
                  })}
                </div>
              </div>
            )}
            {obStep === 2 && (
              <div>
                <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Why are you creating?</div>
                <div style={{ fontSize:13, color:BRAND.muted, marginBottom:14 }}>Pick up to 3</div>
                <div>
                  {GOALS.map(function(g) {
                    var on = profile.goals.indexOf(g) !== -1;
                    return <span key={g} style={tagStyle(on)} onClick={function(){ setProfile(function(p){ return Object.assign({},p,{goals:toggle(p.goals,g,3)}); }); }}>{g}</span>;
                  })}
                </div>
              </div>
            )}
            {obStep === 3 && (
              <div>
                <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Describe your brand</div>
                <div style={{ fontSize:13, color:BRAND.muted, marginBottom:14 }}>Your story, values, and audience</div>
                <textarea style={{ ...inputStyle, height:130, resize:"vertical" }} placeholder="e.g. I left corporate to become a life coach..." value={profile.brand} onChange={function(e){ setProfile(function(p){ return Object.assign({},p,{brand:e.target.value}); }); }} />
              </div>
            )}
            {obStep === 4 && (
              <div>
                <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Your content vibe?</div>
                <div style={{ fontSize:13, color:BRAND.muted, marginBottom:14 }}>How do you want to come across?</div>
                <div>
                  {VIBES.map(function(v) {
                    var on = profile.vibe === v;
                    return <span key={v} style={tagStyle(on)} onClick={function(){ setProfile(function(p){ return Object.assign({},p,{vibe:v}); }); }}>{v}</span>;
                  })}
                </div>
              </div>
            )}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
            {obStep > 0 && <button style={outlineBtn} onClick={function(){ setObStep(function(s){ return s-1; }); }}>Back</button>}
            {obStep < steps.length-1
              ? <button style={{ ...darkBtn, marginLeft:"auto", opacity:ok?1:0.4 }} disabled={!ok} onClick={function(){ if(ok) setObStep(function(s){ return s+1; }); }}>Next</button>
              : <button style={{ ...rainbowBtn, marginLeft:"auto" }} onClick={function(){ if(user){ generateStrategy(user); } else { setShowAuth(true); } }}>{loading?"Building...":"Save and Generate Strategy"}</button>
            }
          </div>
          {obStep === 4 && !user && (
            <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:BRAND.muted }}>
              Already have an account? <span style={{ cursor:"pointer", fontWeight:700, color:BRAND.black }} onClick={function(){ setAuthMode("login"); setShowAuth(true); }}>Sign in</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === "upgrade") {
    var plans = [
      { name:"Free", price:"$0", sub:"Forever free", features:["15 AI generations / month","Up to 3 platforms","Full onboarding and strategy"], cta:"Current Plan", pro:false },
      { name:"Creator", price:billing==="monthly"?"$19":"$15", sub:billing==="monthly"?"per month":"per month, billed annually", features:["Unlimited AI generations","All platforms","All 9 sections","Priority support","Save conversations"], cta:"Start Creator", pro:true }
    ];
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:BRAND.black }}>
        <div style={{ background:BRAND.bg, borderBottom:`1px solid ${BRAND.border}`, padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, fontWeight:700, ...gradText(BRAND.rainbow) }}>CREATORS STUDIO</div>
          <button style={outlineBtn} onClick={function(){ setScreen("app"); }}>Back</button>
        </div>
        <div style={{ maxWidth:700, margin:"60px auto", padding:"0 24px" }}>
          <div style={{ fontSize:44, fontWeight:900, letterSpacing:-2, marginBottom:8 }}>Choose your plan</div>
          <div style={{ color:BRAND.muted, marginBottom:36 }}>Unlock unlimited AI-powered content creation</div>
          <div style={{ display:"flex", gap:8, marginBottom:36 }}>
            <button style={smBtn(billing==="monthly")} onClick={function(){ setBilling("monthly"); }}>Monthly</button>
            <button style={smBtn(billing==="annual")} onClick={function(){ setBilling("annual"); }}>Annual — save 21%</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {plans.map(function(pl) {
              return (
                <div key={pl.name} style={{ ...cardStyle, border:pl.pro?`2px solid ${BRAND.black}`:undefined, position:"relative" }}>
                  {pl.pro && <div style={{ position:"absolute", top:-1, left:0, right:0, height:4, background:BRAND.rainbow }} />}
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>{pl.name}</div>
                  <div style={{ fontSize:44, fontWeight:900, letterSpacing:-2 }}>{pl.price}</div>
                  <div style={{ fontSize:13, color:BRAND.muted, marginBottom:20 }}>{pl.sub}</div>
                  <div style={divider} />
                  {pl.features.map(function(f) { return <div key={f} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10, fontSize:14 }}><span style={{ fontWeight:700 }}>✓</span>{f}</div>; })}
                  <button style={{ ...darkBtn, width:"100%", marginTop:20, textAlign:"center", opacity:pl.pro?1:0.4 }} onClick={function(){ if(pl.pro){ setIsPro(true); saveUserData({ isPro:true }); setScreen("app"); } }}>{pl.cta}</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  var genPct = Math.min((gens/FREE_LIMIT)*100, 100);

  function renderSection() {
    if (nav === 0) {
      var showWarning = !isPro && profile.platforms.length > 3;
      var currentActive = profile.activePlatforms && profile.activePlatforms.length > 0 ? profile.activePlatforms : profile.platforms.slice(0,3);
      return (
        <div>
          {showWarning && (
            <div style={{ ...cardStyle, borderLeft:`4px solid #f4845f`, background:"#fff8f5", marginBottom:16 }}>
              <div style={{ fontWeight:700, marginBottom:8 }}>Platform Limit — Free Plan</div>
              <div style={{ fontSize:14, color:BRAND.muted, marginBottom:14 }}>You selected {profile.platforms.length} platforms. Free plan supports up to 3. Choose your top 3:</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                {profile.platforms.map(function(pl) {
                  var active = currentActive.indexOf(pl) !== -1;
                  var atLimit = currentActive.length >= 3;
                  return (
                    <span key={pl} style={{ ...tagStyle(active), opacity:!active&&atLimit?0.35:1, cursor:!active&&atLimit?"not-allowed":"pointer" }} onClick={function(){
                      if (!active && atLimit) return;
                      var upd = active ? currentActive.filter(function(x){ return x!==pl; }) : currentActive.concat([pl]);
                      var np = Object.assign({}, profile, { activePlatforms:upd }); setProfile(np); saveUserData({ profile:np });
                    }}>{pl}</span>
                  );
                })}
              </div>
              <div style={{ fontSize:13, color:BRAND.muted }}>Active: <strong>{currentActive.join(", ")}</strong></div>
              <button style={{ ...smBtn(true), marginTop:12 }} onClick={function(){ setScreen("upgrade"); }}>Upgrade for all platforms</button>
            </div>
          )}
          <div style={{ ...cardStyle, background:BRAND.black, color:BRAND.white, borderColor:BRAND.black }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", opacity:0.5, marginBottom:8 }}>Welcome back</div>
            <div style={{ fontSize:26, fontWeight:900, letterSpacing:-1 }}>{profile.name}</div>
            <div style={{ opacity:0.6, marginTop:4, fontSize:14 }}>{profile.job} — {activePlatforms.slice(0,3).join(" · ")}</div>
            {user && <div style={{ opacity:0.4, marginTop:2, fontSize:12 }}>{user.email}</div>}
            {pack && pack.angle && <div style={{ marginTop:18, padding:14, background:"rgba(255,255,255,0.08)", fontSize:14, lineHeight:1.6, borderLeft:"3px solid #4ecdc4" }}>{pack.angle}</div>}
          </div>
          {pack && pack.pillars && pack.pillars.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:14 }}>Content Pillars</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
                {pack.pillars.map(function(p, i) {
                  return (
                    <div key={i} style={{ padding:18, background:PILLAR_COLORS[i]+"18", border:`2px solid ${PILLAR_COLORS[i]}50` }}>
                      <div style={{ fontSize:26 }}>{p.emoji}</div>
                      <div style={{ fontWeight:800, marginTop:6, fontSize:14, color:PILLAR_COLORS[i] }}>{p.name}</div>
                      <div style={{ fontSize:12, color:BRAND.muted, marginTop:4, lineHeight:1.4 }}>{p.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[{l:"Ideas",v:ideas.length},{l:"Picked",v:picked.length},{l:"Months",v:monthPlans.filter(Boolean).length},{l:"Saved Chats",v:savedChats.length}].map(function(st) {
              return (
                <div key={st.l} style={{ ...cardStyle, textAlign:"center", marginBottom:0 }}>
                  <div style={{ fontSize:34, fontWeight:900 }}>{st.v}</div>
                  <div style={{ fontSize:11, color:BRAND.muted, marginTop:4, letterSpacing:0.5, textTransform:"uppercase" }}>{st.l}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (nav === 1) {
      return (
        <div style={cardStyle}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>Your Strategy</div>
          {!pack ? <div style={{ color:BRAND.muted }}>Complete onboarding first.</div> : (
            <div>
              <div style={{ padding:18, background:"#f9f9f9", borderLeft:"4px solid #4ecdc4", marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#4ecdc4", marginBottom:6 }}>Content Angle</div>
                <div style={{ fontSize:15, lineHeight:1.7 }}>{pack.angle}</div>
              </div>
              <div style={{ padding:18, background:"#f9f9f9", borderLeft:"4px solid #c77dff", marginBottom:22 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#c77dff", marginBottom:6 }}>Voice and Style</div>
                <div style={{ fontSize:15, lineHeight:1.7 }}>{pack.voice}</div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:14 }}>Content Pillars</div>
              {pack.pillars && pack.pillars.map(function(p, i) {
                return (
                  <div key={i} style={{ display:"flex", gap:16, alignItems:"center", padding:"14px 0", borderBottom:`1px solid ${BRAND.border}` }}>
                    <div style={{ width:6, alignSelf:"stretch", background:PILLAR_COLORS[i], flexShrink:0, borderRadius:2 }} />
                    <div style={{ fontSize:28, minWidth:40 }}>{p.emoji}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15, color:PILLAR_COLORS[i] }}>{p.name}</div>
                      <div style={{ fontSize:13, color:BRAND.muted, marginTop:3, lineHeight:1.5 }}>{p.description}</div>
                    </div>
                  </div>
                );
              })}
              <button style={{ ...darkBtn, marginTop:20 }} onClick={function(){ setNav(2); }}>Plan Your First Month</button>
            </div>
          )}
        </div>
      );
    }

    if (nav === 2) {
      return (
        <div style={cardStyle}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>Monthly Plan</div>
          <div style={{ display:"flex", gap:8, marginBottom:22, flexWrap:"wrap" }}>
            {Array.from({ length:Math.max(3, monthPlans.length+1) }).map(function(_, i) {
              return <button key={i} style={smBtn(i===curMonth)} onClick={function(){ setCurMonth(i); }}>Month {i+1}</button>;
            })}
          </div>
          {monthPlans[curMonth] ? (
            <div>
              <div style={{ fontSize:20, fontWeight:900, marginBottom:4 }}>Month {curMonth+1}: {monthPlans[curMonth].focus}</div>
              <div style={{ fontSize:13, color:BRAND.muted, marginBottom:18 }}>Focus: {monthPlans[curMonth].userInput}</div>
              {monthPlans[curMonth].weeklyThemes && monthPlans[curMonth].weeklyThemes.map(function(w, i) {
                return (
                  <div key={i} style={{ display:"flex", gap:20, padding:"12px 0", borderBottom:`1px solid ${BRAND.border}`, fontSize:14, alignItems:"center" }}>
                    <div style={{ fontWeight:700, minWidth:60, fontSize:11, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted }}>Week {i+1}</div>
                    <div>{w}</div>
                  </div>
                );
              })}
              {monthPlans[curMonth].tip && <div style={{ padding:14, background:"#f9f9f9", marginTop:18, fontSize:14, borderLeft:"3px solid #f9c74f" }}>Tip: {monthPlans[curMonth].tip}</div>}
              <button style={{ ...darkBtn, marginTop:20 }} onClick={function(){ setNav(3); }}>Generate Content Ideas</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:14, color:BRAND.muted, marginBottom:10 }}>What is your focus this month? (optional)</div>
              <input style={{ ...inputStyle, marginBottom:14 }} placeholder="e.g. launching my new service..." value={monthInput} onChange={function(e){ setMonthInput(e.target.value); }} />
              <button style={rainbowBtn} onClick={function(){ genMonthPlan(curMonth); }}>{loading==="month"+curMonth ? "Planning..." : "Generate Month "+(curMonth+1)+" Plan"}</button>
            </div>
          )}
        </div>
      );
    }

    if (nav === 3) {
      return (
        <div style={cardStyle}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>Content Ideas</div>
          {pack && pack.pillars && pack.pillars.length > 0 && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18, padding:14, background:"#f9f9f9", border:`1px solid ${BRAND.border}` }}>
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:BRAND.muted, textTransform:"uppercase", alignSelf:"center", marginRight:4 }}>Pillars:</span>
              {pack.pillars.map(function(p, i) {
                return (
                  <span key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", background:PILLAR_COLORS[i]+"20", border:`1.5px solid ${PILLAR_COLORS[i]}`, fontSize:12, fontWeight:700, color:PILLAR_COLORS[i] }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:PILLAR_COLORS[i], display:"inline-block" }} />
                    {p.emoji} {p.name}
                  </span>
                );
              })}
            </div>
          )}
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:18 }}>
            <span style={{ fontSize:13, color:BRAND.muted }}>Generate</span>
            {[5,10,15,20,30].map(function(n) { return <button key={n} style={smBtn(n===ideaCount)} onClick={function(){ setIdeaCount(n); }}>{n}</button>; })}
            <span style={{ fontSize:13, color:BRAND.muted }}>ideas</span>
          </div>
          <button style={rainbowBtn} onClick={genIdeas}>{loading==="ideas" ? "Generating..." : "Generate Ideas"}</button>
          {ideas.length > 0 && (
            <div style={{ marginTop:22 }}>
              {ideas.map(function(idea, i) {
                var pc = pillarColor(idea.pillar);
                var isPicked = picked.some(function(p){ return p.title === idea.title; });
                var pillarObj = pack && pack.pillars ? pack.pillars.find(function(p){ return p.name === idea.pillar; }) : null;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"stretch", marginBottom:8, border:`1px solid ${BRAND.border}`, overflow:"hidden", background:isPicked?"#f9f9f9":BRAND.white }}>
                    <div style={{ width:6, background:pc, flexShrink:0 }} />
                    <div style={{ flex:1, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1, paddingRight:12 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:`1px solid ${pc}` }}>
                              {pillarObj ? pillarObj.emoji : ""} {idea.pillar}
                            </span>
                            <span style={{ fontSize:11, color:BRAND.muted, textTransform:"uppercase" }}>{idea.platform} · {idea.format}</span>
                          </div>
                          <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{idea.title}</div>
                          <div style={{ fontSize:13, color:BRAND.muted, fontStyle:"italic" }}>"{idea.hook}"</div>
                        </div>
                        <button style={smBtn(isPicked)} onClick={function(){
                          var has = picked.some(function(p){ return p.title===idea.title; });
                          var u = has ? picked.filter(function(p){ return p.title!==idea.title; }) : picked.concat([idea]);
                          setPicked(u); saveUserData({ picked:u });
                        }}>{isPicked ? "Picked" : "Pick"}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {picked.length > 0 && <button style={{ ...darkBtn, marginTop:12 }} onClick={function(){ setNav(4); }}>View Picked ({picked.length})</button>}
            </div>
          )}
        </div>
      );
    }

    if (nav === 4) {
      return (
        <div style={cardStyle}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>Content Picker — {picked.length} selected</div>
          {picked.length === 0 ? <div style={{ color:BRAND.muted }}>No ideas picked yet.</div> : (
            <div>
              {picked.map(function(idea, i) {
                var pc = pillarColor(idea.pillar);
                var pillarObj = pack && pack.pillars ? pack.pillars.find(function(p){ return p.name===idea.pillar; }) : null;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"stretch", marginBottom:8, border:`1px solid ${BRAND.border}`, overflow:"hidden" }}>
                    <div style={{ width:6, background:pc, flexShrink:0 }} />
                    <div style={{ flex:1, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:`1px solid ${pc}` }}>{pillarObj?pillarObj.emoji:""} {idea.pillar}</span>
                        <div style={{ fontWeight:700, fontSize:14, marginTop:8 }}>{idea.title}</div>
                        <div style={{ fontSize:11, color:BRAND.muted, textTransform:"uppercase", marginTop:3 }}>{idea.platform} · {idea.format}</div>
                      </div>
                      <button style={{ ...smBtn(false), fontSize:11 }} onClick={function(){ var u=picked.filter(function(p){ return p.title!==idea.title; }); setPicked(u); saveUserData({picked:u}); }}>Remove</button>
                    </div>
                  </div>
                );
              })}
              <button style={{ ...darkBtn, marginTop:14 }} onClick={function(){ setNav(5); }}>Create Shoot Plans</button>
            </div>
          )}
        </div>
      );
    }

    if (nav === 5) {
      return (
        <div>
          {picked.length === 0 ? <div style={{ ...cardStyle, color:BRAND.muted }}>Pick some ideas first.</div> : picked.map(function(idea, i) {
            var plan = shoots[idea.title];
            var pc = pillarColor(idea.pillar);
            return (
              <div key={i} style={{ ...cardStyle, borderLeft:`4px solid ${pc}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                  <div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:`1px solid ${pc}` }}>{idea.pillar}</span>
                    <div style={{ fontSize:17, fontWeight:800, marginTop:8 }}>{idea.title}</div>
                    <div style={{ fontSize:12, color:BRAND.muted, marginTop:3 }}>{idea.platform} · {idea.format}</div>
                  </div>
                  <button style={rainbowBtn} onClick={function(){ genShoot(idea); }}>{loading==="shoot_"+idea.title ? "..." : plan ? "Regen" : "Generate"}</button>
                </div>
                {plan && (
                  <div>
                    <EditableBlock label="Script / Talking Points" text={plan.script} onSave={function(t){ var u=Object.assign({},shoots); u[idea.title]=Object.assign({},plan,{script:t}); setShoots(u); saveUserData({shoots:u}); }} />
                    <div style={divider} />
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Shot List</div>
                    {plan.shotList && plan.shotList.map(function(sh, j){ return <div key={j} style={{ padding:"7px 0", borderBottom:`1px solid ${BRAND.border}`, fontSize:14 }}>— {sh}</div>; })}
                    <div style={divider} />
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Repurpose Ideas</div>
                    <div>{plan.repurpose && plan.repurpose.map(function(r, j){ return <span key={j} style={{ display:"inline-block", padding:"5px 12px", background:PILLAR_COLORS[j%PILLAR_COLORS.length]+"20", border:`1px solid ${PILLAR_COLORS[j%PILLAR_COLORS.length]}40`, margin:"3px", fontSize:12, fontWeight:600 }}>{r}</span>; })}</div>
                  </div>
                )}
              </div>
            );
          })}
          {picked.length > 0 && <button style={darkBtn} onClick={function(){ setNav(6); }}>Generate Hooks and Captions</button>}
        </div>
      );
    }

    if (nav === 6) {
      return (
        <div>
          {picked.length === 0 ? <div style={{ ...cardStyle, color:BRAND.muted }}>Pick some ideas first.</div> : picked.map(function(idea, i) {
            var data = hooks[idea.title];
            var pc = pillarColor(idea.pillar);
            return (
              <div key={i} style={{ ...cardStyle, borderLeft:`4px solid ${pc}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                  <div>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:`1px solid ${pc}` }}>{idea.pillar}</span>
                    <div style={{ fontSize:17, fontWeight:800, marginTop:8 }}>{idea.title}</div>
                  </div>
                  <button style={rainbowBtn} onClick={function(){ genHooks(idea); }}>{loading==="hooks_"+idea.title ? "..." : data ? "Regen" : "Generate Hooks"}</button>
                </div>
                {data && (
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Hooks</div>
                    {data.hooks && data.hooks.map(function(h, j){
                      return <EditableBlock key={j} label={h.type} text={h.text} onSave={function(t){ var hs=data.hooks.slice(); hs[j]=Object.assign({},h,{text:t}); var u=Object.assign({},hooks); u[idea.title]=Object.assign({},data,{hooks:hs}); setHooks(u); saveUserData({hooks:u}); }} />;
                    })}
                    <div style={divider} />
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Captions</div>
                    {data.captions && data.captions.map(function(c, j){
                      return <EditableBlock key={j} label={c.platform} text={c.text+(c.cta?"\n\nCTA: "+c.cta:"")} onSave={function(t){ var cs=data.captions.slice(); cs[j]=Object.assign({},c,{text:t}); var u=Object.assign({},hooks); u[idea.title]=Object.assign({},data,{captions:cs}); setHooks(u); saveUserData({hooks:u}); }} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {picked.length > 0 && <button style={darkBtn} onClick={function(){ setNav(7); }}>Go to Scheduler</button>}
        </div>
      );
    }

    if (nav === 7) {
      return (
        <div style={{ position:"relative" }}>
          {dragItem && <div style={{ position:"fixed", left:dragPos.x+10, top:dragPos.y+10, zIndex:9999, pointerEvents:"none", padding:"8px 14px", background:pillarColor(dragItem.item.pillar), color:"#fff", fontSize:12, fontWeight:700, maxWidth:160, boxShadow:"0 8px 24px rgba(0,0,0,0.25)", opacity:0.92 }}>{dragItem.item.title}</div>}
          <div style={{ ...cardStyle, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:4 }}>4-Week Content Scheduler</div>
            <div style={{ fontSize:13, color:BRAND.muted }}>Drag ideas onto the calendar</div>
          </div>
          <div data-pool="true" style={{ ...cardStyle, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Unscheduled ({unscheduled.length})</div>
            {picked.length === 0 && <div style={{ fontSize:13, color:BRAND.muted }}>Pick some ideas first.</div>}
            {unscheduled.length === 0 && picked.length > 0 && <div style={{ fontSize:13, color:BRAND.muted, fontStyle:"italic" }}>All ideas scheduled!</div>}
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {unscheduled.map(function(idea, i) {
                var pc = pillarColor(idea.pillar);
                return (
                  <div key={i} onMouseDown={function(e){ startDrag(e, idea, null); }} onTouchStart={function(e){ startDrag(e, idea, null); }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:BRAND.white, border:`2px solid ${pc}`, cursor:"grab", userSelect:"none", fontSize:13, fontWeight:600, WebkitUserSelect:"none" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:pc, display:"inline-block", flexShrink:0 }} />
                    <span style={{ maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{idea.title}</span>
                    <span style={{ fontSize:10, color:BRAND.muted }}>{idea.format}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {WEEKS.map(function(week) {
            return (
              <div key={week} style={{ ...cardStyle, marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>WEEK {week}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
                  {DAYS.map(function(day) {
                    var key = "w"+week+"_"+day;
                    var slotIdea = slots[key];
                    var isOver = dragOver === key;
                    var pc = slotIdea ? pillarColor(slotIdea.pillar) : null;
                    return (
                      <div key={day} data-slot={key} style={{ minHeight:90, border:`2px ${isOver?"solid":"dashed"} ${isOver?"#4ecdc4":BRAND.border}`, background:isOver?"#e8fffe":slotIdea?pc+"15":"#fafafa", padding:6, boxSizing:"border-box" }}>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", color:isOver?"#4ecdc4":BRAND.muted, marginBottom:4 }}>{day}</div>
                        {slotIdea ? (
                          <div onMouseDown={function(e){ startDrag(e, slotIdea, key); }} onTouchStart={function(e){ startDrag(e, slotIdea, key); }}
                            style={{ padding:"6px 7px", background:pc, cursor:"grab", userSelect:"none", WebkitUserSelect:"none", position:"relative" }}>
                            <div style={{ fontSize:10, fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:2, overflow:"hidden" }}>{slotIdea.title}</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.8)" }}>{slotIdea.format}</div>
                            <button onMouseDown={function(e){ e.stopPropagation(); }} onClick={function(e){ e.stopPropagation(); var ns=Object.assign({},slots); delete ns[key]; setSlots(ns); saveUserData({slots:ns}); }}
                              style={{ position:"absolute", top:2, right:2, background:"rgba(0,0,0,0.35)", color:"#fff", border:"none", cursor:"pointer", fontSize:10, width:15, height:15, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>x</button>
                          </div>
                        ) : (
                          <div style={{ fontSize:9, color:BRAND.border, textAlign:"center", marginTop:16, pointerEvents:"none" }}>drop here</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <button style={{ ...smBtn(false), marginTop:4 }} onClick={function(){ setSlots({}); saveUserData({slots:{}}); }}>Clear Schedule</button>
        </div>
      );
    }

    if (nav === 8) {
      return (
        <div style={cardStyle}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:22 }}>Progress and Analytics</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:26 }}>
            {[{l:"Posts Done",v:stats.posted},{l:"Streak",v:stats.streak+"🔥"},{l:"In Pipeline",v:picked.length},{l:"Months",v:monthPlans.filter(Boolean).length}].map(function(st) {
              return <div key={st.l} style={{ padding:18, background:"#f9f9f9", textAlign:"center", border:`1px solid ${BRAND.border}` }}><div style={{ fontSize:34, fontWeight:900 }}>{st.v}</div><div style={{ fontSize:11, color:BRAND.muted, marginTop:4, letterSpacing:0.5, textTransform:"uppercase" }}>{st.l}</div></div>;
            })}
          </div>
          {pack && pack.pillars && pack.pillars.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:14 }}>Pillar Coverage</div>
              {pack.pillars.map(function(p, i) {
                var cnt = picked.filter(function(id){ return id.pillar===p.name; }).length;
                var pct = picked.length ? Math.round((cnt/picked.length)*100) : 0;
                return (
                  <div key={i} style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                      <span style={{ fontWeight:600, color:PILLAR_COLORS[i] }}>{p.emoji} {p.name}</span>
                      <span style={{ color:BRAND.muted }}>{cnt} ideas ({pct}%)</span>
                    </div>
                    <div style={{ background:"#f0f0f0", height:7 }}><div style={{ background:PILLAR_COLORS[i], height:7, width:pct+"%", transition:"width 0.3s" }} /></div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display:"flex", gap:12, marginTop:22 }}>
            <button style={darkBtn} onClick={function(){ var u={posted:stats.posted+1,streak:stats.streak}; setStats(u); saveUserData({stats:u}); }}>+ Mark Post Done</button>
            <button style={outlineBtn} onClick={function(){ var u={posted:stats.posted,streak:stats.streak+1}; setStats(u); saveUserData({stats:u}); }}>+ Streak Day</button>
          </div>
        </div>
      );
    }

    if (nav === 9) {
      return (
        <div style={cardStyle}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>AI Advisor</div>
          <div ref={chatRef} style={{ height:340, overflowY:"auto", background:"#f9f9f9", padding:18, marginBottom:14, border:`1px solid ${BRAND.border}` }}>
            {chat.length === 0 && <div style={{ color:BRAND.muted, textAlign:"center", marginTop:90, fontSize:14 }}>Ask me anything about your content strategy</div>}
            {chat.map(function(m, i) {
              return (
                <div key={i} style={{ marginBottom:14, display:"flex", flexDirection:m.role==="user"?"row-reverse":"row" }}>
                  <div style={{ maxWidth:"78%", padding:"11px 15px", fontSize:14, lineHeight:1.6, background:m.role==="user"?BRAND.black:BRAND.white, color:m.role==="user"?BRAND.white:BRAND.black, border:`1px solid ${BRAND.border}` }}>{m.content}</div>
                </div>
              );
            })}
            {loading === "chat" && <div style={{ color:BRAND.muted, fontSize:13, fontStyle:"italic" }}>Thinking...</div>}
          </div>
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <input style={{ ...inputStyle, flex:1 }} placeholder="Ask your AI advisor..." value={chatInput} onChange={function(e){ setChatInput(e.target.value); }} onKeyDown={function(e){ if(e.key==="Enter") sendChat(); }} />
            <button style={rainbowBtn} onClick={sendChat}>Send</button>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={outlineBtn} onClick={function(){ if(chat.length>0){ var s=savedChats.concat([{date:new Date().toLocaleDateString(),msgs:chat}]); setSavedChats(s); setChat([]); saveUserData({savedChats:s,chat:[]}); } }}>Save and Clear</button>
            {savedChats.length > 0 && <span style={{ fontSize:13, color:BRAND.muted, alignSelf:"center" }}>{savedChats.length} saved</span>}
          </div>
          {savedChats.length > 0 && (
            <div style={{ marginTop:18 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Saved Conversations</div>
              {savedChats.map(function(c, i) {
                return <div key={i} style={{ padding:10, border:`1px solid ${BRAND.border}`, marginBottom:8, cursor:"pointer", background:"#f9f9f9" }} onClick={function(){ setChat(c.msgs); }}><div style={{ fontWeight:600, fontSize:13 }}>Conversation {i+1}</div><div style={{ fontSize:12, color:BRAND.muted }}>{c.date} — {c.msgs.length} messages</div></div>;
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  }

  var NAV_LABELS = ["Home","Strategy","Monthly Plan","Ideas","Picker","Shoot Plan","Hooks","Scheduler","Analytics","Advisor"];

  return (
    <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:BRAND.black }}>
      <div style={{ background:BRAND.bg, borderBottom:`1px solid ${BRAND.border}`, padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ fontSize:13, fontWeight:700 }}>
          <span style={gradText(BRAND.rainbow)}>CREATORS STUDIO</span>
          <span style={{ color:BRAND.muted, fontWeight:400, fontSize:12 }}> by Curated Niche Studios</span>
        </div>
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          {!isPro && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
              <div style={{ fontSize:10, color:BRAND.muted, letterSpacing:0.5, marginBottom:3 }}>{gens}/{FREE_LIMIT} USES</div>
              <div style={{ width:80, height:4, background:BRAND.border }}>
                <div style={{ width:genPct+"%", height:4, background:genPct>80?"#f4845f":"#4ecdc4", transition:"width 0.3s" }} />
              </div>
            </div>
          )}
          {isPro && <span style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", ...gradText(BRAND.rainbow) }}>CREATOR</span>}
          {!isPro && <button style={smBtn(true)} onClick={function(){ setScreen("upgrade"); }}>Upgrade</button>}
          {user
            ? <button style={{ ...outlineBtn, padding:"6px 12px", fontSize:11 }} onClick={handleSignOut}>Sign Out</button>
            : <button style={{ ...outlineBtn, padding:"6px 12px", fontSize:11 }} onClick={function(){ setShowAuth(true); }}>Sign In</button>
          }
        </div>
      </div>
      <div style={{ background:BRAND.white, borderBottom:`1px solid ${BRAND.border}`, padding:"0 32px", display:"flex", overflowX:"auto" }}>
        {NAV_LABELS.map(function(label, i) {
          var locked = !pack && i > 0;
          return (
            <button key={i} style={navItemStyle(i===nav, locked)} onClick={function(){ if(!locked) setNav(i); }}>{label}</button>
          );
        })}
      </div>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 20px" }}>
        {renderSection()}
      </div>
    </div>
  );
}
