DELETE FROM comments
WHERE section_id IN (
  SELECT 'timeline:' || id
  FROM timeline_events
  WHERE story_year = 2011
    AND title = '테스트할게.'
);--> statement-breakpoint
DELETE FROM timeline_events
WHERE story_year = 2011
  AND title = '테스트할게.';--> statement-breakpoint
PRAGMA optimize;
