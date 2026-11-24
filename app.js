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
    SITE = { titre: a.infos.titre || "Révisions", sous: a.infos["sous-titre"] || "", fond: a.infos.fond || "", depot: a.infos.depot || "", texte: a.corps };
    MATIERES = (await lire("contenu/matieres.txt")).split("\n")
      .filter(l => l.trim() && !l.trim().startsWith("#"))
      .map(l => { const [id, nom, icone, couleur, desc] = l.split("|").map(s => (s || "").trim()); return { id, nom, icone, couleur: couleur || "#1f63d6", desc }; });
    document.getElementById("brandTitle").textContent = SITE.titre;
    document.getElementById("brandSmall").textContent = SITE.sous || "Révisions";
    nav.innerHTML = `<a href="#" data-v="">Accueil</a>` + MATIERES.map(m => `<a href="#${esc(m.id)}" data-v="${esc(m.id)}"><span aria-hidden="true">${esc(m.icone)}</span> ${esc(m.nom)}</a>`).join("") + `<a href="#" class="out" onclick="deconnexion();return false">Déconnexion</a>`;
  }
  async function listeChapitres(mid) {
    try {
      return (await lire(`contenu/${mid}/chapitres.txt`)).split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#")).map(l => l.replace(/\.md$/i, ""));
    } catch (e) { return []; }
  }
  async function chapitre(mid, cid) {
    const k = mid + "/" + cid; if (cacheChap[k]) return cacheChap[k];
    const { infos, corps } = entete(await lire(`contenu/${mid}/${cid}.md`));
    const parts = { cours: [], exercices: "", qcm: "", flashcards: "", trous: "" };
    corps.split(/^(?=## )/m).forEach(bloc => {
      const t = (bloc.match(/^## (.*)/) || [])[1];
      const n = (t || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (n === "exercices" || n === "exercice") parts.exercices += bloc.replace(/^## .*\n/, "");
      else if (n === "qcm" || n === "quiz") parts.qcm += bloc.replace(/^## .*\n/, "");
      else if (n === "textes a trous" || n === "texte a trous" || n === "trous") parts.trous += bloc.replace(/^## .*\n/, "");
      else if (n === "flashcards" || n === "flashcard" || n === "cartes") parts.flashcards += bloc.replace(/^## .*\n/, "");
      else if (n !== "cours") parts.cours.push(bloc); else parts.cours.push(bloc.replace(/^## .*\n/, ""));
    });
    const c = { id: cid, type: (infos.type || "").toLowerCase(), titre: infos.titre || cid, niveau: infos.niveau || "", resume: infos.resume || "",
      cours: parts.cours.join("\n").trim(), exercices: lireExos(parts.exercices), qcm: lireQcm(parts.qcm), cartes: lireCartes(parts.flashcards), trous: lireTrous(parts.trous) };
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
  function lireTrous(t) {
    return t.split(/^(?=### )/m).map(b => b.trim()).filter(b => b.startsWith("### ")).map(b => {
      const titre = b.match(/^### (.*)/)[1]; const texte = b.replace(/^### .*\n?/, "").trim();
      const mots = [...texte.matchAll(/\[\[(.+?)\]\]/g)].map(m => m[1].trim());
      return { titre, texte, mots };
    }).filter(x => x.mots.length);
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


  /* ---------- Animation de l'accueil : étoiles qui scintillent + étoiles filantes ---------- */
  const ciel = (() => {
    const calme = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cv = null, ctx, raf = 0, etoiles = [], filantes = [], W = 0, H = 0, dpr = 1, actif = false;
    function taille() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(W * H / 9000);
      etoiles = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .3, p: Math.random() * 6.28, v: Math.random() * 1.5 + .5, d: Math.random() * .08 + .02, c: Math.random() < .2 ? "255,214,120" : Math.random() < .3 ? "180,205,255" : "255,255,255" }));
    }
    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      for (const e of etoiles) {
        const a = .35 + .65 * (.5 + .5 * Math.sin(t / 1000 * e.v + e.p));
        e.y -= e.d; if (e.y < -2) { e.y = H + 2; e.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.283); ctx.fillStyle = `rgba(${e.c},${a})`; ctx.fill();
        if (e.r > 1.3) { ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 3, 0, 6.283); ctx.fillStyle = `rgba(${e.c},${a * .12})`; ctx.fill(); }
      }
      if (Math.random() < .006 && filantes.length < 2) filantes.push({ x: Math.random() * W * .8 + W * .2, y: Math.random() * H * .4, vx: -(7 + Math.random() * 5), vy: 3 + Math.random() * 2, vie: 1 });
      filantes = filantes.filter(f => f.vie > 0);
      for (const f of filantes) {
        const g = ctx.createLinearGradient(f.x, f.y, f.x - f.vx * 12, f.y - f.vy * 12);
        g.addColorStop(0, `rgba(255,240,200,${f.vie})`); g.addColorStop(1, "rgba(255,240,200,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - f.vx * 12, f.y - f.vy * 12); ctx.stroke();
        f.x += f.vx; f.y += f.vy; f.vie -= .018;
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (calme || actif) return; actif = true;
      if (!cv) { cv = document.createElement("canvas"); cv.className = "ciel"; cv.setAttribute("aria-hidden", "true"); document.body.prepend(cv); ctx = cv.getContext("2d"); addEventListener("resize", () => actif && taille()); }
      cv.hidden = false; taille(); raf = requestAnimationFrame(frame);
    }
    function stop() { actif = false; cancelAnimationFrame(raf); if (cv) cv.hidden = true; }
    document.addEventListener("visibilitychange", () => { if (!actif) return; if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(frame); });
    return { start, stop };
  })();

  /* ---------- Les pages ---------- */
  function marquerNav(v) { nav.querySelectorAll("a").forEach(a => { const on = a.dataset.v === v; a.classList.toggle("on", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); }); }
  function fil(items) { return `<nav class="fil" aria-label="Fil d'Ariane">${items.map((it, i) => i < items.length - 1 ? `<a href="${it[1]}">${esc(it[0])}</a> <span aria-hidden="true">›</span> ` : `<span aria-current="page">${esc(it[0])}</span>`).join("")}</nav>`; }

  async function pageAccueil() {
    document.title = SITE.titre;
    if (SITE.fond) {
      document.body.style.setProperty("--fond", `url("${SITE.fond.replace(/^images\//, "contenu/images/").replace(/"/g, "")}")`);
      document.body.classList.add("avec-fond");
      ciel.start();
    }
    const comptes = await Promise.all(MATIERES.map(m => listeChapitres(m.id).then(l => l.length)));
    main.innerHTML = `
      <div class="hero">
        <svg class="atome" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="ga2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffc634"/><stop offset="1" stop-color="#ff9d00" stop-opacity="0"/></radialGradient></defs><g fill="none" stroke="#bcd3ff" stroke-width="2.6" opacity=".9"><ellipse cx="50" cy="50" rx="44" ry="15"/><ellipse cx="50" cy="50" rx="44" ry="15" transform="rotate(60 50 50)"/><ellipse cx="50" cy="50" rx="44" ry="15" transform="rotate(120 50 50)"/></g><circle cx="50" cy="50" r="17" fill="url(#ga2)"/><circle cx="50" cy="50" r="7" fill="#fff3b0"/><circle cx="94" cy="50" r="4.5" fill="#ffd34d"/><circle cx="28" cy="88" r="4.5" fill="#8fb8ff"/><circle cx="28" cy="12" r="4.5" fill="#f5f8ff"/></svg>
        <div><h1>${esc(SITE.titre)}</h1><div class="rule"></div></div>
      </div>
      <div class="intro">${md(SITE.texte)}</div>
      <div class="matieres">${MATIERES.map((m, i) => `
        <a class="matiere" href="#${esc(m.id)}" style="--c:${esc(m.couleur)};--i:${i}">
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
    let pres = ""; try { pres = await lire(`contenu/${m.id}/presentation.md`); } catch (e) {}
    const chaps = await Promise.all(ids.map(id => chapitre(m.id, id).catch(() => ({ id, titre: id, erreur: true }))));
    main.innerHTML = `${fil([["Accueil", "#"], [m.nom, ""]])}
      <h1 style="--c:${esc(m.couleur)}" class="tmat"><span aria-hidden="true">${esc(m.icone)}</span> ${esc(m.nom)}</h1><div class="rule"></div>
      ${m.desc ? `<p class="mut">${esc(m.desc)}</p>` : ""}
      ${pres.trim() ? (() => { const e = entete(pres.includes("\n---") ? pres : "---\n" + pres); const libre = (e.infos.style || "").toLowerCase() === "libre";
        return `<div class="${libre ? "presentation" : "affiche"}" style="--c:${esc(m.couleur)}">${md(e.corps)}</div>`; })() : ""}
      ${chaps.length ? `<div class="grid2">${chaps.map(c => {
        if (c.erreur) return `<div class="tile err"><b>${esc(c.id)}</b><p>⚠️ Le fichier <code>contenu/${esc(m.id)}/${esc(c.id)}.md</code> est introuvable. Vérifie son nom dans <code>chapitres.txt</code>.</p></div>`;
        const best = store.get(`qcm:${m.id}/${c.id}`, null);
        const bouts = [c.exercices.length && `${c.exercices.length} exercice${c.exercices.length > 1 ? "s" : ""}`, c.qcm.length && `${c.qcm.length} questions`, c.cartes.length && `${c.cartes.length} flashcards`].filter(Boolean).join(" · ");
        return `<a class="tile" href="#${esc(m.id)}/${esc(c.id)}" style="--c:${esc(m.couleur)}">
          ${c.niveau ? `<span class="niv">${esc(c.niveau)}</span>` : ""}<b>${esc(c.titre)}</b>
          ${c.resume ? `<p class="mut">${esc(c.resume)}</p>` : ""}
          <p class="note">${c.type === "presentation" ? "Ouvrir le chapitre →" : bouts || "Cours"}${best ? ` · ton meilleur QCM : ${best.s}/${best.n}` : ""}</p></a>`;
      }).join("")}${prof() ? `<button class="tile ajout" id="ajout" style="--c:${esc(m.couleur)}"><b>＋ Ajouter un chapitre</b><p class="mut">Visible seulement en mode prof.</p></button>` : ""}</div>` : `<div class="card"><p>Les chapitres arrivent bientôt ! 🌱</p>${prof() ? `<button class="btn" id="ajout">＋ Ajouter un chapitre</button>` : ""}</div>`}
      <div id="ajoutForm"></div>`;
    const bt = main.querySelector("#ajout"); if (bt) bt.onclick = () => formAjout(m);
  }

  async function pageChapitre(m, cid, onglet) {
    let c;
    try { c = await chapitre(m.id, cid); }
    catch (e) { main.innerHTML = `${fil([["Accueil", "#"], [m.nom, "#" + m.id], ["Introuvable", ""]])}<div class="card"><p>⚠️ Ce chapitre est introuvable.</p></div>`; return; }
    document.title = c.titre + " · " + m.nom;
    if (c.type === "presentation") {
      main.innerHTML = `${fil([["Accueil", "#"], [m.nom, "#" + m.id], [c.titre, ""]])}
        <div style="--c:${esc(m.couleur)}">${c.niveau ? `<span class="niv">${esc(c.niveau)}</span>` : ""}
        <h1 class="tmat">${esc(c.titre)}</h1><div class="rule"></div>
        <article class="card cours presentation-chap">${md(c.cours)}</article></div>`;
      return;
    }
    const tabs = [["cours", "📖 Cours", c.cours], ["exercices", "✏️ Exercices", c.exercices.length], ["qcm", "✅ QCM", c.qcm.length], ["trous", "✍️ Textes à trous", c.trous.length], ["flashcards", "🃏 Flashcards", c.cartes.length]].filter(t => t[2]);
    if (!tabs.some(t => t[0] === onglet)) onglet = tabs.length ? tabs[0][0] : "cours";
    main.innerHTML = `${fil([["Accueil", "#"], [m.nom, "#" + m.id], [c.titre, ""]])}
      <div style="--c:${esc(m.couleur)}">
      ${c.niveau ? `<span class="niv">${esc(c.niveau)}</span>` : ""}
      <h1 class="tmat">${esc(c.titre)}</h1><div class="rule"></div>
      ${menuPhilo(tabs, onglet, m, cid)}
      <div id="panneau" role="tabpanel" aria-labelledby="tab-${onglet}" tabindex="0"></div></div>`;
    const tl = main.querySelector(".tabs, .menuchap");
    tl.addEventListener("click", e => { const g = e.target.closest(".nbtn"); if (g) { const o = !g.parentNode.classList.contains("open"); tl.querySelectorAll(".ngroup").forEach(x => { x.classList.remove("open"); x.firstElementChild.setAttribute("aria-expanded", "false"); }); g.parentNode.classList.toggle("open", o); g.setAttribute("aria-expanded", o); return; }
      const b = e.target.closest("button[data-t]"); if (b) history.replaceState(null, "", `#${m.id}/${cid}/${b.dataset.t}`), pageChapitre(m, cid, b.dataset.t).then(() => main.querySelector(`#tab-${b.dataset.t}`).focus()); });
    tl.addEventListener("keydown", e => {
      const bs = [...tl.querySelectorAll("button[data-t]")]; const i = bs.indexOf(document.activeElement); if (i < 0) return;
      let j = null; if (e.key === "ArrowRight") j = (i + 1) % bs.length; if (e.key === "ArrowLeft") j = (i - 1 + bs.length) % bs.length; if (e.key === "Home") j = 0; if (e.key === "End") j = bs.length - 1;
      if (j !== null) { e.preventDefault(); bs[j].click(); }
    });
    const p = main.querySelector("#panneau");
    if (onglet === "cours") p.innerHTML = `<article class="card cours">${md(c.cours || "*Le cours arrive bientôt.*")}</article>`;
    if (onglet === "exercices") p.innerHTML = c.exercices.map((x, i) => `<section class="card"><h2>${md(x.titre, true)}</h2>${md(x.enonce)}
      ${x.corr ? `<details><summary>Voir la correction</summary><div class="corr">${md(x.corr)}</div></details>` : ""}</section>`).join("");
    if (onglet === "qcm") qcm(p, m, c);
    if (onglet === "flashcards") cartes(p, m, c);
    if (onglet === "trous") trous(p, m, c);
  }

  /* ---------- menu des chapitres de philosophie (comme le site nature-justice) ---------- */
  const lj = (m, cid, v) => `nature-justice/index.html?m=${m.id}&chap=${cid}#${v}`;
  function menuPhilo(tabs, onglet, m, cid) {
    const bt = k => { const t = tabs.find(x => x[0] === k); return t ? `<button role="tab" id="tab-${k}" aria-selected="${k === onglet}" data-t="${k}">${t[1]}</button>` : ""; };
    const grp = (nom, ks, extra) => { const h = ks.map(bt).join("") + (extra || ""); return h ? `<div class="ngroup${ks.includes(onglet) ? " actif" : ""}"><button class="nbtn" aria-expanded="false">${nom} ▾</button><div class="nmenu">${h}</div></div>` : ""; };
    return `<nav class="menuchap" aria-label="Menu du chapitre"><a href="#${m.id}">Accueil</a>${grp("📖 Apprendre", ["cours"])}${grp("✏️ S'entraîner", ["exercices", "qcm", "trous"])}${grp("🎮 Jouer", ["flashcards"], ["jardin|🌼 Cartes mentales", "mots|🔤 Mots mêlés", "direct|👥 Jouer entre amis"].map(x => `<a href="${lj(m, cid, x.split("|")[0])}">${x.split("|")[1]}</a>`).join(""))}<a href="${lj(m, cid, "mes-notes")}">Mes notes</a></nav>`;
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

  /* ---------- Textes à trous ---------- */
  function trous(p, m, c) {
    p.innerHTML = `<p class="mut">Complète chaque texte avec les mots de la banque. Bonne réponse : <b>+1</b>, erreur : <b>−0,5</b>, case vide : 0.</p>` + c.trous.map((x, i) => {
      const banque = shuffle(x.mots); let n = 0;
      const html = md(x.texte.replace(/\[\[(.+?)\]\]/g, () => `@@T${n++}@@`));
      let k = 0;
      return `<section class="card trou" data-i="${i}"><h2>${md(x.titre, true)}</h2>
        <p class="banque" aria-label="Banque de mots">${banque.map(w => `<span class="mot">${esc(w)}</span>`).join(" ")}</p>
        <div class="tt">${html.replace(/@@T(\d+)@@/g, (mm, j) => `<select data-j="${j}" aria-label="Trou ${+j + 1}"><option value="">…</option>${banque.slice().sort().map(w => `<option>${esc(w)}</option>`).join("")}</select>`)}</div>
        <button class="btn sm verif">Corriger</button> <button class="btn alt sm refaire">Recommencer</button><p class="res" aria-live="polite"></p></section>`;
    }).join("");
    p.querySelectorAll(".trou").forEach(sec => {
      const x = c.trous[sec.dataset.i];
      sec.querySelector(".verif").onclick = () => {
        let pts = 0; const sels = [...sec.querySelectorAll("select")];
        sels.forEach((sl, j) => { sl.classList.remove("ok", "ko"); if (!sl.value) return;
          const bon = norm(sl.value) === norm(x.mots[j]); sl.classList.add(bon ? "ok" : "ko"); pts += bon ? 1 : -.5; if (!bon) sl.title = "Réponse : " + x.mots[j]; });
        const note = Math.max(0, pts) / sels.length * 20;
        sec.querySelector(".res").innerHTML = `<b>${Math.round(note * 10) / 10} / 20</b> — ${sels.filter(s => s.classList.contains("ok")).length} bonne(s) réponse(s) sur ${sels.length}. Les erreurs sont en rouge : survole-les pour voir la réponse.`;
        sels.forEach((sl, j) => { if (sl.classList.contains("ko")) sl.insertAdjacentHTML("afterend", `<span class="corrige"> (${esc(x.mots[j])})</span>`); });
      };
      sec.querySelector(".refaire").onclick = () => trous(p, m, c);
    });
  }
  const norm = t => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

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


  /* ---------- Connexion ----------
     Pour changer l'identifiant ou le mot de passe : demande à Claude une nouvelle « empreinte »
     (SHA-256 de « identifiant:motdepasse » en minuscules) et remplace la valeur ci-dessous. */
  const LOGIN_HASH = "fbea7dfb5fba8de82f2a41751afa1c99e83ee1a32c485375856aba4d937eba18";
  function connecte() { const a = store.get("auth", null); return !!(a && a.ok && (a.rem || Date.now() - a.t < 432e5)); }
  async function sha256(t) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  function pageConnexion() {
    document.title = "Connexion · " + (SITE ? SITE.titre : "Révisions");
    nav.hidden = true; document.body.classList.add("avec-fond"); ciel.start();
    if (SITE && SITE.fond) document.body.style.setProperty("--fond", `url("${SITE.fond.replace(/^images\//, "contenu/images/").replace(/"/g, "")}")`);
    main.innerHTML = `<form class="card login" id="login" autocomplete="on">
      <h1>Connexion</h1><p class="mut">Identifie-toi pour accéder aux révisions.</p>
      <label for="lid">Identifiant</label><input type="text" id="lid" autocomplete="username" autocapitalize="none" spellcheck="false" required>
      <label for="lpw">Mot de passe</label><div class="pw"><input type="password" id="lpw" autocomplete="current-password" autocapitalize="none" spellcheck="false" required><button type="button" class="eye" aria-label="Afficher le mot de passe" aria-pressed="false">👁️</button></div>
      <label class="note rem"><input type="checkbox" id="lrem"> Rester connecté sur cet appareil</label>
      <button class="btn" type="submit">Se connecter</button>
      <p id="lerr" class="lerr" role="alert"></p></form>`;
    const f = main.querySelector("#login"), pw = f.querySelector("#lpw"), eye = f.querySelector(".eye");
    eye.onclick = () => { const v = pw.type === "password"; pw.type = v ? "text" : "password"; eye.setAttribute("aria-pressed", v); eye.setAttribute("aria-label", v ? "Masquer le mot de passe" : "Afficher le mot de passe"); };
    f.onsubmit = async e => {
      e.preventDefault();
      const id = f.querySelector("#lid").value.trim().toLowerCase(), mp = pw.value.trim().toLowerCase();
      if (await sha256(id + ":" + mp) !== LOGIN_HASH) { f.querySelector("#lerr").textContent = "Identifiant ou mot de passe incorrect."; pw.value = ""; pw.focus(); return; }
      store.set("auth", { ok: true, t: Date.now(), rem: f.querySelector("#lrem").checked });
      let retour = null; try { retour = sessionStorage.getItem("rs:retour"); sessionStorage.removeItem("rs:retour"); } catch (e) {}
      if (retour && retour.startsWith(location.origin)) { location.href = retour; return; }
      nav.hidden = false; route();
    };
    f.querySelector("#lid").focus();
  }
  window.deconnexion = () => { try { localStorage.removeItem("rs:auth"); } catch (e) {} location.hash = ""; route(); };


  /* ---------- Mode prof : ajouter un chapitre (ouvre GitHub avec le modèle pré-rempli) ----------
     Activer : ouvrir le site avec #prof à la fin de l'adresse. Désactiver : #prof-off. */
  const prof = () => store.get("prof", false) === true;
  const slug = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "chapitre";
  function formAjout(m) {
    const box = main.querySelector("#ajoutForm");
    box.innerHTML = `<form class="card ajoutf" style="--c:${esc(m.couleur)}"><h2>Nouveau chapitre en ${esc(m.nom)}</h2>
      <label for="aT">Titre du chapitre</label><input id="aT" required placeholder="Ex. : La conscience">
      <label for="aN">Niveau</label><input id="aN" placeholder="Ex. : Terminale">
      <label for="aR">Résumé en une phrase</label><input id="aR" placeholder="Ex. : Suis-je ce que j'ai conscience d'être ?">
      <button class="btn" type="submit">Préparer le chapitre</button><div id="aOut"></div></form>`;
    box.scrollIntoView({ behavior: "smooth" }); box.querySelector("#aT").focus();
    box.querySelector("form").onsubmit = e => {
      e.preventDefault();
      const t = box.querySelector("#aT").value.trim(), n = box.querySelector("#aN").value.trim(), r = box.querySelector("#aR").value.trim(), f = slug(t);
      const modele = `titre: ${t}\nniveau: ${n}\nrésumé: ${r}\n---\n## Cours\n\n### 1. Première partie\n\nÉcris ton cours ici.\n\n## Exercices\n\n### Exercice 1\n\nÉnoncé.\n\nCorrection :\n\nLa correction.\n\n## QCM\n\n? Ta question ?\n- une mauvaise réponse\n+ la bonne réponse\n- une autre mauvaise réponse\n> L'explication.\n\n## Flashcards\n\nRecto :: Verso\n`;
      const dep = SITE.depot;
      const out = box.querySelector("#aOut");
      if (!dep) { out.innerHTML = `<p class="lerr">Ajoute la ligne « depot: Kalex440/nom-du-depot » dans contenu/accueil.md.</p>`; return; }
      const nouv = `https://github.com/${dep}/new/main/contenu/${encodeURIComponent(m.id)}?filename=${encodeURIComponent(f + ".md")}&value=${encodeURIComponent(modele)}`;
      const liste = `https://github.com/${dep}/edit/main/contenu/${encodeURIComponent(m.id)}/chapitres.txt`;
      out.innerHTML = `<ol class="etapes">
        <li><a class="btn" href="${nouv}" target="_blank" rel="noopener">1. Créer le fichier « ${esc(f)}.md » sur GitHub</a><br><span class="note">Le modèle est déjà rempli : écris ton cours, puis clique sur « Commit changes ».</span></li>
        <li><a class="btn alt" href="${liste}" target="_blank" rel="noopener">2. L'ajouter à la liste des chapitres</a><br><span class="note">Ajoute cette ligne à la fin, puis « Commit changes » :</span> <code>${esc(f)}</code></li>
        <li><span class="note">3. Attends 1 à 2 minutes et recharge le site : ton chapitre apparaît ici.</span></li></ol>`;
    };
  }

  /* ---------- Routeur ---------- */
  async function route() {
    window.papangue && papangue.stop();
    document.body.classList.remove("avec-fond"); ciel.stop();
    if (location.hash === "#prof" || location.hash === "#prof-off") { store.set("prof", location.hash === "#prof"); history.replaceState(null, "", location.pathname + "#"); }
    const [mid, cid, onglet] = decodeURIComponent(location.hash.slice(1)).split("/");
    try {
      if (!SITE) await chargerReglages();
      if (mid !== "mentions" && !connecte()) { pageConnexion(); return; }
      nav.hidden = false;
      const m = MATIERES.find(x => x.id === mid);
      marquerNav(m ? m.id : mid ? "-" : "");
      if (m) document.body.dataset.matiere = m.id; else delete document.body.dataset.matiere;
      document.body.classList.toggle("sombre", !!m && ["maths", "physique-chimie", "svt"].includes(m.id));
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
