/* Globe 3D — Three.js, sans dépendance d'assets locaux */
import * as THREE from "../vendor/p2ga5t-three_0.160.0.js";

const canvas = document.getElementById("globe3D");
const fallback2D = document.getElementById("globeCanvas");
let spin = true, night = false;
try{ if(matchMedia("(prefers-reduced-motion: reduce)").matches) spin = false; }catch(e){}

function gi18n(k){
  try{
    const D = window.ATLAS_I18N || {};
    const l = (localStorage.getItem("atlas_lang") || ((navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr"));
    const L = D[l] || D.fr || {};
    return (L[k] !== undefined ? L[k] : ((D.fr || {})[k] !== undefined ? D.fr[k] : k));
  }catch(e){ return k; }
}
function updGlobeBtns(){
  const sb = document.getElementById("globeSpinBtn");
  if (sb) sb.textContent = spin ? gi18n("globe_spin_pause") : gi18n("globe_spin_resume");
  const nb = document.getElementById("globeNightBtn");
  if (nb) nb.textContent = night ? gi18n("globe_day") : gi18n("globe_night");
  try{ window.__globeSpin = spin; window.__globeNight = night; }catch(e){}
}
window.__globeUpdBtns = updGlobeBtns;
try{ window.addEventListener("atlas-lang", updGlobeBtns); }catch(e){}

function fail(err) {
  console.warn("[globe3d] fallback 2D :", err);
  window.__globe3D_failed = true;
  if (canvas) canvas.style.display = "none";
  if (fallback2D) { fallback2D.hidden = false; }
}

if (!canvas) { fail("no canvas"); }
else {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    cam.position.set(0, 0.35, 4.0);
    cam.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xbcd2ff, 1.15));
    const sun = new THREE.DirectionalLight(0xfff2d0, 1.8);
    sun.position.set(-4, 1.5, 2.5);
    scene.add(sun);
    // vrai terminateur jour/nuit : position du soleil d'après l'heure UTC
    function updateSun() {
      try {
        const now = new Date();
        const utcH = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
        const lon = 180 - utcH * 15; // longitude subsolaire
        const start = Date.UTC(now.getUTCFullYear(), 0, 0);
        const day = Math.floor((now.getTime() - start) / 864e5);
        const decl = -23.44 * Math.cos((2 * Math.PI * (day + 10)) / 365); // déclinaison approx
        const la = decl * Math.PI / 180, lo = lon * Math.PI / 180;
        const r = 10;
        sun.position.set(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
      } catch (e) {}
    }
    updateSun(); setInterval(updateSun, 60000);

    // étoiles
    {
      const n = 700, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = 20 + Math.random() * 30, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(p) * Math.cos(t); pos[i * 3 + 1] = r * Math.cos(p); pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffe9a8, size: 0.12, transparent: true, opacity: 0.8 })));
    }

    const group = new THREE.Group();
    scene.add(group);
    const R = 1.15;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const DAY = "../vendor/d9qkr4-earth-blue-marble.jpg.js";
    const NIGHT = "../vendor/f4fzo8-earth-night.jpg.js";

    const mat = new THREE.MeshPhongMaterial({ shininess: 12, specular: new THREE.Color(0x224466) });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), mat);
    group.add(earth);
    // halo doux en CSS (div.glow derrière le canvas) : pas de mesh halo
    // pour éviter tout disque opaque ; simple liseré via une sphère filaire
    // nuages factices : 2e sphère filaire très légère
    const grid = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(R * 1.002, 24, 18)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 })
    );
    group.add(grid);

    loader.load(DAY, t => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.needsUpdate = true; window.__globe3D_ok = true; }, undefined, () => fail("tex day"));
    const nightTex = loader.load(NIGHT, t => { t.colorSpace = THREE.SRGBColorSpace; }, undefined, () => {});

    function applyMode() {
      if (night) { mat.emissive = new THREE.Color(0xffffff); mat.emissiveMap = nightTex; mat.emissiveIntensity = 1.0; scene.children.forEach(o => { if (o.isAmbientLight) o.intensity = 0.35; }); }
      else { mat.emissiveMap = null; mat.emissiveIntensity = 0; scene.children.forEach(o => { if (o.isAmbientLight) o.intensity = 1.15; }); }
      const b = document.getElementById("globeNightBtn"); if (b) b.textContent = night ? gi18n("globe_day") : gi18n("globe_night");
    }

    // marqueurs visités
    const markGroup = new THREE.Group(); group.add(markGroup);
    let lastVisited = "";
    const markGeo = new THREE.SphereGeometry(0.022, 10, 10);
    const markMat = new THREE.MeshBasicMaterial({ color: 0xffd94d });
    const ringGeo = new THREE.RingGeometry(0.03, 0.042, 20);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd94d, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    function latLngToVec(lat, lng, r) {
      const la = lat * Math.PI / 180, lo = lng * Math.PI / 180;
      return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
    }
    function refreshMarks() {
      try {
        const countries = window.__atlasCountries || {};
        const visited = window.__atlasVisited || [];
        const key = visited.join(",");
        if (key === lastVisited) return;
        lastVisited = key;
        while (markGroup.children.length) markGroup.remove(markGroup.children[0]);
        for (const c3 of visited) {
          const c = countries[c3]; if (!c || !c.latlng) continue;
          const p = latLngToVec(c.latlng[0], c.latlng[1], R * 1.01);
          const m = new THREE.Mesh(markGeo, markMat); m.position.copy(p); m.userData.c3 = c3; markGroup.add(m);
          const ring = new THREE.Mesh(ringGeo, ringMat); ring.position.copy(p); ring.lookAt(0, 0, 0); ring.userData.c3 = c3; markGroup.add(ring);
        }
      } catch (e) { /* silencieux */ }
    }

    // interactions : drag rotate + zoom molette + clic pastilles
    let dragging = false, px = 0, py = 0, vx = 0, vy = 0, dist = 4.0, moved = 0;
    const MIN_D = 2.8, MAX_D = 8;
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    canvas.addEventListener("pointerdown", e => { dragging = true; moved = 0; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", e => {
      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      group.rotation.y += dx * 0.006; group.rotation.x = Math.max(-0.9, Math.min(0.9, group.rotation.x + dy * 0.003));
      vx = dx * 0.006; vy = dy * 0.003;
    });
    canvas.addEventListener("pointerup", e => {
      dragging = false;
      if (moved < 6) { // simple clic : pastille visitée ?
        const r = canvas.getBoundingClientRect();
        ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(ptr, cam);
        const hit = ray.intersectObjects(markGroup.children, false)[0];
        if (hit && hit.object.userData.c3 && window.openCountry) window.openCountry(hit.object.userData.c3);
      }
    });
    canvas.addEventListener("wheel", e => { e.preventDefault(); dist = Math.max(MIN_D, Math.min(MAX_D, dist + e.deltaY * 0.0025)); cam.position.setLength(dist); }, { passive: false });

    document.getElementById("globeSpinBtn")?.addEventListener("click", e => { spin = !spin; updGlobeBtns(); });
    updGlobeBtns();
    document.getElementById("globeNightBtn")?.addEventListener("click", () => { night = !night; applyMode(); });
    applyMode();

    function size() {
      const w = Math.min(canvas.clientWidth || 380, 460), h = Math.min(canvas.clientHeight || 380, 460);
      const s = Math.max(260, Math.min(w || 380, 460));
      renderer.setSize(s, s, false);
      cam.aspect = 1; cam.updateProjectionMatrix();
    }
    addEventListener("resize", size); size();

    group.rotation.x = 0.22;
    let hidden = false;
    document.addEventListener("visibilitychange", () => { hidden = document.hidden; });
    (function loop() {
      requestAnimationFrame(loop);
      if (hidden) return;
      if (spin && !dragging) group.rotation.y += 0.0035;
      if (!dragging) { group.rotation.y += vx; vx *= 0.94; group.rotation.x += vy; vy *= 0.94; }
      markGroup.children.forEach((o, i) => { if (i % 2 === 1) { const s = 1 + 0.25 * Math.sin(Date.now() / 300 + i); o.scale.set(s, s, s); } });
      refreshMarks();
      renderer.render(scene, cam);
    })();
    window.__globe3D_ok = true;
  } catch (e) { fail(e); }
}
