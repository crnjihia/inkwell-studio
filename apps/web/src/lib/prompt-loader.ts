import { db, prompts, promptVersions, eq, and } from "@inkwell/db";

export interface ResolvedPrompt {
  promptId?: string;
  versionId?: string;
  versionNumber: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

// Built-in East African System Prompt Fallbacks
const DEFAULT_SYSTEM_PROMPTS: Record<string, Record<string, { system: string; template: string }>> = {
  blog: {
    sw: {
      system:
        "Wewe ni mhariri na mwandishi mkuu wa makala za kiteknolojia na kiuchumi Afrika Mashariki. Andika kwa Kiswahili sanifu, fasaha, na chenye msamiati sahihi unaoeleweka Nairobi na ukanda mzima.",
      template:
        "Andika makala ya kina na ya kuvutia kuhusu mada hii: {{topic}}. Muktadha wa ziada: {{context}}. Tumia mtindo wa {{tone}} na urefu wa {{length}}.",
    },
    en: {
      system:
        "You are a senior tech and business editor based in Nairobi, Kenya. Write clear, analytical, and compelling essays tailored to the East African innovation ecosystem.",
      template:
        "Write a structured, analytical article on the topic: {{topic}}. Additional context: {{context}}. Tone: {{tone}}. Length: {{length}}.",
    },
  },
  grant_proposal: {
    sw: {
      system:
        "Wewe ni mtaalamu wa kuandika mapendekezo ya ufadhili wa miradi ya maendeleo Afrika Mashariki. Jumuisha Muhtasari wa Mradi, Nadharia ya Mabadiliko, na Mpango wa Bajeti kwa KES na USD.",
      template:
        "Andika pendekezo la mradi kuhusu: {{topic}}. Muktadha na jamii inayolengwa: {{context}}. Zingatia bajeti katika sarafu ya KES.",
    },
    en: {
      system:
        "You are an institutional grant writing consultant for USAID East Africa and international development partners. Format with Executive Summary, Problem Statement, Theory of Change, Regional KPIs, and Budget Justifications in KES and USD.",
      template:
        "Draft a formal grant proposal for the following initiative: {{topic}}. Operational context: {{context}}. Ensure structured headings and regional data citations.",
    },
  },
  social: {
    sw: {
      system:
        "Wewe ni msimamizi wa mitandao ya kijamii na mtangazaji mbunifu Nairobi. Andika machapisho yenye kuvutia wafuasi, ukitumia Kiswahili cha kisasa au Sheng inayokubalika.",
      template:
        "Tengeneza mfululizo wa machapisho ya mitandao kuhusu: {{topic}}. Muktadha: {{context}}.",
    },
    en: {
      system:
        "You are an East African social media strategist and community builder. Craft punchy, high-engagement threads highlighting regional impact, community feedback, and clear call-to-actions.",
      template:
        "Generate an engaging social media thread on: {{topic}}. Context: {{context}}.",
    },
  },
};

export async function resolveActivePrompt(params: {
  workspaceId: string;
  contentType: "blog" | "social" | "grant_proposal";
  language: "en" | "sw";
  promptId?: string;
}): Promise<ResolvedPrompt> {
  const { workspaceId, contentType, language, promptId } = params;

  try {
    if (promptId) {
      // Find prompt and its active version
      const promptRecord = await db.query.prompts.findFirst({
        where: and(eq(prompts.id, promptId), eq(prompts.workspaceId, workspaceId)),
      });

      if (promptRecord?.activeVersionId) {
        const activeVersion = await db.query.promptVersions.findFirst({
          where: eq(promptVersions.id, promptRecord.activeVersionId),
        });

        if (activeVersion) {
          return {
            promptId: promptRecord.id,
            versionId: activeVersion.id,
            versionNumber: activeVersion.versionNumber,
            systemPrompt: activeVersion.systemPrompt,
            userPromptTemplate: activeVersion.userPromptTemplate,
          };
        }
      }
    }

    // Try finding active prompt by contentType and language
    const matchedPrompt = await db.query.prompts.findFirst({
      where: and(
        eq(prompts.workspaceId, workspaceId),
        eq(prompts.contentType, contentType),
        eq(prompts.language, language)
      ),
    });

    if (matchedPrompt?.activeVersionId) {
      const activeVersion = await db.query.promptVersions.findFirst({
        where: eq(promptVersions.id, matchedPrompt.activeVersionId),
      });

      if (activeVersion) {
        return {
          promptId: matchedPrompt.id,
          versionId: activeVersion.id,
          versionNumber: activeVersion.versionNumber,
          systemPrompt: activeVersion.systemPrompt,
          userPromptTemplate: activeVersion.userPromptTemplate,
        };
      }
    }
  } catch (error) {
    console.warn("⚠️ Database query failed in resolveActivePrompt, falling back to built-in templates:", error);
  }

  // Fallback to built-in templates
  const fallback =
    DEFAULT_SYSTEM_PROMPTS[contentType]?.[language] ||
    DEFAULT_SYSTEM_PROMPTS.blog.en;

  return {
    versionNumber: "1.0.0-builtin",
    systemPrompt: fallback.system,
    userPromptTemplate: fallback.template,
  };
}

