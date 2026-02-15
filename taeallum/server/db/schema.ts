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
    title: text("title").notNull(),
    content: text("content"),
    videoUrl: text("video_url"), // Embed URL for playback
    bunnyVideoId: text("bunny_video_id"), // Store Bunny.net ID
    originalYoutubeUrl: text("original_youtube_url"), // Store source for backup/rights
    videoOwnerUrl: text("video_owner_url"), // رابط صاحب الفيديو
    duration: integer("duration").default(0), // in seconds
    order: integer("order").notNull(),
    isFree: boolean("is_free").default(false).notNull(),
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

export const lessonsRelations = relations(lessons, ({ one }) => ({
    section: one(sections, {
        fields: [lessons.sectionId],
        references: [sections.id],
    }),
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

export const usersRelations = relations(users, ({ many }) => ({
    enrollments: many(enrollments),
    orders: many(orders),
    subscriptions: many(subscriptions),
    aiSessions: many(aiSessions),
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
