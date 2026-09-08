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
    namespace = "com.angadi.angadi_online"
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
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as? String ?: "upload"
            keyPassword = keystoreProperties["keyPassword"] as? String ?: "villagemarket2026"
            val rawStore = keystoreProperties["storeFile"] as? String ?: "upload-keystore.jks"
            val candidateFile = file(rawStore)
            storeFile = if (candidateFile.exists()) candidateFile else rootProject.file(rawStore)
            storePassword = keystoreProperties["storePassword"] as? String ?: "villagemarket2026"
            println("=== RELEASE SIGNING CONFIGURED: storeFile=${storeFile?.absolutePath} exists=${storeFile?.exists()} ===")
        }
    }

    defaultConfig {
        applicationId = "com.angadi.angadi_online"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }

    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

flutter {
    source = "../.."
}

gradle.buildFinished {
    try {
        val targetApk = File("D:/Labeeb/Online Shop/Angadi-Online.apk")
        val targetAab = File("D:/Labeeb/Online Shop/Angadi-Online.aab")
        targetApk.parentFile?.mkdirs()
        
        val searchDirs = listOf(
            File(rootProject.projectDir, "../../build/app/outputs"),
            File(projectDir, "build/outputs"),
            File(rootProject.projectDir, "app/build/outputs")
        )
        for (dir in searchDirs) {
            if (!dir.exists()) continue
            dir.walkTopDown().filter { f: File -> f.isFile && f.name == "app-release.apk" }.forEach { apk: File ->
                apk.copyTo(targetApk, overwrite = true)
                println("=== SUCCESS COPYING APK from ${apk.absolutePath}: Target size=${targetApk.length()} bytes ===")
            }
            dir.walkTopDown().filter { f: File -> f.isFile && f.name == "app-release.aab" }.forEach { aab: File ->
                aab.copyTo(targetAab, overwrite = true)
                println("=== SUCCESS COPYING AAB from ${aab.absolutePath}: Target size=${targetAab.length()} bytes ===")
            }
        }
    } catch (e: Exception) {
        println("=== COPY ERROR: ${e.message} ===")
    }
}

dependencies {
    implementation("androidx.multidex:multidex:2.0.1")
}
