const removeError = (element) => {
  const errorSpan = element.parentNode.querySelector('.error-msg');
  if (errorSpan) errorSpan.remove();

  element.classList.remove('has-error');
};

const addError = (element, message = '') => {
  const errorSpan = document.createElement('span');
  errorSpan.classList.add('error-msg');
  errorSpan.textContent = message || element.validationMessage;
  element.parentNode.appendChild(errorSpan);

  element.classList.add('has-error');
};

const checkErrors = (form) => {
  const errorList = form.querySelectorAll('.has-error');
  return errorList.length === 0;
};

const addWarning = (element) => {
  removeWarning();

  const warningSpan = document.createElement('span');
  warningSpan.innerHTML = 'Пожалуйста, проверьте правильность заполнения формы.';
  warningSpan.classList.add('form-layout__warning');
  element.after(warningSpan);
};

const removeWarning = () => {
  const warningSpan = document.querySelector('.form-layout__warning');
  if (warningSpan) warningSpan.remove();
};

const addLoader = (element) => {
  const loader = document.createElement('div');
  loader.classList.add('loader');
  element.append(loader);
};

const removeLoader = () => {
  const loader = document.querySelector('.loader');
  if (loader) loader.remove();
};

const validateEmail = (value) => {
  // регулярку взяла здесь: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
  return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
    value
  );
};

const validateFormElement = (element) => {
  removeError(element);

  switch (element.name) {
    case 'name':
      if (element.value === '') addError(element, 'Пожалуйста, укажите ваше имя.');
      break;
    case 'email':
      if (element.value === '') addError(element, 'Пожалуйста, введите адрес электронной почты.');
      else if (!validateEmail(element.value))
        addError(element, 'Пожалуйста, введите корректный адрес электронной почты.');
      break;
    case 'message':
      if (element.value === '') addError(element, 'Пожалуйста, заполните поле.');
      break;
    case 'image':
      if (element.value === '') addError(element, 'Пожалуйста, загрузите фотографию.');
      else if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif',].includes(element.files[0].type)) {
        addError(element, 'Пожалуйста, загрузите изображение в одном из форматов: jpeg, jpg, png, gif.');
      } else if (element.files[0].size > 1024 * 1024 * 2)
        addError(element, 'Пожалуйста, загрузите изображение до 2МБ.');
      break;
    case 'agreement':
      if (!element.checked) addError(element, 'Пожалуйста, подтвердите ваше согласие.');
      break;
    default:
      if (!element.validity.valid) addError(element);
      break;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const submitButton = form.querySelector('button[type="submit"]');

  const imageInput = document.getElementById('form-image');
  const imagePreview = document.getElementById('image-preview');
  const fileButton = document.getElementById('file-button');

  const inputList = form.querySelectorAll('input');
  const textareaList = form.querySelectorAll('textarea');

  const formElementList = [...inputList, ...textareaList];

  // по сабмиту - проверяем все поля формы
  form.addEventListener('submit', async (event) => {
    // предотвращаем автоматическую отправку
    event.preventDefault();

    // проверяем каждый элемент (добавит класс с ошибкой и текст ошибки)
    formElementList.forEach((element) => {
      validateFormElement(element);
    });

    // проверяем, есть ли элементы с ошибками
    const isFormValid = checkErrors(form);

    if (!isFormValid) {
      submitButton.disabled = true;
      addWarning(submitButton);
    } else {
      submitButton.disabled = false;
      removeWarning();
      addLoader(form);
      // ОТПРАВКА ДАННЫХ
      const data = new FormData(form);
      try {
        const response = await fetch('sendmail.php', {
          method: 'POST',
          body: data,
        });
        if (response.ok) {
          const result = await response.json();
          let message = result.result;
          if (result.status) {
            message = `${message}${'\n\n'}${result.status}`
          }
          alert(message);
          imagePreview.innerHTML = '';
          fileButton.innerHTML = 'Добавить';
          form.reset();
          removeLoader();
        }
      } catch (error) {
        alert(`Произошла ошибка при отправке данных.${'\n\n'}${error}`);
        removeLoader();
      }
    }
  });

  // по change на каждом поле формы - проверяем поле (чтобы ошибка была видна еще до сабмита)
  formElementList.forEach((element) => {
    element.addEventListener('change', () => {
      validateFormElement(element);

      const isFormValid = checkErrors(form);

      if (!isFormValid) {
        submitButton.disabled = true;
        addWarning(submitButton);
      } else {
        submitButton.disabled = false;
        removeWarning();
      }
    });
  });

  // вывод превью изображения
  imageInput.addEventListener('change', () => {
    if (!imageInput.classList.contains('has-error')) {
      const file = imageInput.files[0];

      imagePreview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="${file.name}" title="${file.name}">`;
      fileButton.innerHTML = 'Изменить';
    }
  });
});
