

set -e

echo "🔧 Starting pre-xcodebuild script..."
echo "📍 Current directory: $(pwd)"

# Instalar dependencias de Node
echo "📦 Installing npm dependencies..."
npm ci

# Build de la app (si usas Ionic/Angular/React)
echo "🔨 Building app..."
npm run build

# Sincronizar Capacitor
echo "⚡ Syncing Capacitor..."
npx cap sync ios

echo "✅ Pre-xcodebuild script completed!"
