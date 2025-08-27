INSERT INTO dbo.roles (id, name, description)
VALUES (1, 'admin', 'Administrador del sistema'),
       (2, 'player', 'Usuario/Cliente estándar');

SET IDENTITY_INSERT dbo.games ON;
INSERT INTO dbo.games (id, name, embed_url, description, created_at, updated_at)
VALUES (1, 'Campus Bonanza', 'http://http://localhost:3000/juego.html',
'RPG educativo con minijuegos de sostenibilidad en el campus',
'2025-05-19T02:28:34.8316737', '2025-05-19T02:28:34.8316737');
SET IDENTITY_INSERT dbo.games OFF;
