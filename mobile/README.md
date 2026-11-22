# تطبيق السيرة النبوية — iOS و Android

مشروع [Capacitor](https://capacitorjs.com) بيغلّف البرنامج اللي في `../seerah` في تطبيق موبايل حقيقي.
**التعديل على المحتوى والتصميم بيتعمل في `../seerah` بس**، وبعدين `npm run sync` بينسخه للتطبيقين.

## أول مرة
```bash
cd mobile
npm install
npm run sync
```

## iOS (محتاج Mac عليه Xcode)
```bash
npm run ios        # ينسخ الملفات ويفتح المشروع في Xcode
```
في Xcode: اختار Target **App** ← **Signing & Capabilities** ← Team (حساب Apple بتاعك)، واختار Simulator أو آيفونك ودوس ▶️.
المشروع بيستخدم Swift Package Manager، فمش محتاج CocoaPods.

## Android
```bash
npm run android    # يفتح المشروع في Android Studio
npm run build:apk  # أو يبني APK مباشرة (محتاج Android SDK و JDK 21)
```
الـ APK بيطلع في `android/app/build/outputs/apk/debug/app-debug.apk`.

## الأيقونات وشاشة البداية
```bash
node scripts/make-assets.js
```

## مميزات خاصة بالتطبيق
- تذكير يومي الساعة 8 مساءً بحدث من السيرة (من تبويب «المختصر»).
- يعمل بالكامل بدون إنترنت (الخطوط والبيانات جوه التطبيق).
