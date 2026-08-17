-- Rewrite only untouched seeded rumor bodies in a natural student voice.
-- The old-body guard preserves any player edits made after the original seed.

UPDATE `records`
SET `body` = '학교 아래 냇물이 피처럼 빨갛게 흐른 날이 있었어. 면장은 이유도 설명하지 않고 집에 가라고만 했어. 왜 그랬던 건지는 아직 몰라.'
WHERE `id` = 'official-rumor-2011-red-creek'
  AND `kind` = 'rumor'
  AND `body` = '학교 아래 냇물이 피처럼 빨갛게 흐른 날이 있었다. 면장은 이유도 설명하지 않고 집에 가라고만 했다.';

UPDATE `records`
SET `body` = '밤에 비가 오기 딱 5분 전이면 면사무소 방송이 나와. 기상청도 틀릴 때가 있는데 이 방송은 한 번도 틀린 적이 없대. 어떻게 아는 건지는 몰라.'
WHERE `id` = 'official-rumor-2011-broadcast'
  AND `kind` = 'rumor'
  AND `body` = '밤에 비가 오기 딱 5분 전이면 면사무소 방송이 나온다. 기상청도 틀리는데 이 방송은 한 번도 틀린 적이 없대.';

UPDATE `records`
SET `body` = '준석이가 사라진 날, 윤향자 선생님이 결석이라고 말하기도 전에 출석부에서 준석이 이름을 건너뛰었다는 말이 있어. 진짜 미리 알고 있었던 건지는 몰라.'
WHERE `id` = 'official-rumor-2011-roll-call'
  AND `kind` = 'rumor'
  AND `body` = '준석이가 사라진 날, 윤향자 선생님은 결석이라고 말하기도 전에 출석부에서 준석이 이름을 건너뛰었다는 말이 있다.';

UPDATE `records`
SET `body` = '비 오기 전날 공소 쪽으로 큰 나무상자를 옮기는 어른들을 봤다는 애가 있어. 어른들은 성물함이라고 했다는데, 모양은 오래된 뒤주 같았대.'
WHERE `id` = 'official-rumor-2011-wooden-chest'
  AND `kind` = 'rumor'
  AND `body` = '비 오기 전날 공소 쪽으로 큰 나무상자를 옮기는 어른들을 봤다는 애가 있다. 성물함이라고 했다는데 모양은 오래된 뒤주 같았대.';

UPDATE `records`
SET `body` = '비 오는 밤이면 괴불림 안쪽에서 낮은 노래랑 발소리가 들린대. 성가처럼 들리는데 아는 노래는 아니었다는 말이 있어.'
WHERE `id` = 'official-rumor-2011-shrine-song'
  AND `kind` = 'rumor'
  AND `body` = '비 오는 밤 괴불림 안쪽에서 낮은 노래와 발소리가 들린다. 성가처럼 들리지만 아는 노래는 아니라고 한다.';

UPDATE `records`
SET `body` = '순교성지 안에는 서로 다른 색으로 표시된 낡은 궤짝이 다섯 개 있다는 말이 있어. 함부로 열면 안 된다고 어른들이 숨겨 둔 거래. 진짜인지는 몰라.'
WHERE `id` = 'official-rumor-2011-five-colors'
  AND `kind` = 'rumor'
  AND `body` = '순교성지 안에는 서로 다른 색으로 표시된 낡은 궤짝이 다섯 개 있다는 말이 있다. 함부로 열면 안 된다고 어른들이 숨긴대.';

UPDATE `records`
SET `body` = '순교성지 우물은 막혀 있는데도 비 오는 밤이면 안쪽에서 물소리랑 숨 쉬는 소리가 난대. 누가 직접 들은 건지는 몰라.'
WHERE `id` = 'official-rumor-2011-old-well'
  AND `kind` = 'rumor'
  AND `body` = '순교성지 우물은 막혀 있는데도 비 오는 밤이면 안쪽에서 물소리와 숨 쉬는 소리가 난다고 한다.';

UPDATE `records`
SET `body` = '사라졌던 준석이는 비 오는 밤이 지나고 다시 돌아왔어. 어디에 있었는지는 아무도 말해 주지 않았고, 준석이는 얼마 뒤 육지 학교로 전학 갔어.'
WHERE `id` = 'official-rumor-2011-returned-child'
  AND `kind` = 'rumor'
  AND `body` = '사라졌던 준석이가 비 오는 밤 뒤에 다시 돌아왔다. 어디에 있었는지는 아무도 말하지 않고, 준석이는 얼마 뒤 육지 학교로 전학 갔다.';

UPDATE `records`
SET `body` = '말총곶 등대에서 일하던 등대지기 아저씨가 어느 날 사라졌다는 말이 있어. 언제 어디서 사라졌는지, 마지막으로 누가 봤는지는 제대로 알려진 게 없어.'
WHERE `id` = 'official-rumor-2011-lighthouse-keeper'
  AND `kind` = 'rumor'
  AND `body` = '말총곶 등대에서 일하던 등대지기 아저씨가 어느 날 실종됐다는 말이 있어. 언제 어디서 사라졌는지, 마지막으로 누가 봤는지는 제대로 알려진 게 없어.';

UPDATE `records`
SET `body` = '마태 초중고등학교는 초·중·고가 한 건물에 같이 있는 좀 특이한 학교야. 비어 있는 교실도 여러 개 있어. 밤에 몰래 들어갔다가 수위 아저씨한테 들키면 큰일 난대. 수위 아저씨가 사람을 잡아먹는 커다란 뱀이라는 말도 도는데, 진짜인지는 몰라.'
WHERE `id` = 'rumor-1'
  AND `kind` = 'rumor'
  AND `body` = '마태 초중고등학교는 초·중·고가 하나로 묶인 특이한 학교고, 비어 있는 교실도 여럿 있어. 밤에 몰래 들어갔다 수위 아저씨에게 들키면 큰일 난다는 이야기, 수위 아저씨가 사람을 잡아먹는 커다란 뱀이라는 이야기가 돌아.';

UPDATE `records`
SET `body` = '말총곶 등대에서는 물귀신 노랫소리가 들린대. 비 오는 밤 괴불림에 들어가면 사람들이 길을 잃는다고 해. 마두산의 정기를 받으면 중간시험 1등을 한다는 말도 있는데, 진짜인지는 몰라.'
WHERE `id` = 'rumor-2'
  AND `kind` = 'rumor'
  AND `body` = '말총곶 등대에서는 물귀신 노랫소리가 들리고, 비 오는 밤 괴불림에서는 사람들이 길을 잃는다고 해. 마두산의 정기를 받으면 중간시험 1등을 한다는 말도 있어.';

UPDATE `records`
SET `body` = '늦게까지 학교에 남아 있던 애가 옥상 쪽에서 피리 소리를 들었대. 음악실에서 나는 소리는 아니었고, 짧은 음이 같은 간격으로 계속 반복됐다고 해. 선생님은 바람이나 배관 소리라고 했어. 진짜 피리 소리였는지는 몰라.'
WHERE `id` = 'official-rumor-2014-rooftop-flute'
  AND `kind` = 'rumor'
  AND `body` = '늦게까지 학교에 남아 있던 애가 옥상 쪽에서 피리 소리를 들었다고 한다. 음악실에서 나는 소리는 아니었고, 짧은 음이 같은 간격으로 계속 반복됐대. 선생님은 바람이나 배관 소리라고 했다. 사실인지는 모른다.';

UPDATE `records`
SET `body` = '옥상으로 올라가는 문은 비상구인데도 늘 잠겨 있어. 선생님들은 위험해서 그렇다고 하는데, 열쇠를 가진 사람도 문을 못 열었다는 말이 있어. 밤에만 열린다는 이야기도 있지만 직접 확인한 애는 없어.'
WHERE `id` = 'official-rumor-2014-locked-rooftop-door'
  AND `kind` = 'rumor'
  AND `body` = '옥상으로 올라가는 문은 비상구인데도 항상 잠겨 있다. 선생님들은 위험해서 그렇다고 하지만, 열쇠를 가지고 있는 사람도 문이 안 열렸다는 말이 있다. 밤에만 열린다는 이야기도 있지만 확인한 사람은 없다.';

UPDATE `records`
SET `body` = '가을부터 교실이랑 교무실 화분이 이상할 만큼 자주 바뀌었대. 멀쩡하던 식물이 갑자기 말라서 새 화분으로 바뀐다는 말이 있어. 선생님들은 바닷바람이나 병충해 때문이라고 했어. 죽은 화분을 전부 소각장 쪽으로 가져간다는 애도 있는데, 진짜인지는 몰라.'
WHERE `id` = 'official-rumor-2015-missing-flowerpots'
  AND `kind` = 'rumor'
  AND `body` = '가을부터 교실과 교무실 화분이 이상할 만큼 자주 바뀌었다. 멀쩡하던 식물이 갑자기 말라서 새 화분으로 교체된다는 말이 있다. 선생님들은 바닷바람이나 병충해 때문이라고 했다. 죽은 화분을 전부 소각장 쪽으로 가져간다는 애도 있다.';

UPDATE `records`
SET `body` = '학교에서는 출산휴가라고 했는데 정확한 이야기를 아는 사람은 없어. 직접 연락해 봤다는 선생님도 없고, 최근에 윤향자 선생님을 봤다는 사람도 없어. 그냥 어른들끼리만 아는 사정일 수도 있어.'
WHERE `id` = 'official-rumor-2015-yun-leave'
  AND `kind` = 'rumor'
  AND `body` = '학교에서는 출산휴가라고 했는데 정확한 이야기를 아는 사람은 없다. 직접 연락해봤다는 선생님도 없고, 최근에 윤향자 선생님을 봤다는 사람도 없다. 그냥 어른들끼리만 아는 사정일 수도 있다.';

PRAGMA optimize;
