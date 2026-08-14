INSERT OR IGNORE INTO records (id, kind, title, body, author_name, story_date, owner_key_hash, created_at, updated_at) VALUES (
  'official-record-2011-police-silence',
  'memo',
  '경찰들의 침묵',
  '경찰들은 준석이가 사라진 내용에 대해서 별다른 말도 하지 않았어.',
  '익명',
  '2011-00-00',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2011-12-31T23:59:14.000Z',
  '2011-12-31T23:59:14.000Z'
);--> statement-breakpoint

INSERT OR IGNORE INTO records (id, kind, title, body, author_name, story_date, owner_key_hash, created_at, updated_at) VALUES (
  'official-record-2011-ordinary-days',
  'diary',
  '그 이후의 평범한 날들',
  '2011년, 우리는 그 이후에 아주 평범한 날들을 살았어. 우리들만 그 기억들을 가지고 있는 것처럼 어른들 모두 그 일에 대해서 말하지 않았어.',
  '익명',
  '2011-00-00',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2011-12-31T23:59:15.000Z',
  '2011-12-31T23:59:15.000Z'
);--> statement-breakpoint

INSERT OR IGNORE INTO records (id, kind, title, body, author_name, story_date, owner_key_hash, created_at, updated_at) VALUES (
  'official-rumor-2011-lighthouse-keeper',
  'rumor',
  '등대지기 아저씨의 실종',
  '말총곶 등대에서 일하던 등대지기 아저씨가 어느 날 실종됐다는 말이 있어. 언제 어디서 사라졌는지, 마지막으로 누가 봤는지는 제대로 알려진 게 없어.',
  '익명',
  '2011-00-00',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2011-12-31T23:59:16.000Z',
  '2011-12-31T23:59:16.000Z'
);--> statement-breakpoint

INSERT OR IGNORE INTO timeline_events (id, story_year, title, body, author_name, owner_key_hash, created_at) VALUES (
  'official-event-2012-harbor-dolphin',
  2012,
  '사목항에 돌고래가 들어온 날',
  '초여름 아침, 어린 돌고래 한 마리가 사목항 안쪽까지 들어왔다. 학교가 끝난 뒤 항구에 아이들이 다 모였고, 어른들은 배가 다치지 않게 바깥 바다 쪽으로 길을 터 줬다. 해 질 무렵 돌고래는 무사히 섬을 빠져나갔다.',
  '마태피아 기록반',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2012-06-15T12:00:00.000Z'
);--> statement-breakpoint

INSERT OR IGNORE INTO timeline_events (id, story_year, title, body, author_name, owner_key_hash, created_at) VALUES (
  'official-event-2013-school-typhoon',
  2013,
  '태풍 때문에 학교에서 하룻밤을 보낸 일',
  '여름 태풍으로 마을버스가 끊기고 배도 들어오지 못했다. 방과 후 학교에 남아 있던 아이들은 선생님들과 체육관에 이불을 펴고 가족들이 올 수 있을 때까지 함께 밤을 보냈다. 창문이 흔들릴 때마다 무서웠지만 아무도 크게 다치지는 않았다.',
  '마태피아 기록반',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2013-08-20T12:00:00.000Z'
);--> statement-breakpoint

INSERT OR IGNORE INTO timeline_events (id, story_year, title, body, author_name, owner_key_hash, created_at) VALUES (
  'official-event-2014-missing-foal',
  2014,
  '말 목장에서 망아지를 찾아준 일',
  '박해주네 말 목장에서 어린 망아지 한 마리가 울타리를 빠져나왔다. 우리는 보리밭과 학교 뒤 길을 돌아다니다 학교 아래 냇가에서 망아지를 찾았다. 망아지는 다친 곳 없이 무사히 목장으로 돌아갔다.',
  '마태피아 기록반',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2014-05-10T12:00:00.000Z'
);--> statement-breakpoint

INSERT OR IGNORE INTO timeline_events (id, story_year, title, body, author_name, owner_key_hash, created_at) VALUES (
  'official-event-2015-mataepedia-reopened',
  2015,
  '마태피아를 다시 연 날',
  '중학교에 올라간 첫 주, 오래 손대지 않았던 마태피아에 다시 모였다. 초등학교 때 적어 둔 기록은 그대로 두고 새 기록과 채팅방을 만들기로 했다. 선생님들과 마을 사람들에게 들키지 말자는 약속도 다시 했다.',
  '마태피아 기록반',
  '0000000000000000000000000000000000000000000000000000000000000000',
  '2015-03-05T12:00:00.000Z'
);--> statement-breakpoint

PRAGMA optimize;
