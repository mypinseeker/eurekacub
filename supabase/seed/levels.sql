-- Symmetry levels
INSERT INTO levels (id, module_id, level_num, title_zh, title_en, age_target, renderer_type, config) VALUES
('symmetry-L1', 'symmetry', 1, '水平镜像', 'Horizontal Mirror', '5+', 'canvas-mirror', '{"axis": "horizontal", "gridSize": 8}'),
('symmetry-L2', 'symmetry', 2, '垂直镜像', 'Vertical Mirror', '6+', 'canvas-mirror', '{"axis": "vertical", "gridSize": 10}'),
('symmetry-L3', 'symmetry', 3, '旋转对称', 'Rotational Symmetry', '8+', 'canvas-mirror', '{"axis": "rotation", "gridSize": 12, "rotationDeg": 180}');

-- Fraction levels
INSERT INTO levels (id, module_id, level_num, title_zh, title_en, age_target, renderer_type, config) VALUES
('fraction-L1', 'fraction', 1, '等分认知', 'Equal Parts', '5+', 'svg-pizza', '{"maxSlices": 4, "showLabels": true}'),
('fraction-L2', 'fraction', 2, '分数比较', 'Comparing Fractions', '7+', 'svg-pizza', '{"maxSlices": 8, "showLabels": true, "compare": true}'),
('fraction-L3', 'fraction', 3, '分数运算', 'Fraction Operations', '9+', 'svg-pizza', '{"maxSlices": 12, "showLabels": false, "operations": ["add", "subtract"]}');

-- Sequence levels
INSERT INTO levels (id, module_id, level_num, title_zh, title_en, age_target, renderer_type, config) VALUES
('sequence-L1', 'sequence', 1, '简单递增', 'Simple Increment', '5+', 'number-line', '{"patternType": "arithmetic", "maxTerms": 6}'),
('sequence-L2', 'sequence', 2, '等差数列', 'Arithmetic Sequences', '7+', 'number-line', '{"patternType": "arithmetic", "maxTerms": 8, "allowNegative": true}'),
('sequence-L3', 'sequence', 3, '混合规律', 'Mixed Patterns', '9+', 'number-line', '{"patternType": "mixed", "maxTerms": 10, "types": ["arithmetic", "geometric", "fibonacci"]}');

-- Probability levels
INSERT INTO levels (id, module_id, level_num, title_zh, title_en, age_target, renderer_type, config) VALUES
('probability-L1', 'probability', 1, '硬币翻转', 'Coin Flip', '5+', 'canvas-sim', '{"tool": "coin", "trials": 10}'),
('probability-L2', 'probability', 2, '骰子实验', 'Dice Experiment', '7+', 'canvas-sim', '{"tool": "dice", "trials": 30, "diceCount": 1}'),
('probability-L3', 'probability', 3, '组合概率', 'Combined Probability', '9+', 'canvas-sim', '{"tool": "mixed", "trials": 50, "tools": ["coin", "dice", "spinner"]}');
