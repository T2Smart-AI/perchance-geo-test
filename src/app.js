/* GEO-ATLAS — app bilingue FR/EN */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const loc = () => S.lang==="en" ? "en-US" : "fr-FR";
const fmtInt = n => (n==null||isNaN(n)) ? "—" : Number(n).toLocaleString(loc());
const fmtArea = n => (!n ? "—" : Number(n).toLocaleString(loc()) + " km²");
const fmtKm = n => (n==null||isNaN(n)) ? "—" : Number(n).toLocaleString(loc());
const I18N = () => (window.ATLAS_I18N||{});
const t = k => { const D=I18N(); const L=(D&&D[S.lang])||{}; if(L[k]!==undefined) return L[k]; if(D.fr&&D.fr[k]!==undefined) return D.fr[k]; return k; };
const cn = c => !c ? "—" : (S.lang==="en" ? (c.en||c.fr) : (c.fr||c.en));
const regionName = r => t("region_"+r)||r;
const contKey = k => ({Africa:"africa",Americas:"americas",Asia:"asia",Europe:"europe",Oceania:"oceania"})[k]||String(k).toLowerCase();
const SUB_FR={"Australia and New Zealand":"Australie et Nouvelle-Z\u00E9lande","Caribbean":"Cara\u00EFbes","Central America":"Am\u00E9rique centrale","Central Asia":"Asie centrale","Central Europe":"Europe centrale","Eastern Africa":"Afrique de l'Est","Eastern Asia":"Asie de l'Est","Eastern Europe":"Europe de l'Est","Melanesia":"M\u00E9lan\u00E9sie","Micronesia":"Micron\u00E9sie","Middle Africa":"Afrique centrale","North America":"Am\u00E9rique du Nord","Northern Africa":"Afrique du Nord","Northern Europe":"Europe du Nord","Polynesia":"Polyn\u00E9sie","South America":"Am\u00E9rique du Sud","South-Eastern Asia":"Asie du Sud-Est","Southeast Europe":"Europe du Sud-Est","Southern Africa":"Afrique australe","Southern Asia":"Asie du Sud","Southern Europe":"Europe du Sud","Western Africa":"Afrique de l'Ouest","Western Asia":"Asie de l'Ouest","Western Europe":"Europe de l'Ouest"};
const subName = s => !s ? s : (S.lang==="en" ? s : (SUB_FR[s]||s));
const offName = c => { const p = S.lang==="en" ? (c.en||c.fr) : (c.off_fr||c.fr); const s = S.lang==="en" ? (c.off_fr||"") : (c.en||""); return (s && s!==p) ? p+" · "+s : p; };
const flagUrl = (c2,w) => "https://flagcdn.com/w"+(w||160)+"/"+String(c2||"").toLowerCase()+".png";
const densityOf = c => (c.area>0 && c.pop>0) ? c.pop/c.area : 0;

const S = {
  db:[], byC3:{}, byC2:{}, geo:null,
  page:"cover", pageOrder:["cover","monde","continents","thematiques","pays","comparateur","quiz","passeport","sources"],
  thematic:"politique", base:"plan", map:null, geoLayer:null, baseLayers:null, layersCtrl:null, selC3:null, cmpA:"FRA", cmpB:"JPN",
  visited:new Set(JSON.parse(localStorage.getItem("atlas_visited")||"[]")),
  quiz:{mode:"drapeaux",score:0,best:+(localStorage.getItem("atlas_quiz_best")||0),q:null,lock:false,round:0,mapTarget:null},
  sound:true, fxMode:"stars", fxParticles:[], confetti:[],
  regionFilter:"all", searchFilter:"",
  sort:"nom",
  blitz:null, blitzBest:+(localStorage.getItem("atlas_blitz_best")||0),
  quizMarathon:false, quizTotal:10, quizGood:0, quizMarathonBest:+(localStorage.getItem("atlas_marathon_best")||0),
  theme:localStorage.getItem("atlas_theme")||"light",
  lang:localStorage.getItem("atlas_lang")||(((navigator.language||"fr").toLowerCase().startsWith("en"))?"en":"fr"),
  anthems:{}, geoCache:{}, wxCache:{},
  miniMap:null, miniBases:{}, miniCountryLayer:null, miniNeighLayer:null, miniCapMarker:null,
  miniBase:"plan", showNeigh:true, showCap:true, modalTab:"carte"
};

/* ---------- sounds ---------- */
let AC=null;
function beep(f,d,type,g){
  if(!S.sound) return;
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(), gn=AC.createGain();
    o.type=type||"sine"; o.frequency.value=f||440;
    gn.gain.value=g||0.08; gn.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+(d||0.15));
    o.connect(gn); gn.connect(AC.destination); o.start(); o.stop(AC.currentTime+(d||0.15));
  }catch(e){}
}
const sndPage=()=>beep(520,.08,"triangle",.05);
const sndGood=()=>{beep(660,.12,"sine",.09);setTimeout(()=>beep(880,.18,"sine",.09),110);};
const sndBad=()=>beep(180,.25,"sawtooth",.06);

/* ---------- toast ---------- */
let toastT=null;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),2600); }

/* ---------- FX canvas ---------- */
const fxC = ()=> $("#fxCanvas");
function fxResize(){ const c=fxC(); if(c){c.width=innerWidth;c.height=innerHeight;} }
addEventListener("resize", fxResize);
function setFx(mode){ S.fxMode=mode; S.fxParticles=[]; const c=fxC(); if(!c) return;
  try{ if(matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(e){}
  const n = mode==="stars"?90 : mode==="confetti"?0 : 46;
  for(let i=0;i<n;i++) S.fxParticles.push({x:Math.random()*c.width,y:Math.random()*c.height,s:1+Math.random()*3,vx:(Math.random()-.5)*.6,vy:.3+Math.random()*.9,r:Math.random()*Math.PI,vr:(Math.random()-.5)*.05,emoji:pickEmoji(mode)});
}
function pickEmoji(mode){
  const bank={stars:["✨","⭐","🌟"],ocean:["🌊","💧","🫧","🐬"],forest:["🍃","🌿","🍂","🦜"],relief:["⛰️","❄️","🦅"],desert:["🏜️","💨","🐪"],villes:["🌃","✨","🚕"],quiz:["🎉","⭐","🎈"],hydro:["💧","🌊","🐟"]};
  const a=bank[mode]||bank.stars; return a[Math.floor(Math.random()*a.length)];
}
function confettiBurst(n){
  try{ if(matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(e){}
  const c=fxC(); n=n||120;
  for(let i=0;i<n;i++) S.confetti.push({x:c.width/2+(Math.random()-.5)*200,y:c.height*0.35,vx:(Math.random()-.5)*9,vy:-4-Math.random()*6,g:.28,s:3+Math.random()*5,c:["#f5d76e","#e05575","#2e9e5b","#1e7ab8","#7c5cd6","#ff9d3c"][i%6],r:Math.random()*Math.PI,vr:(Math.random()-.5)*.3,life:90+Math.random()*60});
}
function fxLoop(){
  const c=fxC(); if(!c){requestAnimationFrame(fxLoop);return;}
  const x=c.getContext("2d"); x.clearRect(0,0,c.width,c.height);
  x.font="16px serif"; x.textAlign="center";
  for(const p of S.fxParticles){
    p.x+=p.vx; p.y+=p.vy; p.r+=p.vr;
    if(p.y>c.height+20){p.y=-20;p.x=Math.random()*c.width;}
    if(p.x<-20)p.x=c.width+20; if(p.x>c.width+20)p.x=-20;
    x.save();x.globalAlpha=.75;x.translate(p.x,p.y);x.rotate(p.r);x.fillText(p.emoji,0,0);x.restore();
  }
  S.confetti=S.confetti.filter(p=>p.life>0);
  for(const p of S.confetti){
    p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.life--;
    x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6);x.restore();
  }
  requestAnimationFrame(fxLoop);
}

/* ---------- globe cover ---------- */
function globeLoop(){
  const c=$("#globeCanvas"); if(!c) return;
  const x=c.getContext("2d"); const W=c.width=340,H=c.height=340;
  let dots=[]; for(let i=0;i<260;i++){const la=(Math.random()-.5)*Math.PI,lo=Math.random()*Math.PI*2;dots.push({la,lo,s:Math.random()<.12?3:1.6});}
  let t=0;
  (function draw(){
    t+=0.008; x.clearRect(0,0,W,H);
    const R=130,cx=W/2,cy=H/2;
    const g=x.createRadialGradient(cx-40,cy-50,20,cx,cy,R+30);
    g.addColorStop(0,"#3f8fd1");g.addColorStop(.55,"#1e5f9e");g.addColorStop(1,"#0a2547");
    x.beginPath();x.arc(cx,cy,R,0,7);x.fillStyle=g;x.fill();
    x.strokeStyle="#c9a227";x.lineWidth=5;x.stroke();
    // continents fictifs stylisés (points)
    for(const d of dots){
      const lo=d.lo+t, x3=Math.cos(d.la)*Math.cos(lo), y3=Math.sin(d.la), z3=Math.cos(d.la)*Math.sin(lo);
      if(z3<-0.15) continue;
      const px=cx+x3*R, py=cy+y3*R;
      x.beginPath();x.arc(px,py,d.s,0,7);
      x.fillStyle=z3>0.5?"#ffe9a8":"#9ec8e8";x.globalAlpha=.35+z3*.65;x.fill();x.globalAlpha=1;
    }
    // orbit plane ✈
    const pa=t*1.4, px=cx+Math.cos(pa)*(R+26), py=cy+Math.sin(pa)*(R+26)*0.45;
    x.font="22px serif";x.fillText("✈️",px,py);
    x.strokeStyle="#ffe9a855";x.setLineDash([4,6]);x.beginPath();x.ellipse(cx,cy,R+26,(R+26)*0.45,0,0,7);x.stroke();x.setLineDash([]);
    requestAnimationFrame(draw);
  })();
}

/* ---------- navigation ---------- */
const PAGE_FX={cover:"stars",monde:"ocean",continents:"villes",thematiques:"forest",pays:"stars",comparateur:"desert",quiz:"quiz",passeport:"stars",sources:"hydro"};
function showPage(id){
  if(!S.pageOrder.includes(id)) return;
  S.page=id; sndPage();
  $$(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+id));
  $$("#toc .toc-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  $$("#mobileNav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  const i=S.pageOrder.indexOf(id);
  $("#prevBtn").disabled=i===0; $("#nextBtn").disabled=i===S.pageOrder.length-1;
  $("#pageNum").textContent=(i+1)+" / "+S.pageOrder.length+" — "+labelOf(id);
  const bar=$("#tocBar"); if(bar) bar.style.width=((i+1)/S.pageOrder.length*100)+"%";
  setFx(PAGE_FX[id]||"stars");
  if(id==="monde"){
    if(!S.map){ initMap(); }
    else setTimeout(()=>S.map.invalidateSize(),250);
    setTimeout(()=>{ if(S.map) S.map.invalidateSize(); },400);
  }
  $("#book").scrollIntoView({behavior:"smooth",block:"start"});
}
function labelOf(id){return {cover:t("nav_cover"),monde:t("nav_world"),continents:t("nav_continents"),thematiques:t("nav_themes"),pays:t("nav_countries"),comparateur:t("nav_versus"),quiz:t("nav_quiz"),passeport:t("nav_passport"),sources:t("nav_sources")}[id]||id;}

/* ---------- data ---------- */
async function loadData(){
  const [c,g,a]=await Promise.all([
    fetch("src/data/countries.json").then(r=>r.json()),
    fetch("src/data/world.geo.json").then(r=>r.json()),
    fetch("src/data/anthems.json").then(r=>r.json()).catch(()=>({}))
  ]);
  S.db=c; S.geo=g; S.anthems=a||{};
  c.forEach(o=>{S.byC3[o.c3]=o;S.byC2[o.c2]=o;});
  window.__atlasCountries={}; c.forEach(o=>window.__atlasCountries[o.c3]=o);
  window.__atlasVisited=[...S.visited];
}

/* ---------- map ---------- */
function popColor(v,max){ const t=Math.log10((v||1)+1)/Math.log10(max+1); const cols=["#fef6d8","#f5d76e","#f0a832","#e05575","#7c1d3f"]; return cols[Math.min(4,Math.floor(t*5))]; }
function chorStyle(feat){
  const c=S.byC3[feat.id];
  const imagery=S.base&&S.base!=="plan";
  const sel=S.selC3&&feat.id===S.selC3;
  if(S.thematic==="politique"){
    if(sel) return {fillColor:"#c9a227",weight:2.5,color:"#3a2a08",fillOpacity:imagery?.8:.95};
    if(imagery) return {fillColor:"#ffffff",weight:1.2,color:"#ffffff",fillOpacity:.10};
    const h=Math.abs(hash(feat.id))%5;
    return {fillColor:["#bcd7f0","#a8d5b5","#f5d76e","#f0b8c8","#cfc0ee"][h],weight:1,color:"#0e1c36",fillOpacity:.88};
  }
  if(!c) return {fillColor:"#cccccc",weight:1,color:imagery?"#ffffff":"#0e1c36",fillOpacity:imagery?.25:.7};
  let s;
  if(S.thematic==="population"){const max=1420000000;s={fillColor:popColor(c.pop,max),weight:1,color:"#0e1c36",fillOpacity:.9};}
  else if(S.thematic==="densite"){const max=22000;s={fillColor:popColor(densityOf(c),max),weight:1,color:"#0e1c36",fillOpacity:.9};}
  else if(S.thematic==="superficie"){const max=17098242;s={fillColor:popColor(c.area,max),weight:1,color:"#0e1c36",fillOpacity:.9};}
  else s={fillColor:"#bcd7f0",weight:1,color:"#0e1c36",fillOpacity:.88};
  if(imagery){ s.fillOpacity=Math.min(s.fillOpacity,.45); s.color="#ffffff"; }
  if(sel){ s.fillColor="#c9a227"; s.weight=2.5; s.color="#3a2a08"; s.fillOpacity=Math.max(s.fillOpacity,.6); }
  return s;
}
function hash(s){let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h);}
function initMap(){
  if(typeof L==="undefined"){ const el=$("#worldMap"); if(el) el.innerHTML="<p class='hint'>"+t("map_unavailable")+"</p>"; return; }
  const ERR = "data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e4d2ac"/><text x="128" y="118" font-size="44" text-anchor="middle">🗺️</text><text x="128" y="150" font-size="13" text-anchor="middle" fill="#7a5c14">'+t("tile_unavailable")+'</text></svg>');
  const attr = "© Esri, Maxar, Earthstar Geographics, OpenStreetMap contributors";
  const opt = {maxZoom:16, errorTileUrl:ERR, attribution:attr, keepBuffer:4};
  const osm=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",opt);
  const esri=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",opt);
  const carto=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",opt);
  const topo=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",opt);
  S.map=L.map("worldMap",{center:[24,8],zoom:2,minZoom:2,maxZoom:16,worldCopyJump:true,layers:[osm],preferCanvas:true,zoomAnimation:true,fadeAnimation:true,markerZoomAnimation:true});
  {const _bl={};_bl[t("base_plan")]=osm;_bl[t("base_sat")]=esri;_bl[t("base_relief")]=carto;_bl[t("base_dark")]=topo;S.layersCtrl=L.control.layers(_bl).addTo(S.map);}
  S.baseLayers={plan:osm,sat:esri,relief:carto,dark:topo}; S.base="plan";
  S.map.on("baselayerchange",e=>{ for(const k in S.baseLayers){ if(S.baseLayers[k]===e.layer){ S.base=k; break; } } if(S.geoLayer){ try{S.geoLayer.bringToFront();}catch(_e){} } refreshMap(); });
  S.map.on("loading",()=>{const l=$("#tileLoad"); if(l)l.hidden=false;});
  S.map.on("load",()=>{const l=$("#tileLoad"); if(l)l.hidden=true;});
  S.geoLayer=L.geoJSON(S.geo,{style:chorStyle,onEachFeature:(f,l)=>{
    const c=S.byC3[f.id];
    const nm=c?cn(c):(f.properties&&f.properties.name)||f.id;
    l.bindTooltip("📍 <b>"+nm+"</b>",{sticky:true});
    l.on("click",()=>{ onMapCountry(f.id); });
  }}).addTo(S.map);
  L.control.scale({imperial:false}).addTo(S.map);
  S.map.on("mousemove",e=>{ const v=$("#coordVal"); if(v)v.textContent=Math.abs(e.latlng.lat).toFixed(2)+"°"+(e.latlng.lat>=0?t("dir_n"):t("dir_s"))+" · "+Math.abs(e.latlng.lng).toFixed(2)+"°"+(e.latlng.lng>=0?t("dir_e"):t("dir_w")); });
  S.map.on("click",e=>{
    if(!S.measuring) return;
    S.measurePts.push([e.latlng.lat,e.latlng.lng]);
    if(!S.measureMarks)S.measureMarks=[];
    S.measureMarks.push(L.circleMarker(e.latlng,{radius:5,color:"#c9a227",weight:3,fillOpacity:1}).addTo(S.map));
    if(S.measureLine)S.map.removeLayer(S.measureLine);
    S.measureLine=L.polyline(S.measurePts,{color:"#e05575",weight:3,dashArray:"8 6"}).addTo(S.map);
    const km=pathKm(S.measurePts), mv=$("#measureVal");
    if(mv)mv.textContent=" · 📏 "+fmtKm(km)+t("measure_km_mid")+S.measurePts.length+t("measure_pts_mid");
  });
  S.map.on("dblclick",()=>{ if(S.measuring)finishMeasure(); });
  updateLegend();
}
function refreshMap(){ if(S.geoLayer) S.geoLayer.setStyle(chorStyle); updateLegend(); }
function updateLegend(){
  const el=$("#mapLegend"); if(!el) return;
  if(S.thematic==="politique"){el.innerHTML="<span>"+((S.base&&S.base!=="plan")?t("legend_borders"):t("legend_pol"))+"</span>";return;}
  const labels={population:t("legend_pop"),densite:t("legend_dens"),superficie:t("legend_area")};
  el.innerHTML="<span>"+labels[S.thematic]+"</span><span class='legend-scale'><i style='background:#fef6d8'></i><i style='background:#f5d76e'></i><i style='background:#f0a832'></i><i style='background:#e05575'></i><i style='background:#7c1d3f'></i></span><span>"+t("low_high")+"</span>";
}
function flyToCountry(c){
  if(!S.map||!c) return;
  const ll=c.latlng||[20,0];
  S.map.flyTo([ll[0],ll[1]],4,{duration:1.6});
  S.selC3=c.c3; refreshMap();
}
/* mesure de distance */
function toggleMeasure(){
  S.measuring=!S.measuring; S.measurePts=[];
  const b=$("#measureBtn"); if(b){b.textContent=t("measure_label")+" : "+(S.measuring?t("on_word"):t("off_word"));b.classList.toggle("active",S.measuring);}
  if(S.measureLine){S.map.removeLayer(S.measureLine);S.measureLine=null;}
  if(S.measureMarks){S.measureMarks.forEach(m=>S.map.removeLayer(m));S.measureMarks=[];}
  const mv=$("#measureVal"); if(mv)mv.textContent="";
  if(S.measuring&&S.map){ toast(t("measure_toast")); S.map.doubleClickZoom.disable(); }
  else if(S.map){ S.map.doubleClickZoom.enable(); }
}
function finishMeasure(){
  if(!S.measurePts||!S.measurePts.length){ toggleMeasure(); return; }
  S.measuring=false;
  const b=$("#measureBtn"); if(b){b.textContent=t("measure_label")+" : "+t("off_word");b.classList.remove("active");}
  if(S.map)S.map.doubleClickZoom.enable();
  const km=pathKm(S.measurePts);
  const mv=$("#measureVal"); if(mv)mv.textContent=t("measure_total")+fmtKm(km)+t("measure_km");
  toast("📏 "+fmtKm(km)+t("measured_toast"));
  beep(700,.12,"triangle",.06);
}
function pathKm(pts){
  let t=0;
  for(let i=1;i<pts.length;i++){
    const R=6371,t2=Math.PI/180;
    const dLa=(pts[i][0]-pts[i-1][0])*t2,dLo=(pts[i][1]-pts[i-1][1])*t2;
    const s=Math.sin(dLa/2)**2+Math.cos(pts[i-1][0]*t2)*Math.cos(pts[i][0]*t2)*Math.sin(dLo/2)**2;
    t+=2*R*Math.asin(Math.sqrt(s));
  }
  return Math.round(t);
}
function onMapCountry(c3){
  if(S.measuring) return; // en mode mesure, le clic pose un point
  const c=S.byC3[c3];
  if(S.quiz.mapTarget){ quizMapClick(c3); return; }
  if(c){ flyToCountry(c); openCountry(c3); beep(700,.1,"triangle",.06); }
}

/* ---------- country modal ---------- */
function regionEmoji(r){return {Europe:"🇪🇺",Asia:"🌏",Africa:"🌍",Americas:"🌎",Oceania:"🏝️",Antarctic:"🧊",Polar:"🧊"}[r]||"🌐";}
function openCountry(c3){
  const c=S.byC3[c3]; if(!c) return;
  S.selC3=c3; refreshMap(); markVisited(c3);
  stopRealAnthem();
  $("#mAnthemStatus").textContent=t("anthem_status_default");
  $("#mFlag").src=flagUrl(c.c2,320); $("#mFlag").alt=t("alt_flag")+cn(c);
  $("#mEmoji").textContent=c.flagEmoji||"🏳️";
  $("#mName").textContent=cn(c); $("#mOff").textContent=offName(c);
  $("#mCapital").textContent=c.capital||"—";
  $("#mRegion").textContent=regionEmoji(c.region)+" "+(regionName(c.region)||"—")+(c.subregion?" · "+subName(c.subregion):"");
  $("#mPop").textContent=fmtInt(c.pop); $("#mArea").textContent=fmtArea(c.area);
  const d=densityOf(c); $("#mDens").textContent=d?d.toFixed(1)+t("per_km2"):"—";
  $("#mLang").textContent=c.langs.length?c.langs.join(", "):"—";
  $("#mCurr").textContent=c.curr.length?c.curr.map(k=>k.name+" ("+k.code+(k.symbol?" "+k.symbol:"")+")").join(", "):"—";
  $("#mMeta").textContent="☎ "+(c.idd||"—")+" · 🌐 "+(c.tld.join(" ")||"—")+" · "+(c.landlocked?t("meta_locked"):t("meta_sea"))+" · "+(c.un?t("meta_un"):t("meta_un_no"));
  const maxPop=Math.max(...S.db.map(o=>o.pop)), maxArea=Math.max(...S.db.map(o=>o.area)), maxD=Math.max(...S.db.map(o=>densityOf(o)));
  barTo("#mPopBar",c.pop/maxPop); barTo("#mAreaBar",c.area/maxArea); barTo("#mDensBar",densityOf(c)/maxD);
  $("#mRank").textContent=t("rank_pop_pre")+(rankOf(c,"pop"))+" "+t("rank_area_mid")+rankOf(c,"area");
  const bc=$("#mBorders"); bc.innerHTML="";
  if(c.borders.length){c.borders.forEach(b=>{const n=S.byC3[b];if(!n)return;const btn=document.createElement("button");btn.className="b-chip";btn.textContent=(n.flagEmoji||"")+" "+cn(n);btn.onclick=()=>openCountry(b);bc.appendChild(btn);});}
  else bc.innerHTML="<span style='font-size:13px'>"+t("no_borders")+"</span>";
  $("#mVisit").textContent="🛂 "+S.visited.size+" "+t("visited_suffix");
  $("#mFact").textContent=funFact(c);
  // --- V2 : cartes thématiques par pays ---
  renderThemeCards(c);
  // culture
  const an=S.anthems[c.c3]||(t("anthem_of")+cn(c));
  $("#mAnthem").textContent="🎼 "+an;
  $("#mAnthemYt").onclick=()=>window.open("https://www.youtube.com/results?search_query="+encodeURIComponent(t("yt_query_pre")+cn(c)+t("yt_query_mid")),"_blank");
  $("#mCultLang").textContent="🗣️ "+(c.langs.join(", ")||"—");
  $("#mCultCurr").textContent="💰 "+($("#mCurr").textContent);
  $("#mCultDemo").textContent=t("demonym_label")+(c.demonym_fr||"—")+" · "+(c.capital?("🏛️ "+c.capital):"");
  // voyage
  const fra=S.byC3["FRA"];
  const km=fra?distKm(fra,c):0;
  const cz=c.latlng?climateZone(c.latlng[0]):null;
  $("#mTravel").textContent=t("travel_paris_to")+(c.capital||cn(c))+" : "+(km?fmtKm(km)+" "+t("travel_km_mid"):"—")+t("travel_sep")+(cz?cz.emoji+" "+cz.label:"")+t("travel_sep")+(c.landlocked?t("locked_word"):t("coast_word"));
  const mn=$("#mNear"); if(mn){
    mn.innerHTML="";
    if(c.latlng){
      const near=S.db.filter(o=>o.c3!==c.c3&&o.latlng).map(o=>({o,km:distKm(c,o)})).sort((a,b)=>a.km-b.km).slice(0,4);
      near.forEach(n=>{const b=document.createElement("button");b.className="b-chip";b.textContent="✈️ "+(n.o.flagEmoji||"")+cn(n.o)+" · "+fmtKm(n.km)+" "+t("travel_km_mid");b.onclick=()=>openCountry(n.o.c3);mn.appendChild(b);});
    }
  }
  // onglets + carte + météo
  switchModalTab("carte");
  $("#countryModal").classList.add("open");
  setTimeout(()=>{ showCountryMap(c); },80);
  loadWeather(c);
}
function barTo(sel,r){requestAnimationFrame(()=>{const e=$(sel);if(e)e.style.width=Math.max(2,Math.min(100,r*100))+"%";});}
function rankOf(c,k){const s=[...S.db].sort((a,b)=>b[k]-a[k]);return s.findIndex(o=>o.c3===c.c3)+1;}
function funFact(c){
  const d=densityOf(c), facts=[];
  if(c.pop>200000000) facts.push(t("ff_giant")+fmtInt(c.pop)+t("ff_giant_end"));
  if(c.area>2000000) facts.push(t("ff_huge")+fmtArea(c.area)+t("ff_huge_end"));
  if(d>500) facts.push(t("ff_dense")+d.toFixed(0)+t("ff_dense_end"));
  if(d<5&&c.pop>0) facts.push(t("ff_empty")+d.toFixed(1)+t("ff_empty_end"));
  if(c.landlocked) facts.push(t("ff_locked"));
  if(!c.borders.length) facts.push(t("ff_island"));
  if(c.langs.length>3) facts.push(t("ff_langs")+c.langs.length+t("ff_langs_end"));
  if(c.capital) facts.push(t("ff_cap_pre")+c.capital+t("ff_cap_mid"));
  facts.push(t("ff_curr")+(c.curr[0]?c.curr[0].name+" ("+c.curr[0].code+")":"—")+t("ff_curr_end"));
  return "💡 "+facts[Math.floor(Math.random()*facts.length)];
}
function closeCountry(){$("#countryModal").classList.remove("open");stopRealAnthem();}
function markVisited(c3){ if(!S.visited.has(c3)){S.visited.add(c3);localStorage.setItem("atlas_visited",JSON.stringify([...S.visited]));window.__atlasVisited=[...S.visited];renderPassport();renderGrid();updateCoverPass();} }

/* ---------- search ---------- */
function initSearch(){
  const inp=$("#searchInput"), drop=$("#searchDrop");
  inp.addEventListener("input",()=>{
    const q=inp.value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if(q.length<2){drop.classList.remove("open");drop.innerHTML="";return;}
    const res=S.db.filter(c=>(c.fr+" "+c.en+" "+c.capital).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(q)).slice(0,8);
    drop.innerHTML="";res.forEach(c=>{const d=document.createElement("div");d.className="sr-item";d.innerHTML="<img loading='lazy' src='"+flagUrl(c.c2,80)+"'><b>"+cn(c)+"</b><small>"+(c.capital||"")+"</small>";d.onclick=()=>{drop.classList.remove("open");inp.value="";openCountry(c.c3);};drop.appendChild(d);});
    drop.classList.toggle("open",res.length>0);
  });
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"){const first=drop.querySelector(".sr-item");if(first)first.click();}});
  document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))drop.classList.remove("open");});
}

/* ---------- continents ---------- */
const CONT_DEF=[
  {k:"Africa",e:"🦁"},
  {k:"Americas",e:"🦅"},
  {k:"Asia",e:"🐼"},
  {k:"Europe",e:"🏰"},
  {k:"Oceania",e:"🦘"},
];
function renderContinents(){
  const w=$("#contGrid"); w.innerHTML="";
  CONT_DEF.forEach(cd=>{
    const list=S.db.filter(c=>c.region===cd.k);
    const pop=list.reduce((a,c)=>a+c.pop,0);
    const big=[...list].sort((a,b)=>b.pop-a.pop)[0];
    const d=document.createElement("div");d.className="card cont-card";
    const cdn=t("cd_"+contKey(cd.k));
    d.innerHTML="<span class='big'>"+cd.e+"</span><h3>"+cdn+"</h3><p>"+t("cd_"+contKey(cd.k)+"_d")+"</p><b class='n'>"+list.length+" "+t("countries_word")+"</b><p>👥 "+fmtInt(pop)+"<br>⭐ "+(big?big.flagEmoji+" "+cn(big):"—")+"</p><button class='chip'>"+t("explore_btn")+"</button>";
    d.onclick=()=>{S.regionFilter=cd.k;S.searchFilter="";syncFilters();showPage("pays");toast(cd.e+" "+cdn+" : "+list.length+" "+t("countries_word"));};
    w.appendChild(d);
  });
}

/* ---------- pays grid ---------- */
function syncFilters(){ const a=$("#fRegion"); if(a)a.value=S.regionFilter; const b=$("#fSearch"); if(b)b.value=S.searchFilter; }
function renderGrid(){
  const g=$("#countryGrid"); if(!g) return;
  const q=S.searchFilter.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  let list=S.db.filter(c=>(S.regionFilter==="all"||c.region===S.regionFilter));
  if(q) list=list.filter(c=>(c.fr+" "+c.en+" "+c.capital).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").includes(q));
  if(S.sort==="pop") list=[...list].sort((a,b)=>b.pop-a.pop);
  else if(S.sort==="area") list=[...list].sort((a,b)=>b.area-a.area);
  else if(S.sort==="dens") list=[...list].sort((a,b)=>densityOf(b)-densityOf(a));
  else list=[...list].sort((a,b)=>cn(a).localeCompare(cn(b),S.lang==="en"?"en":"fr"));
  $("#payCount").textContent=list.length+" "+t("shown_middle")+" "+S.visited.size+" "+t("visited_word")+" 🛂";
  g.innerHTML="";
  const frag=document.createDocumentFragment();
  list.slice(0,400).forEach(c=>{
    const d=document.createElement("div");d.className="c-card"+(S.visited.has(c.c3)?" visited":"");
    d.innerHTML="<img loading='lazy' src='"+flagUrl(c.c2,160)+"' alt=''><b>"+c.flagEmoji+" "+cn(c)+"</b><small>"+(c.capital||"—")+" · "+fmtInt(c.pop)+"</small>";
    d.onclick=()=>openCountry(c.c3); frag.appendChild(d);
  });
  g.appendChild(frag);
}

/* ---------- comparateur ---------- */
function initCompare(){
  const a=$("#cmpA"),b=$("#cmpB");
  const opts=S.db.map(c=>"<option value='"+c.c3+"'>"+c.flagEmoji+" "+cn(c)+"</option>").join("");
  a.innerHTML=opts;b.innerHTML=opts;a.value=S.cmpA;b.value=S.cmpB;
  a.onchange=()=>{S.cmpA=a.value;renderCompare();};b.onchange=()=>{S.cmpB=b.value;renderCompare();};
  renderCompare();
}
function renderCompare(){
  const A=S.byC3[S.cmpA],B=S.byC3[S.cmpB]; if(!A||!B)return;
  $("#cmpFlagA").src=flagUrl(A.c2,320);$("#cmpFlagB").src=flagUrl(B.c2,320);
  $("#cmpNameA").textContent=A.flagEmoji+" "+cn(A);$("#cmpNameB").textContent=B.flagEmoji+" "+cn(B);
  const rows=[
    {l:t("row_pop"),a:A.pop,b:B.pop,f:fmtInt},
    {l:t("row_area"),a:A.area,b:B.area,f:v=>fmtArea(v)},
    {l:t("row_dens"),a:densityOf(A),b:densityOf(B),f:v=>v.toFixed(1)+t("per_km2")},
    {l:t("row_langs"),a:A.langs.length,b:B.langs.length,f:v=>v},
    {l:t("row_neigh"),a:A.borders.length,b:B.borders.length,f:v=>v},
  ];
  const w=$("#cmpRows");w.innerHTML="";
  rows.forEach(r=>{
    const mx=Math.max(r.a,r.b,1e-9), win=r.a===r.b?t("tie"):(r.a>r.b?cn(A)+" "+t("wins_suffix"):cn(B)+" "+t("wins_suffix"));
    const d=document.createElement("div");d.className="cmp-row";
    d.innerHTML="<div class='t'><span>"+r.l+"</span><span>"+win+"</span></div>"+
      "<div style='display:flex;gap:6px;align-items:center'><span style='width:120px;text-align:right;font-weight:800'>"+r.f(r.a)+"</span><div class='bar' style='flex:1'><i style='width:"+(r.a/mx*100)+"%'></i></div></div>"+
      "<div style='display:flex;gap:6px;align-items:center'><span style='width:120px;text-align:right;font-weight:800'>"+r.f(r.b)+"</span><div class='bar' style='flex:1'><i style='width:"+(r.b/mx*100)+"%;background:linear-gradient(90deg,#e05575,#ff9d3c)'></i></div></div>";
    w.appendChild(d);
  });
  // capitale + vol
  $("#cmpCaps").textContent="🏛️ "+A.capital+" vs "+B.capital+" · 📏 "+fmtKm(distKm(A,B))+" "+t("between_km");
}
function distKm(A,B){
  if(!A.latlng||!B.latlng)return 0;
  const R=6371,t=Math.PI/180;
  const dLa=(B.latlng[0]-A.latlng[0])*t,dLo=(B.latlng[1]-A.latlng[1])*t;
  const s=Math.sin(dLa/2)**2+Math.cos(A.latlng[0]*t)*Math.cos(B.latlng[0]*t)*Math.sin(dLo/2)**2;
  return Math.round(2*R*Math.asin(Math.sqrt(s)));
}
function cmpFly(){const A=S.byC3[S.cmpA];if(A){showPage("monde");setTimeout(()=>flyToCountry(A),400);}}
/* ---------- tournoi ---------- */
function startTournament(){
  const pool=[...S.db].sort(()=>Math.random()-.5).slice(0,8).map(c=>c.c3);
  S.tourn={teams:pool,round:1,idx:0,winners:[]};
  renderTourn(); sndPage();
}
function renderTourn(){
  const T=S.tourn,z=$("#tournZone"); if(!T||!z)return;
  if(T.idx>=T.teams.length){ // fin de manche
    if(T.winners.length===1){ tournChampion(T.winners[0]); return; }
    T.teams=T.winners;T.winners=[];T.idx=0;T.round++;
  }
  const A=S.byC3[T.teams[T.idx]],B=S.byC3[T.teams[T.idx+1]];
  const names={1:t("rnd_quarter"),2:t("rnd_semi"),3:t("rnd_final")}; 
  z.innerHTML="<h4>"+(names[T.round]||(t("rnd_round")+" "+T.round))+" — "+t("duel_word")+" "+(T.idx/2+1)+"</h4>"+
    "<div style='display:flex;gap:10px;justify-content:center;flex-wrap:wrap'>"+
    ["<button class='c-card' style='min-width:150px' data-v='"+A.c3+"'><img loading='lazy' src='"+flagUrl(A.c2,160)+"'><b>"+A.flagEmoji+" "+cn(A)+"</b><small>"+(A.capital||"")+"</small></button>",
     "<button class='c-card' style='min-width:150px' data-v='"+B.c3+"'><img loading='lazy' src='"+flagUrl(B.c2,160)+"'><b>"+B.flagEmoji+" "+cn(B)+"</b><small>"+(B.capital||"")+"</small></button>"].join("<div style='align-self:center;font-size:28px;font-weight:900'>VS</div>")+"</div>";
  z.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>voteTourn(b.dataset.v));
  renderTournChamps();
}
function voteTourn(c3){
  const T=S.tourn; T.winners.push(c3);T.idx+=2; beep(700,.1,"triangle",.06); renderTourn();
}
function tournChampion(c3){
  const c=S.byC3[c3],z=$("#tournZone");
  let champs=[]; try{champs=JSON.parse(localStorage.getItem("atlas_champs")||"[]");}catch(e){}
  champs.unshift({c3,date:new Date().toLocaleDateString(S.lang==="en"?"en-US":"fr-FR")}); champs=champs.slice(0,5);
  try{localStorage.setItem("atlas_champs",JSON.stringify(champs));}catch(e){}
  z.innerHTML="<div style='font-size:54px'>🏆</div><h3>"+t("champion_is")+c.flagEmoji+" "+cn(c)+" !</h3><img src='"+flagUrl(c.c2,320)+"' style='max-width:280px;border-radius:12px;box-shadow:0 10px 26px #0005'><br><br><button class='cta gold' onclick='startTournament()'>"+t("tourn_new")+"</button> <button class='cta navy' onclick='openCountry(\""+c3+"\")'>"+t("tourn_sheet")+"</button>";
  confettiBurst(160);sndGood();markVisited(c3);renderTournChamps();
}
function renderTournChamps(){
  const el=$("#tournChamps"); if(!el)return;
  let champs=[]; try{champs=JSON.parse(localStorage.getItem("atlas_champs")||"[]");}catch(e){}
  el.innerHTML=champs.length?(t("champs_last")+champs.map(h=>{const c=S.byC3[h.c3];return c?c.flagEmoji+" "+cn(c):"";}).join(" · ")):t("champs_none");
}
/* ---------- fin tournoi ---------- */

/* ---------- quiz ---------- */
function quizQ(){
  const db=S.db.filter(c=>c.pop>20000);
  const pick=()=>db[Math.floor(Math.random()*db.length)];
  if(S.quiz.mode==="drapeaux"){
    const a=pick();const opts=new Set([a.c3]);while(opts.size<4)opts.add(pick().c3);
    return {a,opts:[...opts].map(c3=>S.byC3[c3]).sort(()=>Math.random()-.5),label:t("q_flag")};
  }
  if(S.quiz.mode==="capitales"){
    const a=pick();if(!a.capital)return quizQ();
    const opts=new Set([a.c3]);while(opts.size<4){const x=pick();if(x.capital)opts.add(x.c3);}
    return {a,opts:[...opts].map(c3=>S.byC3[c3]).sort(()=>Math.random()-.5),label:t("q_cap_pre")+cn(a)+(S.lang==="en"?"?":" ?")};
  }
  // carte
  const a=pick();
  return {a,opts:[],label:t("q_map_pre")+a.flagEmoji+" "+cn(a)+t("q_map_post")};
}
function renderQuiz(){
  if(S.blitz&&Date.now()>S.blitz.end){ blitzFinal(); return; }
  const q=S.quiz.q=quizQ();S.quiz.lock=false;
  const B=!!S.blitz;
  const M=!B&&S.quizMarathon&&S.quiz.mode!=="carte";
  S.quiz.round++;
  const pw=$("#quizProgWrap"); if(pw)pw.hidden=!M;
  if(M){ $("#quizProg").style.width=((S.quiz.round-1)/S.quizTotal*100)+"%"; }
  $("#quizLabel").textContent=(B?"⚡ ":"")+(M?"🏁 ["+S.quiz.round+"/"+S.quizTotal+"] ":"")+q.label;
  $("#quizScore").textContent=B?("⚡ "+S.blitz.good+" "+(S.lang==="en"?"correct":"bonnes")+" · "+t("record_word")+" "+S.blitzBest):(M?("Marathon "+S.quizGood+"/"+S.quizTotal+" · "+t("record_word")+" "+S.quizMarathonBest+"/"+S.quizTotal):(t("score_word")+" "+S.quiz.score+" · "+t("record_word")+" "+S.quiz.best+" · "+t("round_word")+" "+S.quiz.round));
  const img=$("#quizFlag"),opts=$("#quizOpts"),hint=$("#quizMapHint");
  opts.innerHTML="";
  if(S.quiz.mode==="drapeaux"){
    img.style.display="block";img.src=flagUrl(q.a.c2,320);hint.hidden=true;
    q.opts.forEach(c=>{const b=document.createElement("button");b.className="quiz-opt";b.textContent=c.flagEmoji+" "+cn(c);b.onclick=()=>answerQuiz(c.c3===q.a.c3,b);opts.appendChild(b);});
  }else if(S.quiz.mode==="capitales"){
    img.style.display="none";hint.hidden=true;
    $("#quizLabel").textContent="🏛️ "+q.label;
    q.opts.forEach(c=>{const b=document.createElement("button");b.className="quiz-opt";b.textContent=c.capital||"?";b.onclick=()=>answerQuiz(c.c3===q.a.c3,b);opts.appendChild(b);});
  }else{
    img.style.display="none";hint.hidden=false;
    S.quiz.mapTarget=q.a.c3;
    toast(t("map_need")+cn(q.a)+t("map_need_end"));
  }
}
function answerQuiz(ok,btn){
  if(S.quiz.lock)return;S.quiz.lock=true;
  if(S.blitz){ answerBlitz(ok,btn); return; }
  const M=S.quizMarathon&&S.quiz.mode!=="carte";
  if(ok){btn&&btn.classList.add("good");sndGood();confettiBurst(M?40:70);S.quiz.score++;if(M)S.quizGood++;
    if(!M&&S.quiz.score>S.quiz.best){S.quiz.best=S.quiz.score;localStorage.setItem("atlas_quiz_best",S.quiz.best);}
    toast(M?(t("good_marathon_mid")+S.quizGood+"/"+S.quizTotal+")"):t("good_toast"));
  }else{btn&&btn.classList.add("bad");sndBad();if(!M)S.quiz.score=0;toast(t("bad_toast")+cn(S.quiz.q.a)+" "+S.quiz.q.a.flagEmoji);}
  if(M){ $("#quizScore").textContent="Marathon "+S.quizGood+"/"+S.quizTotal+" · "+t("record_word")+" "+S.quizMarathonBest+"/"+S.quizTotal; $("#quizProg").style.width=(S.quiz.round/S.quizTotal*100)+"%"; }
  else $("#quizScore").textContent=t("score_word")+" "+S.quiz.score+" · "+t("record_word")+" "+S.quiz.best+" · "+t("round_word")+" "+S.quiz.round;
  if(M&&S.quiz.round>=S.quizTotal) setTimeout(quizFinal,1200);
  else setTimeout(renderQuiz,1100);
}
/* ---------- blitz 60s ---------- */
function setBlitzUI(on){
  const w=$("#blitzWrap"),c=$("#blitzClock");
  if(w)w.hidden=!on; if(c)c.hidden=!on;
  const b=$("#blitzBtn"); if(b){b.textContent=t("blitz_btn")+" : "+(on?t("on_word"):t("off_word"));b.classList.toggle("active",!!on);}
}
function stopBlitz(silent){
  if(S.blitz&&S.blitz.timer)clearInterval(S.blitz.timer);
  S.blitz=null; setBlitzUI(false);
  if(!silent){S.quiz.score=0;S.quiz.round=0;renderQuiz();}
}
function toggleBlitz(){
  if(S.blitz){ stopBlitz(); return; }
  if(S.quizMarathon){ $("#marathonBtn").click(); }
  if(S.quiz.mode==="carte"){ $$(".quiz-setup .chip[data-m]")[0].click(); }
  S.blitz={end:Date.now()+60000,good:0,total:0,timer:null};
  S.quiz.score=0;S.quiz.round=0;S.quizGood=0;
  setBlitzUI(true);
  S.blitz.timer=setInterval(blitzTick,250);
  renderQuiz(); sndPage();
}
function blitzTick(){
  if(!S.blitz)return;
  const left=Math.max(0,S.blitz.end-Date.now());
  const s=Math.ceil(left/1000);
  const bar=$("#blitzBar"),clk=$("#blitzClock");
  if(bar)bar.style.width=(left/60000*100)+"%";
  if(clk)clk.textContent="⏱️ "+s+"s · ✅ "+S.blitz.good;
  if(left<=0){ blitzFinal(); }
}
function answerBlitz(ok,btn){
  const bl=S.blitz;
  bl.total++;
  if(ok){bl.good++;btn&&btn.classList.add("good");beep(880,.08,"triangle",.06);}
  else{btn&&btn.classList.add("bad");beep(200,.15,"sawtooth",.05);}
  $("#quizScore").textContent="⚡ "+bl.good+" "+(S.lang==="en"?"correct":"bonnes")+" · "+t("record_word")+" "+S.blitzBest;
  setTimeout(()=>{ if(!S.blitz)return; if(Date.now()>S.blitz.end)blitzFinal(); else renderQuiz(); },ok?450:750);
}
function blitzFinal(){
  if(!S.blitz)return;
  clearInterval(S.blitz.timer);
  const g=S.blitz.good; S.blitz=null; setBlitzUI(false);
  if(g>S.blitzBest){S.blitzBest=g;localStorage.setItem("atlas_blitz_best",g);}
  const verdict=g>=15?t("v_alien"):g>=10?t("v_champ"):g>=5?t("v_solid"):t("v_warm");
  $("#quizLabel").textContent=t("blitz_done")+g+" "+t("blitz_good_mid")+" "+verdict;
  $("#quizScore").textContent=t("blitz_record_is")+S.blitzBest;
  $("#quizFlag").style.display="none";const mh=$("#quizMapHint");if(mh)mh.hidden=true;
  const opts=$("#quizOpts");opts.innerHTML="";
  const b=document.createElement("button");b.className="quiz-opt good";b.textContent=t("replay_blitz");
  b.onclick=()=>toggleBlitz();
  opts.appendChild(b);
  if(g>=10){confettiBurst(150);sndGood();}
}
/* ---------- fin blitz ---------- */
function quizFinal(){
  const g=S.quizGood,tt=S.quizTotal;
  if(g>S.quizMarathonBest){S.quizMarathonBest=g;localStorage.setItem("atlas_marathon_best",g);}
  const verdict=g===t?t("v_perfect"):g>=7?t("v_excel"):g>=4?t("v_good"):t("v_retry");
  $("#quizLabel").textContent=t("marathon_done")+g+"/"+tt+" — "+verdict;
  $("#quizScore").textContent=t("marathon_record_is")+S.quizMarathonBest+"/"+tt;
  $("#quizFlag").style.display="none";const mh=$("#quizMapHint");if(mh)mh.hidden=true;
  const opts=$("#quizOpts");opts.innerHTML="";
  const b=document.createElement("button");b.className="quiz-opt good";b.textContent=t("replay_marathon");
  b.onclick=()=>{S.quizGood=0;S.quiz.round=0;S.quiz.score=0;renderQuiz();};
  opts.appendChild(b);
  const pw=$("#quizProgWrap");if(pw)pw.hidden=false;$("#quizProg").style.width="100%";
  if(g>=7){confettiBurst(150);sndGood();}else sndPage();
}
function quizMapClick(c3){
  if(!S.quiz.mapTarget)return;
  const ok=c3===S.quiz.mapTarget;
  if(ok){sndGood();confettiBurst(120);S.quiz.score++;markVisited(c3);toast(t("map_found_mid")+cn(S.byC3[c3])+t("map_found_end"));}
  else{sndBad();S.quiz.score=0;toast(t("map_wrong")+cn(S.byC3[S.quiz.mapTarget])+t("map_wrong_eye"));}
  if(S.quiz.score>S.quiz.best){S.quiz.best=S.quiz.score;localStorage.setItem("atlas_quiz_best",S.quiz.best);}
  S.quiz.mapTarget=null;showPage("quiz");setTimeout(renderQuiz,600);
}

/* ---------- passeport ---------- */
const RANKS=[[0,"🥚"],[1,"🐣"],[10,"🧭"],[25,"⛵"],[50,"🌍"],[100,"👑"],[150,"🚀"],[200,"🌟"],[240,"🏆"]];
function passportRank(n){ let i=0; for(let k=0;k<RANKS.length;k++) if(n>=RANKS[k][0]) i=k; return i; }
function renderPassport(){
  const g=$("#stampGrid");if(!g)return;
  const pct=Math.round(S.visited.size/250*100);
  const rk=passportRank(S.visited.size);
  const next=RANKS.find(k=>k[0]>S.visited.size);
  $("#passCount").textContent=RANKS[rk][1]+" "+t("r"+rk)+" — "+S.visited.size+" / 250 "+t("out_of_countries")+" ("+pct+"%)"+(next?(" · "+t("next_rank")+": "+next[1]+" "+(S.lang==="en"?"at":"à")+" "+next[0]):" · "+t("maximum"));
  $("#passBar").style.width=pct+"%";
  const cp=$("#contProg");
  if(cp){ cp.innerHTML=""; CONT_DEF.forEach(cd=>{
    const tot=S.db.filter(c=>c.region===cd.k).length;
    const got=S.db.filter(c=>c.region===cd.k&&S.visited.has(c.c3)).length;
    const p=tot?Math.round(got/tot*100):0;
    const d=document.createElement("div");
    d.innerHTML="<div style='display:flex;justify-content:space-between;font-size:12px;font-weight:800'><span>"+cd.e+" "+t("cd_"+contKey(cd.k))+"</span><span>"+got+"/"+tot+"</span></div><div class='bar'><i style='width:"+p+"%'></i></div>";
    cp.appendChild(d);
  });}
  g.innerHTML="";
  [...S.visited].map(c3=>S.byC3[c3]).filter(Boolean).sort((a,b)=>cn(a).localeCompare(cn(b),S.lang==="en"?"en":"fr")).forEach(c=>{
    const d=document.createElement("div");d.className="stamp";d.innerHTML="<img loading='lazy' src='"+flagUrl(c.c2,80)+"'><br>"+c.flagEmoji+" "+cn(c);
    d.style.cursor="pointer";d.onclick=()=>openCountry(c.c3);g.appendChild(d);
  });
  if(!S.visited.size)g.innerHTML="<p style='opacity:.7'>"+t("empty_stamps")+"</p>";
}

/* ---------- divers ---------- */
function randomCountry(){
  const c=S.db[Math.floor(Math.random()*S.db.length)];
  confettiBurst(50);beep(900,.12,"triangle",.07);
  openCountry(c.c3);toast(t("random_toast")+c.flagEmoji+" "+cn(c)+" !");
}
function toggleSound(){S.sound=!S.sound;$("#soundBtn").textContent=S.sound?"🔊":"🔇";toast(S.sound?t("sound_on"):t("sound_off"));}

function updateCoverStats(){
  const totPop=S.db.reduce((a,c)=>a+c.pop,0);
  animNum("#stPays",250,"");animNum("#stPop",totPop,"");animNum("#stVisit",S.visited.size,"");
  updateCoverPass();
}
function updateCoverPass(){
  const pct=Math.round(S.visited.size/250*100);
  const b=$("#coverPassBar"),tx=$("#coverPassTxt");
  if(b)b.style.width=pct+"%";
  if(tx)tx.textContent=S.visited.size?(t("pass_cover_progress")+S.visited.size+t("pass_cover_mid")+pct+t("pass_cover_end")):t("pass_cover_empty");
  const day=Math.floor(Date.now()/864e5);
  const dc=S.db[(day*7919)%S.db.length];
  if(dc){ S.destC3=dc.c3; const dt=$("#destDayTxt"); if(dt)dt.textContent=t("dest_day")+dc.flagEmoji+" "+cn(dc)+" — "+(dc.capital||""); }
}
let coverFactTimer=null;
function startCoverFacts(){
  const big=[...S.db].sort((a,b)=>b.area-a.area)[0];
  const small=S.db.filter(c=>c.area>0).sort((a,b)=>a.area-b.area)[0];
  const pop=[...S.db].sort((a,b)=>b.pop-a.pop)[0];
  const dense=[...S.db].filter(c=>c.pop>100000).sort((a,b)=>densityOf(b)-densityOf(a))[0];
  const langs=[...S.db].sort((a,b)=>b.langs.length-a.langs.length)[0];
  const facts=[
    "💡 "+big.flagEmoji+" "+cn(big)+" "+t("cf_big_is")+fmtArea(big.area)+" !",
    "💡 "+pop.flagEmoji+" "+cn(pop)+" "+t("cf_pop_is")+fmtInt(pop.pop)+t("cf_habitants"),
    "💡 "+small.flagEmoji+" "+cn(small)+" "+t("cf_tiny_is")+fmtArea(small.area)+t("cf_tiny_end"),
    "💡 "+dense.flagEmoji+" "+cn(dense)+t("cf_dens_mid")+densityOf(dense).toFixed(0)+t("cf_dens_end"),
    "💡 "+langs.flagEmoji+" "+cn(langs)+t("cf_speaks")+langs.langs.length+t("cf_langs_end2"),
    t("cf_russia"),
    t("cf_ocean"),
    t("cf_sahara")
  ];
  let i=0; const el=$("#coverFact"); if(!el)return;
  const show=()=>{ el.style.opacity=0; setTimeout(()=>{ el.textContent=facts[i%facts.length]; el.style.opacity=1; i++; },350); };
  show(); if(coverFactTimer)clearInterval(coverFactTimer); coverFactTimer=setInterval(show,7000);
}
function animNum(sel,target,suf){
  const e=$(sel);if(!e)return;const t0=performance.now(),D=1400;
  (function f(t){const p=Math.min(1,(t-t0)/D),v=Math.round(target*(1-Math.pow(1-p,3)));
    e.textContent=v.toLocaleString(loc())+(suf||"");if(p<1)requestAnimationFrame(f);})(t0);
}

/* ---------- V2 : thème, climat, météo, hymnes, mini-cartes ---------- */
function setTheme(t){
  S.theme=t; document.documentElement.dataset.theme=(t==="dark"?"dark":"");
  localStorage.setItem("atlas_theme",t);
  const b=$("#themeBtn"); if(b)b.textContent=(t==="dark"?"☀️":"🌙");
}
function toggleTheme(){ setTheme(S.theme==="dark"?"light":"dark"); toast(S.theme==="dark"?t("theme_to_dark"):t("theme_to_light")); }
function climateZone(lat){
  const a=Math.abs(lat);
  if(a<10) return {label:t("climate_eq"),emoji:"🌴",desc:t("climate_eq_d")};
  if(a<23.5) return {label:t("climate_trop"),emoji:"☀️",desc:t("climate_trop_d")};
  if(a<35) return {label:t("climate_sub"),emoji:"🫒",desc:t("climate_sub_d")};
  if(a<55) return {label:t("climate_temp"),emoji:"🍂",desc:t("climate_temp_d")};
  if(a<66.5) return {label:t("climate_bor"),emoji:"❄️",desc:t("climate_bor_d")};
  return {label:t("climate_pol"),emoji:"🧊",desc:t("climate_pol_d")};
}
function wmoDesc(code){
  const e={0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"⛈️",71:"🌨️",73:"🌨️",75:"❄️",80:"🌦️",81:"🌧️",82:"⛈️",95:"⛈️",96:"⛈️",99:"⛈️"};
  if(e[code]!==undefined) return [t("wmo_"+code),e[code]];
  return [t("wmo_x"),"🌡️"];
}
async function geocodeCapital(c){
  if(!c.capital) return null;
  const k="geo_"+c.c3;
  if(S.geoCache[k]) return S.geoCache[k];
  try{
    const r=await fetch("https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(c.capital)+"&count=3&language="+(S.lang==="en"?"en":"fr"));
    const j=await r.json();
    const res=(j.results||[]).filter(x=>!x.country_code||x.country_code===c.c2);
    const best=res[0]||(j.results||[])[0]||null;
    if(best){S.geoCache[k]={lat:best.latitude,lng:best.longitude,name:best.name,tz:best.timezone};return S.geoCache[k];}
  }catch(e){}
  if(c.latlng){S.geoCache[k]={lat:c.latlng[0],lng:c.latlng[1],name:c.capital,approx:true};return S.geoCache[k];}
  return null;
}
async function loadWeather(c){
  const box=$("#mWx"); if(!box) return;
  $("#mWxCity").textContent="— "+(c.capital||"");
  const ck="wx_"+c.c3;
  if(S.wxCache[ck]&&Date.now()-S.wxCache[ck].t<15*60*1000){ renderWx(c,S.wxCache[ck].d); return; }
  box.innerHTML="<div class='skel'></div>";
  const g=await geocodeCapital(c);
  if(!g){ box.innerHTML="<p class='hint'>"+t("wx_unavailable")+"</p>"; return; }
  try{
    const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude="+g.lat+"&longitude="+g.lng+"&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5");
    const j=await r.json();
    if(!j||j.error||!j.current) throw new Error(j&&(j.reason||"api")||"api");
    S.wxCache[ck]={t:Date.now(),d:{g,cur:j.current,daily:j.daily}};
    renderWx(c,S.wxCache[ck].d);
  }catch(e){ box.innerHTML="<p class='hint'>"+t("wx_offline")+">/p>"; }
}
function renderWx(c,d){
  const box=$("#mWx"); if(!box) return;
  if(!d||!d.cur){ box.innerHTML="<p class='hint'>"+t("wx_offline")+">/p>"; return; }
  const [wl,we]=wmoDesc(d.cur.weather_code);
  $("#mWxCity").textContent="— "+(d.g.name||c.capital)+(d.g.approx?t("approx_word"):"");
  const days=(d.daily&&d.daily.time?d.daily.time:[]).slice(0,5).map((t,i)=>{
    const [dl,de]=wmoDesc((d.daily.weather_code||[])[i]);
    return "<div style='text-align:center;min-width:56px'><div style='font-size:20px'>"+de+"</div><small>"+String(t).slice(5)+"</small><br><b>"+Math.round((d.daily.temperature_2m_min||[])[i]??0)+"° / "+Math.round((d.daily.temperature_2m_max||[])[i]??0)+"°</b></div>";
  }).join("");
  box.innerHTML="<div class='wx-card'><div style='font-size:44px'>"+we+"</div><div><div class='t'>"+Math.round(d.cur.temperature_2m)+"°C</div><small>"+wl+" · 💨 "+Math.round(d.cur.wind_speed_10m)+" km/h · 💧 "+(d.cur.relative_humidity_2m??"—")+"%</small></div></div>"+
    "<p style='font-weight:800;margin:6px 0'>"+travelAdvice(d.cur.weather_code,d.cur.temperature_2m)+"</p>"+
    "<div style='display:flex;gap:10px;justify-content:space-around;background:#fff;border:2px solid var(--line);border-radius:12px;padding:8px;overflow-x:auto'>"+days+"</div>";
}
function travelAdvice(code,temp){
  if(code>=95) return t("adv_storm");
  if((code>=51&&code<=67)||(code>=80&&code<=82)) return t("adv_rain");
  if(code>=71&&code<=99) return t("adv_snow");
  if(temp>=32) return t("adv_heat");
  if(temp>=24&&code<=3) return t("adv_ideal");
  if(temp<5) return t("adv_cold");
  if(code<=2) return t("adv_nice");
  return t("adv_avg");
}
/* ---------- hymnes authentiques (Wikimedia Commons) ---------- */
function anthemCacheGet(c3){ try{const j=JSON.parse(localStorage.getItem("atlas_anthem_cache")||"{}");return j[c3]||null;}catch(e){return null;} }
function anthemCacheSet(c3,u){
  try{
    const j=JSON.parse(localStorage.getItem("atlas_anthem_cache")||"{}");
    j[c3]={u,t:Date.now()};
    const ks=Object.keys(j); if(ks.length>60)delete j[ks[0]];
    localStorage.setItem("atlas_anthem_cache",JSON.stringify(j));
  }catch(e){}
}
function stopRealAnthem(){
  const a=$("#mAnthemAudio"); if(a){a.pause();}
  S.anthemPlaying=null;
  const b=$("#mAnthemPlay"); if(b)b.textContent=t("anthem_real");
}
function scoreAnthemFile(t){
  const l=t.toLowerCase(); let s=0;
  if(/\.ogg$|\.oga$|\.opus$/.test(l))s+=6; else if(/\.mp3$/.test(l))s+=5; else if(/\.wav$/.test(l))s+=3; else if(/\.flac$/.test(l))s+=2; else return -99;
  if(/anthem|national/.test(l))s+=2;
  if(/navy|band|orchestra|garde|philharmonic|presidential|republic/.test(l))s+=2;
  if(/instrumental/.test(l))s+=1;
  if(/vocaloid|miku|teto|luka|meiko|hatsune|utaune|mid$|midi|sample|pronunciation|sheet|newspaper|chant\b|karaoke/.test(l))s-=4;
  if(/1907|1914|1930|vintage|historic|old recording/.test(l))s+=1;
  return s;
}
async function playRealAnthem(c){
  const btn=$("#mAnthemPlay"),st=$("#mAnthemStatus"),audio=$("#mAnthemAudio");
  if(S.anthemPlaying===c.c3&&audio&&!audio.paused){ stopRealAnthem(); if(st)st.textContent=t("anthem_paused"); return; }
  stopRealAnthem();
  const playUrl=u=>{
    audio.onplaying=()=>{ S.anthemPlaying=c.c3; if(btn)btn.textContent="⏸️ Pause"; if(st)st.textContent=t("anthem_playing"); };
    audio.onwaiting=()=>{ if(st)st.textContent=t("anthem_buffering"); };
    audio.onended=()=>{ S.anthemPlaying=null; if(btn)btn.textContent=t("anthem_real"); };
    audio.onerror=()=>{ S.anthemPlaying=null; if(btn)btn.textContent=t("anthem_real"); if(st)st.textContent=t("anthem_unreadable"); };
    audio.src=u;
    if(btn)btn.textContent=t("anthem_charging");
    if(st)st.textContent=t("anthem_loading");
    audio.play().catch(()=>{ if(st)st.textContent=t("anthem_play_fail"); });
  };
  const cached=anthemCacheGet(c.c3);
  if(cached){ playUrl(cached.u); return; }
  if(st)st.textContent=t("anthem_search_pre")+(S.anthems[c.c3]||cn(c))+t("anthem_search_post");
  if(btn)btn.textContent=t("anthem_searching");
  try{
    const title=S.anthems[c.c3]||("national anthem of "+c.en);
    const u="https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch="+encodeURIComponent(title+" filetype:audio")+"&srnamespace=6&srlimit=15";
    const j=await (await fetch(u)).json();
    const files=(j.query.search||[]).map(s=>s.title).map(t=>({t,s:scoreAnthemFile(t)})).filter(o=>o.s>-99).sort((a,b)=>b.s-a.s);
    if(!files.length)throw new Error("none");
    const u2="https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url|size|mime&titles="+encodeURIComponent(files[0].t);
    const j2=await (await fetch(u2)).json();
    const pg=j2.query.pages[Object.keys(j2.query.pages)[0]];
    const info=pg.imageinfo&&pg.imageinfo[0];
    if(!info||!info.url||info.size>25000000)throw new Error("badfile");
    anthemCacheSet(c.c3,info.url);
    playUrl(info.url);
  }catch(e){
    if(btn)btn.textContent=t("anthem_real");
    if(st)st.textContent=t("anthem_none");
  }
}
/* ---------- fin hymnes ---------- */
function playFanfare(c){
  const eq=$("#mEq"); if(eq)eq.hidden=false;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==="suspended")AC.resume();
    const h=hash(c.c3); const scale=[0,2,4,7,9,12,14,12,9,7,4,2,0];
    const base=220*Math.pow(2,((h%12)-6)/12);
    const t0=AC.currentTime;
    scale.forEach((s,i)=>{
      const o=AC.createOscillator(),g=AC.createGain();
      o.type=i%3===2?"triangle":"square";
      o.frequency.value=base*Math.pow(2,s/12);
      g.gain.setValueAtTime(0.0001,t0+i*0.16);
      g.gain.exponentialRampToValueAtTime(0.09,t0+i*0.16+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001,t0+i*0.16+0.15);
      o.connect(g);g.connect(AC.destination);o.start(t0+i*0.16);o.stop(t0+i*0.16+0.18);
    });
    beep(880,.3,"sine",.05);
  }catch(e){}
  setTimeout(()=>{if(eq)eq.hidden=true;},scaleNotes()*160+400);
  function scaleNotes(){return 13;}
  toast(t("fanfare_of")+cn(c)+t("fanfare_done"));
}
function switchModalTab(name){
  S.modalTab=name;
  $$(".mtab").forEach(b=>b.classList.toggle("active",b.dataset.mtab===name));
  $$(".mtabpane").forEach(p=>p.classList.toggle("active",p.id==="mtab-"+name));
  if(name==="carte"&&S.miniMap)setTimeout(()=>S.miniMap.invalidateSize(),120);
}
function initMiniMap(){
  if(S.miniMap||typeof L==="undefined")return;
  const ERR = "data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e4d2ac"/><text x="128" y="118" font-size="44" text-anchor="middle">🗺️</text></svg>');
  const attr = "© Esri, Maxar, Earthstar Geographics, OSM contributors";
  const opt = {maxZoom:16, errorTileUrl:ERR, attribution:attr};
  const plan=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",opt);
  const sat=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",opt);
  const relief=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",opt);
  const sombre=L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",opt);
  S.miniBases={plan,sat,relief,sombre};
  S.miniMap=L.map("mMap",{center:[20,0],zoom:2,scrollWheelZoom:false,layers:[plan],preferCanvas:true,zoomAnimation:true,fadeAnimation:true});
  S.miniMap.on("focus",()=>S.miniMap.scrollWheelZoom.enable());
  S.miniMap.on("blur",()=>S.miniMap.scrollWheelZoom.disable());
}
function miniSetBase(b){
  if(!S.miniMap)return; S.miniBase=b;
  Object.values(S.miniBases).forEach(l=>{if(S.miniMap.hasLayer(l))S.miniMap.removeLayer(l);});
  S.miniBases[b].addTo(S.miniMap);
  $$(".mmap-base").forEach(x=>x.classList.toggle("active",x.dataset.base===b));
}
async function showCountryMap(c){
  initMiniMap(); if(!S.miniMap)return;
  miniSetBase(S.miniBase);
  if(S.miniCountryLayer){S.miniMap.removeLayer(S.miniCountryLayer);S.miniCountryLayer=null;}
  if(S.miniNeighLayer){S.miniMap.removeLayer(S.miniNeighLayer);S.miniNeighLayer=null;}
  if(S.miniCapMarker){S.miniMap.removeLayer(S.miniCapMarker);S.miniCapMarker=null;}
  const feat=(S.geo.features||[]).find(f=>f.id===c.c3);
  const doCap=async(bounds)=>{
    if(!S.showCap)return;
    const g=await geocodeCapital(c);
    const ll=g?[g.lat,g.lng]:(c.latlng||null);
    if(!ll)return;
    S.miniCapMarker=L.marker(ll).addTo(S.miniMap).bindTooltip("🏛️ "+(c.capital||cn(c))).openTooltip();
    if(!bounds) S.miniMap.setView(ll,5);
  };
  if(feat){
    S.miniCountryLayer=L.geoJSON(feat,{style:{fillColor:"#c9a227",weight:3,color:"#3a2a08",fillOpacity:(S.miniBase!=="plan"?.30:.55)}}).addTo(S.miniMap);
    if(S.showNeigh&&c.borders.length){
      const nf=(S.geo.features||[]).filter(f=>c.borders.includes(f.id));
      if(nf.length)S.miniNeighLayer=L.geoJSON(nf,{style:{fillColor:"#7c5cd6",weight:1.5,color:"#3a2a08",fillOpacity:(S.miniBase!=="plan"?.18:.35)},onEachFeature:(f,l)=>{const n=S.byC3[f.id];l.bindTooltip((n?n.flagEmoji+" "+cn(n):f.id));l.on("click",()=>openCountry(f.id));}}).addTo(S.miniMap);
    }
    try{
      const b=S.miniCountryLayer.getBounds();
      S.miniMap.fitBounds(b.pad(0.25));
      const z=S.miniMap.getZoom(); if(z>7)S.miniMap.setZoom(7);
      $("#mMapNote").textContent=cn(c)+t("mmap_note_detail")+({plan:t("base_plan_n"),sat:t("base_sat_n"),relief:t("base_relief_n"),sombre:t("base_dark_n")})[S.miniBase]+".";
    }catch(e){ S.miniMap.setView(c.latlng||[20,0],4); }
    doCap(true);
  }else{
    const ll=c.latlng||[20,0];
    S.miniCountryLayer=L.circle(ll,{radius:80000,color:"#c9a227",weight:3,fillOpacity:(S.miniBase!=="plan"?.25:.4)}).addTo(S.miniMap);
    S.miniMap.setView(ll,5);
    $("#mMapNote").textContent=t("mmap_note_small");
    doCap(false);
  }
  setTimeout(()=>S.miniMap.invalidateSize(),150);
}
function renderThemeCards(c){
  const w=$("#mThemeCards"); if(!w)return;
  const fra=S.byC3["FRA"];
  const vsFra=fra&&c.c3!=="FRA"?(c.area/fra.area):1;
  const vsTxt=c.c3==="FRA"?t("tc_ref"):(vsFra>=1?"≈ "+vsFra.toFixed(1)+t("tc_times_france"):"≈ "+(1/vsFra).toFixed(1)+t("tc_smaller"));
  const cz=c.latlng?climateZone(c.latlng[0]):{label:"—",emoji:"🌐",desc:""};
  const share=(c.pop/worldPop()*100);
  const densRank=[...S.db].sort((a,b)=>densityOf(b)-densityOf(a)).findIndex(o=>o.c3===c.c3)+1;
  w.innerHTML=
    "<div class='tcard'><b>"+t("tc_pop")+"</b>#"+rankOf(c,"pop")+" "+t("tc_world")+" · "+share.toFixed(2)+t("tc_humanity")+"</div>"+
    "<div class='tcard'><b>"+t("tc_area")+"</b>#"+rankOf(c,"area")+" "+t("tc_world")+"<br>"+vsTxt+"</div>"+
    "<div class='tcard'><b>"+t("tc_dens")+"</b>#"+densRank+" "+t("tc_world")+" · "+(densityOf(c)?densityOf(c).toFixed(1)+t("per_km2"):"—")+"</div>"+
    "<div class='tcard'><b>"+cz.emoji+" "+t("tc_climate")+"</b>"+cz.label+"<br><small>"+cz.desc+"</small></div>"+
    "<div class='tcard'><b>"+(c.landlocked?t("meta_locked"):t("meta_sea"))+"</b>"+(c.borders.length?c.borders.length+" "+(S.lang==="en"?"land borders":"frontières terrestres"):t("no_land_borders"))+" · "+("🇺🇳 "+(c.un?t("un_member"):t("un_non")))+"</div>"+
    "<div class='tcard'><b>"+t("tc_culture")+"</b>"+c.langs.length+" "+t("tc_langs_word")+" · "+(c.curr[0]?c.curr[0].code+" "+(c.curr[0].symbol||""):"—")+"</div>";
}
function worldPop(){ return S.db.reduce((a,c)=>a+c.pop,0); }

/* ---------- i18n : bilingual FR/EN ---------- */
function syncGlobeBtns(){
  try{
    if(window.__globeUpdBtns){ window.__globeUpdBtns(); return; }
    const sb=$("#globeSpinBtn"); if(sb) sb.textContent=t("globe_spin_pause");
    const nb=$("#globeNightBtn"); if(nb) nb.textContent=t("globe_night");
  }catch(e){}
}
function setLang(l,opts){
  if(l!=="fr"&&l!=="en") return;
  S.lang=l;
  try{localStorage.setItem("atlas_lang",l);}catch(e){}
  try{document.documentElement.lang=l;}catch(e){}
  applyI18n();
  try{window.dispatchEvent(new CustomEvent("atlas-lang",{detail:l}));}catch(e){}
  if(!(opts&&opts.silent)) toast(l==="en"?"\u{1F1EC}\u{1F1E7} English version":"\u{1F1EB}\u{1F1F7} Version fran\u00E7aise");
}
function quizLabelText(q){
  if(!q) return "…";
  if(S.quiz.mode==="drapeaux") return t("q_flag");
  if(S.quiz.mode==="capitales") return "\u{1F3DB}\uFE0F "+t("q_cap_pre")+cn(q.a)+(S.lang==="en"?"?":" ?");
  return t("q_map_pre")+q.a.flagEmoji+" "+cn(q.a)+t("q_map_post");
}
function quizRelabel(){
  const B=!!S.blitz, M=!B&&S.quizMarathon&&S.quiz.mode!=="carte";
  const sc=$("#quizScore");
  if(sc) sc.textContent = B ? ("\u26A1 "+S.blitz.good+" "+(S.lang==="en"?"correct":"bonnes")+" \u00B7 "+t("record_word")+" "+S.blitzBest)
    : M ? ("Marathon "+S.quizGood+"/"+S.quizTotal+" \u00B7 "+t("record_word")+" "+S.quizMarathonBest+"/"+S.quizTotal)
    : (S.quiz.q ? (t("score_word")+" "+S.quiz.score+" \u00B7 "+t("record_word")+" "+S.quiz.best+" \u00B7 "+t("round_word")+" "+S.quiz.round) : (t("score_word")+" 0"));
  if(!S.quiz.q){ renderQuiz(); return; }
  const q=S.quiz.q;
  const lb=$("#quizLabel"); if(lb) lb.textContent=(B?"\u26A1 ":"")+(M?"\u{1F3C1} ["+S.quiz.round+"/"+S.quizTotal+"] ":"")+quizLabelText(q);
  const box=$("#quizOpts");
  if(box&&q.opts&&q.opts.length){
    const kids=Array.from(box.children);
    kids.forEach((b,i)=>{ const c=q.opts[i]; if(!c) return;
      if(S.quiz.mode==="capitales") b.textContent=c.capital||"?";
      else b.textContent=c.flagEmoji+" "+cn(c);
    });
  }
}
function modalRelabel(c){
  if(!c) return;
  const F=$("#mFlag"); if(F) F.alt=t("alt_flag")+cn(c);
  $("#mName").textContent=cn(c); $("#mOff").textContent=offName(c);
  $("#mRegion").textContent=regionEmoji(c.region)+" "+(regionName(c.region)||"\u2014")+(c.subregion?" \u00B7 "+subName(c.subregion):"");
  const dn=densityOf(c); $("#mDens").textContent=dn?dn.toFixed(1)+t("per_km2"):"\u2014";
  $("#mMeta").textContent="\u260E "+(c.idd||"\u2014")+" \u00B7 \u{1F310} "+(c.tld.join(" ")||"\u2014")+" \u00B7 "+(c.landlocked?t("meta_locked"):t("meta_sea"))+" \u00B7 "+(c.un?t("meta_un"):t("meta_un_no"));
  $("#mRank").textContent=t("rank_pop_pre")+(rankOf(c,"pop"))+" "+t("rank_area_mid")+rankOf(c,"area");
  const bc=$("#mBorders"); if(bc){ bc.innerHTML="";
    if(c.borders.length){c.borders.forEach(b=>{const n=S.byC3[b];if(!n)return;const btn=document.createElement("button");btn.className="b-chip";btn.textContent=(n.flagEmoji||"")+" "+cn(n);btn.onclick=()=>openCountry(b);bc.appendChild(btn);});}
    else bc.innerHTML="<span style='font-size:13px'>"+t("no_borders")+"</span>";
  }
  $("#mVisit").textContent="\u{1F6C2} "+S.visited.size+" "+t("visited_suffix");
  $("#mFact").textContent=funFact(c);
  renderThemeCards(c);
  const an=S.anthems[c.c3]||(t("anthem_of")+cn(c));
  $("#mAnthem").textContent="\u{1F3BC} "+an;
  $("#mCultDemo").textContent=t("demonym_label")+(c.demonym_fr||"\u2014")+" \u00B7 "+(c.capital?("\u{1F3DB}\uFE0F "+c.capital):"");
  const fra=S.byC3["FRA"], km=fra?distKm(fra,c):0, cz=c.latlng?climateZone(c.latlng[0]):null;
  $("#mTravel").textContent=t("travel_paris_to")+(c.capital||cn(c))+" : "+(km?fmtKm(km)+" "+t("travel_km_mid"):"\u2014")+t("travel_sep")+(cz?cz.emoji+" "+cz.label:"")+t("travel_sep")+(c.landlocked?t("locked_word"):t("coast_word"));
  const mn=$("#mNear"); if(mn){ mn.innerHTML="";
    if(c.latlng){ const near=S.db.filter(o=>o.c3!==c.c3&&o.latlng).map(o=>({o,km:distKm(c,o)})).sort((a,b)=>a.km-b.km).slice(0,4);
      near.forEach(n=>{const b=document.createElement("button");b.className="b-chip";b.textContent="\u2708\uFE0F "+(n.o.flagEmoji||"")+cn(n.o)+" \u00B7 "+fmtKm(n.km)+" "+t("travel_km_mid");b.onclick=()=>openCountry(n.o.c3);mn.appendChild(b);}); }
  }
  try{
    if(S.miniCountryLayer){ const nb2=$("#mMapNote"); if(nb2) nb2.textContent=cn(c)+t("mmap_note_detail")+({plan:t("base_plan_n"),sat:t("base_sat_n"),relief:t("base_relief_n"),sombre:t("base_dark_n")})[S.miniBase]+"."; }
  }catch(e){}
  if(!S.anthemPlaying){ const st=$("#mAnthemStatus"); if(st) st.textContent=t("anthem_status_default"); }
}
function rebuildBaseControl(){
  if(!S.map||!S.baseLayers||typeof L==="undefined") return;
  try{
    if(S.layersCtrl){ S.map.removeControl(S.layersCtrl); S.layersCtrl=null; }
    const _bl={};_bl[t("base_plan")]=S.baseLayers.plan;_bl[t("base_sat")]=S.baseLayers.sat;_bl[t("base_relief")]=S.baseLayers.relief;_bl[t("base_dark")]=S.baseLayers.dark;
    S.layersCtrl=L.control.layers(_bl).addTo(S.map);
  }catch(e){}
}
function applyI18n(){
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent=t(el.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-html]").forEach(el=>{ el.innerHTML=t(el.getAttribute("data-i18n-html")); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>{ el.setAttribute("placeholder",t(el.getAttribute("data-i18n-ph"))); });
  document.querySelectorAll("[data-i18n-title]").forEach(el=>{ el.setAttribute("title",t(el.getAttribute("data-i18n-title"))); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el=>{ el.setAttribute("aria-label",t(el.getAttribute("data-i18n-aria"))); });
  document.querySelectorAll("[data-i18n-alt]").forEach(el=>{ el.setAttribute("alt",t(el.getAttribute("data-i18n-alt"))); });
  const lb=$("#langBtn"); if(lb){ lb.textContent=t("lang_btn"); lb.setAttribute("title",t("lang_title")); lb.setAttribute("aria-label",t("lang_title")); }
  const mb=$("#measureBtn"); if(mb) mb.textContent=t("measure_label")+" : "+(S.measuring?t("on_word"):t("off_word"));
  const mar=$("#marathonBtn"); if(mar) mar.textContent=t("marathon_btn")+" : "+(S.quizMarathon?t("on_word"):t("off_word"));
  if(!S.blitz){ const bb=$("#blitzBtn"); if(bb){ bb.textContent=t("blitz_btn")+" : "+t("off_word"); bb.classList.remove("active"); } }
  const tn=$("#mTglNeigh"); if(tn) tn.textContent=t("neigh_label")+" : "+(S.showNeigh?t("on_word"):t("off_word"));
  const tc2=$("#mTglCap"); if(tc2) tc2.textContent=t("cap_label")+" : "+(S.showCap?t("on_word"):t("off_word"));
  syncGlobeBtns();
  try{ rebuildBaseControl(); }catch(e){}
  try{ if(S.db.length){ renderContinents(); } }catch(e){}
  try{ syncFilters(); }catch(e){}
  try{ if(S.db.length){ renderGrid(); } }catch(e){}
  try{
    const a=$("#cmpA"),b=$("#cmpB");
    if(a&&b&&S.db.length){ const o=S.db.map(c=>"<option value='"+c.c3+"'>"+c.flagEmoji+" "+cn(c)+"</option>").join(""); a.innerHTML=o; b.innerHTML=o; a.value=S.cmpA; b.value=S.cmpB; renderCompare(); }
  }catch(e){}
  try{ renderTournChamps(); }catch(e){}
  try{ renderPassport(); }catch(e){}
  try{ updateCoverStats(); startCoverFacts(); }catch(e){}
  try{ refreshMap(); }catch(e){}
  try{ if(S.db.length){ quizRelabel(); } }catch(e){}
  try{ const mo=$("#countryModal"); if(mo&&mo.classList.contains("open")&&S.selC3&&S.byC3[S.selC3]) modalRelabel(S.byC3[S.selC3]); }catch(e){}
  try{ const i=S.pageOrder.indexOf(S.page); const pn=$("#pageNum"); if(pn&&i>=0) pn.textContent=(i+1)+" / "+S.pageOrder.length+" \u2014 "+labelOf(S.page); }catch(e){}
}

/* ---------- boot ---------- */
async function boot(){
  if(!localStorage.getItem("atlas_theme")){ const h=new Date().getHours(); S.theme=(h>=21||h<7)?"dark":"light"; }
  setTheme(S.theme);
  fxResize();fxLoop();
  try{
    await loadData();
  }catch(e){ $("#loadMsg").textContent=t("data_missing"); return; }
  initSearch();renderContinents();renderGrid();initCompare();renderPassport();updateCoverStats();startCoverFacts();
  S.quiz.q=null;renderQuiz();
  // thematic chips
  $$("#thematicChips .chip[data-t]").forEach(ch=>ch.onclick=()=>{$$("#thematicChips .chip[data-t]").forEach(x=>x.classList.remove("active"));ch.classList.add("active");S.thematic=ch.dataset.t;refreshMap();sndPage();});
  $("#mapResetBtn").onclick=()=>{ if(S.map){S.map.flyTo([24,8],2,{duration:1.2});} sndPage(); };
  $("#fSort").onchange=e=>{S.sort=e.target.value;renderGrid();};
  $("#cmpRandomBtn").onclick=()=>{ const p=()=>S.db[Math.floor(Math.random()*S.db.length)].c3; S.cmpA=p(); let b=p(),guard=0; while(b===S.cmpA&&guard++<10)b=p(); S.cmpB=b; $("#cmpA").value=S.cmpA; $("#cmpB").value=S.cmpB; renderCompare(); confettiBurst(40); sndPage(); };
  // toc
  $$("#toc .toc-btn, #mobileNav button").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  $("#prevBtn").onclick=()=>{const i=S.pageOrder.indexOf(S.page);if(i>0)showPage(S.pageOrder[i-1]);};
  $("#nextBtn").onclick=()=>{const i=S.pageOrder.indexOf(S.page);if(i<S.pageOrder.length-1)showPage(S.pageOrder[i+1]);};
  // filters
  $("#fRegion").onchange=e=>{S.regionFilter=e.target.value;renderGrid();};
  $("#fSearch").oninput=e=>{S.searchFilter=e.target.value;renderGrid();};
  $("#diceBtn").onclick=randomCountry;$("#diceBtn2").onclick=randomCountry;
  $("#destDayBtn").onclick=()=>{ if(S.destC3)openCountry(S.destC3); };
  $("#soundBtn").onclick=toggleSound;
  $("#closeModal").onclick=closeCountry;
  $("#countryModal").addEventListener("click",e=>{if(e.target.id==="countryModal")closeCountry();});
  $("#flyBtn").onclick=()=>{const c=S.byC3[S.selC3];closeCountry();showPage("monde");setTimeout(()=>flyToCountry(c),350);};
  $("#cmpFlyBtn").onclick=cmpFly;
  $("#tournBtn").onclick=startTournament; renderTournChamps();
  $("#blitzBtn").onclick=toggleBlitz;
  $$(".quiz-setup .chip[data-m]").forEach(ch=>ch.onclick=()=>{if(S.blitz)stopBlitz(true);$$(".quiz-setup .chip[data-m]").forEach(x=>x.classList.remove("active"));ch.classList.add("active");S.quiz.mode=ch.dataset.m;S.quiz.score=0;S.quiz.round=0;S.quiz.mapTarget=null;S.quizGood=0;renderQuiz();if(S.quiz.mode==="carte"){showPage("monde");toast(t("quiz_map_back"));setTimeout(()=>showPage("quiz"),2500);}sndPage();});
  $("#marathonBtn").onclick=e=>{ if(S.blitz)stopBlitz(true); S.quizMarathon=!S.quizMarathon; e.target.textContent=t("marathon_btn")+" : "+(S.quizMarathon?t("on_word"):t("off_word")); e.target.classList.toggle("active",S.quizMarathon); S.quiz.score=0;S.quiz.round=0;S.quizGood=0;S.quiz.mapTarget=null; if(S.quizMarathon&&S.quiz.mode==="carte"){ $$(".quiz-setup .chip[data-m]")[0].click(); } else renderQuiz(); };
  $("#quizNext").onclick=()=>{S.quiz.mapTarget=null;renderQuiz();};
  $("#passReset").onclick=()=>{if(confirm(t("clear_confirm"))){S.visited.clear();localStorage.setItem("atlas_visited","[]");window.__atlasVisited=[];renderPassport();renderGrid();updateCoverStats();}};
  $("#measureBtn").onclick=toggleMeasure;
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCountry();if(S.measuring)finishMeasure();}});
  // --- V2 wiring ---
  $("#themeBtn").onclick=toggleTheme;
  $$(".mtab").forEach(b=>b.onclick=()=>{switchModalTab(b.dataset.mtab);sndPage();});
  $$(".mmap-base").forEach(b=>b.onclick=()=>{const c=S.byC3[S.selC3];miniSetBase(b.dataset.base);if(c)showCountryMap(c);});
  $("#mTglNeigh").onclick=e=>{S.showNeigh=!S.showNeigh;e.target.textContent=t("neigh_label")+" : "+(S.showNeigh?t("on_word"):t("off_word"));const c=S.byC3[S.selC3];if(c)showCountryMap(c);};
  $("#mTglCap").onclick=e=>{S.showCap=!S.showCap;e.target.textContent=t("cap_label")+" : "+(S.showCap?t("on_word"):t("off_word"));const c=S.byC3[S.selC3];if(c)showCountryMap(c);};
  $("#mFanfare").onclick=()=>{const c=S.byC3[S.selC3];if(c)playFanfare(c);};
  $("#mAnthemPlay").onclick=()=>{const c=S.byC3[S.selC3];if(c)playRealAnthem(c);};
  $("#langBtn").onclick=()=>{ setLang(S.lang==="en"?"fr":"en"); };
  try{document.documentElement.lang=S.lang;}catch(e){}
  applyI18n();
  showPage("cover");setFx("stars");
  // globe 3D (module) ou repli 2D
  setTimeout(()=>{
    if(window.__globe3D_failed||!window.__globe3D_ok){
      const c2=$("#globeCanvas"); if(c2){c2.hidden=false;}
      const c3=$("#globe3D"); if(c3&&!window.__globe3D_ok)c3.style.display="none";
      try{globeLoop();}catch(e){}
    }
  },1600);
  $("#loader").classList.add("done");
  // plane flyover easter egg every 45s
  setInterval(()=>{if(S.page==="monde")toast("✈️ "+(S.lang==="en"?["Paris","Tokyo","Cairo","Rio","Sydney"]:["Paris","Tokyo","Le Caire","Rio","Sydney"])[Math.floor(Math.random()*5)]+" → "+S.db[Math.floor(Math.random()*S.db.length)].capital+t("flyover_end"));},45000);
}
window.atlasBoot=boot;
window.showPage=showPage;window.openCountry=openCountry;window.closeCountry=closeCountry;
window.startTournament=startTournament;
window.randomCountry=randomCountry;window.toggleSound=toggleSound;window.atlasSetLang=setLang;
window.__atlasDbg={get base(){return S.base}, get thematic(){return S.thematic}, style:id=>chorStyle({id})};
document.readyState!=="loading"?boot():document.addEventListener("DOMContentLoaded",boot);
})();
