# 🍊 Guide d'Installation pour Débutants - Windows

## Ce guide vous explique comment installer Natanjou Buvette sur votre PC Windows, étape par étape.

---

# ÉTAPE 1 : Télécharger les logiciels nécessaires (15 minutes)

Vous devez installer 3 logiciels gratuits. Cliquez sur chaque lien et suivez les instructions.

---

## 1.1 - Installer Python (le moteur du serveur)

1. **Cliquez sur ce lien** : https://www.python.org/downloads/
2. Cliquez sur le gros bouton jaune **"Download Python 3.x.x"**
3. Une fois téléchargé, **double-cliquez** sur le fichier pour l'installer
4. ⚠️ **TRÈS IMPORTANT** : Cochez la case **"Add Python to PATH"** en bas de la fenêtre d'installation
5. Cliquez sur **"Install Now"**
6. Attendez la fin de l'installation, puis cliquez sur **"Close"**

---

## 1.2 - Installer Node.js (pour l'interface)

1. **Cliquez sur ce lien** : https://nodejs.org/
2. Cliquez sur le bouton vert **"LTS"** (version recommandée)
3. Une fois téléchargé, **double-cliquez** sur le fichier pour l'installer
4. Cliquez sur **"Next"** à chaque étape
5. Acceptez les conditions et continuez jusqu'à **"Install"**
6. Attendez la fin, puis cliquez sur **"Finish"**

---

## 1.3 - Installer MongoDB (la base de données)

1. **Cliquez sur ce lien** : https://www.mongodb.com/try/download/community
2. Vérifiez que c'est bien **"Windows"** et **"msi"** qui sont sélectionnés
3. Cliquez sur **"Download"**
4. Une fois téléchargé, **double-cliquez** sur le fichier pour l'installer
5. Cliquez sur **"Next"**
6. Acceptez les conditions, cliquez **"Next"**
7. Choisissez **"Complete"**, cliquez **"Next"**
8. ✅ Laissez coché **"Install MongoDB as a Service"** (très important !)
9. ✅ Laissez coché **"Install MongoDB Compass"** (optionnel mais utile)
10. Cliquez sur **"Install"**, puis **"Finish"**

**MongoDB démarrera automatiquement avec Windows !**

---

# ÉTAPE 2 : Redémarrer votre ordinateur (2 minutes)

**Redémarrez votre PC** pour que tous les logiciels soient bien reconnus.

---

# ÉTAPE 3 : Télécharger l'application Natanjou (5 minutes)

## Option A : Depuis GitHub (si vous avez sauvegardé sur GitHub)

1. Allez sur votre page GitHub
2. Trouvez votre projet "natanjou-buvette"
3. Cliquez sur le bouton vert **"Code"**
4. Cliquez sur **"Download ZIP"**
5. Une fois téléchargé, faites **clic droit** sur le fichier ZIP
6. Cliquez sur **"Extraire tout..."**
7. Choisissez un emplacement simple, par exemple : `C:\Natanjou`
8. Cliquez sur **"Extraire"**

## Option B : Demandez-moi de préparer un ZIP

Si vous n'avez pas GitHub, dites-le moi et je vous expliquerai comment obtenir les fichiers.

---

# ÉTAPE 4 : Installer l'application (10 minutes)

1. Ouvrez le dossier où vous avez extrait les fichiers (ex: `C:\Natanjou`)
2. **Double-cliquez** sur le fichier `install_windows.bat`
3. Une fenêtre noire va s'ouvrir avec du texte qui défile
4. **Attendez** que l'installation se termine (quelques minutes)
5. Quand c'est fini, vous verrez **"INSTALLATION TERMINÉE!"**
6. Appuyez sur une touche pour fermer la fenêtre

---

# ÉTAPE 5 : Lancer l'application (1 minute)

1. Dans le même dossier, **double-cliquez** sur `start_windows.bat`
2. **Deux fenêtres noires** vont s'ouvrir (c'est normal !)
   - Une pour le serveur (Backend)
   - Une pour l'interface (Frontend)
3. Attendez environ **30 secondes**
4. Votre navigateur internet va s'ouvrir automatiquement sur l'application

**Si le navigateur ne s'ouvre pas automatiquement :**
- Ouvrez votre navigateur (Chrome, Firefox, Edge...)
- Tapez dans la barre d'adresse : `http://localhost:3000`
- Appuyez sur Entrée

---

# ÉTAPE 6 : Utiliser l'application

## Page de connexion

Vous verrez un écran de connexion. Entrez un des codes suivants :

| Pour... | Tapez le code |
|---------|---------------|
| **Gérer la buvette** (tout faire) | `natanjou2024` |
| **Juste regarder** (sans modifier) | `2026` |

---

# 🛑 Comment arrêter l'application

Pour fermer l'application :
1. Fermez les **deux fenêtres noires** (Backend et Frontend)
2. C'est tout !

---

# 🔄 Comment relancer l'application

La prochaine fois que vous voulez utiliser l'application :
1. Allez dans le dossier Natanjou
2. Double-cliquez sur `start_windows.bat`
3. C'est tout !

---

# ❓ Problèmes fréquents et solutions

## "Python n'est pas reconnu"
→ Vous n'avez pas coché "Add Python to PATH" lors de l'installation
→ **Solution** : Désinstallez Python et réinstallez-le en cochant cette case

## "La page ne s'affiche pas"
→ Les serveurs ne sont pas encore prêts
→ **Solution** : Attendez 30 secondes et rafraîchissez la page (touche F5)

## "Erreur de connexion à la base de données"
→ MongoDB n'est pas démarré
→ **Solution** : 
   1. Appuyez sur les touches `Windows + R`
   2. Tapez `services.msc` et appuyez sur Entrée
   3. Cherchez "MongoDB Server" dans la liste
   4. Faites clic droit dessus et cliquez sur "Démarrer"

## "Les fenêtres noires se ferment immédiatement"
→ Il y a une erreur dans l'installation
→ **Solution** : Relancez `install_windows.bat`

---

# 📞 Aide

Si vous avez des problèmes, notez :
- Le message d'erreur exact (s'il y en a un)
- À quelle étape vous êtes bloqué

Vous pourrez me demander de l'aide avec ces informations !

---

# 🔑 Rappel des codes

| Fonctionnalité | Code |
|----------------|------|
| Connexion administrateur | `natanjou2024` |
| Connexion consultation | `2026` |
| Réinitialisation stock | `natanjou2024` |
| Restauration / Remise à zéro | `1967` |

---

**Bonne utilisation de Natanjou Buvette ! 🍊**
