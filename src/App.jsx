import React, { useState, useEffect, useRef } from "react";

/* =========================================================
   GradeGoal: Schulnoten & Grades  ·  Version 1.2.0
   Entwickelt von / developed by Simon Mählmann
   App-Namen hier ändern:
========================================================= */
const APP_NAME   = "GradeGoal";
const APP_SUB    = "Schulnoten & Grades";
const APP_VER    = "1.3.1";
const DEVELOPER  = "Simon Mählmann";

const uid = () => Math.random().toString(36).slice(2,10);
let THEME_DARK = false; /* wird beim Rendern gesetzt, steuert Notenfarben */

/* ---------- Speicher: window.storage (Claude) → localStorage (GitHub/Handy) → nur Sitzung ---------- */
const store = {
  async get(k){
    try{ if(window.storage){ const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } }catch(e){}
    try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){}
    return null;
  },
  async set(k,v){
    try{ if(window.storage){ await window.storage.set(k, JSON.stringify(v)); return; } }catch(e){}
    try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){}
  },
};

/* ---------- SVG-Icons (Stil: Lucide, 24er-Raster, Strichstärke 2) ---------- */
const P = {
  settings:<g><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></g>,
  star:<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  book:<g><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></g>,
  sigma:<path d="M18 7V4H6l6 8-6 8h12v-3"/>,
  target:<g><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></g>,
  pencil:<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>,
  moon:<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
  eye:<g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></g>,
  trash:<g><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></g>,
  download:<g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></g>,
  upload:<g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></g>,
  printer:<g><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></g>,
  info:<g><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></g>,
  lock:<g><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></g>,
  calendar:<g><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></g>,
  hash:<g><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/></g>,
  save:<g><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></g>,
  chart:<g><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></g>,
  chartDown:<g><path d="M22 17l-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/></g>,
  flat:<path d="M4 12h16"/>,
  alert:<g><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></g>,
};
const Ic = ({n,size=16,style,color}) => (
  <svg className="ico" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>{P[n]}</svg>
);

/* ---------- Übersetzungen ---------- */
const T = {
de:{
  tagline:"Noten eintragen. Ziele erreichen.", chooseLang:"Sprache wählen · Choose your language",
  start:"Los geht's", yourName:"Dein Name", school:"Deine Schule", optional:"optional",
  continue:"Weiter", skip:"Überspringen", back:"Zurück", add:"Hinzufügen",
  scale:"Notensystem", scaleGrades:"Noten 1–6", scaleGradesHint:"1 = sehr gut",
  scalePoints:"Punkte 0–15", scalePointsHint:"15 = beste Leistung", scaleCustom:"Eigene Skala",
  min:"Minimum", max:"Maximum", bestLow:"Kleinster Wert ist die beste Note",
  scaleWarn:"Hinweis: Bereits eingetragene Noten werden beim Wechsel nicht umgerechnet.",
  report:"Mein Zeugnis", avg:"Ø Gesamt", wishAvg:"Ø Wunsch", noGrades:"Noch keine Noten eingetragen",
  subjects:"Fächer", addSubject:"Neues Fach…", grade:"Note", wish:"Wunsch",
  empty:"Tippe auf ein Fach für Einzelnoten, Ziele und Notizen.",
  groups:"Ausgewählte Durchschnitte", groupsHint:"Berechne den Schnitt bestimmter Fächer separat – z. B. für Abschlüsse.",
  newGroup:"Neue Gruppe", presetNds:"Vorlage: Erw. Sekundarabschluss I (Niedersachsen)",
  presetCore:"Deutsch, Mathe, Englisch", presetRest:"Übrige Fächer",
  target:"Ziel-Ø", reached:"erreicht", notReached:"noch nicht erreicht",
  groupName:"Name der Gruppe", pickSubjects:"Fächer auswählen:", deleteGroup:"Gruppe löschen",
  reportGrade:"Zeugnisnote", wishGrade:"Wunschnote", calc:"Rechnerischer Schnitt", calcHint:"aus den Kategorien (gewichtet)",
  categories:"Kategorien & Einzelnoten", weight:"Gewichtung", newCat:"Eigene Kategorie…", addGrade:"Note…",
  weightSum:(s)=>"Summe der Gewichtung: "+s+" %",
  weightHint:"Die Gewichtungen werden im Verhältnis zueinander verrechnet – die Summe muss nicht genau 100 % sein.",
  onboardTitle:"Was möchtest du nutzen?",
  onboardHint:"Die App startet im einfachen Modus. Schalte frei, was du zusätzlich nutzen möchtest – du kannst das jederzeit in den Einstellungen ändern.",
  onboardInfo:"Was bedeuten diese Funktionen?",
  tendHint:"Tipp: Tendenznoten wie 2+ oder 3− kannst du direkt eintippen – sie zählen als 1,7 bzw. 3,3.",
  infoTarget:"Der Ziel-Ø ist der Durchschnitt, den diese Fächergruppe erreichen soll. ✓ oder ✗ zeigt dir, ob er aktuell erreicht ist.",
  goals:"Meine Ziele für dieses Fach", goalsPh:"z. B. In der nächsten Klassenarbeit eine 2 schreiben…",
  notes:"Notizen", notesPh:"z. B. Themen für die nächste Arbeit, Materialien…",
  deleteSubject:"Fach löschen", confirmDelete:"Wirklich löschen?",
  onTrack:"Wunsch erreicht", gap:"bis zum Wunsch",
  needCalc:"Zielrechner: Was brauche ich noch?",
  needIn:"Nächste Note in", needResult:(g)=>[`Du brauchst mindestens eine `,g,`, um deinen rechnerischen Schnitt auf die Wunschnote zu bringen.`],
  needSafe:"Dein Schnitt erreicht die Wunschnote schon – weiter so!",
  needImpossible:"Mit einer einzelnen Note ist die Wunschnote rechnerisch nicht mehr erreichbar. Nicht aufgeben – jede gute Note verbessert den Schnitt!",
  needMissing:"Trage zuerst eine Wunschnote ein.",
  trend:"Notenverlauf",
  trendUp:"Deine Kurve zeigt nach oben – weiter so!",
  trendDown:"Deine Kurve zeigt gerade nach unten – du schaffst das!",
  trendFlat:"Stabil unterwegs.",
  trendEmpty:"Trage mindestens zwei Einzelnoten ein, um deinen Verlauf zu sehen.",
  trendBest:"beste", trendWorst:"schlechteste",
  settings:"Einstellungen", profile:"Allgemeine Informationen", display:"Anzeige & Funktionen",
  simpleMode:"Einfacher Modus", simpleModeHint:"Zeigt nur Fächer, Noten und den Gesamtdurchschnitt.",
  featWish:"Wunschnoten", featCats:"Kategorien & Einzelnoten", featGroups:"Ausgewählte Durchschnitte",
  featCharts:"Grafischer Notenverlauf",
  shareChart:"Diagramm als Bild speichern",
  compare:"Halbjahresvergleich",
  darkMode:"Dunkles Design",
  terms:"Halbjahre & Profile", termsHint:"Lege z. B. „1. Halbjahr“ und „2. Halbjahr“ an – oder Profile für Geschwister.",
  newTerm:"Neu anlegen", termName:"Bezeichnung", active:"aktiv", activate:"Öffnen", deleteTerm:"Löschen",
  data:"Daten", exportBtn:"Sicherung exportieren", importBtn:"Sicherung importieren",
  dataHint:"Speichere deine Daten als Datei – wichtig vor einem Handywechsel.",
  importOk:"Daten erfolgreich importiert.", importErr:"Diese Datei konnte nicht gelesen werden. Wähle eine Sicherung im Format von " + APP_NAME + ".",
  printBtn:"Zeugnis drucken / als PDF speichern",
  resetBtn:"Alles zurücksetzen", resetConfirm:"Wirklich? Alle Noten, Fächer und Einstellungen werden gelöscht.",
  undoDeleted:"Gelöscht", undoBtn:"Rückgängig",
  about:"Über die App", aboutBtn:"Info & Impressum",
  aboutText:[
    APP_NAME + " hilft Schülerinnen und Schülern, Eltern und Lehrkräften, Zeugnisnoten im Blick zu behalten: Noten eintragen, Durchschnitte berechnen, Wunschnoten setzen und Ziele erreichen.",
    "Die App startet bewusst im einfachen Modus mit nur den Grundfunktionen. Alles Weitere schaltest du bei der Einrichtung oder später in den Einstellungen frei – ganz nach deinem Bedarf."
  ],
  aboutFeatTitle:"Funktionen im Überblick",
  aboutFeatures:[
    ["eye","Einfacher Modus","Zeigt nur Fächer, Zeugnisnoten und den Gesamtdurchschnitt – ideal für den schnellen Überblick oder jüngere Schülerinnen und Schüler."],
    ["star","Wunschnoten","Trage neben jeder Note dein Ziel ein. Die App zeigt dir, wie weit du noch entfernt bist – und feiert mit Konfetti, wenn du es erreichst."],
    ["book","Kategorien & Einzelnoten","Erfasse in jedem Fach Klassenarbeiten, mündliche Mitarbeit, Tests und Referate – oder lege eigene Kategorien an. Über die Gewichtung in % berechnet die App einen Notenvorschlag. Die Gewichtungen wirken im Verhältnis zueinander, die Summe muss nicht genau 100 % ergeben."],
    ["target","Zielrechner","Zeigt dir pro Kategorie, welche Note du in der nächsten Arbeit mindestens brauchst, um deine Wunschnote rechnerisch zu erreichen."],
    ["chart","Notenverlauf","Ein Liniendiagramm zeigt dir in jedem Fach, wie sich deine Einzelnoten über das Halbjahr entwickeln – nach oben ist dabei immer besser."],
    ["sigma","Ausgewählte Durchschnitte","Berechne den Schnitt bestimmter Fächergruppen separat – z. B. Deutsch, Mathe und Englisch für den Erweiterten Sekundarabschluss I in Niedersachsen (Vorlage enthalten). Mit einem Ziel-Ø zeigt die App an, ob die Vorgabe erreicht ist."],
    ["calendar","Halbjahre & Profile","Lege mehrere Datensätze an, z. B. für das 1. und 2. Halbjahr oder für Geschwister – jeweils mit eigenem Notensystem."],
    ["hash","Notensysteme","Noten 1–6, Oberstufen-Punkte 0–15 oder eine eigene Skala für andere Länder – einstellbar pro Halbjahr/Profil. Tendenznoten wie 2+ oder 3− werden automatisch als 1,7 bzw. 3,3 gerechnet."],
    ["save","Sicherung & Druck","Exportiere deine Daten als Datei (z. B. vor einem Handywechsel), importiere sie wieder, setze alles zurück oder drucke dein Zeugnis bzw. speichere es als PDF."],
    ["moon","Dunkles Design","Augenschonende dunkle Ansicht – in den Einstellungen umschaltbar."]
  ],
  aboutPrivacyTitle:"Datenschutz",
  aboutPrivacy:"Alle Daten bleiben ausschließlich auf deinem Gerät. Es werden keine Daten an Server übertragen, es gibt keine Werbung und es wird kein Konto benötigt.",
  legalTitle:"Impressum",
  developedBy:"Entwickelt von", contact:"Kontakt", version:"Version",
  langName:"Deutsch",
},
en:{
  tagline:"Track your grades. Reach your goals.", chooseLang:"Sprache wählen · Choose your language",
  start:"Let's go", yourName:"Your name", school:"Your school", optional:"optional",
  continue:"Continue", skip:"Skip", back:"Back", add:"Add",
  scale:"Grading system", scaleGrades:"Grades 1–6", scaleGradesHint:"1 = best (German system)",
  scalePoints:"Points 0–15", scalePointsHint:"15 = best", scaleCustom:"Custom scale",
  min:"Minimum", max:"Maximum", bestLow:"Lowest value is the best grade",
  scaleWarn:"Note: existing grades are not converted when switching systems.",
  report:"My report card", avg:"Overall Ø", wishAvg:"Wish Ø", noGrades:"No grades entered yet",
  subjects:"Subjects", addSubject:"New subject…", grade:"Grade", wish:"Wish",
  empty:"Tap a subject for single grades, goals and notes.",
  groups:"Selected averages", groupsHint:"Calculate the average of specific subjects separately – e.g. for diplomas.",
  newGroup:"New group", presetNds:"Preset: Extended certificate (Lower Saxony)",
  presetCore:"German, Maths, English", presetRest:"All other subjects",
  target:"Target Ø", reached:"reached", notReached:"not reached yet",
  groupName:"Group name", pickSubjects:"Select subjects:", deleteGroup:"Delete group",
  reportGrade:"Report grade", wishGrade:"Wish grade", calc:"Calculated average", calcHint:"from categories (weighted)",
  categories:"Categories & single grades", weight:"Weighting", newCat:"Custom category…", addGrade:"Grade…",
  weightSum:(s)=>"Weighting total: "+s+" %",
  weightHint:"Weightings are calculated relative to each other – the total does not need to be exactly 100 %.",
  onboardTitle:"What would you like to use?",
  onboardHint:"The app starts in simple mode. Turn on the extra features you want – you can change this anytime in the settings.",
  onboardInfo:"What do these features mean?",
  tendHint:"Tip: you can type tendency grades like 2+ or 3− – they count as 1.7 or 3.3.",
  infoTarget:"The target Ø is the average this subject group should reach. ✓ or ✗ shows whether it is currently met.",
  goals:"My goals for this subject", goalsPh:"e.g. Get a B in the next test…",
  notes:"Notes", notesPh:"e.g. Topics for the next test, materials…",
  deleteSubject:"Delete subject", confirmDelete:"Really delete?",
  onTrack:"Wish reached", gap:"to your wish",
  needCalc:"Goal calculator: what do I need?",
  needIn:"Next grade in", needResult:(g)=>[`You need at least `,g,` to bring your calculated average to your wish grade.`],
  needSafe:"Your average already meets your wish – keep it up!",
  needImpossible:"A single grade can no longer reach the wish grade mathematically. Don't give up – every good grade improves your average!",
  needMissing:"Enter a wish grade first.",
  trend:"Grade history",
  trendUp:"Your curve is pointing up – keep it up!",
  trendDown:"Your curve is pointing down right now – you've got this!",
  trendFlat:"Steady as you go.",
  trendEmpty:"Enter at least two single grades to see your history.",
  trendBest:"best", trendWorst:"worst",
  settings:"Settings", profile:"General information", display:"Display & features",
  simpleMode:"Simple mode", simpleModeHint:"Shows only subjects, grades and the overall average.",
  featWish:"Wish grades", featCats:"Categories & single grades", featGroups:"Selected averages",
  featCharts:"Grade history charts",
  shareChart:"Save chart as image",
  compare:"Term comparison",
  darkMode:"Dark theme",
  terms:"Terms & profiles", termsHint:"Create e.g. “1st term” and “2nd term” – or profiles for siblings.",
  newTerm:"Create new", termName:"Label", active:"active", activate:"Open", deleteTerm:"Delete",
  data:"Data", exportBtn:"Export backup", importBtn:"Import backup",
  dataHint:"Save your data as a file – important before switching phones.",
  importOk:"Data imported successfully.", importErr:"This file could not be read. Choose a backup in " + APP_NAME + " format.",
  printBtn:"Print report card / save as PDF",
  resetBtn:"Reset everything", resetConfirm:"Really? All grades, subjects and settings will be deleted.",
  undoDeleted:"Deleted", undoBtn:"Undo",
  about:"About this app", aboutBtn:"Info & legal notice",
  aboutText:[
    APP_NAME + " helps students, parents and teachers keep track of report grades: enter grades, calculate averages, set wish grades and reach goals.",
    "The app deliberately starts in simple mode with just the basics. You enable everything else during setup or later in the settings – exactly as much as you need."
  ],
  aboutFeatTitle:"Features at a glance",
  aboutFeatures:[
    ["eye","Simple mode","Shows only subjects, report grades and the overall average – ideal for a quick overview or younger students."],
    ["star","Wish grades","Enter your goal next to each grade. The app shows how far away you are – and celebrates with confetti when you reach it."],
    ["book","Categories & single grades","Record class tests, oral participation, quizzes and presentations for each subject – or create your own categories. Using the weighting in %, the app calculates a suggested grade. Weightings work relative to each other; the total does not have to be exactly 100 %."],
    ["target","Goal calculator","Shows you, per category, the minimum grade you need in the next test to reach your wish grade mathematically."],
    ["chart","Grade history","A line chart in every subject shows how your single grades develop over the term – up always means better."],
    ["sigma","Selected averages","Calculate the average of specific subject groups separately – e.g. German, Maths and English for the extended certificate in Lower Saxony (preset included). With a target Ø, the app shows whether the requirement is met."],
    ["calendar","Terms & profiles","Create several data sets, e.g. for the 1st and 2nd term or for siblings – each with its own grading system."],
    ["hash","Grading systems","Grades 1–6, upper-school points 0–15 or a custom scale for other countries – adjustable per term/profile. Tendency grades like 2+ or 3− are automatically counted as 1.7 or 3.3."],
    ["save","Backup & print","Export your data as a file (e.g. before switching phones), import it again, reset everything or print your report card / save it as a PDF."],
    ["moon","Dark theme","An eye-friendly dark view – switchable in the settings."]
  ],
  aboutPrivacyTitle:"Privacy",
  aboutPrivacy:"All data stays on your device only. Nothing is sent to any server, there are no ads and no account is needed.",
  legalTitle:"Legal notice",
  developedBy:"Developed by", contact:"Contact", version:"Version",
  langName:"English",
}};

/* ---------- Standard-Daten ---------- */
const defaultCats = () => [
  { id:uid(), name:{de:"Klassenarbeiten",en:"Class tests"}, weight:50, grades:[] },
  { id:uid(), name:{de:"Mündliche Mitarbeit",en:"Oral participation"}, weight:30, grades:[] },
  { id:uid(), name:{de:"Tests",en:"Quizzes"}, weight:10, grades:[] },
  { id:uid(), name:{de:"Referate",en:"Presentations"}, weight:10, grades:[] },
];
const DEFAULT_SUBJECTS = [
  ["Deutsch","German"],["Mathematik","Maths"],["Englisch","English"],
  ["Biologie","Biology"],["Chemie","Chemistry"],["Physik","Physics"],
  ["Informatik","Computer science"],["Geschichte","History"],["Erdkunde","Geography"],["Politik","Politics"],
  ["Religion / Werte und Normen","Religion / Ethics"],["Sport","PE"],["Kunst","Art"],["Musik","Music"],["Französisch","French"],
];
const freshSubjects = () => DEFAULT_SUBJECTS.map(([de,en]) => ({
  id:uid(), name:{de,en}, grade:"", wish:"", cats:defaultCats(), goals:"", notes:"",
}));
const freshDataset = (label) => ({
  id:uid(), label, scale:{type:"grades",min:1,max:6,bestLow:true}, subjects:freshSubjects(), groups:[],
});
const freshState = () => {
  const d = freshDataset("1. Halbjahr / 1st term");
  return {
    v:1, lang:"de", dark:false, screen:"start", selSubject:null, aboutFrom:null,
    name:"", school:"",
    features:{ simple:true, wish:true, cats:true, groups:true, charts:true },
    activeId:d.id, datasets:[d],
  };
};

/* ---------- Helfer ---------- */
/* Einzelnoten sind entweder Strings (alt) oder {v, d}-Objekte mit Datum (neu) */
const gv = (g)=> (g&&typeof g==="object") ? g.v : g;
const gd = (g)=> (g&&typeof g==="object") ? (g.d||0) : 0;
const parseNum = (s)=>{ if(s===""||s==null) return null;
  const str=String(s).trim().replace(",",".");
  const m=str.match(/^(\d+(?:\.\d+)?)\s*([+-])$/);   /* Tendenznoten: 2+ → 1.7, 3- → 3.3 */
  if(m){ const b=parseFloat(m[1]); return Math.round((m[2]==="+"?b-0.3:b+0.3)*10)/10; }
  const n=parseFloat(str); return isNaN(n)?null:n; };
const fmt = (n,lang,d=2)=>{ if(n==null||isNaN(n)) return "–"; const out=Number(n.toFixed(d)).toFixed(n%1===0?0:d); return lang==="de"?out.replace(".",","):out; };
const scaleOf = (ds)=>{ const {type,min,max,bestLow}=ds.scale;
  if(type==="grades") return {min:1,max:6,bestLow:true};
  if(type==="points") return {min:0,max:15,bestLow:false};
  return {min:Number(min)||0,max:Number(max)||10,bestLow:!!bestLow}; };
const quality = (v,sc)=>{ let p=(v-sc.min)/((sc.max-sc.min)||1); if(sc.bestLow)p=1-p; return Math.max(0,Math.min(1,p)); };
/* Notenfarben – im dunklen Modus heller für besseren Kontrast, 'bright' für die dunkle Zeugnis-Karte */
const colorFor = (v,sc,mode)=>{
  if(v==null||isNaN(v)) return "var(--faint)";
  const p=quality(v,sc), h=Math.round(p*122);
  if(mode==="bright") return `hsl(${h},72%,68%)`;
  return THEME_DARK ? `hsl(${h},62%,${63-p*6}%)` : `hsl(${h},62%,${44-p*4}%)`;
};
const mean = (arr)=>{ const v=arr.filter(x=>x!=null&&!isNaN(x)); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; };
const sName = (s,lang)=> typeof s.name==="string"?s.name:s.name[lang];
const weightedCalc = (subject)=>{ let sum=0,w=0;
  for(const c of subject.cats){ const m=mean(c.grades.map(g=>parseNum(gv(g))));
    if(m!=null&&Number(c.weight)>0){ sum+=m*Number(c.weight); w+=Number(c.weight);} }
  return w?sum/w:null; };

function burstConfetti(){
  const icons=["🎉","⭐","✨","🎊","💛"];
  for(let i=0;i<26;i++){
    const el=document.createElement("span");
    el.className="confetti"; el.textContent=icons[i%icons.length];
    el.style.left=(Math.random()*100)+"vw";
    el.style.animationDelay=(Math.random()*0.4)+"s";
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),2200);
  }
}

/* ---------- Flaggen ---------- */
const FlagDE = ({size=64}) => (
  <svg width={size} height={size*0.65} viewBox="0 0 60 39" style={{borderRadius:8,boxShadow:"0 2px 10px rgba(23,42,70,.25)"}}>
    <rect width="60" height="13" fill="#111"/><rect y="13" width="60" height="13" fill="#DD0000"/><rect y="26" width="60" height="13" fill="#FFCC00"/>
  </svg>);
const FlagEN = ({size=64}) => (
  <svg width={size} height={size*0.65} viewBox="0 0 60 39" style={{borderRadius:8,boxShadow:"0 2px 10px rgba(23,42,70,.25)"}}>
    <rect width="60" height="39" fill="#012169"/>
    <path d="M0,0 60,39 M60,0 0,39" stroke="#fff" strokeWidth="7"/>
    <path d="M0,0 60,39 M60,0 0,39" stroke="#C8102E" strokeWidth="3"/>
    <path d="M30,0 V39 M0,19.5 H60" stroke="#fff" strokeWidth="12"/>
    <path d="M30,0 V39 M0,19.5 H60" stroke="#C8102E" strokeWidth="7"/>
  </svg>);

/* ---------- Kleinteile ---------- */
const Toggle = ({on,onChange}) => (
  <label className="switch"><input type="checkbox" checked={on} onChange={e=>onChange(e.target.checked)}/><span className="slider"></span></label>
);
function InfoTip({text}){
  const [o,setO]=useState(false);
  return (<React.Fragment>
    <button onClick={()=>setO(!o)} aria-label="Info"
      style={{background:"none",border:"none",color:"var(--blue)",cursor:"pointer",padding:"0 4px",verticalAlign:"middle"}}>
      <Ic n="info" size={15} style={{marginRight:0}}/></button>
    {o&&<div className="hint" style={{background:"var(--blue-soft)",borderRadius:10,padding:"8px 10px",margin:"4px 0 8px"}}>{text}</div>}
  </React.Fragment>);
}
const NumInput = ({value,onChange,ph,width=74,color}) => (
  <input className="num" inputMode="decimal" value={value} placeholder={ph}
    style={{width,color:color||"var(--ink)"}}
    onChange={e=>onChange(e.target.value.replace(/[^0-9.,+-]/g,""))}/>
);
function AddRow({ph,btn,onAdd}){
  const [v,setV]=useState("");
  const go=()=>{const s=v.trim(); if(s){onAdd(s);setV("");}};
  return (<div className="row" style={{marginTop:12}}>
    <input className="inp" style={{flex:1}} placeholder={ph} value={v}
      onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
    <button className="btn" onClick={go}>+ {btn}</button>
  </div>);
}
function QuickAdd({ph,onAdd}){
  const [v,setV]=useState("");
  const go=()=>{ if(parseNum(v)!=null){onAdd({v:v.trim(),d:Date.now()});setV("");} };
  return (<span style={{display:"inline-flex",gap:4}}>
    <input inputMode="decimal" value={v} placeholder={ph}
      onChange={e=>setV(e.target.value.replace(/[^0-9.,+-]/g,""))}
      onKeyDown={e=>e.key==="Enter"&&go()}
      style={{width:64,borderRadius:20,border:"1.5px dashed var(--border)",padding:"3px 10px",fontSize:14,background:"var(--card)"}}/>
    <button onClick={go} style={{border:"none",background:"var(--blue)",color:"#fff",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontWeight:700}}>+</button>
  </span>);
}
const Stamp = ({value,label,sc,lang}) => (
  <div style={{textAlign:"center"}}>
    <div style={{width:76,height:76,borderRadius:"50%",border:`4px solid ${colorFor(value,sc)}`,color:colorFor(value,sc),
      display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,
      fontSize:22,background:"var(--card)",margin:"0 auto",transform:"rotate(-4deg)",boxShadow:"var(--shadow)"}}>{fmt(value,lang)}</div>
    <div style={{fontSize:11,color:"var(--sub)",marginTop:6,fontWeight:600,maxWidth:110}}>{label}</div>
  </div>
);

/* ---------- Liniendiagramm: eine Linie pro Kategorie (oben = besser!) ---------- */
const CAT_PALETTE=["#4C7DFF","#F2884B","#9B6BF2","#2BB8A3","#E85D9E","#C9A227","#6BAA3D","#FF7B6B"];
const catColor=(i)=>CAT_PALETTE[i%CAT_PALETTE.length];
function TrendChart({subject,sc,lang,t,fileName}){
  const [hidden,setHidden]=useState({});
  const svgRef=useRef(null);
  /* feste Farben statt CSS-Variablen, damit der Bild-Export funktioniert */
  const CLR = THEME_DARK
    ? {line:"#2C3A56",faint:"#7A8BA6",card:"#1A2436",bg:"#1A2436"}
    : {line:"#E4EAF2",faint:"#8A97AB",card:"#ffffff",bg:"#ffffff"};

  const series=[];
  subject.cats.forEach((c,ci)=>{
    const pts=c.grades.map(g=>({v:parseNum(gv(g)),d:gd(g)})).filter(p=>p.v!=null);
    pts.sort((a,b)=>a.d-b.d);
    if(pts.length) series.push({id:c.id,name:typeof c.name==="string"?c.name:c.name[lang],color:catColor(ci),pts});
  });
  const allPts=series.flatMap(s=>s.pts);
  if(allPts.length<2) return <div className="hint">{t("trendEmpty")}</div>;

  const visible=series.filter(s=>!hidden[s.id]);
  const vis=visible.flatMap(s=>s.pts).slice().sort((a,b)=>a.d-b.d);

  const W=320,H=118,l=12,r=12,tp=16,bp=14;
  const y=(v)=> tp+(1-quality(v,sc))*(H-tp-bp);
  /* Echte Zeitachse, sobald alle Noten ein Datum tragen */
  const dsAll=allPts.map(p=>p.d);
  const minD=Math.min.apply(null,dsAll), maxD=Math.max.apply(null,dsAll);
  const timeAxis = allPts.every(p=>p.d>0) && maxD>minD;
  const xTime=(d)=> l+(W-l-r)*((d-minD)/(maxD-minD));
  const xIdx=(i,n)=> n===1 ? l+(W-l-r)/2 : l+(W-l-r)*(i/(n-1));

  /* Tendenz über die sichtbaren Noten */
  let dir="flat";
  if(vis.length>=2){
    const half=Math.floor(vis.length/2);
    const q1=mean(vis.slice(0,half||1).map(p=>quality(p.v,sc)));
    const q2=mean(vis.slice(-Math.max(half,1)).map(p=>quality(p.v,sc)));
    const d=q2-q1; dir=d>0.03?"up":d<-0.03?"down":"flat";
  }
  const dirColor=dir==="up"?"var(--green)":dir==="down"?"var(--red)":"var(--sub)";
  const best=sc.bestLow?sc.min:sc.max, worst=sc.bestLow?sc.max:sc.min;

  const share=()=>{
    const svg=svgRef.current; if(!svg)return;
    const src=new XMLSerializer().serializeToString(svg);
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement("canvas"); c.width=W*3; c.height=H*3;
      const ctx=c.getContext("2d");
      ctx.fillStyle=CLR.bg; ctx.fillRect(0,0,c.width,c.height);
      ctx.drawImage(img,0,0,c.width,c.height);
      c.toBlob(b=>{ if(!b)return;
        const a=document.createElement("a");
        a.href=URL.createObjectURL(b); a.download=(fileName||"chart")+".png"; a.click();
        setTimeout(()=>URL.revokeObjectURL(a.href),500); });
    };
    img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(src);
  };

  return (<div>
    <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{width:"100%",height:"auto",display:"block"}} role="img" aria-label={t("trend")}
      xmlns="http://www.w3.org/2000/svg">
      <line x1={l} y1={tp} x2={W-r} y2={tp} stroke={CLR.line} strokeDasharray="3 4"/>
      <line x1={l} y1={H-bp} x2={W-r} y2={H-bp} stroke={CLR.line}/>
      <text x={l} y={tp-5} fontSize="9" fill={CLR.faint} fontFamily="Karla,sans-serif">{fmt(best,lang)} = {t("trendBest")}</text>
      <text x={W-r} y={H-3} fontSize="9" fill={CLR.faint} textAnchor="end" fontFamily="Karla,sans-serif">{fmt(worst,lang)} = {t("trendWorst")}</text>
      {visible.map((s)=>{
        const X=(p,i)=> timeAxis ? xTime(p.d) : xIdx(i,s.pts.length);
        const line=s.pts.map((p,i)=>X(p,i).toFixed(1)+","+y(p.v).toFixed(1)).join(" ");
        return (<g key={s.id}>
          {s.pts.length>1 && <polyline points={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.95"/>}
          {s.pts.map((p,i)=>(
            <circle key={i} cx={timeAxis?xTime(p.d):xIdx(i,s.pts.length)} cy={y(p.v)} r={i===s.pts.length-1?4.2:3}
              fill={s.color} stroke={CLR.card} strokeWidth="1.5"/>))}
        </g>);})}
    </svg>
    <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",marginTop:8}}>
      {series.map((s)=>(
        <button key={s.id} onClick={()=>setHidden(h=>({...h,[s.id]:!h[s.id]}))}
          className="hint" style={{display:"inline-flex",alignItems:"center",gap:5,fontWeight:600,
            background:"none",border:"none",cursor:"pointer",padding:0,
            opacity:hidden[s.id]?0.35:1,textDecoration:hidden[s.id]?"line-through":"none"}}>
          <span style={{width:9,height:9,borderRadius:"50%",background:s.color,flexShrink:0}}></span>
          {s.name} · Ø {fmt(mean(s.pts.map(p=>p.v)),lang)}
        </button>))}
    </div>
    <div className="row" style={{marginTop:8,justifyContent:"space-between",flexWrap:"wrap"}}>
      <span className="row" style={{color:dirColor,fontWeight:700,fontSize:14}}>
        <Ic n={dir==="up"?"chart":dir==="down"?"chartDown":"flat"} size={17} color={dirColor}/>
        {t(dir==="up"?"trendUp":dir==="down"?"trendDown":"trendFlat")}
      </span>
      <button className="btn-ghost" style={{padding:"5px 10px",fontSize:12}} onClick={share}>
        <Ic n="download" size={13}/>{t("shareChart")}</button>
    </div>
  </div>);
}

/* ---------- Mini-Verlauf (Sparkline) für die Fächerliste ---------- */
function Spark({subject,sc}){
  const pts=[];
  subject.cats.forEach(c=>c.grades.forEach(g=>{
    const v=parseNum(gv(g)); if(v!=null) pts.push({v,d:gd(g)});
  }));
  if(pts.length<2) return null;
  pts.sort((a,b)=>a.d-b.d);
  const W=46,Hh=18,pd=2.5;
  const y=(v)=>pd+(1-quality(v,sc))*(Hh-2*pd);
  const x=(i)=>pd+(W-2*pd)*(i/(pts.length-1));
  const half=Math.floor(pts.length/2);
  const q1=mean(pts.slice(0,half||1).map(p=>quality(p.v,sc)));
  const q2=mean(pts.slice(-Math.max(half,1)).map(p=>quality(p.v,sc)));
  const d=q2-q1;
  const col=d>0.03?"var(--green)":d<-0.03?"var(--red)":"var(--faint)";
  const line=pts.map((p,i)=>x(i).toFixed(1)+","+y(p.v).toFixed(1)).join(" ");
  return (<svg width={W} height={Hh} viewBox={`0 0 ${W} ${Hh}`} style={{flexShrink:0}} aria-hidden="true">
    <polyline points={line} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>);
}

/* ========================================================= */
function App(){
  const [state,setState]=useState(freshState);
  const [loaded,setLoaded]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const [confirmReset,setConfirmReset]=useState(false);
  const [importMsg,setImportMsg]=useState("");
  const saveT=useRef(null);
  const fileRef=useRef(null);
  const prevMet=useRef({});
  const [undo,setUndo]=useState(null);
  const undoT=useRef(null);
  /* Vor jedem Löschen aufrufen: merkt sich den Stand für "Rückgängig" (6 Sekunden) */
  const pushUndo=()=>{ clearTimeout(undoT.current);
    setUndo({datasets:state.datasets});
    undoT.current=setTimeout(()=>setUndo(null),6000); };
  const doUndo=()=>{ clearTimeout(undoT.current);
    if(undo) setState(s=>({...s,datasets:undo.datasets}));
    setUndo(null); };

  THEME_DARK = state.dark;
  const t=(k)=>T[state.lang][k]??k;
  const ds = state.datasets.find(d=>d.id===state.activeId) || state.datasets[0];
  const sc = scaleOf(ds);
  const eff = state.features.simple ? {wish:false,cats:false,groups:false,charts:false} : {charts:true,...state.features};

  useEffect(()=>{ (async()=>{
    const saved=await store.get("gradegoal:data");
    if(saved&&saved.datasets) setState({...saved,features:{charts:true,...saved.features}});
    setLoaded(true);
  })(); },[]);
  useEffect(()=>{ if(!loaded)return;
    clearTimeout(saveT.current);
    saveT.current=setTimeout(()=>store.set("gradegoal:data",state),600);
    return ()=>clearTimeout(saveT.current);
  },[state,loaded]);
  useEffect(()=>{ document.documentElement.setAttribute("data-theme",state.dark?"dark":"light"); },[state.dark]);
  useEffect(()=>{ renderPrint(state,ds,sc,t); });

  const up=(p)=>setState(s=>({...s,...p}));
  const upDs=(p)=>setState(s=>({...s,datasets:s.datasets.map(d=>d.id===s.activeId?{...d,...p}:d)}));
  const upSubject=(id,p)=>{
    upDs({subjects:ds.subjects.map(x=>x.id===id?{...x,...p}:x)});
    const subj=ds.subjects.find(x=>x.id===id); if(!subj)return;
    const next={...subj,...p};
    const g=parseNum(next.grade), w=parseNum(next.wish);
    const met = g!=null&&w!=null && (sc.bestLow? g<=w : g>=w);
    if(met && !prevMet.current[id]) burstConfetti();
    prevMet.current[id]=met;
  };
  const subject = ds.subjects.find(x=>x.id===state.selSubject)||null;

  const overallAvg = mean(ds.subjects.map(s=>parseNum(s.grade)));
  const wishAvg = mean(ds.subjects.map(s=>parseNum(s.wish)));
  const groupAvg=(g)=>mean(ds.subjects.filter(s=>g.subjectIds.includes(s.id)).map(s=>parseNum(s.grade)));
  const groupOk=(g)=>{const a=groupAvg(g),tg=parseNum(g.target); if(a==null||tg==null)return null; return sc.bestLow?a<=tg:a>=tg;};

  const addNds=()=>{
    const core=ds.subjects.filter(s=>["Deutsch","Mathematik","Englisch"].includes(typeof s.name==="string"?s.name:s.name.de));
    const rest=ds.subjects.filter(s=>!core.includes(s));
    upDs({groups:[...ds.groups,
      {id:uid(),name:t("presetCore"),subjectIds:core.map(s=>s.id),target:"3"},
      {id:uid(),name:t("presetRest"),subjectIds:rest.map(s=>s.id),target:"3"}]});
  };

  const doExport=()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="gradegoal-backup.json"; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  };
  const doImport=(file)=>{
    const r=new FileReader();
    r.onload=()=>{ try{
        const d=JSON.parse(r.result);
        if(!d.datasets) throw new Error("format");
        setState(d); setImportMsg(t("importOk"));
      }catch(e){ setImportMsg(t("importErr")); }
      setTimeout(()=>setImportMsg(""),4000);
    };
    r.readAsText(file);
  };

  if(!loaded) return null;

  const snack = undo ? (
    <div className="snack">
      <span>{t("undoDeleted")}</span>
      <button onClick={doUndo}>↩ {t("undoBtn")}</button>
    </div>) : null;

  /* ============ START ============ */
  if(state.screen==="start") return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:24,maxWidth:420}}>
        <div className="brand" style={{fontSize:44,letterSpacing:"-0.02em"}}>{APP_NAME}<span style={{color:"var(--blue)"}}>.</span></div>
        <div style={{color:"var(--sub)",marginTop:2,fontSize:15}}>{APP_SUB}</div>
        <div style={{color:"var(--sub)",marginTop:8,fontSize:16}}>{t("tagline")}</div>
        <div className="lbl" style={{margin:"34px 0 10px",textTransform:"uppercase",letterSpacing:".05em"}}>{t("chooseLang")}</div>
        <div style={{display:"flex",gap:22,justifyContent:"center",marginBottom:34}}>
          {[["de",FlagDE],["en",FlagEN]].map(([lg,Flag])=>(
            <button key={lg} onClick={()=>up({lang:lg})}
              style={{background:"var(--card)",border:state.lang===lg?"3px solid var(--blue)":"3px solid transparent",
                borderRadius:16,padding:12,cursor:"pointer",boxShadow:"var(--shadow)"}}>
              <Flag size={84}/>
              <div className="brand" style={{marginTop:8,fontSize:15}}>{T[lg].langName}</div>
            </button>))}
        </div>
        <button className="btn" style={{fontSize:17,padding:"13px 34px"}} onClick={()=>up({screen:"setup"})}>{t("start")} →</button>
        <div style={{marginTop:22}}>
          <button className="btn-ghost" style={{border:"none",color:"var(--faint)"}} onClick={()=>up({screen:"about",aboutFrom:"start"})}>
            <Ic n="info" size={14}/>{t("aboutBtn")}</button>
        </div>
      </div>
    </div>);

  /* ============ ÜBER / INFO ============ */
  if(state.screen==="about") return (
    <div className="wrap" style={{paddingTop:16}}>
      <button className="btn-ghost" style={{border:"none",paddingLeft:0}}
        onClick={()=>up({screen: state.aboutFrom || (state.name||overallAvg!=null?"home":"start")})}>← {t("back")}</button>
      <h1 className="brand" style={{fontSize:30,margin:"8px 0 16px"}}><Ic n="info" size={24}/>{t("about")}</h1>
      <div className="card">
        <div className="brand" style={{fontSize:22}}>{APP_NAME}<span style={{color:"var(--blue)"}}>.</span> <span style={{fontSize:14,color:"var(--sub)",fontWeight:400}}>{APP_SUB}</span></div>
        {t("aboutText").map((p,i)=><p key={i} style={{lineHeight:1.6,fontSize:15}}>{p}</p>)}
      </div>
      <div className="card">
        <h2 className="sec">{t("aboutFeatTitle")}</h2>
        {t("aboutFeatures").map(([icon,title,text],i)=>(
          <div key={i} style={{borderTop:i?"1px solid var(--line)":"none",padding:"10px 0"}}>
            <strong style={{fontSize:15}}><Ic n={icon} size={16} color="var(--blue)"/>{title}</strong>
            <p style={{margin:"4px 0 0",lineHeight:1.55,fontSize:14,color:"var(--sub)"}}>{text}</p>
          </div>))}
      </div>
      <div className="card">
        <h2 className="sec"><Ic n="lock" size={14}/>{t("aboutPrivacyTitle")}</h2>
        <p style={{margin:0,lineHeight:1.6,fontSize:15}}>{t("aboutPrivacy")}</p>
      </div>
      <div className="card">
        <h2 className="sec">{t("legalTitle")}</h2>
        <div className="row" style={{justifyContent:"space-between"}}><span className="lbl">{t("developedBy")}</span><strong>{DEVELOPER}</strong></div>
        <div className="row" style={{justifyContent:"space-between",marginTop:10}}><span className="lbl">{t("version")}</span><span>{APP_VER}</span></div>
        <div className="row" style={{justifyContent:"space-between",marginTop:10}}><span className="lbl">{t("contact")}</span><span style={{color:"var(--sub)"}}>kontakt@example.de</span></div>
        <div style={{marginTop:14,fontSize:12,color:"var(--faint)"}}>© 2026 {DEVELOPER}</div>
      </div>
    </div>);

  /* ============ SETUP / EINSTELLUNGEN ============ */
  if(state.screen==="setup"||state.screen==="settings"){
    const isSettings=state.screen==="settings";
    return (
    <div className="wrap" style={{paddingTop:16}}>
      {isSettings && <button className="btn-ghost" style={{border:"none",paddingLeft:0}} onClick={()=>up({screen:"home"})}>← {t("back")}</button>}
      <h1 className="brand" style={{fontSize:30,margin:"8px 0 16px"}}>
        {isSettings?<React.Fragment><Ic n="settings" size={24}/>{t("settings")}</React.Fragment>:t("profile")}</h1>

      <div className="card">
        <h2 className="sec">{t("profile")}</h2>
        <label className="lbl">{t("yourName")} ({t("optional")})</label>
        <input className="inp" style={{margin:"6px 0 14px"}} value={state.name} onChange={e=>up({name:e.target.value})}/>
        <label className="lbl">{t("school")} ({t("optional")})</label>
        <input className="inp" style={{marginTop:6}} value={state.school} onChange={e=>up({school:e.target.value})}/>
      </div>

      <div className="card">
        <h2 className="sec">{t("scale")}</h2>
        <div className="row" style={{flexWrap:"wrap"}}>
          {[["grades",t("scaleGrades"),t("scaleGradesHint")],["points",t("scalePoints"),t("scalePointsHint")],["custom",t("scaleCustom"),""]].map(([v,l,h])=>(
            <button key={v} onClick={()=>upDs({scale:{...ds.scale,type:v}})}
              style={{flex:"1 1 30%",padding:"10px 8px",borderRadius:12,cursor:"pointer",
                border:ds.scale.type===v?"2.5px solid var(--blue)":"1.5px solid var(--border)",
                background:ds.scale.type===v?"var(--blue-soft)":"var(--card)",textAlign:"center"}}>
              <div className="brand" style={{fontSize:15}}>{l}</div>
              {h&&<div style={{fontSize:11,color:"var(--sub)",marginTop:2}}>{h}</div>}
            </button>))}
        </div>
        {ds.scale.type==="custom" && (
          <div className="row" style={{marginTop:12,flexWrap:"wrap",gap:12}}>
            <label className="lbl">{t("min")} <input className="inp" inputMode="decimal" style={{width:70,marginLeft:6,display:"inline-block",padding:8}}
              value={ds.scale.min} onChange={e=>upDs({scale:{...ds.scale,min:e.target.value}})}/></label>
            <label className="lbl">{t("max")} <input className="inp" inputMode="decimal" style={{width:70,marginLeft:6,display:"inline-block",padding:8}}
              value={ds.scale.max} onChange={e=>upDs({scale:{...ds.scale,max:e.target.value}})}/></label>
            <label className="lbl row"><input type="checkbox" checked={!!ds.scale.bestLow}
              onChange={e=>upDs({scale:{...ds.scale,bestLow:e.target.checked}})}/> {t("bestLow")}</label>
          </div>)}
        <div style={{fontSize:12,color:"var(--faint)",marginTop:10}}>{t("scaleWarn")}</div>
      </div>

      {/* Anzeige & Funktionen – auch beim ersten Start als Onboarding */}
        <div className="card">
          <h2 className="sec">{isSettings?t("display"):t("onboardTitle")}</h2>
          {!isSettings && <div className="hint" style={{marginBottom:8}}>{t("onboardHint")}{" "}
            <button onClick={()=>up({screen:"about",aboutFrom:"setup"})}
              style={{background:"none",border:"none",color:"var(--blue)",fontWeight:700,cursor:"pointer",padding:0,fontSize:13,textDecoration:"underline"}}>
              {t("onboardInfo")}</button></div>}
          <div className="row" style={{justifyContent:"space-between",padding:"8px 0"}}>
            <div><strong><Ic n="eye" size={16}/>{t("simpleMode")}</strong><div className="hint">{t("simpleModeHint")}</div></div>
            <Toggle on={state.features.simple} onChange={v=>up({features:{...state.features,simple:v}})}/>
          </div>
          {[["wish","star",t("featWish")],["cats","book",t("featCats")],["charts","chart",t("featCharts")],["groups","sigma",t("featGroups")]].map(([k,ic,label])=>(
            <div key={k} className="row" style={{justifyContent:"space-between",padding:"8px 0",borderTop:"1px solid var(--line)",
              opacity:state.features.simple?0.45:1}}>
              <strong style={{fontWeight:600}}><Ic n={ic} size={16}/>{label}</strong>
              <Toggle on={eff[k]} onChange={v=>up({features:{...state.features,[k]:v,simple:false}})}/>
            </div>))}
          <div className="row" style={{justifyContent:"space-between",padding:"8px 0",borderTop:"1px solid var(--line)"}}>
            <strong style={{fontWeight:600}}><Ic n="moon" size={16}/>{t("darkMode")}</strong>
            <Toggle on={state.dark} onChange={v=>up({dark:v})}/>
          </div>
        </div>

      {isSettings && (<React.Fragment>
        {/* Halbjahre & Profile */}
        <div className="card">
          <h2 className="sec"><Ic n="calendar" size={14}/>{t("terms")}</h2>
          <div className="hint" style={{marginBottom:8}}>{t("termsHint")}</div>
          {state.datasets.map(d=>{
            const a=mean(d.subjects.map(s=>parseNum(s.grade)));
            const dsc=scaleOf(d);
            const p=a==null?0:quality(a,dsc);
            return (
            <div key={d.id} style={{borderTop:"1px solid var(--line)",padding:"10px 0"}}>
              <div className="row">
                <input className="inp" style={{flex:1,padding:"8px 10px"}} value={d.label}
                  onChange={e=>up({datasets:state.datasets.map(x=>x.id===d.id?{...x,label:e.target.value}:x)})}/>
                <span className="brand" style={{color:colorFor(a,dsc),minWidth:52,textAlign:"right"}}>Ø {fmt(a,state.lang)}</span>
                {d.id===state.activeId
                  ? <span style={{fontSize:12,fontWeight:700,background:"var(--green-soft)",color:"var(--green)",borderRadius:20,padding:"4px 10px"}}>✓ {t("active")}</span>
                  : <button className="btn-ghost" style={{padding:"5px 10px",fontSize:13}} onClick={()=>up({activeId:d.id,selSubject:null})}>{t("activate")}</button>}
                {state.datasets.length>1 && d.id!==state.activeId &&
                  <button className="xbtn" title={t("deleteTerm")} onClick={()=>{pushUndo();up({datasets:state.datasets.filter(x=>x.id!==d.id)});}}>✕</button>}
              </div>
              <div style={{height:6,background:"var(--chip)",borderRadius:4,marginTop:8}}>
                <div style={{height:6,width:(p*100)+"%",background:colorFor(a,dsc),borderRadius:4}}></div>
              </div>
            </div>);})}
          <button className="btn-ghost" style={{marginTop:12}}
            onClick={()=>{const d=freshDataset((state.lang==="de"?"Neues Halbjahr":"New term"));
              up({datasets:[...state.datasets,d]});}}>+ {t("newTerm")}</button>
        </div>

        {/* Daten */}
        <div className="card">
          <h2 className="sec"><Ic n="save" size={14}/>{t("data")}</h2>
          <div className="hint" style={{marginBottom:10}}>{t("dataHint")}</div>
          <div className="row" style={{flexWrap:"wrap"}}>
            <button className="btn-ghost" onClick={doExport}><Ic n="download" size={15}/>{t("exportBtn")}</button>
            <button className="btn-ghost" onClick={()=>fileRef.current&&fileRef.current.click()}><Ic n="upload" size={15}/>{t("importBtn")}</button>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{display:"none"}}
              onChange={e=>{if(e.target.files[0])doImport(e.target.files[0]); e.target.value="";}}/>
            <button className="btn-ghost" onClick={()=>window.print()}><Ic n="printer" size={15}/>{t("printBtn")}</button>
          </div>
          {importMsg && <div style={{marginTop:10,fontWeight:700,color:importMsg===t("importOk")?"var(--green)":"var(--red)"}}>{importMsg}</div>}
          <div style={{borderTop:"1px solid var(--line)",marginTop:14,paddingTop:14}}>
            <button className="btn-danger" style={{width:"100%",background:confirmReset?"var(--red)":"var(--card)",color:confirmReset?"#fff":"var(--red)"}}
              onClick={()=>{ if(!confirmReset) return setConfirmReset(true);
                const f=freshState(); prevMet.current={}; setConfirmReset(false); setState(f);
                store.set("gradegoal:data",f); }}>
              <Ic n={confirmReset?"alert":"trash"} size={15}/>{confirmReset?t("resetConfirm"):t("resetBtn")}
            </button>
            {confirmReset && <button className="btn-ghost" style={{width:"100%",marginTop:8,border:"none"}}
              onClick={()=>setConfirmReset(false)}>{t("back")}</button>}
          </div>
        </div>

        <button className="btn-ghost" style={{width:"100%",marginBottom:14}} onClick={()=>up({screen:"about",aboutFrom:"settings"})}>
          <Ic n="info" size={15}/>{t("aboutBtn")}</button>
      </React.Fragment>)}

      {!isSettings && (
        <div className="row" style={{justifyContent:"flex-end"}}>
          <button className="btn-ghost" onClick={()=>up({screen:"home"})}>{t("skip")}</button>
          <button className="btn" onClick={()=>up({screen:"home"})}>{t("continue")} →</button>
        </div>)}
      {snack}
    </div>);
  }

  /* ============ FACH-DETAIL ============ */
  if(subject){
    const calc=weightedCalc(subject);
    const g=parseNum(subject.grade), w=parseNum(subject.wish);
    const diff=(g!=null&&w!=null)?(sc.bestLow?g-w:w-g):null;
    const upCat=(cid,p)=>upSubject(subject.id,{cats:subject.cats.map(c=>c.id===cid?{...c,...p}:c)});

    const needed=(cat)=>{
      if(w==null) return {type:"missing"};
      let So=0,Wo=0;
      for(const c of subject.cats){
        if(c.id===cat.id) continue;
        const m=mean(c.grades.map(x=>parseNum(gv(x))));
        if(m!=null&&Number(c.weight)>0){So+=m*Number(c.weight);Wo+=Number(c.weight);}
      }
      const wc=Number(cat.weight)||0; if(!wc) return {type:"missing"};
      const s=cat.grades.map(x=>parseNum(gv(x))).filter(x=>x!=null); const n=s.length; const sum=s.reduce((a,b)=>a+b,0);
      const gNeed=((w*(Wo+wc)-So)*(n+1)/wc)-sum;
      const beyondBest = sc.bestLow ? gNeed<sc.min : gNeed>sc.max;
      const alreadySafe = sc.bestLow ? gNeed>=sc.max : gNeed<=sc.min;
      if(alreadySafe) return {type:"safe"};
      if(beyondBest) return {type:"impossible"};
      const rounded=sc.bestLow?Math.floor(gNeed*10)/10:Math.ceil(gNeed*10)/10;
      return {type:"ok",g:rounded};
    };

    return (
    <div className="wrap" style={{paddingTop:16}}>
      <button className="btn-ghost" style={{border:"none",paddingLeft:0}} onClick={()=>{up({selSubject:null});setConfirmDel(false);}}>← {t("back")}</button>
      <h1 className="brand" style={{fontSize:30,margin:"8px 0 16px"}}>{sName(subject,state.lang)}</h1>

      <div className="card row" style={{justifyContent:"space-around"}}>
        <div style={{textAlign:"center"}}>
          <NumInput value={subject.grade} onChange={v=>upSubject(subject.id,{grade:v})} ph="–" color={colorFor(g,sc)}/>
          <div style={{fontSize:12,color:"var(--sub)",marginTop:6,fontWeight:600}}>{t("reportGrade")}</div>
        </div>
        {eff.wish && (<React.Fragment>
          <div style={{fontSize:22,color:"var(--border)"}}>→</div>
          <div style={{textAlign:"center"}}>
            <NumInput value={subject.wish} onChange={v=>upSubject(subject.id,{wish:v})} ph="–" color="var(--blue)"/>
            <div style={{fontSize:12,color:"var(--sub)",marginTop:6,fontWeight:600}}><Ic n="star" size={11}/>{t("wishGrade")}</div>
          </div>
        </React.Fragment>)}
        {eff.cats && <Stamp value={calc} label={<span>{t("calc")}<br/><span style={{fontWeight:400}}>{t("calcHint")}</span></span>} sc={sc} lang={state.lang}/>}
      </div>
      {eff.wish && diff!=null && (
        <div style={{margin:"-6px 0 14px",textAlign:"center",fontSize:14,fontWeight:700,color:diff<=0?"var(--green)":"var(--red)"}}>
          {diff<=0?`✓ ${t("onTrack")}`:`${fmt(diff,state.lang)} ${t("gap")}`}
        </div>)}
      {ds.scale.type==="grades" && (
        <div className="hint" style={{margin:"-4px 0 14px",textAlign:"center",fontSize:12}}>{t("tendHint")}</div>)}

      {eff.cats && eff.charts && (
      <div className="card">
        <h2 className="sec"><Ic n="chart" size={14}/>{t("trend")}</h2>
        <TrendChart subject={subject} sc={sc} lang={state.lang} t={t} fileName={sName(subject,state.lang)+" – "+t("trend")}/>
      </div>)}

      {eff.cats && (
      <div className="card">
        <h2 className="sec">{t("categories")}</h2><InfoTip text={t("weightHint")}/>
        {subject.cats.map((c,ci)=>{
          const m=mean(c.grades.map(x=>parseNum(gv(x))));
          return (
          <div key={c.id} style={{borderTop:"1px solid var(--line)",padding:"12px 0"}}>
            <div className="row" style={{flexWrap:"wrap"}}>
              <strong style={{flex:1,fontSize:15,display:"flex",alignItems:"center",gap:7}}>
                <span style={{width:9,height:9,borderRadius:"50%",background:catColor(ci),flexShrink:0}}></span>
                {typeof c.name==="string"?c.name:c.name[state.lang]}</strong>
              <span style={{fontSize:12,color:"var(--sub)"}}>{t("weight")}</span>
              <input inputMode="numeric" value={c.weight}
                onChange={e=>upCat(c.id,{weight:e.target.value.replace(/\D/g,"")})}
                style={{width:44,textAlign:"center",borderRadius:8,border:"1.5px solid var(--border)",padding:"5px 2px",fontWeight:700,background:"var(--card)"}}/>
              <span style={{fontSize:12,color:"var(--sub)"}}>%</span>
              <span className="brand" style={{minWidth:46,textAlign:"right",color:colorFor(m,sc)}}>Ø {fmt(m,state.lang)}</span>
              <button className="xbtn" onClick={()=>{pushUndo();upSubject(subject.id,{cats:subject.cats.filter(x=>x.id!==c.id)});}}>✕</button>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
              {c.grades.map((gr,i)=>(
                <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,background:"var(--chip)",
                  border:`1.5px solid ${colorFor(parseNum(gv(gr)),sc)}`,color:colorFor(parseNum(gv(gr)),sc),
                  borderRadius:20,padding:"3px 6px 3px 12px",fontWeight:700,fontFamily:"'Space Grotesk',sans-serif"}}>
                  {fmt(parseNum(gv(gr)),state.lang)}
                  <button className="xbtn" style={{fontSize:14,color:"var(--faint)"}}
                    onClick={()=>{pushUndo();upCat(c.id,{grades:c.grades.filter((_,j)=>j!==i)});}}>✕</button>
                </span>))}
              <QuickAdd ph={t("addGrade")} onAdd={v=>upCat(c.id,{grades:[...c.grades,v]})}/>
            </div>
          </div>);})}
        {(()=>{const wSum=subject.cats.reduce((a,c)=>a+(Number(c.weight)||0),0);
          return (<div style={{marginTop:10,fontSize:12,fontWeight:700,color:wSum===100?"var(--faint)":"var(--warn)"}}>
            {t("weightSum")(wSum)}{wSum!==100&&<span style={{fontWeight:400}}> · {t("weightHint")}</span>}
          </div>);})()}
        <AddRow ph={t("newCat")} btn={t("add")}
          onAdd={name=>upSubject(subject.id,{cats:[...subject.cats,{id:uid(),name,weight:10,grades:[]}]})}/>
      </div>)}

      {eff.cats && eff.wish && (
      <div className="card">
        <h2 className="sec"><Ic n="target" size={14}/>{t("needCalc")}</h2>
        {subject.cats.filter(c=>Number(c.weight)>0).map(c=>{
          const r=needed(c);
          return (
          <div key={c.id} style={{borderTop:"1px solid var(--line)",padding:"10px 0"}}>
            <div className="lbl">{t("needIn")} „{typeof c.name==="string"?c.name:c.name[state.lang]}“:</div>
            <div style={{marginTop:4,fontSize:14,lineHeight:1.5,
              color:r.type==="ok"?"var(--ink)":r.type==="safe"?"var(--green)":r.type==="impossible"?"var(--red)":"var(--sub)"}}>
              {r.type==="ok"&&(()=>{const parts=t("needResult")(<strong style={{color:colorFor(r.g,sc)}}>{fmt(r.g,state.lang,1)}</strong>);
                return <span>{parts[0]}{parts[1]}{parts[2]}</span>;})()}
              {r.type==="safe"&&"✓ "+t("needSafe")}
              {r.type==="impossible"&&t("needImpossible")}
              {r.type==="missing"&&t("needMissing")}
            </div>
          </div>);})}
      </div>)}

      <div className="card">
        <h2 className="sec"><Ic n="target" size={14}/>{t("goals")}</h2>
        <textarea className="ta" placeholder={t("goalsPh")} value={subject.goals}
          onChange={e=>upSubject(subject.id,{goals:e.target.value})}/>
      </div>
      <div className="card">
        <h2 className="sec"><Ic n="pencil" size={14}/>{t("notes")}</h2>
        <textarea className="ta" placeholder={t("notesPh")} value={subject.notes}
          onChange={e=>upSubject(subject.id,{notes:e.target.value})}/>
      </div>

      <button className="btn-danger" style={{width:"100%",background:confirmDel?"var(--red)":"var(--card)",color:confirmDel?"#fff":"var(--red)"}}
        onClick={()=>{ if(!confirmDel)return setConfirmDel(true);
          pushUndo();
          upDs({subjects:ds.subjects.filter(x=>x.id!==subject.id),
                groups:ds.groups.map(gp=>({...gp,subjectIds:gp.subjectIds.filter(i=>i!==subject.id)}))});
          up({selSubject:null}); setConfirmDel(false);}}>
        <Ic n="trash" size={15}/>{confirmDel?t("confirmDelete"):t("deleteSubject")}
      </button>
      {snack}
    </div>);
  }

  /* ============ HOME ============ */
  return (
  <div className="wrap" style={{paddingTop:14}}>
    <div className="row" style={{justifyContent:"space-between",marginBottom:12}}>
      <div>
        <div className="brand" style={{fontSize:24}}>{APP_NAME}<span style={{color:"var(--blue)"}}>.</span></div>
        {state.datasets.length>1 && <div style={{fontSize:12,color:"var(--sub)",fontWeight:700}}>{ds.label}</div>}
      </div>
      <div className="row">
        <button onClick={()=>up({lang:state.lang==="de"?"en":"de"})} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
          {state.lang==="de"?<FlagEN size={34}/>:<FlagDE size={34}/>}
        </button>
        <button onClick={()=>up({screen:"settings"})} title={t("settings")}
          style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink)",padding:4}}>
          <Ic n="settings" size={23} style={{marginRight:0}}/></button>
      </div>
    </div>

    <div className="card" style={{background:"linear-gradient(135deg,var(--hero1),var(--hero2))",color:"#fff"}}>
      <div className="row" style={{justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="brand" style={{fontSize:19,color:"#fff"}}>{t("report")}</div>
          {(state.name||state.school)&&(
            <div style={{fontSize:13,color:"var(--hero-ink)",marginTop:3}}>
              {state.name}{state.name&&state.school?" · ":""}{state.school}
            </div>)}
        </div>
        <div className="row" style={{gap:18}}>
          <div style={{textAlign:"center"}}>
            <div className="brand" style={{fontSize:34,color:overallAvg!=null?colorFor(overallAvg,sc,"bright"):"var(--hero-ink)"}}>{fmt(overallAvg,state.lang)}</div>
            <div style={{fontSize:11,color:"var(--hero-ink)",fontWeight:700}}>{t("avg")}</div>
          </div>
          {eff.wish && (
          <div style={{textAlign:"center"}}>
            <div className="brand" style={{fontSize:34,color:"var(--yellow)"}}>{fmt(wishAvg,state.lang)}</div>
            <div style={{fontSize:11,color:"var(--hero-ink)",fontWeight:700}}><Ic n="star" size={10} color="var(--yellow)"/>{t("wishAvg")}</div>
          </div>)}
        </div>
      </div>
      {overallAvg==null&&<div style={{fontSize:13,color:"var(--hero-ink)",marginTop:8}}>{t("noGrades")}</div>}
    </div>

    {eff.charts && state.datasets.length>1 && (
    <div className="card">
      <h2 className="sec"><Ic n="chart" size={14}/>{t("compare")}</h2>
      {state.datasets.map(d=>{
        const a=mean(d.subjects.map(s=>parseNum(s.grade)));
        const dsc=scaleOf(d); const p=a==null?0:quality(a,dsc);
        return (
        <div key={d.id} className="row" style={{padding:"5px 0"}}>
          <span style={{width:112,fontSize:13,fontWeight:700,color:d.id===state.activeId?"var(--ink)":"var(--sub)",
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</span>
          <div style={{flex:1,height:10,background:"var(--chip)",borderRadius:5}}>
            <div style={{height:10,width:(p*100)+"%",background:colorFor(a,dsc),borderRadius:5,minWidth:a!=null?6:0}}></div>
          </div>
          <span className="brand" style={{color:colorFor(a,dsc),minWidth:48,textAlign:"right"}}>Ø {fmt(a,state.lang)}</span>
        </div>);})}
    </div>)}

    {eff.groups && (
    <div className="card">
      <h2 className="sec"><Ic n="sigma" size={14}/>{t("groups")}</h2>
      <div className="hint" style={{marginBottom:10}}>{t("groupsHint")}</div>
      {ds.groups.map(g=>(
        <GroupRow key={g.id} g={g} a={groupAvg(g)} ok={groupOk(g)} sc={sc} ds={ds} upDs={upDs} lang={state.lang} t={t} pushUndo={pushUndo}/>))}
      <div className="row" style={{flexWrap:"wrap",marginTop:8}}>
        <button className="btn-ghost" onClick={()=>upDs({groups:[...ds.groups,{id:uid(),name:"",subjectIds:[],target:""}]})}>+ {t("newGroup")}</button>
        <button className="btn-ghost" style={{borderColor:"var(--border)",color:"var(--sub)"}} onClick={addNds}>{t("presetNds")}</button>
      </div>
    </div>)}

    <div className="card">
      <h2 className="sec"><Ic n="book" size={14}/>{t("subjects")}</h2>
      <div className="hint" style={{marginBottom:6}}>{t("empty")}</div>
      <div style={{display:"grid",gridTemplateColumns:eff.wish?"1fr 70px 70px":"1fr 70px",gap:"0 8px",
        fontSize:11,fontWeight:700,color:"var(--faint)",textTransform:"uppercase",letterSpacing:".05em",padding:"6px 4px 4px"}}>
        <span></span><span style={{textAlign:"center"}}>{t("grade")}</span>
        {eff.wish&&<span style={{textAlign:"center"}}><Ic n="star" size={10}/>{t("wish")}</span>}
      </div>
      {ds.subjects.map(s=>{ const g=parseNum(s.grade);
        return (
        <div key={s.id} style={{display:"grid",gridTemplateColumns:eff.wish?"1fr 70px 70px":"1fr 70px",gap:"0 8px",
          alignItems:"center",borderTop:"1px solid var(--line)",padding:"8px 4px"}}>
          <button onClick={()=>up({selSubject:s.id})} style={{background:"none",border:"none",textAlign:"left",cursor:"pointer",
            fontSize:16,fontWeight:600,color:"var(--ink)",display:"flex",alignItems:"center",gap:8,padding:0}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:colorFor(g,sc),flexShrink:0}}></span>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sName(s,state.lang)}</span>
            {eff.charts&&eff.cats&&<span style={{marginLeft:"auto",display:"flex"}}><Spark subject={s} sc={sc}/></span>}
            <span style={{color:"var(--border)",fontSize:13}}>›</span>
          </button>
          <NumInput width="100%" value={s.grade} onChange={v=>upSubject(s.id,{grade:v})} ph="–" color={colorFor(g,sc)}/>
          {eff.wish&&<NumInput width="100%" value={s.wish} onChange={v=>upSubject(s.id,{wish:v})} ph="–" color="var(--blue)"/>}
        </div>);})}
      <AddRow ph={t("addSubject")} btn={t("add")}
        onAdd={name=>upDs({subjects:[...ds.subjects,{id:uid(),name,grade:"",wish:"",cats:defaultCats(),goals:"",notes:""}]})}/>
    </div>

    <div style={{textAlign:"center",marginTop:6}}>
      <button className="btn-ghost" style={{border:"none",color:"var(--faint)",fontSize:13}} onClick={()=>up({screen:"about",aboutFrom:"home"})}>
        <Ic n="info" size={13}/>{t("aboutBtn")} · v{APP_VER}
      </button>
    </div>
    {snack}
  </div>);
}

function GroupRow({g,a,ok,sc,ds,upDs,lang,t,pushUndo}){
  const [open,setOpen]=useState(!g.name);
  const upG=(p)=>upDs({groups:ds.groups.map(x=>x.id===g.id?{...x,...p}:x)});
  return (
  <div style={{borderTop:"1px solid var(--line)",padding:"10px 0"}}>
    <div className="row">
      <button onClick={()=>setOpen(!open)} style={{background:"none",border:"none",cursor:"pointer",flex:1,textAlign:"left",padding:0,fontSize:15,fontWeight:700,color:"var(--ink)"}}>
        {open?"▾ ":"▸ "}{g.name||t("newGroup")}
      </button>
      <span className="brand" style={{fontSize:18,color:colorFor(a,sc)}}>Ø {fmt(a,lang)}</span>
      {ok!=null&&(
        <span style={{fontSize:12,fontWeight:700,borderRadius:20,padding:"3px 10px",
          background:ok?"var(--green-soft)":"var(--red-soft)",color:ok?"var(--green)":"var(--red)"}}>
          {ok?"✓":"✗"} {t("target")} {fmt(parseNum(g.target),lang)} {ok?t("reached"):t("notReached")}
        </span>)}
    </div>
    {open&&(
    <div style={{marginTop:10}}>
      <div className="row" style={{marginBottom:4}}>
        <input className="inp" style={{flex:1}} placeholder={t("groupName")} value={g.name} onChange={e=>upG({name:e.target.value})}/>
        <input className="inp" style={{width:88}} inputMode="decimal" placeholder={t("target")} value={g.target}
          onChange={e=>upG({target:e.target.value.replace(/[^0-9.,]/g,"")})}/>
      </div>
      <InfoTip text={t("infoTarget")}/>
      <div className="lbl" style={{marginBottom:6}}>{t("pickSubjects")}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {ds.subjects.map(s=>{ const on=g.subjectIds.includes(s.id);
          return (
          <button key={s.id} onClick={()=>upG({subjectIds:on?g.subjectIds.filter(i=>i!==s.id):[...g.subjectIds,s.id]})}
            style={{borderRadius:20,padding:"5px 12px",fontSize:13,fontWeight:700,cursor:"pointer",
              border:on?"1.5px solid var(--blue)":"1.5px solid var(--border)",
              background:on?"var(--blue)":"var(--card)",color:on?"#fff":"var(--sub)"}}>
            {sName(s,lang)}
          </button>);})}
      </div>
      <button className="xbtn" style={{marginTop:10,fontSize:13,fontWeight:700,padding:0}}
        onClick={()=>{pushUndo();upDs({groups:ds.groups.filter(x=>x.id!==g.id)});}}>
        <Ic n="trash" size={13}/>{t("deleteGroup")}</button>
    </div>)}
  </div>);
}

/* ---------- Druck-Zeugnis ---------- */
function renderPrint(state,ds,sc,t){
  const el=document.getElementById("print"); if(!el)return;
  const lang=state.lang;
  const avg=mean(ds.subjects.map(s=>parseNum(s.grade)));
  const rows=ds.subjects.map(s=>{
    const name=typeof s.name==="string"?s.name:s.name[lang];
    return `<tr><td>${name}</td><td>${fmt(parseNum(s.grade),lang)}</td><td>${fmt(parseNum(s.wish),lang)}</td></tr>`;
  }).join("");
  el.innerHTML=`<div class="print-sheet">
    <h1>${APP_NAME} – ${t("report")}</h1>
    <div>${[state.name,state.school,ds.label].filter(Boolean).join(" · ")}</div>
    <table><tr><th>${t("subjects")}</th><th>${t("grade")}</th><th>★ ${t("wish")}</th></tr>${rows}</table>
    <p><strong>${t("avg")}: ${fmt(avg,lang)}</strong></p>
    <p style="font-size:12px;color:#666">${APP_NAME}: ${APP_SUB} · v${APP_VER} · ${t("developedBy")} ${DEVELOPER}</p>
  </div>`;
}

export default App;
