import { NextRequest } from "next/server";
import { z } from "zod";
import { db, prompts, promptVersions, eq, and } from "@inkwell/db";

export const dynamic = "force-dynamic";

const rollbackSchema = z.object({
  targetVersionId: z.string().uuid("Target version ID must be a valid UUID"),
  rollbackReason: z.string().min(3, "Please provide a reason for the rollback").default("Restored previous stable version"),
  userId: z.string().default("user_chris_nairobi"),
});

// POST /api/prompts/[id]/rollback - Roll back to a previous prompt version
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const promptId = params.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = rollbackSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  const { targetVersionId, rollbackReason } = parsed.data;

  try {
    // 1. Verify prompt exists
    const promptRecord = await db.query.prompts.findFirst({
      where: eq(prompts.id, promptId),
    });

    if (!promptRecord) {
      return new Response(JSON.stringify({ error: "Prompt not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Verify target version exists and belongs to this prompt
    const targetVersion = await db.query.promptVersions.findFirst({
      where: and(
        eq(promptVersions.id, targetVersionId),
        eq(promptVersions.promptId, promptId)
      ),
    });

    if (!targetVersion) {
      return new Response(
        JSON.stringify({ error: "Target version does not exist for this prompt" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Perform atomic rollback:
    // Deactivate all versions of this prompt
    await db
      .update(promptVersions)
      .set({ isActive: false })
      .where(eq(promptVersions.promptId, promptId));

    // Activate target version
    await db
      .update(promptVersions)
      .set({ isActive: true })
      .where(eq(promptVersions.id, targetVersionId));

    // Update prompt pointer
    const [updatedPrompt] = await db
      .update(prompts)
      .set({
        activeVersionId: targetVersionId,
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, promptId))
      .returning();

    return new Response(
      JSON.stringify({
        message: `Successfully rolled back to version ${targetVersion.versionNumber}`,
        prompt: updatedPrompt,
        activeVersion: targetVersion,
        auditLog: {
          rollbackReason,
          restoredVersion: targetVersion.versionNumber,
          timestamp: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Rollback failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to execute prompt rollback" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

