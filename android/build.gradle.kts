import org.gradle.api.tasks.Copy

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}

tasks.register<Copy>("copyApkToTarget") {
    dependsOn(":app:assembleDebug")

    from(project(":app").layout.buildDirectory.file("outputs/apk/debug/app-debug.apk"))
    into(layout.projectDirectory.dir("target/"))
    rename { "app.apk" }
}
