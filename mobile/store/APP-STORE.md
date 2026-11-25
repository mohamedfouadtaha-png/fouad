# نشر «السيرة النبوية» على App Store

## الجاهز في المشروع
- النسخة **1.1 (build 2)**، للآيفون فقط، وبالطول بس (Portrait). كده مش محتاجين صور شاشة للآيباد. مستخدمين الآيباد يقدروا يشغّلوا نسخة الآيفون عادي.
- `ITSAppUsesNonExemptEncryption = NO` في Info.plist، عشان سؤال التشفير ما يتكررش مع كل رفع.
- الأيقونة 1024 من غير شفافية، ودي شرط من Apple.

| المطلوب في App Store Connect | الجاهز |
|---|---|
| Screenshots (iPhone 6.9") | `ios-screenshots/*.png`، 8 صور مقاس 1290×2796 |
| Privacy Policy URL | `https://mohamedfouadtaha-png.github.io/fouad/seerah/privacy/` |
| Support URL | `https://mohamedfouadtaha-png.github.io/fouad/seerah/support/` |

---

## 1) Xcode على الماك
**Xcode ← Settings ← Accounts**: لازم يظهر حسابك وتحته فريق **مش** مكتوب جنبه "Personal Team". الـ **Team ID** بتاع الحساب المدفوع ممكن يكون مختلف عن القديم.

## 2) إنشاء التطبيق في App Store Connect
https://appstoreconnect.apple.com ← **Apps ← + ← New App**
- **Platform:** iOS
- **Name:** `السيرة النبوية`. لو قالك الاسم مستخدم، جرّب `السيرة النبوية - شجرة النسب`. الحد الأقصى 30 حرف.
- **Primary language:** Arabic
- **Bundle ID:** `com.mohamedfouad.seerah`. لو مش ظاهر في القايمة، سجّله الأول من developer.apple.com ← Certificates, IDs & Profiles ← Identifiers ← +، أو Xcode هيسجّله لوحده أول ما ترفع.
- **SKU:** `seerah-ios-001`
- **User Access:** Full Access

## 3) الأرشفة والرفع (جلسة الماك)
```bash
cd mobile && npm run sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath ios/build/Seerah.xcarchive \
  -allowProvisioningUpdates DEVELOPMENT_TEAM=<TEAM_ID> CODE_SIGN_STYLE=Automatic archive
xcodebuild -exportArchive -archivePath ios/build/Seerah.xcarchive \
  -exportOptionsPlist ExportOptions.plist -allowProvisioningUpdates
```
أو من Xcode نفسه: **Product ← Archive ← Distribute App ← App Store Connect ← Upload**.
بعد الرفع، الـ build بياخد من 5 لـ 30 دقيقة لحد ما يظهر في تبويب **TestFlight**.

## 4) TestFlight
- **Internal Testing:** ضيف نفسك، ونزّل تطبيق **TestFlight** على الآيفون، وجرّب. الاختبار الداخلي مش محتاج مراجعة من Apple.
- لو عاوز تبعته لناس من برّه فريقك (External Testing)، ده محتاج مراجعة سريعة من Apple الأول.

## 5) App Information / Pricing / Privacy
| الخانة | القيمة |
|---|---|
| Category | Primary: **Books** · Secondary: **Education** |
| Age Rating | جاوب **None / No** على كل الأسئلة، والنتيجة **4+** |
| Content Rights | No, it does not contain third-party content that requires rights |
| App Privacy | **Data Not Collected** |
| Pricing | **Free** · Availability: All countries |

## 6) صفحة الإصدار 1.1
**Subtitle** (30 حرف):
```
شجرة النسب والغزوات والصحابة
```
**Promotional Text** (170 حرف):
```
سيرة النبي ﷺ مبسطة: شجرة نسب دائرية تفاعلية، والغزوات، والصحابة، وحدث جديد من السيرة كل يوم. بدون إنترنت وبدون إعلانات.
```
**Keywords** (100 حرف، مفصولة بفواصل من غير مسافات):
```
سيرة,النبي,محمد,رسول,الله,صحابة,غزوات,بدر,أحد,نسب,شجرة,أمهات المؤمنين,إسلام,تاريخ,قصص,الهجرة
```
**Description:** نفس الوصف الطويل اللي في `GOOGLE-PLAY.md`، القسم 4.

**Copyright:** `2026 <اسمك أو اسم الحساب>`

**App Review Information:**
- Sign-in required: **No**
- Contact: اسمك، وتليفونك، وإيميلك. دول بيوصلوا لفريق المراجعة بس، ومش بيظهروا للناس.
- **Notes** (بالإنجليزي عشان المراجِع):
```
Seerah is an educational app about the life of Prophet Muhammad (peace be upon him).
All content (interactive family tree with pinch-zoom, timeline, battles, companions, quiz) is bundled in the app and works fully offline.
Native features: optional daily local notification with an event from the Seerah (Settings > Daily reminder), offline storage of favorites.
No account, no ads, no data collection.
```

## 7) الإرسال للمراجعة
في صفحة الإصدار: **Build ← +**، واختار build 2، وبعدين **Add for Review** وبعدها **Submit for Review**.
المراجعة غالبًا بتاخد من 24 لـ 48 ساعة. ولو اترفض، Apple بتبعت السبب، ونصلّحه ونرفع build جديد.

> **كل تحديث جاي:** زوّد `CURRENT_PROJECT_VERSION` (2 ← 3) دايمًا، وغيّر `MARKETING_VERSION` (1.1 ← 1.2) لو الإصدار نفسه اتغير. الاتنين في Xcode، أو في ملف `project.pbxproj`.
