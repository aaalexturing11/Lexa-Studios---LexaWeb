CREATE TABLE [dbo].[bitacora] (
    id_bitacora INT IDENTITY(1,1) PRIMARY KEY,
    usuario INT NULL,
    tabla NVARCHAR(100) NOT NULL,
    operacion NVARCHAR(10) NOT NULL,
    descripcion NVARCHAR(MAX) NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
