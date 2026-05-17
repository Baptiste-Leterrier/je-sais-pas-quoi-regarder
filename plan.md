Phase 1 : Préparation et Choix Techniques
Front-end : HTML/CSS/JavaScript classique (Vanilla JS) ou un framework léger comme React, Vue.js ou Svelte. Si tu veux générer un site statique propre pour GitHub Pages, Vite.js est l'outil de build idéal.

Données : API TMDB (The Movie Database).

Stockage temporaire : LocalStorage du navigateur (pour garder la liste des films sélectionnés si le couple ferme la page par erreur).

Statistiques : Google Analytics ou Plausible Analytics (qui est plus respectueux de la vie privée et très facile à intégrer sur un site statique).

Phase 2 : Configuration Initiale
Création du dépôt : Crée un repo sur GitHub (ex: movie-match-couple).

Clés API : * Crée un compte développeur sur TMDB et génère une clé API gratuite.

Crée un compte sur ton outil d'analytics et récupère le script de suivi.

Initialisation du projet : Mets en place ton environnement de base (ton fichier index.html, tes styles, et ton fichier principal app.js).

Phase 3 : Développement du Core (Les 3 modes)
Étape 1 : Le module de recherche (La "Sélection")
C'est l'étape où le couple prépare sa liste de candidats.

Interface : Une barre de recherche.

Logique : 1.  Appel à l'endpoint search/multi de TMDB quand l'utilisateur tape un titre.
2.  Affichage des résultats sous forme de cartes (Affiche + Titre + Année).
3.  Un bouton "Ajouter à notre liste".
4.  Affichage de la liste actuelle (le "panier" de films/séries).

Bouton d'action : Un bouton "C'est parti !" qui lance le mini-jeu une fois qu'ils ont sélectionné assez de films (idéalement un nombre pair : 4, 8, 16...).

Étape 2 : Le Mini-Jeu de Comparaison (Mode Tournoi)
C'est le cœur de ton application. Au lieu d'afficher une liste ennuyeuse, tu transformes le choix en duels.

Logique de l'algorithme (Arbre de tournoi) :

Mélanger la liste (Randomize) pour que ce soit impartial.

Prendre les deux premiers éléments de la liste.

Afficher le duel : Film A vs Film B.

Quand un utilisateur clique sur son préféré, le gagnant est stocké dans un tableau "Prochain Tour", et le perdant est éliminé.

Passer aux deux films suivants, jusqu'à la fin de la liste.

L'utilisateur peut aussi dire "aucun des deux" dans ce cas les deux sont éliminés

Recommencer avec les gagnants (Quart de finale -> Demi-finale -> Finale) jusqu'à ce qu'il n'en reste qu'un.

si rien n'est choisi l'utilisateur peut refaire un nouveau tour ou utiliser la fonction "je ne sais pas quoi regarder"

Interface : Un écran divisé en deux (gauche/droite) avec de belles affiches et un bouton central ou un clic sur l'affiche pour choisir.

Étape 3 : Le Mode "Je ne sais pas quoi regarder" (Assistant de filtrage)
Si le couple n'a aucune idée de ce qu'il veut, ce mode les guide. TMDB possède un endpoint parfait pour ça : /discover/movie ou /discover/tv.

Interface : Une série de questions étape par étape (façon quiz).

Question 1 : Film ou Série ?

Question 2 : Quelle ambiance ? (Comédie, Horreur, Sci-Fi... qui correspond aux "Genres" TMDB).

Question 3 : Plutôt récent ou classique ? (Filtre par année de sortie).

Question 4 : Un thème particulier ? (Requête par mots-clés TMDB, ex: "Vampires", "Espace", "Enquête").

Résultat : Appel à l'API avec ces filtres et sélection aléatoire d'une dizaine de films films parmi les résultats de la première page pour proposer une suggestion forte.

Phase 4 : Finitions et Analytics
Gestion de l'état : Assure-toi que les choix soient fluides. Utilise le LocalStorage pour sauvegarder la liste en cours de création.

Intégration du Tracker : Ajoute la balise script de ton outil d'analytics dans le <head> de ton HTML pour remonter tes statistiques . Les staitstique utiliserons Umami, Il est aussi nécessaire de pouvoir remonter les infos de quel mode est utilisé, a quelle étapes ils ont stoppé et les stats des films qui ont été choise (style, année etc)

Responsive Design : Teste l'application sur mobile (le couple l'utilisera sûrement depuis son canapé sur un smartphone). Les duels A vs B peuvent être affichés l'un au-dessus de l'autre sur petit écran.