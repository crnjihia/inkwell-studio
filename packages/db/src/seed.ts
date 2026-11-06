import { client, db } from "./client";
import {
  users,
  workspaces,
  workspaceMembers,
  prompts,
  promptVersions,
  documents,
  documentVersions,
  usageEvents,
  TIMESCALEDB_INIT_SQL,
} from "./schema/index";
import { eq } from "drizzle-orm";

export async function runSeed() {
  console.log("🌱 Starting Inkwell Studio database seeding (Kenyan Context)...");

  // Attempt TimescaleDB hypertable setup if running against full postgres/timescale
  try {
    await db.execute(TIMESCALEDB_INIT_SQL);
    console.log("✓ TimescaleDB hypertable and continuous aggregates initialized.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`! Note on TimescaleDB init: ${message}. Continuing with standard relational tables.`);
  }

  // 1. Synthetic Developer User (Chris, Nairobi)
  const [adminUser] = await db
    .insert(users)
    .values({
      id: "user_chris_nairobi",
      email: "chris@inkwell.studio",
      name: "Chris Odhiambo",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { name: "Chris Odhiambo", updatedAt: new Date() },
    })
    .returning();

  console.log(`✓ Seeded user: ${adminUser.name} (${adminUser.id})`);

  // 2. Synthetic Workspace (Nairobi Innovators Studio)
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: "Nairobi Innovators Studio",
      slug: "nairobi-innovators",
      ownerId: adminUser.id,
      budgetMonthlyKes: "25000.00", // KSh 25,000 monthly AI budget
      budgetMonthlyUsd: "192.30",
      hardStopEnabled: true,
    })
    .onConflictDoUpdate({
      target: workspaces.slug,
      set: { name: "Nairobi Innovators Studio", updatedAt: new Date() },
    })
    .returning();

  console.log(`✓ Seeded workspace: ${workspace.name} (${workspace.slug})`);

  // 3. Workspace Membership
  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: workspace.id,
      userId: adminUser.id,
      role: "admin",
    })
    .onConflictDoNothing();

  // 4. Prompts & Immutable Prompt Versions

  // Prompt A: Swahili Community Narrative & Tech Blog
  const [swahiliBlogPrompt] = await db
    .insert(prompts)
    .values({
      workspaceId: workspace.id,
      name: "Makala ya Teknolojia Afrika Mashariki",
      description: "Hutengeneza makala ya kina kwa lugha ya Kiswahili fasaha kuhusu maendeleo ya kiteknolojia na biashara Afrika Mashariki.",
      contentType: "blog",
      language: "sw",
    })
    .returning();

  const [swahiliBlogVersion] = await db
    .insert(promptVersions)
    .values({
      promptId: swahiliBlogPrompt.id,
      versionNumber: "1.0.0",
      versionCounter: 1,
      systemPrompt:
        "Wewe ni mhariri na mwandishi mkuu wa makala za kiteknolojia Afrika Mashariki. Andika kwa Kiswahili sanifu, fasaha, na chenye mshikamano. Zingatia mazingira halisi ya Kenya na ukanda wa Afrika Mashariki.",
      userPromptTemplate:
        "Tafadhali andika makala kuhusu {{topic}} inayolenga wasomaji wa Nairobi na kanda nzima. Zingatia athari za kiuchumi kwa sarafu ya KES.",
      isActive: true,
      changeSummary: "Toleo la awali la uandishi wa makala za Kiswahili.",
      createdById: adminUser.id,
    })
    .returning();

  await db
    .update(prompts)
    .set({ activeVersionId: swahiliBlogVersion.id })
    .where(eq(prompts.id, swahiliBlogPrompt.id));

  // Prompt B: USAID East Africa Innovation Grant Proposal (English)
  const [grantPrompt] = await db
    .insert(prompts)
    .values({
      workspaceId: workspace.id,
      name: "USAID East Africa Grant Proposal",
      description: "Generates institutional grant proposals aligned with East African development frameworks, theory of change, and regional KPIs.",
      contentType: "grant_proposal",
      language: "en",
    })
    .returning();

  const [grantVersion] = await db
    .insert(promptVersions)
    .values({
      promptId: grantPrompt.id,
      versionNumber: "1.0.0",
      versionCounter: 1,
      systemPrompt:
        "You are a senior institutional grant specialist operating in Nairobi, Kenya. Structure proposals with Executive Summary, Problem Statement (citing East African regional data), Theory of Change, Sustainability Plan, and Budget Justifications in KES and USD.",
      userPromptTemplate:
        "Draft a comprehensive grant application for {{projectName}} addressing {{targetCommunity}} in Kenya. Target budget: {{budgetKes}} KES.",
      isActive: true,
      changeSummary: "Initial version for USAID and regional development funds.",
      createdById: adminUser.id,
    })
    .returning();

  await db
    .update(prompts)
    .set({ activeVersionId: grantVersion.id })
    .where(eq(prompts.id, grantPrompt.id));

  console.log("✓ Seeded versioned prompts with active semver counters.");

  // 5. Sample Documents
  const sampleTipTapContent = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Mfumo wa Ushirika wa Kilimo cha Kisasa Kenya" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Mradi huu unalenga kuwawezesha wakulima wadogo katika kaunti za Nakuru, Uasin Gishu na Machakos kutumia teknolojia ya simu za mkononi kwa usambazaji wa mazao.",
          },
        ],
      },
    ],
  };

  const [document] = await db
    .insert(documents)
    .values({
      workspaceId: workspace.id,
      title: "Mfumo wa Ushirika wa Kilimo cha Kisasa Kenya",
      content: sampleTipTapContent,
      currentVersion: 1,
      language: "sw",
      contentType: "grant_proposal",
      createdById: adminUser.id,
    })
    .returning();

  await db.insert(documentVersions).values({
    documentId: document.id,
    versionNumber: 1,
    title: document.title,
    content: sampleTipTapContent,
    createdById: adminUser.id,
  });

  console.log(`✓ Seeded initial document: ${document.title}`);

  // 6. Sample Initial Usage Event (TimescaleDB)
  await db.insert(usageEvents).values({
    time: new Date(),
    workspaceId: workspace.id,
    userId: adminUser.id,
    modelId: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    inputTokens: 1250,
    outputTokens: 780,
    costKes: "4.1500", // ~KSh 4.15
    costUsd: "0.0319",
  });

  console.log("✓ Seeded initial synthetic usage event in KES & USD.");
  console.log("🎉 Seeding complete!");
}

// Auto-run if executed directly via tsx
if (typeof process !== "undefined" && process.argv[1]?.includes("seed")) {
  runSeed()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}

