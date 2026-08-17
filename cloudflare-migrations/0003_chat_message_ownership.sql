-- Keep existing chat history readable while giving newly written messages
-- browser-scoped edit/delete ownership. Legacy and SYSTEM rows remain NULL.
ALTER TABLE `chat_messages` ADD COLUMN `owner_key_hash` text;
