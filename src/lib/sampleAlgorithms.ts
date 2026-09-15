export interface SampleAlgorithm {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  authorName: string;
  authorAvatar: string;
  likesCount: number;
  ratingsCount: number;
  averageRating: number;
  testsCount: number;
  createdAt: number;
  rawAlgContent: string;
}

export const SAMPLE_ALGORITHMS: SampleAlgorithm[] = [
  {
    id: 'sample-nombre-mystere',
    title: 'Le Jeu du Nombre Mystère',
    description: 'Devinez le nombre secret généré aléatoirement entre 1 et 100 avec des indications "C\'est plus !" ou "C\'est moins !". Démonstration complète de l\'interactivité LIRE et des boucles.',
    category: 'Jeux & Interactivité',
    tags: ['jeu', 'interactif', 'tant_que', 'si_alors', 'aléatoire'],
    authorName: 'Alexandre Prof',
    authorAvatar: 'terminal',
    likesCount: 24,
    ratingsCount: 16,
    averageRating: 4.9,
    testsCount: 88,
    createdAt: Date.now() - 86400000 * 3,
    rawAlgContent: `<?xml version="1.0" encoding="UTF-8"?>
<Algo>
    <description texte="Jeu du Plus ou Moins - Devine le nombre secret" courant-algo="saisie"/>
    <extension extnom="inactif"/>
    <fonction fctcode="" fctetat="inactif"/>
    <item algoitem="FONCTIONS_UTILISEES"/>
    <item algoitem="VARIABLES">
        <item algoitem="secret EST_DU_TYPE NOMBRE"/>
        <item algoitem="essai EST_DU_TYPE NOMBRE"/>
        <item algoitem="tentatives EST_DU_TYPE NOMBRE"/>
        <item algoitem="trouve EST_DU_TYPE NOMBRE"/>
    </item>
    <item algoitem="DEBUT_ALGORITHME">
        <item algoitem="secret PREND_LA_VALEUR ALGOBOX_ALEA_ENTIER(1, 100)"/>
        <item algoitem="tentatives PREND_LA_VALEUR 0"/>
        <item algoitem="trouve PREND_LA_VALEUR 0"/>
        <item algoitem="AFFICHER* &quot;=== BIENVENUE DANS LE JEU DU NOMBRE MYSTERE ===&quot;"/>
        <item algoitem="AFFICHER* &quot;J'ai choisi un nombre entre 1 et 100. A toi de deviner !&quot;"/>
        <item algoitem="TANT_QUE (trouve == 0) FAIRE">
            <item algoitem="DEBUT_TANT_QUE"/>
            <item algoitem="AFFICHER* &quot;&quot;"/>
            <item algoitem="AFFICHER &quot;Propose un nombre : &quot;"/>
            <item algoitem="LIRE essai"/>
            <item algoitem="tentatives PREND_LA_VALEUR tentatives + 1"/>
            <item algoitem="SI (essai == secret) ALORS">
                <item algoitem="DEBUT_SI"/>
                <item algoitem="AFFICHER* &quot;BRAVO ! Tu as trouve le nombre secret !&quot;"/>
                <item algoitem="AFFICHER &quot;Nombre de coups : &quot;"/>
                <item algoitem="AFFICHER* tentatives"/>
                <item algoitem="trouve PREND_LA_VALEUR 1"/>
                <item algoitem="FIN_SI"/>
                <item algoitem="SINON">
                    <item algoitem="DEBUT_SINON"/>
                    <item algoitem="SI (essai < secret) ALORS">
                        <item algoitem="DEBUT_SI"/>
                        <item algoitem="AFFICHER* &quot;>> C'est PLUS GRAND !&quot;"/>
                        <item algoitem="FIN_SI"/>
                        <item algoitem="SINON">
                            <item algoitem="DEBUT_SINON"/>
                            <item algoitem="AFFICHER* &quot;>> C'est PLUS PETIT !&quot;"/>
                            <item algoitem="FIN_SINON"/>
                    </item>
                    <item algoitem="FIN_SINON"/>
            </item>
            <item algoitem="FIN_TANT_QUE"/>
        </item>
        <item algoitem="AFFICHER* &quot;Fin de la partie. Merci d'avoir joue !&quot;"/>
    </item>
    <item algoitem="FIN_ALGORITHME"/>
</Algo>`,
  },
  {
    id: 'sample-pgcd-euclide',
    title: 'PGCD d\'Euclide (Plus Grand Commun Diviseur)',
    description: 'Calcul classique et ultra-rapide du PGCD de deux entiers selon l\'algorithme d\'Euclide par divisions successives (modulo).',
    category: 'Arithmétique',
    tags: ['maths', 'arithmetique', 'euclide', 'pgcd', 'modulo'],
    authorName: 'Sarah Maths',
    authorAvatar: 'binary',
    likesCount: 19,
    ratingsCount: 12,
    averageRating: 4.8,
    testsCount: 65,
    createdAt: Date.now() - 86400000 * 5,
    rawAlgContent: `<?xml version="1.0" encoding="UTF-8"?>
<Algo>
    <description texte="Calcul du PGCD par algorithme d'Euclide" courant-algo="saisie"/>
    <extension extnom="inactif"/>
    <item algoitem="VARIABLES">
        <item algoitem="a EST_DU_TYPE NOMBRE"/>
        <item algoitem="b EST_DU_TYPE NOMBRE"/>
        <item algoitem="r EST_DU_TYPE NOMBRE"/>
        <item algoitem="a_orig EST_DU_TYPE NOMBRE"/>
        <item algoitem="b_orig EST_DU_TYPE NOMBRE"/>
    </item>
    <item algoitem="DEBUT_ALGORITHME">
        <item algoitem="AFFICHER* &quot;--- CALCUL DU PGCD (ALGORITHME D'EUCLIDE) ---&quot;"/>
        <item algoitem="AFFICHER &quot;Entrez le premier entier positif a : &quot;"/>
        <item algoitem="LIRE a"/>
        <item algoitem="AFFICHER &quot;Entrez le second entier positif b : &quot;"/>
        <item algoitem="LIRE b"/>
        <item algoitem="a_orig PREND_LA_VALEUR a"/>
        <item algoitem="b_orig PREND_LA_VALEUR b"/>
        <item algoitem="TANT_QUE (b != 0) FAIRE">
            <item algoitem="DEBUT_TANT_QUE"/>
            <item algoitem="r PREND_LA_VALEUR a % b"/>
            <item algoitem="a PREND_LA_VALEUR b"/>
            <item algoitem="b PREND_LA_VALEUR r"/>
            <item algoitem="FIN_TANT_QUE"/>
        </item>
        <item algoitem="AFFICHER* &quot;&quot;"/>
        <item algoitem="AFFICHER &quot;Le PGCD de &quot;"/>
        <item algoitem="AFFICHER a_orig"/>
        <item algoitem="AFFICHER &quot; et &quot;"/>
        <item algoitem="AFFICHER b_orig"/>
        <item algoitem="AFFICHER &quot; est egal a : &quot;"/>
        <item algoitem="AFFICHER* a"/>
    </item>
    <item algoitem="FIN_ALGORITHME"/>
</Algo>`,
  },
  {
    id: 'sample-fibonacci',
    title: 'Suite de Fibonacci & Somme',
    description: 'Génère pas à pas les n premiers termes de la célèbre suite de Fibonacci ($F_{n} = F_{n-1} + F_{n-2}$) avec affichage de chaque valeur et de la somme cumulée.',
    category: 'Suites Numériques',
    tags: ['fibonacci', 'boucle_pour', 'suites', 'somme'],
    authorName: 'Julien Code',
    authorAvatar: 'cpu',
    likesCount: 31,
    ratingsCount: 22,
    averageRating: 5.0,
    testsCount: 112,
    createdAt: Date.now() - 86400000 * 7,
    rawAlgContent: `<?xml version="1.0" encoding="UTF-8"?>
<Algo>
    <description texte="Calcul des termes de la suite de Fibonacci" courant-algo="saisie"/>
    <extension extnom="inactif"/>
    <item algoitem="VARIABLES">
        <item algoitem="n EST_DU_TYPE NOMBRE"/>
        <item algoitem="i EST_DU_TYPE NOMBRE"/>
        <item algoitem="u0 EST_DU_TYPE NOMBRE"/>
        <item algoitem="u1 EST_DU_TYPE NOMBRE"/>
        <item algoitem="u2 EST_DU_TYPE NOMBRE"/>
        <item algoitem="somme EST_DU_TYPE NOMBRE"/>
    </item>
    <item algoitem="DEBUT_ALGORITHME">
        <item algoitem="AFFICHER* &quot;=== SUITE DE FIBONACCI ===&quot;"/>
        <item algoitem="AFFICHER &quot;Combien de termes voulez-vous calculer (n >= 2) ? &quot;"/>
        <item algoitem="LIRE n"/>
        <item algoitem="u0 PREND_LA_VALEUR 0"/>
        <item algoitem="u1 PREND_LA_VALEUR 1"/>
        <item algoitem="somme PREND_LA_VALEUR 1"/>
        <item algoitem="AFFICHER* &quot;Terme F(0) = 0&quot;"/>
        <item algoitem="AFFICHER* &quot;Terme F(1) = 1&quot;"/>
        <item algoitem="POUR i ALLANT_DE 2 A n FAIRE">
            <item algoitem="DEBUT_POUR"/>
            <item algoitem="u2 PREND_LA_VALEUR u0 + u1"/>
            <item algoitem="somme PREND_LA_VALEUR somme + u2"/>
            <item algoitem="AFFICHER &quot;Terme F(&quot;"/>
            <item algoitem="AFFICHER i"/>
            <item algoitem="AFFICHER &quot;) = &quot;"/>
            <item algoitem="AFFICHER* u2"/>
            <item algoitem="u0 PREND_LA_VALEUR u1"/>
            <item algoitem="u1 PREND_LA_VALEUR u2"/>
            <item algoitem="FIN_POUR"/>
        </item>
        <item algoitem="AFFICHER* &quot;----------------------------------&quot;"/>
        <item algoitem="AFFICHER &quot;Somme des termes calcules : &quot;"/>
        <item algoitem="AFFICHER* somme"/>
    </item>
    <item algoitem="FIN_ALGORITHME"/>
</Algo>`,
  },
  {
    id: 'sample-nombre-premier',
    title: 'Test de Primalité (Nombre Premier)',
    description: 'Vérifie si un nombre entier $N$ donné est un nombre premier en testant ses diviseurs éventuels jusqu\'à sa racine carrée.',
    category: 'Arithmétique',
    tags: ['premier', 'primalite', 'sqrt', 'boucle', 'optimisation'],
    authorName: 'Camille Algo',
    authorAvatar: 'shield',
    likesCount: 15,
    ratingsCount: 9,
    averageRating: 4.7,
    testsCount: 43,
    createdAt: Date.now() - 86400000 * 2,
    rawAlgContent: `<?xml version="1.0" encoding="UTF-8"?>
<Algo>
    <description texte="Test si un nombre est premier" courant-algo="saisie"/>
    <extension extnom="inactif"/>
    <item algoitem="VARIABLES">
        <item algoitem="n EST_DU_TYPE NOMBRE"/>
        <item algoitem="d EST_DU_TYPE NOMBRE"/>
        <item algoitem="estPremier EST_DU_TYPE NOMBRE"/>
        <item algoitem="limite EST_DU_TYPE NOMBRE"/>
    </item>
    <item algoitem="DEBUT_ALGORITHME">
        <item algoitem="AFFICHER* &quot;*** TESTEUR DE NOMBRE PREMIER ***&quot;"/>
        <item algoitem="AFFICHER &quot;Entrez un nombre entier supérieur ou égal à 2 : &quot;"/>
        <item algoitem="LIRE n"/>
        <item algoitem="SI (n < 2) ALORS">
            <item algoitem="DEBUT_SI"/>
            <item algoitem="AFFICHER* &quot;Erreur : le nombre doit être >= 2&quot;"/>
            <item algoitem="FIN_SI"/>
            <item algoitem="SINON">
                <item algoitem="DEBUT_SINON"/>
                <item algoitem="estPremier PREND_LA_VALEUR 1"/>
                <item algoitem="d PREND_LA_VALEUR 2"/>
                <item algoitem="limite PREND_LA_VALEUR floor(sqrt(n))"/>
                <item algoitem="TANT_QUE (d <= limite ET estPremier == 1) FAIRE">
                    <item algoitem="DEBUT_TANT_QUE"/>
                    <item algoitem="SI (n % d == 0) ALORS">
                        <item algoitem="DEBUT_SI"/>
                        <item algoitem="estPremier PREND_LA_VALEUR 0"/>
                        <item algoitem="AFFICHER &quot;Divisible par : &quot;"/>
                        <item algoitem="AFFICHER* d"/>
                        <item algoitem="FIN_SI"/>
                    <item algoitem="d PREND_LA_VALEUR d + 1"/>
                    <item algoitem="FIN_TANT_QUE"/>
                </item>
                <item algoitem="SI (estPremier == 1) ALORS">
                    <item algoitem="DEBUT_SI"/>
                    <item algoitem="AFFICHER n"/>
                    <item algoitem="AFFICHER* &quot; EST un nombre premier !&quot;"/>
                    <item algoitem="FIN_SI"/>
                    <item algoitem="SINON">
                        <item algoitem="DEBUT_SINON"/>
                        <item algoitem="AFFICHER n"/>
                        <item algoitem="AFFICHER* &quot; N'EST PAS un nombre premier.&quot;"/>
                        <item algoitem="FIN_SINON"/>
                </item>
                <item algoitem="FIN_SINON"/>
        </item>
    </item>
    <item algoitem="FIN_ALGORITHME"/>
</Algo>`,
  },
  {
    id: 'sample-second-degre',
    title: 'Équation du 2nd Degré (ax² + bx + c = 0)',
    description: 'Résolution complète de l\'équation polynomiale du second degré dans l\'ensemble des réels : calcul du discriminant Delta et affichage des racines distinctes ou doubles.',
    category: 'Algèbre',
    tags: ['algebre', 'discriminant', 'delta', 'racines', 'sqrt'],
    authorName: 'Prof Martin',
    authorAvatar: 'function',
    likesCount: 28,
    ratingsCount: 18,
    averageRating: 4.9,
    testsCount: 94,
    createdAt: Date.now() - 86400000 * 10,
    rawAlgContent: `<?xml version="1.0" encoding="UTF-8"?>
<Algo>
    <description texte="Resolution ax^2 + bx + c = 0" courant-algo="saisie"/>
    <extension extnom="inactif"/>
    <item algoitem="VARIABLES">
        <item algoitem="a EST_DU_TYPE NOMBRE"/>
        <item algoitem="b EST_DU_TYPE NOMBRE"/>
        <item algoitem="c EST_DU_TYPE NOMBRE"/>
        <item algoitem="delta EST_DU_TYPE NOMBRE"/>
        <item algoitem="x0 EST_DU_TYPE NOMBRE"/>
        <item algoitem="x1 EST_DU_TYPE NOMBRE"/>
        <item algoitem="x2 EST_DU_TYPE NOMBRE"/>
    </item>
    <item algoitem="DEBUT_ALGORITHME">
        <item algoitem="AFFICHER* &quot;=== RESOLUTION DE ax^2 + bx + c = 0 ===&quot;"/>
        <item algoitem="AFFICHER &quot;Coefficient a (non nul) : &quot;"/>
        <item algoitem="LIRE a"/>
        <item algoitem="AFFICHER &quot;Coefficient b : &quot;"/>
        <item algoitem="LIRE b"/>
        <item algoitem="AFFICHER &quot;Coefficient c : &quot;"/>
        <item algoitem="LIRE c"/>
        <item algoitem="SI (a == 0) ALORS">
            <item algoitem="DEBUT_SI"/>
            <item algoitem="AFFICHER* &quot;Attention : 'a' doit etre different de 0 pour une equation du second degre !&quot;"/>
            <item algoitem="FIN_SI"/>
            <item algoitem="SINON">
                <item algoitem="DEBUT_SINON"/>
                <item algoitem="delta PREND_LA_VALEUR (b*b) - (4*a*c)"/>
                <item algoitem="AFFICHER &quot;Discriminant Delta = &quot;"/>
                <item algoitem="AFFICHER* delta"/>
                <item algoitem="SI (delta > 0) ALORS">
                    <item algoitem="DEBUT_SI"/>
                    <item algoitem="x1 PREND_LA_VALEUR (-b - sqrt(delta)) / (2*a)"/>
                    <item algoitem="x2 PREND_LA_VALEUR (-b + sqrt(delta)) / (2*a)"/>
                    <item algoitem="AFFICHER* &quot;Delta > 0 : Deux solutions reelles distinctes :&quot;"/>
                    <item algoitem="AFFICHER &quot;x1 = &quot;"/>
                    <item algoitem="AFFICHER* x1"/>
                    <item algoitem="AFFICHER &quot;x2 = &quot;"/>
                    <item algoitem="AFFICHER* x2"/>
                    <item algoitem="FIN_SI"/>
                <item algoitem="SI (delta == 0) ALORS">
                    <item algoitem="DEBUT_SI"/>
                    <item algoitem="x0 PREND_LA_VALEUR -b / (2*a)"/>
                    <item algoitem="AFFICHER* &quot;Delta = 0 : Une unique solution reelle double :&quot;"/>
                    <item algoitem="AFFICHER &quot;x0 = &quot;"/>
                    <item algoitem="AFFICHER* x0"/>
                    <item algoitem="FIN_SI"/>
                <item algoitem="SI (delta < 0) ALORS">
                    <item algoitem="DEBUT_SI"/>
                    <item algoitem="AFFICHER* &quot;Delta < 0 : Pas de solution reelle.&quot;"/>
                    <item algoitem="FIN_SI"/>
                <item algoitem="FIN_SINON"/>
        </item>
    </item>
    <item algoitem="FIN_ALGORITHME"/>
</Algo>`,
  },
];
