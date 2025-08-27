CREATE TABLE [dbo].[highscores](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] INT NOT NULL,
    [game_id] INT NOT NULL,
    [score] INT NOT NULL,
    [achieved_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
