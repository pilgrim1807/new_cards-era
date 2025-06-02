// Настройка CSRF для AJAX
$.ajaxSetup({
  headers: {
    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
  }
});

let isLoading = false;

$(function () {
  const $filterForm = $('#filterForm');
  const $selectSort = $('#sortByDescNameAnchor');
  const STORAGE_KEY = "sortSelectValue";

  // 1. Слайдер диапазона
  $(".slider-range").each(function () {
    const $slider = $(this);
    const minInput = $($slider.data("minrange"));
    const maxInput = $($slider.data("maxrange"));

    $slider.slider({
      range: true,
      min: 0,
      max: 500,
      values: [75, 300],
      slide: (event, ui) => {
        minInput.val(ui.values[0]);
        maxInput.val(ui.values[1]);
      },
      create: () => {
        minInput.on('change', () => $slider.slider('values', 0, minInput.val())).val(75);
        maxInput.on('change', () => $slider.slider('values', 1, maxInput.val())).val(300);
      }
    });
  });

  //2. Автоподгрузка по прокрутке 
  function loadNext($trigger, page) {
    if (isLoading) return;
    isLoading = true;

    const $placeholder = $('<div>');
    $('#cPage').val(page);
    $trigger.replaceWith($placeholder);

    const data = $filterForm.serializeArray();
    $('#cPage').val(1);

    $.post('', data, function (response) {
      $placeholder.replaceWith(response);
      setTimeout(() => $(window).trigger('load'), 100);
    }).always(() => {
      isLoading = false;
    });
  }

  $(document).on('click', '.nextPager', function () {
    loadNext($(this), $(this).data('rel'));
    return false;
  });

  $(window).on('scroll resize', function () {
    const trigger = $('.nextPager');
    if (!trigger.length || isLoading) return;

    const scrollBottom = $(document).height() - $(window).scrollTop();
    if (scrollBottom < 3200) {
      loadNext(trigger, trigger.data('rel'));
    }
  }).triggerHandler('scroll');

  // 3. Переключение отображения
  function switchMode($target) {
    const mode = $target.data('mode');
    if (!mode) return;

    // Перебираем все кнопки с режимами
    $('.mode_selector button').each(function () {
      const $btn = $(this);
      const currentMode = $btn.data('mode');

      if (currentMode === mode) {
        $btn.find('img.activen').removeClass('hidden');
        $btn.find('img.inactiven').addClass('hidden');
      } else {
        $btn.find('img.activen').addClass('hidden');
        $btn.find('img.inactiven').removeClass('hidden');
      }
    });

    // Переключаем класс у контейнера
    const $container = $('#ItemContainer');
    if (mode === 'card') {
      $container.removeClass('mode_rows').addClass('mode_cards');
    } else if (mode === 'row') {
      $container.removeClass('mode_cards').addClass('mode_rows');
    }
  }

  // Обработчик клика на кнопках и изображениях внутри них
  $('.mode_selector').on('click', 'button, button img', function (e) {
    e.preventDefault();
    const $btn = $(this).closest('button');
    if ($btn.length) {
      switchMode($btn);
    }
  });

  // 4. Сортировка по выпадающему select

  function autoResizeSelect(select, options = {}) {
    let temp = document.getElementById("select-width-measure");
    if (!temp) {
      temp = document.createElement("span");
      temp.id = "select-width-measure";
      temp.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font: inherit;
        padding: 0;
        margin: 0;
      `;
      document.body.appendChild(temp);
    }

    temp.textContent = select.options[select.selectedIndex].text;

    const style = window.getComputedStyle(select);
    const paddingLeft = parseInt(style.paddingLeft) || 0;
    const paddingRight = parseInt(style.paddingRight) || 0;

    // Опции: minWidth, maxWidth, extraPadding
    const minWidth = options.minWidth || 80;
    const maxWidth = options.maxWidth || 300; // максимальная ширина в px
    const extraPadding = options.extraPadding || 20; // запас для стрелки и отступов

    let width = temp.offsetWidth + paddingLeft + paddingRight + extraPadding;

    if (width < minWidth) width = minWidth;
    if (width > maxWidth) width = maxWidth;

    select.style.width = width + "px";
  }

  function applyHoverEffect(select) {
    select.addEventListener('mouseenter', () => {
      select.classList.add('custom-hover');
    });
    select.addEventListener('mouseleave', () => {
      select.classList.remove('custom-hover');
    });
  }

  // Применяем сохранённое значение
const savedSort = localStorage.getItem(STORAGE_KEY);
if (savedSort && $selectSort.find(`option[value="${savedSort}"]`).length) {
  $selectSort.val(savedSort);
}

document.querySelectorAll('.custom-select').forEach(customSelect => {
  const trigger = customSelect.querySelector('.custom-select__trigger');
  const options = customSelect.querySelectorAll('.custom-option');
  const hiddenSelect = customSelect.previousElementSibling;

  trigger.addEventListener('click', () => {
    customSelect.classList.toggle('open');
  });

  options.forEach(option => {
    option.addEventListener('click', () => {
      options.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      trigger.textContent = option.textContent;
      hiddenSelect.value = option.getAttribute('data-value');
      hiddenSelect.dispatchEvent(new Event('change'));
      customSelect.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('open');
    }
  });
});
  
// Устанавливаем начальную ширину
autoResizeSelect($selectSort[0], { minWidth: 100, maxWidth: 200, extraPadding: 30 });
applyHoverEffect($selectSort[0]);


  // Гибкая подгонка ширины с настройками
  autoResizeSelect($selectSort[0], { minWidth: 100, maxWidth: 200, extraPadding: 30 });

  $selectSort.on('change', function () {
    const selected = $(this).val();
    localStorage.setItem(STORAGE_KEY, selected);

    autoResizeSelect(this, { minWidth: 100, maxWidth: 200, extraPadding: 30 });

    $filterForm.stop().fadeTo(200, 0.5);
    setTimeout(() => {
      $filterForm.trigger('submit').fadeTo(300, 1);
    }, 300);
  });


  //5. Выпадающий список
  $('.dropdown').on('click', function () {
    const $dropdown = $(this);
    $dropdown.toggleClass('active').find('.dropdown-menu').slideToggle(300);
    $dropdown.focus();
  }).on('focusout', function () {
    $(this).removeClass('active').find('.dropdown-menu').slideUp(300);
  });

  $('.dropdown .dropdown-menu li').on('click', function () {
    const $item = $(this);
    $item.closest('.dropdown').find('span').text($item.text());
    $item.closest('.dropdown').find('input').val($item.attr('id'));
  });

  // 6. Стрелки сортировки
  $('.filter-arr').on('click', function () {
    $('#sort-arrow-up, #sort-arrow-down, .msg').hide();
    $('#select-field').html($(this).html());
    $('#sortTypeId').val(this.value);
    $('#sortOrder').val("ASC");
    $filterForm.submit();
  });

  $('#sort-arrow-up').on('click', function () {
    $('#sort-arrow-down').show();
    $('#sortOrder').val("DESC");
    $(this).hide();
    $filterForm.submit();
  });

  $('#sort-arrow-down').on('click', function () {
    $('#sort-arrow-up').show();
    $('#sortOrder').val("ASC");
    $(this).hide();
    $filterForm.submit();
  });

  //7. Фильтры-секции раскрытие
  $(".expandable_filter_group").on('click', function () {
    $(this).parent().next().toggleClass('hidden');
    $(this).toggleClass('icon-2-up icon-2-down');
  });

  //8. Отложенная отправка фильтра
  let filterTimer;
  $filterForm.on('change', function () {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => $filterForm.submit(), 2000);
  });

  //9. Сообщить об ошибке
  function showErrorFoundedForm(text = '') {
    $('#errorFoundedForm').find('[name=founded]').val(text).end().modal('show');
  }

  $('#showErrorFoundedForm').on('click', function () {
    showErrorFoundedForm();
    return false;
  });

  $('body').on('keyup', function (e) {
    if (e.ctrlKey && e.which === 13) {
      const selection = window.getSelection().toString().trim();
      if (selection) showErrorFoundedForm(selection);
    }
  });

  //10. Кнопка вверх
  $('#up_arrow').on('click', () => $('html, body').animate({ scrollTop: 0 }, 500));

  $(window).on('scroll', function () {
    $('#up_arrow').fadeToggle($(this).scrollTop() >= 500, 200);
  });

  // 11. Наведение на логотипы 
  $('#vendors a').hover(function () {
    const $img = $('img', this);
    $img.attr('src', $img.attr('src').replace('_grayscale', '_colorized'));
  }, function () {
    const $img = $('img', this);
    $img.attr('src', $img.attr('src').replace('_colorized', '_grayscale'));
  });

  //  12. Поиск 
  $('#seach-form').on('submit', function () {
    this.submit();
  });


   // 13. Сброс
   $(function () {
    $(document).on('click', '.reset-button', function (e) {
      e.preventDefault();
      console.log('Сброс работает');
  
      const $form = $('#filterForm');
  
      $form.find('input[type="checkbox"]').prop('checked', false);
  
      $form.find('input[type="text"], input[type="number"]').val('');
      $form.find('select').prop('selectedIndex', 0);
  
      $('.custom-select').each(function () {
        const $custom = $(this);
        const $firstOption = $custom.find('.custom-option').first();
        const $trigger = $custom.find('.custom-select__trigger');
        const $hidden = $custom.prev('select');
  
        $trigger.text($firstOption.text());
        $hidden.val($firstOption.data('value')).trigger('change');
        $custom.find('.custom-option').removeClass('selected');
        $firstOption.addClass('selected');
      });
  
      $('.slider-range').each(function () {
        const $slider = $(this);
        const minInput = $($slider.data("minrange"));
        const maxInput = $($slider.data("maxrange"));
  
        $slider.slider('values', [75, 300]);
        minInput.val(75);
        maxInput.val(300);
      });
  
      localStorage.removeItem("sortSelectValue");
  
      $form.trigger('submit');
    });
  });

});