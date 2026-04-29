"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const API_URL = "/api/ai";
const MODEL = "claude-opus-4-5";
const FREE_LIMIT = 15;
const RESET_DAYS = 30;

const PLATFORMS = ["Instagram","TikTok","YouTube","LinkedIn","X (Twitter)","Facebook","Pinterest","Redbook (小红书)","Douyin (抖音)","WeChat","Lemon8","Threads"];
const GOALS = ["Grow my audience","Build my personal brand","Promote my business","Share my passion / hobby","Educate people","Generate leads or sales","Network professionally","Just stay relevant online"];
const VIBES = ["Professional & polished","Casual & friendly","Bold & edgy","Inspirational","Funny & entertaining","Educational & informative"];
const PILLAR_COLORS = ["#4ecdc4","#f4845f","#c77dff","#e07bb5","#7ed957","#f9c74f"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const WEEKS = [1,2,3,4];
const STATUS_STEPS = ["Draft","Shot","Edited","Posted"];
const STATUS_COLORS = { Draft:"#f9c74f", Shot:"#4ecdc4", Edited:"#c77dff", Posted:"#7ed957" };
const BRAND = { bg:"#f0f0f0", white:"#ffffff", black:"#111111", rainbow:"linear-gradient(90deg,#4ecdc4,#7ed957,#f9c74f,#f4845f,#e07bb5,#c77dff)", border:"#d8d8d8", muted:"#888" };

function gradText(g) { return { background:g, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }; }

async function callAI(messages, system) {
  const res = await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:MODEL, max_tokens:1200, system:system||"", messages }) });
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
  const lightBtn = { background:"transparent", color:BRAND.black, border:"1px solid "+BRAND.border, padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer" };
  const inputSt = { width:"100%", padding:"12px 14px", border:"1.5px solid "+BRAND.border, fontSize:14, outline:"none", boxSizing:"border-box", background:BRAND.white, fontFamily:"inherit" };
  return (
    <div style={{ marginBottom:12, padding:16, background:"#f9f9f9", border:"1px solid "+BRAND.border }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>{props.label}</div>
      {editing ? (
        <div>
          <textarea style={{ ...inputSt, height:100, resize:"vertical" }} value={val} onChange={function(e){ setVal(e.target.value); }} />
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
          <input style={{ ...inputSt, marginBottom:8 }} placeholder="Tell AI what to improve..." value={fb} onChange={function(e){ setFb(e.target.value); }} />
          <button style={darkBtn} onClick={async function(){
            if (!fb.trim()) return;
            try {
              const res = await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:MODEL, max_tokens:500, messages:[{ role:"user", content:"Original: \""+val+"\"\nFeedback: \""+fb+"\"\nRewrite based on feedback. Return only the rewritten text." }] }) });
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

function LimitModal(props) {
  var resetStr = props.resetDate ? new Date(props.resetDate).toLocaleDateString("en-US", { day:"numeric", month:"short", year:"numeric" }) : "30 days from your first use";
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:BRAND.white, maxWidth:420, width:"100%", padding:32 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:12 }}>Generation Limit Reached</div>
        <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.5, marginBottom:8 }}>You have used all 15 free generations</div>
        <div style={{ fontSize:14, color:BRAND.muted, marginBottom:28, lineHeight:1.6 }}>Upgrade for unlimited access, or wait for your free reset.</div>
        <div style={{ border:"2px solid "+BRAND.black, padding:20, marginBottom:12, position:"relative" }}>
          <div style={{ position:"absolute", top:-1, left:0, right:0, height:3, background:BRAND.rainbow }} />
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>✨ Upgrade to Creator</div>
          <div style={{ fontSize:13, color:BRAND.muted, marginBottom:16 }}>Unlimited AI generations — $19/month or $15/month annually.</div>
          <button style={{ background:BRAND.rainbow, color:BRAND.white, border:"none", padding:"12px 24px", fontWeight:700, fontSize:14, cursor:"pointer", width:"100%" }} onClick={props.onUpgrade}>Upgrade Now →</button>
        </div>
        <div style={{ border:"1px solid "+BRAND.border, padding:20 }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>⏰ Wait for your free reset</div>
          <div style={{ fontSize:13, color:BRAND.muted, marginBottom:16 }}>Your generations reset on <strong>{resetStr}</strong>.</div>
          <button style={{ background:BRAND.bg, color:BRAND.black, border:"1.5px solid "+BRAND.border, padding:"12px 24px", fontWeight:700, fontSize:14, cursor:"pointer", width:"100%" }} onClick={props.onClose}>I will wait</button>
        </div>
      </div>
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
  const [screen, setScreen] = useState("landing");
  const [obStep, setObStep] = useState(0);
  const [profile, setProfile] = useState({ name:"", job:"", brand:"", platforms:[], goals:[], vibe:"" });
  const [pack, setPack] = useState(null);
  const [monthPlans, setMonthPlans] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [ideaCount, setIdeaCount] = useState(10);
  const [picked, setPicked] = useState([]);
  const [shoots, setShoots] = useState({});
  const [hooks, setHooks] = useState({});
  const [slots, setSlots] = useState({});
  const [postStatus, setPostStatus] = useState({});
  const [stats, setStats] = useState({ posted:0, streak:0 });
  const [chat, setChat] = useState([]);
  const [savedChats, setSavedChats] = useState([]);
  const [nav, setNav] = useState(0);
  const [loading, setLoading] = useState("");
  const [gens, setGens] = useState(0);
  const [gensResetDate, setGensResetDate] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [monthInput, setMonthInput] = useState("");
  const [curMonth, setCurMonth] = useState(0);

  // Drag state
  const [draggedIdea, setDraggedIdea] = useState(null);
  const [draggedFromSlot, setDraggedFromSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x:0, y:0 });

  const chatRef = useRef(null);

  useEffect(function() {
    var timeout = setTimeout(function() { setAuthLoading(false); setScreen("landing"); }, 5000);
    supabase.auth.getSession().then(function(res) {
      clearTimeout(timeout);
      var session = res.data.session;
      var u = session ? session.user : null;
      setUser(u);
      if (u) { loadUserData(u.id); } else { setAuthLoading(false); setScreen("landing"); }
    }).catch(function() { clearTimeout(timeout); setAuthLoading(false); setScreen("landing"); });
    var sub = supabase.auth.onAuthStateChange(function(event, session) {
      var u = session ? session.user : null;
      setUser(u);
      if (event === "SIGNED_IN" && u) { loadUserData(u.id); }
      if (event === "SIGNED_OUT") { setAuthLoading(false); setScreen("landing"); }
    });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  async function loadUserData(userId) {
    try {
      var res = await fetch("/api/user/load", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:userId }) });
      var json = await res.json();
      var d = json.data;
      if (!d || !d.pack) {
        setProfile({ name:"", job:"", brand:"", platforms:[], goals:[], vibe:"" });
        setPack(null); setIdeas([]); setPicked([]); setShoots({}); setHooks({});
        setSlots({}); setMonthPlans([]); setChat([]); setSavedChats([]);
        setGens(0); setIsPro(false); setNav(0); setObStep(0); setPostStatus({});
        setScreen("onboarding"); setAuthLoading(false); return;
      }
      if (d.profile) setProfile(d.profile);
      setPack(d.pack);
      if (d.month_plans) setMonthPlans(d.month_plans);
      if (d.ideas) setIdeas(d.ideas);
      if (d.picked) setPicked(d.picked);
      if (d.shoots) setShoots(d.shoots);
      if (d.hooks) setHooks(d.hooks);
      if (d.slots) setSlots(d.slots);
      if (d.post_status) setPostStatus(d.post_status);
      if (d.stats) setStats(d.stats);
      if (d.saved_chats) setSavedChats(d.saved_chats);
      if (d.gens) setGens(d.gens);
      if (d.gens_reset_date) setGensResetDate(d.gens_reset_date);
      if (d.is_pro) setIsPro(d.is_pro);
      setNav(0); setScreen("app"); setAuthLoading(false);
    } catch(e) { setScreen("onboarding"); setAuthLoading(false); }
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
    if (updates.postStatus !== undefined) mapped.post_status = updates.postStatus;
    if (updates.stats !== undefined) mapped.stats = updates.stats;
    if (updates.savedChats !== undefined) mapped.saved_chats = updates.savedChats;
    if (updates.gens !== undefined) mapped.gens = updates.gens;
    if (updates.gensResetDate !== undefined) mapped.gens_reset_date = updates.gensResetDate;
    if (updates.isPro !== undefined) mapped.is_pro = updates.isPro;
    try { await fetch("/api/user/save", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId:user.id, data:mapped }) }); } catch(e) {}
  }

  async function handleEmailAuth() {
    setAuthSubmitting(true); setAuthError("");
    try {
      if (authMode === "signup") {
        var r = await supabase.auth.signUp({ email:authEmail, password:authPassword });
        if (r.error) throw r.error;
        if (r.data.user) { setUser(r.data.user); setScreen("onboarding"); }
      } else {
        var r2 = await supabase.auth.signInWithPassword({ email:authEmail, password:authPassword });
        if (r2.error) throw r2.error;
        setUser(r2.data.user); await loadUserData(r2.data.user.id);
      }
    } catch(e) { setAuthError(e.message || "Something went wrong"); }
    setAuthSubmitting(false);
  }

  async function handleGoogleAuth() {
    await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo:window.location.origin } });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null); setPack(null); setScreen("landing");
    setProfile({ name:"", job:"", brand:"", platforms:[], goals:[], vibe:"" });
    setIdeas([]); setPicked([]); setShoots({}); setHooks({}); setSlots({}); setPostStatus({});
    setMonthPlans([]); setStats({ posted:0, streak:0 }); setChat([]); setSavedChats([]);
    setGens(0); setIsPro(false); setObStep(0); setNav(0);
  }

  function canGen() {
    if (isPro) return true;
    if (gensResetDate && new Date() > new Date(gensResetDate)) { setGens(0); setGensResetDate(null); saveUserData({ gens:0, gensResetDate:null }); return true; }
    return gens < FREE_LIMIT;
  }

  function useGen(updates) {
    if (!canGen()) { setShowLimitModal(true); return false; }
    var n = gens + 1;
    var resetDate = gensResetDate;
    if (n === 1 && !resetDate) { var d = new Date(); d.setDate(d.getDate() + RESET_DAYS); resetDate = d.toISOString(); setGensResetDate(resetDate); }
    setGens(n);
    saveUserData(Object.assign({}, updates || {}, { gens:n, gensResetDate:resetDate }));
    return true;
  }

  var activePlatforms = profile.platforms || [];
  function pillarColor(name) { var i = pack && pack.pillars ? pack.pillars.findIndex(function(p){ return p.name===name; }) : -1; return PILLAR_COLORS[i>=0?i:0]; }

  var inputSt = { width:"100%", padding:"13px 16px", border:"1.5px solid "+BRAND.border, fontSize:15, outline:"none", boxSizing:"border-box", background:BRAND.white, fontFamily:"inherit" };
  var darkBtn = { background:BRAND.black, color:BRAND.white, border:"1.5px solid "+BRAND.black, padding:"13px 28px", fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:0.5, textTransform:"uppercase" };
  var outlineBtn = { background:"transparent", border:"1.5px solid "+BRAND.black, color:BRAND.black, padding:"10px 22px", fontWeight:700, fontSize:13, cursor:"pointer" };
  var rainbowBtn = { background:BRAND.rainbow, color:BRAND.white, border:"none", padding:"13px 28px", fontWeight:700, fontSize:14, cursor:"pointer" };
  function smBtn(on) { return { background:on?BRAND.black:BRAND.bg, color:on?BRAND.white:BRAND.muted, border:"1px solid "+(on?BRAND.black:BRAND.border), padding:"8px 14px", fontWeight:600, fontSize:12, cursor:"pointer" }; }
  function tagSt(on) { return { display:"inline-block", padding:"7px 16px", border:"1.5px solid "+(on?BRAND.black:BRAND.border), margin:"3px", cursor:"pointer", fontWeight:600, fontSize:12, background:on?BRAND.black:BRAND.white, color:on?BRAND.white:BRAND.black }; }
  function navSt(a, lk) { return { padding:"13px 18px", fontWeight:a?700:500, fontSize:12, cursor:lk?"not-allowed":"pointer", color:lk?BRAND.border:a?BRAND.black:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", whiteSpace:"nowrap", background:"transparent", border:"none", borderBottom:a?"3px solid "+BRAND.black:"3px solid transparent" }; }
  var cardSt = { background:BRAND.white, padding:28, border:"1px solid "+BRAND.border, marginBottom:16 };
  var divider = { borderTop:"1px solid "+BRAND.border, margin:"20px 0" };
  var labelSt = { fontSize:11, fontWeight:700, letterSpacing:1, color:BRAND.muted, textTransform:"uppercase", marginBottom:6, display:"block" };

  async function generateStrategy() {
    if (!useGen()) return;
    setLoading("strategy");
    try {
      var prompt = "Strategy for: Name:"+profile.name+", Job:"+profile.job+", Brand:"+profile.brand+", Platforms:"+profile.platforms.join(",")+", Goals:"+profile.goals.join(",")+", Vibe:"+profile.vibe+". Return JSON only: {\"angle\":\"2 sentence unique angle\",\"voice\":\"voice description\",\"pillars\":[{\"name\":\"...\",\"emoji\":\"...\",\"description\":\"...\"}]}";
      var res = await fetch(API_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:MODEL, max_tokens:1200, system:"Return JSON only, no markdown.", messages:[{ role:"user", content:prompt }] }) });
      var raw = await res.json();
      if (!res.ok || raw.error) { setPack({ angle:"API Error: "+JSON.stringify(raw.error||raw), voice:"", pillars:[] }); setScreen("app"); setNav(1); setLoading(""); return; }
      var txt = raw?.content?.[0]?.text || "";
      var data = parseJSON(txt);
      if (data) { setPack(data); saveUserData({ pack:data, profile:profile }); setNav(1); setScreen("app"); }
      else { setPack({ angle:"Could not parse. Try again.", voice:"", pillars:[] }); setScreen("app"); setNav(1); }
    } catch(e) { setPack({ angle:"Error: "+e.message, voice:"", pillars:[] }); setScreen("app"); setNav(1); }
    setLoading("");
  }

  async function genMonthPlan(idx) {
    if (!useGen()) return; setLoading("month"+idx);
    try {
      var pillars = pack && pack.pillars ? pack.pillars.map(function(p){ return p.name; }).join(",") : "";
      var txt = await callAI([{ role:"user", content:"Month "+(idx+1)+" plan for "+profile.name+"("+profile.job+"). Pillars:"+pillars+". Focus:"+(monthInput||"growth")+". Return JSON:{\"focus\":\"theme\",\"weeklyThemes\":[\"w1\",\"w2\",\"w3\",\"w4\"],\"tip\":\"tip\"}" }], "Return JSON only.");
      var data = parseJSON(txt);
      if (data) { var u=monthPlans.slice(); u[idx]=Object.assign({},data,{userInput:monthInput||"growth"}); setMonthPlans(u); saveUserData({monthPlans:u}); }
    } catch(e) {}
    setLoading(""); setMonthInput("");
  }

  async function genIdeas() {
    if (!useGen()) return; setLoading("ideas");
    try {
      var pillars = pack && pack.pillars ? pack.pillars.map(function(p){ return p.name; }).join(",") : "";
      var txt = await callAI([{ role:"user", content:"Generate "+ideaCount+" content ideas for "+profile.name+"("+profile.job+"). Pillars:"+pillars+". Focus:"+(monthPlans[curMonth]?monthPlans[curMonth].focus:"growth")+". Platforms:"+activePlatforms.join(",")+". Return JSON array:[{\"title\":\"...\",\"pillar\":\"...\",\"platform\":\"...\",\"hook\":\"...\",\"format\":\"Reel|Carousel|Video|Post|Story\"}]" }], "Return JSON only.");
      var data = parseJSON(txt);
      if (data) { setIdeas(data); saveUserData({ideas:data}); }
    } catch(e) {}
    setLoading("");
  }

  async function genShoot(idea) {
    if (!useGen()) return; setLoading("shoot_"+idea.title);
    try {
      var txt = await callAI([{ role:"user", content:"Shoot plan for: \""+idea.title+"\" ("+idea.format+") on "+idea.platform+". Creator: "+profile.name+", "+profile.job+". Vibe: "+profile.vibe+". Return ONLY this JSON: {\"script\":\"full script\",\"shotList\":[\"s1\",\"s2\"],\"repurpose\":[\"r1\",\"r2\"]}" }], "Return only valid JSON. No markdown.");
      var data = parseJSON(txt);
      var entry = (data&&data.script)?data:{script:txt||"Try again.",shotList:[],repurpose:[]};
      var u=Object.assign({},shoots); u[idea.title]=entry; setShoots(u); saveUserData({shoots:u});
    } catch(e) { var u2=Object.assign({},shoots); u2[idea.title]={script:"Error.",shotList:[],repurpose:[]}; setShoots(u2); }
    setLoading("");
  }

  async function genHooks(idea) {
    if (!useGen()) return; setLoading("hooks_"+idea.title);
    try {
      var txt = await callAI([{ role:"user", content:"Hooks and captions for: \""+idea.title+"\" on "+idea.platform+". Creator: "+profile.name+"("+profile.job+"). Vibe: "+profile.vibe+". Return JSON: {\"hooks\":[{\"type\":\"Question\",\"text\":\"...\"},{\"type\":\"Bold Statement\",\"text\":\"...\"},{\"type\":\"Storytelling\",\"text\":\"...\"},{\"type\":\"Curiosity\",\"text\":\"...\"},{\"type\":\"Controversial\",\"text\":\"...\"}],\"captions\":[{\"platform\":\""+idea.platform+"\",\"text\":\"...\",\"cta\":\"...\"}]}" }], "Return valid JSON only.");
      var data = parseJSON(txt);
      if (data) { var u=Object.assign({},hooks); u[idea.title]=data; setHooks(u); saveUserData({hooks:u}); }
    } catch(e) {}
    setLoading("");
  }

  async function sendChat() {
    if (!chatInput.trim()||!useGen()) return;
    var um={role:"user",content:chatInput}, nm=chat.concat([um]);
    setChat(nm); setChatInput(""); setLoading("chat");
    try {
      var txt = await callAI(nm, "You are a content strategy advisor for "+profile.name+"("+profile.job+"). Angle: "+(pack?pack.angle:"")+". Pillars: "+(pack&&pack.pillars?pack.pillars.map(function(p){return p.name;}).join(","):"")+". Be specific.");
      var fm=nm.concat([{role:"assistant",content:txt}]); setChat(fm); saveUserData({chat:fm});
    } catch(e) {}
    setLoading("");
    setTimeout(function(){ if(chatRef.current) chatRef.current.scrollTop=9999; },100);
  }

  // ── DRAG & DROP (pointer events — reliable in all browsers) ──
  function onDragStart(e, idea, fromSlot) {
    e.preventDefault();
    setDraggedIdea(idea);
    setDraggedFromSlot(fromSlot);
    setIsDragging(true);
    var p = e.touches ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : {x:e.clientX,y:e.clientY};
    setDragPos(p);

    function onMove(ev) {
      ev.preventDefault();
      var pos = ev.touches ? {x:ev.touches[0].clientX,y:ev.touches[0].clientY} : {x:ev.clientX,y:ev.clientY};
      setDragPos(pos);
      var el = document.elementFromPoint(pos.x, pos.y);
      var slotEl = el ? el.closest("[data-slot]") : null;
      setDragOverSlot(slotEl ? slotEl.getAttribute("data-slot") : null);
    }

    function onEnd(ev) {
      ev.preventDefault();
      var pos = ev.changedTouches ? {x:ev.changedTouches[0].clientX,y:ev.changedTouches[0].clientY} : {x:ev.clientX,y:ev.clientY};
      var el = document.elementFromPoint(pos.x, pos.y);
      var slotEl = el ? el.closest("[data-slot]") : null;
      var targetSlot = slotEl ? slotEl.getAttribute("data-slot") : null;
      var poolEl = el ? el.closest("[data-pool]") : null;

      setSlots(function(prev) {
        var ns = Object.assign({}, prev);
        if (targetSlot) {
          // dropped on a slot
          if (fromSlot && fromSlot !== targetSlot) delete ns[fromSlot];
          ns[targetSlot] = idea;
        } else if (poolEl && fromSlot) {
          // dropped back to pool
          delete ns[fromSlot];
        }
        saveUserData({slots:ns});
        return ns;
      });

      setDraggedIdea(null);
      setDraggedFromSlot(null);
      setDragOverSlot(null);
      setIsDragging(false);

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, {passive:false});
    window.addEventListener("touchend", onEnd, {passive:false});
  }

  var scheduledTitles = Object.values(slots||{}).map(function(i){ return i&&i.title?i.title:""; });
  var unscheduled = picked.filter(function(i){ return i&&i.title&&scheduledTitles.indexOf(i.title)===-1; });
  var genPct = Math.min((gens/FREE_LIMIT)*100, 100);

  if (authLoading || loading==="strategy") {
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
        <div style={{ fontSize:24, fontWeight:900, letterSpacing:-1, ...gradText(BRAND.rainbow) }}>CREATORS STUDIO</div>
        <div style={{ fontSize:14, color:BRAND.muted }}>{loading==="strategy"?"Building your content strategy...":"Loading..."}</div>
        <div style={{ width:200, height:4, background:BRAND.border, borderRadius:4 }}>
          <div style={{ width:"60%", height:4, background:BRAND.rainbow, borderRadius:4 }} />
        </div>
      </div>
    );
  }

  // LANDING
  if (screen==="landing") {
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:BRAND.black }}>
        <div style={{ padding:"0 40px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid "+BRAND.border }}>
          <div style={{ fontSize:13, fontWeight:700, ...gradText(BRAND.rainbow) }}>CREATORS STUDIO</div>
          <button style={{ ...outlineBtn, padding:"8px 20px", fontSize:13 }} onClick={function(){ setAuthMode("login"); setScreen("auth"); }}>Sign In</button>
        </div>
        <div style={{ textAlign:"center", padding:"80px 24px 60px", borderBottom:"1px solid "+BRAND.border }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:BRAND.muted, textTransform:"uppercase", marginBottom:24 }}>by Curated Niche Studios</div>
          <div style={{ fontSize:"clamp(56px,10vw,110px)", fontWeight:900, lineHeight:0.9, letterSpacing:-3, ...gradText(BRAND.rainbow) }}>CREATORS</div>
          <div style={{ fontSize:"clamp(56px,10vw,110px)", fontWeight:900, lineHeight:0.9, letterSpacing:-3, color:BRAND.black, marginBottom:32 }}>STUDIO</div>
          <div style={{ fontSize:18, color:BRAND.muted, maxWidth:480, margin:"0 auto 48px", lineHeight:1.6 }}>Your AI content system. Strategy, ideas, scripts, hooks and a posting schedule — all in one place.</div>
          <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            <button style={{ ...rainbowBtn, fontSize:16, padding:"16px 40px" }} onClick={function(){ setAuthMode("signup"); setScreen("auth"); }}>Get Started Free →</button>
            <button style={{ ...outlineBtn, fontSize:16, padding:"16px 40px" }} onClick={function(){ setAuthMode("login"); setScreen("auth"); }}>Sign In</button>
          </div>
          <div style={{ fontSize:12, color:BRAND.muted, marginTop:16 }}>Free — no credit card required</div>
        </div>
        <div style={{ maxWidth:860, margin:"0 auto", padding:"60px 24px" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, textAlign:"center", marginBottom:40 }}>Everything you need to show up consistently</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16 }}>
            {[{emoji:"🧭",title:"Content Strategy",desc:"AI builds your unique content angle and pillars."},{emoji:"💡",title:"Endless Ideas",desc:"Generate platform-specific ideas instantly."},{emoji:"🎬",title:"Shoot Plans",desc:"Scripts, shot lists and repurposing ideas."},{emoji:"🪝",title:"Hooks and Captions",desc:"5 hook types and platform captions per post."},{emoji:"📅",title:"Scheduler",desc:"Drag content into your 4-week calendar."},{emoji:"📋",title:"Playbook",desc:"Your full execution plan — ready to action."}].map(function(f){
              return <div key={f.title} style={{ background:BRAND.white, padding:24, border:"1px solid "+BRAND.border }}><div style={{ fontSize:28, marginBottom:12 }}>{f.emoji}</div><div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>{f.title}</div><div style={{ fontSize:13, color:BRAND.muted, lineHeight:1.6 }}>{f.desc}</div></div>;
            })}
          </div>
        </div>
        <div style={{ background:BRAND.black, color:BRAND.white, textAlign:"center", padding:"60px 24px" }}>
          <div style={{ fontSize:32, fontWeight:900, letterSpacing:-1, marginBottom:16 }}>Ready to start creating?</div>
          <div style={{ fontSize:15, opacity:0.6, marginBottom:32 }}>Join creators who are showing up consistently with AI.</div>
          <button style={{ ...rainbowBtn, fontSize:16, padding:"16px 48px" }} onClick={function(){ setAuthMode("signup"); setScreen("auth"); }}>Get Started Free →</button>
        </div>
      </div>
    );
  }

  // AUTH
  if (screen==="auth") {
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ maxWidth:440, width:"100%" }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:-1, ...gradText(BRAND.rainbow) }}>CREATORS STUDIO</div>
            <div style={{ fontSize:15, color:BRAND.muted, marginTop:8 }}>{authMode==="signup"?"Create your free account to get started":"Welcome back — sign in to your account"}</div>
          </div>
          <div style={cardSt}>
            <div style={{ display:"flex", marginBottom:24, border:"1px solid "+BRAND.border }}>
              <button style={{ flex:1, padding:"12px 0", fontWeight:700, fontSize:13, textTransform:"uppercase", background:authMode==="signup"?BRAND.black:BRAND.white, color:authMode==="signup"?BRAND.white:BRAND.muted, border:"none", cursor:"pointer" }} onClick={function(){ setAuthMode("signup"); setAuthError(""); }}>Create Account</button>
              <button style={{ flex:1, padding:"12px 0", fontWeight:700, fontSize:13, textTransform:"uppercase", background:authMode==="login"?BRAND.black:BRAND.white, color:authMode==="login"?BRAND.white:BRAND.muted, border:"none", cursor:"pointer" }} onClick={function(){ setAuthMode("login"); setAuthError(""); }}>Sign In</button>
            </div>
            <button style={{ width:"100%", padding:"13px 0", border:"1.5px solid "+BRAND.border, background:BRAND.white, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }} onClick={handleGoogleAuth}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:BRAND.border }}/><span style={{ fontSize:12, color:BRAND.muted }}>or</span><div style={{ flex:1, height:1, background:BRAND.border }}/>
            </div>
            <span style={labelSt}>Email</span>
            <input style={{ ...inputSt, marginBottom:14 }} type="email" placeholder="you@example.com" value={authEmail} onChange={function(e){ setAuthEmail(e.target.value); }} />
            <span style={labelSt}>Password</span>
            <input style={{ ...inputSt, marginBottom:20 }} type="password" placeholder="Min. 6 characters" value={authPassword} onChange={function(e){ setAuthPassword(e.target.value); }} onKeyDown={function(e){ if(e.key==="Enter") handleEmailAuth(); }} />
            {authError && <div style={{ color:"#f4845f", fontSize:13, marginBottom:16, padding:"10px 14px", background:"#fff5f0", border:"1px solid #ffd4c8" }}>{authError}</div>}
            <button style={{ ...rainbowBtn, width:"100%", textAlign:"center" }} onClick={handleEmailAuth} disabled={authSubmitting}>{authSubmitting?"Please wait...":authMode==="signup"?"Create Account →":"Sign In →"}</button>
            {authMode==="signup"&&<div style={{ fontSize:12, color:BRAND.muted, marginTop:16, textAlign:"center" }}>Already have an account? <span style={{ cursor:"pointer", fontWeight:700, color:BRAND.black }} onClick={function(){ setAuthMode("login"); }}>Sign in</span></div>}
            {authMode==="login"&&<div style={{ fontSize:12, color:BRAND.muted, marginTop:16, textAlign:"center" }}>New here? <span style={{ cursor:"pointer", fontWeight:700, color:BRAND.black }} onClick={function(){ setAuthMode("signup"); }}>Create an account</span></div>}
          </div>
          <div style={{ textAlign:"center", marginTop:16 }}>
            <span style={{ fontSize:12, color:BRAND.muted, cursor:"pointer" }} onClick={function(){ setScreen("landing"); }}>← Back to home</span>
          </div>
        </div>
      </div>
    );
  }

  // ONBOARDING
  if (screen==="onboarding") {
    var steps=["You","Platforms","Goals","Brand","Vibe"];
    function toggle(arr,val,max){ max=max||99; if(arr.indexOf(val)!==-1) return arr.filter(function(x){return x!==val;}); if(arr.length>=max) return arr; return arr.concat([val]); }
    var stepOk=[!!(profile.name&&profile.job), profile.platforms.length===3, profile.goals.length>0, true, !!profile.vibe];
    var ok=stepOk[obStep];
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:BRAND.black }}>
        <div style={{ padding:"0 40px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid "+BRAND.border }}>
          <div style={{ fontSize:13, fontWeight:700, ...gradText(BRAND.rainbow) }}>CREATORS STUDIO</div>
          {user&&<div style={{ fontSize:12, color:BRAND.muted }}>{user.email}</div>}
        </div>
        <div style={{ maxWidth:540, margin:"40px auto", padding:"0 24px" }}>
          <div style={{ display:"flex", border:"1px solid "+BRAND.border, marginBottom:28 }}>
            {steps.map(function(st,i){ return <div key={i} style={{ flex:1, padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", background:i<obStep?BRAND.black:i===obStep?BRAND.white:BRAND.bg, color:i<obStep?BRAND.white:i===obStep?BRAND.black:BRAND.border, borderRight:i<steps.length-1?"1px solid "+BRAND.border:"none" }}>{st}</div>; })}
          </div>
          <div style={cardSt}>
            {obStep===0&&<div><div style={{ fontSize:22, fontWeight:800, marginBottom:16 }}>Tell us about yourself</div><span style={labelSt}>Your name</span><input style={{ ...inputSt, marginBottom:14 }} placeholder="e.g. Sarah" value={profile.name} onChange={function(e){ setProfile(function(p){ return Object.assign({},p,{name:e.target.value}); }); }} /><span style={labelSt}>What do you do?</span><input style={inputSt} placeholder="e.g. Fitness coach, designer..." value={profile.job} onChange={function(e){ setProfile(function(p){ return Object.assign({},p,{job:e.target.value}); }); }} /></div>}
            {obStep===1&&<div>
              <div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Pick your top 3 platforms</div>
              <div style={{ fontSize:13, color:BRAND.muted, marginBottom:6 }}>Select exactly 3 platforms you want to create for</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                {[1,2,3].map(function(n){ var filled=profile.platforms.length>=n; return <div key={n} style={{ width:28, height:28, borderRadius:"50%", background:filled?BRAND.black:BRAND.bg, border:"2px solid "+(filled?BRAND.black:BRAND.border), display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ color:filled?BRAND.white:BRAND.border, fontSize:12, fontWeight:700 }}>{n}</span></div>; })}
                <span style={{ fontSize:12, color:BRAND.muted }}>{profile.platforms.length}/3 selected</span>
              </div>
              <div>{PLATFORMS.map(function(pl){ var on=profile.platforms.indexOf(pl)!==-1; var atLimit=profile.platforms.length>=3; return <span key={pl} style={{ ...tagSt(on), opacity:!on&&atLimit?0.35:1, cursor:!on&&atLimit?"not-allowed":"pointer" }} onClick={function(){ if(!on&&atLimit) return; setProfile(function(p){ return Object.assign({},p,{platforms:toggle(p.platforms,pl,3)}); }); }}>{pl}</span>; })}</div>
              {profile.platforms.length===3&&<div style={{ marginTop:16, padding:"10px 14px", background:"#f0fff8", border:"1px solid #c8f5e0", fontSize:13, color:"#2d7a4f", fontWeight:600 }}>✓ {profile.platforms.join(", ")} selected</div>}
            </div>}
            {obStep===2&&<div><div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Why are you creating content?</div><div style={{ fontSize:13, color:BRAND.muted, marginBottom:14 }}>Pick up to 3 goals</div><div>{GOALS.map(function(g){ var on=profile.goals.indexOf(g)!==-1; return <span key={g} style={tagSt(on)} onClick={function(){ setProfile(function(p){ return Object.assign({},p,{goals:toggle(p.goals,g,3)}); }); }}>{g}</span>; })}</div></div>}
            {obStep===3&&<div><div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Describe your brand</div><div style={{ fontSize:13, color:BRAND.muted, marginBottom:14 }}>Your story, values, and audience <span style={{ opacity:0.6 }}>(optional)</span></div><textarea style={{ ...inputSt, height:130, resize:"vertical" }} placeholder="e.g. I left corporate to become a life coach..." value={profile.brand} onChange={function(e){ setProfile(function(p){ return Object.assign({},p,{brand:e.target.value}); }); }} /></div>}
            {obStep===4&&<div><div style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>Your content vibe?</div><div style={{ fontSize:13, color:BRAND.muted, marginBottom:14 }}>How do you want to come across?</div><div>{VIBES.map(function(v){ var on=profile.vibe===v; return <span key={v} style={tagSt(on)} onClick={function(){ setProfile(function(p){ return Object.assign({},p,{vibe:v}); }); }}>{v}</span>; })}</div></div>}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
            {obStep>0&&<button style={outlineBtn} onClick={function(){ setObStep(function(s){ return s-1; }); }}>Back</button>}
            {obStep<steps.length-1
              ?<button style={{ ...darkBtn, marginLeft:"auto", opacity:ok?1:0.4 }} disabled={!ok} onClick={function(){ if(ok) setObStep(function(s){ return s+1; }); }}>Next →</button>
              :<button style={{ ...rainbowBtn, marginLeft:"auto" }} onClick={generateStrategy}>{loading?"Building...":"Generate My Strategy →"}</button>
            }
          </div>
        </div>
      </div>
    );
  }

  // UPGRADE
  if (screen==="upgrade") {
    var plans=[
      {name:"Free",price:"$0",sub:"Forever free",features:["15 AI generations / month","3 platforms","Full strategy and planning"],cta:"Current Plan",pro:false},
      {name:"Creator",price:billing==="monthly"?"$19":"$15",sub:billing==="monthly"?"per month after 14-day free trial":"per month, billed annually",features:["14-day free trial — no card needed","Unlimited AI generations","All platforms","All sections + Playbook","Priority support"],cta:"Start Free Trial →",pro:true}
    ];
    return (
      <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:BRAND.black }}>
        <div style={{ background:BRAND.bg, borderBottom:"1px solid "+BRAND.border, padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, fontWeight:700, ...gradText(BRAND.rainbow) }}>CREATORS STUDIO</div>
          <button style={outlineBtn} onClick={function(){ setScreen("app"); }}>← Back</button>
        </div>
        <div style={{ maxWidth:700, margin:"60px auto", padding:"0 24px" }}>
          <div style={{ fontSize:44, fontWeight:900, letterSpacing:-2, marginBottom:8 }}>Choose your plan</div>
          <div style={{ color:BRAND.muted, marginBottom:16 }}>Start free — no credit card required</div>

          <div style={{ padding:"14px 20px", background:BRAND.black, color:BRAND.white, marginBottom:36, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>🎁 VIP Early Access — 3 months free</div>
              <div style={{ fontSize:12, opacity:0.6, marginTop:2 }}>Got an invite code? Enter it below to get 3 months free.</div>
            </div>
            <div style={{ fontSize:13, ...gradText(BRAND.rainbow), fontWeight:700 }}>DM us on LinkedIn or Instagram →</div>
          </div>

          {/* Coupon input */}
          <div style={{ marginBottom:24, display:"flex", gap:8 }}>
            <input style={{ ...inputSt, flex:1, fontSize:13, padding:"10px 14px" }} placeholder="Have a VIP code? Enter it here..." value={couponCode} onChange={function(e){ setCouponCode(e.target.value); }} />
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:36 }}>
            <button style={smBtn(billing==="monthly")} onClick={function(){ setBilling("monthly"); }}>Monthly</button>
            <button style={smBtn(billing==="annual")} onClick={function(){ setBilling("annual"); }}>Annual — save 21%</button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {plans.map(function(pl){
              return <div key={pl.name} style={{ ...cardSt, border:pl.pro?"2px solid "+BRAND.black:undefined, position:"relative" }}>
                {pl.pro&&<div style={{ position:"absolute", top:-1, left:0, right:0, height:4, background:BRAND.rainbow }}/>}
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>{pl.name}</div>
                <div style={{ fontSize:44, fontWeight:900, letterSpacing:-2 }}>{pl.price}</div>
                <div style={{ fontSize:13, color:BRAND.muted, marginBottom:20 }}>{pl.sub}</div>
                <div style={divider}/>
                {pl.features.map(function(f){ return <div key={f} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10, fontSize:14 }}><span style={{ fontWeight:700 }}>✓</span>{f}</div>; })}
                <button
                  style={{ ...darkBtn, width:"100%", marginTop:20, textAlign:"center", opacity:pl.pro?1:0.5 }}
                  disabled={pl.pro&&checkoutLoading}
                  onClick={function(){
                    if(pl.pro) startCheckout(billing);
                  }}>
                  {pl.pro&&checkoutLoading ? "Redirecting to payment..." : pl.cta}
                </button>
              </div>;
            })}
          </div>

          {/* Manage subscription for pro users */}
          {isPro && (
            <div style={{ marginTop:24, textAlign:"center" }}>
              <button style={{ ...outlineBtn, fontSize:13 }} onClick={openPortal}>
                Manage Subscription / Cancel →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // APP SECTIONS
  function renderSection() {

    if (nav===0) {
      return <div>
        {!isPro&&<div style={{ ...cardSt, background:"#f9f9f9", borderLeft:"3px solid #4ecdc4", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div><div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>Free Plan — {gens}/{FREE_LIMIT} generations used</div><div style={{ fontSize:12, color:BRAND.muted }}>Upgrade for unlimited access</div></div>
          <button style={{ ...rainbowBtn, padding:"10px 20px", fontSize:13 }} onClick={function(){ setScreen("upgrade"); }}>Upgrade to Creator →</button>
        </div>}
        <div style={{ ...cardSt, background:BRAND.black, color:BRAND.white, borderColor:BRAND.black }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", opacity:0.5, marginBottom:8 }}>Welcome back</div>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:-1 }}>{profile.name}</div>
          <div style={{ opacity:0.6, marginTop:4, fontSize:14 }}>{profile.job} — {activePlatforms.join(" · ")}</div>
          {user&&<div style={{ opacity:0.4, marginTop:2, fontSize:12 }}>{user.email}</div>}
          {pack&&pack.angle&&<div style={{ marginTop:18, padding:14, background:"rgba(255,255,255,0.08)", fontSize:14, lineHeight:1.6, borderLeft:"3px solid #4ecdc4" }}>{pack.angle}</div>}
        </div>
        {pack&&pack.pillars&&pack.pillars.length>0&&<div style={cardSt}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:14 }}>Content Pillars</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
            {pack.pillars.map(function(p,i){ return <div key={i} style={{ padding:18, background:PILLAR_COLORS[i]+"18", border:"2px solid "+PILLAR_COLORS[i]+"50" }}><div style={{ fontSize:26 }}>{p.emoji}</div><div style={{ fontWeight:800, marginTop:6, fontSize:14, color:PILLAR_COLORS[i] }}>{p.name}</div><div style={{ fontSize:12, color:BRAND.muted, marginTop:4, lineHeight:1.4 }}>{p.description}</div></div>; })}
          </div>
        </div>}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {[{l:"Ideas",v:ideas.length},{l:"Picked",v:picked.length},{l:"Months",v:monthPlans.filter(Boolean).length},{l:"Saved Chats",v:savedChats.length}].map(function(st){ return <div key={st.l} style={{ ...cardSt, textAlign:"center", marginBottom:0 }}><div style={{ fontSize:34, fontWeight:900 }}>{st.v}</div><div style={{ fontSize:11, color:BRAND.muted, marginTop:4, letterSpacing:0.5, textTransform:"uppercase" }}>{st.l}</div></div>; })}
        </div>
      </div>;
    }

    if (nav===1) return (
      <div style={cardSt}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>Your Strategy</div>
        {!pack?<div style={{ color:BRAND.muted }}>Complete onboarding first.</div>:<div>
          <div style={{ padding:18, background:"#f9f9f9", borderLeft:"4px solid #4ecdc4", marginBottom:14 }}><div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#4ecdc4", marginBottom:6 }}>Content Angle</div><div style={{ fontSize:15, lineHeight:1.7 }}>{pack.angle}</div></div>
          <div style={{ padding:18, background:"#f9f9f9", borderLeft:"4px solid #c77dff", marginBottom:22 }}><div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"#c77dff", marginBottom:6 }}>Voice and Style</div><div style={{ fontSize:15, lineHeight:1.7 }}>{pack.voice}</div></div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:14 }}>Content Pillars</div>
          {pack.pillars&&pack.pillars.map(function(p,i){ return <div key={i} style={{ display:"flex", gap:16, alignItems:"center", padding:"14px 0", borderBottom:"1px solid "+BRAND.border }}><div style={{ width:6, alignSelf:"stretch", background:PILLAR_COLORS[i], flexShrink:0, borderRadius:2 }}/><div style={{ fontSize:28, minWidth:40 }}>{p.emoji}</div><div><div style={{ fontWeight:800, fontSize:15, color:PILLAR_COLORS[i] }}>{p.name}</div><div style={{ fontSize:13, color:BRAND.muted, marginTop:3, lineHeight:1.5 }}>{p.description}</div></div></div>; })}
          <button style={{ ...darkBtn, marginTop:20 }} onClick={function(){ setNav(2); }}>Plan Your First Month →</button>
        </div>}
      </div>
    );

    if (nav===2) return (
      <div style={cardSt}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>Monthly Plan</div>
        <div style={{ display:"flex", gap:8, marginBottom:22, flexWrap:"wrap" }}>{Array.from({length:Math.max(3,monthPlans.length+1)}).map(function(_,i){ return <button key={i} style={smBtn(i===curMonth)} onClick={function(){ setCurMonth(i); }}>Month {i+1}</button>; })}</div>
        {monthPlans[curMonth]?(
          <div>
            <div style={{ fontSize:20, fontWeight:900, marginBottom:4 }}>Month {curMonth+1}: {monthPlans[curMonth].focus}</div>
            <div style={{ fontSize:13, color:BRAND.muted, marginBottom:18 }}>Focus: {monthPlans[curMonth].userInput}</div>
            {monthPlans[curMonth].weeklyThemes&&monthPlans[curMonth].weeklyThemes.map(function(w,i){ return <div key={i} style={{ display:"flex", gap:20, padding:"12px 0", borderBottom:"1px solid "+BRAND.border, fontSize:14 }}><div style={{ fontWeight:700, minWidth:60, fontSize:11, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted }}>Week {i+1}</div><div>{w}</div></div>; })}
            {monthPlans[curMonth].tip&&<div style={{ padding:14, background:"#f9f9f9", marginTop:18, fontSize:14, borderLeft:"3px solid #f9c74f" }}>Tip: {monthPlans[curMonth].tip}</div>}
            <button style={{ ...darkBtn, marginTop:20 }} onClick={function(){ setNav(3); }}>Generate Content Ideas →</button>
          </div>
        ):(
          <div>
            <div style={{ fontSize:14, color:BRAND.muted, marginBottom:10 }}>What is your focus this month? <span style={{ opacity:0.6 }}>(optional)</span></div>
            <input style={{ ...inputSt, marginBottom:14 }} placeholder="e.g. launching my new service..." value={monthInput} onChange={function(e){ setMonthInput(e.target.value); }} />
            <button style={rainbowBtn} onClick={function(){ genMonthPlan(curMonth); }}>{loading==="month"+curMonth?"Planning...":"Generate Month "+(curMonth+1)+" Plan"}</button>
          </div>
        )}
      </div>
    );

    if (nav===3) return (
      <div style={cardSt}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>Content Ideas</div>
        {pack&&pack.pillars&&pack.pillars.length>0&&<div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18, padding:14, background:"#f9f9f9", border:"1px solid "+BRAND.border }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:BRAND.muted, textTransform:"uppercase", alignSelf:"center", marginRight:4 }}>Pillars:</span>
          {pack.pillars.map(function(p,i){ return <span key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", background:PILLAR_COLORS[i]+"20", border:"1.5px solid "+PILLAR_COLORS[i], fontSize:12, fontWeight:700, color:PILLAR_COLORS[i] }}><span style={{ width:8, height:8, borderRadius:"50%", background:PILLAR_COLORS[i], display:"inline-block" }}/>{p.emoji} {p.name}</span>; })}
        </div>}
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:18 }}>
          <span style={{ fontSize:13, color:BRAND.muted }}>Generate</span>
          {[5,10,15,20,30].map(function(n){ return <button key={n} style={smBtn(n===ideaCount)} onClick={function(){ setIdeaCount(n); }}>{n}</button>; })}
          <span style={{ fontSize:13, color:BRAND.muted }}>ideas</span>
        </div>
        <button style={rainbowBtn} onClick={genIdeas}>{loading==="ideas"?"Generating...":"Generate Ideas"}</button>
        {ideas.length>0&&<div style={{ marginTop:22 }}>
          {ideas.map(function(idea,i){
            var pc=pillarColor(idea.pillar), isPicked=picked.some(function(p){ return p.title===idea.title; });
            var pillarObj=pack&&pack.pillars?pack.pillars.find(function(p){ return p.name===idea.pillar; }):null;
            return <div key={i} style={{ display:"flex", alignItems:"stretch", marginBottom:8, border:"1px solid "+BRAND.border, overflow:"hidden", background:isPicked?"#f9f9f9":BRAND.white }}>
              <div style={{ width:6, background:pc, flexShrink:0 }}/>
              <div style={{ flex:1, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1, paddingRight:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:"1px solid "+pc }}>{pillarObj?pillarObj.emoji:""} {idea.pillar}</span>
                      <span style={{ fontSize:11, color:BRAND.muted, textTransform:"uppercase" }}>{idea.platform} · {idea.format}</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{idea.title}</div>
                    <div style={{ fontSize:13, color:BRAND.muted, fontStyle:"italic" }}>"{idea.hook}"</div>
                  </div>
                  <button style={smBtn(isPicked)} onClick={function(){ var has=picked.some(function(p){ return p.title===idea.title; }); var u=has?picked.filter(function(p){ return p.title!==idea.title; }):picked.concat([idea]); setPicked(u); saveUserData({picked:u}); }}>{isPicked?"✓ Picked":"Pick"}</button>
                </div>
              </div>
            </div>;
          })}
          {picked.length>0&&<button style={{ ...darkBtn, marginTop:12 }} onClick={function(){ setNav(4); }}>View Picked ({picked.length}) →</button>}
        </div>}
      </div>
    );

    if (nav===4) return (
      <div style={cardSt}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>Content Picker — {picked.length} selected</div>
        {picked.length===0?<div style={{ color:BRAND.muted }}>No ideas picked yet.</div>:<div>
          {picked.map(function(idea,i){ var pc=pillarColor(idea.pillar); var pillarObj=pack&&pack.pillars?pack.pillars.find(function(p){ return p.name===idea.pillar; }):null; return <div key={i} style={{ display:"flex", alignItems:"stretch", marginBottom:8, border:"1px solid "+BRAND.border, overflow:"hidden" }}><div style={{ width:6, background:pc, flexShrink:0 }}/><div style={{ flex:1, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:"1px solid "+pc }}>{pillarObj?pillarObj.emoji:""} {idea.pillar}</span><div style={{ fontWeight:700, fontSize:14, marginTop:8 }}>{idea.title}</div><div style={{ fontSize:11, color:BRAND.muted, textTransform:"uppercase", marginTop:3 }}>{idea.platform} · {idea.format}</div></div><button style={{ ...smBtn(false), fontSize:11 }} onClick={function(){ var u=picked.filter(function(p){ return p.title!==idea.title; }); setPicked(u); saveUserData({picked:u}); }}>Remove</button></div></div>; })}
          <button style={{ ...darkBtn, marginTop:14 }} onClick={function(){ setNav(5); }}>Create Shoot Plans →</button>
        </div>}
      </div>
    );

    if (nav===5) return (
      <div>
        {picked.length===0?<div style={{ ...cardSt, color:BRAND.muted }}>Pick some ideas first.</div>:picked.map(function(idea,i){
          var plan=shoots[idea.title], pc=pillarColor(idea.pillar);
          return <div key={i} style={{ ...cardSt, borderLeft:"4px solid "+pc }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
              <div><span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:"1px solid "+pc }}>{idea.pillar}</span><div style={{ fontSize:17, fontWeight:800, marginTop:8 }}>{idea.title}</div><div style={{ fontSize:12, color:BRAND.muted, marginTop:3 }}>{idea.platform} · {idea.format}</div></div>
              <button style={rainbowBtn} onClick={function(){ genShoot(idea); }}>{loading==="shoot_"+idea.title?"...":plan?"Regen":"Generate"}</button>
            </div>
            {plan&&<div>
              <EditableBlock label="Script / Talking Points" text={plan.script} onSave={function(t){ var u=Object.assign({},shoots); u[idea.title]=Object.assign({},plan,{script:t}); setShoots(u); saveUserData({shoots:u}); }}/>
              <div style={divider}/>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Shot List</div>
              {plan.shotList&&plan.shotList.map(function(sh,j){ return <div key={j} style={{ padding:"7px 0", borderBottom:"1px solid "+BRAND.border, fontSize:14 }}>— {sh}</div>; })}
              <div style={divider}/>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Repurpose Ideas</div>
              <div>{plan.repurpose&&plan.repurpose.map(function(r,j){ return <span key={j} style={{ display:"inline-block", padding:"5px 12px", background:PILLAR_COLORS[j%PILLAR_COLORS.length]+"20", border:"1px solid "+PILLAR_COLORS[j%PILLAR_COLORS.length]+"40", margin:"3px", fontSize:12, fontWeight:600 }}>{r}</span>; })}</div>
            </div>}
          </div>;
        })}
        {picked.length>0&&<button style={darkBtn} onClick={function(){ setNav(6); }}>Generate Hooks and Captions →</button>}
      </div>
    );

    if (nav===6) return (
      <div>
        {picked.length===0?<div style={{ ...cardSt, color:BRAND.muted }}>Pick some ideas first.</div>:picked.map(function(idea,i){
          var data=hooks[idea.title], pc=pillarColor(idea.pillar);
          return <div key={i} style={{ ...cardSt, borderLeft:"4px solid "+pc }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div><span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:"1px solid "+pc }}>{idea.pillar}</span><div style={{ fontSize:17, fontWeight:800, marginTop:8 }}>{idea.title}</div></div>
              <button style={rainbowBtn} onClick={function(){ genHooks(idea); }}>{loading==="hooks_"+idea.title?"...":data?"Regen":"Generate Hooks"}</button>
            </div>
            {data&&<div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Hooks</div>
              {data.hooks&&data.hooks.map(function(h,j){ return <EditableBlock key={j} label={h.type} text={h.text} onSave={function(t){ var hs=data.hooks.slice(); hs[j]=Object.assign({},h,{text:t}); var u=Object.assign({},hooks); u[idea.title]=Object.assign({},data,{hooks:hs}); setHooks(u); saveUserData({hooks:u}); }}/>; })}
              <div style={divider}/>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Captions</div>
              {data.captions&&data.captions.map(function(c,j){ return <EditableBlock key={j} label={c.platform} text={c.text+(c.cta?"\n\nCTA: "+c.cta:"")} onSave={function(t){ var cs=data.captions.slice(); cs[j]=Object.assign({},c,{text:t}); var u=Object.assign({},hooks); u[idea.title]=Object.assign({},data,{captions:cs}); setHooks(u); saveUserData({hooks:u}); }}/>; })}
            </div>}
          </div>;
        })}
        {picked.length>0&&<button style={darkBtn} onClick={function(){ setNav(7); }}>Go to Scheduler →</button>}
      </div>
    );

    // SCHEDULER — nav 7
    if (nav===7) return (
      <div style={{ position:"relative" }}>
        {isDragging&&draggedIdea&&(
          <div style={{ position:"fixed", left:dragPos.x+12, top:dragPos.y+12, zIndex:9999, pointerEvents:"none", padding:"8px 14px", background:pillarColor(draggedIdea.pillar), color:"#fff", fontSize:12, fontWeight:700, maxWidth:180, boxShadow:"0 8px 24px rgba(0,0,0,0.3)", opacity:0.95, borderRadius:2 }}>
            {draggedIdea.title}
          </div>
        )}
        <div style={{ ...cardSt, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:4 }}>4-Week Content Scheduler</div>
          <div style={{ fontSize:13, color:BRAND.muted }}>Drag ideas from the pool below onto the calendar slots</div>
        </div>
        <div data-pool="true" style={{ ...cardSt, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Unscheduled ({unscheduled.length})</div>
          {picked.length===0&&<div style={{ fontSize:13, color:BRAND.muted }}>Pick some ideas first.</div>}
          {unscheduled.length===0&&picked.length>0&&<div style={{ fontSize:13, color:BRAND.muted, fontStyle:"italic" }}>All ideas scheduled! 🎉 Go to Playbook to see your execution plan.</div>}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {unscheduled.map(function(idea,i){
              var pc=pillarColor(idea.pillar);
              return (
                <div key={i}
                  onMouseDown={function(e){ onDragStart(e,idea,null); }}
                  onTouchStart={function(e){ onDragStart(e,idea,null); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:BRAND.white, border:"2px solid "+pc, cursor:"grab", userSelect:"none", WebkitUserSelect:"none", fontSize:13, fontWeight:600, borderRadius:2 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:pc, display:"inline-block", flexShrink:0 }}/>
                  <span style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{idea.title}</span>
                  <span style={{ fontSize:10, color:BRAND.muted }}>{idea.format}</span>
                </div>
              );
            })}
          </div>
        </div>
        {WEEKS.map(function(week){
          return (
            <div key={week} style={{ ...cardSt, marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>WEEK {week}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6 }}>
                {DAYS.map(function(day){
                  var key="w"+week+"_"+day;
                  var slotIdea=slots[key];
                  var isOver=dragOverSlot===key;
                  var pc=slotIdea?pillarColor(slotIdea.pillar):null;
                  return (
                    <div key={day} data-slot={key}
                      style={{ minHeight:96, border:"2px "+(isOver?"solid":"dashed")+" "+(isOver?"#4ecdc4":BRAND.border), background:isOver?"#e8fffe":slotIdea?pc+"18":"#fafafa", padding:6, boxSizing:"border-box", transition:"border-color 0.1s, background 0.1s", borderRadius:2 }}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", color:isOver?"#4ecdc4":BRAND.muted, marginBottom:4 }}>{day}</div>
                      {slotIdea?(
                        <div
                          onMouseDown={function(e){ onDragStart(e,slotIdea,key); }}
                          onTouchStart={function(e){ onDragStart(e,slotIdea,key); }}
                          style={{ padding:"6px 7px", background:pc, cursor:"grab", userSelect:"none", WebkitUserSelect:"none", position:"relative", borderRadius:2 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:"#fff", lineHeight:1.3, marginBottom:2, overflow:"hidden" }}>{slotIdea.title}</div>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.8)" }}>{slotIdea.format}</div>
                          <button
                            onMouseDown={function(e){ e.stopPropagation(); }}
                            onClick={function(e){ e.stopPropagation(); var ns=Object.assign({},slots); delete ns[key]; setSlots(ns); saveUserData({slots:ns}); }}
                            style={{ position:"absolute", top:2, right:2, background:"rgba(0,0,0,0.4)", color:"#fff", border:"none", cursor:"pointer", fontSize:10, width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", padding:0, borderRadius:2 }}>×</button>
                        </div>
                      ):(
                        <div style={{ fontSize:9, color:BRAND.border, textAlign:"center", marginTop:18, pointerEvents:"none" }}>drop here</div>
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

    // PLAYBOOK — nav 8
    if (nav===8) {
      var weekGroups={};
      WEEKS.forEach(function(week){
        var items=[];
        DAYS.forEach(function(day){ var k="w"+week+"_"+day; if(slots[k]) items.push({idea:slots[k],day:day,slotKey:k}); });
        if(items.length>0) weekGroups[week]=items;
      });
      var hasContent=Object.keys(weekGroups).length>0;
      return (
        <div>
          <div style={{ ...cardSt, background:BRAND.black, color:BRAND.white, borderColor:BRAND.black, marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", opacity:0.5, marginBottom:6 }}>Your Execution Plan</div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.5 }}>{monthPlans[curMonth]?monthPlans[curMonth].focus:"This Month's Playbook"}</div>
            {monthPlans[curMonth]&&<div style={{ opacity:0.6, fontSize:14, marginTop:4 }}>Focus: {monthPlans[curMonth].userInput}</div>}
            <div style={{ marginTop:16, display:"flex", gap:20, flexWrap:"wrap" }}>
              {[{l:"Pieces planned",v:picked.length},{l:"Scheduled",v:Object.values(slots).length},{l:"Posted",v:Object.values(postStatus).filter(function(s){ return s==="Posted"; }).length}].map(function(st){ return <div key={st.l} style={{ textAlign:"center" }}><div style={{ fontSize:24, fontWeight:900 }}>{st.v}</div><div style={{ fontSize:11, opacity:0.5, textTransform:"uppercase", letterSpacing:0.5 }}>{st.l}</div></div>; })}
            </div>
          </div>

          {!hasContent&&<div style={{ ...cardSt, textAlign:"center", padding:40 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>No content scheduled yet</div>
            <div style={{ color:BRAND.muted, fontSize:14, marginBottom:20 }}>Go to the Scheduler and drag your ideas onto the calendar first.</div>
            <button style={rainbowBtn} onClick={function(){ setNav(7); }}>Go to Scheduler →</button>
          </div>}

          {WEEKS.map(function(week){
            if(!weekGroups[week]) return null;
            var weekTheme=monthPlans[curMonth]&&monthPlans[curMonth].weeklyThemes?monthPlans[curMonth].weeklyThemes[week-1]:"";
            return (
              <div key={week} style={{ marginBottom:24 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>WEEK {week}</div>
                  {weekTheme&&<div style={{ fontSize:13, color:BRAND.muted, fontStyle:"italic" }}>{weekTheme}</div>}
                </div>
                {weekGroups[week].map(function(entry,i){
                  var idea=entry.idea, pc=pillarColor(idea.pillar);
                  var plan=shoots[idea.title], hookData=hooks[idea.title];
                  var firstHook=hookData&&hookData.hooks&&hookData.hooks[0]?hookData.hooks[0]:null;
                  var firstCaption=hookData&&hookData.captions&&hookData.captions[0]?hookData.captions[0]:null;
                  var status=postStatus[idea.title]||"Draft";
                  var pillarObj=pack&&pack.pillars?pack.pillars.find(function(p){ return p.name===idea.pillar; }):null;
                  return (
                    <div key={i} style={{ ...cardSt, borderLeft:"4px solid "+pc, marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                        <div>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:pc+"20", color:pc, border:"1px solid "+pc }}>{pillarObj?pillarObj.emoji:""} {idea.pillar}</span>
                            <span style={{ fontSize:11, color:BRAND.muted, textTransform:"uppercase" }}>{entry.day} · {idea.platform} · {idea.format}</span>
                          </div>
                          <div style={{ fontSize:17, fontWeight:800 }}>{idea.title}</div>
                        </div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {STATUS_STEPS.map(function(st){
                            var isActive=status===st, isDone=STATUS_STEPS.indexOf(status)>STATUS_STEPS.indexOf(st);
                            return <button key={st} style={{ padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer", border:"1.5px solid "+(isActive||isDone?STATUS_COLORS[st]:BRAND.border), background:isActive?STATUS_COLORS[st]:isDone?STATUS_COLORS[st]+"30":"transparent", color:isActive?BRAND.white:isDone?STATUS_COLORS[st]:BRAND.muted, borderRadius:20 }} onClick={function(){ var ns=Object.assign({},postStatus); ns[idea.title]=st; setPostStatus(ns); saveUserData({postStatus:ns}); }}>{isDone||isActive?"✓ ":""}{st}</button>;
                          })}
                        </div>
                      </div>

                      {firstHook&&<div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:6 }}>Hook — {firstHook.type}</div>
                        <div style={{ padding:12, background:"#f9f9f9", border:"1px solid "+BRAND.border, fontSize:14, lineHeight:1.6, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                          <div style={{ flex:1 }}>{firstHook.text}</div>
                          <button style={{ fontSize:11, fontWeight:700, padding:"4px 12px", background:BRAND.black, color:BRAND.white, border:"none", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }} onClick={function(){ navigator.clipboard.writeText(firstHook.text); }}>Copy</button>
                        </div>
                      </div>}

                      {firstCaption&&<div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:6 }}>Caption</div>
                        <div style={{ padding:12, background:"#f9f9f9", border:"1px solid "+BRAND.border, fontSize:14, lineHeight:1.6, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                          <div style={{ flex:1, whiteSpace:"pre-wrap" }}>{firstCaption.text}{firstCaption.cta?"\n\n"+firstCaption.cta:""}</div>
                          <button style={{ fontSize:11, fontWeight:700, padding:"4px 12px", background:BRAND.black, color:BRAND.white, border:"none", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }} onClick={function(){ navigator.clipboard.writeText(firstCaption.text+(firstCaption.cta?"\n\n"+firstCaption.cta:"")); }}>Copy</button>
                        </div>
                      </div>}

                      {plan&&plan.shotList&&plan.shotList.length>0&&<div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:6 }}>Shot List</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {plan.shotList.map(function(sh,j){ return <span key={j} style={{ fontSize:12, padding:"4px 10px", background:"#f0f0f0", border:"1px solid "+BRAND.border }}>— {sh}</span>; })}
                        </div>
                      </div>}

                      {plan&&plan.script&&<div>
                        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:6 }}>Script Preview</div>
                        <div style={{ padding:12, background:"#f9f9f9", border:"1px solid "+BRAND.border, fontSize:13, lineHeight:1.6, color:BRAND.muted, maxHeight:80, overflow:"hidden", position:"relative" }}>
                          {plan.script.substring(0,200)}{plan.script.length>200?"...":""}
                          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:30, background:"linear-gradient(transparent,#f9f9f9)" }}/>
                        </div>
                        <button style={{ fontSize:11, color:BRAND.muted, background:"transparent", border:"none", cursor:"pointer", padding:"4px 0", textDecoration:"underline" }} onClick={function(){ setNav(5); }}>View full script →</button>
                      </div>}

                      {(!plan||!hookData)&&<div style={{ marginTop:12, padding:10, background:"#fff8f0", border:"1px solid #ffd4a0", fontSize:13, color:"#c07000" }}>
                        ⚠️ Missing: <span style={{ cursor:"pointer", textDecoration:"underline" }} onClick={function(){ setNav(!plan?5:6); }}>Generate {!plan?"shoot plan":""}{ !plan&&!hookData?" and ":""}{!hookData?"hooks":""}</span>
                      </div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }

    // ANALYTICS — nav 9
    if (nav===9) return (
      <div style={cardSt}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:22 }}>Progress and Analytics</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:26 }}>
          {[{l:"Posts Done",v:stats.posted},{l:"Streak",v:stats.streak+"🔥"},{l:"In Pipeline",v:picked.length},{l:"Months",v:monthPlans.filter(Boolean).length}].map(function(st){ return <div key={st.l} style={{ padding:18, background:"#f9f9f9", textAlign:"center", border:"1px solid "+BRAND.border }}><div style={{ fontSize:34, fontWeight:900 }}>{st.v}</div><div style={{ fontSize:11, color:BRAND.muted, marginTop:4, letterSpacing:0.5, textTransform:"uppercase" }}>{st.l}</div></div>; })}
        </div>
        {pack&&pack.pillars&&pack.pillars.length>0&&<div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:14 }}>Pillar Coverage</div>
          {pack.pillars.map(function(p,i){ var cnt=picked.filter(function(id){ return id.pillar===p.name; }).length; var pct=picked.length?Math.round((cnt/picked.length)*100):0; return <div key={i} style={{ marginBottom:12 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}><span style={{ fontWeight:600, color:PILLAR_COLORS[i] }}>{p.emoji} {p.name}</span><span style={{ color:BRAND.muted }}>{cnt} ideas ({pct}%)</span></div><div style={{ background:"#f0f0f0", height:7 }}><div style={{ background:PILLAR_COLORS[i], height:7, width:pct+"%", transition:"width 0.3s" }}/></div></div>; })}
        </div>}
        <div style={{ display:"flex", gap:12, marginTop:22 }}>
          <button style={darkBtn} onClick={function(){ var u={posted:stats.posted+1,streak:stats.streak}; setStats(u); saveUserData({stats:u}); }}>+ Mark Post Done</button>
          <button style={outlineBtn} onClick={function(){ var u={posted:stats.posted,streak:stats.streak+1}; setStats(u); saveUserData({stats:u}); }}>+ Streak Day</button>
        </div>
      </div>
    );

    // ADVISOR — nav 10
    if (nav===10) return (
      <div style={cardSt}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:BRAND.muted, marginBottom:18 }}>AI Advisor</div>
        <div ref={chatRef} style={{ height:340, overflowY:"auto", background:"#f9f9f9", padding:18, marginBottom:14, border:"1px solid "+BRAND.border }}>
          {chat.length===0&&<div style={{ color:BRAND.muted, textAlign:"center", marginTop:90, fontSize:14 }}>Ask me anything about your content strategy</div>}
          {chat.map(function(m,i){ return <div key={i} style={{ marginBottom:14, display:"flex", flexDirection:m.role==="user"?"row-reverse":"row" }}><div style={{ maxWidth:"78%", padding:"11px 15px", fontSize:14, lineHeight:1.6, background:m.role==="user"?BRAND.black:BRAND.white, color:m.role==="user"?BRAND.white:BRAND.black, border:"1px solid "+BRAND.border }}>{m.content}</div></div>; })}
          {loading==="chat"&&<div style={{ color:BRAND.muted, fontSize:13, fontStyle:"italic" }}>Thinking...</div>}
        </div>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <input style={{ ...inputSt, flex:1 }} placeholder="Ask your AI advisor..." value={chatInput} onChange={function(e){ setChatInput(e.target.value); }} onKeyDown={function(e){ if(e.key==="Enter") sendChat(); }} />
          <button style={rainbowBtn} onClick={sendChat}>Send</button>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={outlineBtn} onClick={function(){ if(chat.length>0){ var s=savedChats.concat([{date:new Date().toLocaleDateString(),msgs:chat}]); setSavedChats(s); setChat([]); saveUserData({savedChats:s,chat:[]}); } }}>Save and Clear</button>
          {savedChats.length>0&&<span style={{ fontSize:13, color:BRAND.muted, alignSelf:"center" }}>{savedChats.length} saved</span>}
        </div>
        {savedChats.length>0&&<div style={{ marginTop:18 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>Saved Conversations</div>
          {savedChats.map(function(c,i){ return <div key={i} style={{ padding:10, border:"1px solid "+BRAND.border, marginBottom:8, cursor:"pointer", background:"#f9f9f9" }} onClick={function(){ setChat(c.msgs); }}><div style={{ fontWeight:600, fontSize:13 }}>Conversation {i+1}</div><div style={{ fontSize:12, color:BRAND.muted }}>{c.date} — {c.msgs.length} messages</div></div>; })}
        </div>}
      </div>
    );

    return null;
  }

  var NAV_LABELS=["Home","Strategy","Monthly Plan","Ideas","Picker","Shoot Plan","Hooks","Scheduler","Playbook","Analytics","Advisor"];
  var JOURNEY=[
    {nav:0,label:"Home",next:1,nextLabel:"View My Strategy →",hint:"Your dashboard."},
    {nav:1,label:"Strategy",next:2,nextLabel:"Plan My First Month →",hint:"Your content angle, voice and pillars."},
    {nav:2,label:"Monthly Plan",next:3,nextLabel:"Generate Content Ideas →",hint:"Set a monthly focus and week-by-week plan."},
    {nav:3,label:"Ideas",next:4,nextLabel:"Pick Your Ideas →",hint:"Generate platform-specific ideas."},
    {nav:4,label:"Picker",next:5,nextLabel:"Create Shoot Plans →",hint:"Choose which ideas go into this month."},
    {nav:5,label:"Shoot Plan",next:6,nextLabel:"Generate Hooks and Captions →",hint:"Scripts, shot lists and repurpose ideas."},
    {nav:6,label:"Hooks",next:7,nextLabel:"Build My Schedule →",hint:"Hooks and captions for every post."},
    {nav:7,label:"Scheduler",next:8,nextLabel:"View My Playbook →",hint:"Drag content into your 4-week calendar."},
    {nav:8,label:"Playbook",next:9,nextLabel:"View My Progress →",hint:"Your full execution plan — ready to action."},
    {nav:9,label:"Analytics",next:10,nextLabel:"Ask My AI Advisor →",hint:"Track posts, streaks and pillar coverage."},
    {nav:10,label:"Advisor",next:null,nextLabel:null,hint:"Ask anything about your strategy and growth."},
  ];

  return (
    <div style={{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:BRAND.black }}>
      {showLimitModal&&<LimitModal resetDate={gensResetDate} onUpgrade={function(){ setShowLimitModal(false); setScreen("upgrade"); }} onClose={function(){ setShowLimitModal(false); }}/>}
      <div style={{ background:BRAND.bg, borderBottom:"1px solid "+BRAND.border, padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ fontSize:13, fontWeight:700, ...gradText(BRAND.rainbow) }}>CREATORS STUDIO</div>
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          {!isPro&&<div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end" }}><div style={{ fontSize:10, color:BRAND.muted, letterSpacing:0.5, marginBottom:3 }}>{gens}/{FREE_LIMIT} USES</div><div style={{ width:80, height:4, background:BRAND.border }}><div style={{ width:genPct+"%", height:4, background:genPct>80?"#f4845f":"#4ecdc4", transition:"width 0.3s" }}/></div></div>}
          {isPro&&<span style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", ...gradText(BRAND.rainbow) }}>CREATOR</span>}
          {!isPro&&<button style={smBtn(true)} onClick={function(){ setScreen("upgrade"); }}>Upgrade</button>}
          <button style={{ ...outlineBtn, padding:"6px 12px", fontSize:11 }} onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>
      <div style={{ background:BRAND.white, borderBottom:"1px solid "+BRAND.border, padding:"0 32px", display:"flex", overflowX:"auto" }}>
        {NAV_LABELS.map(function(label,i){ var locked=!pack&&i>0; return <button key={i} style={navSt(i===nav,locked)} onClick={function(){ if(!locked) setNav(i); }}>{label}</button>; })}
      </div>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 20px" }}>
        {pack&&<div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", gap:4, marginBottom:12, alignItems:"center" }}>
            {JOURNEY.slice(1).map(function(j,i){ var done=nav>j.nav, active=nav===j.nav; return <div key={i} style={{ display:"flex", alignItems:"center" }}><div style={{ width:active?28:8, height:8, borderRadius:4, background:active?BRAND.rainbow:done?"#4ecdc4":BRAND.border, transition:"all 0.3s", cursor:"pointer" }} onClick={function(){ setNav(j.nav); }}/></div>; })}
            <span style={{ fontSize:11, color:BRAND.muted, marginLeft:8 }}>{JOURNEY[nav]?JOURNEY[nav].label:""} — {JOURNEY[nav]?JOURNEY[nav].hint:""}</span>
          </div>
          {JOURNEY[nav]&&JOURNEY[nav].next!==null&&nav>0&&<div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 20px", background:BRAND.white, border:"1px solid "+BRAND.border, borderLeft:"4px solid #4ecdc4" }}>
            <div style={{ fontSize:13, color:BRAND.muted }}>Next step: <strong style={{ color:BRAND.black }}>{JOURNEY[JOURNEY[nav].next]?JOURNEY[JOURNEY[nav].next].label:""}</strong></div>
            <button style={{ ...rainbowBtn, padding:"8px 20px", fontSize:13 }} onClick={function(){ setNav(JOURNEY[nav].next); }}>{JOURNEY[nav].nextLabel}</button>
          </div>}
        </div>}
        {renderSection()}
      </div>
    </div>
  );
}
