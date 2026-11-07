package app.limh;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.text.InputType;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JsResult;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Love Is My Heart (LIMH) native Android shell.
 *
 * The APK opens with a complete offline demo bundled in assets/demo, so it is a
 * finished dating experience with no server and no setup. The same shell can
 * also connect to a self-hosted Love Is My Heart server: the setup screen is
 * reachable from the demo and remembers the chosen address.
 */
public class MainActivity extends Activity {

    private static final String PREFS = "limh";
    private static final String KEY_URL = "server_url";
    private static final String KEY_MODE = "app_mode";
    private static final String DEMO_HOST = "appassets.androidplatform.net";
    private static final String DEMO_URL = "https://" + DEMO_HOST + "/demo/index.html";
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private static final int PLUM = Color.parseColor("#1C101C");
    private static final int INK = Color.parseColor("#251E26");
    private static final int CREAM = Color.parseColor("#F5EFE4");
    private static final int LIME = Color.parseColor("#D8FF7A");
    private static final int MUTED = Color.parseColor("#6F6269");

    private FrameLayout root;
    private WebView webView;
    private ProgressBar progress;
    private SharedPreferences prefs;
    private String baseHost;
    private boolean showingSetup = true;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        root = new FrameLayout(this);
        root.setBackgroundColor(CREAM);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            // Android 15 (API 35) draws the app edge-to-edge, so the content
            // needs the status/navigation and keyboard insets as padding.
            // Earlier releases already lay the content out below the bars.
            if (Build.VERSION.SDK_INT < 35) {
                view.setPadding(0, 0, 0, 0);
                return insets;
            }
            int bottom = insets.getSystemWindowInsetBottom();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                bottom = Math.max(bottom, insets.getInsets(WindowInsets.Type.ime()).bottom);
            }
            view.setPadding(0, insets.getSystemWindowInsetTop(), 0, bottom);
            return insets;
        });
        setContentView(root);
        applySystemBarStyle();

        String mode = prefs.getString(KEY_MODE, "demo");
        String saved = prefs.getString(KEY_URL, "");
        if ("server".equals(mode) && !saved.isEmpty()) {
            loadApp(normalize(saved));
        } else {
            loadDemo();
        }
    }

    /** Cream chrome and dark system icons keep the demo readable on Android 15. */
    private void applySystemBarStyle() {
        Window window = getWindow();
        window.setStatusBarColor(CREAM);
        View decor = window.getDecorView();
        int flags = decor.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            window.setNavigationBarColor(CREAM);
            flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        } else {
            // Dark navigation bar keeps the white system buttons readable.
            window.setNavigationBarColor(PLUM);
        }
        decor.setSystemUiVisibility(flags);
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics()));
    }

    private String normalize(String raw) {
        String url = raw == null ? "" : raw.trim();
        if (url.isEmpty()) return "";
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    private boolean isValidServerUrl(String url) {
        try {
            Uri uri = Uri.parse(url);
            String scheme = uri.getScheme();
            return ("http".equals(scheme) || "https".equals(scheme))
                    && uri.getHost() != null
                    && !uri.getHost().isEmpty();
        } catch (Exception exception) {
            return false;
        }
    }

    private TextView label(String text, int sizeSp, int color, int style) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp);
        view.setTextColor(color);
        view.setTypeface(Typeface.create("sans-serif", style));
        view.setLineSpacing(dp(3), 1f);
        return view;
    }

    private void showSetup() {
        showingSetup = true;
        baseHost = null;
        if (webView != null) {
            root.removeView(webView);
            webView.destroy();
            webView = null;
        }
        root.removeAllViews();

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        root.addView(scroll, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(26), dp(38), dp(26), dp(38));
        scroll.addView(box, new ScrollView.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView brand = label("Love Is My Heart", 31, INK, Typeface.NORMAL);
        brand.setTypeface(Typeface.create("serif", Typeface.NORMAL));
        box.addView(brand);

        TextView acronym = label("L I M H", 11, MUTED, Typeface.BOLD);
        acronym.setLetterSpacing(0.34f);
        LinearLayout.LayoutParams acronymParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        acronymParams.topMargin = dp(6);
        box.addView(acronym, acronymParams);

        TextView kicker = label("SELF-HOSTED DATING", 10, MUTED, Typeface.BOLD);
        kicker.setLetterSpacing(0.22f);
        LinearLayout.LayoutParams kickerParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        kickerParams.topMargin = dp(42);
        box.addView(kicker, kickerParams);

        TextView heading = label("Connect to your server", 23, INK, Typeface.BOLD);
        LinearLayout.LayoutParams headingParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        headingParams.topMargin = dp(10);
        box.addView(heading, headingParams);

        TextView description = label(
                "The offline demo already works on this phone — no server needed. "
                        + "To meet real people, paste the address of your deployed Love Is My Heart server, "
                        + "then sign in, browse and message as usual.\n\n"
                        + "ডেমো ব্যবহার করতে সার্ভার লাগবে না। আসল মানুষদের সাথে মিলতে আপনার সার্ভারের ঠিকানা দিন।",
                14, MUTED, Typeface.NORMAL);
        LinearLayout.LayoutParams descriptionParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        descriptionParams.topMargin = dp(14);
        box.addView(description, descriptionParams);

        EditText input = new EditText(this);
        input.setHint("https://your-app.example.com");
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setSingleLine(true);
        input.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        input.setTextColor(INK);
        input.setHintTextColor(MUTED);
        String saved = prefs.getString(KEY_URL, BuildConfig.DEFAULT_URL);
        if (saved != null && !saved.isEmpty()) {
            input.setText(saved);
            input.setSelection(input.getText().length());
        }
        LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(54));
        inputParams.topMargin = dp(24);
        box.addView(input, inputParams);

        Button open = new Button(this);
        open.setText("Connect to server");
        open.setAllCaps(false);
        open.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        open.setTextColor(CREAM);
        GradientDrawable openBackground = new GradientDrawable();
        openBackground.setColor(PLUM);
        openBackground.setCornerRadius(dp(16));
        open.setBackground(openBackground);
        open.setPadding(dp(18), dp(14), dp(18), dp(14));
        LinearLayout.LayoutParams openParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        openParams.topMargin = dp(16);
        box.addView(open, openParams);

        open.setOnClickListener(view -> {
            String normalized = normalize(input.getText().toString());
            if (!isValidServerUrl(normalized)) {
                Toast.makeText(this, "Enter a full address, for example https://limh.example.com",
                        Toast.LENGTH_LONG).show();
                return;
            }
            loadApp(normalized);
        });

        Button demo = new Button(this);
        demo.setText("Open the offline demo");
        demo.setAllCaps(false);
        demo.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        demo.setTextColor(INK);
        GradientDrawable demoBackground = new GradientDrawable();
        demoBackground.setColor(Color.TRANSPARENT);
        demoBackground.setCornerRadius(dp(16));
        demoBackground.setStroke(dp(1), Color.parseColor("#D6CBBB"));
        demo.setBackground(demoBackground);
        demo.setPadding(dp(18), dp(13), dp(18), dp(13));
        LinearLayout.LayoutParams demoParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        demoParams.topMargin = dp(10);
        box.addView(demo, demoParams);
        demo.setOnClickListener(view -> loadDemo());

        TextView note = label(
                "The server must be reachable from this phone. A site running on your computer "
                        + "is not your phone's localhost — use your computer's LAN address or a public HTTPS address.",
                12, MUTED, Typeface.NORMAL);
        LinearLayout.LayoutParams noteParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        noteParams.topMargin = dp(18);
        box.addView(note, noteParams);
    }

    private void loadApp(String url) {
        prefs.edit().putString(KEY_MODE, "server").putString(KEY_URL, url).apply();
        loadWeb(url, false);
    }

    private void loadDemo() {
        prefs.edit().putString(KEY_MODE, "demo").apply();
        loadWeb(DEMO_URL, true);
    }

    private void loadWeb(String url, boolean demoMode) {
        showingSetup = false;
        baseHost = Uri.parse(url).getHost();
        root.removeAllViews();

        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(CREAM);
        root.addView(shell, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(ColorStateList.valueOf(LIME));
        progress.setBackgroundColor(CREAM);
        shell.addView(progress, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));

        webView = new WebView(this);
        webView.setBackgroundColor(CREAM);
        shell.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // AndroidX WebViewAssetLoader is the open-source, same-origin way to
        // serve the bundled demo. The custom path handler keeps exact control
        // over font and image MIME types on older WebView builds.
        final WebViewAssetLoader assetLoader = demoMode
                ? new WebViewAssetLoader.Builder()
                        .addPathHandler("/", new WebViewAssetLoader.PathHandler() {
                            @Override
                            public WebResourceResponse handle(String path) {
                                return serveDemoAsset(path);
                            }
                        })
                        .build()
                : null;

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                String scheme = target.getScheme();
                if ("limh".equals(scheme)) {
                    showSetup();
                    return true;
                }
                if (demoMode && DEMO_HOST.equalsIgnoreCase(target.getHost())) {
                    return false;
                }
                if (("http".equals(scheme) || "https".equals(scheme))
                        && baseHost != null && baseHost.equalsIgnoreCase(target.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, target));
                } catch (Exception ignored) {
                    // No browser installed; keep the current page.
                }
                return true;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (demoMode && assetLoader != null && request.getUrl() != null) {
                    WebResourceResponse response = assetLoader.shouldInterceptRequest(request.getUrl());
                    if (response != null) return response;
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String loadedUrl) {
                if (progress != null) progress.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    if (progress != null) progress.setVisibility(View.GONE);
                    String html = "<html><head><meta name='viewport' content='width=device-width,initial-scale=1'></head>"
                            + "<body style='font-family:sans-serif;background:#F5EFE4;color:#251E26;padding:40px 26px;text-align:center'>"
                            + "<div style='font-family:serif;font-size:30px'>Love Is My Heart</div>"
                            + "<p style='letter-spacing:.3em;font-size:10px;color:#6F6269'>L I M H</p>"
                            + "<h2 style='margin-top:36px'>" + (demoMode ? "The demo could not load" : "Can not reach your server") + "</h2>"
                            + "<p style='color:#6F6269;line-height:1.6'>" + url + "</p>"
                            + "<p style='color:#6F6269;line-height:1.6'>" + (demoMode ? "Reopen the app, or use the settings button to connect a server." : "Check the address, then try again.") + "</p>"
                            + "<a href='limh://settings' style='display:inline-block;margin-top:24px;padding:14px 22px;border-radius:14px;background:#1C101C;color:#F5EFE4;text-decoration:none;font-weight:bold'>Change server address</a>"
                            + "</body></html>";
                    view.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (progress == null) return;
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
                progress.setProgress(newProgress);
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton("OK", (dialog, which) -> result.confirm())
                        .setOnCancelListener(dialog -> result.cancel())
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton("OK", (dialog, which) -> result.confirm())
                        .setNegativeButton("Cancel", (dialog, which) -> result.cancel())
                        .setOnCancelListener(dialog -> result.cancel())
                        .show();
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception exception) {
                    filePathCallback = null;
                    return false;
                }
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String downloadUrl, String userAgent,
                                        String contentDisposition, String mimeType, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
                    String cookies = CookieManager.getInstance().getCookie(downloadUrl);
                    if (cookies != null && !cookies.isEmpty()) {
                        request.addRequestHeader("Cookie", cookies);
                    }
                    request.addRequestHeader("User-Agent", userAgent);
                    String fileName = URLUtil.guessFileName(downloadUrl, contentDisposition, mimeType);
                    request.setTitle(fileName);
                    request.setDescription("Downloading from Love Is My Heart");
                    request.setNotificationVisibility(
                            DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalFilesDir(
                            MainActivity.this, Environment.DIRECTORY_DOWNLOADS, fileName);
                    DownloadManager manager =
                            (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (manager != null) manager.enqueue(request);
                    Toast.makeText(MainActivity.this, "Download started", Toast.LENGTH_SHORT).show();
                } catch (Exception exception) {
                    Toast.makeText(MainActivity.this, "Could not start that download",
                            Toast.LENGTH_SHORT).show();
                }
            }
        });

        webView.loadUrl(url);

        if (demoMode) return;

        TextView settingsButton = new TextView(this);
        settingsButton.setText("\u2699");
        settingsButton.setTextSize(TypedValue.COMPLEX_UNIT_SP, 21);
        settingsButton.setTextColor(LIME);
        settingsButton.setGravity(Gravity.CENTER);
        settingsButton.setContentDescription("Server settings");
        GradientDrawable buttonBackground = new GradientDrawable();
        buttonBackground.setColor(Color.parseColor("#E61C101C"));
        buttonBackground.setCornerRadius(dp(22));
        settingsButton.setBackground(buttonBackground);
        settingsButton.setOnClickListener(view -> showSetup());
        FrameLayout.LayoutParams settingsParams = new FrameLayout.LayoutParams(
                dp(44), dp(44), Gravity.TOP | Gravity.END);
        settingsParams.setMargins(0, dp(12), dp(12), 0);
        root.addView(settingsButton, settingsParams);
    }

    private String mimeFor(String assetPath) {
        String path = assetPath.toLowerCase();
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".webp")) return "image/webp";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    private WebResourceResponse serveDemoAsset(String path) {
        String file = path == null ? "" : path;
        while (file.startsWith("/")) file = file.substring(1);
        if (file.isEmpty() || "demo".equals(file) || "demo/".equals(file)) file = "demo/index.html";
        if (!file.startsWith("demo/")) return null;
        String mime = mimeFor(file);
        boolean text = mime.startsWith("text/") || mime.contains("javascript")
                || mime.contains("json") || mime.contains("svg");
        try {
            InputStream stream = getAssets().open(file);
            WebResourceResponse response = new WebResourceResponse(
                    mime, text ? "UTF-8" : null, stream);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-store");
            response.setResponseHeaders(headers);
            return response;
        } catch (IOException exception) {
            return new WebResourceResponse("text/plain", "UTF-8",
                    new ByteArrayInputStream("Demo asset not found".getBytes(StandardCharsets.UTF_8)));
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback != null) {
                Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
                filePathCallback.onReceiveValue(result);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (showingSetup) {
            if ("demo".equals(prefs.getString(KEY_MODE, "demo"))) {
                loadDemo();
                return;
            }
            String saved = prefs.getString(KEY_URL, "");
            if (!saved.isEmpty()) {
                loadApp(normalize(saved));
                return;
            }
            super.onBackPressed();
            return;
        }
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            root.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
