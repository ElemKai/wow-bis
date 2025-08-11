// Глобальные данные
let bisData = [];
let lootData = {};

// Загрузка данных
async function loadData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();

    window.bisData = data;

    // Группируем данные по боссам
    window.lootData = {};

    data.forEach(item => {
      const source = item.source || '';
      const bossMatch = source.match(/The War Within[^:]*: ([^,)]+)/);
      const boss = bossMatch ? bossMatch[1].trim() : null;

      if (boss) {
        if (!lootData[boss]) {
          lootData[boss] = [];
        }
        lootData[boss].push(item);
      }
    });

    // Заполняем классы
    const classSelect = document.getElementById('classSelect');
    const uniqueClasses = [...new Set(data.map(item => item.class))];
    uniqueClasses.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls;
      option.textContent = cls;
      classSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
  }
}

// Переключение режима
function switchView() {
  const mode = document.querySelector('input[name="viewMode"]:checked').value;
  document.getElementById('specControls').style.display = mode === 'spec' ? 'flex' : 'none';
  document.getElementById('bossControls').style.display = mode === 'boss' ? 'flex' : 'none';
  document.getElementById('result').innerHTML = '';
}

// Фильтрация спеков
function filterSpecs() {
  const classSelect = document.getElementById('classSelect');
  const specSelect = document.getElementById('specSelect');
  const selectedClass = classSelect.value;

  specSelect.innerHTML = '<option value="">Выберите спек</option>';

  if (!selectedClass) return;

  const specs = [...new Set(
    bisData
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

// Показываем BiS для спека
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

  const items = bisData.filter(
    item => item.class === selectedClass && item.spec === selectedSpec
  );

  renderItemList(items, resultDiv, `BiS для ${selectedClass} — ${selectedSpec}`);
}

// Показываем добычу с босса
function showLoot() {
  const bossSelect = document.getElementById('bossSelect');
  const resultDiv = document.getElementById('result');
  const boss = bossSelect.value;

  if (!boss) {
    resultDiv.innerHTML = '<p class="no-data">Выберите босса</p>';
    return;
  }

  const items = lootData[boss] || [];
  renderItemList(items, resultDiv, `Добыча с босса: ${boss}`);
}

// Отрисовка списка с иконками BiS-спеков
function renderItemList(items, container, title) {
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="no-data">Нет данных</p>';
    return;
  }

  // Группируем предметы (чтобы не дублировать)
  const uniqueItems = {};
  items.forEach(item => {
    if (!uniqueItems[item.id]) {
      uniqueItems[item.id] = { ...item, specs: [] };
    }
    uniqueItems[item.id].specs.push(`${item.class} — ${item.spec}`);
  });

  const itemList = Object.values(uniqueItems);

  let html = `<h2>${title}</h2>`;
  html += `
    <table class="bis-table">
      <thead>
        <tr>
          <th>Предмет</th>
          <th>ilvl</th>
          <th>BiS для</th>
        </tr>
      </thead>
      <tbody>
  `;

  itemList.forEach(item => {
    const isBis = item.specs.length > 0;
    const bisIcons = isBis
      ? item.specs.map(spec => `<span class="bis-tag" title="${spec}">${getSpecIcon(spec)}</span>`).join('')
      : '';

    html += `
      <tr>
        <td>
          <a href="https://www.wowhead.com/item=${item.id}" class="item-link" data-wowhead="item=${item.id}">
            ${item.name}
          </a>
        </td>
        <td>${item.ilvl}</td>
        <td>${bisIcons}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// Возвращаем иконку по спеку (можно заменить на изображения)
function getSpecIcon(spec) {
  const icons = {
    'Warrior — Arms': '⚔️',
    'Warrior — Fury': '🪓',
    'Warrior — Protection': '🛡️',
    'Druid — Balance': '🌙',
    'Druid — Feral': '🐅',
    'Druid — Guardian': '🐻',
    'Druid — Restoration': '🍃',
    'Priest — Discipline': '✨',
    'Priest — Holy': '✝️',
    'Priest — Shadow': '🌑',
    'Mage — Arcane': '🌀',
    'Mage — Fire': '🔥',
    'Mage — Frost': '❄️',
    'Monk — Brewmaster': '🍶',
    'Monk — Mistweaver': '💧',
    'Monk — Windwalker': '🌪️',
    'Hunter — Beast Mastery': '🏹',
    'Hunter — Marksmanship': '🎯',
    'Hunter — Survival': '🔪',
    'Demon Hunter — Havoc': '🪓',
    'Demon Hunter — Vengeance': '🔥',
    'Paladin — Holy': '⚔️',
    'Paladin — Protection': '🛡️',
    'Paladin — Retribution': '⚖️',
    'Evoker — Devastation': '🐉',
    'Evoker — Preservation': '💚',
    'Evoker — Augmentation': '⚡',
    'Rogue — Assassination': '🗡️',
    'Rogue — Outlaw': '🤠',
    'Rogue — Subtlety': '👤',
    'Death Knight — Blood': '🩸',
    'Death Knight — Frost': '🧊',
    'Death Knight — Unholy': '💀',
    'Warlock — Affliction': '🕷️',
    'Warlock — Demonology': '👺',
    'Warlock — Destruction': '🧨',
    'Shaman — Elemental': '⚡',
    'Shaman — Enhancement': '⚔️',
    'Shaman — Restoration': '🌊'
  };
  return icons[spec] || '❓';
}

// Загружаем данные при старте
window.onload = loadData;
