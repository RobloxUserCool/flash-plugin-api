plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.flashplugin.api"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.flashplugin.api"
        minSdk = 23
        targetSdk = 35
        versionCode = 2
        versionName = "1.1"
    }
}
