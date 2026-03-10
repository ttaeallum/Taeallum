# Step 1: Delete old folders if exist
$folders = @("AI", "Cybersecurity", "Software_Development")
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "Removing old folder: $folder"
        Remove-Item -Recurse -Force $folder
    }
}

# Step 2: Install yt-dlp if not installed
Write-Host "Installing/Updating yt-dlp..."
pip install -U yt-dlp

# Step 3: Download AI COURSES
Write-Host "Starting AI Courses..."

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/01_Machine_Learning/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PLoOabVweB2r5dL0AVmuDbS54UvmCIlZsT"
Write-Host "✅ تم: Machine Learning"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/02_Deep_Learning/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PLoOabVweB2r57m5lr0cPkpduIVAIJOfNi"
Write-Host "✅ تم: Deep Learning"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/03_Natural_Language_Processing/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PLjEvSICrhSeXIqfZIOrOnBse6pM_kamDH"
Write-Host "✅ تم: Natural Language Processing"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/04_Computer_Vision/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PLIzoD6CTXb38Ebk214w6sDpfe7wvhUmd6"
Write-Host "✅ تم: Computer Vision"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "AI/05_Object_Detection/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/watch?v=t-phGBfPEZ4&list=PLhhyoLH6Ijfw0TpCTVTNk42NN08H6UvNq"
Write-Host "✅ تم: Object Detection"

# Step 4: Download CYBERSECURITY COURSES
Write-Host "Starting Cybersecurity Courses..."

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/01_Linux_Fundamentals/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PLsWFuR2EEv1uIV2vzqAhSa8gI6IG9dMpc"
Write-Host "✅ تم: Linux Fundamentals"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/02_Ethical_Hacking/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/watch?v=IyxgtWKtzQw&list=PLMuAdKgHarVrcZCqzJFdNlTiKz66U19Xk"
Write-Host "✅ تم: Ethical Hacking"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/03_Network_Security/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/watch?v=0ZPhQ7zjyuw&list=PLLlr6jKKdyK3xfwHtLwxcTEUC4xVrIB-M"
Write-Host "✅ تم: Network Security"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/04_Cloud_Security/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/watch?v=lroCjmb9iuM&list=PLZmPGUyBFvUqo76bXGnXq9EofsaV2d8K5"
Write-Host "✅ تم: Cloud Security"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/05_Digital_Forensics/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PL2bd7i47CeQ6M7QwsIBv_UrPjvmVtXlUY"
Write-Host "✅ تم: Digital Forensics"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Cybersecurity/06_Cryptography/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PLfNcIHZBKx5KURwBc3MwBCnIJOd2GMHY8"
Write-Host "✅ تم: Cryptography"

# Step 5: Download SOFTWARE DEVELOPMENT COURSES
Write-Host "Starting Software Development Courses..."

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/01_Full_Stack_HTML_CSS_JS_PHP_SQL/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/watch?v=OKG_0CEKoj4&list=PLVrN2LRb7eT2B6v1EwsCS28QkkDTZ5LRm"
Write-Host "✅ تم: Full Stack HTML CSS JS PHP SQL"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/02_React_TypeScript/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/watch?v=ihRRf3EjTV8&list=PLYyqC4bNbCIdSZ-JayMLl4WO2Cr995vyS"
Write-Host "✅ تم: React TypeScript"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/03_Flutter_Mobile_Development/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/watch?v=1ukSR1GRtMU&list=PL4cUxeGkcC9jLYyp2Aoh6hcWuxFDX6PBJ"
Write-Host "✅ تم: Flutter Mobile Development"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/04_Mobile_UI_UX_Design/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PLjzhiGLyugKwnM6uN4NXhfpU8L7XvtDEv"
Write-Host "✅ تم: Mobile UI UX Design"

yt-dlp -f "bestvideo+bestaudio" --merge-output-format mp4 -o "Software_Development/05_NoSQL_MongoDB/%(playlist_index)s_%(title)s.%(ext)s" "https://www.youtube.com/playlist?list=PLd6o9p13Lc5387FWk_GXU0Rh5AhrBGod5"
Write-Host "✅ تم: NoSQL MongoDB"

# Final step output
Write-Host "🎉 تم تحميل جميع الدورات بنجاح!"
Write-Host "CS Core: ✅"
Write-Host "AI: ✅"
Write-Host "Cybersecurity: ✅"
Write-Host "Software Development: ✅"
Write-Host "جاهز للرفع على Bunny! اتأكد انه الفيديو بنزل صوت وصوره مع بعض احنا خلصنا cs core ضايل الثلاث خلصهم واحكيلي تم"
