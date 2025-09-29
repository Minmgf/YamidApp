-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 26, 2025 at 11:28 PM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u346586528_yamid`
--

DELIMITER $$
--
-- Functions
--
CREATE DEFINER=`u346586528_yamid`@`127.0.0.1` FUNCTION `calcular_rating_lider` (`p_lider_id` INT) RETURNS DECIMAL(3,2) DETERMINISTIC READS SQL DATA BEGIN
    DECLARE promedio DECIMAL(3,2);
    
    -- Calcular promedio de calificaciones enteras, resultado decimal
    SELECT ROUND(AVG(calificacion), 2)
    INTO promedio
    FROM evaluaciones 
    WHERE lider_id = p_lider_id;
    
    RETURN COALESCE(promedio, 0.00);
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `agendas`
--

CREATE TABLE `agendas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL DEFAULT 'Agenda',
  `mes` int(11) NOT NULL,
  `anio` int(11) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `nota_asesor` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Dumping data for table `agendas`
--

INSERT INTO `agendas` (`id`, `titulo`, `mes`, `anio`, `descripcion`, `nota_asesor`, `created_at`, `updated_at`) VALUES
(5, 'Agenda Política Septiembre ', 9, 2025, 'Actividades de fortalecimiento territorial', 'Enfoque en municipios prioritarios', '2025-09-19 13:43:21', '2025-09-24 21:59:28');

-- --------------------------------------------------------

--
-- Table structure for table `evaluaciones`
--

CREATE TABLE `evaluaciones` (
  `id` int(11) NOT NULL,
  `lider_id` int(11) NOT NULL,
  `evaluador_id` int(11) NOT NULL,
  `calificacion` int(11) NOT NULL,
  `comentario` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Dumping data for table `evaluaciones`
--

INSERT INTO `evaluaciones` (`id`, `lider_id`, `evaluador_id`, `calificacion`, `comentario`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 5, NULL, '2025-07-31 14:06:34', '2025-09-22 19:48:15'),
(3, 2, 3, 5, NULL, '2025-09-13 13:19:46', '2025-09-13 13:28:07'),
(6, 2, 4, 5, NULL, '2025-09-15 16:32:37', '2025-09-15 16:32:37'),
(8, 1, 7, 4, 'Excelente liderazgo en la comunidad', '2025-09-19 14:19:22', '2025-09-19 14:19:22');

--
-- Triggers `evaluaciones`
--
DELIMITER $$
CREATE TRIGGER `actualizar_rating_actualizar` AFTER UPDATE ON `evaluaciones` FOR EACH ROW BEGIN
    -- Actualizar el rating del líder actual
    UPDATE usuarios 
    SET rating = calcular_rating_lider(NEW.lider_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.lider_id;
    
    -- Si cambió el líder, actualizar el anterior también
    IF OLD.lider_id != NEW.lider_id THEN
        UPDATE usuarios 
        SET rating = calcular_rating_lider(OLD.lider_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.lider_id;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `actualizar_rating_eliminar` AFTER DELETE ON `evaluaciones` FOR EACH ROW BEGIN
    UPDATE usuarios 
    SET rating = calcular_rating_lider(OLD.lider_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.lider_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `actualizar_rating_insertar` AFTER INSERT ON `evaluaciones` FOR EACH ROW BEGIN
    UPDATE usuarios 
    SET rating = calcular_rating_lider(NEW.lider_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.lider_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `eventos`
--

CREATE TABLE `eventos` (
  `id` int(11) NOT NULL,
  `id_agenda` int(11) NOT NULL,
  `fecha` date NOT NULL DEFAULT curdate(),
  `hora` time DEFAULT NULL,
  `nombre_evento` varchar(200) DEFAULT NULL,
  `lugar` varchar(200) DEFAULT NULL,
  `municipio_id` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `eventos`
--

INSERT INTO `eventos` (`id`, `id_agenda`, `fecha`, `hora`, `nombre_evento`, `lugar`, `municipio_id`, `created_at`, `updated_at`) VALUES
(57, 5, '2025-09-24', '18:00:00', 'Cena con la Comuna 1', 'Comuna 1', 1, '2025-09-19 13:54:53', '2025-09-24 21:58:17'),
(60, 5, '2025-09-25', '14:00:00', 'Reunion con Jovenes', 'Parque central Aipe', 4, '2025-09-24 22:00:15', '2025-09-24 22:00:15');

-- --------------------------------------------------------

--
-- Table structure for table `flow_watermarks`
--

CREATE TABLE `flow_watermarks` (
  `slot` varchar(50) NOT NULL,
  `watermark` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `flow_watermarks`
--

INSERT INTO `flow_watermarks` (`slot`, `watermark`) VALUES
('flow_slot', 'existence-check');

-- --------------------------------------------------------

--
-- Table structure for table `incidencias`
--

CREATE TABLE `incidencias` (
  `id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `categoria` enum('social','seguridad','ambiental','salud','educacion','transporte','vivienda','otros') NOT NULL DEFAULT 'social',
  `descripcion` text NOT NULL,
  `ciudad_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `estado` enum('pendiente','publicada','rechazada') NOT NULL DEFAULT 'pendiente',
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incidencias`
--

INSERT INTO `incidencias` (`id`, `titulo`, `categoria`, `descripcion`, `ciudad_id`, `usuario_id`, `estado`, `fecha_creacion`, `fecha_actualizacion`) VALUES
(26, 'Festival gastronómico en Garzón atrae a turistas', 'social', 'El evento anual reunió a más de 5.000 visitantes, generando una importante dinamización de la economía local.', 11, 2, 'publicada', '2025-09-13 12:58:52', '2025-09-15 15:28:54'),
(28, 'Colapso de alcantarillado en Algeciras', 'ambiental', 'Las lluvias intensas provocaron el colapso de un tramo del alcantarillado en el barrio La Unión, afectando 30 viviendas.', 5, 2, 'publicada', '2025-09-13 12:59:40', '2025-09-15 15:28:54'),
(29, 'Nuevo hospital en La Plata inicia operaciones', 'salud', 'El nuevo centro de salud cuenta con tecnología de punta y atenderá a más de 15.000 habitantes de la región.', 18, 2, 'publicada', '2025-09-13 12:59:55', '2025-09-15 15:28:54'),
(30, 'Denuncias por basuras acumuladas en Pitalito', 'ambiental', 'Habitantes de varios barrios manifiestan inconformidad por retrasos en la recolección de residuos sólidos durante la última semana.', 25, 2, 'publicada', '2025-09-13 13:00:16', '2025-09-15 15:28:54'),
(31, 'Inauguración de centro de emprendimiento en Neiva', 'social', 'La Alcaldía y la Cámara de Comercio abrieron un espacio para apoyar a jóvenes emprendedores con asesorías y recursos.', 1, 1, 'publicada', '2025-09-13 13:19:35', '2025-09-22 19:39:43'),
(32, 'Un hueco gigante en la toma', 'social', 'Un hueco gigante en la toma y la gente se cae mucho', 1, 2, 'publicada', '2025-09-15 00:03:15', '2025-09-24 21:36:36'),
(34, 'Secuestro de empresario en Pitalito', 'seguridad', 'Autoridades confirman el secuestro de un comerciante reconocido del sector cafetero. Se investiga la autoría de grupos delincuenciales que operan en la región.', 25, 3, 'rechazada', '2025-09-15 15:47:02', '2025-09-24 21:36:45'),
(36, '123123', 'salud', '123123123123', 7, 2, 'rechazada', '2025-09-22 19:49:26', '2025-09-24 22:02:56');

-- --------------------------------------------------------

--
-- Table structure for table `municipios`
--

CREATE TABLE `municipios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `codigo_dane` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `municipios`
--

INSERT INTO `municipios` (`id`, `nombre`, `codigo_dane`, `created_at`) VALUES
(1, 'Neiva', '41001', '2025-07-09 15:50:44'),
(2, 'Acevedo', '41002', '2025-07-09 15:50:44'),
(3, 'Agrado', '41008', '2025-07-09 15:50:44'),
(4, 'Aipe', '41006', '2025-07-09 15:50:44'),
(5, 'Algeciras', '41013', '2025-07-09 15:50:44'),
(6, 'Altamira', '41016', '2025-07-09 15:50:44'),
(7, 'Baraya', '41020', '2025-07-09 15:50:44'),
(8, 'Campoalegre', '41026', '2025-07-09 15:50:44'),
(9, 'Colombia', '41078', '2025-07-09 15:50:44'),
(10, 'Elías', '41132', '2025-07-09 15:50:44'),
(11, 'Garzón', '41298', '2025-07-09 15:50:44'),
(12, 'Gigante', '41306', '2025-07-09 15:50:44'),
(13, 'Guadalupe', '41319', '2025-07-09 15:50:44'),
(14, 'Hobo', '41349', '2025-07-09 15:50:44'),
(15, 'Íquira', '41357', '2025-07-09 15:50:44'),
(16, 'Isnos', '41359', '2025-07-09 15:50:44'),
(17, 'La Argentina', '41378', '2025-07-09 15:50:44'),
(18, 'La Plata', '41396', '2025-07-09 15:50:44'),
(19, 'Nátaga', '41483', '2025-07-09 15:50:44'),
(20, 'Oporapa', '41503', '2025-07-09 15:50:44'),
(21, 'Paicol', '41518', '2025-07-09 15:50:44'),
(22, 'Palermo', '41524', '2025-07-09 15:50:44'),
(23, 'Palestina', '41530', '2025-07-09 15:50:44'),
(24, 'Pital', '41548', '2025-07-09 15:50:44'),
(25, 'Pitalito', '41551', '2025-07-09 15:50:44'),
(26, 'Rivera', '41615', '2025-07-09 15:50:44'),
(27, 'Saladoblanco', '41660', '2025-07-09 15:50:44'),
(28, 'San Agustín', '41676', '2025-07-09 15:50:44'),
(29, 'Santa María', '41770', '2025-07-09 15:50:44'),
(30, 'Suaza', '41791', '2025-07-09 15:50:44'),
(31, 'Tarqui', '41797', '2025-07-09 15:50:44'),
(32, 'Tesalia', '41801', '2025-07-09 15:50:44'),
(33, 'Tello', '41799', '2025-07-09 15:50:44'),
(34, 'Teruel', '41807', '2025-07-09 15:50:44'),
(35, 'Timaná', '41815', '2025-07-09 15:50:44'),
(36, 'Villavieja', '41872', '2025-07-09 15:50:44'),
(37, 'Yaguará', '41885', '2025-07-09 15:50:44');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `puede_registrar_usuarios` tinyint(1) NOT NULL DEFAULT 0,
  `puede_ver_metricas` tinyint(1) NOT NULL DEFAULT 0,
  `puede_gestionar_roles` tinyint(1) NOT NULL DEFAULT 0,
  `acceso_completo` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `nombre`, `descripcion`, `puede_registrar_usuarios`, `puede_ver_metricas`, `puede_gestionar_roles`, `acceso_completo`, `created_at`, `updated_at`) VALUES
(1, 'super_admin', 'Administrador con acceso completo al sistema', 1, 1, 1, 1, '2025-07-09 15:50:44', '2025-07-09 15:50:44'),
(2, 'lider_principal', 'Líder principal que puede registrar usuarios', 1, 1, 0, 0, '2025-07-09 15:50:44', '2025-07-09 15:50:44'),
(3, 'simpatizante', 'Simpatizante que puede registrar usuarios', 1, 0, 0, 0, '2025-07-09 15:50:44', '2025-07-09 15:50:44'),
(4, 'aliado', 'Aliado sin permisos de registro ni métricas', 0, 0, 0, 0, '2025-07-09 15:50:44', '2025-07-09 15:50:44');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `correo` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `municipio_id` int(11) DEFAULT NULL,
  `lugar_votacion` varchar(200) DEFAULT NULL,
  `rol_id` int(11) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `fcm_token` varchar(255) DEFAULT NULL COMMENT 'Token FCM para notificaciones push'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre_completo`, `cedula`, `celular`, `correo`, `password`, `municipio_id`, `lugar_votacion`, `rol_id`, `created_by`, `is_active`, `created_at`, `updated_at`, `rating`, `fcm_token`) VALUES
(1, 'Yamid Sanabria Prueba', '3333333333', '3333333333', 'test3@test.com', '$2b$10$JXucmaeSnAe5z995bXIQSOU/eEpT8F/MkVRJ7saY0qWBL7pwr5FmG', 17, '', 1, 1, 1, '2025-07-30 16:23:02', '2025-09-22 19:48:15', 4.50, NULL),
(2, 'Manuel Navarro', '1193110852', '3001234567', 'admin@yamidapp.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 1, 'Centro Administrativo Neiva', 1, 3, 1, '2025-08-26 17:31:24', '2025-09-26 23:09:39', 5.00, ''),
(3, 'Juanito Alimana', '1231231231', '1231231231', 'test@test.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 12, '', 4, 2, 1, '2025-08-19 23:38:24', '2025-09-24 22:02:04', 0.00, NULL),
(4, 'Pedro Hernandes', '12345678', '3101234567', 'maria.rodriguez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 1, 'Escuela Neiva Central', 3, 1, 1, '2025-08-26 17:31:24', '2025-09-24 22:02:05', 0.00, NULL),
(6, 'Ana Lucía González', '34567890', '3123456789', 'ana.gonzalez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 4, 'Centro Educativo El Agrado', 4, 1, 1, '2025-08-26 17:31:24', '2025-08-26 17:31:24', 0.00, NULL),
(7, 'Diego Fernando López', '45678901', '3134567890', 'diego.lopez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 10, 'Institución Educativa Aipe', 2, 1, 1, '2025-08-26 17:31:24', '2025-09-26 23:10:21', 0.00, 'ct36CzvmRqq9W3PVdM6u1x:APA91bGnk3k20Al7TXxiqKQLu0sOvuRp4w0XsE4kUZqGFCYXJUBesLsWrMJaOSFr5JAKQNDhgOF3Oa2P3DQbb5fbQKBhCzOGEYSJ9OSGW0x5sKVOCU7QBBc'),
(8, 'Luz Marina Torres', '56789012', '3145678901', 'luz.torres@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 6, 'Escuela Rural Algeciras', 3, 1, 1, '2025-08-26 17:31:24', '2025-08-26 17:31:24', 0.00, NULL),
(39, 'Juan Pérez González', '1234567890', '3001234567', 'juan.perez@email.com', '$2b$10$IvkF4kTuctaXwCDwvkt2FuyB8G/i3p5BNgAajosXdDJptrA.VbvQq', 1, 'Escuela Central', 3, 1, 1, '2025-09-19 13:11:33', '2025-09-19 13:11:33', 0.00, NULL),
(40, 'Jhon Pulido', '11111111', '1111111111', 'prueba@test.com', '$2b$10$L8TQNJokG69dLt3el9NGYutXVB4LlVqMFK9dX55qJ/6IiyK0m9bDm', 4, '', 4, 4, 1, '2025-09-22 15:13:30', '2025-09-24 22:02:06', 0.00, NULL),
(41, 'Sebastian Morea', '11111112', '1111111111', 'prueba1@test.com', '$2b$10$zGZ8TFZkVtiY/dVp/LQr7.9aOn61UCmWlArJHBre0toXOVlWcn.sq', 4, '', 3, NULL, 1, '2025-09-22 15:13:41', '2025-09-24 22:02:06', 0.00, NULL),
(42, 'Sebastian Cerquera', '444444444', '4444444444', '4@4.com', '$2b$10$4n0WtD9.dV0LyYk.z.EnoeukpsOvC.heC1GbLV1eBvirD/fxNQSCi', 7, '', 2, 2, 1, '2025-09-22 19:48:58', '2025-09-24 22:02:07', 0.00, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `agendas`
--
ALTER TABLE `agendas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_agenda_mes_anio` (`mes`,`anio`,`titulo`),
  ADD KEY `agendas_mes_anio_idx` (`mes`,`anio`);

--
-- Indexes for table `evaluaciones`
--
ALTER TABLE `evaluaciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `evaluaciones_lider_evaluador_key` (`lider_id`,`evaluador_id`),
  ADD KEY `evaluaciones_evaluador_id_idx` (`evaluador_id`);

--
-- Indexes for table `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `eventos_id_agenda_idx` (`id_agenda`),
  ADD KEY `eventos_municipio_id_idx` (`municipio_id`);

--
-- Indexes for table `flow_watermarks`
--
ALTER TABLE `flow_watermarks`
  ADD PRIMARY KEY (`slot`);

--
-- Indexes for table `incidencias`
--
ALTER TABLE `incidencias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `incidencias_ciudad_id_idx` (`ciudad_id`),
  ADD KEY `incidencias_usuario_id_idx` (`usuario_id`),
  ADD KEY `incidencias_estado_idx` (`estado`),
  ADD KEY `incidencias_categoria_idx` (`categoria`);

--
-- Indexes for table `municipios`
--
ALTER TABLE `municipios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `municipios_codigo_dane_key` (`codigo_dane`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_nombre_key` (`nombre`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuarios_cedula_key` (`cedula`),
  ADD UNIQUE KEY `usuarios_correo_key` (`correo`),
  ADD KEY `usuarios_municipio_id_idx` (`municipio_id`),
  ADD KEY `usuarios_rol_id_idx` (`rol_id`),
  ADD KEY `usuarios_created_by_idx` (`created_by`),
  ADD KEY `usuarios_is_active_idx` (`is_active`),
  ADD KEY `usuarios_fcm_token_idx` (`fcm_token`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `agendas`
--
ALTER TABLE `agendas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `evaluaciones`
--
ALTER TABLE `evaluaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `incidencias`
--
ALTER TABLE `incidencias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `municipios`
--
ALTER TABLE `municipios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `evaluaciones`
--
ALTER TABLE `evaluaciones`
  ADD CONSTRAINT `evaluaciones_evaluador_id_fkey` FOREIGN KEY (`evaluador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `evaluaciones_lider_id_fkey` FOREIGN KEY (`lider_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `eventos`
--
ALTER TABLE `eventos`
  ADD CONSTRAINT `eventos_id_agenda_fkey` FOREIGN KEY (`id_agenda`) REFERENCES `agendas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `eventos_municipio_id_fkey` FOREIGN KEY (`municipio_id`) REFERENCES `municipios` (`id`);

--
-- Constraints for table `incidencias`
--
ALTER TABLE `incidencias`
  ADD CONSTRAINT `incidencias_ciudad_id_fkey` FOREIGN KEY (`ciudad_id`) REFERENCES `municipios` (`id`),
  ADD CONSTRAINT `incidencias_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `usuarios_municipio_id_fkey` FOREIGN KEY (`municipio_id`) REFERENCES `municipios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `usuarios_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
