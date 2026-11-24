package com.mohamedfouad.seerah;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // أقصى تكبير لخط النظام داخل التطبيق: يحترم الخط الكبير لكن من غير ما التصميم يتكسر
    private static final int MAX_TEXT_ZOOM = 120;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        capTextZoom();
    }

    @Override
    public void onResume() {
        super.onResume();
        capTextZoom(); // لو المستخدم غيّر حجم الخط من الإعدادات والتطبيق مفتوح
    }

    private void capTextZoom() {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        WebSettings s = getBridge().getWebView().getSettings();
        int systemZoom = Math.round(getResources().getConfiguration().fontScale * 100);
        s.setTextZoom(Math.max(100, Math.min(systemZoom, MAX_TEXT_ZOOM)));
    }
}
