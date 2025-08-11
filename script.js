// Глобальные переменные
let bisData = [];
let lootData = {};

// Загрузка данных
async function loadData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`Не удалось загрузить data.json: ${response.status}`);
    }
    const data = await response.json();

    window.bisData = data;
    window.lootData = {};

    // Группируем по боссам
    data.forEach(item => {
      const source = item.source || '';
      const bossMatch = source.match(/The War Within\s*-\s*(.+)/);
      const boss = bossMatch ? bossMatch[1].trim() : 'Unknown Boss';

      if (!lootData[boss]) {
        lootData[boss] = [];
      }
      lootData[boss].push(item);
    });

    // Заполняем классы
    const classSelect = document.getElementById('classSelect');
    const uniqueClasses = [...new Set(data.map(item => item.class))].sort();
    
    uniqueClasses.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls;
      option.textContent = cls;
      classSelect.appendChild(option);
    });

    // Заполняем боссов
    const bossSelect = document.getElementById('bossSelect');
    const bosses = Object.keys(lootData).sort();
    bosses.forEach(boss => {
      const option = document.createElement('option');
      option.value = boss;
      option.textContent = boss;
      bossSelect.appendChild(option);
    });

    console.log('✅ Данные загружены:', bisData.length, 'предметов');
  } catch (err) {
    console.error('❌ Ошибка:', err);
    document.getElementById('result').innerHTML = `
      <p class="no-data">
        <strong>Ошибка загрузки данных:</strong><br>
        ${err.message}<br><br>
        Проверь:<br>
        • Существует ли <code>data.json</code><br>
        • Валидный ли JSON (нет запятых после последнего элемента)<br>
        • Запущен ли через сервер (не file://)
      </p>
    `;
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

  // Нормализуем сравнение (на всякий случай)
  const specs = [...new Set(
    bisData
      .filter(item => item.class === selectedClass)
      .map(item => item.spec)
  )].sort();

  if (specs.length === 0) {
    console.warn(`⚠️ Для класса "${selectedClass}" не найдено ни одной специализации`);
  }

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

  renderItemList(items, resultDiv, `BiS: ${selectedClass} — ${selectedSpec}`);
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
  renderItemList(items, resultDiv, `Добыча: ${boss}`);
}

// Отрисовка списка
function renderItemList(items, container, title) {
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="no-data">Нет предметов</p>';
    return;
  }

  // Убираем дубли по ID
  const seen = new Set();
  const uniqueItems = [];
  items.forEach(item => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      uniqueItems.push(item);
    }
  });

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

  uniqueItems.forEach(item => {
    // Находим все спеки, для которых этот предмет — BiS
    const bisSpecs = bisData
      .filter(i => i.id === item.id)
      .map(i => `${i.class} — ${i.spec}`);

    const bisIcons = bisSpecs.length > 0
      ? bisSpecs.map(spec => `<span class="bis-tag" title="${spec}">${getSpecIcon(spec)}</span>`).join('')
      : '—';

    html += `
      <tr>
        <td>
          <a href="https://www.wowhead.com/item=${item.id}" 
             class="item-link" 
             data-wowhead="item=${item.id}">
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

// Иконки спеков
function getSpecIcon(spec) {
  const iconMap = {
    'Warrior — Arms': 'Warrior-Arms.png',
    'Warrior — Fury': 'Warrior-Fury.png',
    'Warrior — Protection': 'Warrior-Protection.png',
    'Druid — Balance': 'Druid-Balance.png',
    'Druid — Feral': 'Druid-Feral.png',
    'Druid — Guardian': 'Druid-Guardian.png',
    'Druid — Restoration': 'Druid-Restoration.png',
    'Priest — Discipline': 'Priest-Discipline.png',
    'Priest — Holy': 'Priest-Holy.png',
    'Priest — Shadow': 'Priest-Shadow.png',
    'Mage — Arcane': 'Mage-Arcane.png',
    'Mage — Fire': 'Mage-Fire.png',
    'Mage — Frost': 'Mage-Frost.png',
    'Monk — Brewmaster': 'Monk-Brewmaster.png',
    'Monk — Mistweaver': 'Monk-Mistweaver.png',
    'Monk — Windwalker': 'Monk-Windwalker.png',
    'Hunter — Beast Mastery': 'Hunter-BeastMastery.png',
    'Hunter — Marksmanship': 'Hunter-Marksmanship.png',
    'Hunter — Survival': 'Hunter-Survival.png',
    'Demon Hunter — Havoc': 'DemonHunter-Havoc.png',
    'Demon Hunter — Vengeance': 'DemonHunter-Vengeance.png',
    'Paladin — Holy': 'Paladin-Holy.png',
    'Paladin — Protection': 'Paladin-Protection.png',
    'Paladin — Retribution': 'Paladin-Retribution.png',
    'Evoker — Devastation': 'Evoker-Devastation.png',
    'Evoker — Preservation': 'Evoker-Preservation.png',
    'Evoker — Augmentation': 'Evoker-Augmentation.png',
    'Rogue — Assassination': 'Rogue-Assassination.png',
    'Rogue — Outlaw': 'Rogue-Outlaw.png',
    'Rogue — Subtlety': 'Rogue-Subtlety.png',
    'Death Knight — Blood': 'DeathKnight-Blood.png',
    'Death Knight — Frost': 'DeathKnight-Frost.png',
    'Death Knight — Unholy': 'DeathKnight-Unholy.png',
    'Warlock — Affliction': 'Warlock-Affliction.png',
    'Warlock — Demonology': 'Warlock-Demonology.png',
    'Warlock — Destruction': 'Warlock-Destruction.png',
    'Shaman — Elemental': 'Shaman-Elemental.png',
    'Shaman — Enhancement': 'Shaman-Enhancement.png',
    'Shaman — Restoration': 'Shaman-Restoration.png'
  };

  const filename = iconMap[spec];
  if (!filename) return '<span class="bis-tag">?</span>';

  const url = `https://raw.githubusercontent.com/ElemKai/wow-bis/refs/heads/main/icons/${filename}`;
  return `<img src="${url}" alt="${spec}" class="spec-icon">`;
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', loadData);
