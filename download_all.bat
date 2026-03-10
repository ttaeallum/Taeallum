@echo off
set "YTDLP=.\taeallum\yt-dlp.exe"

echo Step 1 - Delete old folders if exists...
if exist AI rmdir /s /q AI
if exist Cybersecurity rmdir /s /q Cybersecurity
if exist Software_Development rmdir /s /q Software_Development

echo Step 2 - yt-dlp is available at %YTDLP%

echo --- AI COURSES ---
%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/01_Machine_Learning/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PLoOabVweB2r5dL0AVmuDbS54UvmCIlZsT"
echo ✅ تم: Machine Learning

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/02_Deep_Learning/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PLoOabVweB2r57m5lr0cPkpduIVAIJOfNi"
echo ✅ تم: Deep Learning

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/03_Natural_Language_Processing/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PLjEvSICrhSeXIqfZIOrOnBse6pM_kamDH"
echo ✅ تم: Natural Language Processing

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/04_Computer_Vision/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PLIzoD6CTXb38Ebk214w6sDpfe7wvhUmd6"
echo ✅ تم: Computer Vision

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/05_Object_Detection/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/watch?v=t-phGBfPEZ4&list=PLhhyoLH6Ijfw0TpCTVTNk42NN08H6UvNq"
echo ✅ تم: Object Detection

echo --- CYBERSECURITY COURSES ---
%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/01_Linux_Fundamentals/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PLsWFuR2EEv1uIV2vzqAhSa8gI6IG9dMpc"
echo ✅ تم: Linux Fundamentals

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/02_Ethical_Hacking/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/watch?v=IyxgtWKtzQw&list=PLMuAdKgHarVrcZCqzJFdNlTiKz66U19Xk"
echo ✅ تم: Ethical Hacking

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/03_Network_Security/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/watch?v=0ZPhQ7zjyuw&list=PLLlr6jKKdyK3xfwHtLwxcTEUC4xVrIB-M"
echo ✅ تم: Network Security

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/04_Cloud_Security/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/watch?v=lroCjmb9iuM&list=PLZmPGUyBFvUqo76bXGnXq9EofsaV2d8K5"
echo ✅ تم: Cloud Security

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/05_Digital_Forensics/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PL2bd7i47CeQ6M7QwsIBv_UrPjvmVtXlUY"
echo ✅ تم: Digital Forensics

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/06_Cryptography/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PLfNcIHZBKx5KURwBc3MwBCnIJOd2GMHY8"
echo ✅ تم: Cryptography

echo --- SOFTWARE DEVELOPMENT COURSES ---
%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/01_Full_Stack_HTML_CSS_JS_PHP_SQL/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/watch?v=OKG_0CEKoj4&list=PLVrN2LRb7eT2B6v1EwsCS28QkkDTZ5LRm"
echo ✅ تم: Full Stack HTML CSS JS PHP SQL

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/02_React_TypeScript/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/watch?v=ihRRf3EjTV8&list=PLYyqC4bNbCIdSZ-JayMLl4WO2Cr995vyS"
echo ✅ تم: React TypeScript

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/03_Flutter_Mobile_Development/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/watch?v=1ukSR1GRtMU&list=PL4cUxeGkcC9jLYyp2Aoh6hcWuxFDX6PBJ"
echo ✅ تم: Flutter Mobile Development

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/04_Mobile_UI_UX_Design/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PLjzhiGLyugKwnM6uN4NXhfpU8L7XvtDEv"
echo ✅ تم: Mobile UI UX Design

%YTDLP% -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/05_NoSQL_MongoDB/%%(playlist_index)s_%%(title)s.%%(ext)s" "https://www.youtube.com/playlist?list=PLd6o9p13Lc5387FWk_GXU0Rh5AhrBGod5"
echo ✅ تم: NoSQL MongoDB

echo 🎉 تم تحميل جميع الدورات بنجاح!
echo CS Core: ✅
echo AI: ✅
echo Cybersecurity: ✅
echo Software Development: ✅
echo جاهز للرفع على Bunny! اتأكد انه الفيديو بنزل صوت وصوره مع بعض احنا خلصنا cs core ضايل الثلاث خلصهم واحكيلي تم
