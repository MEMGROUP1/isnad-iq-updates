# ISNAD IQ — التحديث المباشر

خادم صغير على Vercel يطبّق بروتوكول [expo-updates رقم 1](https://docs.expo.dev/technical-specs/expo-updates-1/).

- `GET /api/manifest` ويا الهيدرات `expo-platform` و`expo-runtime-version` → آخر نسخة لهذا الـruntime، أو `204` إذا ماكو.
- `GET /api/asset?id=<id>&file=<name>` → ملف من النسخة، بنوعه الصحيح، ويتخزن بالـCDN سنة.
- الملفات تحت `updates/<id>/` ثابتة وما تتغيّر أبداً.
- `updates/index.json` يكتبه سكربت النشر بريبو التطبيق (`tools/publish-update.mjs`).
- الخادم (Vercel، مشروع `isnad-iq-updates` بفريق SAS Tech) يقرا الفهرس والملفات من هذا الريبو عن طريق raw.githubusercontent.com، فالنشر = دفع للفرع `main` بس. الفهرس يتحدّث خلال دقائق.
- الريبو عام لأن بيه الحزمة المترجمة بس (نفس اللي داخل التطبيق بالمتجر). ماكو كود مصدر ولا أسرار. الكود بريبو التطبيق الخاص.

**النشر:** من ريبو التطبيق `MEMGROUP1/isnad-iq-app`:
```
node tools/publish-update.mjs --message "شنو تغيّر"
```
السكربت يصدّر الحزمة، يحسب البصمات، ينسخ الملفات هنا، يحدّث الفهرس، ويدفع.

**الرجوع لنسخة سابقة:** غيّر `updates/index.json` لـ`id` القديم (التاريخ `createdAt` لازم يكون أحدث من اللي بالتلفونات، فالسكربت عنده `--rollback <id>` يعيد نشرها بتاريخ جديد).
