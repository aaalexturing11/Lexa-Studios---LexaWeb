CREATE TABLE [dbo].[roles](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [name] NVARCHAR(20) NOT NULL UNIQUE,
    [description] NVARCHAR(MAX) NULL
);
