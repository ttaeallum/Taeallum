# رفع أحدث نسخة على GitHub

## ما تم تجهيزه

- كل التعديلات محفوظة في Git (commit محلي).
- السكربت `push-to-github.ps1` يجهّز أي تغييرات جديدة ثم يرفع إلى GitHub.

## خطوة واحدة من جهازك

1. افتح **PowerShell** من مجلد المشروع (أو انتقل إليه: `cd "c:\Users\user\Downloads\Learn-Platform-Updated-2zip"`).
2. نفّذ:
   ```powershell
   .\push-to-github.ps1
   ```
3. إذا طلب Git تسجيل الدخول:
   - **Username:** حساب GitHub (مثل `ttaeallum`).
   - **Password:** استخدم **Personal Access Token** وليس كلمة مرور الحساب.

## إنشاء Personal Access Token (مرة واحدة)

1. ادخل إلى [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens).
2. **Generate new token (classic)**.
3. اختر صلاحية على الأقل: `repo`.
4. انسخ الـ Token واستخدمه كـ "Password" عند الطلب.

## إذا كان الفرع المحلي والريموت مختلفين (diverged)

إذا ظهرت رسالة أن الفرع متباعد، نفّذ أحد الخيارين:

- **دمج تغييرات GitHub معك ثم رفع:**
  ```powershell
  git pull --rebase origin main
  git push origin main
  ```
- **جعل GitHub يطابق جهازك بالكامل (يُلغى تاريخ الريموت):**
  ```powershell
  git push --force-with-lease origin main
  ```

بعد تنفيذ الرفع بنجاح، أحدث نسخة من الكود ستكون على GitHub.
