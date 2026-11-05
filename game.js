// Инициализация Telegram
const tg = window.Telegram.WebApp;
tg.expand();

// ====== ДАННЫЕ ЛОКАЦИЙ И МОНСТРОВ ======
const locations = [
  {
    id: 'forest',
    name: '🌲 Тёмный лес',
    monsters: [
      { id: 'slime', name: 'Слизь', hp: 30, attack: 5, exp: 10, gold: 5 },
      { id: 'goblin', name: 'Гоблин', hp: 50, attack: 10, exp: 25, gold: 15 }
    ]
  },
  {
    id: 'cave',
    name: '🕳️ Пещера',
    monsters: [
      { id: 'bat', name: 'Летучая мышь', hp: 40, attack: 12, exp: 20, gold: 10 },
      { id: 'skeleton', name: 'Скелет', hp: 80, attack: 18, exp: 50, gold: 30 }
    ]
  },
  {
    id: 'ruins',
    name: '🏛️ Руины',
    monsters: [
      { id: 'ghost', name: 'Призрак', hp: 60, attack: 22, exp: 60, gold: 40 },
      { id: 'golem', name: 'Каменный голем', hp: 150, attack: 30, exp: 120, gold: 80 }
    ]
  }
];

// ====== ДАННЫЕ ИГРОКА ======
let player = {
  name: 'Герой',
  class: null,
  level: 1,
  exp: 0,
  expNext: 20,
  gold: 0,
  hp: 120,
  maxHp: 120,
  attack: 15
};

// Текущая локация и монстр
let currentLocationId = 'forest';
let currentMonster = null; // копия монстра для боя

// ====== НАВИГАЦИЯ ЭКРАНОВ ======
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ====== ВЫБОР КЛАССА ======
function chooseClass(cls) {
  player.class = cls;
  if (cls === 'warrior') {
    player.hp = player.maxHp = 120;
    player.attack = 15;
  } else {
    player.hp = player.maxHp = 80;
    player.attack = 25;
  }
  updateMainScreen();
  renderLocations();
  selectLocation('forest');
  showScreen('screen-main');
  saveProgress();
}

// ====== ОТРИСОВКА ЛОКАЦИЙ ======
function renderLocations() {
  const container = document.getElementById('locations-list');
  container.innerHTML = '';
  locations.forEach(loc => {
    const btn = document.createElement('button');
    btn.className = 'location-btn' + (loc.id === currentLocationId ? ' active-loc' : '');
    btn.textContent = loc.name;
    btn.onclick = () => selectLocation(loc.id);
    container.appendChild(btn);
  });
}

// ====== ВЫБОР ЛОКАЦИИ ======
function selectLocation(id) {
  currentLocationId = id;
  renderLocations();
  renderMonsters();
}

// ====== ОТРИСОВКА МОНСТРОВ В ЛОКАЦИИ ======
function renderMonsters() {
  const loc = locations.find(l => l.id === currentLocationId);
  document.getElementById('current-location-name').textContent = loc.name;
  const container = document.getElementById('monsters-list');
  container.innerHTML = '';
  loc.monsters.forEach(mon => {
    const btn = document.createElement('button');
    btn.className = 'monster-btn';
    btn.textContent = `${mon.name} (HP ${mon.hp}, Атака ${mon.attack})`;
    btn.onclick = () => startBattle(mon);
    container.appendChild(btn);
  });
}

// ====== ОБНОВЛЕНИЕ ГЛАВНОГО ЭКРАНА ======
function updateMainScreen() {
  document.getElementById('player-name').textContent = player.name;
  document.getElementById('level').textContent = player.level;
  document.getElementById('exp').textContent = player.exp;
  document.getElementById('exp-next').textContent = player.expNext;
  document.getElementById('gold').textContent = player.gold;
  document.getElementById('player-hp').textContent = player.hp;
  document.getElementById('player-maxhp').textContent = player.maxHp;
  document.getElementById('player-hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
}

// ====== НАЧАЛО БОЯ ======
function startBattle(monsterTemplate) {
  // Создаём копию монстра, чтобы не портить шаблон
  currentMonster = { ...monsterTemplate, maxHp: monsterTemplate.hp };

  document.getElementById('monster-name').textContent = currentMonster.name;
  document.getElementById('monster-hp').textContent = currentMonster.hp;
  document.getElementById('monster-maxhp').textContent = currentMonster.maxHp;
  document.getElementById('monster-hp-bar').style.width = '100%';

  document.getElementById('battle-player-hp').textContent = player.hp;
  document.getElementById('battle-player-maxhp').textContent = player.maxHp;
  document.getElementById('battle-player-hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';

  document.getElementById('battle-log').textContent = '';
  showScreen('screen-battle');
}

// ====== АТАКА ======
function attack() {
  if (!currentMonster || currentMonster.hp <= 0) return;

  // Игрок бьёт
  const playerDmg = Math.max(1, player.attack - 2);
  currentMonster.hp -= playerDmg;
  let log = `Ты нанёс ${playerDmg} урона. `;

  if (currentMonster.hp <= 0) {
    currentMonster.hp = 0;
    log += `${currentMonster.name} побеждён! +${currentMonster.exp} опыта, +${currentMonster.gold} золота.`;
    player.exp += currentMonster.exp;
    player.gold += currentMonster.gold;
    checkLevelUp();
    updateMainScreen();
    saveProgress();
    document.getElementById('monster-hp').textContent = 0;
    document.getElementById('monster-hp-bar').style.width = '0%';
    document.getElementById('battle-log').textContent = log;
    setTimeout(() => showScreen('screen-main'), 1800);
    return;
  }

  // Монстр отвечает
  const monsterDmg = Math.max(1, currentMonster.attack - 2);
  player.hp -= monsterDmg;
  log += `${currentMonster.name} нанёс ${monsterDmg} урона.`;

  if (player.hp <= 0) {
    player.hp = 0;
    log += ' Ты проиграл! Возвращайся в город.';
    document.getElementById('battle-log').textContent = log;
    setTimeout(() => {
      player.hp = player.maxHp; // восстановление после поражения
      updateMainScreen();
      showScreen('screen-main');
    }, 2000);
    return;
  }

  // Обновить полоски и лог
  document.getElementById('monster-hp').textContent = currentMonster.hp;
  document.getElementById('monster-hp-bar').style.width = (currentMonster.hp / currentMonster.maxHp * 100) + '%';
  document.getElementById('battle-player-hp').textContent = player.hp;
  document.getElementById('battle-player-hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
  document.getElementById('battle-log').textContent = log;
}

// ====== БЕГСТВО ======
function flee() {
  showScreen('screen-main');
}

// ====== ПРОВЕРКА УРОВНЯ ======
function checkLevelUp() {
  while (player.exp >= player.expNext) {
    player.exp -= player.expNext;
    player.level++;
    player.expNext = Math.floor(player.expNext * 1.5);
    player.maxHp += 20;
    player.hp = player.maxHp;
    player.attack += 5;
    alert(`Уровень повышен! Теперь ты ${player.level} уровня.`);
  }
}

// ====== СОХРАНЕНИЕ ======
async function saveProgress() {
  if (tg.CloudStorage) {
    await tg.CloudStorage.setItem('player', JSON.stringify(player));
  }
}

// ====== ЗАГРУЗКА ======
async function loadProgress() {
  if (tg.CloudStorage) {
    const data = await tg.CloudStorage.getItem('player');
    if (data) {
      player = JSON.parse(data);
      updateMainScreen();
      renderLocations();
      selectLocation(currentLocationId);
      showScreen('screen-main');
    }
  }
}

// ====== ЗАПУСК ======
tg.ready();
loadProgress();