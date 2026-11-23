titre: La dérivation
niveau: Première
résumé: Nombre dérivé, tangente, fonctions dérivées usuelles et variations.
---
## Cours

### 1. Le nombre dérivé

Soit $f$ une fonction et $a$ un réel de son ensemble de définition. Le **taux d'accroissement** de $f$ entre $a$ et $a+h$ est :

$$\frac{f(a+h)-f(a)}{h}$$

Si ce quotient tend vers un nombre réel quand $h$ tend vers $0$, on dit que $f$ est **dérivable en $a$**. Ce nombre est le **nombre dérivé** de $f$ en $a$, noté $f'(a)$.

> 💡 $f'(a)$ est le **coefficient directeur de la tangente** à la courbe au point d'abscisse $a$.

### 2. Équation de la tangente

La tangente à la courbe de $f$ au point d'abscisse $a$ a pour équation :

$$y = f'(a)(x-a)+f(a)$$

### 3. Dérivées usuelles

| Fonction $f(x)$ | Dérivée $f'(x)$ |
|---|---|
| $k$ (constante) | $0$ |
| $x$ | $1$ |
| $x^2$ | $2x$ |
| $x^n$ | $nx^{n-1}$ |
| $\dfrac{1}{x}$ | $-\dfrac{1}{x^2}$ |
| $\sqrt{x}$ | $\dfrac{1}{2\sqrt{x}}$ |

### 4. Opérations

- $(u+v)' = u'+v'$
- $(ku)' = ku'$
- $(uv)' = u'v+uv'$
- $\left(\dfrac{u}{v}\right)' = \dfrac{u'v-uv'}{v^2}$

### 5. Dérivée et variations

- Si $f'(x) > 0$ sur un intervalle, $f$ est **croissante** sur cet intervalle.
- Si $f'(x) < 0$, $f$ est **décroissante**.
- Si $f'$ s'annule **en changeant de signe** en $a$, $f$ admet un **extremum** en $a$.

## Exercices

### Exercice 1 — Calculer des dérivées

Calcule la dérivée de chaque fonction :

1. $f(x) = 3x^2 - 5x + 2$
2. $g(x) = x^3 + \dfrac{1}{x}$

Correction :

1. $f'(x) = 3 \times 2x - 5 = 6x - 5$
2. $g'(x) = 3x^2 - \dfrac{1}{x^2}$

### Exercice 2 — Tangente

Soit $f(x) = x^2$. Donne l'équation de la tangente à la courbe au point d'abscisse $1$.

Correction :

$f(1) = 1$ et $f'(x) = 2x$ donc $f'(1) = 2$.
Équation : $y = 2(x-1) + 1$, soit $y = 2x - 1$.

### Exercice 3 — Variations

Étudie les variations de $f(x) = x^2 - 4x + 1$ sur $\mathbb{R}$.

Correction :

$f'(x) = 2x - 4$. $f'(x) > 0 \iff x > 2$.
Donc $f$ est décroissante sur $]-\infty\,;2]$ et croissante sur $[2\,;+\infty[$.
Minimum en $x = 2$ : $f(2) = 4 - 8 + 1 = -3$.

## QCM

? La dérivée de $x^2$ est :
- $x$
+ $2x$
- $2x^2$
> On applique $(x^n)' = nx^{n-1}$ avec $n = 2$.

? Le nombre dérivé $f'(a)$ est :
- l'ordonnée du point d'abscisse $a$
+ le coefficient directeur de la tangente en $a$
- l'abscisse du sommet
> C'est la pente de la tangente à la courbe au point d'abscisse $a$.

? Si $f'(x) < 0$ sur un intervalle, alors $f$ est :
- croissante
+ décroissante
- constante
> Une dérivée négative signifie que la fonction descend.

? La dérivée de $\dfrac{1}{x}$ est :
- $\dfrac{1}{x^2}$
+ $-\dfrac{1}{x^2}$
- $\ln x$
> Formule à connaître par cœur : $\left(\frac1x\right)' = -\frac{1}{x^2}$.

? L'équation de la tangente en $a$ est :
+ $y = f'(a)(x-a)+f(a)$
- $y = f(a)(x-a)+f'(a)$
- $y = f'(a)x + a$
> Retiens : « pente × (x − a) + hauteur ».

## Flashcards

Nombre dérivé $f'(a)$ :: Limite du taux d'accroissement quand $h \to 0$ ; pente de la tangente en $a$.
Équation de la tangente :: $y = f'(a)(x-a)+f(a)$
Dérivée de $x^n$ :: $nx^{n-1}$
Dérivée de $\sqrt{x}$ :: $\dfrac{1}{2\sqrt{x}}$
Dérivée d'un produit $uv$ :: $u'v + uv'$
Dérivée d'un quotient $\dfrac{u}{v}$ :: $\dfrac{u'v-uv'}{v^2}$
$f' > 0$ sur un intervalle :: $f$ est croissante sur cet intervalle
