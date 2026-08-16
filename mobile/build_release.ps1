$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Write-Host "Building APK..."
flutter build apk --release
if (Test-Path "build\app\outputs\flutter-apk\app-release.apk") {
    Copy-Item "build\app\outputs\flutter-apk\app-release.apk" "..\Angadi-Online.apk" -Force
    Write-Host "APK Copied to ..\Angadi-Online.apk"
}

Write-Host "Building AAB..."
flutter build appbundle --release
if (Test-Path "build\app\outputs\bundle\release\app-release.aab") {
    Copy-Item "build\app\outputs\bundle\release\app-release.aab" "..\Angadi-Online.aab" -Force
    Write-Host "AAB Copied to ..\Angadi-Online.aab"
}
