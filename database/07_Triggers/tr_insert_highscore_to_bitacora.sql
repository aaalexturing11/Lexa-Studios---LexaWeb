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
