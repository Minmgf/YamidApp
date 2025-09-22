# 🔧 CORRECCIÓN PARA EL BACKEND - Firebase Admin SDK

## ❌ PROBLEMA DETECTADO
El error `admin.messaging(...).sendToDevice is not a function` indica que están usando **métodos deprecados** de Firebase Admin SDK.

## ✅ SOLUCIÓN: Actualizar métodos de envío

### 📝 **Código ANTES (Deprecado)**:
```javascript
// ❌ MÉTODO DEPRECADO - NO FUNCIONA EN v9+
admin.messaging().sendToDevice(tokens, payload, options)
```

### 📝 **Código DESPUÉS (Correcto)**:

#### Para **UN SOLO DISPOSITIVO**:
```javascript
const message = {
  notification: {
    title: 'Título de la notificación',
    body: 'Mensaje de la notificación'
  },
  data: {
    // datos extra opcionales
    tipo: 'manual',
    timestamp: new Date().toISOString()
  },
  token: fcmToken  // TOKEN DE UN SOLO DISPOSITIVO
};

// ✅ MÉTODO CORRECTO
try {
  const response = await admin.messaging().send(message);
  console.log('✅ Mensaje enviado exitosamente:', response);
  return { success: true, messageId: response };
} catch (error) {
  console.error('❌ Error enviando mensaje:', error);
  throw error;
}
```

#### Para **MÚLTIPLES DISPOSITIVOS** (Recomendado):
```javascript
const message = {
  notification: {
    title: 'Título de la notificación',
    body: 'Mensaje de la notificación'
  },
  data: {
    tipo: 'manual',
    timestamp: new Date().toISOString()
  },
  tokens: fcmTokensArray  // ARRAY DE TOKENS
};

// ✅ MÉTODO CORRECTO PARA MÚLTIPLES DISPOSITIVOS
try {
  const response = await admin.messaging().sendEachForMulticast(message);
  
  console.log(`✅ Mensajes enviados: ${response.successCount}/${response.responses.length}`);
  
  // Manejar tokens fallidos (opcional)
  if (response.failureCount > 0) {
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(fcmTokensArray[idx]);
        console.error('❌ Token falló:', fcmTokensArray[idx], resp.error);
      }
    });
    // Aquí puedes limpiar tokens inválidos de la base de datos
  }
  
  return {
    success: true,
    successCount: response.successCount,
    failureCount: response.failureCount,
    responses: response.responses
  };
} catch (error) {
  console.error('❌ Error enviando mensajes:', error);
  throw error;
}
```

## 🔧 **PASOS PARA IMPLEMENTAR**:

### 1. **Actualizar notificationService.js**:

Busca la función `enviarNotificacionManual` y reemplaza:

```javascript
// ❌ CAMBIAR ESTO:
const result = await admin.messaging().sendToDevice(tokens, payload, options);

// ✅ POR ESTO:
const message = {
  notification: {
    title: payload.notification.title,
    body: payload.notification.body
  },
  data: payload.data || {},
  tokens: tokens  // Array de tokens FCM
};

const result = await admin.messaging().sendEachForMulticast(message);
```

### 2. **Actualizar manejo de respuesta**:

```javascript
// ✅ MANEJO CORRECTO DE LA RESPUESTA
if (result.successCount > 0) {
  console.log(`✅ Notificaciones enviadas exitosamente: ${result.successCount}`);
}

if (result.failureCount > 0) {
  console.warn(`⚠️ Notificaciones fallidas: ${result.failureCount}`);
  
  // Opcional: Limpiar tokens inválidos
  const failedTokens = [];
  result.responses.forEach((resp, idx) => {
    if (!resp.success) {
      failedTokens.push(tokens[idx]);
    }
  });
  
  // Aquí puedes eliminar tokens inválidos de la BD
}

return {
  success: true,
  enviados: result.successCount,
  fallidos: result.failureCount
};
```

## 📋 **VERIFICAR VERSIÓN DE FIREBASE ADMIN SDK**:

En tu `package.json` del backend, verifica:
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0"  // Debe ser v9 o superior
  }
}
```

Si tienes una versión anterior, actualiza:
```bash
npm install firebase-admin@latest
```

## 🚨 **NOTAS IMPORTANTES**:

1. **No usar `sendToDevice`** - Está deprecado
2. **Usar `sendEachForMulticast`** para múltiples dispositivos
3. **Usar `send`** para un solo dispositivo
4. **Manejar tokens inválidos** para limpiar la base de datos
5. **La estructura del mensaje cambió** - ver ejemplos arriba

## ✅ **RESULTADO ESPERADO**:

Después de implementar estos cambios:
- ✅ Las notificaciones se enviarán correctamente
- ✅ Se recibirán en los dispositivos
- ✅ Se manejarán tokens inválidos automáticamente
- ✅ Mejor rendimiento y compatibilidad

¡Implementa estos cambios en el backend y las notificaciones funcionarán perfectamente! 🎉
