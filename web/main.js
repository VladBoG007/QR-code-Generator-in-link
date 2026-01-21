const urlInput = document.getElementById("url-input");
const generateBtn = document.getElementById("generate-btn");
const qrGrid = document.getElementById("qr-grid");
const toastEl = document.getElementById("toast");

function showToast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.classList.remove("error");
  if (isError) toastEl.classList.add("error");
  toastEl.classList.add("show");
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}

async function loadLibrary() {
  try {
    const items = await eel.list_qr_codes()();
    renderGrid(items);
  } catch (e) {
    console.error(e);
    showToast("Ошибка загрузки библиотеки", true);
  }
}

function renderGrid(items) {
  qrGrid.innerHTML = "";
  if (!items || items.length === 0) {
    qrGrid.innerHTML =
      '<div style="opacity:0.6;font-size:13px;">Пока нет сохранённых QR-кодов</div>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "qr-card";

    const header = document.createElement("div");
    header.className = "qr-card-header";

    const date = document.createElement("div");
    date.className = "qr-card-date";
    const dot = document.createElement("div");
    dot.className = "qr-card-date-icon";
    const text = document.createElement("span");
    text.textContent = item.created_at;
    date.appendChild(dot);
    date.appendChild(text);

    header.appendChild(date);

    const body = document.createElement("div");
    body.className = "qr-card-body";
    const img = document.createElement("img");
    img.src = "data:image/png;base64," + item.img_b64;
    img.alt = item.file_name;
    body.appendChild(img);

    const footer = document.createElement("div");
    footer.className = "qr-card-footer";

    const filename = document.createElement("div");
    filename.className = "filename";
    filename.textContent = item.file_name;

    const btnCopy = document.createElement("a");
    btnCopy.className = "btn-copy";
    btnCopy.textContent = "Скопировать";
    btnCopy.addEventListener("click", () => copyImageToClipboard(img));

    footer.appendChild(btnCopy);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);

    qrGrid.appendChild(card);
  });
}

async function onGenerateClick() {
  const url = urlInput.value.trim();
  if (!url) {
    showToast("Введите ссылку", true);
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Генерация...";

  try {
    const result = await eel.generate_qr(url)();
    if (!result.success) {
      showToast(result.error || "Ошибка генерации", true);
    } else {
      showToast("QR-код создан");
      await loadLibrary();
      urlInput.value = "";
    }
  } catch (e) {
    console.error(e);
    showToast("Ошибка генерации", true);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Сгенерировать";
  }
}

async function copyImageToClipboard(imgElement) {
  try {
    if (!("clipboard" in navigator) || typeof ClipboardItem === "undefined") {
      showToast("Буфер обмена для картинок не поддерживается", true);
      return;
    }

    const response = await fetch(imgElement.src);
    const blob = await response.blob();

    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);

    showToast("Картинка скопирована в буфер");
  } catch (err) {
    console.error(err);
    showToast("Не удалось скопировать изображение", true);
  }
}


urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    onGenerateClick();
  }
});

generateBtn.addEventListener("click", onGenerateClick);

window.addEventListener("load", loadLibrary);
