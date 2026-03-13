import { pgTable, text, timestamp, uuid, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users Table
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").default("user").notNull(), // user, admin
    emailVerified: boolean("email_verified").default(false).notNull(),
    verificationCode: text("verification_code"),
    verificationCodeExpiresAt: timestamp("verification_code_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastLoginAt: timestamp("last_login_at"),
    preferences: jsonb("preferences"), // Long-term memory (interests, goals, state)
});

// 2. Categories Table
export const categories = pgTable("categories", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Courses Table
export const courses = pgTable("courses", {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => categories.id),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    thumbnail: text("thumbnail"),
    price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    instructor: text("instructor").notNull(),
    instructorUrl: text("instructor_url"),
    level: text("level").default("beginner").notNull(), // beginner, intermediate, advanced
    aiDescription: text("ai_description"), // Special description for AI matching
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. Sections Table (e.g., Chapter 1, Chapter 2)
export const sections = pgTable("sections", {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    title: text("title").notNull(),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Lessons Table
export const lessons = pgTable("lessons", {
    id: uuid("id").defaultRandom().primaryKey(),
    sectionId: uuid("section_id").references(() => sections.id, { onDelete: "cascade" }).notNull(),
    title: text("title").notNull(), // Lesson_Name
    content: text("content"),
    level: text("level").default("beginner").notNull(), // Beginner / Intermediate / Advanced
    contentType: text("content_type").default("video").notNull(), // Video / Article / PDF
    videoUrl: text("video_url"), // Content_Link
    contentLink: text("content_link"), // Generic link for PDF/Articles
    bunnyVideoId: text("bunny_video_id"),
    originalYoutubeUrl: text("original_youtube_url"),
    videoOwnerUrl: text("video_owner_url"),
    duration: integer("duration").default(0),
    order: integer("order").notNull(),
    isFree: boolean("is_free").default(false).notNull(),
    associatedQuiz: text("associated_quiz"), // Link to quiz or text
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Enrollments Table
export const enrollments = pgTable("enrollments", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
    progress: integer("progress").default(0).notNull(), // 0-100%
});

// 7. Orders/Payments Table
export const orders = pgTable("orders", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    courseId: uuid("course_id").references(() => courses.id), // Nullable for subscriptions
    planId: text("plan_id"), // 'personal', 'pro', 'ultra'
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: text("status").default("pending").notNull(), // pending, completed, failed, rejected
    paymentMethod: text("payment_method").default("stripe").notNull(), // stripe, zain_cash
    paymentId: text("payment_id"),
    receiptImageUrl: text("receipt_image_url"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Admin Audit Logs
export const adminAuditLogs = pgTable("admin_audit_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: text("admin_username").notNull(), // since admin is via env, we store the username
    action: text("action").notNull(), // CREATE, UPDATE, DELETE
    entityType: text("entity_type").notNull(), // Course, Category, etc.
    entityId: text("entity_id"),
    details: jsonb("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Subscriptions Table (AI Assistant Plans)
export const subscriptions = pgTable("subscriptions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    plan: text("plan").notNull(), // 'personal' or 'pro'
    status: text("status").default("active").notNull(), // active, cancelled, expired
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    currency: text("currency").default("usd").notNull(), // usd, eur, sar, aed, etc.
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 10. AI Sessions Table (Conversation History)
export const aiSessions = pgTable("ai_sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    sessionType: text("session_type").default("onboarding").notNull(), // onboarding, chat, consultation
    status: text("status").default("active").notNull(), // active, completed, abandoned
    currentState: text("current_state").default("onboarding_goal").notNull(), // New: Added for state machine orchestration
    userProfile: jsonb("user_profile"), // Stores user answers
    generatedPlan: jsonb("generated_plan"), // Stores the AI-generated study plan
    messagesCount: integer("messages_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 11. AI Messages Table (Individual Messages)
export const aiMessages = pgTable("ai_messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => aiSessions.id, { onDelete: "cascade" }).notNull(),
    role: text("role").notNull(), // 'user' or 'assistant'
    content: text("content").notNull(),
    metadata: jsonb("metadata"), // For storing additional data like question_id, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Study Plans Table (Generated Plans)
export const studyPlans = pgTable("study_plans", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    sessionId: uuid("session_id").references(() => aiSessions.id),
    title: text("title").notNull(),
    description: text("description"),
    duration: text("duration").notNull(), // e.g., "6 months"
    totalHours: integer("total_hours").notNull(),
    planData: jsonb("plan_data").notNull(), // Full plan JSON
    status: text("status").default("active").notNull(), // active, completed, abandoned
    progress: integer("progress").default(0).notNull(), // 0-100%
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 13. Consultation Sessions Table (For Pro users)
export const consultationSessions = pgTable("consultation_sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id).notNull(),
    scheduledAt: timestamp("scheduled_at").notNull(),
    duration: integer("duration").default(30).notNull(), // minutes
    status: text("status").default("scheduled").notNull(), // scheduled, completed, cancelled, no-show
    meetingLink: text("meeting_link"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. Ads Table (Dynamic Advertising)
export const ads = pgTable("ads", {
    id: uuid("id").defaultRandom().primaryKey(),
    location: text("location").notNull().unique(), // e.g., 'footer_banner', 'sidebar', 'header_top'
    isActive: boolean("is_active").default(true).notNull(),
    type: text("type").notNull(), // 'image', 'video', 'script'
    headline: text("headline"),
    description: text("description"),
    primaryText: text("primary_text"), // CTA Text
    primaryLink: text("primary_link"), // CTA Link
    mediaUrl: text("media_url"), // Image or Video URL
    scriptCode: text("script_code"), // For Google Ads or custom HTML
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 15. Promo Codes Table
export const promoCodes = pgTable("promo_codes", {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),           // e.g. TAALLUM70
    discountPercent: integer("discount_percent").notNull(), // e.g. 72 (meaning 72% off → $250 → $70)
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // optional fixed discount
    isActive: boolean("is_active").default(true).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    usageLimit: integer("usage_limit"),              // null = unlimited
    expiresAt: timestamp("expires_at"),              // null = no expiry
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 16. Quizzes Table
export const quizzes = pgTable("quizzes", {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
    questions: jsonb("questions").notNull(), // Array of { q, options, correct_idx }
    difficulty: text("difficulty").default("intermediate").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 17. Quiz Submissions (For Analysis)
export const quizSubmissions = pgTable("quiz_submissions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }).notNull(),
    score: integer("score").notNull(), // 0-100
    answers: jsonb("answers").notNull(), // User choices
    feedback: text("feedback"), // AI feedback on this specific attempt
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 18. Student Performance Analysis (Mind Map of strengths/weaknesses)
export const studentPerformance = pgTable("student_performance", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    strengths: jsonb("strengths").default([]), // ["JavaScript", "Logic"]
    weaknesses: jsonb("weaknesses").default([]), // ["Networking", "CSS"]
    lastAiAnalysisAt: timestamp("last_ai_analysis_at"),
    adaptiveNotes: text("adaptive_notes"), // Internal notes for AI to adapt the path
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 19. Promo Code Usages Table
export const promoCodeUsages = pgTable("promo_code_usages", {
    id: uuid("id").defaultRandom().primaryKey(),
    promoCodeId: uuid("promo_code_id").references(() => promoCodes.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    pricePaid: decimal("price_paid", { precision: 10, scale: 2 }).notNull(),
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
    usedAt: timestamp("used_at").defaultNow().notNull(),
});

// 20. Students Table (Specific AI-Ready Profile)
export const students = pgTable("students", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    ageLevel: text("age_level"), // مستوى/رقم
    interests: jsonb("interests").default([]), // نص أو قائمة
    completedLessons: jsonb("completed_lessons").default([]), // قائمة أو نص
    quizPerformance: text("quiz_performance"), // نقاط/نص
    notes: text("notes"), // اختياري
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 21. Lecture Transcripts Table (Direct user request)
export const lectureTranscripts = pgTable("lecture_transcripts", {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
    transcript: text("transcript").notNull(),
    segments: jsonb("segments"), // Text with timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 22. Learning Paths Table (Direct user request)
export const learningPaths = pgTable("learning_paths", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    pathData: jsonb("path_data").notNull(), // courses + order
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 23. Exams Table (Direct user request)
export const exams = pgTable("exams", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    questions: jsonb("questions").notNull(),
    score: integer("score"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 24. Transcript Chunks Table (for pgvector RAG)
export const transcriptChunks = pgTable("transcript_chunks", {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
    chunkText: text("chunk_text").notNull(),
    // Note: Drizzle-orm doesn't have built-in "vector" type yet in some versions, 
    // but we can use customType or just ignore it for now and use raw SQL for insertion if needed.
    // However, some versions of drizzle-pg-core support it.
    // Let's assume we'll use a text field or a custom type if available.
    // For now, I'll use text then modify it with raw SQL to 'vector(1536)'.
    embedding: text("embedding"),
    timestampStart: integer("timestamp_start"), // in seconds
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- Relations ---

export const categoriesRelations = relations(categories, ({ many }) => ({
    courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
    category: one(categories, {
        fields: [courses.categoryId],
        references: [categories.id],
    }),
    sections: many(sections),
    enrollments: many(enrollments),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
    course: one(courses, {
        fields: [sections.courseId],
        references: [courses.id],
    }),
    lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
    section: one(sections, {
        fields: [lessons.sectionId],
        references: [sections.id],
    }),
    quizzes: many(quizzes),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    user: one(users, {
        fields: [enrollments.userId],
        references: [users.id],
    }),
    course: one(courses, {
        fields: [enrollments.courseId],
        references: [courses.id],
    }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    course: one(courses, {
        fields: [orders.courseId],
        references: [courses.id],
    }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
    enrollments: many(enrollments),
    orders: many(orders),
    subscriptions: many(subscriptions),
    aiSessions: many(aiSessions),
    studentProfile: one(students),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
    user: one(users, {
        fields: [subscriptions.userId],
        references: [users.id],
    }),
    aiSessions: many(aiSessions),
    consultations: many(consultationSessions),
}));

export const aiSessionsRelations = relations(aiSessions, ({ one, many }) => ({
    user: one(users, {
        fields: [aiSessions.userId],
        references: [users.id],
    }),
    subscription: one(subscriptions, {
        fields: [aiSessions.subscriptionId],
        references: [subscriptions.id],
    }),
    messages: many(aiMessages),
    studyPlan: one(studyPlans),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
    session: one(aiSessions, {
        fields: [aiMessages.sessionId],
        references: [aiSessions.id],
    }),
}));

export const studyPlansRelations = relations(studyPlans, ({ one }) => ({
    user: one(users, {
        fields: [studyPlans.userId],
        references: [users.id],
    }),
    session: one(aiSessions, {
        fields: [studyPlans.sessionId],
        references: [aiSessions.id],
    }),
}));

export const consultationSessionsRelations = relations(consultationSessions, ({ one }) => ({
    user: one(users, {
        fields: [consultationSessions.userId],
        references: [users.id],
    }),
    subscription: one(subscriptions, {
        fields: [consultationSessions.subscriptionId],
        references: [subscriptions.id],
    }),
}));

export const studentsRelations = relations(students, ({ one }) => ({
    user: one(users, {
        fields: [students.userId],
        references: [users.id],
    }),
}));

export const lectureTranscriptsRelations = relations(lectureTranscripts, ({ one }) => ({
    lesson: one(lessons, {
        fields: [lectureTranscripts.lessonId],
        references: [lessons.id],
    }),
}));

export const learningPathsRelations = relations(learningPaths, ({ one }) => ({
    user: one(users, {
        fields: [learningPaths.userId],
        references: [users.id],
    }),
}));

export const examsRelations = relations(exams, ({ one }) => ({
    user: one(users, {
        fields: [exams.userId],
        references: [users.id],
    }),
    course: one(courses, {
        fields: [exams.courseId],
        references: [courses.id],
    }),
}));

export const transcriptChunksRelations = relations(transcriptChunks, ({ one }) => ({
    lesson: one(lessons, {
        fields: [transcriptChunks.lessonId],
        references: [lessons.id],
    }),
}));
