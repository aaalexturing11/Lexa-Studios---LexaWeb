-- =====================
-- SCRIPT COMPLETO DEL SISTEMA
-- =====================
-- Contiene: creación de tablas, constraints, índices, defaults,
-- procedimientos almacenados, triggers y datos iniciales.
-- Comentado en español.

-- =====================
-- 1. TABLA: roles
-- =====================
CREATE TABLE [dbo].[roles](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [name] NVARCHAR(20) NOT NULL UNIQUE, -- Nombre del rol (admin/player)
    [description] NVARCHAR(MAX) NULL     -- Descripción del rol
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];

-- =====================
-- 2. TABLA: users
-- =====================
CREATE TABLE [dbo].[users](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [username] NVARCHAR(50) NOT NULL UNIQUE,
    [email] NVARCHAR(255) NOT NULL UNIQUE,
    [password_hash] VARBINARY(32) NOT NULL,
    [salt] VARBINARY(16) NOT NULL,
    [role_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [FK_users_roles] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id])
);

-- =====================
-- 3. TABLA: games
-- =====================
CREATE TABLE [dbo].[games](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [name] NVARCHAR(100) NOT NULL,
    [embed_url] NVARCHAR(MAX) NULL,
    [description] NVARCHAR(MAX) NULL,
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [updated_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];

-- =====================
-- 4. TABLA: highscores
-- =====================
CREATE TABLE [dbo].[highscores](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] INT NOT NULL,
    [game_id] INT NOT NULL,
    [score] INT NOT NULL,
    [achieved_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [FK_highscores_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]),
    CONSTRAINT [FK_highscores_games] FOREIGN KEY ([game_id]) REFERENCES [dbo].[games]([id])
);
CREATE NONCLUSTERED INDEX [IX_highscores_game_score] ON [dbo].[highscores]([game_id] ASC, [score] DESC);

-- =====================
-- 5. TABLA: sessions
-- =====================
CREATE TABLE [dbo].[sessions](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] INT NOT NULL,
    [token] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [issued_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [expires_at] DATETIME2 NOT NULL,
    CONSTRAINT [FK_sessions_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id])
);
CREATE NONCLUSTERED INDEX [IX_sessions_user] ON [dbo].[sessions]([user_id]);

-- =====================
-- 6. TABLA: contact_messages
-- =====================
CREATE TABLE [dbo].[contact_messages](
    [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [user_id] INT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [subject] NVARCHAR(150) NULL,
    [message] NVARCHAR(MAX) NOT NULL,
    [submitted_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [FK_contact_messages_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id])
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];

-- =====================
-- 7. TABLA: bitacora
-- =====================
CREATE TABLE [dbo].[bitacora] (
    id_bitacora INT IDENTITY(1,1) PRIMARY KEY,
    usuario INT NULL,
    tabla NVARCHAR(100) NOT NULL,
    operacion NVARCHAR(10) NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- =====================
-- 8. TRIGGERS
-- =====================

-- Trigger: logea nuevo puntaje
GO
CREATE TRIGGER [tr_insert_highscore_to_bitacora]
ON [dbo].[highscores]
AFTER INSERT
AS
BEGIN
  INSERT INTO dbo.bitacora (usuario, tabla, operacion, descripcion)
  SELECT 
    i.user_id,
    'highscores',
    'INSERT',
    'Nuevo puntaje registrado: JuegoID=' + CAST(i.game_id AS NVARCHAR) +
    ', Score=' + CAST(i.score AS NVARCHAR)
  FROM inserted AS i;
END;
GO

-- Trigger: logea login exitoso
GO
CREATE TRIGGER [tr_insert_session_to_bitacora]
ON [dbo].[sessions]
AFTER INSERT
AS
BEGIN
  INSERT INTO dbo.bitacora (usuario, tabla, operacion, descripcion)
  SELECT 
    i.user_id,
    'sessions',
    'LOGIN',
    'Inicio de sesión exitoso. Token=' + CAST(i.token AS NVARCHAR)
  FROM inserted AS i;
END;
GO

-- =====================
-- 9. PROCEDIMIENTOS ALMACENADOS
-- =====================

-- Crear nuevo usuario
GO
CREATE PROCEDURE [dbo].[usp_RegisterUser]
  @username NVARCHAR(50),
  @email NVARCHAR(255),
  @password NVARCHAR(100),
  @role_id INT = 2
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @salt VARBINARY(16) = CRYPT_GEN_RANDOM(16);
  DECLARE @hash VARBINARY(32) = HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @password) + @salt);
  INSERT INTO dbo.users(username, email, password_hash, salt, role_id)
  VALUES(@username, @email, @hash, @salt, @role_id);
END;
GO

-- Login
GO
CREATE PROCEDURE [dbo].[usp_Login]
  @username NVARCHAR(50),
  @password NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @salt VARBINARY(16), @hash VARBINARY(32);
  SELECT @salt = salt FROM dbo.users WHERE username = @username;
  IF @salt IS NULL BEGIN
    SELECT CAST(NULL AS INT) AS id, CAST(NULL AS NVARCHAR(50)) AS username,
           CAST(NULL AS NVARCHAR(255)) AS email, CAST(NULL AS NVARCHAR(20)) AS role;
    RETURN;
  END;
  SET @hash = HASHBYTES('SHA2_256', CONVERT(VARBINARY(MAX), @password) + @salt);
  SELECT u.id, u.username, u.email, r.name AS role
  FROM dbo.users u
  JOIN dbo.roles r ON u.role_id = r.id
  WHERE u.username = @username AND u.password_hash = @hash;
END;
GO


-- Crear sesión
GO
CREATE PROCEDURE [dbo].[usp_CreateSession]
  @user_id INT,
  @expires_at DATETIME2,
  @out_token UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @tmp TABLE (token UNIQUEIDENTIFIER);

  INSERT INTO dbo.sessions (user_id, expires_at)
  OUTPUT INSERTED.token INTO @tmp
  VALUES (@user_id, @expires_at);

  SELECT @out_token = token FROM @tmp;
END;
GO


-- Crear highscore usando username
GO
CREATE PROCEDURE [dbo].[usp_CreateHighscoreWithUser]
  @username NVARCHAR(50),
  @game_id INT,
  @score INT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @uid INT;
  SELECT @uid = id FROM dbo.Users WHERE username = @username;
  IF @uid IS NULL BEGIN
    RAISERROR('Usuario no encontrado: %s', 16, 1, @username);
    RETURN;
  END
  INSERT INTO dbo.highscores (user_id, game_id, score)
  VALUES (@uid, @game_id, @score);
END;
GO

-- Crear mensaje de contacto
GO
CREATE PROCEDURE [dbo].[usp_CreateContactMessage]
  @user_id INT = NULL,
  @name NVARCHAR(100),
  @email NVARCHAR(255),
  @subject NVARCHAR(150) = NULL,
  @message NVARCHAR(MAX),
  @out_id INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @tmp TABLE (id INT);
  INSERT INTO dbo.contact_messages (user_id, name, email, subject, message)
  OUTPUT INSERTED.id INTO @tmp
  VALUES (@user_id, @name, @email, @subject, @message);
  SELECT @out_id = id FROM @tmp;
END;
GO

-- Obtener mensajes de contacto
GO
CREATE PROCEDURE [dbo].[usp_GetContactMessages]
AS
BEGIN
  SET NOCOUNT ON;
  SELECT id, user_id, name, email, subject, message, submitted_at
  FROM dbo.contact_messages
  ORDER BY submitted_at DESC;
END;
GO

-- Eliminar mensaje de contacto
GO
CREATE PROCEDURE [dbo].[usp_DeleteContactMessage]
  @id INT
AS
BEGIN
  SET NOCOUNT ON;
  DELETE FROM dbo.contact_messages WHERE id = @id;
END;
GO

-- Obtener administradores
GO
CREATE PROCEDURE [dbo].[usp_GetAdmins]
AS
BEGIN
  SET NOCOUNT ON;
  SELECT u.id, u.username, u.email,
         CONVERT(VARCHAR(20), u.created_at, 120) AS created_at
  FROM dbo.users u
  WHERE u.role_id = 1
  ORDER BY u.created_at DESC;
END;
GO

-- Obtener usuario por token de sesión
GO
CREATE PROCEDURE [dbo].[usp_GetSessionUser]
  @token UNIQUEIDENTIFIER,
  @out_user_id INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @tmp TABLE (user_id INT);
  INSERT INTO @tmp(user_id)
  SELECT s.user_id FROM dbo.sessions s
  WHERE s.token = @token AND s.expires_at > SYSUTCDATETIME();
  SELECT @out_user_id = user_id FROM @tmp;
END;
GO

-- Top scores
GO
CREATE PROCEDURE [dbo].[usp_GetTopHighscores]
  @TopN INT = 10
AS
BEGIN
  SET NOCOUNT ON;
  SELECT u.username, MAX(h.score) AS score
  FROM dbo.highscores h
  JOIN dbo.Users u ON u.id = h.user_id
  GROUP BY u.username
  ORDER BY score DESC
  OFFSET 0 ROWS FETCH NEXT @TopN ROWS ONLY;
END;
GO

-- =====================
-- 10. DATOS INICIALES
-- =====================
SET IDENTITY_INSERT dbo.roles ON;
INSERT INTO dbo.roles (id, name, description)
VALUES
(1, 'admin', 'Administrador del sistema'),
(2, 'player', 'Usuario/Cliente estándar');
SET IDENTITY_INSERT dbo.roles OFF;


SET IDENTITY_INSERT dbo.games ON;
INSERT INTO dbo.games (id, name, embed_url, description, created_at, updated_at)
VALUES (1, 'Campus Bonanza', 'http://http://localhost:3000/juego.html',
'RPG educativo con minijuegos de sostenibilidad en el campus',
'2025-05-19T02:28:34.8316737', '2025-05-19T02:28:34.8316737');
SET IDENTITY_INSERT dbo.games OFF;


-- =====================
-- 11. VISTAS (Views)
-- =====================

-- Vista: vw_Leaderboard
-- Muestra el TOP 10 de usuarios con su mejor puntaje
GO
CREATE VIEW [dbo].[vw_Leaderboard] AS
SELECT TOP 10
    u.username,
    MAX(h.score) AS top_score
FROM dbo.highscores h
JOIN dbo.users u ON h.user_id = u.id
GROUP BY u.username
ORDER BY top_score DESC;
GO