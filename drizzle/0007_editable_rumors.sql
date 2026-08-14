INSERT OR IGNORE INTO records (id, kind, title, body, author_name, story_date, owner_key_hash, created_at, updated_at) VALUES (
  'rumor-1',
  'rumor',
  '학교 괴담',
  '마태 초중고등학교는 초·중·고가 하나로 묶인 특이한 학교고, 비어 있는 교실도 여럿 있어. 밤에 몰래 들어갔다 수위 아저씨에게 들키면 큰일 난다는 이야기, 수위 아저씨가 사람을 잡아먹는 커다란 뱀이라는 이야기가 돌아.',
  '마태피아 기록반',
  '2011-00-00',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2011-12-31T23:59:20.000Z',
  '2011-12-31T23:59:20.000Z'
);--> statement-breakpoint

INSERT OR IGNORE INTO records (id, kind, title, body, author_name, story_date, owner_key_hash, created_at, updated_at) VALUES (
  'rumor-2',
  'rumor',
  '마을 외곽의 이상한 소문',
  '말총곶 등대에서는 물귀신 노랫소리가 들리고, 비 오는 밤 괴불림에서는 사람들이 길을 잃는다고 해. 마두산의 정기를 받으면 중간시험 1등을 한다는 말도 있어.',
  '마태피아 기록반',
  '2011-00-00',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2011-12-31T23:59:19.000Z',
  '2011-12-31T23:59:19.000Z'
);--> statement-breakpoint

PRAGMA optimize;
