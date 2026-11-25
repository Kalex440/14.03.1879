titre: Étude de fonction
niveau: Terminale
résumé: Domaine, limites, asymptotes, dérivée, variations, convexité et tangente : la méthode complète, avec l'exponentielle (sans logarithme).
---
## Cours

### 1. Le plan d'une étude de fonction

Pour étudier une fonction $f$, on suit presque toujours les mêmes étapes :

1. **Domaine** de définition : où $f(x)$ existe-t-elle ? (dénominateur non nul, racine d'un nombre positif…)
2. **Parité** et périodicité : $f$ est **paire** si $f(-x)=f(x)$ (courbe symétrique par rapport à l'axe des ordonnées), **impaire** si $f(-x)=-f(x)$ (symétrique par rapport à l'origine).
3. **Limites** aux bornes du domaine, et **asymptotes**.
4. **Dérivée** $f'$, son signe, puis le tableau de **variations**.
5. **Convexité** avec la dérivée seconde $f''$ et points d'**inflexion**.
6. **Tangente** en un point, puis tracé de la courbe.

> 💡 Réflexe : écris toujours le domaine en premier. Une étude sur un mauvais domaine est fausse dès la première ligne.

### 2. Limites et asymptotes

Limites à connaître : $\lim_{x\to+\infty}e^{x}=+\infty$ et $\lim_{x\to-\infty}e^{x}=0$.

**Croissances comparées** (l'exponentielle l'emporte sur toute puissance de $x$) :

$$\lim_{x\to+\infty}\frac{e^{x}}{x^{n}}=+\infty \qquad \lim_{x\to+\infty}x^{n}e^{-x}=0$$

Ce que les limites disent de la courbe :

- Si $\lim_{x\to\pm\infty}f(x)=\ell$, la droite $y=\ell$ est une **asymptote** horizontale.
- Si $\lim_{x\to a}f(x)=\pm\infty$, la droite $x=a$ est une asymptote verticale.
- Si $\lim_{x\to+\infty}\big(f(x)-(mx+p)\big)=0$, la droite $y=mx+p$ est une asymptote oblique.

### 3. Dérivée et variations

Formules de dérivation à connaître :

| Fonction | Dérivée |
|---|---|
| $u+v$ | $u'+v'$ |
| $uv$ | $u'v+uv'$ |
| $\dfrac{u}{v}$ | $\dfrac{u'v-uv'}{v^{2}}$ |
| $u^{n}$ | $n\,u'\,u^{n-1}$ |
| $e^{u}$ | $u'\,e^{u}$ |

Le lien entre le signe de $f'$ et les variations de $f$ est **le** résultat central :

- $f'\ge 0$ sur un intervalle $\Rightarrow$ $f$ est **croissante** sur cet intervalle ;
- $f'\le 0$ sur un intervalle $\Rightarrow$ $f$ est **décroissante** ;
- si $f'$ s'annule en changeant de signe en $a$, $f(a)$ est un **extremum** local (un **maximum** si $f'$ passe de $+$ à $-$, un **minimum** si elle passe de $-$ à $+$).

### 4. Convexité

La dérivée seconde $f''$ donne la forme de la courbe :

- $f''\ge 0$ : $f$ est **convexe**, la courbe est au-dessus de ses tangentes ;
- $f''\le 0$ : $f$ est **concave**, la courbe est en dessous de ses tangentes ;
- si $f''$ s'annule en changeant de signe en $a$, le point d'abscisse $a$ est un point d'**inflexion** : la courbe traverse sa tangente.

![Convexe : la courbe est au-dessus de ses tangentes ; concave : en dessous](images/etude-fonction-convexite.svg)

### 5. La tangente

Au point d'abscisse $a$, la **tangente** à la courbe a pour équation :

$$y=f'(a)\,(x-a)+f(a)$$

### 6. Exemple complet : $f(x)=x\,e^{-x}$

1. **Domaine** : $f$ est définie sur $\mathbb{R}$.
2. **Limites** : en $-\infty$, $x\to-\infty$ et $e^{-x}\to+\infty$, donc $\lim f=-\infty$. En $+\infty$, par croissances comparées, $\lim f=0$ : la droite $y=0$ est une **asymptote** horizontale.
3. **Dérivée** : $f'(x)=e^{-x}-x\,e^{-x}=(1-x)\,e^{-x}$. Comme $e^{-x}>0$, $f'(x)$ a le signe de $1-x$.
4. **Variations** : $f$ est croissante sur $]-\infty\,;1]$ et décroissante sur $[1\,;+\infty[$. Elle admet un **maximum** $f(1)=\dfrac{1}{e}$.

![Tableau de variations de f(x) = x e^(-x)](images/etude-fonction-variations.svg)

5. **Convexité** : $f''(x)=(x-2)\,e^{-x}$. Donc $f$ est concave sur $]-\infty\,;2]$, convexe sur $[2\,;+\infty[$, avec un point d'**inflexion** en $x=2$ : $f(2)=\dfrac{2}{e^{2}}$.
6. **Tangente en 0** : $f(0)=0$ et $f'(0)=1$, donc $y=x$.

![Courbe de f(x) = x e^(-x) avec son maximum, son point d'inflexion et sa tangente en 0](images/etude-fonction-courbe.svg)

### Sujets de bac

- « Étudier les variations de $f$ sur $\mathbb{R}$, dresser son tableau de variations. »
- « Déterminer les limites de $f$ aux bornes, en déduire les asymptotes. »
- « Démontrer que l'équation $f(x)=k$ admet une unique solution sur un intervalle » (théorème des valeurs intermédiaires + stricte monotonie).
- « Étudier la convexité de $f$ et déterminer ses points d'inflexion. »
- « Déterminer l'équation de la tangente en $a$ et étudier sa position par rapport à la courbe. »

> 💡 Rédaction type pour une solution unique : « $f$ est continue et strictement croissante sur $I$, $f(a)<k<f(b)$, donc d'après le théorème des valeurs intermédiaires l'équation $f(x)=k$ admet une unique solution sur $I$. »

## Exercices

### Exercice 1 — Variations d'un polynôme

Soit $f(x)=x^{3}-3x+1$ sur $\mathbb{R}$.

1. Calculer $f'(x)$ et étudier son signe.
2. Dresser le tableau de variations de $f$.
3. Combien l'équation $f(x)=0$ a-t-elle de solutions ?

Correction :

1. $f'(x)=3x^{2}-3=3(x-1)(x+1)$. Cette expression est positive pour $x<-1$ ou $x>1$, négative pour $-1<x<1$.
2. $f$ est croissante sur $]-\infty\,;-1]$, décroissante sur $[-1\,;1]$, croissante sur $[1\,;+\infty[$. On a $f(-1)=3$ (maximum local) et $f(1)=-1$ (minimum local). Les limites sont $-\infty$ en $-\infty$ et $+\infty$ en $+\infty$.
3. Sur $]-\infty\,;-1]$, $f$ va de $-\infty$ à $3$ : une solution. Sur $[-1\,;1]$, $f$ décroît de $3$ à $-1$ : une solution. Sur $[1\,;+\infty[$, $f$ croît de $-1$ à $+\infty$ : une solution. **L'équation a 3 solutions** (théorème des valeurs intermédiaires sur chaque intervalle, $f$ étant continue et strictement monotone).

### Exercice 2 — Fonction rationnelle et asymptotes

Soit $g(x)=\dfrac{2x+1}{x-1}$.

1. Donner le domaine de définition de $g$.
2. Calculer les limites de $g$ en $+\infty$, en $-\infty$ et en $1$. Quelles asymptotes ?
3. Calculer $g'(x)$ et en déduire le sens de variation.

Correction :

1. $g$ est définie pour $x\neq 1$ : $\mathbb{R}\setminus\{1\}$.
2. En $\pm\infty$, $g(x)=\dfrac{2+1/x}{1-1/x}\to 2$ : asymptote horizontale $y=2$. En $1^{-}$, le numérateur tend vers $3$ et le dénominateur vers $0^{-}$ : $\lim g=-\infty$. En $1^{+}$ : $\lim g=+\infty$. Asymptote verticale $x=1$.
3. $g'(x)=\dfrac{2(x-1)-(2x+1)}{(x-1)^{2}}=\dfrac{-3}{(x-1)^{2}}<0$. $g$ est strictement décroissante sur $]-\infty\,;1[$ et sur $]1\,;+\infty[$.

### Exercice 3 — Avec l'exponentielle

Soit $h(x)=(x+1)\,e^{-x}$ sur $\mathbb{R}$.

1. Montrer que $h'(x)=-x\,e^{-x}$.
2. En déduire les variations de $h$ et son extremum.
3. Étudier la limite de $h$ en $+\infty$.

Correction :

1. $h'(x)=e^{-x}+(x+1)(-e^{-x})=e^{-x}(1-x-1)=-x\,e^{-x}$.
2. Comme $e^{-x}>0$, $h'(x)$ a le signe de $-x$ : $h$ est croissante sur $]-\infty\,;0]$, décroissante sur $[0\,;+\infty[$. **Maximum** : $h(0)=1$.
3. $h(x)=x\,e^{-x}+e^{-x}$. Par croissances comparées, $x\,e^{-x}\to 0$, et $e^{-x}\to 0$. Donc $\lim_{x\to+\infty}h(x)=0$ : asymptote $y=0$.

### Exercice 4 — Convexité

Soit $k(x)=x^{4}-2x^{2}$.

1. Calculer $k''(x)$.
2. Étudier la convexité de $k$ et donner ses points d'inflexion.

Correction :

1. $k'(x)=4x^{3}-4x$ et $k''(x)=12x^{2}-4$.
2. $k''(x)=0\iff x^{2}=\dfrac13\iff x=\pm\dfrac{1}{\sqrt3}$. $k''>0$ pour $|x|>\dfrac1{\sqrt3}$ : $k$ est convexe sur $]-\infty\,;-\tfrac1{\sqrt3}]$ et sur $[\tfrac1{\sqrt3}\,;+\infty[$, concave entre les deux. $k''$ change de signe en $\pm\dfrac1{\sqrt3}$ : **deux points d'inflexion**.

## Textes à trous

### Le plan d'étude

Pour étudier une fonction, on commence par son [[domaine]] de définition, puis on calcule les [[limites]] aux bornes. On dérive ensuite : si $f'\ge 0$, la fonction est [[croissante]] ; si $f'\le 0$, elle est [[décroissante]]. Quand $f'$ s'annule en changeant de signe, on obtient un [[extremum]].

### Convexité et tangente

La dérivée seconde $f''$ donne la convexité : si $f''\ge 0$ la fonction est [[convexe]] et la courbe est au-dessus de ses [[tangentes]]. Quand $f''$ change de signe, on a un point d'[[inflexion]]. Si $\lim_{x\to+\infty}f(x)=\ell$, la droite $y=\ell$ est une [[asymptote]] horizontale.

## QCM

? Quelle est la dérivée de $f(x)=x\,e^{x}$ ?
- $e^{x}$
+ $(x+1)\,e^{x}$
- $x\,e^{x}$
- $(x-1)\,e^{x}$
> Dérivée d'un produit : $f'=1\cdot e^{x}+x\cdot e^{x}=(x+1)e^{x}$.

? Si $f'(x)<0$ sur $[a\,;b]$, alors $f$ est :
- croissante sur $[a\,;b]$
+ décroissante sur $[a\,;b]$
- constante sur $[a\,;b]$
- convexe sur $[a\,;b]$
> Le signe de la dérivée donne le sens de variation.

? $\displaystyle\lim_{x\to+\infty}x\,e^{-x}$ vaut :
- $+\infty$
- $1$
+ $0$
- $-\infty$
> Croissances comparées : l'exponentielle l'emporte sur $x$.

? Si $\displaystyle\lim_{x\to+\infty}f(x)=3$, la courbe admet :
- une asymptote verticale $x=3$
+ une asymptote horizontale $y=3$
- une tangente horizontale en $3$
- un maximum égal à $3$
> Une limite finie en $+\infty$ donne une asymptote horizontale.

? Pour $f(x)=\dfrac{1}{x-2}$, la droite $x=2$ est :
- une asymptote horizontale
+ une asymptote verticale
- une tangente
- un axe de symétrie
> $f(x)\to\pm\infty$ quand $x\to 2$ : asymptote verticale.

? La tangente à la courbe de $f$ au point d'abscisse $a$ a pour équation :
- $y=f(a)(x-a)+f'(a)$
+ $y=f'(a)(x-a)+f(a)$
- $y=f'(x)(a-x)+f(a)$
- $y=f(x)+f'(a)$
> Pente $f'(a)$, passage par le point $(a\,;f(a))$.

? Si $f''\ge 0$ sur un intervalle, $f$ est :
- concave
+ convexe
- décroissante
- paire
> $f''\ge 0$ : convexe, la courbe est au-dessus de ses tangentes.

? Si $f''$ s'annule en changeant de signe en $a$, le point d'abscisse $a$ est :
- un maximum
- un minimum
+ un point d'inflexion
- une asymptote
> La courbe change de convexité : c'est un point d'inflexion.

? Une fonction $f$ est paire si :
- $f(-x)=-f(x)$
+ $f(-x)=f(x)$
- $f(x+T)=f(x)$
- $f'(x)=0$
> La courbe est symétrique par rapport à l'axe des ordonnées.

? La dérivée de $e^{2x}$ est :
- $e^{2x}$
+ $2\,e^{2x}$
- $2x\,e^{2x}$
- $e^{2}$
> $(e^{u})'=u'e^{u}$ avec $u=2x$, $u'=2$.

? Pour montrer que $f(x)=k$ a une unique solution sur $I$, on utilise :
- le théorème de Pythagore
+ le théorème des valeurs intermédiaires et la stricte monotonie
- seulement la parité
- seulement la limite en $+\infty$
> $f$ continue et strictement monotone sur $I$, avec $k$ entre les valeurs aux bornes.

? Si $f'$ passe de $+$ à $-$ en $a$, alors $f(a)$ est :
- un minimum local
+ un maximum local
- un point d'inflexion
- une asymptote
> $f$ croît puis décroît : maximum local.

## Flashcards

Domaine de définition :: Ensemble des réels $x$ pour lesquels $f(x)$ existe (dénominateur non nul, etc.).
Fonction paire :: $f(-x)=f(x)$ ; courbe symétrique par rapport à l'axe des ordonnées.
Fonction impaire :: $f(-x)=-f(x)$ ; courbe symétrique par rapport à l'origine.
Asymptote horizontale :: Droite $y=\ell$ quand $\lim_{x\to\pm\infty}f(x)=\ell$.
Asymptote verticale :: Droite $x=a$ quand $\lim_{x\to a}f(x)=\pm\infty$.
Croissances comparées :: $\dfrac{e^{x}}{x^{n}}\to+\infty$ et $x^{n}e^{-x}\to0$ en $+\infty$.
Signe de $f'$ et variations :: $f'\ge0$ : croissante ; $f'\le0$ : décroissante.
Extremum local :: $f'$ s'annule en changeant de signe : maximum ($+$ puis $-$) ou minimum ($-$ puis $+$).
Dérivée d'un produit :: $(uv)'=u'v+uv'$.
Dérivée d'un quotient :: $\left(\dfrac uv\right)'=\dfrac{u'v-uv'}{v^{2}}$.
Dérivée de $e^{u}$ :: $(e^{u})'=u'\,e^{u}$.
Fonction convexe :: $f''\ge0$ ; la courbe est au-dessus de ses tangentes.
Point d'inflexion :: $f''$ change de signe ; la courbe traverse sa tangente.
Équation de la tangente :: $y=f'(a)(x-a)+f(a)$.
Théorème des valeurs intermédiaires :: $f$ continue sur $[a\,;b]$ : elle prend toute valeur entre $f(a)$ et $f(b)$. Si de plus elle est strictement monotone, la solution est unique.
