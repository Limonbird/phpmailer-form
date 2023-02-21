// Код для кастомизации селектов
// Создает "подменный" селект, прячет нативный, обновляет данные в скрытом селекте
// С поддержкой доступности (работает перемещнение с помощью клавиатуры)
// большая часть кода взята и доработана отсюда: https://codepen.io/jacob_124/pen/abbrrwE

const wrapElement = (element, { wrapper = 'div', className }) => {
  wrapper = document.createElement(wrapper);
  if (className) wrapper.classList.add(className);
  element.parentNode.prepend(wrapper); // prepend (добавить в начало) - чтобы label в итоге оказался под блоком-оберткой (т.к. он изначально в html был под селектом). Это для стилизации и для bindLabel().
  return wrapper.appendChild(element);
};

const bindLabel = (wrapper) => {
  const label = wrapper.nextElementSibling;
  label.onclick = () => wrapper.focus();
};

const handleClick = (e, wrapper) => {
  e.stopPropagation();
  closeSelected(wrapper);
  // вкл/выкл класс active. При включенном active список опций станет виден (display block)
  wrapper.classList.toggle('custom-select--active');
};

const closeSelected = (el) => {
  // Close all other select boxes except for the el past as an argument
  Array.from(document.querySelectorAll('.custom-select--active'))
    .filter((item) => item !== el)
    .forEach((item) => item.classList.remove('custom-select--active'));
};

(() => {
  const selectList = document.querySelectorAll('select');

  Array.from(selectList).forEach((selectListItem) => {
    // оборачиваем селект в div с классом .custom-select. функция wrapElement() вынесена ниже
    wrapElement(selectListItem, { className: 'custom-select' });

    // переменная для работы с этой оберткой
    const selectWrapper = selectListItem.parentNode;

    // добавляем лейблу действие по клику - поставить фокус на кастомный селект
    bindLabel(selectWrapper);

    // скрываем оригинальный селект
    selectListItem.style.display = 'none';

    // включаем фокусировку (можно выбрать табом) у обертки (т.к. это div и фокусировки по умолчанию у него нет)
    selectWrapper.setAttribute('tabindex', '0');

    // добавляем в обертку блок - то что мы видим в свернутом состоянии - имитация кнопки для раскрытия списка и выбранная опция на ней.
    const customSelectButton = document.createElement('div');
    customSelectButton.className = 'custom-select__button';
    customSelectButton.innerHTML = selectListItem.options[selectListItem.selectedIndex].innerHTML; // у текущего <select> заходим в options (там массив), обращаемся по selectedIndex (поле из options) к нужной опции и берем оттуда innerHTML
    selectWrapper.append(customSelectButton);

    // добавляем в обертку блок для списка опций
    const customSelectList = document.createElement('div');
    customSelectList.className = 'custom-select__list';

    // удаляем опции с атрибутом hidden и disabled. Эти атрибуты могли быть добавлены в оригинальный <option> без value. Это делается, чтобы на кнопке селекта изначально был текст, например "Выберите опцию". Для моего примера не нужно, но может пригодится.
    // пример: <option value="" selected disabled>Select an Option</option>
    Array.from(selectListItem.children).forEach((item) => {
      if (item.hasAttribute('hidden') || item.hasAttribute('disabled')) item.remove();
    });

    // получаем массив опций из оригинального селекта
    const optionList = Array.from(selectListItem);
    // выполнить для каждого элемента в массиве оригинальных опций
    optionList.forEach((item, index) => {
      // создаем (пока в памяти) кастомную опцию с innerHTML оригинальной
      const customSelectOption = document.createElement('div');
      customSelectOption.className = 'custom-select__option';
      customSelectOption.innerHTML = item.innerHTML;

      // добавляем класс active созданной кастомной опции (если был selected в оригинальной)
      if (index === selectListItem.selectedIndex) {
        customSelectOption.classList.add('custom-select__option--selected');
      }

      // по клику на кастомную опцию
      customSelectOption.addEventListener('click', () => {
        // задаем текст у псевдо-кнопки
        customSelectButton.innerHTML = customSelectOption.innerHTML;
        // заходим в оригинальный список опций
        optionList.forEach((item, index) => {
          // находим оригинальную опцию у которой innerHTML равен выбранной кастомной
          if (item.innerHTML === customSelectOption.innerHTML) {
            // ПЕРЕЗАПИСЫВАЕМ ЗНАЧЕНИЕ selectedIndex в оригинальном селекте на выбранное из кастомного
            selectListItem.selectedIndex = index;
            // удаляем класс active там где он был раньше (у кастомной опции)
            Array.from(customSelectOption.parentNode.querySelectorAll('.custom-select__option--selected')).forEach(
              (item) => item.classList.remove('custom-select__option--selected')
            );
            // и добавляем класс active к текущей кастомной опции
            customSelectOption.classList.add('custom-select__option--selected');
          }
        });
      });

      // добавляем кастомную опцию с навешенным событием в список кастомный опций
      customSelectList.append(customSelectOption);
    });

    // добавляем список опций в блок-обертку
    selectWrapper.append(customSelectList);

    // когда кликнули на псевдо-кнопку вызываем обработчик handleClick
    customSelectButton.addEventListener('click', (e) => {
      handleClick(e, selectWrapper);
    });

    // навешиваем на обертку слушатель события keydown
    selectWrapper.addEventListener('keydown', (e) => {
      let index = selectListItem.selectedIndex; // индекс выбранной опции в оригинальном селекте
      switch (e.which) {
        case 13: // ENTER
        case 32: // SPACE
          // то же поведение, что и клик
          handleClick(e, selectWrapper);
          break;
        case 38: // UP
          if (--index < 0) index = selectListItem.options.length - 1;
          selectListItem.selectedIndex = index;
          updateFromKeyDown();
          selectWrapper.classList.add('custom-select--active'); // класс active делает список опций видимыми
          break;
        case 40: // DOWN
          if (++index > selectListItem.options.length - 1) index = 0;
          selectListItem.selectedIndex = index;
          updateFromKeyDown();
          selectWrapper.classList.add('custom-select--active');
          break;
        case 27: // ESC
        case 9: // TAB
          selectWrapper.classList.remove('custom-select--active');
          break;
        case 35: // END
          selectListItem.selectedIndex = 0;
          updateFromKeyDown();
          selectWrapper.classList.add('custom-select--active');
          break;
        case 36: // HOME
          selectListItem.selectedIndex = selectListItem.options.length - 1;
          updateFromKeyDown();
          selectWrapper.classList.add('custom-select--active');
          break;
      }
    });

    const updateFromKeyDown = () => {
      const index = selectListItem.selectedIndex;
      customSelectButton.innerHTML = selectListItem.options[index].innerHTML;
      Array.from(customSelectList.querySelectorAll('.custom-select__option')).forEach((item, itemIndex) => {
        if (index === itemIndex) item.classList.add('custom-select__option--selected');
        else item.classList.remove('custom-select__option--selected');
      });
    };
  });

  // по reset формы обновить текст на кнопке
  const formList = document.querySelectorAll('form');
  Array.from(formList).forEach((formListItem) => {
    formListItem.addEventListener('reset', () => {
      const customSelectButtonList = formListItem.querySelectorAll('.custom-select__button');
      Array.from(customSelectButtonList).forEach((customSelectButtonListItem) => {
        const closestSelect = customSelectButtonListItem.closest('.custom-select').querySelector('select');
        setTimeout(() => {
          customSelectButtonListItem.innerHTML = closestSelect.options[closestSelect.selectedIndex].innerHTML;
        }, 100);
      });
    });
  });

  // скрывать список опций по клику вне селекта
  document.addEventListener('click', closeSelected);
})();
