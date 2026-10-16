# Graphify لمَسرى وClaude Code

مهارة `/masra-graphify` تحدد الملفات والعلاقات قبل التغييرات متعددة الملفات. تستخدم Graphify CLI محليًا؛ لا تثبّت hooks في حساب Claude ولا تستخدم الخدمة السحابية.

## التشغيل على Windows

من مجلد المشروع:

```powershell
./scripts/masra-graphify.ps1 -Action Setup
./scripts/masra-graphify.ps1 -Action Build
./scripts/masra-graphify.ps1 -Action Query -Question 'getSession'
```

- Setup يحتاج Python واتصالًا لتنزيل الحزم إلى `.local/graphify-env` فقط (الإصدارات مثبّتة في `scripts/graphify-requirements.txt`). لا يمسّ حزم Node ولا package-lock.json.
- Build يعمل محليًا بوضع `--code-only --no-cluster` ويكتب `graphify-out/graph.json` (غير متتبَّع في Git). أعد البناء بعد تغييرات المصدر.
- Query محدود بميزانية 800 توكن تقريبًا، وتسجيل الاستعلامات معطّل.
- `.graphifyignore` يستبعد الأسرار وبيانات التشغيل والحزم والملفات المولدة والمرفقات.

الاستخراج المحلي لا يرسل الكود إلى نموذج، لكن المقاطع التي يقرؤها Claude لاحقًا تدخل المحادثة وفق إعدادات الحساب. الخريطة تساعد على إيجاد المصدر ولا تثبت سلامة الصلاحيات؛ لم تُقَس نسبة توفير توكنز على مَسرى. الحزمة الرسمية اسمها `graphifyy` بحرف y مكرر. لم يُجرَّب Setup على هذا المشروع بعد.
