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
