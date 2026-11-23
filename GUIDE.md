# Guide : alimenter et modifier le site

Tout le contenu du site est dans le dossier **`contenu/`**. Ce sont de simples fichiers texte : tu n'as jamais besoin de toucher au code (`app.js`, `style.css`, `index.html`).

```
contenu/
├── accueil.md            ← titre du site et texte d'accueil
├── matieres.txt          ← les 4 matières (nom, icône, couleur)
├── mentions-legales.md   ← mentions légales et confidentialité
├── MODELE-chapitre.md    ← modèle à copier pour un nouveau chapitre
├── images/               ← tes images et schémas
├── maths/
│   ├── chapitres.txt     ← la liste des chapitres, dans l'ordre
│   └── derivation.md     ← un chapitre
├── physique-chimie/
├── philosophie/
└── svt/
```

---

## 1. Modifier un fichier directement sur GitHub (le plus simple)

1. Va sur ton dépôt GitHub, ouvre le dossier `contenu/`, puis le fichier.
2. Clique sur le **crayon ✏️** en haut à droite du fichier.
3. Modifie le texte.
4. Clique sur **Commit changes…** puis encore **Commit changes**.
5. Attends 1 à 2 minutes, puis recharge le site : c'est en ligne.

Pour **créer** un fichier : dans le dossier voulu, clique sur **Add file → Create new file**, et tape son nom (par exemple `suites.md`).

---

## 2. Ajouter un chapitre (en 3 étapes)

**Étape 1 : crée le fichier du chapitre.**
Dans le dossier de la matière (par exemple `contenu/maths/`), crée un fichier `suites.md`. Copie dedans tout le contenu de `contenu/MODELE-chapitre.md`, puis remplace le texte par le tien.

Règles pour le nom du fichier : en minuscules, sans espace ni accent, avec des tirets. Exemple : `suites-numeriques.md`, pas `Suites Numériques.md`.

**Étape 2 : ajoute-le à la liste.**
Ouvre `contenu/maths/chapitres.txt` et ajoute une ligne avec le nom du fichier, **sans** `.md` :

```
derivation
suites-numeriques
```

L'ordre des lignes est l'ordre d'affichage sur le site.

**Étape 3 : enregistre (Commit changes).** C'est tout !

---

## 3. Écrire un chapitre

Un chapitre commence par 3 lignes d'informations, puis une ligne `---` :

```
titre: Les suites numériques
niveau: Première
résumé: Suites arithmétiques et géométriques.
---
```

Ensuite, il a jusqu'à 4 parties, chacune annoncée par `## ` (deux dièses et un espace). Elles deviennent les onglets du chapitre. Tu n'es pas obligé de les mettre toutes : une partie absente n'apparaît pas.

### 📖 `## Cours`

Du texte normal, avec ces raccourcis :

| Tu écris | Ça donne |
|---|---|
| `### Mon titre` | un sous-titre |
| `**important**` | **important** |
| `*italique*` | *italique* |
| `- un point` | une liste à puces |
| `1. un point` | une liste numérotée |
| `> 💡 À retenir` | un encadré jaune |
| `[le texte](https://...)` | un lien |
| `![description](images/schema.png)` | une image |

Laisse une **ligne vide** entre deux paragraphes.

**Formules (maths, physique, chimie)** : entoure-les de `$` pour une formule dans la phrase, de `$$` pour une formule centrée.

| Tu écris | Ça donne |
|---|---|
| `$x^2$` | x au carré |
| `$x_n$` | x indice n |
| `$\frac{a}{b}$` | a sur b (fraction) |
| `$\sqrt{x}$` | racine de x |
| `$\times$` | × |
| `$\text{H}_2\text{O}$` | H₂O |
| `$6{,}02 \times 10^{23}$` | 6,02 × 10²³ (la virgule française s'écrit `{,}`) |
| `$\Delta$`, `$\alpha$`, `$\pi$` | lettres grecques |

**Tableaux** :

```
| Fonction | Dérivée |
|---|---|
| $x^2$ | $2x$ |
```

### ✏️ `## Exercices`

Chaque exercice commence par `### ` suivi de son titre. Écris l'énoncé, puis une ligne `Correction :` toute seule, puis la correction. Les élèves cliquent sur « Voir la correction » pour la faire apparaître.

```
### Exercice 1 — Calculer une dérivée

Calcule la dérivée de $f(x) = 3x^2$.

Correction :

$f'(x) = 6x$.
```

### ✅ `## QCM`

- `?` au début de la ligne : la question
- `+` : la (ou les) bonne(s) réponse(s)
- `-` : une mauvaise réponse
- `>` : l'explication, affichée après la réponse (facultatif)

Laisse une ligne vide entre deux questions. Les réponses sont mélangées automatiquement sur le site.

```
? Combien vaut $2 + 2$ ?
- 3
+ 4
- 5
> C'est le calcul de base !
```

Le site garde le meilleur score de chaque élève, sur son propre téléphone.

### 🃏 `## Flashcards`

Une carte par ligne : le recto, deux deux-points `::`, puis le verso.

```
Mole :: Paquet de $6{,}02 \times 10^{23}$ entités
Allèle :: Une version d'un gène
```

---

## 4. Ajouter une image

1. Dans `contenu/images/`, clique sur **Add file → Upload files** et dépose ton image (nom en minuscules, sans espace : `cellule.png`). Garde-la légère (moins de 300 Ko si possible).
2. Dans ton chapitre, écris : `![Schéma d'une cellule animale](images/cellule.png)`

Le texte entre crochets est **obligatoire** : il est lu aux élèves malvoyants. Décris ce que montre l'image. N'utilise que des images que tu as faites toi-même, ou libres de droits (par exemple sur Wikimedia Commons, en notant l'auteur).

---

## 5. Modifier l'accueil, les matières, les couleurs

- **Titre du site et texte d'accueil** : `contenu/accueil.md`.
- **Image de fond de l'accueil** : dans `contenu/accueil.md`, la ligne `fond: images/fond-accueil.webp`. Pour la changer, dépose une nouvelle image dans `contenu/images/` et mets son nom sur cette ligne. Pour ne plus avoir d'image, supprime la ligne. Choisis une image sombre et légère (moins de 300 Ko).
- **Matières** : `contenu/matieres.txt`, une ligne par matière :

  ```
  maths | Maths | 📐 | #1f63d6 | Fonctions, suites, probabilités, géométrie
  ```
  Dans l'ordre : le nom du dossier, le nom affiché, l'icône (un emoji), la couleur, la description.
  Pour **ajouter une matière** (par exemple l'anglais) : ajoute une ligne `anglais | Anglais | 🇬🇧 | #b02a5b | Grammaire et vocabulaire`, puis crée le dossier `contenu/anglais/` avec un fichier `chapitres.txt`.
- **Couleurs** : choisis des couleurs **foncées** (le texte de la matière s'écrit dans cette couleur sur fond blanc, il doit rester lisible). Tu peux vérifier sur [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/) : il faut au moins 4,5:1.

---

### Une affiche en haut d'une matière

Crée un fichier `presentation.md` dans le dossier de la matière (par exemple `contenu/maths/presentation.md`). Son contenu s'affiche dans un cadre, en haut de la page de la matière. Le texte entre `~~` est barré, celui entre `**` est en couleur. Supprime le fichier pour enlever l'affiche.

## 6. En cas de problème

- **Le site affiche « Oups »** : un fichier est introuvable. Vérifie l'orthographe dans `chapitres.txt` (sans `.md`, sans espace, sans accent).
- **Un chapitre affiche une alerte ⚠️** : son nom dans `chapitres.txt` ne correspond à aucun fichier.
- **Une formule s'affiche en rouge** : il y a une faute dans la formule (souvent une accolade `{` non fermée).
- **Une question du QCM n'apparaît pas** : il lui manque une bonne réponse `+`, ou elle a moins de 2 réponses.
- **Ma modification n'apparaît pas** : attends 2 minutes et recharge la page (sur téléphone, ferme et rouvre l'onglet).
- **Ouvrir `index.html` en double-cliquant dessus sur ton ordinateur ne marche pas** : c'est normal, le site doit être ouvert depuis son adresse en ligne.

Et tu peux toujours me demander : « ajoute un chapitre sur … en SVT », je te prépare le fichier.

---

## 7. Mentions légales

Elles sont dans `contenu/mentions-legales.md` (éditeur : Kendji, contact au lycée). Si tu veux ajouter une adresse e-mail de contact, utilise plutôt une adresse dédiée au site que ton adresse personnelle.

## 8. Connexion

Le site demande un identifiant et un mot de passe (ceux que tu m'as donnés le 23 novembre 2026). Pour les changer, demande-moi : je calcule la nouvelle « empreinte » et je la remplace dans `app.js` (ligne `LOGIN_HASH`). Attention : c'est un simple cadenas pour éviter les visiteurs de passage. Le dépôt GitHub étant public, les fichiers du dossier `contenu/` restent lisibles par quelqu'un qui les cherche ; n'y mets donc rien de confidentiel (pas de notes ni de noms d'élèves).

## 9. Si les élèves voient une ancienne version

Les navigateurs gardent le site en mémoire jusqu'à 10 minutes. Le contenu (`contenu/`) se met à jour tout seul. Si un jour on modifie `style.css` ou `app.js`, on change le numéro `?v=...` dans `index.html` pour forcer la mise à jour.
