/* Créateur d'avatar : personnages ronds dessinés en SVG (dessins originaux, aucune image externe).
   Un avatar = un petit objet {peau, cheveux, coiffure, yeux, bouche, haut, fond} gardé dans le navigateur de l'élève. */
window.Avatar = (function () {
  const PEAUX = ["#ffe0c7", "#f6c9a0", "#e0a678", "#c58459", "#8d5a3b", "#5b3a29"];
  const CHEVEUX = ["#2b2118", "#5a3b22", "#a8652a", "#e3b448", "#c4452f", "#7a4bd1", "#2f7fd6", "#dcdcdc"];
  const HAUTS = ["#1f63d6", "#e2453c", "#2e8a3e", "#ffc634", "#7a4bd1", "#ff7eb6", "#13a5a5", "#2b2f45"];
  const FONDS = ["#dcebff", "#ffe8c7", "#e1f5d8", "#f1e1ff", "#ffe0e6", "#e0f7f7", "#fff6bf", "#e8e8ee"];
  const COIFFURES = ["court", "long", "boucle", "queue", "crete", "chignon", "frange"];
  const YEUX = ["ronds", "joyeux", "endormis", "etonnes", "lunettes"];
  const BOUCHES = ["sourire", "grand", "neutre", "surpris"];
  const NOMS = { court: "Courts", long: "Longs", boucle: "Bouclés", queue: "Queue de cheval", crete: "Crête", chignon: "Chignon", frange: "Frange", ronds: "Yeux ronds", joyeux: "Yeux joyeux", endormis: "Yeux endormis", etonnes: "Yeux étonnés", lunettes: "Lunettes", sourire: "Sourire", grand: "Grand sourire", neutre: "Neutre", surpris: "Surpris" };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const defaut = () => ({ peau: 1, cheveux: 1, coiffure: "court", yeux: "ronds", bouche: "sourire", haut: 0, fond: 0 });
  const aleatoire = () => ({ peau: Math.floor(Math.random() * PEAUX.length), cheveux: Math.floor(Math.random() * CHEVEUX.length), coiffure: pick(COIFFURES), yeux: pick(YEUX), bouche: pick(BOUCHES), haut: Math.floor(Math.random() * HAUTS.length), fond: Math.floor(Math.random() * FONDS.length) });
  /* anciens avatars : la coiffure « chauve » n'existe plus, elle devient « courts » */
  const normalise = c => (c && typeof c === "object" && c.coiffure === "chauve") ? { ...c, coiffure: "court" } : c;
  const valide = c => !!c && typeof c === "object" && PEAUX[c.peau] && CHEVEUX[c.cheveux] && COIFFURES.includes(c.coiffure) && YEUX.includes(c.yeux) && BOUCHES.includes(c.bouche) && HAUTS[c.haut] && FONDS[c.fond];
  const sombre = hex => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.round(v * 0.82)); return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, "0")).join(""); };

  function cheveuxArriere(s, h) {
    if (s === "long") return `<path d="M24 56C19 100 27 112 40 112H80C93 112 101 100 96 56Z" fill="${h}"/>`;
    if (s === "queue") return `<ellipse cx="100" cy="74" rx="9" ry="19" transform="rotate(-18 100 74)" fill="${h}"/>`;
    return "";
  }
  function cheveuxAvant(s, h) {
    const calotte = `<path d="M26 54C25 27 43 17 60 17C77 17 95 27 94 54C86 42 74 37 60 37C46 37 34 42 26 54Z" fill="${h}"/>`;
    switch (s) {
      case "court": case "long": case "queue": return calotte;
      case "chignon": return calotte + `<circle cx="60" cy="13" r="12" fill="${h}"/>`;
      case "frange": return `<path d="M25 58C22 24 98 24 95 58C86 46 76 47 68 40C58 50 40 46 25 58Z" fill="${h}"/>`;
      case "boucle": return [[33, 38], [47, 26], [61, 22], [75, 26], [88, 38], [27, 54], [93, 54]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="12" fill="${h}"/>`).join("");
      case "crete": return `<path d="M60 4L72 32L60 27L48 32Z" fill="${h}"/>`;
      default: return "";
    }
  }
  function yeux(t) {
    const f = "#25201c";
    if (t === "ronds") return `<circle cx="46" cy="58" r="4.2" fill="${f}"/><circle cx="74" cy="58" r="4.2" fill="${f}"/><circle cx="47.4" cy="56.6" r="1.3" fill="#fff"/><circle cx="75.4" cy="56.6" r="1.3" fill="#fff"/>`;
    if (t === "joyeux") return `<path d="M40 59Q46 50 52 59M68 59Q74 50 80 59" fill="none" stroke="${f}" stroke-width="3.4" stroke-linecap="round"/>`;
    if (t === "endormis") return `<path d="M40 58H52M68 58H80" stroke="${f}" stroke-width="3.4" stroke-linecap="round"/>`;
    if (t === "etonnes") return `<circle cx="46" cy="58" r="6.5" fill="#fff" stroke="${f}" stroke-width="1.6"/><circle cx="74" cy="58" r="6.5" fill="#fff" stroke="${f}" stroke-width="1.6"/><circle cx="46" cy="58" r="2.8" fill="${f}"/><circle cx="74" cy="58" r="2.8" fill="${f}"/>`;
    return `<circle cx="46" cy="58" r="10" fill="#fff" fill-opacity=".35" stroke="${f}" stroke-width="2.4"/><circle cx="74" cy="58" r="10" fill="#fff" fill-opacity=".35" stroke="${f}" stroke-width="2.4"/><path d="M56 57Q60 54 64 57" fill="none" stroke="${f}" stroke-width="2.4"/><circle cx="46" cy="58" r="3.2" fill="${f}"/><circle cx="74" cy="58" r="3.2" fill="${f}"/>`;
  }
  function bouche(t) {
    const f = "#25201c";
    if (t === "sourire") return `<path d="M49 77Q60 88 71 77" fill="none" stroke="${f}" stroke-width="3.2" stroke-linecap="round"/>`;
    if (t === "grand") return `<path d="M47 75Q60 96 73 75Z" fill="#7a2230" stroke="${f}" stroke-width="2.4" stroke-linejoin="round"/><path d="M52 77H68" stroke="#fff" stroke-width="3"/>`;
    if (t === "neutre") return `<path d="M51 80H69" stroke="${f}" stroke-width="3.2" stroke-linecap="round"/>`;
    return `<ellipse cx="60" cy="80" rx="5" ry="6" fill="#7a2230" stroke="${f}" stroke-width="2.2"/>`;
  }
  /* svg(cfg, taille en px, titre accessible) */
  function svg(cfg, taille, titre) {
    const c = valide(normalise(cfg)) ? normalise(cfg) : defaut(), p = PEAUX[c.peau], h = CHEVEUX[c.cheveux], t = HAUTS[c.haut], fd = FONDS[c.fond];
    const id = "av" + Math.random().toString(36).slice(2, 7);
    return `<svg class="avsvg" viewBox="0 0 120 140" width="${taille || 96}" height="${Math.round((taille || 96) * 140 / 120)}" role="img" aria-label="${titre || "Avatar"}" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="${id}"><rect x="0" y="0" width="120" height="140" rx="26"/></clipPath></defs>
      <g clip-path="url(#${id})"><rect width="120" height="140" fill="${fd}"/>
      ${cheveuxArriere(c.coiffure, h)}
      <path d="M14 150C14 112 38 100 60 100C82 100 106 112 106 150Z" fill="${t}"/>
      <path d="M48 100Q60 114 72 100" fill="none" stroke="${sombre(t)}" stroke-width="3" stroke-linecap="round"/>
      <rect x="51" y="84" width="18" height="20" rx="8" fill="${sombre(p)}"/>
      <circle cx="25" cy="62" r="6.5" fill="${p}"/><circle cx="95" cy="62" r="6.5" fill="${p}"/>
      <ellipse cx="60" cy="58" rx="34" ry="37" fill="${p}"/>
      <circle cx="39" cy="71" r="6" fill="#ff7a8a" fill-opacity=".3"/><circle cx="81" cy="71" r="6" fill="#ff7a8a" fill-opacity=".3"/>
      ${cheveuxAvant(c.coiffure, h)}${yeux(c.yeux)}${bouche(c.bouche)}</g></svg>`;
  }
  return { PEAUX, CHEVEUX, HAUTS, FONDS, COIFFURES, YEUX, BOUCHES, NOMS, defaut, aleatoire, valide, normalise, svg };
})();
