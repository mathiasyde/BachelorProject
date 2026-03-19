package com.example.bachelorproject

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebView.getCurrentWebViewPackage
import android.webkit.WebView.setWebContentsDebuggingEnabled
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.app.ActivityCompat
import com.example.bachelorproject.ui.theme.BachelorProjectTheme
import com.google.android.gms.location.LocationServices
import com.google.android.gms.tasks.Tasks
import org.json.JSONObject

val NECESSARY_PERMISSIONS = arrayOf(
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION,
    Manifest.permission.ACCESS_BACKGROUND_LOCATION,
)

class Bridge(
    private val context: Context,
    private val onPermissionRequest: () -> Unit
) {
    @JavascriptInterface
    fun hello(name: String): String {
        return "Hello $name from Android!"
    }

    @JavascriptInterface
    fun requestPermissions() {
        onPermissionRequest()
    }

    @JavascriptInterface
    fun getPermissionStatus(): String {
        val permissions = NECESSARY_PERMISSIONS

        val result = JSONObject()
        for (permission in permissions) {
            val isGranted = ActivityCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
            result.put(permission, isGranted)
        }

        return result.toString()
    }

    @JavascriptInterface
    fun gps(): String? {
        val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

        // Check permissions
        if (ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED &&
            ActivityCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return "ERROR"
        }

        return try {
            val location = Tasks.await(fusedLocationClient.lastLocation)
            location?.let { "${it.latitude},${it.longitude}" }
        } catch (e: Exception) {
            Log.e("Bridge", "Error getting location", e)
            null
        }
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BachelorProjectTheme {
                val permissionLauncher = rememberLauncherForActivityResult(
                    ActivityResultContracts.RequestMultiplePermissions()
                ) { permissions ->
                    val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
                    val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false

                    if (fineGranted || coarseGranted) {
                        Log.d("Permissions", "Location permission granted")
                    } else {
                        Log.d("Permissions", "Location permission denied")
                    }
                }

                WebViewScreen(
                    url = "http://localhost:5173/",
                    onPermissionRequest = {
                        permissionLauncher.launch(
                          NECESSARY_PERMISSIONS
                        )
                    }
                )
            }
        }
    }
}

@Composable
fun WebViewScreen(url: String, onPermissionRequest: () -> Unit) {
    var webView by remember { mutableStateOf<WebView?>(null) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { webView?.reload() }) {
                Icon(Icons.Default.Refresh, contentDescription = "Reload")
            }
        }
    ) { paddingValues ->
        AndroidView(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            factory = { context ->
                WebView(context).apply {
                    val pkg = getCurrentWebViewPackage()
                    Log.d("WV", "WebView provider: ${pkg?.packageName} ${pkg?.versionName}")

                    settings.domStorageEnabled = true
                    settings.javaScriptEnabled = true
                    settings.allowFileAccess = true
                    settings.allowContentAccess = true
                    settings.allowFileAccessFromFileURLs = true
                    settings.allowUniversalAccessFromFileURLs = true

                    setWebContentsDebuggingEnabled(true)
                    addJavascriptInterface(Bridge(context, onPermissionRequest), "native")

                    loadUrl(url)
                }.also { webView = it }
            }
        )
    }
}
