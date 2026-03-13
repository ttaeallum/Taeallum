import { geminiPro } from "./gemini";

// ─── Agent 1: بناء المسار ───
export async function pathAgent(messages: any[], availableCourses: any) {
  const chat = geminiPro.startChat({
    history: messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    })),
    generationConfig: { temperature: 0.7 }
  });

  const systemContext = `
    أنت مرشد تعليمي ذكي في منصة taallm.com.
    مهمتك بناء مسار تعلم مخصص للطالب.
    
    الكورسات المتاحة فقط:
    ${JSON.stringify(availableCourses, null, 2)}
    
    القواعد:
    - اسأل سؤال واحد فقط في كل مرة
    - لا تقترح كورسات خارج القائمة أبداً
    - بعد 4-5 أسئلة ابنِ المسار
    - الرد باللغة العربية فقط
  `;

  const result = await chat.sendMessage(systemContext);
  return result.response.text();
}

// ─── Agent 2: سؤال عن الدرس ───
export async function lectureAgent(question: string, transcript: string, lessonName: string) {
  const prompt = `
    أنت مساعد تعليمي صارم في منصة taallm.com.
    
    ## محتوى المحاضرة فقط:
    ${transcript}
    
    ## اسم الدرس: ${lessonName}
    
    ## قواعد صارمة:
    1. أجب فقط من محتوى المحاضرة أعلاه
    2. إذا السؤال مش موجود بالمحاضرة قل:
       "هذه المعلومة غير موجودة في هذا الدرس."
    3. لا تستخدم معرفتك الخارجية أبداً
    4. الرد باللغة العربية فقط
    
    ## سؤال الطالب:
    ${question}
  `;

  const result = await geminiPro.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0 }
  });

  return result.response.text();
}

// ─── Agent 3: توليد الامتحان ───
export async function examAgent(transcript: string, courseName: string) {
  const prompt = `
    أنت مولّد امتحانات في منصة taallm.com.
    
    ## محتوى الكورس:
    ${transcript}
    
    ## اسم الكورس: ${courseName}
    
    ## المطلوب:
    ولّد امتحاناً من 10 أسئلة متنوعة:
    - 4 اختيار من متعدد
    - 3 صح أو غلط  
    - 2 إجابة قصيرة
    - 1 مهمة عملية
    
    القواعد:
    - الأسئلة من محتوى الكورس فقط
    - الرد باللغة العربية فقط
    - أرجع JSON فقط بهذا الشكل:
    
    {
      "exam_title": "امتحان ${courseName}",
      "questions": [
        {
          "id": 1,
          "type": "multiple_choice",
          "question": "...",
          "options": ["أ- ...", "ب- ...", "ج- ...", "د- ..."],
          "correct_answer": "أ",
          "explanation": "..."
        }
      ]
    }
  `;

  const result = await geminiPro.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { 
      temperature: 0.5,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(result.response.text());
}
