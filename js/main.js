// Сайт: мобильное меню, подсветка пункта меню, форма заявки, год в подвале.
(function () {
  'use strict';

  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  // Подсветка активного пункта меню при прокрутке
  var links = document.querySelectorAll('.nav__list a[href^="#"]');
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var link = byId[entry.target.id];
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  // Форма заявки: проверка полей и отправка в сервис, который шлёт письмо на почту
  var form = document.getElementById('request-form');
  if (form) {
    var summary = document.getElementById('form-summary');
    var done = document.getElementById('form-done');
    var submit = form.querySelector('[type="submit"]');
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var PHONE = /^\+?[\d\s()-]{10,20}$/;

    function setError(field, text) {
      var error = document.getElementById(field.id + '-error');
      if (error) error.textContent = text;
      if (text) {
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', field.id + '-error');
      } else {
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
      }
    }

    function isPhone(value) {
      return PHONE.test(value) && value.replace(/\D/g, '').length >= 10;
    }

    function validate() {
      var contact = form.elements.contact.value.trim();
      var errors = [
        [form.elements.name, form.elements.name.value.trim() ? '' : 'Укажите имя'],
        [form.elements.contact, !contact ? 'Укажите телефон или e-mail'
          : EMAIL.test(contact) || isPhone(contact) ? '' : 'Проверьте телефон или e-mail'],
        [form.elements.message, form.elements.message.value.trim() ? '' : 'Опишите задачу или вопрос'],
        [form.elements.consent, form.elements.consent.checked ? '' : 'Нужно согласие на обработку данных']
      ];
      var first = null;
      errors.forEach(function (item) {
        setError(item[0], item[1]);
        if (item[1] && !first) first = item[0];
      });
      if (first) first.focus();
      return !first;
    }

    function showSummary(text) {
      summary.textContent = text;
      summary.hidden = !text;
    }

    function showDone() {
      form.hidden = true;
      done.hidden = false;
      done.focus();
    }

    // Кнопки в блоке цен сразу подставляют тему обращения
    document.querySelectorAll('[data-topic]').forEach(function (link) {
      link.addEventListener('click', function () {
        form.elements.topic.value = link.getAttribute('data-topic');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showSummary('');
      if (!validate()) return;

      // Бот заполнил скрытое поле: показываем успех, письмо не отправляем
      if (form.elements.website.value) {
        showDone();
        return;
      }

      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        showSummary('Отправка заявок пока не подключена.');
        return;
      }

      var payload = {
        name: form.elements.name.value.trim(),
        contact: form.elements.contact.value.trim(),
        company: form.elements.company.value.trim(),
        topic: form.elements.topic.value,
        message: form.elements.message.value.trim(),
        consent: form.elements.consent.checked
      };

      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 20000);
      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Отправляем…';

      // text/plain: браузер не делает предварительный запрос OPTIONS к облачной функции
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok || data.success === false) throw new Error(data.message || response.status);
          showDone();
        });
      }).catch(function () {
        showSummary('Не удалось отправить заявку. Проверьте интернет и попробуйте ещё раз: всё, что вы ввели, осталось в форме.');
      }).finally(function () {
        clearTimeout(timer);
        submit.disabled = false;
        submit.textContent = label;
      });
    });
  }

  // Текущий год в подвале
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
