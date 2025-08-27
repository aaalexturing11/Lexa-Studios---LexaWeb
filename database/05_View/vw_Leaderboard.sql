SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 8. Leaderboard view
CREATE   VIEW [dbo].[vw_Leaderboard] AS
SELECT TOP 10 u.username, MAX(h.score) AS top_score
  FROM dbo.highscores h
  JOIN dbo.users u ON h.user_id = u.id
 GROUP BY u.username
 ORDER BY top_score DESC;
GO
