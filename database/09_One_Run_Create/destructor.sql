-- =====================
-- LIMPIEZA COMPLETA DE LA BASE DE DATOS
-- =====================

-- 1. Eliminar vistas
IF OBJECT_ID('dbo.vw_Leaderboard', 'V') IS NOT NULL
  DROP VIEW dbo.vw_Leaderboard;
GO

-- 2. Eliminar triggers
IF OBJECT_ID('dbo.tr_insert_highscore_to_bitacora', 'TR') IS NOT NULL
  DROP TRIGGER dbo.tr_insert_highscore_to_bitacora;
GO
IF OBJECT_ID('dbo.tr_insert_session_to_bitacora', 'TR') IS NOT NULL
  DROP TRIGGER dbo.tr_insert_session_to_bitacora;
GO

-- 3. Eliminar procedimientos almacenados
DROP PROCEDURE IF EXISTS 
  dbo.usp_RegisterUser,
  dbo.usp_Login,
  dbo.usp_CreateSession,
  dbo.usp_CreateHighscoreWithUser,
  dbo.usp_CreateContactMessage,
  dbo.usp_GetContactMessages,
  dbo.usp_DeleteContactMessage,
  dbo.usp_GetAdmins,
  dbo.usp_GetSessionUser,
  dbo.usp_GetTopHighscores;
GO

-- 4. Eliminar tablas (en orden inverso a la creación por dependencias)
DROP TABLE IF EXISTS
  dbo.bitacora,
  dbo.contact_messages,
  dbo.sessions,
  dbo.highscores,
  dbo.games,
  dbo.users,
  dbo.roles;
GO
