CREATE TABLE [dbo].[contact_messages](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] INT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [subject] NVARCHAR(150) NULL,
    [message] NVARCHAR(MAX) NOT NULL,
    [submitted_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
