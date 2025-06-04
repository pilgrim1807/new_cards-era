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

  // 2. Автоподгрузка по прокрутке
  function loadNextPage(page) {
    if (isLoading) return;
    isLoading = true;

    $('#cPage').val(page);
    const data = $filterForm.serializeArray();

    $('#pageContent').text(`Загрузка страницы № ${page}...`);

    $.post('', data, function (response) {
      $('#pageContent').html(response);
      currentPage = page;
      updatePaginationUI(page);
    }).always(() => {
      isLoading = false;
    });
  }

  // 3. Пагинация
  $(document).ready(function () {
    const minPage = 1;
    const maxPage = 7;
    let currentPage = parseInt($('.pagination_button.active').data('page')) || 1;
    let isPaginating = false;
  
    function updatePaginationUI(newPage) {
      $('.pagination_button').each(function () {
        const $btn = $(this);
        const pageAttr = $btn.data('page');
  
        $btn.removeClass('active').removeAttr('aria-current');
  
        if (!isNaN(parseInt(pageAttr))) {
          $btn.attr('aria-label', `Страница ${pageAttr}`);
        }
  
        if (parseInt(pageAttr) === newPage) {
          $btn.addClass('active')
            .attr('aria-current', 'page')
            .attr('aria-label', `Текущая страница, страница ${newPage}`);
        }
      });
  
      $('.pagination_button[data-page="prev"]').prop('disabled', newPage === minPage);
      $('.pagination_button[data-page="next"]').prop('disabled', newPage === maxPage);
    }
  
    function loadPage(page) {
      if (isPaginating || page < minPage || page > maxPage || page === currentPage) return;
      isPaginating = true;

  
      setTimeout(() => {
        $('#pageContent').text(``);
        currentPage = page;
        updatePaginationUI(page);
        isPaginating = false;
      }, 300);
    }
  
    $('.pagination_container').on('click', '.pagination_button', function (e) {
      e.preventDefault();
      if (isPaginating) return;
  
      const pageAttr = $(this).data('page');
  
      if (pageAttr === 'prev') {
        loadPage(currentPage - 1);
      } else if (pageAttr === 'next') {
        loadPage(currentPage + 1);
      } else if (!isNaN(parseInt(pageAttr))) {
        loadPage(parseInt(pageAttr));
      }
    });
  
 
  });

  // 4. Переключение отображения
  function switchMode($target) {
    const mode = $target.data('mode');
    if (!mode) return;

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

    const $container = $('#ItemContainer');
    if (mode === 'card') {
      $container.removeClass('mode_rows').addClass('mode_cards');
    } else if (mode === 'row') {
      $container.removeClass('mode_cards').addClass('mode_rows');
    }
  }

  $('.mode_selector').on('click', 'button, button img', function (e) {
    e.preventDefault();
    const $btn = $(this).closest('button');
    if ($btn.length) {
      switchMode($btn);
    }
  });

  // 5. Автоизменение размера select
  
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

    const minWidth = options.minWidth || 80;
    const maxWidth = options.maxWidth || 300;
    const extraPadding = options.extraPadding || 20;

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

  autoResizeSelect($selectSort[0], { minWidth: 100, maxWidth: 200, extraPadding: 30 });
  applyHoverEffect($selectSort[0]);

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

  // 6. Выпадающий список
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

  // 7. Стрелки сортировки
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

  // 8. Фильтры-секции раскрытие
  $(".expandable_filter_group").on('click', function () {
    $(this).parent().next().toggleClass('hidden');
    $(this).toggleClass('icon-2-up icon-2-down');
  });

  // 9. Отложенная отправка фильтра
  let filterTimer;
  $filterForm.on('change', function () {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => $filterForm.submit(), 2000);
  });

  // 10. Сообщить об ошибке
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

  // 11. Кнопка вверх
  $('#up_arrow').on('click', () => $('html, body').animate({ scrollTop: 0 }, 500));

  $(window).on('scroll', function () {
    $('#up_arrow').fadeToggle($(this).scrollTop() >= 500, 200);
  });

  // 12. Наведение на логотипы 
  $('#vendors a').hover(function () {
    const $img = $('img', this);
    $img.attr('src', $img.attr('src').replace('_grayscale', '_colorized'));
  }, function () {
    const $img = $('img', this);
    $img.attr('src', $img.attr('src').replace('_colorized', '_grayscale'));
  });

  // 13. Поиск 
  $('#seach-form').on('submit', function () {
    this.submit();
  });

  // 14. Сброс
  $('.reset-button').on('click', function (e) {
    e.preventDefault();

    $('#filterForm input[type="checkbox"]').each(function () {
      this.checked = false;
      $(this).trigger('change');
    });

    $('#filterForm').submit();
  });


});

