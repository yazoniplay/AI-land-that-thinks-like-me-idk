import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Brain, Check, ChevronDown, FileText, Globe, PenLine, Plus, Sparkles, Trash2, UserRound, WandSparkles, Copy, ArrowUpRight, RotateCcw, Bot, MessageCircle, Send, CircleCheck, LoaderCircle, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

type Note={id:string,title:string,body:string};
type Profile={likes:string[],avoid:string[],level:string};
type Source={title:string,url:string};
const initialProfile:Profile={likes:['enkla och naturliga ord','korta meningar','behålla min egen röst'],avoid:['för professionellt språk','onödigt svåra ord'],level:'Årskurs 7 · Svenska som andraspråk'};
const read=<T,>(key:string,fallback:T):T=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v) as T:fallback}catch{return fallback}};
const store=(key:string,value:unknown)=>localStorage.setItem(key,JSON.stringify(value));
const URL='https://ihonwomrhvdgfmjjjtyr.supabase.co';
const KEY='sb_publishable_gl2xI-N4Ea8hkJOkInwPsA_iw2RC-ja';
async function createWithAI(task:string,notes:string,current:string,research:boolean){
 const response=await fetch(URL+'/functions/v1/writing-assistant',{method:'POST',headers:{'Content-Type':'application/json','apikey':KEY},body:JSON.stringify({mode:'create',task,notes,draft:current,language:'Swedish (Svenska)',research}),signal:AbortSignal.timeout(360000)});
 const data=await response.json().catch(()=>({error:'AI:n skickade ett svar som inte gick att läsa.'}));
 if(!response.ok)throw new Error(data.error||'AI:n kunde inte skapa texten just nu.');
 if(typeof data.text!=='string'||!data.text.trim())throw new Error('AI:n returnerade ingen text.');
 return {text:data.text,feedback:Array.isArray(data.feedback)?data.feedback as string[]:[],sources:Array.isArray(data.sources)?data.sources as Source[]:[],researched:Boolean(data.researched),provider:String(data.provider||'AI')};
}
export default function App(){
 const chatEndRef=useRef<HTMLDivElement|null>(null);
 const [page,setPage]=useState<'create'|'notes'|'profile'>('create');
 const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
 const [task,setTask]=useState('');
 const [followup,setFollowup]=useState('');
 const [result,setResult]=useState('');
 const [sources,setSources]=useState<Source[]>([]);
 const [researched,setResearched]=useState(false);
 const [provider,setProvider]=useState('');
 const [notes,setNotes]=useState<Note[]>(()=>read('tlm-notes',[]));
 const [profile,setProfile]=useState<Profile>(()=>read('tlm-profile',initialProfile));
 const [selected,setSelected]=useState<string[]>([]);
 const [noteTitle,setNoteTitle]=useState('');const [noteBody,setNoteBody]=useState('');
 const [research,setResearch]=useState(true);
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');const [phaseIndex,setPhaseIndex]=useState(0);const [elapsedSeconds,setElapsedSeconds]=useState(0);const workSteps=research?['Jag läser instruktionen och bryter ner uppgiften.','Jag går igenom dina valda anteckningar och skrivprofil.','Jag undersöker relevanta fakta och källor vid behov.','Jag skriver ihop hela arbetet och kontrollerar att det följer instruktionen.']:['Jag läser instruktionen och bryter ner uppgiften.','Jag går igenom dina valda anteckningar och skrivprofil.','Jag skriver ihop hela arbetet.','Jag gör en sista kontroll av texten.'];
 useEffect(()=>store('tlm-notes',notes),[notes]);useEffect(()=>store('tlm-profile',profile),[profile]);useEffect(()=>{if(!busy)return;const timer=window.setInterval(()=>setElapsedSeconds(s=>s+1),1000);return()=>window.clearInterval(timer)},[busy]);
 useEffect(()=>{if(busy||result)chatEndRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[busy,result]);
 const context=useMemo(()=>notes.filter(n=>selected.includes(n.id)).map(n=>n.title+': '+n.body).join('\n\n'),[notes,selected]);
 const profileContext='WRITING PROFILE: '+profile.level+'. Preferences: '+profile.likes.join(', ')+'. Avoid: '+profile.avoid.join(', ')+'.';
 const run=async(instruction:string,continuing=false)=>{
  if(!instruction.trim()||busy)return;setBusy(true);setPhaseIndex(0);setError('');setMessage('');setElapsedSeconds(0);if(!continuing){setResult('');setSources([]);setResearched(false);}
  try{const answer=await createWithAI(instruction,[context,profileContext].filter(Boolean).join('\n\n'),continuing?result:'',research);setResult(answer.text);setSources(answer.sources);setResearched(answer.researched);setProvider(answer.provider);setPhaseIndex(workSteps.length-1);setFollowup('');}
  catch(e){const msg=e instanceof Error?e.message:'Något gick fel. Försök igen.';setError(/timeout|timed out|signal timed out|abort/i.test(msg)?'AI:n nådde sin maximala väntetid. Din instruktion finns kvar — försök igen. Du behöver inte stänga av research.':msg);}
  finally{setBusy(false);}
 };
 const addNote=()=>{if(!noteTitle.trim()||!noteBody.trim())return;setNotes([{id:crypto.randomUUID(),title:noteTitle.trim(),body:noteBody.trim()},...notes]);setNoteTitle('');setNoteBody('');setMessage('Anteckningen sparades.');};
 const copy=async()=>{try{await navigator.clipboard.writeText(result);setMessage('Texten kopierades.');}catch{setMessage('Kunde inte kopiera automatiskt. Markera texten och kopiera.')}};
 return <div className="shell">
  <aside className={sidebarCollapsed?"sidebar collapsed":"sidebar"}><div className="brand"><div className="brandmark"><Brain size={21}/></div><div><b>think like me</b><small>din personliga AI-arbetsyta</small></div></div><div className="side-label">ARBETSYTA</div>
   <button className={page==='create'?'nav active':'nav'} title="New task" onClick={()=>{setPage('create');setTask('');setResult('');setSources([]);setError('');setMessage('')}}><WandSparkles size={18}/> Skapa med AI</button>
   <button className={page==='notes'?'nav active':'nav'} title="My notes" onClick={()=>setPage('notes')}><BookOpen size={18}/> Mina anteckningar <span className="count">{notes.length}</span></button>
   <button className={page==='profile'?'nav active':'nav'} title="Writing profile" onClick={()=>setPage('profile')}><UserRound size={18}/> Min skrivprofil</button>
   <div className="side-bottom"><div className="learning"><span className="pulse"/><div><b>Din stil utvecklas</b><small>Profilen sparas lokalt</small></div></div><small className="version">SKRIV- OCH SKOLARBETE · BETA</small></div>
  </aside>
  <main className="main"><header className="topbar"><div className="topbar-left"><button className="sidebar-toggle" onClick={()=>setSidebarCollapsed(v=>!v)} title={sidebarCollapsed?"Öppna sidofält":"Fäll ihop sidofält"} aria-label={sidebarCollapsed?"Öppna sidofält":"Fäll ihop sidofält"}>{sidebarCollapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button><div className="crumb">Workspace <span>/</span> {page==='create'?'Skapa med AI':page==='notes'?'Anteckningar':'Skrivprofil'}</div></div><div className="level"><span className="level-dot"/> Åk 7 · SVA <ChevronDown size={14}/></div></header>
  {page==='create'&&<section className="content">
   <div className="heading"><div><div className="eyebrow"><Sparkles size={14}/> DIN AI-ARBETSKOMPIS</div><h1>Vad ska vi <em>få gjort?</em></h1><p>Ge Think Like Me en uppgift. Den planerar, researchar och gör klart arbetet.</p></div><div className="avatar"><Bot size={22}/></div></div>
   <section className="workbot panel">
    <div className="workbot-head"><div className="workbot-avatar"><Bot size={20}/></div><div className="workbot-name"><b>Think Like Me</b><small>AI-arbetsbot · gör saker åt dig</small></div><span className={busy?'workbot-status active':'workbot-status'}><span className="status-dot"/>{busy?'Arbetar':'Redo'}</span></div>
    <div className="workbot-chat">
     <div className="bot-message"><div className="message-avatar"><Bot size={16}/></div><div className="bubble assistant-bubble"><b>Hej! Vad ska jag hjälpa dig att få gjort?</b><p>Skriv bara uppgiften med dina egna ord. Jag kan skapa hela arbetet och söka fakta när det behövs.</p></div></div>
     {task.trim()&&<div className="bot-message user-message"><div className="bubble user-bubble"><span>Din uppgift</span><p>{task}</p></div></div>}
     {busy&&<div className="bot-message"><div className="message-avatar"><Bot size={16}/></div><div className="bubble assistant-bubble working-bubble"><div className="working-title"><LoaderCircle size={15} className="spin-icon"/><b>Think Like Me arbetar</b><span className="elapsed-time">{elapsedSeconds<60?elapsedSeconds+" s":Math.floor(elapsedSeconds/60)+" min "+(elapsedSeconds%60)+" s"}</span></div><p className="live-status">Jag gör klart hela uppgiften och väntar på svaret från AI:n. Research och längre texter kan ta en stund.</p><div className="thinking-dots"><span/><span/><span/></div><small>Jag visar väntetiden, inte påhittade steg eller privata interna tankar.</small></div></div>}
     {result&&<div className="bot-message result-in-chat"><div className="message-avatar"><Bot size={16}/></div><div className="bubble assistant-bubble chat-result-bubble"><b>Här är arbetet</b><div className="chat-result-text">{result}</div>{sources.length>0&&<div className="chat-sources"><b><Globe size={14}/> Källor</b>{sources.map((s,i)=><a key={i} href={s.url} target="_blank" rel="noreferrer">{s.title||s.url}<ArrowUpRight size={12}/></a>)}</div>}<div className="chat-result-actions"><button className="secondary" onClick={copy}><Copy size={14}/> Kopiera</button></div></div></div>}
     <div ref={chatEndRef}/>
    </div>
    <div className="workbot-compose"><textarea className="task-input" value={task} onChange={e=>setTask(e.target.value)} placeholder="Beskriv vad du vill att jag ska skapa eller göra…"/><div className="compose-bottom"><label><input type="checkbox" checked={research} onChange={e=>setResearch(e.target.checked)}/><Globe size={15}/><span>Researcha på webben vid behov</span></label><button className="primary" onClick={()=>result?run('Ändra det färdiga arbetet enligt den här instruktionen: '+task,true):run(task)} disabled={!task.trim()||busy}>{busy?<><LoaderCircle size={15} className="spin-icon"/> Arbetar…</>:<><Send size={15}/> {result?'Skicka ändring':'Starta arbetet'}</>}</button></div></div>
   </section>
   <section className="context-panel"><div className="context-title"><div><BookOpen size={17}/><b>Använd mina anteckningar</b></div><button className="link" onClick={()=>setPage('notes')}>Hantera →</button></div><p>Valda anteckningar används som material till uppgiften.</p><div className="note-chips">{notes.length?notes.map(n=><button key={n.id} className={selected.includes(n.id)?'chip selected':'chip'} onClick={()=>setSelected(s=>s.includes(n.id)?s.filter(x=>x!==n.id):[...s,n.id])}>{selected.includes(n.id)&&<Check size={13}/>} {n.title}</button>):<span className="muted">Lägg till anteckningar om du vill att AI:n ska använda dem.</span>}</div>{context&&<div className="context-preview">Valt material: {context.slice(0,220)}{context.length>220?'…':''}</div>}</section>
   {error&&<div className="error-box">{error}</div>}
   {result&&<section className="panel result-panel"><div className="panel-head"><div><span className="step">02</span><b>Färdigt resultat</b></div><span className="tag"><Sparkles size={12}/> {researched?'Researchad':'AI-skapad'}</span></div><div className="result-text">{result}</div>
    {sources.length>0&&<div className="sources"><b><Globe size={15}/> Källor som användes</b>{sources.map((s,i)=><a key={i} href={s.url} target="_blank" rel="noreferrer">{s.title||s.url}<ArrowUpRight size={13}/></a>)}</div>}
    {research&&!researched&&<div className="research-note">Den här gången visas inga webbkällor. Om uppgiften kräver aktuella fakta kan du be AI:n att söka igen.</div>}
    {message&&<div className="feedback-line">{message}</div>}
    <div className="result-actions"><button className="secondary" onClick={()=>setTask(result)}><PenLine size={15}/> Redigera instruktion</button><button className="secondary" onClick={copy}><Copy size={15}/> Kopiera</button><button className="secondary" onClick={()=>run(task||'Gör en ny version',false)} disabled={busy}><RotateCcw size={15}/> Gör om</button></div>
    <div className="followup"><label>Vill du ändra något?</label><div><input value={followup} onChange={e=>setFollowup(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run('Ändra det färdiga arbetet enligt den här instruktionen: '+followup,true)}}} placeholder="T.ex. gör den längre och lägg till 2 exempel…"/><button className="primary" onClick={()=>run('Ändra det färdiga arbetet enligt den här instruktionen: '+followup,true)} disabled={!followup.trim()||busy}>Ändra <span>→</span></button></div></div>
   </section>}
   <div className="feedback-line">Tips: Skriv bara vad du vill få gjort — du behöver inte först skriva en färdig text.</div>
  </section>}
  {page==='notes'&&<section className="content"><div className="heading"><div><div className="eyebrow"><BookOpen size={14}/> DITT SKOLMATERIAL</div><h1>Mina <em>anteckningar.</em></h1><p>Spara saker du har lärt dig och använd dem när du skapar arbeten.</p></div></div><div className="panel note-form"><h3><Plus size={17}/> Lägg till anteckning</h3><input value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} placeholder="Rubrik, t.ex. Atomer"/><textarea value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Skriv eller klistra in dina anteckningar..." rows={5}/><div className="form-bottom"><span className="muted">Textanteckningar sparas på den här enheten.</span><button className="primary" onClick={addNote} disabled={!noteTitle.trim()||!noteBody.trim()}><Plus size={15}/> Spara</button></div></div><div className="notes-list"><div className="list-head"><b>Dina anteckningar</b><span>{notes.length} st</span></div>{notes.length?notes.map(n=><article className="note-card" key={n.id}><div className="note-icon"><FileText size={18}/></div><div className="note-content"><b>{n.title}</b><p>{n.body}</p></div><button className="icon-btn" title="Ta bort" onClick={()=>setNotes(ns=>ns.filter(x=>x.id!==n.id))}><Trash2 size={16}/></button></article>):<div className="blank"><BookOpen size={24}/><b>Inga anteckningar än</b><p>Lägg till skolanteckningar här.</p></div>}</div></section>}
  {page==='profile'&&<section className="content"><div className="heading"><div><div className="eyebrow"><Brain size={14}/> AI SOM FÖLJER DIN STIL</div><h1>Min <em>skrivprofil.</em></h1><p>Önskemål som följer med varje uppgift.</p></div></div><div className="panel profile-card"><div className="profile-top"><div className="profile-icon"><UserRound size={25}/></div><div><h3>Din skrivnivå</h3><p>{profile.level}</p></div><span className="tag">Personlig</span></div><div className="profile-section"><label>DET HÄR GILLAR DU</label><div className="preference-list">{profile.likes.map((x,i)=><span key={i} className="preference"><Check size={14}/>{x}</span>)}</div></div><div className="profile-section"><label>DET HÄR VILL DU UNDVIKA</label><div className="preference-list">{profile.avoid.map((x,i)=><span key={i} className="preference avoid">{x}</span>)}</div></div><div className="profile-end"><span className="muted">Profil och anteckningar sparas lokalt i webbläsaren.</span><button className="danger" onClick={()=>setProfile(initialProfile)}>Återställ profil</button></div></div></section>}
  </main></div>;
}
