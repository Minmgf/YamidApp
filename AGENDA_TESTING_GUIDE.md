# 🗓️ Guía de Pruebas para la Agenda Mejorada

## 📡 Endpoints para probar en Postman

### 1. **Crear una nueva agenda**
```
Método: POST
URL: http://localhost:3000/api/agendas
Headers:
  Content-Type: application/json
  Authorization: Bearer [tu_token]

Body (raw JSON):
{
  "municipio_id": 1,
  "fecha": "2025-08-15",
  "nota_asesor": "Agenda estratégica para el mes de agosto en Neiva"
}
```

### 2. **Agregar eventos a la agenda**
```
Método: POST
URL: http://localhost:3000/api/agendas/[ID_AGENDA]/eventos
Headers:
  Content-Type: application/json
  Authorization: Bearer [tu_token]

Body (raw JSON):
{
  "nombre_evento": "Reunión matutina con líderes",
  "hora": "09:00",
  "lugar": "Salón principal del municipio"
}
```

### 3. **Más ejemplos de eventos**
```
{
  "nombre_evento": "Almuerzo comunitario",
  "hora": "12:30",
  "lugar": "Patio central"
}

{
  "nombre_evento": "Reunión vespertina",
  "hora": "15:00",
  "lugar": "Salón de juntas"
}

{
  "nombre_evento": "Cierre del día",
  "hora": "17:30",
  "lugar": "Auditorio municipal"
}
```

### 4. **Ver agendas de un municipio**
```
Método: GET
URL: http://localhost:3000/api/agendas/[MUNICIPIO_ID]
Headers:
  Authorization: Bearer [tu_token]
```

### 5. **Ver eventos de una agenda**
```
Método: GET
URL: http://localhost:3000/api/agendas/[AGENDA_ID]/eventos
Headers:
  Authorization: Bearer [tu_token]
```

## 🎯 Funcionalidades Implementadas

### ✅ **Para Usuarios Normales:**
- Ver agendas de su municipio
- Filtrar por fecha
- Ver eventos de cada agenda
- Interfaz intuitiva y responsive

### ✅ **Para Administradores:**
- Crear nuevas agendas
- Agregar eventos a las agendas
- Modal de creación paso a paso
- Validaciones completas

### ✅ **Características del Frontend:**
- **Servicio AgendaService**: Maneja todas las operaciones de API
- **Página de Agenda mejorada**: Lista las agendas del municipio del usuario
- **Modal CreateAgenda**: Proceso guiado para crear agendas y eventos
- **Filtrado por fecha**: Selector de fecha para ver eventos específicos
- **Design responsive**: Se adapta a móviles y tablets
- **Autenticación**: Solo usuarios autenticados pueden ver/crear agendas

## 🔧 Estructura de Datos

### **Agenda:**
```typescript
{
  id: number,
  municipio_id: number,
  fecha: string, // YYYY-MM-DD
  nota_asesor?: string,
  eventos?: AgendaEvento[]
}
```

### **Evento:**
```typescript
{
  id: number,
  agenda_id: number,
  nombre_evento: string,
  hora: string, // HH:mm
  lugar: string
}
```

## 🚀 Cómo probar en la aplicación

1. **Inicia sesión** con cualquier usuario
2. **Ve a la página Agenda** desde el menú de navegación
3. **Verás las agendas** de tu municipio (si existen)
4. **Usa el selector de fecha** para filtrar eventos
5. **Si eres administrador**, verás un botón flotante (+) para crear agendas

## 📱 Casos de Uso

### **Usuario Normal (Simpatizante/Aliado):**
- Consulta la agenda de su municipio
- Ve los eventos programados
- Filtra por fechas específicas

### **Administrador (Super Admin/Líder Principal):**
- Todo lo anterior +
- Crea nuevas agendas
- Agrega eventos a las agendas
- Gestiona la programación municipal

## 🎨 UI/UX Mejorada

- **Cards elegantes** para cada agenda
- **Timeline visual** para los eventos
- **Iconos descriptivos** (calendario, hora, ubicación)
- **Estados de carga** y mensajes informativos
- **Animaciones suaves** y transiciones
- **Diseño Material Design** con Ionic

La agenda ahora está completamente funcional y lista para usarse con el backend que describiste! 🎉
