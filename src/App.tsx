import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Brain, Check, ChevronDown, FileText, MessageCircle, PenLine, Plus, Sparkles, ThumbsDown, ThumbsUp, Trash2, UserRound, WandSparkles } from 'lucide-react';

type Note={id:string,title:string,body:string};
type Profile={likes:string[],avoid:string[],level:string};
const initialProfile:Profile={likes:['enkla och naturliga ord','korta meningar','behålla min egen röst'],avoid:['för professionellt språk','onödigt svåra ord'],level:'Årskurs 7 · Svenska som andraspråk'};
const read=<T,>(key:string,fallback:T):T=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v) as T:fallback}catch{return fallback}};
const store=(key:string,value:unknown)=>localStorage.setItem(key,JSON.stringify(value));
const sample='Jag tycker Steve är bra för han är modig och han kan bygga saker.';
const WRITING_SUPABASE_URL='https://ihonwomrhvdgfmjjjtyr.supabase.co';
const WRITING_SUPABASE_KEY='sb_publishable_gl2xI-N4Ea8hkJOkInwPsA_iw2RC-ja';
async function requestWritingAI(draft:string,notes:string,mode:'revise'|'feedback'='revise'){
  const response=await fetch(WRITING_SUPABASE_URL+'/functions/v1/writing-assistant',{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':WRITING_SUPABASE_KEY},
    body:JSON.stringify({draft,notes,mode,language:'Swedish (Svenska)'}),
  });
  const data=await response.json().catch(()=>({error:'AI:n skickade ett svar som inte gick att läsa.'}));
  if(!response.ok)throw new Error(data.error||'AI:n kunde inte svara just nu.');
  if(typeof data.text!=='string'||!data.text.trim())throw new Error('AI:n returnerade ingen text.');
  return {text:data.text,feedback:Array.isArray(data.feedback)?data.feedback as string[]:[]};
}
export default function App(){
 const [page,setPage]=useState<'write'|'notes'|'profile'>('write');
 const [draft,setDraft]=useState(sample); const [result,setResult]=useState('');
 const [notes,setNotes]=useState<Note[]>(()=>read('tlm-notes',[]));
 const [profile,setProfile]=useState<Profile>(()=>read('tlm-profile',initialProfile));
 const [selected,setSelected]=useState<string[]>([]);
 const [noteTitle,setNoteTitle]=useState(''); const [noteBody,setNoteBody]=useState('');
 const [feedback,setFeedback]=useState(''); const [isGenerating,setIsGenerating]=useState(false); const [aiFeedback,setAiFeedback]=useState<string[]>([]);
 useEffect(()=>store('tlm-notes',notes),[notes]); useEffect(()=>store('tlm-profile',profile),[profile]);
 const context=useMemo(()=>notes.filter(n=>selected.includes(n.id)).map(n=>n.title+': '+n.body).join('\n'),[notes,selected]);
 const learn=(kind:'good'|'bad'|'simple'|'natural')=>{
  const next={...profile,likes:[...profile.likes],avoid:[...profile.avoid]};
  const like=kind==='good'?'den här nivån passar mig':kind==='simple'?'ännu enklare ord':'naturligt språk';
  const avoid=kind==='bad'?'texten blev för professionell':kind==='simple'?'svåra ord':'robotaktigt språk';
  if(kind==='bad'||kind==='natural') {if(!next.avoid.includes(avoid))next.avoid.unshift(avoid)} else if(!next.likes.includes(like))next.likes.unshift(like);
  setProfile(next);setFeedback('Jag har uppdaterat din skrivprofil.');setTimeout(()=>setFeedback(''),2400);
 };
 const generate=async()=>{setIsGenerating(true);setResult('');setAiFeedback([]);setFeedback('');try{const answer=await requestWritingAI(draft,context,'revise');setResult(answer.text);setAiFeedback(answer.feedback);}catch(error){setFeedback(error instanceof Error?error.message:'AI:n kunde inte svara.');}finally{setIsGenerating(false);}};
 const addNote=()=>{if(!noteTitle.trim()||!noteBody.trim())return;setNotes([{id:crypto.randomUUID(),title:noteTitle.trim(),body:noteBody.trim()},...notes]);setNoteTitle('');setNoteBody('');};
 return <div className="shell">
  <aside className="sidebar"><div className="brand"><div className="brandmark"><Brain size={21}/></div><div><b>think like me</b><small>din personliga AI</small></div></div>
   <div className="side-label">ARBETSYTA</div>
   <button className={page==='write'?'nav active':'nav'} onClick={()=>setPage('write')}><PenLine size={18}/> Skrivassistent</button>
   <button className={page==='notes'?'nav active':'nav'} onClick={()=>setPage('notes')}><BookOpen size={18}/> Mina anteckningar <span className="count">{notes.length}</span></button>
   <button className={page==='profile'?'nav active':'nav'} onClick={()=>setPage('profile')}><UserRound size={18}/> Min skrivprofil</button>
   <div className="side-bottom"><div className="learning"><span className="pulse"/><div><b>Din stil utvecklas</b><small>Feedback sparas lokalt</small></div></div><small className="version">PERSONLIG SKRIVASSISTENT · BETA</small></div>
  </aside>
  <main className="main">
   <header className="topbar"><div className="crumb">Workspace <span>/</span> {page==='write'?'Skrivassistent':page==='notes'?'Anteckningar':'Skrivprofil'}</div><div className="level"><span className="level-dot"/> Åk 7 · SVA <ChevronDown size={14}/></div></header>
   {page==='write'&&<section className="content">
    <div className="heading"><div><div className="eyebrow"><Sparkles size={14}/> SKRIV MED DIN EGEN RÖST</div><h1>Skriv som <em>du</em>.</h1><p>Jag hjälper dig med svenskan utan att göra texten till någon annans.</p></div><div className="avatar"><Brain size={22}/></div></div>
    <div className="notice"><Sparkles size={16}/><span><b>Din personliga stil</b> · Jag använder dina önskemål och anteckningar när jag hjälper dig.</span></div>
    <div className="editor-grid"><section className="panel editor"><div className="panel-head"><div><span className="step">01</span><b>Din text</b></div><button className="quiet" onClick={()=>{setDraft('');setResult('')}}>Rensa</button></div><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Skriv din text här..." spellCheck/><div className="editor-foot"><span>{draft.trim()?draft.trim().split(/\s+/).length:0} ord</span><button className="primary" onClick={generate} disabled={!draft.trim()||isGenerating}><WandSparkles size={16}/> {isGenerating?'AI:n tänker…':'Hjälp mig skriva'} <span>→</span></button></div></section>
    <section className="panel output"><div className="panel-head"><div><span className="step">02</span><b>Din text, förbättrad</b></div><span className="tag"><Sparkles size={12}/> Din stil</span></div>{result?<><div className="result-text">{result}</div>{aiFeedback.length>0&&<div className="ai-feedback">{aiFeedback.map((item,i)=><p key={i}>{item}</p>)}</div>}<div className="feedback"><span>Passar det här din stil?</span><button title="Ja, det låter som jag" onClick={()=>learn('good')}><ThumbsUp size={15}/></button><button title="Nej, för professionellt" onClick={()=>learn('bad')}><ThumbsDown size={15}/></button><button className="text-feedback" onClick={()=>learn('natural')}>Låter konstigt</button></div><div className="result-actions"><button className="secondary" onClick={()=>setDraft(result)}>Använd texten</button><button className="secondary" onClick={()=>navigator.clipboard?.writeText(result)}><FileText size={15}/> Kopiera</button></div></>:<div className="empty-result"><div className="spark-box"><WandSparkles size={22}/></div><b>Din text visas här</b><p>AI:n gör små förbättringar och försöker behålla dina egna ord och idéer.</p></div>}</section></div>
    <section className="context-panel"><div className="context-title"><div><BookOpen size={17}/><b>Använd mina anteckningar</b></div><button className="link" onClick={()=>setPage('notes')}>Visa alla →</button></div><p>Välj material som AI:n ska använda för att hålla sig till det du har lärt dig.</p><div className="note-chips">{notes.length?notes.map(n=><button key={n.id} className={selected.includes(n.id)?'chip selected':'chip'} onClick={()=>setSelected(s=>s.includes(n.id)?s.filter(x=>x!==n.id):[...s,n.id])}>{selected.includes(n.id)&&<Check size={13}/>} {n.title}</button>):<span className="muted">Du har inga anteckningar ännu.</span>}</div>{context&&<div className="context-preview">Valt material: {context.slice(0,160)}{context.length>160?'…':''}</div>}</section>
    <div className="feedback-line">{feedback||'Tips: Berätta när något inte låter som du. Då kan jag anpassa din skrivprofil.'}</div>
   </section>}
   {page==='notes'&&<section className="content"><div className="heading"><div><div className="eyebrow"><BookOpen size={14}/> DITT SKOLMATERIAL</div><h1>Mina <em>anteckningar.</em></h1><p>Spara saker du har lärt dig och använd dem när du skriver.</p></div></div><div className="panel note-form"><h3><Plus size={17}/> Lägg till anteckning</h3><input value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} placeholder="Rubrik, t.ex. Atomer"/><textarea value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Skriv eller klistra in dina anteckningar..." rows={5}/><div className="form-bottom"><span className="muted">Textanteckningar just nu · filimport kommer senare</span><button className="primary" onClick={addNote} disabled={!noteTitle.trim()||!noteBody.trim()}><Plus size={15}/> Spara anteckning</button></div></div><div className="notes-list"><div className="list-head"><b>Dina sparade anteckningar</b><span>{notes.length} st</span></div>{notes.length?notes.map(n=><article className="note-card" key={n.id}><div className="note-icon"><FileText size={18}/></div><div className="note-content"><b>{n.title}</b><p>{n.body}</p></div><button className="icon-btn" title="Ta bort" onClick={()=>setNotes(ns=>ns.filter(x=>x.id!==n.id))}><Trash2 size={16}/></button></article>):<div className="blank"><BookOpen size={24}/><b>Inga anteckningar än</b><p>Lägg till dina skolanteckningar här.</p></div>}</div></section>}
   {page==='profile'&&<section className="content"><div className="heading"><div><div className="eyebrow"><Brain size={14}/> AI SOM LÄR KÄNNA DIN STIL</div><h1>Min <em>skrivprofil.</em></h1><p>Det här är vad jag försöker komma ihåg om hur du vill skriva.</p></div></div><div className="panel profile-card"><div className="profile-top"><div className="profile-icon"><UserRound size={25}/></div><div><h3>Din skrivnivå</h3><p>{profile.level}</p></div><span className="tag">Personlig</span></div><div className="profile-section"><label>DET HÄR GILLAR DU</label><div className="preference-list">{profile.likes.map((x,i)=><span key={i} className="preference"><Check size={14}/>{x}</span>)}</div></div><div className="profile-section"><label>DET HÄR VILL DU UNDVIKA</label><div className="preference-list">{profile.avoid.map((x,i)=><span key={i} className="preference avoid">{x}</span>)}</div></div><div className="profile-section"><label>LÄR MIG MER</label><p className="muted">Du kan lära mig direkt från skrivassistenten genom att ge feedback efter en text.</p><div className="quick-feedback"><button className="secondary" onClick={()=>learn('simple')}>Använd enklare ord</button><button className="secondary" onClick={()=>learn('natural')}>Mer naturligt</button></div></div><div className="profile-end"><span className="muted">Profil och anteckningar sparas på den här enheten.</span><button className="danger" onClick={()=>{setProfile(initialProfile);setFeedback('')}}>Återställ profil</button></div></div>{feedback&&<div className="feedback-line">{feedback}</div>}</section>}
  </main>
 </div>
}
