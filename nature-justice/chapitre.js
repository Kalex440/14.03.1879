/* ===== Mode « chapitre » : réutilise les jeux (QCM, cartes mentales, mots mêlés, textes à trous, flashcards, salon entre amis)
   avec le contenu d'un chapitre du site : nature-justice/index.html?m=<matiere>&chap=<chapitre> ===== */
var CHAP = (function () {
  const q = new URLSearchParams(location.search), m = (q.get("m") || "").replace(/[^a-z0-9-]/g, ""), id = (q.get("chap") || "").replace(/[^a-z0-9-]/g, "");
  if (!m || !id) return null;
  let txt = ""; try { const x = new XMLHttpRequest(); x.open("GET", "../contenu/" + m + "/" + id + ".md", false); x.send(); if (x.status === 200) txt = x.responseText; } catch (e) {}
  if (!txt) return null;
  const clean = s => s.replace(/\$\$?([^$]+)\$\$?/g, "$1").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").trim();
  const [head, body] = txt.split(/\n---\n/);
  const meta = {}; head.split("\n").forEach(l => { const k = l.match(/^([^:]+):\s*(.*)$/); if (k) meta[k[1].trim()] = k[2].trim(); });
  const secs = {}; let cur = null; body.split("\n").forEach(l => { const k = l.match(/^## (.+)/); if (k) { cur = k[1].trim(); secs[cur] = []; } else if (cur) secs[cur].push(l); });
  const out = { m, id, titre: meta["titre"] || id, resume: meta["résumé"] || "" };
  /* QCM */
  const qcm = []; let c = null;
  (secs["QCM"] || []).forEach(l => {
    if (l.startsWith("? ")) { c = { q: clean(l.slice(2)), o: [], a: -1, e: "", src: "cours", niv: 2 }; qcm.push(c); }
    else if (c && /^[+-] /.test(l)) { if (l[0] === "+") c.a = c.o.length; c.o.push(clean(l.slice(2))); }
    else if (c && l.startsWith("> ")) c.e += (c.e ? " " : "") + clean(l.slice(2));
  });
  out.qcm = qcm.filter(x => x.a >= 0 && x.o.length >= 2);
  /* Flashcards */
  out.flash = (secs["Flashcards"] || []).filter(l => l.includes("::")).map(l => { const [f, b] = l.split("::"); return { th: "nature", f: clean(f), b: clean(b) }; });
  /* Textes à trous */
  const trous = []; let tt = null;
  (secs["Textes à trous"] || []).forEach(l => { const k = l.match(/^### (.+)/); if (k) { tt = { id: "t" + (trous.length + 1), titre: clean(k[1]), texte: "" }; trous.push(tt); } else if (tt && l.trim()) tt.texte += (tt.texte ? " " : "") + l.trim().replace(/\[\[([^\]]+)\]\]/g, "[$1]"); });
  const allW = trous.flatMap(t => [...t.texte.matchAll(/\[([^\]]+)\]/g)].map(x => x[1]));
  trous.forEach(t => { const own = [...t.texte.matchAll(/\[([^\]]+)\]/g)].map(x => x[1]); t.pieges = [...new Set(allW.filter(w => !own.includes(w)))].slice(0, 6); if (t.pieges.length < 3) t.pieges.push("raison", "liberté", "nature"); });
  out.trous = trous.filter(t => /\[/.test(t.texte));
  /* Cours : termes en gras → mots mêlés + cartes mentales */
  const cours = secs["Cours"] || [], parts = []; let part = null, sec = null;
  cours.forEach(l => {
    const k = l.match(/^### (.+)/);
    if (k) { const h = k[1].trim(); if (h.startsWith("━")) { part = { titre: h.replace(/^━\s*Partie \d+\s*:\s*/, ""), secs: [] }; parts.push(part); sec = null; } else { if (!part) { part = { titre: out.titre, secs: [] }; parts.push(part); } sec = { nom: h.replace(/^\d+\.\s*/, ""), lines: [] }; part.secs.push(sec); } }
    else if (sec) sec.lines.push(l);
  });
  const terms = l => [...l.matchAll(/\*\*([^*]{2,30})\*\*/g)].map(x => x[1].replace(/[«»]/g, "").trim()).filter(t => t.length >= 3);
  const mk = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
  const mots = [], seen = {};
  const add = (w, x) => { const m2 = mk(w); if (/\s/.test(w.trim()) || m2.length < 4 || m2.length > 12 || seen[m2]) return; seen[m2] = 1; mots.push({ m: m2, w: w.trim(), th: "b", x: x }); };
  cours.forEach(l => { terms(l).forEach(w => add(w, clean(l).replace(/^[-> 💡]+/, "").slice(0, 230))); });
  out.flash.forEach(f => add(f.f, f.b));
  out.mots = mots.slice(0, 14);
  const cartes = [];
  parts.forEach(p => {
    const br = [];
    p.secs.forEach(s => {
      const lt = s.lines.flatMap(l => terms(l).map(t => ({ t, l }))), u = [];
      lt.forEach(x => { if (!u.some(y => y.t === x.t) && u.length < 3) u.push(x); });
      if (u.length >= 2) br.push({ nom: s.nom.slice(0, 40), f: u.map((x, i) => { const sen = clean(x.l.replace("**" + x.t + "**", "…")).replace(/^[-> 💡]+/, ""); const at = Math.max(0, sen.indexOf("…")); const a = sen.length > 70 ? sen.slice(Math.max(0, at - 30), at + 40).trim() : sen; return { a, r: x.t, b: i < 2 ? 1 : 0 }; }) });
    });
    if (br.length >= 3) cartes.push({ id: "c" + (cartes.length + 1), titre: p.titre, centre: p.titre.toUpperCase(), temps: 150, branches: br.slice(0, 5), pieges: ["logos", "raison", "essence"] });
  });
  out.cartes = cartes;
  const swap = (arr, nv) => { arr.length = 0; nv.forEach(x => arr.push(x)); };
  if (out.qcm.length) swap(QCM, out.qcm); swap(FLASH, out.flash); swap(MOTS, out.mots); swap(TROUS, out.trous); swap(CARTES, out.cartes);
  window.FLASH_FILT = [["tous", "Toutes"], ["revoir", "↺ À revoir"]];
  return out;
})();
if (CHAP) window.addEventListener("load", () => {
  const $$ = s => document.querySelector(s);
  document.title = CHAP.titre + " · jeux";
  $$(".brand small").textContent = "Révisions sciences · " + CHAP.m.replace(/-/g, " ");
  $$(".brand div").lastChild.textContent = CHAP.titre;
  const ret = $$("nav .out"); ret.href = "../index.html#" + CHAP.m + "/" + CHAP.id; ret.textContent = "← Retour au chapitre";
  const keep = { qcm: CHAP.qcm.length > 0, trous: CHAP.trous.length > 0, jardin: CHAP.cartes.length > 0, mots: CHAP.mots.length >= 6, flash: CHAP.flash.length > 0, direct: CHAP.qcm.filter(q => q.o.length === 4).length >= 4 };
  ["cours", "bac", "etudes"].forEach(k => keep[k] = false);
  Object.keys(keep).forEach(k => { if (!keep[k]) document.querySelectorAll(`nav a[href="#${k}"]`).forEach(a => a.parentNode.removeChild(a)); });
  document.querySelectorAll(".ngroup").forEach(g => { if (!g.querySelector("a")) g.parentNode.removeChild(g); });
  const tile = (h, svg, b, t) => keep[h] ? `<a class="tile" href="#${h}"><svg class="ic"><use href="#${svg}"/></svg><b>${b}</b><p class="mut" style="margin:6px 0 0">${t}</p></a>` : "";
  const acc = $$("#v-accueil"); acc.querySelector(".hero h1").textContent = CHAP.titre;
  acc.querySelector(":scope > p").innerHTML = (CHAP.resume ? CHAP.resume + " " : "") + "Les jeux ci-dessous utilisent le contenu de ce chapitre.";
  acc.querySelector(".grid2").innerHTML = tile("qcm", "sun", `QCM — ${CHAP.qcm.length} questions`, "Score avec points négatifs et explication à chaque réponse.") + tile("trous", "seed", `${CHAP.trous.length} textes à trous`, "Complète avec la banque de mots.") + tile("jardin", "flower", "Cartes mentales", `${CHAP.cartes.length} carte(s) à compléter en jeu chronométré.`) + tile("flash", "leaf", `${CHAP.flash.length} flashcards`, "À retourner, avec suivi de ce que tu connais.") + tile("mots", "seed", "Mots mêlés", `${Math.min(14, CHAP.mots.length)} mots cachés du chapitre.`) + tile("direct", "sun", "Jouer entre amis", "Quiz en coop ou en individuel, sur les questions du chapitre.");
  const setP = (sel, html) => { const e = $$(sel); if (e) e.innerHTML = html; };
  setP("#v-qcm h1", "QCM : " + CHAP.titre);
  setP("#v-qcm > p.mut", `${CHAP.qcm.length} questions sur ce chapitre. Barème : <b>+1</b> par bonne réponse, <b>−0,5</b> par erreur, <b>0</b> si tu choisis « Je ne sais pas ». Ton total est ramené sur 20.`);
  const vid = $$("#v-qcm > p.note"); if (vid && /Bons Profs/.test(vid.textContent)) vid.style.display = "none";
  setP("#v-trous > p.mut", `${CHAP.trous.length} texte(s) à compléter avec la banque de mots. Attention aux pièges : <b>+1</b> par bonne réponse, <b>−0,5</b> par erreur, <b>0</b> si tu laisses vide. Note sur 20.`);
  setP("#v-flash > p.mut", `${CHAP.flash.length} cartes pour mémoriser le chapitre. Touche une carte pour la retourner, puis indique si tu savais la réponse : les cartes « à revoir » reviennent jusqu'à ce que tu les connaisses.`);
  setP("#v-mots > p.mut", `Retrouve les ${CHAP.mots.length} mots cachés. Pour chaque mot trouvé, une explication tirée du cours s'affiche.`);
  const si = $$("#saveInfo"); if (si) si.innerHTML = '<span class="note">Tes notes restent sur ton appareil (rien n\'est envoyé dans ce mode).</span>';
});
