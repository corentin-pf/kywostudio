// =========================================================
// KYWO Studio — site Graphisme / Design digital
// Animations communes à toutes les pages /graphisme/
// =========================================================
(function () {
  const racine = document.documentElement;
  const mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 1. Défilement fluide (comme sur Framer) ----
  let lenis = null;
  if (window.Lenis && !mouvementReduit) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    (function boucle(t) { lenis.raf(t); requestAnimationFrame(boucle); })(performance.now());
    // Les liens vers une ancre de la page défilent en douceur
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const cible = document.querySelector(a.getAttribute("href"));
      if (cible) { e.preventDefault(); lenis.scrollTo(cible); }
    }));
  }

  // ---- 2. Animations d'entrée quand la page est prête ----
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    requestAnimationFrame(() => racine.classList.add("pret"));
  });

  // ---- 3. Menu latéral ----
  const boutonMenu = document.querySelector(".bouton-menu");
  function basculerMenu(ouvrir) {
    const ouvert = ouvrir ?? !racine.classList.contains("menu-ouvert");
    racine.classList.toggle("menu-ouvert", ouvert);
    boutonMenu?.setAttribute("aria-expanded", String(ouvert));
    boutonMenu?.setAttribute("aria-label", ouvert ? "Fermer le menu" : "Ouvrir le menu");
    if (lenis) ouvert ? lenis.stop() : lenis.start();
  }
  boutonMenu?.addEventListener("click", () => basculerMenu());
  document.querySelector(".voile")?.addEventListener("click", () => basculerMenu(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") basculerMenu(false); });

  // ---- 4. Mots qui apparaissent un par un ----
  function decouperEnMots(el) {
    let i = 0;
    const parcourir = (noeud) => {
      [...noeud.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((morceau) => {
            if (!morceau) return;
            if (/^\s+$/.test(morceau)) { frag.appendChild(document.createTextNode(morceau)); return; }
            const s = document.createElement("span");
            s.className = "mot";
            s.style.setProperty("--i", i++);
            s.textContent = morceau;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) parcourir(n);
      });
    };
    parcourir(el);
  }
  document.querySelectorAll(".mots, .surligne").forEach(decouperEnMots);

  // ---- 5. Apparitions au défilement ----
  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("est-visible"); observateur.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".apparait, .mots, .cadre-photo").forEach((el) => observateur.observe(el));

  // ---- 6. Texte qui s'allume mot après mot en descendant (page About) ----
  const surlignes = [...document.querySelectorAll(".surligne")];
  const motsSurlignes = surlignes.flatMap((p) => [...p.querySelectorAll(".mot")]);

  // ---- 7. Logo blanc qu'on attrape et qu'on pose où on veut ----
  // Il reste où on le lâche, puis revient tout seul à sa place au bout de 10 secondes.
  const logo = document.querySelector(".logo-attrape");
  if (logo) {
    let prise = null, dx = 0, dy = 0, minuterie = null;
    logo.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      clearTimeout(minuterie);
      prise = { x: e.clientX - dx, y: e.clientY - dy };
      logo.classList.add("en-main");
      logo.setPointerCapture(e.pointerId);
      if (lenis) lenis.stop();
    });
    logo.addEventListener("pointermove", (e) => {
      if (!prise) return;
      dx = e.clientX - prise.x;
      dy = e.clientY - prise.y;
      logo.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    const lacher = () => {
      if (!prise) return;
      prise = null;
      logo.classList.remove("en-main");
      if (lenis) lenis.start();
      minuterie = setTimeout(() => {
        dx = 0; dy = 0;
        logo.style.transform = "";     // retour en douceur (transition CSS)
      }, 10000);
    };
    logo.addEventListener("pointerup", lacher);
    logo.addEventListener("pointercancel", lacher);
    logo.addEventListener("lostpointercapture", lacher);
  }

  // ---- 8. « LET'S TALK » : le mot plein glisse jusqu'en bas du pied de page ----
  const echo = document.querySelector(".echo");
  function reglerEcho() {
    if (!echo) return;
    const plein = echo.querySelector(".echo__plein");
    const basEcho = echo.getBoundingClientRect().bottom + window.scrollY;
    const resteSousEcho = document.documentElement.scrollHeight - basEcho;
    echo.style.setProperty("--echo-haut", Math.max(0, window.innerHeight - resteSousEcho - plein.offsetHeight) + "px");
  }
  reglerEcho();
  window.addEventListener("resize", reglerEcho);
  window.addEventListener("load", reglerEcho);

  // ---- 9. Boucle d'animation : parallaxe des cartes, mots allumés ----
  const couvertures = [...document.querySelectorAll(".carte-g__image > img:first-child")];
  function image() {
    const h = window.innerHeight;
    if (!mouvementReduit) {
      couvertures.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > h) return;
        const p = (r.top + r.height / 2 - h / 2) / h;      // -0,5 … 0,5 environ
        img.style.setProperty("--parallaxe", (-p * 40).toFixed(1) + "px");
      });
    }
    if (motsSurlignes.length) {
      const zone = surlignes[0].parentElement.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (h * 0.75 - zone.top) / (zone.height + h * 0.1)));
      const nb = Math.round(p * motsSurlignes.length);
      motsSurlignes.forEach((m, i) => m.classList.toggle("allume", i < nb));
    }
    requestAnimationFrame(image);
  }
  requestAnimationFrame(image);
})();
