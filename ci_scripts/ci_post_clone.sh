#!/bin/sh

set -e

echo "🔧 Starting post-clone script..."

# Navegar al directorio de iOS
cd ios/App

echo "📦 Installing CocoaPods dependencies..."

# Instalar dependencias de CocoaPods
pod install --repo-update

echo "✅ CocoaPods installed successfully!"

# Configurar el Team ID (opcional, pero recomendado)
defaults write com.apple.dt.Xcode IDEProvisioningTeamManagerLastSelectedTeamID "6XH8AB3Z48"

echo "✅ Post-clone script completed!"