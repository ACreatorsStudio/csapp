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

const BRAND = {
  bg:"#f0f0f0", white:"#ffffff", black:"#111111",
  rainbow:"linear-gradient(90deg,#4ecdc4,#7ed957,#f9c74f,#f4845f,#e07bb5,#c77dff)",
  border:"#d8d8d8", muted:"#888",
};

function gradText(g) { return { background:g, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }; }

async function callAI(messages, system="") {
  const res = await fetch(API_URL, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:MODEL, max_tokens:1200, system, messages}),
  });
  const d = await res.json();
  return d?.content?.[0]?.text || "";
}

function parseJSON(txt) {
  try { return JSON.parse(txt.replace(/```json|```/g,"").trim()); } catch(e) { return null; }
}

// ── Editable Block ───────────────────────────────────────────
function EditableBlock({ label, text, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);
  const [fb, setFb] = useState("");
  const [showFb, setShowFb] = useState(false);
  const btn = (dark) => ({ background:dark?BRAND.black:"transparent", color:dark?BRAND.white:BRAND.black, border:`1px solid ${dark?BRAND.black:BRAND.border}`, padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer" });
  return (
    <div style={{ marginBottom:12, padding:16, background:"#f9f9f9", border:`1px solid ${BRAND.border}` }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:BRAND.muted, marginBottom:10 }}>{label}</div>
      {editing ? (
        <>
          <textarea style={{ width:"100%", padding:12, border:`1.5px solid ${BRAND.border}`, fontSize:14, lineHeight:1.6, resize:"vertical", minHeight:80, boxSizing:"border-box", fontFamily:"inherit" }} value={val} onChange={e=>setVal(e.target.value)} />
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button style={btn(true)} onClick={()=>{ onSave(val); setEditing(false); }}>Save</button>
            <button style={btn(false)} onClick={()=>{ setVal(text); setEditing(false); }}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize:14, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{val}</div>
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button style={btn(false)} onClick={()=>setEditing(true)}>Edit</button>
            <button style={btn(false)} onClick={()=>setShowFb(s=>!s)}>AI Feedback</button>
          </div>
        </>
      )}
      {showFb && !editing && (
        <div style={{ marginTop:12 }}>
          <input style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${BRAND.border}`, fontSize:13, boxSizing:"border-box", fontFamily:"inherit", marginBottom:8 }} placeholder="Tell AI what to improve..." value={fb} onChange={e=>setFb(e.target.value)} />
          <button style={btn(true)} onClick={async()=>{
            if(!fb.trim()) return;
            try {
              const res = await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:500,messages:[{role:"user",content:`Original: "${val}"\nFeedback: "${fb}"\nRewrite based on feedback. Return only the rewritten text.`}]})});
              const data = await res.json();
              const t = data?.content?.[0]?.text?.trim();
              if(t){ setVal(t); onSave(t); }
            } catch(e){}
            setFb(""); setShowFb(false);
          }}>Rewrite with AI</button>
        </div>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("signup"); // signup | login
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false); // shown after questionnaire

  // App state
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
  const [dragPos, setDragPos] = useState({x:0,y:0});
  const chatRef = useRef(null);
  const dragRef = useRef(null);

  // ── Auth listener ───────────────────────────────────────────
  useEffect(()=>{
    supabase.auth.getSession().then(({ data: { session } })=>{
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if(session?.user) loadUserData(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session)=>{
      setUser(session?.user ?? null);
      if(session?.user) loadUserData(session.user.id);
    });
    return () => subscription.unsubscribe();
  },[]);

  async function loadUserData(userId) {
    try {
      const res = await fetch("/api/user/load", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId }) });
      const { data } = await res.json();
      if(!data) return;
      if(data.profile) setProfile(data.profile);
      if(data.pack){ setPack(data.pack); setScreen("app"); }
      if(data.month_plans) setMonthPlans(data.month_plans);
      if(data.ideas) setIdeas(data.ideas);
      if(data.picked) setPicked(data.picked);
      if(data.shoots) setShoots(data.shoots);
      if(data.hooks) setHooks(data.hooks);
      if(data.slots) setSlots(data.slots);
      if(data.stats) setStats(data.stats);
      if(data.saved_chats) setSavedChats(data.saved_chats);
      if(data.gens) setGens(data.gens);
      if(data.is_pro) setIsPro(data.is_pro);
    } catch(e){}
  }

  async function saveUserData(updates) {
    if(!user) return;
    // map camelCase to snake_case for DB columns
    const mapped = {};
    if(updates.profile !== undefined) mapped.profile = updates.profile;
    if(updates.pack !== undefined) mapped.pack = updates.pack;
    if(updates.monthPlans !== undefined) mapped.month_plans = updates.monthPlans;
    if(updates.ideas !== undefined) mapped.ideas = updates.ideas;
    if(updates.picked !== undefined) mapped.picked = updates.picked;
    if(updates.shoots !== undefined) mapped.shoots = updates.shoots;
    if(updates.hooks !== undefined) mapped.hooks = updates.hooks;
    if(updates.slots !== undefined) mapped.slots = updates.slots;
    if(updates.stats !== undefined) mapped.stats = updates.stats;
    if(updates.savedChats !== undefined) mapped.saved_chats = updates.savedChats;
    if(updates.gens !== undefined) mapped.gens = updates.gens;
    if(updates.isPro !== undefined) mapped.is_pro = updates.isPro;
    try {
      await fetch("/api/user/save", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId: user.id, data: mapped }) });
    } catch(e){}
  }

  // ── Auth handlers ───────────────────────────────────────────
  async function handleEmailAuth() {
    setAuthSubmitting(true); setAuthError("");
    try {
      let result;
      if(authMode==="signup") {
        result = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if(result.error) throw result.error;
        // After signup, immediately proceed
        if(result.data.user) {
          setUser(result.data.user);
          setShowAuth(false);
          await generateStrategy(result.data.user);
        }
      } else {
        result = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if(result.error) throw result.error;
        setUser(result.data.user);
        setShowAuth(false);
        // Load existing data
        await loadUserData(result.data.user.id);
        setScreen("app");
      }
    } catch(e) {
      setAuthError(e.message || "Something went wrong");
    }
    setAuthSubmitting(false);
  }

  async function handleGoogleAuth() {
    setAuthError("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null); setPack(null); setScreen("onboarding");
    setProfile({ name:"", job:"", brand:"", platforms:[], goals:[], vibe:"", activePlatforms:[] });
    setObStep(0); setNav(0);
  }

  function canGen() { return isPro || gens < FREE_LIMIT; }
  function useGen(u) {
    if(!canGen()) return false;
    const n = gens+1; setGens(n); saveUserData({...u, gens:n}); return true;
  }

  const activePlatforms = isPro ? profile.platforms : (profile.activePlatforms?.length ? profile.activePlatforms : profile.platforms.slice(0,3));
  const pillarColor = (name) => { const i=pack?.pillars?.findIndex(p=>p.name===name); return PILLAR_COLORS[i>=0?i:0]; };

  // ── Styles ──────────────────────────────────────────────────
  const S = {
    page:{ minHeight:"100vh", background:BRAND.bg, fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:BRAND.black },
    topbar:{ background:BRAND.bg, borderBottom:`1px solid ${BRAND.border}`, padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 },
    navBar:{ background:BRAND.white, borderBottom:`1px solid ${BRAND.border}`, padding:"0 32px", display:"flex", overflowX:"auto" },
    card:{ background:BRAND.white, padding:28, border:`1px solid ${BRAND.border}`, marginBottom:16 },
    divider:{ borderTop:`1px solid ${BRAND.border}`, margin:"20px 0" },
    input:{ width:"100%", padding:"13px 16px", border:`1.5px solid ${BRAND.border}`, fontSize:15, outline:"none", boxSizing:"border-box", background:BRAND.white, fontFamily:"inherit" },
    label:{ fontSize:11, fontWeight:700, letterSpacing:1, color:BRAND.muted, textTransform:"uppercase", marginBottom:6, display:"block" },
    bigBtn(on=true){ return { background:on?BRAND.black:BRAND.bg, color:on?BRAND.white:BRAND.black, border:`1.5px solid ${on?BRAND.black:BRAND.border}`, padding:"13px 28px", fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:0.5, textTransform:"uppercase" }; },
    outBtn:{ background:"transparent", border:`1.5px solid ${BRAND.black}`, color:BRAND.black, padding:"10px 22px", fontWeight:700, fontSize:13, cursor:"pointer" },
    smBtn(on=true){ return { background:on?BRAND.black:BRAND.bg, color:on?BRAND.white:BRAND.muted, border:`1px solid ${on?BRAND.black:BRAND.border}`, padding:"8px 14px", fontWeight:600, fontSize:12, cursor:"pointer" }; },
    rainbowBtn:{ background:BRAND.rainbow, color:BRAND.white, border:"none", padding:"13px 28px", fontWeight:700, fontSize:14, cursor:"pointer", letterSpacing:0.5 },
    tag(on){ return { display:"inline-block", padding:"7px 16px", border:`1.5px solid ${on?BRAND.black:BRAND.border}`, margin:"3px", cursor:"pointer", fontWeight:600, fontSize:12, background:on?BRAND.black:BRAND.white, color:on?BRAND.white:BRAND.black }; },
    navItem(a,lk){ return { padding:"13px 18px", fontWeight:a?700:500, fontSize:12, cursor:lk?"not-allowed":"pointer", color:lk?BRAND.border:a?BRAND.black:BRAND.muted, letterSpacing:0.5, textTransform:"uppercase", whiteSpace:"nowrap", background:"transparent", border:"none", borderBottom:a?`3px solid ${BRAND.black}`:"3px solid transparent" }; },
  };

  // ── AI calls ────────────────────────────────────────────────
  async function generateStrategy(currentUser) {
    const u = currentUser || user;
    if(!canGen()){ setScreen("upgrade"); return; }
    setLoading("strategy"); setScreen("app");
    try {
      const txt = await callAI([{role:"user",content:`Strategy for: Name:${profile.name}, Job:${profile.job}, Brand:${profile.brand}, Platforms:${profile.platforms.join(",")}, Goals:${profile.goals.join(",")}, Vibe:${profile.vibe}. Return JSON only: {"angle":"2 sentence unique angle","voice":"voice description","pillars":[{"name":"...","emoji":"...","description":"..."}]}`}],"Return JSON only, no markdown.");
      const data = parseJSON(txt);
      if(data){
        const ap = profile.platforms.slice(0,3);
        const np = {...profile, activePlatforms:ap};
        setPack(data); setProfile(np);
        if(u) {
          const n=gens+1; setGens(n);
          await fetch("/api/user/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:u.id,data:{pack:data,profile:np,gens:n}})});
        }
      }
    } catch(e){ setPack({angle:"Could not generate — check your API key.",voice:"",pillars:[]}); }
    setLoading(""); setNav(0);
  }

  async function genMonthPlan(idx) {
    if(!canGen()){ setScreen("upgrade"); return; }
    setLoading("month"+idx);
    try {
      const txt = await callAI([{role:"user",content:`Month ${idx+1} plan for ${profile.name} (${profile.job}). Pillars:${pack?.pillars?.map(p=>p.name).join(",")}. Focus:${monthInput||"growth"}. Return JSON: {"focus":"theme","weeklyThemes":["w1","w2","w3","w4"],"tip":"tip"}`}],"Return JSON only.");
      const data = parseJSON(txt);
      if(data){ const u=[...monthPlans]; u[idx]={...data,userInput:monthInput||"growth"}; setMonthPlans(u); useGen({monthPlans:u}); }
    } catch(e){}
    setLoading(""); setMonthInput("");
  }

  async function genIdeas() {
    if(!canGen()){ setScreen("upgrade"); return; }
    setLoading("ideas");
    try {
      const txt = await callAI([{role:"user",content:`Generate ${ideaCount} content ideas for ${profile.name} (${profile.job}). Pillars:${pack?.pillars?.map(p=>p.name).join(",")}. Focus:${monthPlans[curMonth]?.focus||"growth"}. Platforms:${activePlatforms.join(",")}. Return JSON array:[{"title":"...","pillar":"...","platform":"...","hook":"...","format":"Reel|Carousel|Video|Post|Story"}]`}],"Return JSON only.");
      const data = parseJSON(txt);
      if(data){ setIdeas(data); useGen({ideas:data}); }
    } catch(e){}
    setLoading("");
  }

  async function genShoot(idea) {
    if(!canGen()){ setScreen("upgrade"); return; }
    const key=idea.title; setLoading("shoot_"+key);
    try {
      const txt = await callAI([{role:"user",content:`Create a shoot plan for:\nTitle:"${idea.title}"\nFormat:${idea.format}\nPlatform:${idea.platform}\nCreator:${profile.name},${profile.job}\nVibe:${profile.vibe}\nReturn ONLY JSON:{"script":"full script","shotList":["..."],"repurpose":["..."]}`}],"Return only valid JSON, no markdown.");
      const data = parseJSON(txt);
      const entry = data?.script ? data : {script:txt||"Try again.",shotList:[],repurpose:[]};
      const u={...shoots,[key]:entry}; setShoots(u); useGen({shoots:u});
    } catch(e){ const u={...shoots,[idea.title]:{script:"Error — try again.",shotList:[],repurpose:[]}}; setShoots(u); }
    setLoading("");
  }

  async function genHooks(idea) {
    if(!canGen()){ setScreen("upgrade"); return; }
    setLoading("hooks_"+idea.title);
    try {
      const txt = await callAI([{role:"user",content:`Hooks and captions for:"${idea.title}" on ${idea.platform}. Creator:${profile.name}(${profile.job}). Vibe:${profile.vibe}. Return JSON:{"hooks":[{"type":"Question","text":"..."},{"type":"Bold Statement","text":"..."},{"type":"Storytelling","text":"..."},{"type":"Curiosity","text":"..."},{"type":"Controversial","text":"..."}],"captions":[{"platform":"${idea.platform}","text":"...","cta":"..."}]}`}],"Return valid JSON only.");
      const data = parseJSON(txt);
      if(data){ const u={...hooks,[idea.title]:data}; setHooks(u); useGen({hooks:u}); }
      else { const u={...hooks,[idea.title]:{hooks:[{type:"Error",text:"Failed — retry"}],captions:[]}}; setHooks(u); }
    } catch(e){ const u={...hooks,[idea.title]:{hooks:[{type:"Error",text:"Failed — retry"}],captions:[]}}; setHooks(u); }
    setLoading("");
  }

  async function sendChat() {
    if(!chatInput.trim()||!canGen()){ if(!canGen()) setScreen("upgrade"); return; }
    const um={role:"user",content:chatInput};
    const nm=[...chat,um]; setChat(nm); setChatInput(""); setLoading("chat");
    try {
      const txt = await callAI(nm,`You are a personal content strategy advisor for ${profile.name}(${profile.job}). Angle:${pack?.angle}. Pillars:${pack?.pillars?.map(p=>p.name).join(",")}. Be specific and actionable.`);
      const fm=[...nm,{role:"assistant",content:txt}]; setChat(fm); useGen({chat:fm});
    } catch(e){}
    setLoading("");
    setTimeout(()=>chatRef.current?.scrollTo({top:9999,behavior:"smooth"}),100);
  }

  // ── Drag & drop ─────────────────────────────────────────────
  function startDrag(e, item, fromSlot) {
    e.preventDefault();
    const pos = e.touches ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : {x:e.clientX,y:e.clientY};
    setDragItem({item,fromSlot}); setDragPos(pos); dragRef.current={item,fromSlot};
    function onMove(ev) {
      const p=ev.touches?{x:ev.touches[0].clientX,y:ev.touches[0].clientY}:{x:ev.clientX,y:ev.clientY};
      setDragPos(p);
      const el=document.elementFromPoint(p.x,p.y);
      const slot=el?.closest("[data-slot]");
      setDragOver(slot?slot.getAttribute("data-slot"):null);
    }
    function onUp(ev) {
      const p=ev.changedTouches?{x:ev.changedTouches[0].clientX,y:ev.changedTouches[0].clientY}:{x:ev.clientX,y:ev.clientY};
      const el=document.elementFromPoint(p.x,p.y);
      const slotEl=el?.closest("[data-slot]");
      const slotKey=slotEl?.getAttribute("data-slot");
      if(slotKey){
        setSlots(prev=>{
          const ns={...prev};
          if(dragRef.current.fromSlot&&dragRef.current.fromSlot!==slotKey) delete ns[dragRef.current.fromSlot];
          ns[slotKey]=dragRef.current.item;
          saveUserData({slots:ns}); return ns;
        });
      } else if(dragRef.current.fromSlot&&el?.closest("[data-pool]")){
        setSlots(prev=>{ const ns={...prev}; delete ns[dragRef.current.fromSlot]; saveUserData({slots:ns}); return ns; });
      }
      setDragItem(null); setDragOver(null); dragRef.current=null;
      window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",onUp);
      window.removeEventListener("touchmove",onMove); window.removeEventListener("touchend",onUp);
    }
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",onUp);
    window.addEventListener("touchmove",onMove,{passive:false}); window.addEventListener("touchend",onUp);
  }

  const scheduledTitles=Object.values(slots).map(i=>i.title);
  const unscheduled=picked.filter(i=>!scheduledTitles.includes(i.title));

  // ── Auth screen (shown after questionnaire) ─────────────────
  if(showAuth) {
    return (
      <div style={{...S.page, display:"flex", alignItems:"center", justifyContent:"center", padding:24}}>
        <div style={{maxWidth:440, width:"100%"}}>
          <div style={{textAlign:"center", marginBottom:32}}>
            <div style={{fontSize:28, fontWeight:900, letterSpacing:-1, ...gradText(BRAND.rainbow)}}>CREATORS STUDIO</div>
            <div style={{fontSize:15, color:BRAND.muted, marginTop:8}}>Save your progress & get your content strategy</div>
          </div>
          <div style={S.card}>
            <div style={{display:"flex", marginBottom:24, border:`1px solid ${BRAND.border}`}}>
              {["signup","login"].map(m=>(
                <button key={m} style={{flex:1, padding:"12px 0", fontWeight:700, fontSize:13, letterSpacing:0.5, textTransform:"uppercase", background:authMode===m?BRAND.black:BRAND.white, color:authMode===m?BRAND.white:BRAND.muted, border:"none", cursor:"pointer"}} onClick={()=>{setAuthMode(m);setAuthError("");}}>
                  {m==="signup"?"Create Account":"Sign In"}
                </button>
              ))}
            </div>

            {/* Google */}
            <button style={{width:"100%", padding:"13px 0", border:`1.5px solid ${BRAND.border}`, background:BRAND.white, fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20}} onClick={handleGoogleAuth}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>

            <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:20}}>
              <div style={{flex:1, height:1, background:BRAND.border}}/>
              <span style={{fontSize:12, color:BRAND.muted}}>or</span>
              <div style={{flex:1, height:1, background:BRAND.border}}/>
            </div>

            <span style={S.label}>Email</span>
            <input style={{...S.input, marginBottom:14}} type="email" placeholder="you@example.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/>
            <span style={S.label}>Password</span>
            <input style={{...S.input, marginBottom:20}} type="password" placeholder="Min. 6 characters" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleEmailAuth()}/>

            {authError && <div style={{color:"#f4845f", fontSize:13, marginBottom:16, padding:"10px 14px", background:"#fff5f0", border:"1px solid #ffd4c8"}}>{authError}</div>}

            <button style={{...S.rainbowBtn, width:"100%", textAlign:"center"}} onClick={handleEmailAuth} disabled={authSubmitting}>
              {authSubmitting ? "Please wait..." : authMode==="signup" ? "Create Account & Generate Strategy →" : "Sign In →"}
            </button>

            {authMode==="signup"&&<div style={{fontSize:12,color:BRAND.muted,marginTop:16,textAlign:"center"}}>Already have an account? <span style={{cursor:"pointer",fontWeight:700,color:BRAND.black}} onClick={()=>setAuthMode("login")}>Sign in</span></div>}
            {authMode==="login"&&<div style={{fontSize:12,color:BRAND.muted,marginTop:16,textAlign:"center"}}>New here? <span style={{cursor:"pointer",fontWeight:700,color:BRAND.black}} onClick={()=>setAuthMode("signup")}>Create an account</span></div>}
          </div>
          <div style={{textAlign:"center", marginTop:16}}>
            <span style={{fontSize:12, color:BRAND.muted, cursor:"pointer"}} onClick={()=>setShowAuth(false)}>← Back to questionnaire</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Onboarding ──────────────────────────────────────────────
  if(screen==="onboarding") {
    const steps=["You","Platforms","Goals","Brand","Vibe"];
    const toggle=(arr,val,max=99)=>arr.includes(val)?arr.filter(x=>x!==val):arr.length>=max?arr:[...arr,val];
    const ok=[profile.name&&profile.job,profile.platforms.length>0,profile.goals.length>0,true,profile.vibe][obStep];
    return (
      <div style={S.page}>
        <div style={{background:BRAND.bg,padding:"48px 40px 0",textAlign:"center",borderBottom:`1px solid ${BRAND.border}`}}>
          <div style={{fontSize:13,fontWeight:700,letterSpacing:1,color:BRAND.muted,marginBottom:24}}>CREATORS STUDIO <span style={{color:BRAND.border}}>by Curated Niche Studios</span></div>
          <div style={{fontSize:"clamp(56px,10vw,110px)",fontWeight:900,lineHeight:0.9,letterSpacing:-3,...gradText(BRAND.rainbow)}}>CREATORS</div>
          <div style={{fontSize:"clamp(56px,10vw,110px)",fontWeight:900,lineHeight:0.9,letterSpacing:-3,color:BRAND.black,marginBottom:24}}>STUDIO</div>
          <div style={{fontSize:15,color:BRAND.muted,marginBottom:40}}>AI Content System for Creators & Brands</div>
        </div>
        <div style={{maxWidth:540,margin:"40px auto",padding:"0 24px"}}>
          <div style={{display:"flex",border:`1px solid ${BRAND.border}`,marginBottom:28}}>
            {steps.map((st,i)=><div key={i} style={{flex:1,padding:"10px 0",textAlign:"center",fontSize:11,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",background:i<obStep?BRAND.black:i===obStep?BRAND.white:BRAND.bg,color:i<obStep?BRAND.white:i===obStep?BRAND.black:BRAND.border,borderRight:i<steps.length-1?`1px solid ${BRAND.border}`:"none"}}>{st}</div>)}
          </div>
          <div style={S.card}>
            {obStep===0&&<><div style={{fontSize:22,fontWeight:800,marginBottom:16}}>Tell us about yourself</div><span style={S.label}>Your name</span><input style={{...S.input,marginBottom:14}} placeholder="e.g. Sarah" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))}/><span style={S.label}>What do you do?</span><input style={S.input} placeholder="e.g. Fitness coach, designer..." value={profile.job} onChange={e=>setProfile(p=>({...p,job:e.target.value}))}/></>}
            {obStep===1&&<><div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Which platforms?</div><div style={{fontSize:13,color:BRAND.muted,marginBottom:14}}>Select all you want</div><div>{PLATFORMS.map(pl=><span key={pl} style={S.tag(profile.platforms.includes(pl))} onClick={()=>setProfile(p=>({...p,platforms:toggle(p.platforms,pl)}))}>{pl}</span>)}</div></>}
            {obStep===2&&<><div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Why are you creating?</div><div style={{fontSize:13,color:BRAND.muted,marginBottom:14}}>Pick up to 3</div><div>{GOALS.map(g=><span key={g} style={S.tag(profile.goals.includes(g))} onClick={()=>setProfile(p=>({...p,goals:toggle(p.goals,g,3)}))}>{g}</span>)}</div></>}
            {obStep===3&&<><div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Describe your brand</div><div style={{fontSize:13,color:BRAND.muted,marginBottom:14}}>Your story, values, and audience</div><textarea style={{...S.input,height:130,resize:"vertical"}} placeholder="e.g. I'm a mom of 2 who left corporate..." value={profile.brand} onChange={e=>setProfile(p=>({...p,brand:e.target.value}))}/></>}
            {obStep===4&&<><div style={{fontSize:22,fontWeight:800,marginBottom:6}}>Your content vibe?</div><div style={{fontSize:13,color:BRAND.muted,marginBottom:14}}>How do you want to come across?</div><div>{VIBES.map(v=><span key={v} style={S.tag(profile.vibe===v)} onClick={()=>setProfile(p=>({...p,vibe:v}))}>{v}</span>)}</div></>}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
            {obStep>0&&<button style={S.outBtn} onClick={()=>setObStep(s=>s-1)}>← Back</button>}
            {obStep<steps.length-1
              ?<button style={{...S.bigBtn(!!ok),marginLeft:"auto"}} disabled={!ok} onClick={()=>setObStep(s=>s+1)}>Next →</button>
              :<button style={{...S.rainbowBtn,marginLeft:"auto"}} onClick={()=>{
                if(user){ generateStrategy(user); setScreen("app"); }
                else setShowAuth(true);
              }}>{loading?"Building...":"Save & Generate Strategy →"}</button>
            }
          </div>
          {/* Already have account link */}
          {obStep===4&&!user&&<div style={{textAlign:"center",marginTop:16,fontSize:13,color:BRAND.muted}}>Already have an account? <span style={{cursor:"pointer",fontWeight:700,color:BRAND.black}} onClick={()=>{setAuthMode("login");setShowAuth(true);}}>Sign in</span></div>}
        </div>
      </div>
    );
  }

  // ── Upgrade ─────────────────────────────────────────────────
  if(screen==="upgrade") {
    const plans=[
      {name:"Free",price:"$0",sub:"Forever free",features:["15 AI generations / month","Up to 3 platforms","Full onboarding & strategy"],cta:"Current Plan",pro:false},
      {name:"Creator",price:billing==="monthly"?"$19":"$15",sub:billing==="monthly"?"per month":"per month, billed annually",features:["Unlimited AI generations","All platforms","All 9 sections","Priority support","Save conversations"],cta:"Start Creator →",pro:true},
    ];
    return (
      <div style={S.page}>
        <div style={S.topbar}>
          <div style={{fontSize:13,fontWeight:700}}><span style={gradText(BRAND.rainbow)}>CREATORS STUDIO</span></div>
          <button style={S.outBtn} onClick={()=>setScreen("app")}>← Back</button>
        </div>
        <div style={{maxWidth:700,margin:"60px auto",padding:"0 24px"}}>
          <div style={{fontSize:44,fontWeight:900,letterSpacing:-2,marginBottom:8}}>Choose your plan</div>
          <div style={{color:BRAND.muted,marginBottom:36}}>Unlock unlimited AI-powered content creation</div>
          <div style={{display:"flex",gap:8,marginBottom:36}}>{["monthly","annual"].map(b=><button key={b} style={S.smBtn(b===billing)} onClick={()=>setBilling(b)}>{b==="monthly"?"Monthly":"Annual — save 21%"}</button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {plans.map(pl=>(
              <div key={pl.name} style={{...S.card,border:pl.pro?`2px solid ${BRAND.black}`:undefined,position:"relative"}}>
                {pl.pro&&<div style={{position:"absolute",top:-1,left:0,right:0,height:4,background:BRAND.rainbow}}/>}
                <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted,marginBottom:10}}>{pl.name}</div>
                <div style={{fontSize:44,fontWeight:900,letterSpacing:-2}}>{pl.price}</div>
                <div style={{fontSize:13,color:BRAND.muted,marginBottom:20}}>{pl.sub}</div>
                <div style={S.divider}/>
                {pl.features.map(f=><div key={f} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,fontSize:14}}><span style={{fontWeight:700}}>✓</span>{f}</div>)}
                <button style={{...S.bigBtn(pl.pro),width:"100%",marginTop:20,textAlign:"center"}} onClick={()=>{if(pl.pro){setIsPro(true);saveUserData({isPro:true});setScreen("app");}}}>{pl.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── App sections ─────────────────────────────────────────────
  function SectionHome() {
    return (
      <div>
        {!isPro&&profile.platforms.length>3&&(
          <div style={{...S.card,borderLeft:`4px solid #f4845f`,background:"#fff8f5",marginBottom:16}}>
            <div style={{fontWeight:700,marginBottom:8}}>⚠️ Platform Limit — Free Plan</div>
            <div style={{fontSize:14,color:BRAND.muted,marginBottom:14}}>You selected {profile.platforms.length} platforms. Free plan supports up to 3. Choose your top 3:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
              {profile.platforms.map(pl=>{
                const active=(profile.activePlatforms||[]).includes(pl);
                const atLimit=(profile.activePlatforms||[]).length>=3;
                return(<span key={pl} style={{...S.tag(active),opacity:!active&&atLimit?0.35:1,cursor:!active&&atLimit?"not-allowed":"pointer"}} onClick={()=>{if(!active&&atLimit)return;const cur=profile.activePlatforms||[];const upd=active?cur.filter(x=>x!==pl):[...cur,pl];const np={...profile,activePlatforms:upd};setProfile(np);saveUserData({profile:np});}}>{pl}</span>);
              })}
            </div>
            <div style={{fontSize:13,color:BRAND.muted}}>Active: <strong>{activePlatforms.join(", ")}</strong></div>
            <button style={{...S.smBtn(),marginTop:12}} onClick={()=>setScreen("upgrade")}>Upgrade for all platforms →</button>
          </div>
        )}
        <div style={{...S.card,background:BRAND.black,color:BRAND.white,borderColor:BRAND.black}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",opacity:0.5,marginBottom:8}}>Welcome back</div>
          <div style={{fontSize:26,fontWeight:900,letterSpacing:-1}}>{profile.name}</div>
          <div style={{opacity:0.6,marginTop:4,fontSize:14}}>{profile.job} · {activePlatforms.slice(0,3).join(" · ")}</div>
          {user&&<div style={{opacity:0.4,marginTop:2,fontSize:12}}>{user.email}</div>}
          {pack?.angle&&<div style={{marginTop:18,padding:14,background:"rgba(255,255,255,0.08)",fontSize:14,lineHeight:1.6,borderLeft:"3px solid #4ecdc4"}}>{pack.angle}</div>}
        </div>
        {pack?.pillars?.length>0&&(
          <div style={S.card}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:14}}>Content Pillars</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
              {pack.pillars.map((p,i)=>(<div key={i} style={{padding:18,background:PILLAR_COLORS[i]+"18",border:`2px solid ${PILLAR_COLORS[i]}50`}}><div style={{fontSize:26}}>{p.emoji}</div><div style={{fontWeight:800,marginTop:6,fontSize:14,color:PILLAR_COLORS[i]}}>{p.name}</div><div style={{fontSize:12,color:BRAND.muted,marginTop:4,lineHeight:1.4}}>{p.description}</div></div>))}
            </div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {[{l:"Ideas",v:ideas.length},{l:"Picked",v:picked.length},{l:"Months",v:monthPlans.filter(Boolean).length},{l:"Saved Chats",v:savedChats.length}].map(st=>(<div key={st.l} style={{...S.card,textAlign:"center",marginBottom:0}}><div style={{fontSize:34,fontWeight:900}}>{st.v}</div><div style={{fontSize:11,color:BRAND.muted,marginTop:4,letterSpacing:0.5,textTransform:"uppercase"}}>{st.l}</div></div>))}
        </div>
      </div>
    );
  }

  function SectionStrategy() {
    return (
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:18}}>Your Strategy</div>
        {!pack?<div style={{color:BRAND.muted}}>Complete onboarding first.</div>:<>
          <div style={{padding:18,background:"#f9f9f9",borderLeft:"4px solid #4ecdc4",marginBottom:14}}><div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#4ecdc4",marginBottom:6}}>Content Angle</div><div style={{fontSize:15,lineHeight:1.7}}>{pack.angle}</div></div>
          <div style={{padding:18,background:"#f9f9f9",borderLeft:"4px solid #c77dff",marginBottom:22}}><div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#c77dff",marginBottom:6}}>Voice & Style</div><div style={{fontSize:15,lineHeight:1.7}}>{pack.voice}</div></div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:14}}>Content Pillars</div>
          {pack.pillars?.map((p,i)=>(<div key={i} style={{display:"flex",gap:16,alignItems:"center",padding:"14px 0",borderBottom:`1px solid ${BRAND.border}`}}><div style={{width:6,alignSelf:"stretch",background:PILLAR_COLORS[i],flexShrink:0,borderRadius:2}}/><div style={{fontSize:28,minWidth:40}}>{p.emoji}</div><div><div style={{fontWeight:800,fontSize:15,color:PILLAR_COLORS[i]}}>{p.name}</div><div style={{fontSize:13,color:BRAND.muted,marginTop:3,lineHeight:1.5}}>{p.description}</div></div></div>))}
          <button style={{...S.bigBtn(),marginTop:20}} onClick={()=>setNav(2)}>Plan Your First Month →</button>
        </>}
      </div>
    );
  }

  function SectionMonthly() {
    return (
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:18}}>Monthly Plan</div>
        <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>{Array.from({length:Math.max(3,monthPlans.length+1)}).map((_,i)=><button key={i} style={S.smBtn(i===curMonth)} onClick={()=>setCurMonth(i)}>Month {i+1}</button>)}</div>
        {monthPlans[curMonth]?(
          <div>
            <div style={{fontSize:20,fontWeight:900,marginBottom:4}}>Month {curMonth+1}: {monthPlans[curMonth].focus}</div>
            <div style={{fontSize:13,color:BRAND.muted,marginBottom:18}}>Focus: {monthPlans[curMonth].userInput}</div>
            {monthPlans[curMonth].weeklyThemes?.map((w,i)=><div key={i} style={{display:"flex",gap:20,padding:"12px 0",borderBottom:`1px solid ${BRAND.border}`,fontSize:14,alignItems:"center"}}><div style={{fontWeight:700,minWidth:60,fontSize:11,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted}}>Week {i+1}</div><div>{w}</div></div>)}
            {monthPlans[curMonth].tip&&<div style={{padding:14,background:"#f9f9f9",marginTop:18,fontSize:14,borderLeft:"3px solid #f9c74f"}}>💡 {monthPlans[curMonth].tip}</div>}
            <button style={{...S.bigBtn(),marginTop:20}} onClick={()=>setNav(3)}>Generate Content Ideas →</button>
          </div>
        ):(
          <div>
            <div style={{fontSize:14,color:BRAND.muted,marginBottom:10}}>What's your focus this month? <span style={{opacity:0.6}}>(optional)</span></div>
            <input style={{...S.input,marginBottom:14}} placeholder="e.g. launching my new service..." value={monthInput} onChange={e=>setMonthInput(e.target.value)}/>
            <button style={S.rainbowBtn} onClick={()=>genMonthPlan(curMonth)}>{loading==="month"+curMonth?"Planning...":"Generate Month "+(curMonth+1)+" Plan"}</button>
          </div>
        )}
      </div>
    );
  }

  function SectionIdeas() {
    return (
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:18}}>Content Ideas</div>
        {pack?.pillars?.length>0&&(<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18,padding:14,background:"#f9f9f9",border:`1px solid ${BRAND.border}`}}><span style={{fontSize:11,fontWeight:700,letterSpacing:1,color:BRAND.muted,textTransform:"uppercase",alignSelf:"center",marginRight:4}}>Pillars:</span>{pack.pillars.map((p,i)=>(<span key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:PILLAR_COLORS[i]+"20",border:`1.5px solid ${PILLAR_COLORS[i]}`,fontSize:12,fontWeight:700,color:PILLAR_COLORS[i]}}><span style={{width:8,height:8,borderRadius:"50%",background:PILLAR_COLORS[i],display:"inline-block"}}/>{p.emoji} {p.name}</span>))}</div>)}
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:18}}><span style={{fontSize:13,color:BRAND.muted}}>Generate</span>{[5,10,15,20,30].map(n=><button key={n} style={S.smBtn(n===ideaCount)} onClick={()=>setIdeaCount(n)}>{n}</button>)}<span style={{fontSize:13,color:BRAND.muted}}>ideas</span></div>
        <button style={S.rainbowBtn} onClick={genIdeas}>{loading==="ideas"?"Generating...":"Generate Ideas"}</button>
        {ideas.length>0&&(<div style={{marginTop:22}}>{ideas.map((idea,i)=>{const pc=pillarColor(idea.pillar);const isPicked=!!picked.find(p=>p.title===idea.title);return(<div key={i} style={{display:"flex",alignItems:"stretch",marginBottom:8,border:`1px solid ${BRAND.border}`,overflow:"hidden",background:isPicked?"#f9f9f9":BRAND.white}}><div style={{width:6,background:pc,flexShrink:0}}/><div style={{flex:1,padding:"12px 14px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1,paddingRight:12}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}><span style={{fontSize:11,fontWeight:700,padding:"2px 10px",background:pc+"20",color:pc,border:`1px solid ${pc}`,letterSpacing:0.3}}>{pack?.pillars?.find(p=>p.name===idea.pillar)?.emoji} {idea.pillar}</span><span style={{fontSize:11,color:BRAND.muted,letterSpacing:0.3,textTransform:"uppercase"}}>{idea.platform} · {idea.format}</span></div><div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{idea.title}</div><div style={{fontSize:13,color:BRAND.muted,fontStyle:"italic"}}>"{idea.hook}"</div></div><button style={S.smBtn(isPicked)} onClick={()=>{const has=picked.find(p=>p.title===idea.title);const u=has?picked.filter(p=>p.title!==idea.title):[...picked,idea];setPicked(u);saveUserData({picked:u});}}>{isPicked?"✓ Picked":"Pick"}</button></div></div></div>);})}{picked.length>0&&<button style={{...S.bigBtn(),marginTop:12}} onClick={()=>setNav(4)}>View Picked ({picked.length}) →</button>}</div>)}
      </div>
    );
  }

  function SectionPicker() {
    return (
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:18}}>Content Picker — {picked.length} selected</div>
        {picked.length===0?<div style={{color:BRAND.muted}}>No ideas picked yet.</div>:<>{picked.map((idea,i)=>{const pc=pillarColor(idea.pillar);return(<div key={i} style={{display:"flex",alignItems:"stretch",marginBottom:8,border:`1px solid ${BRAND.border}`,overflow:"hidden"}}><div style={{width:6,background:pc,flexShrink:0}}/><div style={{flex:1,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{fontSize:11,fontWeight:700,padding:"2px 10px",background:pc+"20",color:pc,border:`1px solid ${pc}`}}>{pack?.pillars?.find(p=>p.name===idea.pillar)?.emoji} {idea.pillar}</span><div style={{fontWeight:700,fontSize:14,marginTop:8}}>{idea.title}</div><div style={{fontSize:11,color:BRAND.muted,letterSpacing:0.5,textTransform:"uppercase",marginTop:3}}>{idea.platform} · {idea.format}</div></div><button style={{...S.smBtn(false),fontSize:11}} onClick={()=>{const u=picked.filter(p=>p.title!==idea.title);setPicked(u);saveUserData({picked:u});}}>Remove</button></div></div>);})}<button style={{...S.bigBtn(),marginTop:14}} onClick={()=>setNav(5)}>Create Shoot Plans →</button></>}
      </div>
    );
  }

  function SectionShoot() {
    return (
      <div>
        {picked.length===0?<div style={{...S.card,color:BRAND.muted}}>Pick some ideas first.</div>:picked.map((idea,i)=>{const plan=shoots[idea.title];const pc=pillarColor(idea.pillar);return(<div key={i} style={{...S.card,borderLeft:`4px solid ${pc}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}><div><span style={{fontSize:11,fontWeight:700,padding:"2px 10px",background:pc+"20",color:pc,border:`1px solid ${pc}`}}>{idea.pillar}</span><div style={{fontSize:17,fontWeight:800,marginTop:8}}>{idea.title}</div><div style={{fontSize:12,color:BRAND.muted,marginTop:3}}>{idea.platform} · {idea.format}</div></div><button style={S.rainbowBtn} onClick={()=>genShoot(idea)}>{loading==="shoot_"+idea.title?"...":plan?"Regen":"Generate"}</button></div>{plan&&<><EditableBlock label="Script / Talking Points" text={plan.script} onSave={(t)=>{const u={...shoots,[idea.title]:{...plan,script:t}};setShoots(u);saveUserData({shoots:u});}}/><div style={S.divider}/><div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted,marginBottom:10}}>Shot List</div>{plan.shotList?.map((sh,j)=><div key={j} style={{padding:"7px 0",borderBottom:`1px solid ${BRAND.border}`,fontSize:14}}>— {sh}</div>)}<div style={S.divider}/><div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted,marginBottom:10}}>Repurpose Ideas</div><div>{plan.repurpose?.map((r,j)=><span key={j} style={{display:"inline-block",padding:"5px 12px",background:PILLAR_COLORS[j%PILLAR_COLORS.length]+"20",border:`1px solid ${PILLAR_COLORS[j%PILLAR_COLORS.length]}40`,margin:"3px",fontSize:12,fontWeight:600}}>{r}</span>)}</div></>}</div>);})}
        {picked.length>0&&<button style={S.bigBtn()} onClick={()=>setNav(6)}>Generate Hooks & Captions →</button>}
      </div>
    );
  }

  function SectionHooks() {
    return (
      <div>
        {picked.length===0?<div style={{...S.card,color:BRAND.muted}}>Pick some ideas first.</div>:picked.map((idea,i)=>{const data=hooks[idea.title];const pc=pillarColor(idea.pillar);return(<div key={i} style={{...S.card,borderLeft:`4px solid ${pc}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><span style={{fontSize:11,fontWeight:700,padding:"2px 10px",background:pc+"20",color:pc,border:`1px solid ${pc}`}}>{idea.pillar}</span><div style={{fontSize:17,fontWeight:800,marginTop:8}}>{idea.title}</div></div><button style={S.rainbowBtn} onClick={()=>genHooks(idea)}>{loading==="hooks_"+idea.title?"...":data?"Regen":"Generate Hooks"}</button></div>{data&&<><div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted,marginBottom:10}}>Hooks</div>{data.hooks?.map((h,j)=><EditableBlock key={j} label={h.type} text={h.text} onSave={(t)=>{const hs=[...data.hooks];hs[j]={...h,text:t};const u={...hooks,[idea.title]:{...data,hooks:hs}};setHooks(u);saveUserData({hooks:u});}}/>)}<div style={S.divider}/><div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted,marginBottom:10}}>Captions</div>{data.captions?.map((c,j)=><EditableBlock key={j} label={c.platform} text={c.text+(c.cta?"\n\nCTA: "+c.cta:"")} onSave={(t)=>{const cs=[...data.captions];cs[j]={...c,text:t};const u={...hooks,[idea.title]:{...data,captions:cs}};setHooks(u);saveUserData({hooks:u});}}/>)}</>}</div>);})}
        {picked.length>0&&<button style={S.bigBtn()} onClick={()=>setNav(7)}>Go to Scheduler →</button>}
      </div>
    );
  }

  function SectionScheduler() {
    const pc2=(name)=>pillarColor(name);
    return (
      <div style={{position:"relative"}}>
        {dragItem&&<div style={{position:"fixed",left:dragPos.x+10,top:dragPos.y+10,zIndex:9999,pointerEvents:"none",padding:"8px 14px",background:pc2(dragItem.item.pillar),color:"#fff",fontSize:12,fontWeight:700,maxWidth:160,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",opacity:0.92}}>{dragItem.item.title}</div>}
        <div style={{...S.card,marginBottom:12}}><div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:4}}>4-Week Content Scheduler</div><div style={{fontSize:13,color:BRAND.muted}}>Click and drag ideas onto the calendar</div></div>
        <div data-pool="true" style={{...S.card,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted,marginBottom:10}}>Unscheduled ({unscheduled.length})</div>
          {picked.length===0&&<div style={{fontSize:13,color:BRAND.muted}}>Pick some ideas first.</div>}
          {unscheduled.length===0&&picked.length>0&&<div style={{fontSize:13,color:BRAND.muted,fontStyle:"italic"}}>All ideas scheduled! 🎉</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{unscheduled.map((idea,i)=>{const pc=pc2(idea.pillar);return(<div key={i} onMouseDown={e=>startDrag(e,idea,null)} onTouchStart={e=>startDrag(e,idea,null)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:BRAND.white,border:`2px solid ${pc}`,cursor:"grab",userSelect:"none",fontSize:13,fontWeight:600,WebkitUserSelect:"none"}}><span style={{width:8,height:8,borderRadius:"50%",background:pc,display:"inline-block",flexShrink:0}}/><span style={{maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{idea.title}</span><span style={{fontSize:10,color:BRAND.muted}}>{idea.format}</span></div>);})}</div>
        </div>
        {WEEKS.map(week=>(<div key={week} style={{...S.card,marginBottom:10}}><div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>WEEK {week}</div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>{DAYS.map(day=>{const key=`w${week}_${day}`;const slotIdea=slots[key];const isOver=dragOver===key;const pc=slotIdea?pc2(slotIdea.pillar):null;return(<div key={day} data-slot={key} style={{minHeight:90,border:`2px ${isOver?"solid":"dashed"} ${isOver?"#4ecdc4":BRAND.border}`,background:isOver?"#e8fffe":slotIdea?pc+"15":"#fafafa",padding:6,boxSizing:"border-box",transition:"border-color 0.1s,background 0.1s"}}><div style={{fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",color:isOver?"#4ecdc4":BRAND.muted,marginBottom:4}}>{day}</div>{slotIdea?(<div onMouseDown={e=>startDrag(e,slotIdea,key)} onTouchStart={e=>startDrag(e,slotIdea,key)} style={{padding:"6px 7px",background:pc,cursor:"grab",userSelect:"none",WebkitUserSelect:"none",position:"relative"}}><div style={{fontSize:10,fontWeight:700,color:"#fff",lineHeight:1.3,marginBottom:2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{slotIdea.title}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.8)"}}>{slotIdea.format}</div><button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();const ns={...slots};delete ns[key];setSlots(ns);saveUserData({slots:ns});}} style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.35)",color:"#fff",border:"none",cursor:"pointer",fontSize:10,width:15,height:15,display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>×</button></div>):(<div style={{fontSize:9,color:BRAND.border,textAlign:"center",marginTop:16,pointerEvents:"none"}}>drop here</div>)}</div>);})</div></div>))}
        <button style={{...S.smBtn(false),marginTop:4}} onClick={()=>{setSlots({});saveUserData({slots:{}});}}>Clear Schedule</button>
      </div>
    );
  }

  function SectionAnalytics() {
    return (
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:22}}>Progress & Analytics</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:26}}>{[{l:"Posts Done",v:stats.posted},{l:"Streak",v:stats.streak+"🔥"},{l:"In Pipeline",v:picked.length},{l:"Months",v:monthPlans.filter(Boolean).length}].map(st=>(<div key={st.l} style={{padding:18,background:"#f9f9f9",textAlign:"center",border:`1px solid ${BRAND.border}`}}><div style={{fontSize:34,fontWeight:900}}>{st.v}</div><div style={{fontSize:11,color:BRAND.muted,marginTop:4,letterSpacing:0.5,textTransform:"uppercase"}}>{st.l}</div></div>))}</div>
        {pack?.pillars?.length>0&&<><div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted,marginBottom:14}}>Pillar Coverage</div>{pack.pillars.map((p,i)=>{const cnt=picked.filter(id=>id.pillar===p.name).length;const pct=picked.length?Math.round((cnt/picked.length)*100):0;return(<div key={i} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}><span style={{fontWeight:600,color:PILLAR_COLORS[i]}}>{p.emoji} {p.name}</span><span style={{color:BRAND.muted}}>{cnt} ideas ({pct}%)</span></div><div style={{background:"#f0f0f0",height:7}}><div style={{background:PILLAR_COLORS[i],height:7,width:`${pct}%`,transition:"width 0.3s"}}/></div></div>);})}</>}
        <div style={{display:"flex",gap:12,marginTop:22}}>
          <button style={S.bigBtn()} onClick={()=>{const u={...stats,posted:stats.posted+1};setStats(u);saveUserData({stats:u});}}>+ Mark Post Done</button>
          <button style={S.outBtn} onClick={()=>{const u={...stats,streak:stats.streak+1};setStats(u);saveUserData({stats:u});}}>+ Streak Day</button>
        </div>
      </div>
    );
  }

  function SectionAdvisor() {
    return (
      <div style={S.card}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:BRAND.muted,marginBottom:18}}>AI Advisor</div>
        <div ref={chatRef} style={{height:340,overflowY:"auto",background:"#f9f9f9",padding:18,marginBottom:14,border:`1px solid ${BRAND.border}`}}>
          {chat.length===0&&<div style={{color:BRAND.muted,textAlign:"center",marginTop:90,fontSize:14}}>Ask me anything about your content strategy 💬</div>}
          {chat.map((m,i)=>(<div key={i} style={{marginBottom:14,display:"flex",flexDirection:m.role==="user"?"row-reverse":"row"}}><div style={{maxWidth:"78%",padding:"11px 15px",fontSize:14,lineHeight:1.6,background:m.role==="user"?BRAND.black:BRAND.white,color:m.role==="user"?BRAND.white:BRAND.black,border:`1px solid ${BRAND.border}`}}>{m.content}</div></div>))}
          {loading==="chat"&&<div style={{color:BRAND.muted,fontSize:13,fontStyle:"italic"}}>Thinking...</div>}
        </div>
        <div style={{display:"flex",gap:10,marginBottom:14}}><input style={{...S.input,flex:1}} placeholder="Ask your AI advisor..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/><button style={S.rainbowBtn} onClick={sendChat}>Send</button></div>
        <div style={{display:"flex",gap:10}}>
          <button style={S.outBtn} onClick={()=>{if(chat.length>0){const s=[...savedChats,{date:new Date().toLocaleDateString(),msgs:chat}];setSavedChats(s);setChat([]);saveUserData({savedChats:s,chat:[]});}}}>Save & Clear</button>
          {savedChats.length>0&&<span style={{fontSize:13,color:BRAND.muted,alignSelf:"center"}}>{savedChats.length} saved</span>}
        </div>
        {savedChats.length>0&&<div style={{marginTop:18}}><div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:BRAND.muted,marginBottom:10}}>Saved Conversations</div>{savedChats.map((c,i)=>(<div key={i} style={{padding:10,border:`1px solid ${BRAND.border}`,marginBottom:8,cursor:"pointer",background:"#f9f9f9"}} onClick={()=>setChat(c.msgs)}><div style={{fontWeight:600,fontSize:13}}>Conversation {i+1}</div><div style={{fontSize:12,color:BRAND.muted}}>{c.date} · {c.msgs.length} messages</div></div>))}</div>}
      </div>
    );
  }

  const SECTIONS=[SectionHome,SectionStrategy,SectionMonthly,SectionIdeas,SectionPicker,SectionShoot,SectionHooks,SectionScheduler,SectionAnalytics,SectionAdvisor];
  const NAV_LABELS=["Home","Strategy","Monthly Plan","Ideas","Picker","Shoot Plan","Hooks","Scheduler","Analytics","Advisor"];
  const CurrentSection=SECTIONS[nav]||SectionHome;
  const genPct=Math.min((gens/FREE_LIMIT)*100,100);

  if(authLoading) return <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:14,color:BRAND.muted}}>Loading...</div></div>;

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div style={{fontSize:13,fontWeight:700}}><span style={gradText(BRAND.rainbow)}>CREATORS STUDIO</span><span style={{color:BRAND.muted,fontWeight:400,fontSize:12}}> by Curated Niche Studios</span></div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          {!isPro&&(<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end"}}><div style={{fontSize:10,color:BRAND.muted,letterSpacing:0.5,marginBottom:3}}>{gens}/{FREE_LIMIT} USES</div><div style={{width:80,height:4,background:BRAND.border}}><div style={{width:`${genPct}%`,height:4,background:genPct>80?"#f4845f":"#4ecdc4",transition:"width 0.3s"}}/></div></div>)}
          {isPro&&<span style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",...gradText(BRAND.rainbow)}}>✦ CREATOR</span>}
          {!isPro&&<button style={S.smBtn()} onClick={()=>setScreen("upgrade")}>Upgrade</button>}
          {user
            ?<button style={{...S.outBtn,padding:"6px 12px",fontSize:11}} onClick={handleSignOut}>Sign Out</button>
            :<button style={{...S.outBtn,padding:"6px 12px",fontSize:11}} onClick={()=>setShowAuth(true)}>Sign In</button>
          }
        </div>
      </div>
      <div style={S.navBar}>{NAV_LABELS.map((label,i)=>{const locked=!pack&&i>0;return<button key={i} style={S.navItem(i===nav,locked)} onClick={()=>{if(!locked)setNav(i);}}>{label}</button>;})}</div>
      <div style={{maxWidth:900,margin:"0 auto",padding:"28px 20px"}}><CurrentSection/></div>
    </div>
  );
}
