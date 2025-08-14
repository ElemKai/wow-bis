// Глобальные переменные
let bisData = [];
let lootData = {};
let sourceData = {};

// Загрузка данных
async function loadData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`Не удалось загрузить data.json: ${response.status}`);
    }
    const data = await response.json();

    window.bisData = data;

    // Группировка по боссам и источникам
    window.lootData = {};
    window.sourceData = {};

    data.forEach(item => {
      const source = item.source || 'Unknown';
      const bossMatch = source.match(/The War Within\s*-\s*(.+)/);
      const boss = bossMatch ? bossMatch[1].trim() : null;

      // Группируем по боссам
      if (boss) {
        if (!lootData[boss]) lootData[boss] = [];
        lootData[boss].push(item);
      }

      // Группируем по источникам (без префикса The War Within)
      const cleanSource = source.replace(/The War Within\s*-\s*/, '').trim();
      if (!sourceData[cleanSource]) sourceData[cleanSource] = [];
      sourceData[cleanSource].push(item);
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

    // Заполняем источники
    const sourceSelect = document.getElementById('sourceSelect');
    const sources = Object.keys(sourceData).sort();
    sources.forEach(src => {
      const option = document.createElement('option');
      option.value = src;
      option.textContent = src;
      sourceSelect.appendChild(option);
    });

    console.log('✅ Данные загружены:', bisData.length, 'предметов');
  } catch (err) {
    console.error('❌ Ошибка:', err);
    document.getElementById('result').innerHTML = `
      <p class="no-data">
        <strong>Ошибка загрузки данных:</strong><br>
        ${err.message}
      </p>
    `;
  }
}

// Переключение режима
function switchView() {
  const mode = document.querySelector('input[name="viewMode"]:checked').value;
  document.getElementById('specControls').style.display = mode === 'spec' ? 'flex' : 'none';
  document.getElementById('bossControls').style.display = mode === 'boss' ? 'flex' : 'none';
  document.getElementById('sourceControls').style.display = mode === 'source' ? 'flex' : 'none';
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
  )].sort();

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

// Показываем по источнику
function showBySource() {
  const sourceSelect = document.getElementById('sourceSelect');
  const resultDiv = document.getElementById('result');
  const source = sourceSelect.value;

  if (!source) {
    resultDiv.innerHTML = '<p class="no-data">Выберите источник</p>';
    return;
  }

  const items = sourceData[source] || [];
  renderItemList(items, resultDiv, `Источник: ${source}`);
}

// Отрисовка списка
function renderItemList(items, container, title) {
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="no-data">Нет предметов</p>';
    return;
  }

  // Уникальные предметы по ID
  const seen = new Set();
  const uniqueItems = [];
  items.forEach(item => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      uniqueItems.push(item);
    }
  });

  // Группировка по слоту
  const grouped = uniqueItems.reduce((acc, item) => {
    const slot = item.slot || 'Unknown';
    if (!acc[slot]) acc[slot] = [];
    acc[slot].push(item);
    return acc;
  }, {});

  let html = `<h2>${title}</h2>`;
  html += `<div class="slot-group">`;

  Object.keys(grouped).sort().forEach(slot => {
    const slotItems = grouped[slot];
    html += `<div class="slot-section"><h3>${slot}</h3><ul class="item-list">`;

    slotItems.forEach(item => {
      const bisSpecs = bisData
        .filter(i => i.id === item.id)
        .map(i => `${i.class} — ${i.spec}`);

      const bisIcons = bisSpecs.length > 0
        ? bisSpecs.map(spec => `<span class="bis-tag" title="${spec}">${getSpecIcon(spec)}</span>`).join('')
        : '—';

      html += `
        <li>
          <a href="https://www.wowhead.com/item=${item.id}" 
             class="item-link" 
             data-wowhead="item=${item.id}">
            ${item.name}
          </a>
          <div class="source">Источник: ${item.source}</div>
          <div class="tags">${bisIcons}</div>
        </li>
      `;
    });

    html += `</ul></div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// Иконки спеков
function getSpecIcon(spec) {
  const iconMap = {
    'Warrior — Arms': 'warrior_arms.png',
    'Warrior — Fury': 'warrior_fury.png',
    'Warrior — Protection': 'warrior_prot.png',
    'Druid — Balance': 'druid_balance.png',
    'Druid — Feral': 'druid_feral.png',
    'Druid — Guardian': 'druid_guardian.png',
    'Druid — Restoration': 'druid_resto.png',
    'Priest — Discipline': 'priest_disc.png',
    'Priest — Holy': 'priest_holy.png',
    'Priest — Shadow': 'priest_shadow.png',
    'Mage — Arcane': 'mage_arcane.png',
    'Mage — Fire': 'mage_fire.png',
    'Mage — Frost': 'mage_frost.png',
    'Monk — Brewmaster': 'monk_brewmaster.png',
    'Monk — Mistweaver': 'monk_mistweaver.png',
    'Monk — Windwalker': 'monk_ww.png',
    'Hunter — Beast Mastery': 'hunter_bm.png',
    'Hunter — Marksmanship': 'hunter_mm.png',
    'Hunter — Survival': 'hunter_survival.png',
    'Demon Hunter — Havoc': 'Ddh_havoc.png',
    'Demon Hunter — Vengeance': 'dh_vengeance.png',
    'Paladin — Holy': 'paladin_holy.png',
    'Paladin — Protection': 'paladin_protection.png',
    'Paladin — Retribution': 'paladin_ret.png',
    'Evoker — Devastation': 'Evoker-Devastation.png',
    'Evoker — Preservation': 'Evoker-Preservation.png',
    'Evoker — Augmentation': 'Evoker-Augmentation.png',
    'Rogue — Assassination': 'rogue_assa.png',
    'Rogue — Outlaw': 'rogue_outlaw.png',
    'Rogue — Subtlety': 'rogue_sub.png',
    'Death Knight — Blood': 'dk_blood.png',
    'Death Knight — Frost': 'dk_frost.png',
    'Death Knight — Unholy': 'dk_unholy.png',
    'Warlock — Affliction': 'warlock_affli.png',
    'Warlock — Demonology': 'warlock_demono.png',
    'Warlock — Destruction': 'warlock_destru.png',
    'Shaman — Elemental': 'shaman_elem.png',
    'Shaman — Enhancement': 'shaman_enhancement.png',
    'Shaman — Restoration': 'shaman_resto.png'
  };

  const filename = iconMap[spec];
  if (!filename) return '<span class="bis-tag">?</span>';

  const url = `https://raw.githubusercontent.com/ElemKai/wow-bis/main/icons/${filename}`;
  return `<img src="${url}" alt="${spec}" class="spec-icon">`;
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', loadData);
