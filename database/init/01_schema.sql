CREATE DATABASE IF NOT EXISTS botica_nova_salud
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE botica_nova_salud;


CREATE TABLE roles (
  id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE     
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rol_id TINYINT UNSIGNED NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,     
  activo TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_acceso DATETIME NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;


CREATE TABLE categorias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE productos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT UNSIGNED NOT NULL,
  codigo_barras VARCHAR(50) NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  principio_activo VARCHAR(150) NULL,
  laboratorio VARCHAR(100) NULL,
  presentacion VARCHAR(60) NULL,           
  requiere_receta TINYINT(1) NOT NULL DEFAULT 0,
  precio_venta DECIMAL(10,2) NOT NULL,
  stock_minimo INT UNSIGNED NOT NULL DEFAULT 10,   
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prod_cat FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  CONSTRAINT chk_precio CHECK (precio_venta >= 0),
  INDEX idx_prod_nombre (nombre),
  INDEX idx_prod_activo (activo),
  FULLTEXT INDEX ft_prod_busqueda (nombre, principio_activo)  
) ENGINE=InnoDB;


CREATE TABLE proveedores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  razon_social VARCHAR(150) NOT NULL,
  ruc CHAR(11) NOT NULL UNIQUE,
  telefono VARCHAR(20) NULL,
  email VARCHAR(120) NULL,
  direccion VARCHAR(200) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE compras (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  nro_documento VARCHAR(30) NULL,          
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado ENUM('REGISTRADA','ANULADA') NOT NULL DEFAULT 'REGISTRADA',
  CONSTRAINT fk_compra_prov FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
  CONSTRAINT fk_compra_user FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_compra_fecha (fecha)
) ENGINE=InnoDB;


CREATE TABLE lotes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id INT UNSIGNED NOT NULL,
  compra_id INT UNSIGNED NULL,
  codigo_lote VARCHAR(50) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  cantidad_inicial INT UNSIGNED NOT NULL,
  stock_actual INT UNSIGNED NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lote_prod FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_lote_compra FOREIGN KEY (compra_id) REFERENCES compras(id),
  CONSTRAINT chk_stock_lote CHECK (stock_actual <= cantidad_inicial),
  UNIQUE KEY uq_producto_lote (producto_id, codigo_lote),
  INDEX idx_lote_fefo (producto_id, fecha_vencimiento)  
) ENGINE=InnoDB;

CREATE TABLE detalle_compras (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  compra_id INT UNSIGNED NOT NULL,
  lote_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_dc_compra FOREIGN KEY (compra_id) REFERENCES compras(id),
  CONSTRAINT fk_dc_lote FOREIGN KEY (lote_id) REFERENCES lotes(id)
) ENGINE=InnoDB;

CREATE TABLE movimientos_inventario (        
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lote_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  tipo ENUM('ENTRADA_COMPRA','SALIDA_VENTA','AJUSTE_POSITIVO','AJUSTE_NEGATIVO','MERMA_VENCIMIENTO','ANULACION_VENTA') NOT NULL,
  cantidad INT NOT NULL,
  stock_resultante INT UNSIGNED NOT NULL,
  referencia VARCHAR(60) NULL,              
  motivo VARCHAR(255) NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
  CONSTRAINT fk_mov_user FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_mov_fecha (fecha),
  INDEX idx_mov_tipo (tipo)
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo_documento ENUM('DNI','RUC','CE','OTRO') NOT NULL DEFAULT 'DNI',
  nro_documento VARCHAR(15) NOT NULL UNIQUE,
  nombres VARCHAR(150) NOT NULL,
  telefono VARCHAR(20) NULL,
  email VARCHAR(120) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE ventas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NULL,             
  usuario_id INT UNSIGNED NOT NULL,
  tipo_comprobante ENUM('TICKET','BOLETA','FACTURA') NOT NULL DEFAULT 'TICKET',
  nro_comprobante VARCHAR(20) NULL,
  fecha_inicio_atencion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
  fecha DATETIME NULL,                    
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  igv DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  metodo_pago ENUM('EFECTIVO','TARJETA','YAPE_PLIN','OTRO') NOT NULL DEFAULT 'EFECTIVO',
  estado ENUM('PENDIENTE','COMPLETADA','ANULADA') NOT NULL DEFAULT 'PENDIENTE',
  CONSTRAINT fk_venta_cli FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_venta_user FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_venta_fecha (fecha),
  INDEX idx_venta_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE detalle_ventas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  venta_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  lote_id INT UNSIGNED NOT NULL,            
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,   
  subtotal DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_dv_venta FOREIGN KEY (venta_id) REFERENCES ventas(id),
  CONSTRAINT fk_dv_prod FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_dv_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
  CONSTRAINT chk_dv_cant CHECK (cantidad > 0)
) ENGINE=InnoDB;


CREATE TABLE alertas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('STOCK_BAJO','POR_VENCER','VENCIDO','SIN_STOCK') NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  lote_id INT UNSIGNED NULL,
  mensaje VARCHAR(255) NOT NULL,
  estado ENUM('NUEVA','VISTA','ATENDIDA') NOT NULL DEFAULT 'NUEVA',
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atendida_por INT UNSIGNED NULL,
  CONSTRAINT fk_alerta_prod FOREIGN KEY (producto_id) REFERENCES productos(id),
  CONSTRAINT fk_alerta_lote FOREIGN KEY (lote_id) REFERENCES lotes(id),
  CONSTRAINT fk_alerta_user FOREIGN KEY (atendida_por) REFERENCES usuarios(id),
  INDEX idx_alerta_estado (estado, tipo)
) ENGINE=InnoDB;

CREATE TABLE auditoria (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  accion VARCHAR(50) NOT NULL,              
  tabla_afectada VARCHAR(50) NULL,
  registro_id VARCHAR(30) NULL,
  detalle JSON NULL,
  ip VARCHAR(45) NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_aud_fecha (fecha),
  INDEX idx_aud_usuario (usuario_id)
) ENGINE=InnoDB;