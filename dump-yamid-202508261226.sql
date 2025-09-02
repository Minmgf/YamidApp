--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-08-26 12:26:35

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

--
-- TOC entry 230 (class 1255 OID 32798)
-- Name: actualizar_rating_usuario(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_rating_usuario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE usuarios 
    SET rating = calcular_rating_lider(COALESCE(NEW.lider_id, OLD.lider_id)),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.lider_id, OLD.lider_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.actualizar_rating_usuario() OWNER TO postgres;

--
-- TOC entry 229 (class 1255 OID 32797)
-- Name: calcular_rating_lider(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_rating_lider(p_lider_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    promedio DECIMAL(3,2);
BEGIN
    SELECT ROUND(AVG(calificacion::DECIMAL), 2)
    INTO promedio
    FROM evaluaciones 
    WHERE lider_id = p_lider_id;
    
    RETURN COALESCE(promedio, 0);
END;
$$;


ALTER FUNCTION public.calcular_rating_lider(p_lider_id integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 24641)
-- Name: agendas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agendas (
    id integer NOT NULL,
    nota_asesor text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    titulo character varying(200) DEFAULT 'Agenda'::character varying NOT NULL,
    mes integer NOT NULL,
    anio integer NOT NULL,
    descripcion text,
    CONSTRAINT agendas_anio_check CHECK ((anio >= 2020)),
    CONSTRAINT agendas_mes_check CHECK (((mes >= 1) AND (mes <= 12)))
);


ALTER TABLE public.agendas OWNER TO postgres;

--
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE agendas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.agendas IS 'Agendas mensuales que pueden contener eventos de cualquier municipio';


--
-- TOC entry 5006 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN agendas.titulo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.agendas.titulo IS 'Título descriptivo de la agenda mensual';


--
-- TOC entry 5007 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN agendas.mes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.agendas.mes IS 'Mes de la agenda (1-12)';


--
-- TOC entry 5008 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN agendas.anio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.agendas.anio IS 'Año de la agenda';


--
-- TOC entry 5009 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN agendas.descripcion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.agendas.descripcion IS 'Descripción general de la agenda mensual';


--
-- TOC entry 224 (class 1259 OID 24648)
-- Name: agendas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agendas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agendas_id_seq OWNER TO postgres;

--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 224
-- Name: agendas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agendas_id_seq OWNED BY public.agendas.id;


--
-- TOC entry 228 (class 1259 OID 32772)
-- Name: evaluaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluaciones (
    id integer NOT NULL,
    lider_id integer NOT NULL,
    evaluador_id integer NOT NULL,
    calificacion integer NOT NULL,
    comentario text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evaluaciones_calificacion_check CHECK (((calificacion >= 1) AND (calificacion <= 5)))
);


ALTER TABLE public.evaluaciones OWNER TO postgres;

--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE evaluaciones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.evaluaciones IS 'Evaluaciones individuales de los líderes';


--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN evaluaciones.lider_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.evaluaciones.lider_id IS 'ID del líder evaluado (debe tener rol_id = 2)';


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN evaluaciones.evaluador_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.evaluaciones.evaluador_id IS 'ID del usuario que evalúa';


--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN evaluaciones.calificacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.evaluaciones.calificacion IS 'Calificación de 1 a 5 estrellas';


--
-- TOC entry 5015 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN evaluaciones.comentario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.evaluaciones.comentario IS 'Comentario opcional sobre la evaluación';


--
-- TOC entry 227 (class 1259 OID 32771)
-- Name: evaluaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.evaluaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.evaluaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5016 (class 0 OID 0)
-- Dependencies: 227
-- Name: evaluaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.evaluaciones_id_seq OWNED BY public.evaluaciones.id;


--
-- TOC entry 225 (class 1259 OID 24650)
-- Name: eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventos (
    id integer NOT NULL,
    id_agenda integer NOT NULL,
    hora time without time zone,
    nombre_evento character varying(200),
    lugar character varying(200),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    municipio_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.eventos OWNER TO postgres;

--
-- TOC entry 5017 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE eventos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.eventos IS 'Tabla de eventos asociados a agendas políticas';


--
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN eventos.fecha; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eventos.fecha IS 'Fecha específica del evento dentro del mes de la agenda';


--
-- TOC entry 5019 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN eventos.municipio_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.eventos.municipio_id IS 'Municipio donde se realizará el evento';


--
-- TOC entry 226 (class 1259 OID 24655)
-- Name: eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eventos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventos_id_seq OWNER TO postgres;

--
-- TOC entry 5020 (class 0 OID 0)
-- Dependencies: 226
-- Name: eventos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eventos_id_seq OWNED BY public.eventos.id;


--
-- TOC entry 219 (class 1259 OID 16490)
-- Name: municipios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.municipios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo_dane character varying(10),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.municipios OWNER TO postgres;

--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE municipios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.municipios IS 'Municipios del departamento del Huila';


--
-- TOC entry 220 (class 1259 OID 16494)
-- Name: municipios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.municipios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.municipios_id_seq OWNER TO postgres;

--
-- TOC entry 5022 (class 0 OID 0)
-- Dependencies: 220
-- Name: municipios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.municipios_id_seq OWNED BY public.municipios.id;


--
-- TOC entry 217 (class 1259 OID 16478)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

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

--
-- TOC entry 5023 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.roles IS 'Tabla de roles del sistema con permisos específicos';


--
-- TOC entry 5024 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN roles.puede_registrar_usuarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.roles.puede_registrar_usuarios IS 'Permiso para registrar nuevos usuarios';


--
-- TOC entry 5025 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN roles.puede_ver_metricas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.roles.puede_ver_metricas IS 'Permiso para ver métricas y estadísticas';


--
-- TOC entry 5026 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN roles.puede_gestionar_roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.roles.puede_gestionar_roles IS 'Permiso para asignar roles a usuarios';


--
-- TOC entry 5027 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN roles.acceso_completo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.roles.acceso_completo IS 'Acceso completo al sistema (super admin)';


--
-- TOC entry 218 (class 1259 OID 16489)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- TOC entry 5028 (class 0 OID 0)
-- Dependencies: 218
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 221 (class 1259 OID 16495)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    rating integer DEFAULT 0
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 5029 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuarios IS 'Usuarios del sistema con relaciones a roles y municipios';


--
-- TOC entry 5030 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN usuarios.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuarios.created_by IS 'ID del usuario que registró a este usuario';


--
-- TOC entry 5031 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN usuarios.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuarios.is_active IS 'Estado activo/inactivo del usuario';


--
-- TOC entry 5032 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN usuarios.rating; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuarios.rating IS 'Calificación del usuario (0-10)';


--
-- TOC entry 222 (class 1259 OID 16503)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5033 (class 0 OID 0)
-- Dependencies: 222
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4783 (class 2604 OID 24649)
-- Name: agendas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agendas ALTER COLUMN id SET DEFAULT nextval('public.agendas_id_seq'::regclass);


--
-- TOC entry 4792 (class 2604 OID 32775)
-- Name: evaluaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones ALTER COLUMN id SET DEFAULT nextval('public.evaluaciones_id_seq'::regclass);


--
-- TOC entry 4787 (class 2604 OID 24656)
-- Name: eventos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos ALTER COLUMN id SET DEFAULT nextval('public.eventos_id_seq'::regclass);


--
-- TOC entry 4776 (class 2604 OID 16505)
-- Name: municipios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipios ALTER COLUMN id SET DEFAULT nextval('public.municipios_id_seq'::regclass);


--
-- TOC entry 4769 (class 2604 OID 16504)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 4778 (class 2604 OID 16506)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4994 (class 0 OID 24641)
-- Dependencies: 223
-- Data for Name: agendas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agendas (id, nota_asesor, created_at, updated_at, titulo, mes, anio, descripcion) FROM stdin;
1	Mes clave para fortalecimiento territorial	2025-08-19 19:25:49.343583-05	2025-08-19 19:25:49.343583-05	Agenda Política Agosto 2025	8	2025	Agenda de actividades políticas para el mes de agosto
\.


--
-- TOC entry 4999 (class 0 OID 32772)
-- Dependencies: 228
-- Data for Name: evaluaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evaluaciones (id, lider_id, evaluador_id, calificacion, comentario, created_at, updated_at) FROM stdin;
1	1	2	4	\N	2025-07-31 09:06:34.146292-05	2025-08-23 11:19:03.167309-05
\.


--
-- TOC entry 4996 (class 0 OID 24650)
-- Dependencies: 225
-- Data for Name: eventos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventos (id, id_agenda, hora, nombre_evento, lugar, created_at, updated_at, fecha, municipio_id) FROM stdin;
5	1	08:30:00	Desayuno Campesino	Parque Acevedo	2025-08-19 22:02:47.985706-05	2025-08-26 10:17:45.366212-05	2025-08-27	2
2	1	14:30:00	Encuentro comunitario Campoalegre	Casa de la Cultura	2025-08-19 19:25:49.343583-05	2025-08-26 10:18:23.734992-05	2025-08-26	8
\.


--
-- TOC entry 4990 (class 0 OID 16490)
-- Dependencies: 219
-- Data for Name: municipios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.municipios (id, nombre, codigo_dane, created_at) FROM stdin;
1	Neiva	41001	2025-07-09 10:50:44.579456-05
2	Acevedo	41002	2025-07-09 10:50:44.579456-05
3	Agrado	41008	2025-07-09 10:50:44.579456-05
4	Aipe	41006	2025-07-09 10:50:44.579456-05
5	Algeciras	41013	2025-07-09 10:50:44.579456-05
6	Altamira	41016	2025-07-09 10:50:44.579456-05
7	Baraya	41020	2025-07-09 10:50:44.579456-05
8	Campoalegre	41026	2025-07-09 10:50:44.579456-05
9	Colombia	41078	2025-07-09 10:50:44.579456-05
10	Elías	41132	2025-07-09 10:50:44.579456-05
11	Garzón	41298	2025-07-09 10:50:44.579456-05
12	Gigante	41306	2025-07-09 10:50:44.579456-05
13	Guadalupe	41319	2025-07-09 10:50:44.579456-05
14	Hobo	41349	2025-07-09 10:50:44.579456-05
15	Íquira	41357	2025-07-09 10:50:44.579456-05
16	Isnos	41359	2025-07-09 10:50:44.579456-05
17	La Argentina	41378	2025-07-09 10:50:44.579456-05
18	La Plata	41396	2025-07-09 10:50:44.579456-05
19	Nátaga	41483	2025-07-09 10:50:44.579456-05
20	Oporapa	41503	2025-07-09 10:50:44.579456-05
21	Paicol	41518	2025-07-09 10:50:44.579456-05
22	Palermo	41524	2025-07-09 10:50:44.579456-05
23	Palestina	41530	2025-07-09 10:50:44.579456-05
24	Pital	41548	2025-07-09 10:50:44.579456-05
25	Pitalito	41551	2025-07-09 10:50:44.579456-05
26	Rivera	41615	2025-07-09 10:50:44.579456-05
27	Saladoblanco	41660	2025-07-09 10:50:44.579456-05
28	San Agustín	41676	2025-07-09 10:50:44.579456-05
29	Santa María	41770	2025-07-09 10:50:44.579456-05
30	Suaza	41791	2025-07-09 10:50:44.579456-05
31	Tarqui	41797	2025-07-09 10:50:44.579456-05
32	Tesalia	41801	2025-07-09 10:50:44.579456-05
33	Tello	41799	2025-07-09 10:50:44.579456-05
34	Teruel	41807	2025-07-09 10:50:44.579456-05
35	Timaná	41815	2025-07-09 10:50:44.579456-05
36	Villavieja	41872	2025-07-09 10:50:44.579456-05
37	Yaguará	41885	2025-07-09 10:50:44.579456-05
\.


--
-- TOC entry 4988 (class 0 OID 16478)
-- Dependencies: 217
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, nombre, descripcion, puede_registrar_usuarios, puede_ver_metricas, puede_gestionar_roles, acceso_completo, created_at, updated_at) FROM stdin;
1	super_admin	Administrador con acceso completo al sistema	t	t	t	t	2025-07-09 10:50:44.579456-05	2025-07-09 10:50:44.579456-05
2	lider_principal	Líder principal que puede registrar usuarios	t	t	f	f	2025-07-09 10:50:44.579456-05	2025-07-09 10:50:44.579456-05
3	simpatizante	Simpatizante que puede registrar usuarios	t	f	f	f	2025-07-09 10:50:44.579456-05	2025-07-09 10:50:44.579456-05
4	aliado	Aliado sin permisos de registro ni métricas	f	f	f	f	2025-07-09 10:50:44.579456-05	2025-07-09 10:50:44.579456-05
\.


--
-- TOC entry 4992 (class 0 OID 16495)
-- Dependencies: 221
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre_completo, cedula, celular, correo, password, municipio_id, lugar_votacion, rol_id, created_by, is_active, created_at, updated_at, rating) FROM stdin;
2	Manuel Navarro	1193110852	3157541225	Manuelinm2015@gmail.com	$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2	1		1	1	t	2025-07-31 09:04:42.792443-05	2025-07-31 09:04:42.792443-05	0
3	Usuario Demo	1231231231	1231231231	test@test.com	$2b$10$xYxqKF3cM2KLmQZJijo12u3rQwet7s9lhoLKfHIf/KZOP1vTViWxW	8		4	2	t	2025-08-19 18:38:24.593532-05	2025-08-19 18:38:24.593532-05	0
1	prueba 3	3333333333	3333333333	test3@test.com	$2b$10$JXucmaeSnAe5z995bXIQSOU/eEpT8F/MkVRJ7saY0qWBL7pwr5FmG	12		1	1	t	2025-07-30 11:23:02.844446-05	2025-08-23 11:19:03.167309-05	4
\.


--
-- TOC entry 5034 (class 0 OID 0)
-- Dependencies: 224
-- Name: agendas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agendas_id_seq', 1, true);


--
-- TOC entry 5035 (class 0 OID 0)
-- Dependencies: 227
-- Name: evaluaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evaluaciones_id_seq', 2, true);


--
-- TOC entry 5036 (class 0 OID 0)
-- Dependencies: 226
-- Name: eventos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventos_id_seq', 37, true);


--
-- TOC entry 5037 (class 0 OID 0)
-- Dependencies: 220
-- Name: municipios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.municipios_id_seq', 35, true);


--
-- TOC entry 5038 (class 0 OID 0)
-- Dependencies: 218
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- TOC entry 5039 (class 0 OID 0)
-- Dependencies: 222
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 3, true);


--
-- TOC entry 4820 (class 2606 OID 24658)
-- Name: agendas agendas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agendas
    ADD CONSTRAINT agendas_pkey PRIMARY KEY (id);


--
-- TOC entry 4830 (class 2606 OID 32784)
-- Name: evaluaciones evaluaciones_lider_id_evaluador_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_lider_id_evaluador_id_key UNIQUE (lider_id, evaluador_id);


--
-- TOC entry 4832 (class 2606 OID 32782)
-- Name: evaluaciones evaluaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4825 (class 2606 OID 24660)
-- Name: eventos eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);


--
-- TOC entry 4803 (class 2606 OID 16516)
-- Name: municipios municipios_codigo_dane_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_codigo_dane_key UNIQUE (codigo_dane);


--
-- TOC entry 4805 (class 2606 OID 16514)
-- Name: municipios municipios_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_nombre_key UNIQUE (nombre);


--
-- TOC entry 4807 (class 2606 OID 16512)
-- Name: municipios municipios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);


--
-- TOC entry 4799 (class 2606 OID 16510)
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- TOC entry 4801 (class 2606 OID 16508)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4823 (class 2606 OID 49221)
-- Name: agendas unique_agenda_mes_anio; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agendas
    ADD CONSTRAINT unique_agenda_mes_anio UNIQUE (mes, anio, titulo);


--
-- TOC entry 4814 (class 2606 OID 16520)
-- Name: usuarios usuarios_cedula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_cedula_key UNIQUE (cedula);


--
-- TOC entry 4816 (class 2606 OID 16522)
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- TOC entry 4818 (class 2606 OID 16518)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4821 (class 1259 OID 49217)
-- Name: idx_agendas_mes_anio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agendas_mes_anio ON public.agendas USING btree (mes, anio);


--
-- TOC entry 4833 (class 1259 OID 32796)
-- Name: idx_evaluaciones_evaluador_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluaciones_evaluador_id ON public.evaluaciones USING btree (evaluador_id);


--
-- TOC entry 4834 (class 1259 OID 32795)
-- Name: idx_evaluaciones_lider_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluaciones_lider_id ON public.evaluaciones USING btree (lider_id);


--
-- TOC entry 4826 (class 1259 OID 49218)
-- Name: idx_eventos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_eventos_fecha ON public.eventos USING btree (fecha);


--
-- TOC entry 4827 (class 1259 OID 24671)
-- Name: idx_eventos_id_agenda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_eventos_id_agenda ON public.eventos USING btree (id_agenda);


--
-- TOC entry 4828 (class 1259 OID 49219)
-- Name: idx_eventos_municipio_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_eventos_municipio_id ON public.eventos USING btree (municipio_id);


--
-- TOC entry 4808 (class 1259 OID 16542)
-- Name: idx_usuarios_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_created_at ON public.usuarios USING btree (created_at);


--
-- TOC entry 4809 (class 1259 OID 16540)
-- Name: idx_usuarios_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_created_by ON public.usuarios USING btree (created_by);


--
-- TOC entry 4810 (class 1259 OID 16541)
-- Name: idx_usuarios_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_is_active ON public.usuarios USING btree (is_active);


--
-- TOC entry 4811 (class 1259 OID 16539)
-- Name: idx_usuarios_municipio_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_municipio_id ON public.usuarios USING btree (municipio_id);


--
-- TOC entry 4812 (class 1259 OID 16538)
-- Name: idx_usuarios_rol_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_rol_id ON public.usuarios USING btree (rol_id);


--
-- TOC entry 4842 (class 2620 OID 32799)
-- Name: evaluaciones trigger_actualizar_rating; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_rating AFTER INSERT OR DELETE OR UPDATE ON public.evaluaciones FOR EACH ROW EXECUTE FUNCTION public.actualizar_rating_usuario();


--
-- TOC entry 4840 (class 2606 OID 32790)
-- Name: evaluaciones evaluaciones_evaluador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_evaluador_id_fkey FOREIGN KEY (evaluador_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4841 (class 2606 OID 32785)
-- Name: evaluaciones evaluaciones_lider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_lider_id_fkey FOREIGN KEY (lider_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4838 (class 2606 OID 24666)
-- Name: eventos fk_eventos_id_agenda; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_eventos_id_agenda FOREIGN KEY (id_agenda) REFERENCES public.agendas(id) ON DELETE CASCADE;


--
-- TOC entry 4839 (class 2606 OID 49212)
-- Name: eventos fk_eventos_municipio_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventos
    ADD CONSTRAINT fk_eventos_municipio_id FOREIGN KEY (municipio_id) REFERENCES public.municipios(id) ON DELETE RESTRICT;


--
-- TOC entry 4835 (class 2606 OID 16533)
-- Name: usuarios fk_usuarios_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_created_by FOREIGN KEY (created_by) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- TOC entry 4836 (class 2606 OID 16528)
-- Name: usuarios fk_usuarios_municipio_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_municipio_id FOREIGN KEY (municipio_id) REFERENCES public.municipios(id) ON DELETE SET NULL;


--
-- TOC entry 4837 (class 2606 OID 16523)
-- Name: usuarios fk_usuarios_rol_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT fk_usuarios_rol_id FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


-- Completed on 2025-08-26 12:26:36

--
-- PostgreSQL database dump complete
--

