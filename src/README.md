# Geo-Atlas 🌍 (bilingue FR/EN)

Livre-atlas géant, ludique et animé : 250 pays, planisphère Leaflet, thématiques, comparateur, quiz, passeport.

## Structure
- `index.html` — coquille du livre (9 pages : couverture, planisphère, continents, thématiques, pays A–Z, comparateur, quiz, passeport, sources) + fiche pays modale.
- `src/styles.css` — thème livre (papier, or, navy) + animations.
- `src/i18n.js` — dictionnaire bilingue FR/EN (`window.ATLAS_I18N`, ~200 clés). Chargé avant `app.js` ; `globe3d.js` l'utilise aussi pour ses boutons.
- `src/app.js` — logique : Leaflet, choroplèthes, recherche, quiz 3 modes, passeport localStorage, particules/confettis, globe canvas, sons WebAudio. Langue via `S.lang` (`localStorage atlas_lang`, défaut = langue du navigateur), helpers `t()` / `cn()` (nom pays EN/FR), `applyI18n()` + `setLang()` / `window.atlasSetLang()` ; bouton 🌐 dans la barre du haut.
- `src/data/countries.json` — 250 pays (noms FR/EN, capitale, pop, superficie, langues, monnaies, voisins…) compilé depuis mledoze/countries + samayo/country-json.
- `src/data/world.geo.json` — fond vectoriel mondial (johan/world.geo.json, 180 entités).

## Données / tuiles runtime
- Tuiles : Esri (World_Street_Map, World_Imagery, World_Topo_Map, World_Dark_Gray — sans clé). OSM direct et CARTO raster sont bloqués (403 / clé requise) et ne sont plus utilisés.
- Hymnes authentiques : recherche + lecture d'enregistrements Wikimedia Commons (domaine public) avec cache 60 entrées ; repli YouTube + fanfare générative.
- Globe 3D : soleil temps réel (terminateur jour/nuit), pastilles visitées cliquables, pause hors-onglet, respect de prefers-reduced-motion.
- Drapeaux : FlagCDN `https://flagcdn.com/w160/{c2}.png`.
- Météo + géocodage capitales : Open-Meteo (sans clé) avec cache 15 min.
- Hymnes : `src/data/anthems.json` (titres) + bouton YouTube + fanfare générative WebAudio.
- Globe 3D : `src/globe3d.js` (Three.js via esm.sh, textures jsdelivr three-globe) avec marqueurs des pays visités ; repli 2D canvas si WebGL/texture KO.
- Rebuild dataset : voir `scratch/` (mledoze + samayo merge).

## Tester
- `page_refresh` puis cliquer carte, dé 🎲, quiz, versus, passeport.
- Console : aucune erreur perchanceErrors attendue ; Leaflet chargé depuis unpkg (réseau requis).
