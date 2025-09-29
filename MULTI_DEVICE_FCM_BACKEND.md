# Migración a Sistema Multi-Dispositivo FCM - Especificaciones Backend

## 📋 Resumen
Se ha migrado el sistema de notificaciones FCM de un token único por usuario a un sistema multi-dispositivo que permite múltiples tokens FCM por usuario.

## 🗃️ Cambios en la Base de Datos

### Nueva Tabla: `user_fcm_tokens`
```sql
CREATE TABLE user_fcm_tokens (
    id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11) NOT NULL,
    fcm_token varchar(255) NOT NULL,
    device_info JSON NULL,
    device_name varchar(100) NULL COMMENT 'Nombre del dispositivo (ej: iPhone 12, Samsung Galaxy)',
    platform varchar(20) NULL COMMENT 'Plataforma del dispositivo (ios, android, web)',
    created_at timestamp NULL DEFAULT current_timestamp(),
    updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    is_active tinyint(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY user_fcm_tokens_fcm_token_key (fcm_token),
    KEY user_fcm_tokens_user_id_idx (user_id),
    KEY user_fcm_tokens_is_active_idx (is_active),
    CONSTRAINT user_fcm_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Migración de Datos Existentes
```sql
-- Migrar tokens existentes de usuarios.fcm_token a user_fcm_tokens
INSERT INTO user_fcm_tokens (user_id, fcm_token, platform, device_name, is_active)
SELECT 
    id as user_id,
    fcm_token,
    'unknown' as platform,
    'Dispositivo existente' as device_name,
    1 as is_active
FROM usuarios 
WHERE fcm_token IS NOT NULL 
AND fcm_token != '' 
AND id NOT IN (SELECT user_id FROM user_fcm_tokens);
```

## 🔧 Modificaciones Requeridas en Backend

### 1. Endpoint: `POST /auth/register-fcm-token`

**Payload recibido del frontend:**
```json
{
  "fcm_token": "ct36CzvmRqq9W3PVdM6u1x:APA91bG...",
  "device_info": {
    "platform": "android|ios|web",
    "timestamp": "2025-09-26T23:29:46.000Z",
    "app_version": "1.0.0"
  }
}
```

**Lógica requerida:**
```javascript
// Pseudocódigo para el endpoint
app.post('/auth/register-fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcm_token, device_info } = req.body;
    const user_id = req.user.id;
    
    // Validar que el token no esté vacío
    if (!fcm_token || fcm_token.trim() === '') {
      return res.status(400).json({ error: 'FCM token is required' });
    }
    
    // Verificar si el token ya existe para este usuario
    const existingToken = await db.query(
      'SELECT * FROM user_fcm_tokens WHERE fcm_token = ? AND user_id = ?',
      [fcm_token, user_id]
    );
    
    if (existingToken.length > 0) {
      // Actualizar información del dispositivo existente
      await db.query(`
        UPDATE user_fcm_tokens 
        SET device_info = ?, 
            platform = ?, 
            updated_at = CURRENT_TIMESTAMP,
            is_active = 1
        WHERE fcm_token = ? AND user_id = ?`,
        [
          JSON.stringify(device_info),
          device_info.platform,
          fcm_token,
          user_id
        ]
      );
      
      return res.json({ 
        message: 'FCM token updated successfully',
        action: 'updated'
      });
    }
    
    // Verificar si el token existe para otro usuario (migración de dispositivo)
    const tokenFromOtherUser = await db.query(
      'SELECT * FROM user_fcm_tokens WHERE fcm_token = ?',
      [fcm_token]
    );
    
    if (tokenFromOtherUser.length > 0) {
      // Desactivar el token del usuario anterior
      await db.query(
        'UPDATE user_fcm_tokens SET is_active = 0 WHERE fcm_token = ?',
        [fcm_token]
      );
    }
    
    // Crear nuevo registro
    await db.query(`
      INSERT INTO user_fcm_tokens (user_id, fcm_token, device_info, platform, device_name, is_active)
      VALUES (?, ?, ?, ?, ?, 1)`,
      [
        user_id,
        fcm_token,
        JSON.stringify(device_info),
        device_info.platform || 'unknown',
        `Dispositivo ${device_info.platform || 'desconocido'}`
      ]
    );
    
    res.json({ 
      message: 'FCM token registered successfully',
      action: 'created'
    });
    
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. Endpoint: `GET /auth/user-devices` (Nuevo)

**Respuesta esperada:**
```json
{
  "devices": [
    {
      "id": 1,
      "fcm_token": "ct36CzvmRqq9W3PVdM6u1x:APA91bG...",
      "platform": "android",
      "device_name": "Samsung Galaxy S21",
      "is_active": true,
      "created_at": "2025-09-26T23:29:46.000Z",
      "updated_at": "2025-09-26T23:29:46.000Z"
    }
  ]
}
```

**Implementación:**
```javascript
app.get('/auth/user-devices', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const devices = await db.query(`
      SELECT id, fcm_token, platform, device_name, device_info, 
             is_active, created_at, updated_at
      FROM user_fcm_tokens 
      WHERE user_id = ? 
      ORDER BY updated_at DESC`,
      [user_id]
    );
    
    res.json({ devices });
  } catch (error) {
    console.error('Error fetching user devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 3. Endpoint: `DELETE /auth/unregister-device/:token` (Nuevo)

**Implementación:**
```javascript
app.delete('/auth/unregister-device/:token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.params;
    const user_id = req.user.id;
    
    const result = await db.query(
      'UPDATE user_fcm_tokens SET is_active = 0 WHERE fcm_token = ? AND user_id = ?',
      [token, user_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({ message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 📤 Modificaciones en Envío de Notificaciones

### Notificación a Usuario Específico
```javascript
// Obtener todos los tokens activos de un usuario
const getUserTokens = async (user_id) => {
  const tokens = await db.query(
    'SELECT fcm_token FROM user_fcm_tokens WHERE user_id = ? AND is_active = 1',
    [user_id]
  );
  return tokens.map(row => row.fcm_token);
};

// Enviar notificación a todos los dispositivos del usuario
const sendNotificationToUser = async (user_id, notification) => {
  const tokens = await getUserTokens(user_id);
  
  if (tokens.length === 0) {
    console.log(`No active tokens found for user ${user_id}`);
    return;
  }
  
  const message = {
    notification: {
      title: notification.title,
      body: notification.body
    },
    data: notification.data || {},
    tokens: tokens
  };
  
  try {
    const response = await admin.messaging().sendMulticast(message);
    
    // Procesar tokens inválidos
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });
      
      // Desactivar tokens inválidos
      if (failedTokens.length > 0) {
        await db.query(
          'UPDATE user_fcm_tokens SET is_active = 0 WHERE fcm_token IN (?)',
          [failedTokens]
        );
      }
    }
    
    console.log(`Successfully sent notification to ${response.successCount} devices`);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};
```

### Notificación Masiva (Todos los Usuarios)
```javascript
const sendMassNotification = async (notification) => {
  // Obtener todos los tokens activos en lotes
  const batchSize = 500; // FCM limit
  let offset = 0;
  let totalSent = 0;
  
  while (true) {
    const tokens = await db.query(
      'SELECT fcm_token FROM user_fcm_tokens WHERE is_active = 1 LIMIT ? OFFSET ?',
      [batchSize, offset]
    );
    
    if (tokens.length === 0) break;
    
    const tokenList = tokens.map(row => row.fcm_token);
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      tokens: tokenList
    };
    
    try {
      const response = await admin.messaging().sendMulticast(message);
      totalSent += response.successCount;
      
      // Manejar tokens fallidos
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokenList[idx]);
          }
        });
        
        if (failedTokens.length > 0) {
          await db.query(
            'UPDATE user_fcm_tokens SET is_active = 0 WHERE fcm_token IN (?)',
            [failedTokens]
          );
        }
      }
      
    } catch (error) {
      console.error(`Error sending batch starting at offset ${offset}:`, error);
    }
    
    offset += batchSize;
  }
  
  console.log(`Mass notification sent to ${totalSent} devices`);
  return totalSent;
};
```

## 🔍 Modificaciones en Endpoints de Dashboard

### Endpoint: `POST /dashboard/send-notification`
```javascript
app.post('/dashboard/send-notification', authenticateToken, requireRole(['super_admin', 'lider_principal']), async (req, res) => {
  try {
    const { titulo, mensaje, tipo, municipios } = req.body;
    
    const notification = {
      title: titulo,
      body: mensaje,
      data: {
        tipo: tipo,
        timestamp: new Date().toISOString()
      }
    };
    
    if (tipo === 'municipal' && municipios && municipios.length > 0) {
      // Notificación por municipios
      const users = await db.query(`
        SELECT DISTINCT u.id 
        FROM usuarios u 
        WHERE u.municipio_id IN (?) AND u.is_active = 1`,
        [municipios]
      );
      
      let totalSent = 0;
      for (const user of users) {
        await sendNotificationToUser(user.id, notification);
        totalSent++;
      }
      
      res.json({ 
        message: `Notification sent to users in ${municipios.length} municipalities`,
        users_targeted: totalSent
      });
      
    } else {
      // Notificación masiva
      const totalSent = await sendMassNotification(notification);
      
      res.json({ 
        message: 'Mass notification sent successfully',
        devices_reached: totalSent
      });
    }
    
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});
```

## 🧹 Limpieza de Datos (Opcional)

### Después de confirmar que funciona correctamente:
```sql
-- 1. Crear backup de la columna fcm_token
CREATE TABLE usuarios_fcm_backup AS 
SELECT id, fcm_token FROM usuarios WHERE fcm_token IS NOT NULL;

-- 2. Limpiar la columna fcm_token de usuarios
UPDATE usuarios SET fcm_token = NULL;

-- 3. Opcional: Eliminar la columna completamente
-- ALTER TABLE usuarios DROP COLUMN fcm_token;
```

## 🎯 Beneficios del Nuevo Sistema

1. **Multi-dispositivo**: Un usuario puede recibir notificaciones en múltiples dispositivos
2. **Gestión inteligente**: Los tokens inválidos se desactivan automáticamente
3. **Migración de dispositivos**: Si un token se registra en otro usuario, se migra correctamente
4. **Información detallada**: Se almacena información del dispositivo para análisis
5. **Escalabilidad**: Envío eficiente de notificaciones masivas en lotes
6. **Limpieza automática**: Los tokens se eliminan cuando se elimina un usuario

## 🔄 Estado Actual

- ✅ **Frontend actualizado**: Envía `device_info` junto con el token FCM
- ✅ **Base de datos migrada**: Tabla `user_fcm_tokens` creada y poblada
- ⏳ **Backend pendiente**: Implementar endpoints según esta especificación
- ⏳ **Pruebas**: Verificar funcionamiento completo del sistema

---
**Fecha de creación**: 26 de septiembre de 2025  
**Autor**: GitHub Copilot  
**Estado**: Especificación lista para implementación
