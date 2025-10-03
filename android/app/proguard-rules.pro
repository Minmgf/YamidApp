# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep line number information for debugging
-keepattributes SourceFile,LineNumberTable

# Capacitor rules
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorPlugin *;
    @com.getcapacitor.PluginMethod *;
}

# Ionic WebView rules
-keep class org.apache.cordova.** { *; }
-keep class org.chromium.** { *; }
-keep class android.webkit.** { *; }

# WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all classes that might be referenced by JavaScript
-keepclassmembers class ** {
    @android.webkit.JavascriptInterface <methods>;
}

# HTTP client rules (para tu backend)
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-keep class retrofit2.** { *; }

# JSON parsing
-keep class com.google.gson.** { *; }
-keepclassmembers,allowobfuscation class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Firebase/FCM rules (si usas notificaciones)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Reflection rules
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes InnerClasses
-keepattributes EnclosingMethod
