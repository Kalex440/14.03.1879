/* =====================================================================
   Révisions sciences : moteur du site.
   Tu n'as normalement PAS besoin de modifier ce fichier :
   tout le contenu se trouve dans le dossier « contenu/ » (voir GUIDE.md).
   ===================================================================== */
(function () {
  "use strict";
  const main = document.getElementById("contenu");
  const nav = document.getElementById("nav");
  let SITE = null;      // réglages lus dans contenu/accueil.md
  let MATIERES = [];    // lues dans contenu/matieres.txt
  const cacheChap = {}; // chapitres déjà chargés

  /* ---------- Petits outils ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("rs:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("rs:" + k, JSON.stringify(v)); } catch (e) {} },
    clear() { try { Object.keys(localStorage).filter(k => k.startsWith("rs:")).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  };
  async function lire(chemin) {
    const r = await fetch(chemin, { cache: "no-cache" });
    if (!r.ok) throw new Error("Fichier introuvable : " + chemin);
    return (await r.text()).replace(/\r\n?/g, "\n");
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* En-tête « clé: valeur » terminé par une ligne --- */
  function entete(txt) {
    const infos = {}; const lignes = txt.split("\n"); const fin = lignes.findIndex(l => l.trim() === "---");
    if (fin < 0) return { infos, corps: txt };
    lignes.slice(0, fin).forEach(l => { const m = l.match(/^\s*([^:#]+?)\s*:\s*(.*)$/); if (m) infos[m[1].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")] = m[2].trim(); });
    return { infos, corps: lignes.slice(fin + 1).join("\n") };
  }

  /* Markdown + formules ($...$ et $$...$$) */
  function md(txt, inline) {
    const f = [];
    txt = txt.replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (m, b, i) => { f.push([b !== undefined ? b : i, b !== undefined]); return "@@F" + (f.length - 1) + "@@"; });
    txt = txt.replace(/\]\(images\//g, "](contenu/images/"); // les images vont dans contenu/images
    let html = inline ? marked.parseInline(txt) : marked.parse(txt);
    html = html.replace(/@@F(\d+)@@/g, (m, n) => { try { return katex.renderToString(f[n][0], { displayMode: f[n][1], throwOnError: false }); } catch (e) { return esc(f[n][0]); } });
    html = html.replace(/<a href="http/g, '<a target="_blank" rel="noopener" href="http');
    return html;
  }

  /* ---------- Lecture des fichiers de contenu ---------- */
  async function chargerReglages() {
    const a = entete(await lire("contenu/accueil.md"));
    SITE = { titre: a.infos.titre || "Révisions", sous: a.infos["sous-titre"] || "", fond: a.infos.fond || "", texte: a.corps };
    MATIERES = (await lire("contenu/matieres.txt")).split("\n")
      .filter(l => l.trim() && !l.trim().startsWith("#"))
      .map(l => { const [id, nom, icone, couleur, desc] = l.split("|").map(s => (s || "").trim()); return { id, nom, icone, couleur: couleur || "#1f63d6", desc }; });
    document.getElementById("brandTitle").textContent = SITE.titre;
    document.getElementById("brandSmall").textContent = SITE.sous || "Révisions";
    nav.innerHTML = `<a href="#" data-v="">Accueil</a>` + MATIERES.map(m => `<a href="#${esc(m.id)}" data-v="${esc(m.id)}"><span aria-hidden="true">${esc(m.icone)}</span> ${esc(m.nom)}</a>`).join("");
  }
  async function listeChapitres(mid) {
    try {
      return (await lire(`contenu/${mid}/chapitres.txt`)).split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#")).map(l => l.replace(/\.md$/i, ""));
    } catch (e) { return []; }
  }
  async function chapitre(mid, cid) {
    const k = mid + "/" + cid; if (cacheChap[k]) return cacheChap[k];
    const { infos, corps } = entete(await lire(`contenu/${mid}/${cid}.md`));
    const parts = { cours: [], exercices: "", qcm: "", flashcards: "" };
    corps.split(/^(?=## )/m).forEach(bloc => {
      const t = (bloc.match(/^## (.*)/) || [])[1];
      const n = (t || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (n === "exercices" || n === "exercice") parts.exercices += bloc.replace(/^## .*\n/, "");
      else if (n === "qcm" || n === "quiz") parts.qcm += bloc.replace(/^## .*\n/, "");
      else if (n === "flashcards" || n === "flashcard" || n === "cartes") parts.flashcards += bloc.replace(/^## .*\n/, "");
      else if (n !== "cours") parts.cours.push(bloc); else parts.cours.push(bloc.replace(/^## .*\n/, ""));
    });
    const c = { id: cid, titre: infos.titre || cid, niveau: infos.niveau || "", resume: infos.resume || "",
      cours: parts.cours.join("\n").trim(), exercices: lireExos(parts.exercices), qcm: lireQcm(parts.qcm), cartes: lireCartes(parts.flashcards) };
    return (cacheChap[k] = c);
  }
  function lireQcm(t) {
    const qs = []; let q = null;
    t.split("\n").forEach(l => {
      const s = l.trim(); if (!s) return;
      if (s.startsWith("?")) { q = { q: s.slice(1).trim(), o: [], e: "" }; qs.push(q); }
      else if (!q) return;
      else if (s.startsWith("+") || s.startsWith("-")) q.o.push({ t: s.slice(1).trim(), ok: s[0] === "+" });
      else if (s.startsWith(">")) q.e += (q.e ? " " : "") + s.slice(1).trim();
      else q.q += " " + s;
    });
    return qs.filter(x => x.o.length > 1 && x.o.some(o => o.ok));
  }
  function lireCartes(t) {
    return t.split("\n").map(l => l.trim()).filter(l => l.includes("::")).map(l => { const i = l.indexOf("::"); return { r: l.slice(0, i).replace(/^[-*]\s*/, "").trim(), v: l.slice(i + 2).trim() }; });
  }
  function lireExos(t) {
    return t.split(/^(?=### )/m).map(b => b.trim()).filter(b => b.startsWith("### ")).map(b => {
      const titre = b.match(/^### (.*)/)[1]; const reste = b.replace(/^### .*\n?/, "");
      const [enonce, ...corr] = reste.split(/^\s*\**correction\s*:?\**\s*$/im);
      return { titre, enonce: enonce.trim(), corr: corr.join("\n").trim() };
    });
  }

  /* ---------- Les pages ---------- */
  function marquerNav(v) { nav.querySelectorAll("a").forEach(a => { const on = a.dataset.v === v; a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); }); }
  function fil(items) { return `<nav class="fil" aria-label="Fil d'Ariane">${items.map((it, i) => i < items.length - 1 ? `<a href="${it[1]}">${esc(it[0])}</a> <span aria-hidden="true">›</span> ` : `<span aria-current="page">${esc(it[0])}</span>`).join("")}</nav>`; }

  async function pageAccueil() {
    document.title = SITE.titre;
    if (SITE.fond) {
      document.body.style.setProperty("--fond", `url("${SITE.fond.replace(/^images\//, "contenu/images/").replace(/"/g, "")}")`);
      document.body.classList.add("avec-fond");
    }
    const comptes = await Promise.all(MATIERES.map(m => listeChapitres(m.id).then(l => l.length)));
    main.innerHTML = `
      <div class="hero">
        <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 60v34" stroke="#3f8a2e" stroke-width="6"/><path d="M50 82c-10-10-22-8-26-4 8 6 18 8 26 4z" fill="#7ccb5e"/><g fill="#5aa0ff" stroke="#1f63d6" stroke-width="3"><circle cx="50" cy="22" r="13"/><circle cx="72" cy="38" r="13"/><circle cx="64" cy="62" r="13"/><circle cx="36" cy="62" r="13"/><circle cx="28" cy="38" r="13"/></g><circle cx="50" cy="44" r="12" fill="#ffd34d" stroke="#ffb400" stroke-width="3"/></svg>
        <div><h1>${esc(SITE.titre)}</h1><div class="rule"></div></div>
      </div>
      <div class="intro">${md(SITE.texte)}</div>
      <div class="matieres">${MATIERES.map((m, i) => `
        <a class="matiere" href="#${esc(m.id)}" style="--c:${esc(m.couleur)}">
          <span class="mic" aria-hidden="true">${esc(m.icone)}</span>
          <b>${esc(m.nom)}</b>
          <span class="mut">${esc(m.desc || "")}</span>
          <span class="badge">${comptes[i] ? comptes[i] + " chapitre" + (comptes[i] > 1 ? "s" : "") : "Bientôt"}</span>
        </a>`).join("")}
      </div>`;
    window.papangue && papangue.start();
  }

  async function pageMatiere(m) {
    document.title = m.nom + " · " + SITE.titre;
    const ids = await listeChapitres(m.id);
    const chaps = await Promise.all(ids.map(id => chapitre(m.id, id).catch(() => ({ id, titre: id, erreur: true }))));
    main.innerHTML = `${fil([["Accueil", "#"], [m.nom, ""]])}
      <h1 style="--c:${esc(m.couleur)}" class="tmat"><span aria-hidden="true">${esc(m.icone)}</span> ${esc(m.nom)}</h1><div class="rule"></div>
      ${m.desc ? `<p class="mut">${esc(m.desc)}</p>` : ""}
      ${chaps.length ? `<div class="grid2">${chaps.map(c => {
        if (c.erreur) return `<div class="tile err"><b>${esc(c.id)}</b><p>⚠️ Le fichier <code>contenu/${esc(m.id)}/${esc(c.id)}.md</code> est introuvable. Vérifie son nom dans <code>chapitres.txt</code>.</p></div>`;
        const best = store.get(`qcm:${m.id}/${c.id}`, null);
        const bouts = [c.exercices.length && `${c.exercices.length} exercice${c.exercices.length > 1 ? "s" : ""}`, c.qcm.length && `${c.qcm.length} questions`, c.cartes.length && `${c.cartes.length} flashcards`].filter(Boolean).join(" · ");
        return `<a class="tile" href="#${esc(m.id)}/${esc(c.id)}" style="--c:${esc(m.couleur)}">
          ${c.niveau ? `<span class="niv">${esc(c.niveau)}</span>` : ""}<b>${esc(c.titre)}</b>
          ${c.resume ? `<p class="mut">${esc(c.resume)}</p>` : ""}
          <p class="note">${bouts || "Cours"}${best ? ` · ton meilleur QCM : ${best.s}/${best.n}` : ""}</p></a>`;
      }).join("")}</div>` : `<div class="card"><p>Les chapitres arrivent bientôt ! 🌱</p></div>`}`;
  }

  async function pageChapitre(m, cid, onglet) {
    let c;
    try { c = await chapitre(m.id, cid); }
    catch (e) { main.innerHTML = `${fil([["Accueil", "#"], [m.nom, "#" + m.id], ["Introuvable", ""]])}<div class="card"><p>⚠️ Ce chapitre est introuvable.</p></div>`; return; }
    document.title = c.titre + " · " + m.nom;
    const tabs = [["cours", "📖 Cours", c.cours], ["exercices", "✏️ Exercices", c.exercices.length], ["qcm", "✅ QCM", c.qcm.length], ["flashcards", "🃏 Flashcards", c.cartes.length]].filter(t => t[2]);
    if (!tabs.some(t => t[0] === onglet)) onglet = tabs.length ? tabs[0][0] : "cours";
    main.innerHTML = `${fil([["Accueil", "#"], [m.nom, "#" + m.id], [c.titre, ""]])}
      <div style="--c:${esc(m.couleur)}">
      ${c.niveau ? `<span class="niv">${esc(c.niveau)}</span>` : ""}
      <h1 class="tmat">${esc(c.titre)}</h1><div class="rule"></div>
      <div class="tabs" role="tablist" aria-label="Parties du chapitre">${tabs.map(t => `<button role="tab" id="tab-${t[0]}" aria-controls="panneau" aria-selected="${t[0] === onglet}" tabindex="${t[0] === onglet ? 0 : -1}" data-t="${t[0]}">${t[1]}</button>`).join("")}</div>
      <div id="panneau" role="tabpanel" aria-labelledby="tab-${onglet}" tabindex="0"></div></div>`;
    const tl = main.querySelector(".tabs");
    tl.addEventListener("click", e => { const b = e.target.closest("button"); if (b) history.replaceState(null, "", `#${m.id}/${cid}/${b.dataset.t}`), pageChapitre(m, cid, b.dataset.t).then(() => main.querySelector(`#tab-${b.dataset.t}`).focus()); });
    tl.addEventListener("keydown", e => {
      const bs = [...tl.querySelectorAll("button")]; const i = bs.indexOf(document.activeElement); if (i < 0) return;
      let j = null; if (e.key === "ArrowRight") j = (i + 1) % bs.length; if (e.key === "ArrowLeft") j = (i - 1 + bs.length) % bs.length; if (e.key === "Home") j = 0; if (e.key === "End") j = bs.length - 1;
      if (j !== null) { e.preventDefault(); bs[j].click(); }
    });
    const p = main.querySelector("#panneau");
    if (onglet === "cours") p.innerHTML = `<article class="card cours">${md(c.cours || "*Le cours arrive bientôt.*")}</article>`;
    if (onglet === "exercices") p.innerHTML = c.exercices.map((x, i) => `<section class="card"><h2>${md(x.titre, true)}</h2>${md(x.enonce)}
      ${x.corr ? `<details><summary>Voir la correction</summary><div class="corr">${md(x.corr)}</div></details>` : ""}</section>`).join("");
    if (onglet === "qcm") qcm(p, m, c);
    if (onglet === "flashcards") cartes(p, m, c);
  }

  /* ---------- QCM ---------- */
  function qcm(p, m, c) {
    const qs = c.qcm.map(q => ({ ...q, o: shuffle(q.o) }));
    let score = 0, faites = 0;
    const best = store.get(`qcm:${m.id}/${c.id}`, null);
    p.innerHTML = `<div class="scorebar card" aria-live="polite"><span>Score : <b id="sc">0</b> / ${qs.length}</span>${best ? `<span class="note">Ton meilleur : ${best.s}/${best.n}</span>` : ""}<button class="btn alt sm" id="again">Recommencer</button></div>
      ${qs.map((q, i) => `<fieldset class="card q" data-i="${i}"><legend><span class="num">${i + 1}.</span> ${md(q.q, true)}</legend>
        <div class="opts">${q.o.map((o, j) => `<button class="opt" data-j="${j}">${md(o.t, true)}</button>`).join("")}</div>
        <div class="fb" aria-live="polite"></div></fieldset>`).join("")}
      <div id="fin" class="card hide" aria-live="polite"></div>`;
    p.querySelector("#again").onclick = () => qcm(p, m, c);
    p.querySelectorAll(".q").forEach(fs => fs.addEventListener("click", e => {
      const b = e.target.closest(".opt"); if (!b || fs.dataset.done) return;
      const q = qs[fs.dataset.i]; const o = q.o[b.dataset.j]; fs.dataset.done = 1; faites++;
      fs.querySelectorAll(".opt").forEach((x, j) => { x.disabled = true; if (q.o[j].ok) x.classList.add("ok"); });
      if (o.ok) score++; else b.classList.add("ko");
      fs.querySelector(".fb").innerHTML = `<p><b>${o.ok ? "✅ Bonne réponse !" : "❌ Raté."}</b> ${q.e ? md(q.e, true) : ""}</p>`;
      p.querySelector("#sc").textContent = score;
      if (faites === qs.length) {
        if (!best || score > best.s || best.n !== qs.length) store.set(`qcm:${m.id}/${c.id}`, { s: score, n: qs.length });
        const r = score / qs.length;
        const fin = p.querySelector("#fin"); fin.classList.remove("hide");
        fin.innerHTML = `<h2>${r >= .8 ? "Bravo ! 🎉" : r >= .5 ? "Pas mal ! 👍" : "Continue, tu vas y arriver 💪"}</h2><p>Tu as ${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""} sur ${qs.length}.</p><button class="btn" id="again2">Recommencer le QCM</button>`;
        fin.querySelector("#again2").onclick = () => { qcm(p, m, c); p.scrollIntoView(); };
      }
    }));
  }

  /* ---------- Flashcards ---------- */
  function cartes(p, m, c) {
    const k = `cartes:${m.id}/${c.id}`; const sues = store.get(k, []);
    p.innerHTML = `<div class="scorebar card"><span>Touche une carte pour la retourner.</span><span class="note" id="nb"></span><button class="btn alt sm" id="mix">Mélanger</button></div>
      <div class="cartes">${c.cartes.map((x, i) => ({ x, i })).sort(() => p.dataset.mix ? Math.random() - .5 : 0).map(({ x, i }) => `
        <div class="carte${sues.includes(x.r) ? " sue" : ""}"><button class="face" aria-pressed="false" data-i="${i}">
          <span class="recto">${md(x.r, true)}</span><span class="verso">${md(x.v, true)}</span></button>
          <label class="note"><input type="checkbox" data-r="${esc(x.r)}"${sues.includes(x.r) ? " checked" : ""}> Je la connais</label></div>`).join("")}</div>`;
    const maj = () => p.querySelector("#nb").textContent = `${p.querySelectorAll(".cartes input:checked").length} / ${c.cartes.length} connues`; maj();
    p.querySelectorAll(".face").forEach(b => b.onclick = () => { const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); b.classList.toggle("tourne", on); });
    p.querySelectorAll(".cartes input").forEach(ch => ch.onchange = () => {
      const l = [...p.querySelectorAll(".cartes input:checked")].map(x => x.dataset.r); store.set(k, l); ch.closest(".carte").classList.toggle("sue", ch.checked); maj();
    });
    p.querySelector("#mix").onclick = () => { p.dataset.mix = 1; cartes(p, m, c); };
  }

  /* ---------- Mentions légales ---------- */
  async function pageMentions() {
    document.title = "Mentions légales · " + SITE.titre;
    let t = ""; try { t = await lire("contenu/mentions-legales.md"); } catch (e) { t = "Mentions légales à compléter."; }
    main.innerHTML = `${fil([["Accueil", "#"], ["Mentions légales", ""]])}<article class="card cours">${md(t)}</article>
      <div class="card"><h2>Effacer mes données</h2><p>Ta progression (scores des QCM, flashcards connues) est gardée uniquement sur ton appareil. Ce bouton l'efface tout de suite.</p>
      <button class="btn alt" id="eff">Effacer ma progression</button> <span id="effOk" class="note" aria-live="polite"></span></div>`;
    main.querySelector("#eff").onclick = () => { store.clear(); main.querySelector("#effOk").textContent = "C'est fait, ta progression est effacée."; };
  }

  /* ---------- Routeur ---------- */
  async function route() {
    window.papangue && papangue.stop();
    document.body.classList.remove("avec-fond");
    const [mid, cid, onglet] = decodeURIComponent(location.hash.slice(1)).split("/");
    try {
      if (!SITE) await chargerReglages();
      const m = MATIERES.find(x => x.id === mid);
      marquerNav(m ? m.id : mid ? "-" : "");
      if (mid === "mentions") await pageMentions();
      else if (m && cid) await pageChapitre(m, cid, onglet);
      else if (m) await pageMatiere(m);
      else await pageAccueil();
    } catch (e) {
      main.innerHTML = `<div class="card"><h1>Oups</h1><p>Le contenu n'a pas pu être chargé (${esc(e.message)}).</p>
        <p class="note">Si tu as ouvert le fichier directement depuis ton ordinateur, c'est normal : le site doit être ouvert depuis son adresse en ligne (GitHub Pages). Voir GUIDE.md.</p></div>`;
    }
    if (mid !== undefined && mid !== "" && !cid) window.scrollTo(0, 0);
    if (route.deja) main.focus({ preventScroll: true }); route.deja = true;
  }
  window.addEventListener("hashchange", route);
  route();
})();
