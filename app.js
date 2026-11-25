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
    nav.innerHTML = `<a href="#" data-v="">Accueil</a>` + MATIERES.map(m => `<a href="#${esc(m.id)}" data-v="${esc(m.id)}"><span aria-hidden="true">${esc(m.icone)}</span> ${esc(m.nom)}</a>`).join("") + `<a href="#profil" data-v="profil" id="navProfil">🙂 Mon profil</a><a href="#" class="out" onclick="deconnexion();return false">Déconnexion</a>`;
  }
  async function listeChapitres(mid) {
    try {
      return (await lire(`contenu/${mid}/chapitres.txt`)).split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#")).map(l => l.replace(/\.md$/i, ""));
    } catch (e) { return []; }
  }
  async function chapitre(mid, cid) {
    const k = mid + "/" + cid; if (cacheChap[k]) return cacheChap[k];
    const { infos, corps } = entete(await lire(`contenu/${mid}/${cid}.md`));
    const parts = { cours: [], exercices: "", etudes: "", qcm: "", flashcards: "", trous: "" };
    corps.split(/^(?=## )/m).forEach(bloc => {
      const t = (bloc.match(/^## (.*)/) || [])[1];
      const n = (t || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (n === "etudes de texte" || n === "etude de texte") parts.etudes += bloc.replace(/^## .*\n/, "");
      else if (n === "exercices" || n === "exercice") parts.exercices += bloc.replace(/^## .*\n/, "");
      else if (n === "qcm" || n === "quiz") parts.qcm += bloc.replace(/^## .*\n/, "");
      else if (n === "textes a trous" || n === "texte a trous" || n === "trous") parts.trous += bloc.replace(/^## .*\n/, "");
      else if (n === "flashcards" || n === "flashcard" || n === "cartes") parts.flashcards += bloc.replace(/^## .*\n/, "");
      else if (n !== "cours") parts.cours.push(bloc); else parts.cours.push(bloc.replace(/^## .*\n/, ""));
    });
    const c = { id: cid, type: (infos.type || "").toLowerCase(), titre: infos.titre || cid, niveau: infos.niveau || "", resume: infos.resume || "",
      cours: parts.cours.join("\n").trim(), exercices: lireExos(parts.exercices), etudes: lireExos(parts.etudes), qcm: lireQcm(parts.qcm), cartes: lireCartes(parts.flashcards), trous: lireTrous(parts.trous) };
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
    const tabs = [["cours", "📖 Cours", c.cours], ["exercices", "✏️ Exercices", c.exercices.length], ["etudes", "📜 Études de texte", c.etudes.length], ["qcm", "✅ QCM", c.qcm.length], ["trous", "✍️ Textes à trous", c.trous.length], ["flashcards", "🃏 Flashcards", c.cartes.length], ["bac", "🎓 Sujets de bac", bacTexte(c.cours)]].filter(t => t[2]);
    if (!tabs.some(t => t[0] === onglet)) onglet = tabs.length ? tabs[0][0] : "cours";
    main.innerHTML = `${fil([["Accueil", "#"], [m.nom, "#" + m.id], [c.titre, ""]])}
      <div style="--c:${esc(m.couleur)}">
      ${c.niveau ? `<span class="niv">${esc(c.niveau)}</span>` : ""}
      <h1 class="tmat">${esc(c.titre)}</h1><div class="rule"></div>
      ${menuPhilo(tabs, onglet, m, cid, c)}
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
    if (onglet === "etudes") noter(p, m, c, cid, "etude");
    if (onglet === "exercices" && m.id === "philosophie") noter(p, m, c, cid, "exo");
    else if (onglet === "exercices") p.innerHTML = c.exercices.map((x, i) => `<section class="card"><h2>${md(x.titre, true)}</h2>${md(x.enonce)}
      ${x.corr ? `<details><summary>Voir la correction</summary><div class="corr">${md(x.corr)}</div></details>` : ""}</section>`).join("");
    if (onglet === "qcm") qcm(p, m, c);
    if (onglet === "flashcards") cartes(p, m, c);
    if (onglet === "bac") p.innerHTML = `<article class="card cours">${md(bacTexte(c.cours))}</article>`;
    if (onglet === "trous") trous(p, m, c);
  }

  /* ---------- menu des chapitres de philosophie (comme le site nature-justice) ---------- */
  const qcmOk = (m, cid) => { try { const r = JSON.parse(localStorage.getItem(`c:${m.id}/${cid}:myResults`) || "{}").qcm; return !!r && Math.max(r.best ?? r.s, r.s) >= 12; } catch (e) { return false; } };
  const resKey = (m, cid) => `c:${m.id}/${cid}:myResults`;
  const best = (m, cid, k) => { try { const r = JSON.parse(localStorage.getItem(resKey(m, cid)) || "{}")[k]; return r ? Math.max(r.best ?? r.s, r.s) : -1; } catch (e) { return -1; } };
  const etudeOk = (m, cid) => best(m, cid, "etude") >= 12;
  const lj = (m, cid, v) => `nature-justice/index.html?m=${m.id}&chap=${cid}#${v}`;
  /* ---------- Études de texte notées (auto-évaluation), débloquées à 12/20 au QCM ---------- */
  const ETAPES = { etude: { liste: "etudes", nom: "études de texte", prec: null }, exo: { liste: "exercices", nom: "exercices", prec: "etude" } };
  /* clé de l'étape qui doit être réussie (>= 12) avant d'ouvrir une partie : qcm -> étude -> exercices -> trous */
  function precedent(m, c, cid, k) {
    const chaine = ["qcm", c.etudes.length && "etude", c.exercices.length && "exo"].filter(Boolean);
    if (k === "trous") return chaine[chaine.length - 1];
    const i = chaine.indexOf(k); return i > 0 ? chaine[i - 1] : null;
  }
  const NOMS = { qcm: "QCM", etude: "étude de texte", exo: "exercice" };
  const ouvert = (m, c, cid, k) => { if (m.id !== "philosophie") return true; const pr = precedent(m, c, cid, k); return !pr || best(m, cid, pr) >= 12; };
  function noter(p, m, c, cid, k) {
    const E = ETAPES[k], items = c[E.liste], pr = precedent(m, c, cid, k === "etude" ? "etude" : "exo");
    if (!ouvert(m, c, cid, k)) { p.innerHTML = `<div class="card"><h2>🔒 ${E.nom[0].toUpperCase() + E.nom.slice(1)} verrouillés</h2><p>Obtiens au moins <b>12/20</b> ${pr === "qcm" ? `au <a href="${lj(m, cid, "qcm")}">QCM de ce chapitre</a>` : `à ${pr === "etude" ? "une étude de texte" : "un exercice"} de ce chapitre`} pour les débloquer.</p></div>`; return; }
    const meilleur = best(m, cid, k), apres = k === "etude" ? (c.exercices.length ? "les exercices" : "les textes à trous") : "les textes à trous";
    p.innerHTML = `<p class="note">Cherche d'abord, affiche la correction, puis note-toi honnêtement : <b>1</b> point si c'est juste, <b>0,5</b> si c'est partiel, <b>0</b> sinon. Il faut au moins <b>12/20</b> pour débloquer ${apres}.${meilleur >= 0 ? ` Ta meilleure note : <b>${String(Math.round(meilleur * 10) / 10).replace(".", ",")}/20</b>.` : ""}</p>` + items.map((x, i) => {
      const nq = k === "etude" ? Math.max(1, (x.enonce.match(/^\s*\d+\./gm) || []).length) : 1;
      return `<section class="card etude" data-i="${i}" data-nq="${nq}"><h2>${md(x.titre, true)}</h2>${md(x.enonce)}
        <label class="note" for="rep${i}">Tes réponses</label><textarea id="rep${i}" rows="5" style="width:100%"></textarea>
        <button class="btn sm voir" type="button">Voir la correction</button>
        <div class="apresc" hidden><div class="corr">${md(x.corr)}</div>
          <p><b>Ma note${nq > 1 ? ", question par question" : ""} :</b></p>
          ${Array.from({ length: nq }, (_, q) => `<label>${nq > 1 ? "Q" + (q + 1) : "Réponse"} <select class="nq"><option value="0">0 – faux</option><option value="0.5">0,5 – partiel</option><option value="1">1 – juste</option></select></label> `).join("")}
          <button class="btn sm valider" type="button">Valider ma note</button> <span class="resultat note" aria-live="polite"></span></div></section>`; }).join("");
    p.querySelectorAll(".etude").forEach(s => {
      s.querySelector(".voir").onclick = () => { s.querySelector(".apresc").hidden = false; s.querySelector(".voir").hidden = true; };
      s.querySelector(".valider").onclick = () => {
        const nq = +s.dataset.nq, tot = [...s.querySelectorAll(".nq")].reduce((t, e) => t + +e.value, 0), note = Math.round(tot / nq * 200) / 10;
        let r = {}; try { r = JSON.parse(localStorage.getItem(resKey(m, cid)) || "{}"); } catch (e) {}
        const old = r[k] ? Math.max(r[k].best ?? r[k].s, r[k].s) : -1;
        r[k] = { s: note, best: Math.max(old, note), n: 1 };
        try { localStorage.setItem(resKey(m, cid), JSON.stringify(r)); } catch (e) {}
        s.querySelector(".resultat").textContent = `${String(note).replace(".", ",")}/20 ` + (note >= 12 ? `🔓 Bravo, ${apres} sont débloqués !` : `🔒 Il faut 12/20 pour débloquer ${apres} : relis la correction et réessaie.`);
      };
    });
  }

  /* sections « Pour la dissertation » / « Sujets types » du cours */
  function bacTexte(cours) {
    const out = []; let on = false;
    (cours || "").split("\n").forEach(l => { const h = l.match(/^### (.+)/); if (h) on = /dissertation|sujets? type|sujets? de bac/i.test(h[1]); if (on) out.push(l); });
    return out.join("\n").trim();
  }
  function menuPhilo(tabs, onglet, m, cid, c0) {
    const verrou = k => (m.id === "philosophie" && !ouvert(m, c0, cid, k)) ? "🔒 " : "";
    const nat = { qcm: "qcm", trous: "trous", flashcards: "flash", etudes: null };
    const bt = k => { const t = tabs.find(x => x[0] === k); if (!t) return ""; const kk = { trous: "trous", etudes: "etude", exercices: "exo" }[k];
      if (m.id === "philosophie" && nat[k]) return `<a href="${lj(m, cid, nat[k])}">${kk ? verrou(kk) : ""}${t[1]}</a>`;
      return `<button role="tab" id="tab-${k}" aria-selected="${k === onglet}" data-t="${k}">${kk ? verrou(kk) : ""}${t[1]}</button>`; };
    const grp = (nom, ks, extra) => { const h = ks.map(bt).join("") + (extra || ""); return h ? `<div class="ngroup${ks.includes(onglet) ? " actif" : ""}"><button class="nbtn" aria-expanded="false">${nom} ▾</button><div class="nmenu">${h}</div></div>` : ""; };
    return `<nav class="menuchap" aria-label="Menu du chapitre"><a href="#${m.id}">Accueil</a>${grp("📖 Apprendre", ["cours", "flashcards", "bac"])}${grp("✏️ S'entraîner", ["qcm", "etudes", "exercices", "trous"])}${grp("🎮 Jouer", [], ["jardin|🌼 Cartes mentales", "mots|🔤 Mots mêlés", "direct|👥 Jouer entre amis"].map(x => `<a href="${lj(m, cid, x.split("|")[0])}">${x.split("|")[1]}</a>`).join(""))}<a href="#profil">Mes notes</a></nav>`;
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
      if (o.ok) score++; else { b.classList.add("ko"); noterErreur(m.id + "/" + c.id, q.q); }
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

  /* ---------- Profil : avatar, notes, erreurs fréquentes, envoi VOLONTAIRE à Kendji ---------- */
  const AVATARS = ["🦊", "🐼", "🦁", "🐯", "🐸", "🐧", "🦉", "🐙", "🦄", "🐲", "🚀", "🪐", "⚛️", "🧪", "🎸", "⚽"];
  const avatar = () => Avatar.normalise(store.get("avatar", "")), avatarOk = () => Avatar.valide(avatar()), avTxt = () => "🧑‍🎓", pseudo = () => store.get("pseudo", "");
  const MAIL_URL = (() => { const p = ["moc.liamg", "@", "31450073", "ijdnek"]; return "https://formsubmit.co/ajax/" + p.reverse().map(x => [...x].reverse().join("")).join(""); })();
  function noterErreur(cle, question) { const e = store.get("erreurs", {}); const q = lisible(question).slice(0, 200); (e[cle] = e[cle] || {})[q] = (e[cle][q] || 0) + 1; store.set("erreurs", e); }
  /* formules LaTeX -> texte lisible (pour les listes d'erreurs, les e-mails et le PDF) */
  const lisible = s => String(s).replace(/\$/g, "").replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)").replace(/\(([\wπ.]+)\)\/\(([\wπ.]+)\)/g, "$1/$2").replace(/\\sqrt\{([^{}]*)\}/g, "√($1)").replace(/\^2/g, "²").replace(/\^3/g, "³").replace(/\^\{([^{}]*)\}/g, "^$1").replace(/_\{([^{}]*)\}/g, "_$1").replace(/\\times/g, "×").replace(/\\cdot/g, "·").replace(/\\(?:leq?|leqslant)/g, "≤").replace(/\\(?:geq?|geqslant)/g, "≥").replace(/\\infty/g, "∞").replace(/\\pi/g, "π").replace(/\\Delta/g, "Δ").replace(/\\(?:left|right|mathrm|text)/g, "").replace(/\\,/g, " ").replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  const fmt1 = n => String(Math.round(n * 10) / 10).replace(".", ",");
  const NOMS_TYPE = { qcm: "QCM", etude: "Étude de texte", exo: "Exercices" };
  function majNavProfil() { const l = nav.querySelector("#navProfil"); let b = nav.querySelector("#navBilan"); if (prof() && !b && l) { l.insertAdjacentHTML("beforebegin", `<a href="#bilan" data-v="bilan" id="navBilan">📊 Bilan</a>`); } else if (!prof() && b) b.parentNode.removeChild(b); if (l) l.innerHTML = `<span class="navav" aria-hidden="true">${avatarOk() ? Avatar.svg(avatar(), 24, "") : "🙂"}</span> ${esc(pseudo() || "Mon profil")}`; }
  async function titreChap(cle) { const [mid, cid] = cle.split("/"); const m = MATIERES.find(x => x.id === mid); if (!m) return cle === "philosophie/nature-justice" ? "Philosophie · La nature et la justice" : cle; try { return m.nom + " · " + (await chapitre(mid, cid)).titre; } catch (e) { return cle; } }
  async function collecterNotes() {
    const out = [];
    for (const m of MATIERES) for (const cid of await listeChapitres(m.id)) {
      let c; try { c = await chapitre(m.id, cid); } catch (e) { continue; }
      if (c.type === "presentation") continue;
      const titre = m.nom + " · " + c.titre, q = store.get(`qcm:${m.id}/${cid}`, null);
      if (q) out.push({ chap: titre, type: "QCM", note: q.s / q.n * 20 });
      let r = {}; try { r = JSON.parse(localStorage.getItem(`c:${m.id}/${cid}:myResults`) || "{}"); } catch (e) {}
      Object.keys(r).forEach(k => { const t = NOMS_TYPE[k] || (k.startsWith("trou-") ? "Texte à trous" : k.startsWith("carte-") ? "Carte mentale" : null); if (t) out.push({ chap: titre, type: t, note: Math.max(0, Math.max(r[k].best ?? r[k].s, r[k].s)) / (r[k].m || 20) * 20 }); });
    }
    let r = {}; try { r = JSON.parse(localStorage.getItem("myResults") || "{}"); } catch (e) {}
    Object.keys(r).forEach(k => { const t = k === "qcm" ? "QCM" : k.startsWith("etude-") ? "Étude de texte" : k.startsWith("trou-") ? "Texte à trous" : k.startsWith("carte-") ? "Carte mentale" : null; if (t && r[k].m) out.push({ chap: "Philosophie · La nature et la justice", type: t, note: Math.max(0, Math.max(r[k].best ?? r[k].s, r[k].s)) / r[k].m * 20 }); });
    return out;
  }
  async function listeErreurs() {
    const e = store.get("erreurs", {}), l = [];
    for (const cle of Object.keys(e)) { const t = await titreChap(cle); Object.keys(e[cle]).forEach(q => l.push({ chap: t, q, n: e[cle][q] })); }
    return l.sort((x, y) => y.n - x.n);
  }
  const b64 = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  async function pageProfil() {
    document.title = "Mon profil · " + (SITE ? SITE.titre : "Révisions");
    const premiere = !avatarOk();
    let cfg = avatarOk() ? { ...avatar() } : Avatar.defaut();
    const A = Avatar, sw = (cle, liste, nom) => `<fieldset class="optav"><legend>${nom}</legend><div class="rang">${liste.map((c, i) => `<button type="button" class="sw" data-k="${cle}" data-v="${i}" style="--sw:${c}" aria-label="${nom} ${i + 1}" aria-pressed="false"></button>`).join("")}</div></fieldset>`;
    const fm = (cle, liste, nom) => `<fieldset class="optav"><legend>${nom}</legend><div class="rang">${liste.map(v => `<button type="button" class="fm" data-k="${cle}" data-v="${v}" aria-pressed="false">${A.NOMS[v]}</button>`).join("")}</div></fieldset>`;
    main.innerHTML = `<div class="card profil"><h1>${premiere ? "Crée ton personnage" : "Mon profil"}</h1>
      <p class="mut">Ton personnage et ton pseudo restent <b>sur ton appareil</b>. Utilise un pseudo plutôt que ton nom complet.</p>
      <div class="creator"><div class="apercu" id="apercu" role="img" aria-live="polite"></div>
        <div class="opts">${sw("peau", A.PEAUX, "Peau")}${fm("coiffure", A.COIFFURES, "Coiffure")}${sw("cheveux", A.CHEVEUX, "Couleur des cheveux")}${fm("yeux", A.YEUX, "Yeux")}${fm("bouche", A.BOUCHES, "Bouche")}${sw("haut", A.HAUTS, "Couleur du haut")}${sw("fond", A.FONDS, "Fond")}
        <button type="button" class="btn alt sm" id="hasard">🎲 Au hasard</button></div></div>
      <label for="pPseudo">Prénom ou pseudo</label><input id="pPseudo" maxlength="30" value="${esc(pseudo())}" placeholder="Ex. : Léa T2">
      <button class="btn" id="pOk" type="button">${premiere ? "C'est parti !" : "Enregistrer"}</button> <span class="note" id="pMsg" aria-live="polite"></span></div>
      <div id="pNotes"></div>`;
    const maj = () => {
      main.querySelector("#apercu").innerHTML = A.svg(cfg, 168, "Aperçu de ton personnage");
      main.querySelectorAll(".sw,.fm").forEach(b => b.setAttribute("aria-pressed", String(cfg[b.dataset.k]) === b.dataset.v));
    };
    main.querySelector(".creator").addEventListener("click", e => { const b = e.target.closest(".sw,.fm"); if (!b) return; cfg[b.dataset.k] = (b.classList.contains("sw") ? +b.dataset.v : b.dataset.v); maj(); });
    main.querySelector("#hasard").onclick = () => { cfg = A.aleatoire(); maj(); };
    maj();
    main.querySelector("#pOk").onclick = () => {
      store.set("avatar", cfg); store.set("pseudo", main.querySelector("#pPseudo").value.trim()); majNavProfil();
      if (premiere) { location.hash = ""; return; }
      main.querySelector("#pMsg").textContent = "Enregistré ✔";
    };
    if (premiere) return;
    const box = main.querySelector("#pNotes"); box.innerHTML = `<div class="card"><p class="note">Chargement de tes notes…</p></div>`;
    const notes = await collecterNotes(), err = await listeErreurs(), envoye = store.get("envoi", 0);
    box.innerHTML = `<div class="card"><h2>Mes notes</h2>${notes.length ? `<table class="notes"><thead><tr><th>Chapitre</th><th>Épreuve</th><th>Meilleure note</th></tr></thead><tbody>${notes.map(n => `<tr><td>${esc(n.chap)}</td><td>${esc(n.type)}</td><td>${fmt1(n.note)}/20</td></tr>`).join("")}</tbody></table>` : `<p class="note">Pas encore de note : fais un QCM ou une étude de texte !</p>`}</div>
      <div class="card"><h2>Mes erreurs les plus fréquentes</h2>${err.length ? `<ol class="erreurs">${err.slice(0, 10).map(x => `<li><b>${x.n}×</b> ${esc(lisible(x.q))} <span class="note">(${esc(x.chap)})</span></li>`).join("")}</ol><p class="note">Revois ces points dans le cours avant de refaire le QCM.</p>` : `<p class="note">Aucune erreur enregistrée pour l'instant.</p>`}</div>
      <div class="card"><h2>Envoyer mes résultats à Kendji</h2>
        <p class="note">C'est <b>facultatif</b>. Si tu es d'accord, Kendji reçoit par e-mail (via le service FormSubmit) : ton pseudo, ton avatar, tes notes et la liste des questions que tu rates le plus. Il s'en sert pour t'aider à réviser, et les supprime à la fin de l'année scolaire ou plus tôt si tu le demandes. Voir les <a href="#mentions">mentions légales</a>.</p>
        <label class="rem"><input type="checkbox" id="pOui"> Je suis d'accord pour envoyer ces informations à Kendji.</label>
        <button class="btn" id="pEnvoi" type="button" disabled>Envoyer</button> <span class="note" id="pEnvMsg" aria-live="polite">${envoye ? "Dernier envoi : " + new Date(envoye).toLocaleString("fr-FR") : ""}</span></div>`;
    const oui = box.querySelector("#pOui"), bt = box.querySelector("#pEnvoi"), msg = box.querySelector("#pEnvMsg");
    oui.onchange = () => { bt.disabled = !oui.checked; };
    bt.onclick = async () => {
      if (!oui.checked) return;
      if (!pseudo()) { msg.textContent = "Ajoute d'abord un prénom ou un pseudo ci-dessus (puis Enregistrer)."; return; }
      bt.disabled = true; msg.textContent = "Envoi…";
      const nom = `${avTxt()} ${pseudo()}`, moy = notes.length ? notes.reduce((t, n) => t + n.note, 0) / notes.length : null;
      const corps = { _subject: `📚 Résultats 14.03.1879 — ${nom}${moy === null ? "" : " : moyenne " + fmt1(moy) + "/20"}`, _template: "table", _captcha: "false",
        "Élève": nom, "Moyenne des épreuves": moy === null ? "—" : fmt1(moy) + "/20",
        "Notes": notes.map(n => `• ${n.chap} — ${n.type} : ${fmt1(n.note)}/20`).join("\n") || "—",
        "Erreurs fréquentes": err.slice(0, 15).map(x => `• ${x.n}× ${lisible(x.q)} (${x.chap})`).join("\n") || "—",
        "DONNEES": "DONNEES:" + b64({ v: 1, p: pseudo(), a: avTxt(), n: notes.map(n => [n.chap, n.type, Math.round(n.note * 10) / 10]), e: err.slice(0, 30).map(x => [x.chap, lisible(x.q), x.n]) }),
        "Date": new Date().toLocaleString("fr-FR") };
      try {
        const r = await fetch(MAIL_URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(corps) });
        const j = await r.json().catch(() => ({}));
        if (r.ok && String(j.success) !== "false") { store.set("envoi", Date.now()); msg.textContent = "✔ Envoyé à Kendji. Merci !"; } else throw new Error("x");
      } catch (e) { msg.textContent = "L'envoi n'a pas marché (connexion ?). Réessaie."; bt.disabled = false; }
    };
  }

  /* ---------- Bilan de la classe (mode prof) : colle ici les e-mails reçus ---------- */
  function pageBilan() {
    document.title = "Bilan de la classe";
    main.innerHTML = `<div class="card"><h1>📊 Bilan de la classe</h1>
      <p class="mut">Colle ici le texte des e-mails reçus (un ou plusieurs, à la suite). Le site repère la ligne « DONNEES: » de chaque élève et calcule les erreurs les plus fréquentes. Rien n'est envoyé : tout se passe dans ton navigateur.</p>
      <textarea id="bIn" rows="8" style="width:100%" placeholder="Colle les e-mails ici…"></textarea><button class="btn" id="bGo" type="button">Calculer le bilan</button></div><div id="bOut"></div>`;
    main.querySelector("#bGo").onclick = () => {
      const eleves = {}; [...main.querySelector("#bIn").value.matchAll(/DONNEES:([A-Za-z0-9+/=]+)/g)].forEach(x => { try { const d = JSON.parse(decodeURIComponent(escape(atob(x[1])))); eleves[d.p + "|" + d.a] = d; } catch (e) {} });
      const L = Object.values(eleves), N = L.length, out = main.querySelector("#bOut");
      if (!N) { out.innerHTML = `<div class="card"><p class="lerr">Aucune donnée trouvée. Colle le texte complet des e-mails (la ligne « DONNEES: » doit y être).</p></div>`; return; }
      const err = {}; L.forEach(d => d.e.forEach(([c, q, n]) => { const k = c + "||" + q; (err[k] = err[k] || { c, q, n: 0, el: 0 }); err[k].n += n; err[k].el++; }));
      const top = Object.values(err).sort((a, b) => b.el - a.el || b.n - a.n).slice(0, 15);
      const parChap = {}; L.forEach(d => d.n.forEach(([c, t, n]) => { (parChap[c] = parChap[c] || []).push(n); }));
      const moyChap = Object.keys(parChap).map(c => ({ c, m: parChap[c].reduce((s, x) => s + x, 0) / parChap[c].length, n: parChap[c].length })).sort((a, b) => a.m - b.m);
      const bas = L.map(d => ({ p: d.a + " " + d.p, m: d.n.length ? d.n.reduce((s, x) => s + x[2], 0) / d.n.length : null })).filter(x => x.m !== null).sort((a, b) => a.m - b.m);
      out.innerHTML = `<div class="card"><h2>${N} élève${N > 1 ? "s" : ""} analysé${N > 1 ? "s" : ""}</h2>
        <h3>Erreurs les plus fréquentes</h3>${top.length ? `<table class="bilan"><thead><tr><th>Question ratée</th><th>Chapitre</th><th>Élèves concernés</th></tr></thead><tbody>${top.map(x => `<tr><td>${esc(lisible(x.q))}</td><td class="note">${esc(x.c)}</td><td><span class="barre"><i style="width:${Math.round(x.el / N * 100)}%"></i></span> <b>${x.el}/${N}</b> <span class="note">(${x.n}×)</span></td></tr>`).join("")}</tbody></table>` : "<p>Aucune erreur enregistrée.</p>"}
        <h3>Moyenne par chapitre (du plus faible au plus fort)</h3><ul>${moyChap.map(x => `<li>${esc(x.c)} : <b>${fmt1(x.m)}/20</b> (${x.n} note${x.n > 1 ? "s" : ""})</li>`).join("")}</ul>
        <h3>Élèves à accompagner en priorité</h3><ul>${bas.slice(0, 5).map(x => `<li>${esc(x.p)} : ${fmt1(x.m)}/20</li>`).join("")}</ul>
        <h3>Détail par élève</h3>${L.map(d => { const mo = d.n.length ? d.n.reduce((s, x) => s + x[2], 0) / d.n.length : null; return `<div class="eleve"><b>${esc(d.a)} ${esc(d.p)}</b> — moyenne ${mo === null ? "—" : fmt1(mo) + "/20"}<ul>${d.e.slice(0, 5).map(e => `<li>${e[2]}× ${esc(lisible(e[1]))} <span class="note">(${esc(e[0])})</span></li>`).join("") || "<li>Aucune erreur enregistrée.</li>"}</ul></div>`; }).join("")}</div>
        <p class="noprint"><button class="btn" id="bPdf" type="button">📄 Télécharger le rapport en PDF</button> <span class="note">Dans la fenêtre qui s'ouvre, choisis « Enregistrer au format PDF » comme imprimante.</span></p>`;
      out.insertAdjacentHTML("afterbegin", `<h1 class="onlyprint">Rapport de la classe — ${new Date().toLocaleDateString("fr-FR")}</h1>`);
      out.querySelector("#bPdf").onclick = () => window.print();
    };
  }

  /* ---------- Routeur ---------- */
  async function route() {
    window.papangue && papangue.stop();
    document.body.classList.remove("avec-fond"); ciel.stop();
    if (location.hash === "#prof" || location.hash === "#prof-off") { store.set("prof", location.hash === "#prof"); history.replaceState(null, "", location.pathname + "#"); }
    let [mid, cid, onglet] = decodeURIComponent(location.hash.slice(1)).split("/");
    try {
      if (!SITE) await chargerReglages();
      if (mid !== "mentions" && !connecte()) { pageConnexion(); return; }
      nav.hidden = false;
      if (!avatarOk() && mid !== "mentions" && mid !== "profil") { history.replaceState(null, "", "#profil"); mid = "profil"; cid = onglet = undefined; }
      majNavProfil();
      const m = MATIERES.find(x => x.id === mid);
      marquerNav(m ? m.id : mid ? "-" : "");
      if (m) document.body.dataset.matiere = m.id; else delete document.body.dataset.matiere;
      document.body.classList.toggle("sombre", !!m && ["maths", "physique-chimie", "svt"].includes(m.id));
      if (mid === "mentions") await pageMentions();
      else if (mid === "profil") await pageProfil();
      else if (mid === "bilan" && prof()) pageBilan();
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
