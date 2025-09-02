-- SQL para insertar 30 usuarios de prueba en la tabla usuarios
-- Basado en la estructura de la tabla y municipios del Huila

INSERT INTO public.usuarios (
    id, 
    nombre_completo, 
    cedula, 
    celular, 
    correo, 
    password, 
    municipio_id, 
    lugar_votacion, 
    rol_id, 
    created_by, 
    is_active, 
    created_at, 
    updated_at, 
    rating
) VALUES
-- Usuarios con diferentes roles y municipios del Huila
(4, 'María Elena Rodríguez', '12345678', '3101234567', 'maria.rodriguez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 1, 'Escuela Neiva Central', 2, 1, true, NOW(), NOW(), 5),
(5, 'Carlos Andrés Pérez', '23456789', '3112345678', 'carlos.perez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 2, 'Colegio San José Acevedo', 3, 1, true, NOW(), NOW(), 4),
(6, 'Ana Lucía González', '34567890', '3123456789', 'ana.gonzalez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 3, 'Centro Educativo El Agrado', 4, 1, true, NOW(), NOW(), 3),
(7, 'Diego Fernando López', '45678901', '3134567890', 'diego.lopez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 4, 'Institución Educativa Aipe', 2, 1, true, NOW(), NOW(), 5),
(8, 'Luz Marina Torres', '56789012', '3145678901', 'luz.torres@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 5, 'Escuela Rural Algeciras', 3, 1, true, NOW(), NOW(), 4),
(9, 'Roberto Carlos Muñoz', '67890123', '3156789012', 'roberto.munoz@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 6, 'Colegio Altamira', 4, 1, true, NOW(), NOW(), 2),
(10, 'Patricia Isabel Vargas', '78901234', '3167890123', 'patricia.vargas@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 7, 'Centro Comunitario Baraya', 2, 1, true, NOW(), NOW(), 5),
(11, 'Alejandro Javier Silva', '89012345', '3178901234', 'alejandro.silva@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 8, 'Institución Campoalegre', 3, 1, true, NOW(), NOW(), 4),
(12, 'Carmen Rosa Herrera', '90123456', '3189012345', 'carmen.herrera@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 9, 'Escuela Colombia Huila', 4, 1, true, NOW(), NOW(), 3),
(13, 'Fernando José Ramírez', '01234567', '3190123456', 'fernando.ramirez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 10, 'Centro Educativo Elías', 2, 1, true, NOW(), NOW(), 5),
(14, 'Sandra Milena Castro', '11234568', '3201234567', 'sandra.castro@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 11, 'Colegio Garzón Central', 3, 1, true, NOW(), NOW(), 4),
(15, 'Héctor Manuel Ortiz', '21234569', '3212345678', 'hector.ortiz@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 12, 'Institución Gigante', 4, 1, true, NOW(), NOW(), 2),
(16, 'Gloria Esperanza Díaz', '31234570', '3223456789', 'gloria.diaz@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 13, 'Escuela Guadalupe', 2, 1, true, NOW(), NOW(), 5),
(17, 'Iván Darío Morales', '41234571', '3234567890', 'ivan.morales@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 14, 'Centro Comunitario Hobo', 3, 1, true, NOW(), NOW(), 4),
(18, 'Esperanza del Carmen Ruiz', '51234572', '3245678901', 'esperanza.ruiz@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 15, 'Institución Íquira', 4, 1, true, NOW(), NOW(), 3),
(19, 'Julián Andrés Medina', '61234573', '3256789012', 'julian.medina@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 16, 'Colegio Isnos', 2, 1, true, NOW(), NOW(), 5),
(20, 'Olga Lucía Jiménez', '71234574', '3267890123', 'olga.jimenez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 17, 'Escuela La Argentina', 3, 1, true, NOW(), NOW(), 4),
(21, 'Mauricio Alejandro Gómez', '81234575', '3278901234', 'mauricio.gomez@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 18, 'Centro La Plata', 4, 1, true, NOW(), NOW(), 2),
(22, 'Beatriz Elena Rojas', '91234576', '3289012345', 'beatriz.rojas@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 19, 'Institución Nátaga', 2, 1, true, NOW(), NOW(), 5),
(23, 'Andrés Felipe Guerrero', '02345678', '3290123456', 'andres.guerrero@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 20, 'Colegio Oporapa', 3, 1, true, NOW(), NOW(), 4),
(24, 'Marta Cecilia Vega', '12345679', '3301234567', 'marta.vega@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 21, 'Escuela Paicol', 4, 1, true, NOW(), NOW(), 3),
(25, 'Oscar Eduardo Peña', '22345680', '3312345678', 'oscar.pena@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 22, 'Centro Educativo Palermo', 2, 1, true, NOW(), NOW(), 5),
(26, 'Rosa María Cardona', '32345681', '3323456789', 'rosa.cardona@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 23, 'Institución Palestina', 3, 1, true, NOW(), NOW(), 4),
(27, 'Jorge Luis Montoya', '42345682', '3334567890', 'jorge.montoya@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 24, 'Colegio Pital', 4, 1, true, NOW(), NOW(), 2),
(28, 'Claudia Patricia Aguilar', '52345683', '3345678901', 'claudia.aguilar@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 25, 'Escuela Pitalito Central', 2, 1, true, NOW(), NOW(), 5),
(29, 'Ricardo Antonio Salazar', '62345684', '3356789012', 'ricardo.salazar@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 26, 'Centro Rivera', 3, 1, true, NOW(), NOW(), 4),
(30, 'Liliana del Socorro Mejía', '72345685', '3367890123', 'liliana.mejia@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 27, 'Institución Saladoblanco', 4, 1, true, NOW(), NOW(), 3),
(31, 'Fabián Darío Castillo', '82345686', '3378901234', 'fabian.castillo@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 28, 'Colegio San Agustín', 2, 1, true, NOW(), NOW(), 5),
(32, 'Yolanda Mercedes Parra', '92345687', '3389012345', 'yolanda.parra@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 29, 'Escuela Santa María', 3, 1, true, NOW(), NOW(), 4),
(33, 'Nelson Emilio Varón', '03456789', '3390123456', 'nelson.varon@email.com', '$2b$10$MIwMy2dUgIRDP7/o7XGPge/IRqb5ZgpzaLskHxjyadleE26FsFnY2', 30, 'Centro Suaza', 4, 1, true, NOW(), NOW(), 2);

-- Actualizar la secuencia para evitar conflictos en futuros inserts
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- Verificar que los usuarios se insertaron correctamente
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN id >= 4 THEN 1 END) as usuarios_nuevos
FROM usuarios;

-- Mostrar distribución por municipios
SELECT 
    m.nombre as municipio,
    COUNT(u.id) as cantidad_usuarios
FROM usuarios u
JOIN municipios m ON u.municipio_id = m.id
WHERE u.id >= 4
GROUP BY m.nombre
ORDER BY cantidad_usuarios DESC;
