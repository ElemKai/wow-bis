// Загружаем данные из data.json
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    window.bisData = data;

    // Заполняем выпадающий список классов
    const classSelect = document.getElementById('classSelect');
    const uniqueClasses = [...new Set(data.map(item => item.class))];
    uniqueClasses.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls;
      option.textContent = cls;
      classSelect.appendChild(option);
    });
  })
  .catch(err => console.error('Ошибка загрузки данных:', err));

// Фильтрация спеков по классу
function filterSpecs() {
  const classSelect = document.getElementById('classSelect');
  const specSelect = document.getElementById('specSelect');
  const selectedClass = classSelect.value;

  specSelect.innerHTML = '<option value="">Выберите спек</option>';

  if (!selectedClass) return;

  const specs = [...new Set(
    window.bisData
      .filter(item => item.class === selectedClass)
      .map(item => item.spec)
  )];

  specs.forEach(spec => {
    const option = document.createElement('option');
    option.value = spec;
    option.textContent = spec;
    specSelect.appendChild(option);
  });
}

// Показываем BiS для выбранного класса и спека
function showBis() {
  const classSelect = document.getElementById('classSelect');
  const specSelect = document.getElementById('specSelect');
  const resultDiv = document.getElementById('result');

  const selectedClass = classSelect.value;
  const selectedSpec = specSelect.value;

  if (!selectedClass || !selectedSpec) {
    resultDiv.innerHTML = '<p class="no-data">Выберите класс и специализацию</p>';
    return;
  }

  const items = window.bisData.filter(
    item => item.class === selectedClass && item.spec === selectedSpec
  );

  if (items.length === 0) {
    resultDiv.innerHTML = '<p class="no-data">Нет данных для этой спеки</p>';
    return;
  }

  let tableHTML = `
    <h2>${selectedClass} — ${selectedSpec}</h2>
    <table class="bis-table">
      <thead>
        <tr>
          <th>Слот</th>
          <th>Предмет</th>
          <th>ilvl</th>
          <th>Источник</th>
        </tr>
      </thead>
      <tbody>
  `;

  items.forEach(item => {
    tableHTML += `
      <tr>
        <td class="slot">${item.slot}</td>
        <td><a href="https://www.wowhead.com/item=${item.id}" class="item-link" data-wowhead="item=${item.id}">${item.name}</a></td>
        <td>${item.ilvl}</td>
        <td>${item.source}</td>
      </tr>
    `;
  });

  tableHTML += `</tbody></table>`;
  resultDiv.innerHTML = tableHTML;
}