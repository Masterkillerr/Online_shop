-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cliente (
  id_cliente integer NOT NULL DEFAULT nextval('cliente_id_cliente_seq'::regclass),
  nombres character varying NOT NULL,
  apellidos character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  telefono character varying,
  direccion text,
  documento character varying UNIQUE,
  fecha_registro timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado boolean NOT NULL DEFAULT true,
  CONSTRAINT cliente_pkey PRIMARY KEY (id_cliente)
);
CREATE TABLE public.detalle_venta (
  id_detalle integer NOT NULL DEFAULT nextval('detalle_venta_id_detalle_seq'::regclass),
  id_venta integer NOT NULL,
  id_producto integer NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric NOT NULL CHECK (precio_unitario >= 0::numeric),
  subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  CONSTRAINT detalle_venta_pkey PRIMARY KEY (id_detalle),
  CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta) REFERENCES public.venta(id_venta),
  CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto)
);
CREATE TABLE public.producto (
  id_producto integer NOT NULL DEFAULT nextval('producto_id_producto_seq'::regclass),
  id_tipo_producto integer NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  precio numeric NOT NULL CHECK (precio >= 0::numeric),
  stock integer NOT NULL CHECK (stock >= 0),
  codigo character varying UNIQUE,
  imagen_url text,
  estado boolean NOT NULL DEFAULT true,
  fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT producto_pkey PRIMARY KEY (id_producto),
  CONSTRAINT fk_producto_tipo FOREIGN KEY (id_tipo_producto) REFERENCES public.tipo_producto(id_tipo_producto)
);
CREATE TABLE public.tipo_producto (
  id_tipo_producto integer NOT NULL DEFAULT nextval('tipo_producto_id_tipo_producto_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  estado boolean NOT NULL DEFAULT true,
  fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tipo_producto_pkey PRIMARY KEY (id_tipo_producto)
);
CREATE TABLE public.venta (
  id_venta integer NOT NULL DEFAULT nextval('venta_id_venta_seq'::regclass),
  id_cliente integer NOT NULL,
  fecha timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total numeric NOT NULL CHECK (total >= 0::numeric),
  estado character varying NOT NULL DEFAULT 'PENDIENTE'::character varying,
  metodo_pago character varying,
  CONSTRAINT venta_pkey PRIMARY KEY (id_venta),
  CONSTRAINT fk_venta_cliente FOREIGN KEY (id_cliente) REFERENCES public.cliente(id_cliente)
);