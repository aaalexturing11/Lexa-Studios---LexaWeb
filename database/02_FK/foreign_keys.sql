ALTER TABLE [dbo].[users] ADD CONSTRAINT [FK_users_roles] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]);
ALTER TABLE [dbo].[highscores] ADD CONSTRAINT [FK_highscores_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]);
ALTER TABLE [dbo].[highscores] ADD CONSTRAINT [FK_highscores_games] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id]);
ALTER TABLE [dbo].[sessions] ADD CONSTRAINT [FK_sessions_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]);
ALTER TABLE [dbo].[contact_messages] ADD CONSTRAINT [FK_contact_messages_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]);
