import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env";

// Factory for live Anthropic client
export function getAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });
}

export interface StreamEventChunk {
  type: "text" | "usage" | "error";
  text?: string;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
}

// Deterministic mock streaming generator producing contextual East African content
export async function* generateMockStream(params: {
  contentType: string;
  language: string;
  topic: string;
  signal?: AbortSignal;
}): AsyncGenerator<StreamEventChunk, void, unknown> {
  const isSwahili = params.language === "sw";
  let sampleParagraphs: string[];

  if (params.contentType === "grant_proposal") {
    sampleParagraphs = isSwahili
      ? [
          "### 1. Muhtasari wa Mradi\n\n",
          `Mradi huu wa "${params.topic}" umeundwa ili kushughulikia changamoto kuu za kiuchumi na maendeleo katika kaunti za Kenya. `,
          "Lengo kuu ni kuongeza uzalishaji, kuimarisha masoko ya kidijitali, na kuwainua wakulima na wafanyabiashara wadogo kupitia mifumo thabiti.\n\n",
          "### 2. Nadharia ya Mabadiliko (Theory of Change)\n\n",
          "Kama wakazi wa mashambani watapata mafunzo sahihi na mifumo ya malipo ya kidijitali (M-Pesa na mifumo ya kibenki), basi mapato yao ya kila mwezi yataongezeka kwa asilimia 35 ndani ya miezi kumi na miwili.\n\n",
          "### 3. Makadirio ya Bajeti (KES)\n\n",
          "- Uendeshaji na Mafunzo: KSh 1,200,000\n",
          "- Mifumo ya Kidijitali na Mawasiliano: KSh 850,000\n",
          "- Tathmini na Ufuatiliaji: KSh 450,000\n",
          "- **Jumla ya Bajeti: KSh 2,500,000**\n",
        ]
      : [
          "### 1. Executive Summary\n\n",
          `The "${params.topic}" initiative addresses critical infrastructure and economic inclusion across East Africa. `,
          "By deploying decentralized mobile-first technologies, the project directly supports sustainable livelihoods and regional trade integration.\n\n",
          "### 2. Theory of Change & Regional Alignment\n\n",
          "If community enterprises in Kenya receive structured technical incubation and low-latency digital payment tooling, then household resilience and employment will expand by 40% across target counties.\n\n",
          "### 3. Financial Plan & Budget Justification\n\n",
          "- Technical Infrastructure & Cloud: KSh 1,400,000 ($10,769)\n",
          "- Field Deployment & Stakeholder Workshops: KSh 900,000 ($6,923)\n",
          "- Independent Impact Evaluation: KSh 500,000 ($3,846)\n",
          "- **Total Funding Request: KSh 2,800,000 ($21,538)**\n",
        ];
  } else if (params.contentType === "social") {
    sampleParagraphs = isSwahili
      ? [
          `Habari za leo Nairobi! 🚀\n\n`,
          `Tunayo furaha kubwa kutangaza hatua mpya ya "${params.topic}". `,
          `Teknolojia hii inabadilisha jinsi biashara zinavyoendesha shughuli zao hapa Kenya.\n\n`,
          `Ungependa kujua zaidi? Bofya kiungo hapa chini ujionee mapinduzi haya! 👇 #NairobiTech #KenyaInnovates #AfrikaMashariki`,
        ]
      : [
          `Exciting milestone from Nairobi! 🇰🇪✨\n\n`,
          `We are officially unveiling "${params.topic}". Built specifically for East African creators and entrepreneurs, this unlocks seamless streaming workflows and fair creator monetization.\n\n`,
          `Check out the live rollout and let us know your thoughts below! 👇 #SiliconSavannah #BuildInPublic #Nairobi`,
        ];
  } else {
    // Default blog / editorial
    sampleParagraphs = isSwahili
      ? [
          `# ${params.topic}: Mwongozo wa Kina kwa Wajasiriamali wa Kenya\n\n`,
          "Kizazi cha sasa cha wavumbuzi wa Afrika Mashariki kinakabiliwa na fursa adimu ya kubuni suluhisho zinazoendana na hali halisi ya kiuchumi. ",
          "Kutoka mitaa ya Nairobi hadi mashambani kote nchini, matumizi ya mifumo ya kidijitali yanazidi kushika kasi.\n\n",
          "## Misingi ya Mafanikio\n\n",
          "1. **Uelewa wa Lugha na Muktadha:** Kuwasiliana na wateja kwa lugha wanayoielewa kwa undani huongeza uaminifu.\n",
          "2. **Ujumuishaji wa Malipo Rahisi:** Kutumia sarafu halisi ya KES na mifumo ya simu kunarahisisha upokeaji wa malipo.\n",
          "3. **Uthabiti wa Miundombinu:** Mifumo lazima ifanye kazi hata kukiwa na mawasiliano ya kasi ya wastani.\n\n",
          "Huu ni mwanzo tu wa safari ya kiuchumi inayong'aa kwa ukanda wetu.",
        ]
      : [
          `# ${params.topic}: Catalyzing Regional Innovation Across East Africa\n\n`,
          "The Silicon Savannah is entering its next phase of architectural maturity. ",
          "Founders and creators across Nairobi, Kampala, and Kigali are moving beyond basic wrappers toward resilient, local-first platforms.\n\n",
          "## Strategic Pillars for Sustainable Scale\n\n",
          "- **Context-Aware AI**: Fine-tuned workflows that understand dual-currency economics and bilingual requirements.\n",
          "- **Transparent Unit Economics**: Budget controls anchored in KES alongside foreign currency projections.\n",
          "- **High Availability at the Edge**: Instant caching and local data sovereignty that keep latency low.\n\n",
          "As we continue building from Nairobi, the imperative is clear: build with local roots, but engineer for global excellence.",
        ];
  }

  // Initial token usage event
  yield {
    type: "usage",
    inputTokens: 240,
    outputTokens: 0,
  };

  let accumulatedOutputTokens = 0;

  for (const paragraph of sampleParagraphs) {
    if (params.signal?.aborted) {
      break;
    }

    const words = paragraph.split(" ");
    for (const word of words) {
      if (params.signal?.aborted) {
        break;
      }
      yield {
        type: "text",
        text: word + " ",
      };
      accumulatedOutputTokens += 1;
      // Realistic streaming delay simulation
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }

  // Final token count event
  yield {
    type: "usage",
    inputTokens: 240,
    outputTokens: accumulatedOutputTokens + 40,
  };
}
