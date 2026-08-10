import java.util.Properties
import java.io.FileInputStream
import java.io.File

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.villagemarket.village_market"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    defaultConfig {
        applicationId = "com.villagemarket.village_market"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            if (keystorePropertiesFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}

gradle.buildFinished {
    try {
        val targetFile = File("D:/Labeeb/Online Shop/Angadi-Online.apk")
        val artifactFile = File("C:/Users/Administrator/.gemini/antigravity/brain/3379a72f-e25b-427d-84f2-034b22f85ed2/Angadi-Online.apk")
        targetFile.parentFile?.mkdirs()
        artifactFile.parentFile?.mkdirs()
        val tempDir = File(System.getProperty("java.io.tmpdir"))
        tempDir.walkTopDown().filter { f: File -> f.isFile && f.name == "app-release.apk" }.forEach { apk: File ->
            apk.copyTo(targetFile, overwrite = true)
            apk.copyTo(artifactFile, overwrite = true)
            println("=== SUCCESS COPYING ${apk.name}: Target size=${targetFile.length()} bytes, Artifact size=${artifactFile.length()} bytes ===")
        }
    } catch (e: Exception) {
        println("=== COPY ERROR: ${e.message} ===")
    }
}
