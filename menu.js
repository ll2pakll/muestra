// Гамбургер. В оригинале его открывает Interactivity API WordPress —
// целый модуль ради двух классов. Здесь те же классы ставятся руками,
// всё остальное делает CSS темы.
(function () {
  var cont = document.querySelector('.wp-block-navigation__responsive-container');
  if (!cont) return;
  var abrir = document.querySelector('.wp-block-navigation__responsive-container-open');
  var cerrar = document.querySelector('.wp-block-navigation__responsive-container-close');

  function estado(si) {
    cont.classList.toggle('has-modal-open', si);
    cont.classList.toggle('is-menu-open', si);
    document.documentElement.classList.toggle('has-modal-open', si);
  }
  if (abrir) abrir.addEventListener('click', function () { estado(true); });
  if (cerrar) cerrar.addEventListener('click', function () { estado(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') estado(false);
  });
  // Выпадающее меню. На десктопе его открывает наведение (правило темы),
  // а на телефоне открывать нечему: ядро показывает подменю только при
  // aria-expanded="true" у кнопки-стрелки. Ставим этот атрибут сами.
  cont.querySelectorAll('.wp-block-navigation-submenu__toggle').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var abierto = b.getAttribute('aria-expanded') === 'true';
      cont.querySelectorAll('.wp-block-navigation-submenu__toggle')
          .forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
      b.setAttribute('aria-expanded', abierto ? 'false' : 'true');
      // Под 767,5 px тема гасит подменю через display:none и показывает его
      // своим jQuery. jQuery тут нет, поэтому ставим display прямо в стиле
      // элемента — инлайновый стиль сильнее правила темы.
      cont.querySelectorAll('.wp-block-navigation__submenu-container')
          .forEach(function (u) { u.style.display = ''; });
      var sub = b.parentElement.querySelector('.wp-block-navigation__submenu-container');
      if (sub && !abierto) sub.style.display = 'flex';
    });
  });

  // Переход по ссылке внутри оверлея закрывает его.
  cont.addEventListener('click', function (e) {
    if (e.target.closest('a')) estado(false);
  });
})();

// Селектор «что сломалось». Уровни лежат в странице все сразу, лишние
// скрыты атрибутом hidden. Без JS каждая карточка — обычная ссылка на
// свою страницу, то есть выбор работает и с выключенными скриптами.
(function () {
  var sel = document.querySelector('[data-selector]');
  if (!sel) return;
  var niveles = sel.querySelectorAll('[data-nivel]');

  function mostrar(nombre) {
    for (var i = 0; i < niveles.length; i++) {
      niveles[i].hidden = niveles[i].getAttribute('data-nivel') !== nombre;
    }
  }
  sel.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-abre]');
    if (!a) return;
    e.preventDefault();
    mostrar(a.getAttribute('data-abre'));
    // Экран держим на заголовке секции: иначе после клика человек
    // смотрит в середину нового ряда и не видит, что вопрос сменился.
    var caja = sel.getBoundingClientRect();
    if (caja.top < 0) window.scrollTo({ top: window.scrollY + caja.top - 70 });
  });
})();
