--
-- PostgreSQL database dump - YamidApp Backend
-- Nueva estructura con tablas relacionales
-- Actualizado: 2025-07-09

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ========================================
-- TABLA DE ROLES
-- ========================================

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    puede_registrar_usuarios boolean DEFAULT false,
    puede_ver_metricas boolean DEFAULT false,
    puede_gestionar_roles boolean DEFAULT false,
    acceso_completo boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.roles OWNER TO postgres;

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;
ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;

-- ========================================
-- TABLA DE MUNICIPIOS DEL HUILA
-- ========================================

CREATE TABLE public.municipios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo_dane character varying(10),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.municipios OWNER TO postgres;

CREATE SEQUENCE public.municipios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.municipios_id_seq OWNER TO postgres;
ALTER SEQUENCE public.municipios_id_seq OWNED BY public.municipios.id;

-- ========================================
-- TABLA DE USUARIOS (MODIFICADA)
-- ========================================

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    cedula character varying(20) NOT NULL,
    celular character varying(20),
    correo character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    municipio_id integer,
    lugar_votacion character varying(200),
    rol_id integer NOT NULL,
    created_by integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.usuarios OWNER TO postgres;

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;
ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;

-- ========================================
-- CONFIGURAR DEFAULTS PARA SECUENCIAS
-- ========================================

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);
ALTER TABLE ONLY public.municipios ALTER COLUMN id SET DEFAULT nextval('public.municipios_id_seq'::regclass);
ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);

-- ========================================
-- INSERTAR DATOS DE ROLES
-- ========================================

INSERT INTO public.roles (nombre, descripcion, puede_registrar_usuarios, puede_ver_metricas, puede_gestionar_roles, acceso_completo) VALUES
('super_admin', 'Administrador con acceso completo al sistema', true, true, true, true),
('lider_principal', 'Líder principal que puede registrar usuarios', true, true, false, false),
('simpatizante', 'Simpatizante que puede registrar usuarios', true, false, false, false),
('aliado', 'Aliado sin permisos de registro ni métricas', false, false, false, false);

-- ========================================
-- INSERTAR MUNICIPIOS DEL HUILA
-- ========================================

INSERT INTO public.municipios (nombre, codigo_dane) VALUES
('Neiva', '41001'),
('Acevedo', '41002'),
('Agrado', '41008'),
('Aipe', '41006'),
('Algeciras', '41013'),
('Altamira', '41016'),
('Baraya', '41020'),
('Campoalegre', '41026'),
('Colombia', '41078'),
('Elías', '41132'),
('Garzón', '41298'),
('Gigante', '41306'),
('Guadalupe', '41319'),
('Hobo', '41349'),
('Íquira', '41357'),
('Isnos', '41359'),
('La Argentina', '41378'),
('La Plata', '41396'),
('Nátaga', '41483'),
('Oporapa', '41503'),
('Paicol', '41518'),
('Palermo', '41524'),
('Palestina', '41530'),
('Pital', '41548'),
('Pitalito', '41551'),
('Rivera', '41615'),
('Saladoblanco', '41660'),
('San Agustín', '41676'),
('Santa María', '41770'),
('Suaza', '41791'),
('Tarqui', '41797'),
('Tesalia', '41801'),
('Tello', '41799'),
('Teruel', '41807'),
('Timaná', '41815'),
('Villavieja', '41872'),
('Yaguará', '41885');

-- ========================================
-- INSERTAR USUARIOS INICIALES
-- ========================================

-- Obtener IDs necesarios para las relaciones
-- Super Admin en Neiva con rol super_admin
INSERT INTO public.usuarios (nombre_completo, cedula, celular, correo, password, municipio_id, lugar_votacion, rol_id, created_by) VALUES
('Super Admin', '123456789', '3001234567', 'admin@admin.com', '$2b$10$RziQSXlljdb8bM0.7onD5eGNWZ7V0wAGCtEFRafXNc/saOaGHyTTG', 1, 'Centro Administrativo', 1, NULL),
('Usuario de Prueba', '987654321', '3009876543', 'prueba@correo.com', '$2b$10$Vn4x2pabf1cA5wvrnnkzpeT5h3.QDvT/5YbE3Wb6MAc/1YRQvrGiW', 1, 'Lugar de prueba', 1, 1);

-- ========================================
-- CONFIGURAR SECUENCIAS
-- ========================================

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);
SELECT pg_catalog.setval('public.municipios_id_seq', 37, true);
SELECT pg_catalog.setval('public.usuarios_id_seq', 2, true);

-- ========================================
-- CONSTRAINTS Y LLAVES PRIMARIAS
-- ========================================

-- Roles
ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);

-- Municipios
ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_codigo_dane_key UNIQUE (codigo_dane);

-- Usuarios
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_cedula_key UNIQUE (cedula);

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);

-- ========================================
-- LLAVES FORÁNEAS
-- ========================================

-- Relación usuarios -> roles
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_rol_id
    FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE RESTRICT;

-- Relación usuarios -> municipios
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_municipio_id
    FOREIGN KEY (municipio_id) REFERENCES public.municipios(id) ON DELETE SET NULL;

-- Relación usuarios -> usuarios (quién lo creó)
ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_created_by
    FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;

-- ========================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- ========================================

CREATE INDEX idx_usuarios_rol_id ON public.usuarios(rol_id);
CREATE INDEX idx_usuarios_municipio_id ON public.usuarios(municipio_id);
CREATE INDEX idx_usuarios_created_by ON public.usuarios(created_by);
CREATE INDEX idx_usuarios_is_active ON public.usuarios(is_active);
CREATE INDEX idx_usuarios_created_at ON public.usuarios(created_at);

-- ========================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE public.roles IS 'Tabla de roles del sistema con permisos específicos';
COMMENT ON TABLE public.municipios IS 'Municipios del departamento del Huila';
COMMENT ON TABLE public.usuarios IS 'Usuarios del sistema con relaciones a roles y municipios';

COMMENT ON COLUMN public.roles.puede_registrar_usuarios IS 'Permiso para registrar nuevos usuarios';
COMMENT ON COLUMN public.roles.puede_ver_metricas IS 'Permiso para ver métricas y estadísticas';
COMMENT ON COLUMN public.roles.puede_gestionar_roles IS 'Permiso para asignar roles a usuarios';
COMMENT ON COLUMN public.roles.acceso_completo IS 'Acceso completo al sistema (super admin)';

COMMENT ON COLUMN public.usuarios.created_by IS 'ID del usuario que registró a este usuario';
COMMENT ON COLUMN public.usuarios.is_active IS 'Estado activo/inactivo del usuario';

-- Completed on 2025-07-09
-- PostgreSQL database dump complete

