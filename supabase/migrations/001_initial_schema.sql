-- EurekaCub Initial Schema

-- 模块元数据
CREATE TABLE modules (
  id TEXT PRIMARY KEY,           -- 'symmetry', 'fraction', ...
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL,             -- emoji
  group_tag TEXT NOT NULL,        -- 'explorer' | 'challenger' | 'shared'
  sort_order INT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 级别配置
CREATE TABLE levels (
  id TEXT PRIMARY KEY,           -- 'symmetry-L1', 'fraction-L2'
  module_id TEXT REFERENCES modules(id),
  level_num INT NOT NULL,         -- 1, 2, 3
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  age_target TEXT,               -- '6+', '9+', 'all'
  renderer_type TEXT NOT NULL,    -- 'canvas-mirror', 'svg-pizza', 'canvas-curve'...
  config JSONB NOT NULL DEFAULT '{}'
);

-- 关卡/题目（核心内容表）
CREATE TABLE puzzles (
  id SERIAL PRIMARY KEY,
  level_id TEXT REFERENCES levels(id),
  sort_order INT NOT NULL,
  difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 10),
  puzzle_type TEXT NOT NULL,
  data JSONB NOT NULL,
  hints JSONB DEFAULT '[]',
  aha_condition TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 冒险剧本
CREATE TABLE adventures (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  icon TEXT,
  group_tag TEXT NOT NULL,        -- 'explorer', 'challenger', 'ultimate', 'sport', 'science'
  unlock_condition JSONB,
  sort_order INT,
  is_active BOOLEAN DEFAULT true
);

-- 冒险关卡
CREATE TABLE adventure_stages (
  id SERIAL PRIMARY KEY,
  adventure_id TEXT REFERENCES adventures(id),
  sort_order INT NOT NULL,
  scenario_zh TEXT NOT NULL,
  scenario_en TEXT,
  module_ids TEXT[],
  puzzle_type TEXT NOT NULL,
  data JSONB NOT NULL,
  age_target TEXT DEFAULT 'all'
);

-- 反馈措辞库
CREATE TABLE feedback_messages (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('correct', 'error', 'hint', 'aha', 'encourage')),
  context TEXT,
  message_zh TEXT NOT NULL,
  message_en TEXT NOT NULL,
  audio_url_zh TEXT,
  audio_url_en TEXT
);

-- 内容版本（客户端同步用）
CREATE TABLE content_version (
  id INT PRIMARY KEY DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 初始化版本号
INSERT INTO content_version (id, version) VALUES (1, 1);

-- 成就/徽章
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  icon TEXT,
  unlock_condition JSONB NOT NULL
);

-- 创建索引
CREATE INDEX idx_puzzles_level_id ON puzzles(level_id);
CREATE INDEX idx_puzzles_difficulty ON puzzles(difficulty);
CREATE INDEX idx_puzzles_is_active ON puzzles(is_active);
CREATE INDEX idx_adventure_stages_adventure_id ON adventure_stages(adventure_id);
CREATE INDEX idx_feedback_messages_category ON feedback_messages(category);
