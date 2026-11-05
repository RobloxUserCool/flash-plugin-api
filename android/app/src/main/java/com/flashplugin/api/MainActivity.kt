package com.flashplugin.api

import android.app.Activity
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.widget.TextView
import android.graphics.Color
import android.view.Gravity

class MainActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            val webView = WebView(this)

            webView.settings.javaScriptEnabled = true
            webView.settings.domStorageEnabled = true
            webView.settings.allowFileAccess = true

            webView.webViewClient = WebViewClient()
            webView.webChromeClient = WebChromeClient()

            setContentView(webView)

            webView.loadUrl("file:///android_asset/index.html")

        } catch (e: Exception) {
            val error = TextView(this).apply {
                text = "FLASH AI ERROR\n\n${e.message}"
                textSize = 16f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                setPadding(30, 30, 30, 30)
                setBackgroundColor(Color.rgb(9, 13, 25))
            }

            setContentView(error)
        }
    }
}
