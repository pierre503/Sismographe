# Lancer les tests

Il existe deux types de tests implémentés actuellements.
* Les tests qui sont lancés grâce a test.html et qui permettent de tester le fonctionnement interne de sismographe.
* Les tests qui sont lancés avec le fichier testExport.py mais qui nécessitent d'avoir python et sismic d'installés. Ceux-ci permettent de tester la compatibilité des fichiers YAML créés avec Sismic.
Pour lancer les tests de compatibilité des fichiers créés avec Sismogrpahe dans Sismic l'utilisateur doit lancer le fichier ``createFile.html".
Ce fichier va modifier avec Sismographe un des fichiers YAML mis en exemple par Sismic et ensuite exporter le résultat. 
De plus, il s'occupera aussi de créer un statechart avec Sismographe.   
Une fois cela fait, les deux fichiers  ``newElevator.YAML" et ``updateElevator.YAML" seront téléchargés et devront être placés dans le dossier ``test/results" 
Les fichiers peuvent alors être testés avec le fichier ``testExport.py" qui testera alors les fichiers YAML créés dans Sismic.