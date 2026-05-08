// ===== 坦克大战 · 卡哇伊常量配置 =====

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

// 玩家坦克
const PLAYER_SIZE = 32;
const PLAYER_SPEED = 2.5;
const PLAYER_START_HP = 3;
const INVINCIBLE_MS = 2000;

// 子弹
const BULLET_SIZE = 6;
const BULLET_SPEED = 4;

// 敌人
const ENEMY_SIZE = 28;
const ENEMY_BULLET_SPEED = 2.5;

// 敌人类型
const ENEMY_FAST = 'fast';
const ENEMY_HEAVY = 'heavy';
const ENEMY_BOSS = 'boss';

// 网格系统（墙壁/道具使用）
const GRID_CELL = 32;             // 每个格子 32px
const GRID_COLS = CANVAS_WIDTH / GRID_CELL;   // 15
const GRID_ROWS = CANVAS_HEIGHT / GRID_CELL;  // 20

// 墙壁类型
const WALL_BRICK = 1;   // 砖墙，可被子弹摧毁（2 枪）
const WALL_STEEL = 2;   // 钢墙，不可摧毁
const WALL_WATER = 3;   // 水域，坦克不可通行，子弹可通过

// 道具类型
const ITEM_TYPES = {
  heal:  { emoji: '💊', label: '生命恢复', duration: 0      },
  shield:{ emoji: '🛡️', label: '护盾',     duration: 5000  },
  speed: { emoji: '⚡',  label: '加速',     duration: 5000  },
  rapid: { emoji: '🔥',  label: '速射',     duration: 5000  },
};

// 道具存在时间（秒）
const ITEM_LIFETIME = 15000;

// 关卡配置
const LEVELS = [
  {
    level: 1,  label: '🍭 第1关 · 新手村',
    spawnInterval: 2500, maxEnemies: 2, speedMult: 0.6, enemyFireRate: 3000, totalEnemies: 5,
    // 墙壁 [gx, gy, gw, gh, type]
    walls: [
      [3, 3, 3, 1, WALL_BRICK], [9, 3, 3, 1, WALL_BRICK],
      [3, 5, 1, 3, WALL_BRICK], [11, 5, 1, 3, WALL_BRICK],
      [6, 7, 3, 1, WALL_BRICK],
    ],
    // 道具 [gx, gy, type]
    items: [[7, 10, 'heal']],
  },
  {
    level: 2,  label: '🌿 第2关 · 绿野草原',
    spawnInterval: 2200, maxEnemies: 3, speedMult: 0.7, enemyFireRate: 2800, totalEnemies: 8,
    walls: [
      [1, 2, 5, 1, WALL_BRICK], [9, 2, 5, 1, WALL_BRICK],
      [1, 4, 1, 3, WALL_BRICK], [13, 4, 1, 3, WALL_BRICK],
      [5, 5, 5, 2, WALL_WATER],
      [1, 8, 5, 1, WALL_BRICK], [9, 8, 5, 1, WALL_BRICK],
    ],
    items: [[7, 10, 'shield']],
  },
  {
    level: 3,  label: '🌸 第3关 · 樱花山谷',
    spawnInterval: 2000, maxEnemies: 3, speedMult: 0.8, enemyFireRate: 2600, totalEnemies: 10,
    walls: [
      [2, 2, 1, 5, WALL_BRICK], [12, 2, 1, 5, WALL_BRICK],
      [5, 3, 5, 1, WALL_BRICK],
      [2, 8, 1, 5, WALL_BRICK], [12, 8, 1, 5, WALL_BRICK],
      [5, 9, 5, 1, WALL_BRICK],
      [7, 5, 1, 3, WALL_BRICK],
    ],
    items: [[7, 6, 'speed'], [7, 12, 'heal']],
  },
  {
    level: 4,  label: '🌊 第4关 · 碧蓝湖畔',
    spawnInterval: 1800, maxEnemies: 4, speedMult: 0.9, enemyFireRate: 2400, totalEnemies: 12,
    walls: [
      [2, 2, 11, 1, WALL_WATER],
      [4, 4, 1, 6, WALL_BRICK], [10, 4, 1, 6, WALL_BRICK],
      [4, 8, 7, 1, WALL_WATER],
      [7, 5, 1, 2, WALL_BRICK],
    ],
    items: [[7, 3, 'speed']],
  },
  {
    level: 5,  label: '🌙 第5关 · 月光小径',
    spawnInterval: 1600, maxEnemies: 4, speedMult: 1.0, enemyFireRate: 2200, totalEnemies: 14,
    walls: [
      [3, 1, 1, 4, WALL_BRICK], [11, 1, 1, 4, WALL_BRICK],
      [1, 4, 4, 1, WALL_BRICK], [10, 4, 4, 1, WALL_BRICK],
      [5, 5, 5, 1, WALL_STEEL],
      [1, 7, 4, 1, WALL_BRICK], [10, 7, 4, 1, WALL_BRICK],
      [3, 9, 1, 4, WALL_BRICK], [11, 9, 1, 4, WALL_BRICK],
      [5, 10, 5, 1, WALL_BRICK],
    ],
    items: [[7, 6, 'rapid']],
  },
  {
    level: 6,  label: '🍁 第6关 · 枫叶丘陵',
    spawnInterval: 1400, maxEnemies: 5, speedMult: 1.0, enemyFireRate: 2000, totalEnemies: 16,
    walls: [
      [2, 2, 3, 1, WALL_BRICK], [10, 2, 3, 1, WALL_BRICK],
      [4, 3, 1, 4, WALL_BRICK], [10, 3, 1, 4, WALL_BRICK],
      [2, 5, 2, 1, WALL_BRICK], [11, 5, 2, 1, WALL_BRICK],
      [7, 4, 1, 3, WALL_STEEL],
      [2, 8, 3, 1, WALL_BRICK], [10, 8, 3, 1, WALL_BRICK],
      [4, 9, 1, 4, WALL_BRICK], [10, 9, 1, 4, WALL_BRICK],
      [2, 11, 2, 1, WALL_BRICK], [11, 11, 2, 1, WALL_BRICK],
    ],
    items: [[7, 10, 'heal'], [4, 8, 'shield']],
  },
  {
    level: 7,  label: '❄️ 第7关 · 冰雪世界',
    spawnInterval: 1200, maxEnemies: 5, speedMult: 1.1, enemyFireRate: 1800, totalEnemies: 18,
    walls: [
      [1, 1, 13, 1, WALL_STEEL],
      [3, 3, 1, 5, WALL_BRICK], [11, 3, 1, 5, WALL_BRICK],
      [5, 4, 5, 1, WALL_STEEL],
      [3, 7, 1, 5, WALL_BRICK], [11, 7, 1, 5, WALL_BRICK],
      [5, 8, 5, 1, WALL_STEEL],
      [1, 11, 5, 1, WALL_BRICK], [9, 11, 5, 1, WALL_BRICK],
    ],
    items: [[7, 5, 'speed'], [7, 9, 'heal']],
  },
  {
    level: 8,  label: '🌋 第8关 · 火山熔岩',
    spawnInterval: 1100, maxEnemies: 6, speedMult: 1.2, enemyFireRate: 1700, totalEnemies: 20,
    walls: [
      [3, 1, 9, 1, WALL_STEEL],
      [1, 3, 2, 1, WALL_STEEL], [12, 3, 2, 1, WALL_STEEL],
      [4, 3, 7, 1, WALL_BRICK],
      [3, 5, 1, 4, WALL_BRICK], [11, 5, 1, 4, WALL_BRICK],
      [6, 5, 3, 1, WALL_WATER],
      [6, 7, 3, 1, WALL_WATER],
      [3, 9, 1, 4, WALL_BRICK], [11, 9, 1, 4, WALL_BRICK],
      [4, 11, 7, 1, WALL_BRICK],
    ],
    items: [[7, 6, 'shield'], [7, 8, 'speed'], [3, 10, 'heal']],
  },
  {
    level: 9,  label: '🌌 第9关 · 星空要塞',
    spawnInterval: 1000, maxEnemies: 6, speedMult: 1.3, enemyFireRate: 1600, totalEnemies: 22,
    walls: [
      [1, 1, 13, 1, WALL_STEEL],
      [1, 2, 1, 10, WALL_STEEL], [13, 2, 1, 10, WALL_STEEL],
      [4, 3, 7, 1, WALL_STEEL],
      [4, 5, 1, 5, WALL_BRICK], [10, 5, 1, 5, WALL_BRICK],
      [6, 5, 3, 1, WALL_STEEL],
      [6, 7, 3, 1, WALL_STEEL],
      [4, 9, 7, 1, WALL_STEEL],
    ],
    items: [[7, 4, 'heal'], [7, 8, 'rapid'], [7, 11, 'shield']],
  },
  {
    level: 10, label: '👑 第10关 · 最终决战',
    spawnInterval: 900,  maxEnemies: 7, speedMult: 1.4, enemyFireRate: 1500, totalEnemies: 25,
    walls: [
      [1, 1, 3, 1, WALL_STEEL], [11, 1, 3, 1, WALL_STEEL],
      [6, 1, 3, 1, WALL_STEEL],
      [3, 3, 1, 3, WALL_STEEL], [11, 3, 1, 3, WALL_STEEL],
      [1, 4, 2, 1, WALL_STEEL], [12, 4, 2, 1, WALL_STEEL],
      [5, 4, 5, 1, WALL_BRICK],
      [7, 5, 1, 5, WALL_STEEL],
      [5, 7, 2, 1, WALL_BRICK], [8, 7, 2, 1, WALL_BRICK],
      [1, 8, 2, 1, WALL_STEEL], [12, 8, 2, 1, WALL_STEEL],
      [3, 9, 1, 3, WALL_STEEL], [11, 9, 1, 3, WALL_STEEL],
      [5, 9, 5, 1, WALL_BRICK],
      [1, 11, 13, 1, WALL_STEEL],
    ],
    items: [[4, 6, 'heal'], [10, 6, 'heal'], [7, 11, 'rapid'], [7, 2, 'shield']],
  },
];

// 最大关卡数
const MAX_LEVEL = LEVELS.length;

// 卡哇伊颜色
const COLORS = {
  player:        '#FF9EB5',   // 粉红
  playerDark:    '#FF7A9E',
  playerTrack:   '#FFB8CC',
  enemy:         '#A8D8EA',   // 天蓝
  enemyDark:     '#7EC8E3',
  enemyTrack:    '#C5E5F5',
  enemyElite:    '#C3AED6',   // 淡紫
  enemyEliteDark:'#A98DC9',
  bullet:        '#FFD700',   // 金色
  bulletPlayer:  '#FF69B4',   // 亮粉
  heart:         '#FF6B9D',
  sparkle:       ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'],
  wallBrick:     '#D4956A',
  wallBrickHi:   '#E8B88A',
  wallBrickLo:   '#B87A50',
  wallSteel:     '#B0BEC5',
  wallSteelHi:   '#CFD8DC',
  wallSteelLo:   '#78909C',
  wallWater:     '#4FC3F7',
  wallWaterHi:   '#81D4FA',
  itemGlow:      '#FFD700',
};
