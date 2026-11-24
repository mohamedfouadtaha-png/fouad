# نشر «السيرة النبوية» على Google Play

## الملفات الجاهزة في الفولدر ده
| الملف | يتحط فين في Play Console |
|---|---|
| `icon-512.png` | Store listing ← App icon |
| `feature-1024x500.png` | Store listing ← Feature graphic |
| `screenshots/*.png` (8 صور 1080×1920) | Store listing ← Phone screenshots (حط من 4 لـ 8) |
| سياسة الخصوصية | `https://mohamedfouadtaha-png.github.io/fouad/seerah/privacy/` |

---

## 1) مفتاح التوقيع (مرة واحدة بس، على الماك)
افتح Terminal واكتب (هيسألك على باسورد، اختاره بنفسك واحفظه):
```bash
mkdir -p ~/keys
~/jdks/temurin-21/Contents/Home/bin/keytool -genkey -v \
  -keystore ~/keys/seerah-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias seerah-upload
```
بعدين انسخ `mobile/android/keystore.properties.example` باسم `mobile/android/keystore.properties` واكتب فيه المسار والباسورد.

> ⚠️ **خد نسخة احتياطية** من `seerah-upload.jks` والباسورد (فلاشة أو مكان آمن). الملفين دول **مش بيترفعوا على GitHub**.
> Google Play بيستخدم «Play App Signing»، فلو المفتاح ضاع ممكن تطلب تغييره من الدعم، لكن ده بياخد وقت.

## 2) بناء ملف النشر (AAB)
```bash
cd mobile && npm run sync
cd android && JAVA_HOME=~/jdks/temurin-21/Contents/Home ./gradlew bundleRelease
```
الملف: `mobile/android/app/build/outputs/bundle/release/app-release.aab`

> كل تحديث جديد: زوّد `versionCode` (1 ← 2 ← 3…) و `versionName` في `mobile/android/app/build.gradle`.

## 3) إنشاء التطبيق في Play Console
**Create app**:
- App name: `السيرة النبوية`
- Default language: **Arabic – ar**
- App or game: **App** · Free or paid: **Free**

## 4) Store listing (بيانات صفحة المتجر)
**App name:** السيرة النبوية

**Short description** (أقصى حد 80 حرف):
```
السيرة النبوية مبسطة: شجرة النسب، الغزوات، الصحابة، وأمهات المؤمنين ﷺ
```

**Full description:**
```
تعرّف على سيرة النبي محمد ﷺ بطريقة مبسطة وجميلة، من مولده إلى وفاته، مع ما لا يسع المسلم جهله.

🌳 شجرة النسب الشريف
• ثلاثة أشكال: شجرة دائرية بفروع ملونة، وشجرة عائلة، وقائمة.
• النسب الشريف إلى عدنان، والأجداد، والأعمام والعمات وأبناؤهم.
• أمهات المؤمنين، والأبناء والأحفاد، والمرضعات.
• اضغط على أي اسم لعرض نبذة عنه وأبرز المعلومات.
• كبّر وصغّر بإصبعين، وتحرك بحرية.

📜 أحداث السيرة بالترتيب
من المولد الشريف وحادثة شق الصدر، إلى البعثة والهجرة، وحتى حجة الوداع والوفاة، مقسمة على: قبل البعثة، والعهد المكي، والعهد المدني.

⚔️ الغزوات والمعارك
بدر، وأحد، والخندق، وصلح الحديبية، وخيبر، ومؤتة، وفتح مكة، وحنين، وتبوك وغيرها: عدد المسلمين والعدو، والسبب، والأحداث، والنتائج، والدروس والعبر.

👥 الأعلام
نحو 70 شخصية: أمهات المؤمنين، وآل البيت، والعشرة المبشرون بالجنة، والسابقون الأولون، والأنصار، والصحابيات، والقادة.

⭐ مميزات أخرى
• «من السيرة اليوم»: حدث جديد كل يوم، مع تذكير يومي اختياري.
• المفضلة: احفظ الشخصيات والأحداث التي تحبها.
• اختبر معلوماتك: أسئلة عشوائية عن السيرة.
• بحث سريع في كل المحتوى.
• الوضع الليلي.
• يعمل بالكامل بدون إنترنت.
• بدون إعلانات، وبدون تسجيل، ولا يجمع أي بيانات.

المحتوى مختصر من كتب السيرة المعتمدة مثل «الرحيق المختوم» و«سيرة ابن هشام» و«زاد المعاد»، مع الاقتصار على المشهور والإشارة إلى مواضع الخلاف.
```

**Category:** Books & Reference (أو Education)
**Contact email:** إيميلك · **Privacy policy:** الرابط اللي فوق

## 5) App content (الأسئلة الإجبارية)
| السؤال | الإجابة |
|---|---|
| Privacy policy | الرابط اللي فوق |
| Ads | **No, my app does not contain ads** |
| App access | **All functionality is available without special access** |
| Content rating | املأ الاستبيان: الفئة **Reference, News, or Educational**، وجاوب **No** على كل أسئلة العنف والمحتوى الحساس (الغزوات مذكورة نصًا تاريخيًا بدون صور عنف) |
| Target audience | **13 سنة وأكبر** (أبسط؛ اختيار الأطفال بيدخلك في متطلبات برنامج Families الإضافية) |
| Data safety | **Does your app collect or share user data? → No** (التطبيق مش بيبعت أي بيانات؛ المفضلة والإعدادات على الجهاز بس) |
| Government app / Financial / Health | No |
| News app | No |

## 6) الاختبار والنشر
1. **Testing ← Internal testing**: ارفع `app-release.aab`، وضيف إيميلك كمختبِر، وجرّب التطبيق من رابط Play.
2. **لو حسابك «شخصي» (Personal) واتعمل بعد نوفمبر 2023**: Google بتطلب **اختبار مغلق (Closed testing) فيه 12 مختبِر على الأقل لمدة 14 يوم متواصلين** قبل ما تقدر تطلب النشر للعامة. ضيف إيميلات 12 شخص (أهل وأصحاب) وخليهم يشتركوا من الرابط ويسيبوا التطبيق متسطّب.
   (لو الحساب «منظمة» Organization، الشرط ده مش موجود.)
3. بعد الـ 14 يوم: **Production ← Create new release** ← ارفع نفس الـ AAB (أو أحدث) ← **Send for review**.
4. المراجعة بتاخد من كام ساعة لكام يوم.
