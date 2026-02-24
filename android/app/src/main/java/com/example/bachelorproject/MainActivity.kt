package com.example.bachelorproject

import android.os.Bundle
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebView.getCurrentWebViewPackage
import android.webkit.WebView.setWebContentsDebuggingEnabled
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
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
import com.example.bachelorproject.ui.theme.BachelorProjectTheme

class Bridge(private val webView: WebView) {
    @JavascriptInterface
    fun hello(): String {
        return "Hello from Android!"
    }
}
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BachelorProjectTheme {
                WebViewScreen(url = "http://localhost:5173/")
            }
        }
    }
}

@Composable
fun WebViewScreen(url: String) {
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

                    // all the danger
                    settings.domStorageEnabled = true
                    settings.javaScriptEnabled = true
                    getSettings().javaScriptEnabled = true;
                    settings.allowFileAccess = true
                    settings.allowContentAccess = true
                    settings.allowFileAccessFromFileURLs = true
                    settings.allowUniversalAccessFromFileURLs = true

                    setWebContentsDebuggingEnabled(true)

                    addJavascriptInterface(Bridge(this), "native")

                    loadUrl(url)
                }.also { webView = it }
            }
        )
    }
}