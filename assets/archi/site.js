// =========================================================
// KYWO Studio — site Architecture d'intérieur
// Animations communes à toutes les pages /architecture/
// =========================================================
(function () {
  const racine = document.documentElement;
  const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 1. Texte qui remplit toute la largeur (« !!! KYWO ») ----
  function ajusterTextes() {
    document.querySelectorAll(".pleine-largeur").forEach((el) => {
      el.style.fontSize = "100px";
      el.style.width = "max-content";
      const largeurTexte = el.getBoundingClientRect().width;
      el.style.width = "";
      const largeurDispo = el.parentElement.clientWidth;
      if (largeurTexte > 0) el.style.fontSize = (100 * largeurDispo) / largeurTexte + "px";
    });
  }
  ajusterTextes();
  window.addEventListener("resize", ajusterTextes);

  // La page est prête quand les polices sont chargées : on lance les animations d'entrée
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    ajusterTextes();
    requestAnimationFrame(() => racine.classList.add("pret"));
  });

  // ---- 2. Apparition des titres et images en arrivant à l'écran ----
  // (ils se cachent de nouveau quand ils sortent, pour rejouer l'effet)
  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => e.target.classList.toggle("est-visible", e.isIntersecting));
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".grand-titre, .ligne, .apparait").forEach((el) => observateur.observe(el));

  // ---- 3. Menu qui se cache quand on descend et revient quand on remonte ----
  const menu = document.querySelector(".menu");
  let dernierY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (!menu) return;
    if (y > dernierY + 4 && y > 120) menu.classList.add("menu--cache");
    else if (y < dernierY - 4 || y < 120) menu.classList.remove("menu--cache");
    dernierY = y;
  }, { passive: true });

  // ---- 4. Vidéos qui dézooment pendant le défilement ----
  const zooms = [...document.querySelectorAll("[data-zoom]")].map((el) => ({
    el,
    cible: el.querySelector("[data-zoom-cible]") || el,
    depart: parseFloat(el.dataset.zoom),
    actuel: parseFloat(el.dataset.zoom),
  }));
  function animerZooms() {
    const h = window.innerHeight;
    zooms.forEach((z) => {
      const haut = z.el.getBoundingClientRect().top;
      // 0 quand le bloc arrive en bas de l'écran, 1 quand son haut atteint le haut de l'écran
      const p = Math.min(1, Math.max(0, (h - haut) / h));
      const voulu = z.depart - (z.depart - 1) * p;
      z.actuel += (voulu - z.actuel) * 0.12;   // lissage pour un mouvement doux
      z.cible.style.setProperty("--zoom", z.actuel.toFixed(4));
    });
    requestAnimationFrame(animerZooms);
  }
  if (zooms.length && !mouvementReduit && window.innerWidth >= 810) requestAnimationFrame(animerZooms);
  else zooms.forEach((z) => z.cible.style.setProperty("--zoom", 1));

  // ---- 5. Les vidéos ne tournent que lorsqu'elles sont visibles ----
  const lecteurs = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => {
      const v = e.target;
      v.dataset.visible = e.isIntersecting ? "1" : "";
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
  });
  document.querySelectorAll("video[autoplay]").forEach((v) => {
    v.muted = true;                 // obligatoire pour la lecture automatique sur mobile
    lecteurs.observe(v);
    // Dès que la vidéo est prête, on la relance si elle est à l'écran
    v.addEventListener("canplay", () => { if (v.dataset.visible && v.paused) v.play().catch(() => {}); });
  });

  // ---- 6. Bande de photos qui défile en continu ----
  document.querySelectorAll(".defilant__piste").forEach((piste) => {
    const serie = [...piste.children];
    serie.forEach((img) => {
      const copie = img.cloneNode(true);
      copie.setAttribute("aria-hidden", "true");
      copie.alt = "";
      piste.appendChild(copie);
    });
    function mesurer() {
      const ecart = parseFloat(getComputedStyle(piste).columnGap) || 0;
      const largeur = serie.reduce((t, img) => t + img.getBoundingClientRect().width + ecart, 0);
      piste.style.setProperty("--largeur-serie", largeur + "px");
      piste.style.setProperty("--duree-defilement", largeur / 50 + "s"); // 50 px par seconde
    }
    mesurer();
    window.addEventListener("resize", mesurer);
    window.addEventListener("load", mesurer);
  });

  // ---- 7. Horloge de Lyon dans le pied de page ----
  const horloges = document.querySelectorAll("[data-horloge]");
  function mettreAJourHeure() {
    const heure = new Date().toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour12: false });
    horloges.forEach((h) => (h.textContent = heure));
  }
  if (horloges.length) { mettreAJourHeure(); setInterval(mettreAJourHeure, 1000); }

  // ---- 8. Compétences : clic → recherche Google ----
  document.querySelectorAll(".competences li").forEach((li) => {
    li.addEventListener("click", () => {
      const terme = li.textContent.trim();
      window.open("https://www.google.com/search?q=" + encodeURIComponent(terme + " pour les nuls"), "_blank", "noopener");
    });
  });

  // ---- 9. Jaquettes logiciels draggables ----
  (function () {
    const conteneur = document.querySelector(".apropos__jaquettes");
    if (!conteneur) return;

    // [fichier, left%, top%, width%] dérivés du sprite jaquettes-source.webp (2000×1583)
    // et des marges transparentes mesurées dans chaque PNG (857×1023)
    const jaquettes = [
      ["blender.png",   "-5.0%",  "-4.5%",  "38.3%"],
      ["photoshop.png", "20.5%",  "6.6%",   "30.8%"],
      ["framer.png",    "28.1%",  "-11.2%", "47.9%"],
      ["premiere.png",  "62.0%",  "4.4%",   "30.5%"],
      ["figma.png",     "66.0%",  "-8.2%",  "43.8%"],
      ["autocad.png",   "1.4%",   "31.2%",  "30.6%"],
      ["twin.png",      "12.8%",  "29.7%",  "36%"  ],
      ["skp.png",       "40.4%",  "31%",    "30.8%"],
      ["vray.png",      "66.6%",  "29.7%",  "45.3%"],
      ["after.png",     "-6.5%",  "63.5%",  "38.6%"],
      ["id.png",        "17%",    "63.3%",  "30.8%"],
      ["archicad.png",  "38.6%",  "60.2%",  "30.8%"],
      ["ai.png",        "63.4%",  "61.6%",  "30.8%"],
    ];

    jaquettes.forEach(([fichier, left, top, width]) => {
      const div = document.createElement("div");
      div.className = "jaquette-drag";
      div.style.left = left;
      div.style.top = top;
      div.style.width = width;

      const img = document.createElement("img");
      img.src = "/assets/archi/accueil/jaquettes/" + fichier;
      img.alt = "";
      img.draggable = false;
      div.appendChild(img);

      let prise = null, dx = 0, dy = 0, minuterie = null;

      div.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        clearTimeout(minuterie);
        prise = { x: e.clientX - dx, y: e.clientY - dy };
        div.classList.add("en-main");
        div.setPointerCapture(e.pointerId);
      });
      div.addEventListener("pointermove", (e) => {
        if (!prise) return;
        dx = e.clientX - prise.x;
        dy = e.clientY - prise.y;
        div.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      const lacher = () => {
        if (!prise) return;
        prise = null;
        div.classList.remove("en-main");
        minuterie = setTimeout(() => {
          dx = 0; dy = 0;
          div.style.transform = "";
        }, 10000);
      };
      div.addEventListener("pointerup", lacher);
      div.addEventListener("pointercancel", lacher);
      div.addEventListener("lostpointercapture", lacher);

      conteneur.appendChild(div);
    });
  })();

  // ---- 10. Petit rond blanc qui suit la souris ----
  const curseur = document.querySelector(".curseur");
  if (curseur && window.matchMedia("(hover: hover)").matches) {
    let x = -100, y = -100, cx = -100, cy = -100;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      curseur.classList.add("curseur--actif");
    });
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) curseur.classList.remove("curseur--actif"); // la souris quitte la fenêtre
    });
    (function suivre() {
      cx += (x - cx) * 0.25;
      cy += (y - cy) * 0.25;
      curseur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(suivre);
    })();
  }
})();
