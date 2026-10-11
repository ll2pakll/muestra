/* ---------------------------------------------------------------------
   Карусель: стрелки, счётчик «3 / 5», свайп, увеличение во весь экран.

   Скрипт НАДСТРАИВАЕТ карусель, а не создаёт её. Без него остаётся
   рабочая версия на чистом CSS — кадры меняются сами. Поэтому здесь
   нет аварийных заглушек: если скрипт не загрузился, посетитель всё
   равно видит фотографии, просто без стрелок.

   Числа те же, что в CSS: 6 секунд на кадр, 1,2 секунды на переход.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  var PASO = 6000;    /* сколько держится кадр */
  var TRANS = 1200;   /* сколько длится затухание */

  /* Человек выключил анимацию в системе — CSS раскладывает кадры
     столбиком, и переключать нечего. */
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var carruseles = document.querySelectorAll(".carrusel");
  if (!carruseles.length) return;

  var FLECHA =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"' +
    ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M15 5l-7 7 7 7"/></svg>';

  function boton(clase, etiqueta, girar) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "car-flecha " + clase;
    b.setAttribute("aria-label", etiqueta);
    b.innerHTML = girar ? FLECHA.replace("<path", '<path transform="rotate(180 12 12)"') : FLECHA;
    return b;
  }

  /* Карусель за краем экрана кадры не меняет. Запас 200 px, чтобы она
     уже шла к моменту, когда человек до неё доскроллит, а не трогалась
     с места у него на глазах. */
  if ("IntersectionObserver" in window) {
    var ojo = new IntersectionObserver(function (filas) {
      filas.forEach(function (f) { f.target.classList.toggle("car-fuera", !f.isIntersecting); });
    }, { rootMargin: "200px 0px" });
    Array.prototype.forEach.call(carruseles, function (c) { ojo.observe(c); });
  }

  Array.prototype.forEach.call(carruseles, function (caja) {
    var hojas = Array.prototype.slice.call(caja.querySelectorAll(":scope > .diapo"));
    var n = hojas.length;
    if (n < 2) return;

    var i = 0, reloj = null, quieto = false, borrar = null;

    caja.classList.add("car-js");
    hojas[0].classList.add("car-act");

    var izq = boton("car-izq", "Foto anterior", false);
    var der = boton("car-der", "Foto siguiente", true);
    caja.appendChild(izq);
    caja.appendChild(der);

    var cuenta = document.createElement("span");
    cuenta.className = "car-contador";
    cuenta.setAttribute("aria-live", "polite");
    caja.appendChild(cuenta);

    function marcar() { cuenta.textContent = (i + 1) + " / " + n; }

    function ir(j) {
      j = (j + n) % n;
      if (j === i) return;
      hojas.forEach(function (h) { h.classList.remove("car-ant"); });
      /* Уходящий кадр держит непрозрачность, пока новый не проявится
         полностью, — иначе на середине перехода видно фон секции. */
      hojas[i].classList.remove("car-act");
      hojas[i].classList.add("car-ant");
      var saliente = hojas[i];
      clearTimeout(borrar);
      borrar = setTimeout(function () { saliente.classList.remove("car-ant"); }, TRANS + 50);
      i = j;
      hojas[i].classList.add("car-act");
      marcar();
    }

    function arrancar() {
      clearInterval(reloj);
      if (!quieto) reloj = setInterval(function () { ir(i + 1); }, PASO);
    }

    izq.addEventListener("click", function () { ir(i - 1); arrancar(); });
    der.addEventListener("click", function () { ir(i + 1); arrancar(); });

    caja.addEventListener("mouseenter", function () { quieto = true; clearInterval(reloj); });
    caja.addEventListener("mouseleave", function () { quieto = false; arrancar(); });

    var x0 = null;
    caja.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    caja.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var d = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(d) > 40) { ir(d < 0 ? i + 1 : i - 1); arrancar(); }
    }, { passive: true });

    /* Вкладка в фоне — браузер и сам душит таймеры, но лучше остановить
       явно, чем копить пропущенные срабатывания. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearInterval(reloj); else arrancar();
    });

    caja.addEventListener("click", function (e) {
      if (!e.target.closest("img")) return;
      quieto = true;
      clearInterval(reloj);
      abrirVisor(
        hojas.map(function (h) {
          var im = h.querySelector("img");
          return { src: im.getAttribute("src"), alt: im.getAttribute("alt") || "" };
        }),
        hojas.indexOf(e.target.closest(".diapo")),
        function (j) { ir(j); quieto = false; arrancar(); }
      );
    });

    marcar();
    arrancar();
  });

  /* ------------------------------------------------------ увеличение
     Один визор на всю страницу: стрелки, счётчик, клавиши, свайп. */

  var V = null;

  function abrirVisor(lista, desde, alCerrar) {
    if (!V) {
      V = document.createElement("div");
      V.className = "visor";
      V.setAttribute("role", "dialog");
      V.setAttribute("aria-modal", "true");
      V.setAttribute("aria-label", "Fotos");
      V.hidden = true;
      V.innerHTML =
        '<img class="visor-img" alt="">' +
        '<span class="visor-cuenta" aria-live="polite"></span>' +
        '<button type="button" class="visor-x" aria-label="Cerrar">×</button>';

      var a = boton("visor-izq", "Foto anterior", false);
      var b = boton("visor-der", "Foto siguiente", true);
      V.appendChild(a);
      V.appendChild(b);
      document.body.appendChild(V);

      V._img = V.querySelector(".visor-img");
      V._cue = V.querySelector(".visor-cuenta");
      V._x = V.querySelector(".visor-x");

      a.addEventListener("click", function () { V._ir(V._i - 1); });
      b.addEventListener("click", function () { V._ir(V._i + 1); });
      V._x.addEventListener("click", function () { V._cerrar(); });
      V.addEventListener("click", function (e) { if (e.target === V) V._cerrar(); });

      var x0 = null;
      V.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      V.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var d = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(d) > 40) V._ir(d < 0 ? V._i + 1 : V._i - 1);
      }, { passive: true });

      document.addEventListener("keydown", function (e) {
        if (V.hidden) return;
        if (e.key === "Escape") { e.preventDefault(); V._cerrar(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); V._ir(V._i - 1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); V._ir(V._i + 1); }
      });
    }

    var n = lista.length;
    var volver = document.activeElement;

    V._ir = function (j) {
      j = (j + n) % n;
      V._i = j;
      V._img.src = lista[j].src;
      V._img.alt = lista[j].alt;
      V._cue.textContent = (j + 1) + " / " + n;
      /* Соседние кадры заранее — иначе стрелка на мгновение показывает
         пустоту, а на телефоне и дольше. */
      [j + 1, j - 1].forEach(function (q) {
        var p = new Image();
        p.src = lista[(q + n) % n].src;
      });
    };

    V._cerrar = function () {
      V.hidden = true;
      document.documentElement.style.overflow = "";
      if (volver && volver.focus) volver.focus({ preventScroll: true });
      alCerrar(V._i);
    };

    V._ir(desde);
    V.hidden = false;
    document.documentElement.style.overflow = "hidden";
    V._x.focus();
  }
})();
