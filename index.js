// Настраиваем заголовки AJAX
$.ajaxSetup({
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
  });

  // Инициализация ползунка (slider-range)
  $(function () {
    $(".slider-range").slider({
      range: true,
      min: 0,
      max: 500,
      values: [75, 300],
      slide: function (event, ui) {
        $($(this).data().maxrange).val(ui.values[1]);
        $($(this).data().minrange).val(ui.values[0]);
      },
      create: function () {
        const ranger = this;
        $($(this).data().maxrange).on('change', function () {
          $(ranger).slider('values', 1, $(this).val());
        }).val(300);

        $($(this).data().minrange).on('change', function () {
          $(ranger).slider('values', 0, $(this).val());
        }).val(75);
      }
    });
  });

  // Глобальная переменная для отслеживания загрузки
  let is_loading = false;

  // Функция подгрузки следующей страницы (пагинация)
  function loadNext(obj, index) {
    const div = $('<div>');
    $('#cPage').val(index);
    obj.replaceWith(div);

    const data = $('#filterForm').serializeArray();
    $('#cPage').val(1);
    is_loading = true;

    // Исправляем опечатку: desponse → response
    $.post('', data, function (response) {
      div.replaceWith(response);
      setTimeout(() => {
        $(window).trigger('load');
      }, 100);
    }).always(function () {
      is_loading = false;
    });
  }

  // Обработчик клика по кнопке "Следующая страница"
  $(function () {
    $(document).on('click', '.nextPager', function () {
      loadNext($(this), $(this).data().rel);
      return false;
    });
  });

  // Автоподгрузка при скролле
  $(function () {
    let is_loading = false;
    $(window).on('scroll resize', function () {
      const scrollTop = 3200;
      const startLoad = $(document).height() - $(window).scrollTop();

      if ($('.nextPager').length && (scrollTop > startLoad) && !is_loading) {
        loadNext($('.nextPager'), $('.nextPager').data().rel);
      }
    }).triggerHandler('scroll');
  });

  // Переключение вида (card / row)
  $(function () {
    function switchSelector(aObject) {
      const mode = aObject.data().mode;
      // Скрываем/показываем нужные картинки
      $('.mode_selector img.activen').addClass('hidden');
      $('.mode_selector img.inactiven').removeClass('hidden');
      $('img.activen', aObject).removeClass('hidden');
      $('img.inactiven', aObject).addClass('hidden');

      if (mode === 'card') {
        $('#ItemContainer').removeClass('mode_rows').addClass('mode_cards');
      } else {
        $('#ItemContainer').removeClass('mode_cards').addClass('mode_rows');
      }
      return false;
    }

    $('.mode_selector a').on('click', function () {
      switchSelector($(this));
      return false;
    });

    $('.mode_selector img').on('click', function () {
      switchSelector($(this).parent());
      return false;
    });

    $('#sortByDescNameAnchor').on('click', function () {
      const sortByDescName = document.getElementById('sortByDescName');
      sortByDescName.value = sortByDescName.value !== 'true';

      document.getElementById('sortTypeId').value = "";
      document.getElementById('sortOrder').value = "";

      $('#filterForm').submit();
    });

    // dropdown
    $('.dropdown').click(function () {
      $(this).attr('tabindex', 1).focus();
      $(this).toggleClass('active');
      $(this).find('.dropdown-menu').slideToggle(300);
    });
    $('.dropdown').focusout(function () {
      $(this).removeClass('active');
      $(this).find('.dropdown-menu').slideUp(300);
    });
    $('.dropdown .dropdown-menu li').click(function () {
      $(this).parents('.dropdown').find('span').text($(this).text());
      $(this).parents('.dropdown').find('input').attr('value', $(this).attr('id'));
    });

    // фильтр
    $('.filter-arr').on('click', function () {
      $('#sort-arrow-up').hide();
      $('#sort-arrow-down').hide();

      $(this).hide();
      $('.msg').hide();

      $('#select-field').html($(this).html());

      const filterTypeId = document.getElementById('sortTypeId');
      filterTypeId.value = this.value;

      document.getElementById('sortOrder').value = "ASC";
      $('#filterForm').submit();
    });

    $('#sort-arrow-up').on('click', function () {
      $('#sort-arrow-down').show();
      document.getElementById('sortOrder').value = "DESC";
      $(this).hide();
      $('#filterForm').submit();
    });

    $('#sort-arrow-down').on('click', function () {
      $('#sort-arrow-up').show();
      document.getElementById('sortOrder').value = "ASC";
      $(this).hide();
      $('#filterForm').submit();
    });
  });

  // Разворачиваем/сворачиваем фильтры
  $(function () {
    let timer = null;

    $(".expandable_filter_group").click(function () {
      $(this).parent().next().toggleClass('hidden');
      $(this).toggleClass('icon-2-up').toggleClass('icon-2-down');
    });

    $("#filterForm").on('change', function () {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(function () {
        $('#filterForm').submit();
      }, 2000);
    });
  });

  // Сообщить об ошибке (Ctrl+Enter)
  $(function () {
    function showErrorFoundedForm(text) {
      $('[name=founded]', $('#errorFoundedForm')).val(text);
      $('#errorFoundedForm').modal('show');
    }

    $('#showErrorFoundedForm').on('click', function () {
      showErrorFoundedForm('');
      return false;
    });

    $('body').on('keyup', function (e) {
      if (e.ctrlKey && e.which === 13) {
        let wrong = '';
        if (document.getSelection) {
          wrong = document.getSelection().toString();
        } else if (document.selection) {
          wrong = document.selection.createRange().text;
        }
        wrong = $.trim(wrong);
        showErrorFoundedForm(wrong);
      }
    });
  });

  // Кнопка "вверх" и эффекты на vendor
  $(function () {
    $('#up_arrow').on('click', function () {
      $('html, body').animate({ scrollTop: 0 }, 500);
    });

    $('#vendors a').on('mouseover', function () {
      $('img', this).attr('src', $('img', this).attr('src').replace('_grayscale', '_colorized'));
    }).on('mouseout', function () {
      $('img', this).attr('src', $('img', this).attr('src').replace('_colorized', '_grayscale'));
    });
  });

  $(window).on('scroll', function () {
    if ($(this).scrollTop() >= 500) {
      $('#up_arrow').fadeIn(200);
    } else {
      $('#up_arrow').fadeOut(200);
    }
  });

  // Функция для отправки формы поиска
  function submitForm() {
    const form = document.getElementById("seach-form");
    if (form) form.submit();
  }

  