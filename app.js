// Безопасно получаем объект Telegram WebApp (чтобы страница работала и в обычном браузере)
const tg = window.Telegram ? window.Telegram.WebApp : null;

document.addEventListener("DOMContentLoaded", () => {
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const tabs = document.querySelectorAll(".tab");
  const walletForm = document.getElementById("wallet-form");
  const txForm = document.getElementById("tx-form");
  const loadingBlock = document.getElementById("loading");
  const resultBlock = document.getElementById("result");

  const riskLabel = document.getElementById("risk-label");
  const riskScore = document.getElementById("risk-score");
  const riskMeta = document.getElementById("risk-meta");
  const riskList = document.getElementById("risk-list");
  const gaugeFill = document.getElementById("gauge-fill");
  const gaugePercent = document.getElementById("gauge-percent");

  const btnPdf = document.getElementById("btn-pdf");
  const btnNew = document.getElementById("btn-new");

  // Переключение вкладок
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const tabName = tab.dataset.tab;
      if (tabName === "wallet") {
        walletForm.classList.add("active");
        txForm.classList.remove("active");
      } else {
        walletForm.classList.remove("active");
        txForm.classList.add("active");
      }

      // При переключении возвращаемся к форме
      showSection("form");
    });
  });

  // Обработчик формы кошелька
  walletForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const coin = walletForm.elements["coin"].value;
    const network = walletForm.elements["network"].value;
    const address = walletForm.elements["address"].value.trim();

    startCheck({
      type: "wallet",
      coin,
      network,
      value: address,
    });
  });

  // Обработчик формы транзакции
  txForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const coin = txForm.elements["coin"].value;
    const network = txForm.elements["network"].value;
    const txhash = txForm.elements["txhash"].value.trim();

    startCheck({
      type: "tx",
      coin,
      network,
      value: txhash,
    });
  });

  // Кнопка "Новая проверка"
  btnNew.addEventListener("click", () => {
    walletForm.reset();
    txForm.reset();
    showSection("form");
  });

  // Кнопка "Скачать PDF"
  btnPdf.addEventListener("click", () => {
    // Пока просто открываем пример. Здесь позже подставишь URL с бэкенда.
    window.open("https://example.com/sample-aml-report.pdf", "_blank");
  });

  // Функция начала проверки
  function startCheck(payload) {
    showSection("loading");

    // Отправка данных в бота (по желанию)
    if (tg) {
      tg.sendData(JSON.stringify(payload));
    }

    // Имитируем запрос к AML-сервису
    setTimeout(() => {
      const fake = makeFakeResult(payload);
      showResult(fake);
    }, 2000);
  }

  // Переключение секций внутри карточки
  function showSection(section) {
    if (section === "form") {
      loadingBlock.style.display = "none";
      resultBlock.style.display = "none";
    } else if (section === "loading") {
      loadingBlock.style.display = "block";
      resultBlock.style.display = "none";
    } else if (section === "result") {
      loadingBlock.style.display = "none";
      resultBlock.style.display = "block";
    }
  }

  // Генерим фейковый скоринг
  function makeFakeResult({ type, coin, network, value }) {
    // На основе длины value делаем "псевдослучайный" процент
    let sum = 0;
    for (let i = 0; i < value.length; i++) {
      sum += value.charCodeAt(i);
    }
    const percent = (sum % 90) + 5; // 5–95%

    let level = "Низкий";
    let color = "#2ecc71";
    if (percent >= 70) {
      level = "Высокий";
      color = "#e74c3c";
    } else if (percent >= 40) {
      level = "Средний";
      color = "#f1c40f";
    }

    const reasonsLow = [
      "Не выявлено связей с даркнет-рынками.",
      "Отсутствуют поступления с известных мошеннических адресов.",
      "История транзакций умеренная и распределённая.",
    ];

    const reasonsMid = [
      "Замечены переводы с малоизвестных бирж.",
      "Небольшая доля средств прошла через анонимные сервисы.",
      "Обнаружены поступления от адресов с повышенным риском.",
    ];

    const reasonsHigh = [
      "Значительная часть средств связана с адресами из санкционных списков.",
      "Обнаружены переводы от крупных взломанных кошельков.",
      "Множественные транзакции через миксеры и анонимные сервисы.",
    ];

    const reasons =
      level === "Высокий"
        ? reasonsHigh
        : level === "Средний"
        ? reasonsMid
        : reasonsLow;

    return {
      level,
      color,
      percent,
      score: `${percent}/100`,
      coin,
      network,
      type,
      reasons,
    };
  }

  // Отрисовка результата
  function showResult(result) {
    riskLabel.textContent = `Риск: ${result.level}`;
    riskLabel.style.color = result.color;

    riskScore.textContent = `Скоринг: ${result.score}`;
    riskMeta.textContent = `Монета: ${result.coin} • Сеть: ${result.network}`;
    gaugePercent.textContent = `${result.percent}%`;

    // Поворачиваем "заглушку" так, чтобы открытая часть соответствовала проценту
    const angle = (result.percent / 100) * 180; // 0–180
    gaugeFill.style.transform = `rotate(${angle}deg)`;

    // Заполняем список рисков
    riskList.innerHTML = "";
    result.reasons.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = r;
      riskList.appendChild(li);
    });

    showSection("result");
  }

  // Изначально показываем только формы
  showSection("form");
});
