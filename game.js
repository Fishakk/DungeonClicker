// Инициализация Telegram
const tg = window.Telegram.WebApp;
tg.expand();

// Данные игрока
let player = {
  name: "Герой",
  class: null,
  level: 1,
  exp: 0,
  expNext: 20,
  gold: 0,
  hp: 120,
  maxHp: 120,
  attack: 15
};

let monster = { hp: 30, maxHp: 30, attack: 5, exp: 10, gold: 5 };

// Показать экран
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Выбор класса
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
  showScreen('screen-main');
  saveProgress();
}

// Обновить главный экран
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

// Начать бой
function startBattle() {
  monster.hp = monster.maxHp;
  document.getElementById('monster-hp').textContent = monster.hp;
  document.getElementById('monster-hp-bar').style.width = '100%';
  document.getElementById('battle-player-hp').textContent = player.hp;
  document.getElementById('battle-player-maxhp').textContent = player.maxHp;
  document.getElementById('battle-player-hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
  document.getElementById('battle-log').textContent = '';
  showScreen('screen-battle');
}

// Атака игрока и ответ монстра
function attack() {
  // Игрок бьёт
  const playerDmg = Math.max(1, player.attack - 2);
  monster.hp -= playerDmg;
  document.getElementById('battle-log').textContent = `Ты нанёс ${playerDmg} урона. `;

  if (monster.hp <= 0) {
    monster.hp = 0;
    document.getElementById('monster-hp').textContent = 0;
    document.getElementById('monster-hp-bar').style.width = '0%';
    document.getElementById('battle-log').textContent += `Слизь побеждена! +${monster.exp} опыта, +${monster.gold} золота.`;
    player.exp += monster.exp;
    player.gold += monster.gold;
    checkLevelUp();
    updateMainScreen();
    saveProgress();
    setTimeout(() => showScreen('screen-main'), 2000);
    return;
  }

  // Монстр отвечает
  const monsterDmg = Math.max(1, monster.attack - 2);
  player.hp -= monsterDmg;
  document.getElementById('battle-log').textContent += `Слизь нанесла ${monsterDmg} урона.`;

  if (player.hp <= 0) {
    player.hp = 0;
    document.getElementById('battle-log').textContent += ' Ты проиграл! Возвращайся в город.';
    setTimeout(() => {
      player.hp = player.maxHp; // восстановление после поражения
      updateMainScreen();
      showScreen('screen-main');
    }, 2000);
    return;
  }

  // Обновить полоски
  document.getElementById('monster-hp').textContent = monster.hp;
  document.getElementById('monster-hp-bar').style.width = (monster.hp / monster.maxHp * 100) + '%';
  document.getElementById('battle-player-hp').textContent = player.hp;
  document.getElementById('battle-player-hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
}

// Проверка повышения уровня
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

// Сохранение в Telegram CloudStorage
async function saveProgress() {
  if (tg.CloudStorage) {
    await tg.CloudStorage.setItem('player', JSON.stringify(player));
  }
}

// Загрузка при старте
async function loadProgress() {
  if (tg.CloudStorage) {
    const data = await tg.CloudStorage.getItem('player');
    if (data) {
      player = JSON.parse(data);
      updateMainScreen();
      showScreen('screen-main');
    }
  }
}

// Запуск
tg.ready();
loadProgress();