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
