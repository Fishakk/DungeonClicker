// ====== ИНИЦИАЛИЗАЦИЯ TELEGRAM ======
const tg = window.Telegram.WebApp;
tg.expand();

// ====== ДАННЫЕ ЛОКАЦИЙ ======
const locations = [
  {
    id: 'forest',
    name: '🌲 Тёмный лес',
    monsters: [
      { id: 'slime', name: 'Слизь', hp: 30, attack: 5, exp: 10, gold: 5 },
      { id: 'goblin', name: 'Гоблин', hp: 50, attack: 10, exp: 25, gold: 15 }
    ],
    boss: { id: 'forest_boss', name: '🌳 Древний энт', hp: 200, attack: 20, exp: 150, gold: 100 }
  },
  {
    id: 'cave',
    name: '🕳️ Пещера',
    monsters: [
      { id: 'bat', name: 'Летучая мышь', hp: 40, attack: 12, exp: 20, gold: 10 },
      { id: 'skeleton', name: 'Скелет', hp: 80, attack: 18, exp: 50, gold: 30 }
    ],
    boss: { id: 'cave_boss', name: '🦇 Король летучих мышей', hp: 350, attack: 30, exp: 300, gold: 200 }
  },
  {
    id: 'ruins',
    name: '🏛️ Руины',
    monsters: [
      { id: 'ghost', name: 'Призрак', hp: 60, attack: 22, exp: 60, gold: 40 },
      { id: 'golem', name: 'Каменный голем', hp: 150, attack: 30, exp: 120, gold: 80 }
    ],
    boss: { id: 'ruins_boss', name: '💀 Лич-повелитель', hp: 500, attack: 45, exp: 600, gold: 400 }
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
  attack: 15,
  defeatedMonsters: []
};

// ====== ТЕКУЩЕЕ СОСТОЯНИЕ ======
let currentLocationId = 'forest';
let currentMonster = null;

// ====== НАВИГАЦИЯ ======
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

// ====== ЛОКАЦИИ ======
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

function selectLocation(id) {
  currentLocationId = id;
  renderLocations();
  renderMonsters();
  renderBoss();
}

// ====== МОНСТРЫ ======
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

// ====== БОСС ======
function renderBoss() {
  const loc = locations.find(l => l.id === currentLocationId);
  const boss = loc.boss;
  const container = document.getElementById('boss-list');
  container.innerHTML = '';

  const allDefeated = loc.monsters.every(m => player.defeatedMonsters.includes(m.id));

  const btn = document.createElement('button');
  btn.className = 'boss-btn';
  if (allDefeated) {
    btn.textContent = `${boss.name} (HP ${boss.hp}, Атака ${boss.attack}) 👑`;
    btn.onclick = () => startBattle(boss);
  } else {
    btn.textContent = `🔒 Победи всех монстров локации`;
    btn.disabled = true;
  }
  container.appendChild(btn);
}

// ====== ГЛАВНЫЙ ЭКРАН ======
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

// ====== БОЙ ======
function startBattle(monsterTemplate) {
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

function attack() {
  if (!currentMonster || currentMonster.hp <= 0) return;

  const playerDmg = Math.max(1, player.attack - 2);
  currentMonster.hp -= playerDmg;
  let log = `Ты нанёс ${playerDmg} урона. `;

  if (currentMonster.hp <= 0) {
    currentMonster.hp = 0;
    log += `${currentMonster.name} побеждён! +${currentMonster.exp} опыта, +${currentMonster.gold} золота.`;
    player.exp += currentMonster.exp;
    player.gold += currentMonster.gold;

    if (!player.defeatedMonsters.includes(currentMonster.id)) {
      player.defeatedMonsters.push(currentMonster.id);
    }

    checkLevelUp();
    updateMainScreen();
    saveProgress();

    document.getElementById('monster-hp').textContent = 0;
    document.getElementById('monster-hp-bar').style.width = '0%';
    document.getElementById('battle-log').textContent = log;

    setTimeout(() => {
      showScreen('screen-main');
      renderBoss();
    }, 1800);
    return;
  }

  const monsterDmg = Math.max(1, currentMonster.attack - 2);
  player.hp -= monsterDmg;
  log += `${currentMonster.name} нанёс ${monsterDmg} урона.`;

  if (player.hp <= 0) {
    player.hp = 0;
    log += ' Ты проиграл!';
    document.getElementById('battle-log').textContent = log;
    setTimeout(() => {
      player.hp = player.maxHp;
      updateMainScreen();
      showScreen('screen-main');
    }, 2000);
    return;
  }

  document.getElementById('monster-hp').textContent = currentMonster.hp;
  document.getElementById('monster-hp-bar').style.width = (currentMonster.hp / currentMonster.maxHp * 100) + '%';
  document.getElementById('battle-player-hp').textContent = player.hp;
  document.getElementById('battle-player-hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
  document.getElementById('battle-log').textContent = log;
}

function flee() {
  showScreen('screen-main');
}

// ====== УРОВЕНЬ ======
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

async function loadProgress() {
  if (tg.CloudStorage) {
    const data = await tg.CloudStorage.getItem('player');
    if (data) {
      player = JSON.parse(data);
      if (!player.defeatedMonsters) player.defeatedMonsters = [];
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