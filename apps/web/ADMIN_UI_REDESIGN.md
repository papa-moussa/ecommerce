# Guidelines de Design - Admin Console (Maison Parfum)

Ce document décrit les choix de conception et les principes mis en œuvre lors de la refonte "Notion-like" de la console d'administration de Maison Parfum. L'objectif était de passer d'un design typé "e-commerce de luxe" (trop contrasté, omniprésence de teintes or/ivoire) à une interface sobre, professionnelle et axée sur la productivité.

## 1. Philosophie et Principes Fondamentaux

- **Sobriété et Discrétion** : L'interface d'administration n'est pas une vitrine client. Elle doit se faire oublier au profit de la donnée (produits, commandes, KPI).
- **Notion-like Aesthetic** : Espacements aérés, bordures fines, ombres douces et typographies hautement lisibles (principalement sans-serif).
- **Densité d'Information** : Les données doivent être faciles à lire, en particulier les tableaux et statistiques. Les espacements ont été optimisés pour afficher beaucoup d'informations de manière claire.

## 2. Palette de Couleurs (Design Tokens)

La palette de base a été mise à jour dans `tailwind.config.ts` pour introduire des teintes `notion-*` en complément (ou remplacement) des teintes `brand-*` :

- **`notion.bg` (#ffffff)** : Fond principal des pages (propre et neutre).
- **`notion.sidebar` (#f7f7f5)** : Fond de la barre de navigation latérale, apportant une délimitation subtile avec la zone de contenu.
- **`notion.hover` (#efefed)** : État actif/survol des lignes de tableau, boutons, éléments de navigation.
- **`notion.border` (#e5e5e5)** : Bordures fines (1px) pour encadrer les composants sans alourdir le visuel.
- **`notion.text` (#37352f)** : Couleur principale du texte.
- **`notion.textSecondary` (#9a9a97)** : Utilisé pour les timestamps, labels, sous-titres et métadonnées.

## 3. Typographie

- **Font Principale** : Remplacement quasi total de la typographie Serif (précédemment utilisée pour donner un aspect luxe) par une police Sans-Serif moderne (Inter ou équivalent système).
- **Poids** : Utilisation de `font-medium` et `font-semibold` plutôt que `font-bold` massif.
- **Styles** : Les labels administratifs et les métadonnées utilisent souvent des textes plus petits (`text-xs`), parfois en majuscules avec un tracking très léger, pour structurer l'information sans surcharger.

## 4. Composants Clés Refondus

### A. Layout & Navigation (`admin/layout.tsx`)
- Sidebar affinée et modernisée avec fond `notion-sidebar`.
- Suppression des gros blocs noirs massifs pour la navigation active ; utilisation de `bg-notion-hover` et de texte `notion-text`.
- La hiérarchie visuelle repose sur le contraste entre la sidebar grise et la page de contenu blanche.

### B. Dashboard (`admin/page.tsx`)
- **Cartes de Statistiques (`StatCard`)** : Retrait des dégradés et gros contours. Design flat avec fond transparent ou très léger, valeur mise en avant et petite icône discrète.
- **Graphiques (Recharts)** : Suppression des axes lourds (axes transparents), passage des barres/courbes en couleurs neutres (`#37352f` ou `#9a9a97`), suppression des bordures de conteneurs.
- **Tableau Top Produits** : Les lignes alternées ou au survol utilisent un gris très clair, les séparateurs sont de 1px.

### C. Data Tables (`_components/data-table.tsx`)
- Bordures très fines pour l'entête (`border-notion-border`).
- Headers de colonnes avec fond subtil `bg-notion-hover/30`.
- Pagination modernisée : petits boutons carrés à bordures très fines, états "disabled" subtils.

### D. Modales
- Suppression des gros filtres `backdrop-blur` lourds et des énormes ombres portées.
- Remplacement par des ombres moyennes (`shadow-xl`) et des fonds blancs purs. Les modales de modification de produit ont été particulièrement allégées (suppression du style "carte luxueuse").

## 5. Bonnes Pratiques pour les Nouveaux Composants

Lors de la création de nouveaux composants ou pages pour cette interface admin :
1. **Privilégier le blanc et les gris** : N'utilisez des couleurs saturées (Rouge, Vert, Ambre) QUE pour des statuts (Erreur, Succès, Avertissement) ou des badges (Stock, Statut Commande).
2. **Utiliser des bordures subtiles** : Utilisez `border border-notion-border` plutôt que de grandes ombres.
3. **Paddings généreux** : Gardez au minimum `p-4` ou `p-6` sur les conteneurs (cartes, modales) pour laisser respirer l'interface.
4. **Éviter les polices Serif** : Réservez-les exclusivement au côté client (Storefront) pour la narration de la marque. La console d'administration doit rester un outil.
