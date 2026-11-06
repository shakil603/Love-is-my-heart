package app.limh;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.text.InputType;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
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

/**
 * Love Is My Heart (LIMH) native Android shell.
 *
 * The community itself is a self-hosted Next.js app, so the APK is deliberately
 * a thin, secure WebView client rather than a second, divergent implementation.
 * On first launch people enter the address of their server; the choice is
 * remembered, and the gear button lets them change it at any time.
 */
public class MainActivity extends Activity {

    private static final String PREFS = "limh";
    private static final String KEY_URL = "server_url";
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

        Window window = getWindow();
        window.setStatusBarColor(PLUM);
        window.setNavigationBarColor(PLUM);

        root = new FrameLayout(this);
        root.setBackgroundColor(CREAM);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(root);

        String saved = prefs.getString(KEY_URL, BuildConfig.DEFAULT_URL);
        if (saved == null || saved.trim().isEmpty()) {
            showSetup();
        } else {
            loadApp(normalize(saved));
        }
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
                "This app is a native shell for your Love Is My Heart community. "
                        + "Paste the address of your deployed server to sign in, browse, message and upload photos.\n\n"
                        + "আপনার সার্ভারের ঠিকানা দিন। উদাহরণ: https://your-app.example.com",
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
        open.setText("Open Love Is My Heart");
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
            prefs.edit().putString(KEY_URL, normalized).apply();
            loadApp(normalized);
        });

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
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                String scheme = target.getScheme();
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
                            + "<h2 style='margin-top:36px'>Can not reach your server</h2>"
                            + "<p style='color:#6F6269;line-height:1.6'>" + url + "</p>"
                            + "<p style='color:#6F6269;line-height:1.6'>Check the address with the settings button, then try again.</p>"
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
