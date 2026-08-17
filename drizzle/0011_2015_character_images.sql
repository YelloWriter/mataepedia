UPDATE `characters`
SET `image_data_url` = '/legacy/characters/2015/park-gyuntae.png'
WHERE `id` = 'official-character-2015-park-gyuntae'
  AND (`image_data_url` IS NULL OR `image_data_url` = '');--> statement-breakpoint

UPDATE `characters`
SET `image_data_url` = '/legacy/characters/2015/yeon-daeheum.png'
WHERE `id` = 'official-character-2015-yeon-daeheum'
  AND (`image_data_url` IS NULL OR `image_data_url` = '');--> statement-breakpoint

UPDATE `characters`
SET `image_data_url` = '/legacy/characters/2015/lee-hyeonji.png'
WHERE `id` = 'official-character-2015-lee-hyeonji'
  AND (`image_data_url` IS NULL OR `image_data_url` = '');--> statement-breakpoint

UPDATE `characters`
SET `image_data_url` = '/legacy/characters/2015/caretaker.png'
WHERE `id` = 'official-character-2015-caretaker'
  AND (`image_data_url` IS NULL OR `image_data_url` = '');--> statement-breakpoint

INSERT OR IGNORE INTO `characters`
  (`id`, `name`, `summary`, `description`, `story_year`, `image_data_url`, `owner_key_hash`, `sort_order`, `updated_at`)
VALUES (
  'official-character-2015-seon-yuna',
  '선유나',
  '교육청 장학관 / 학교 방문 예정',
  '교육청에서 우리 학교에 온다는 장학관이야. 아직 직접 본 애가 거의 없어서 아는 건 많지 않아. 방문하고 나면 더 적어 두기로 했어.',
  2015,
  '/legacy/characters/2015/seon-yuna.png',
  '0000000000000000000000000000000000000000000000000000000000000000',
  14,
  '2015-03-03T12:00:00.000Z'
);--> statement-breakpoint

UPDATE `characters`
SET `image_data_url` = '/legacy/characters/2015/seon-yuna.png'
WHERE `id` = 'official-character-2015-seon-yuna'
  AND (`image_data_url` IS NULL OR `image_data_url` = '');--> statement-breakpoint

PRAGMA optimize;
