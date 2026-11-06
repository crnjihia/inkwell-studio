import { db, workspaces, usageEvents, eq, sql } from "@inkwell/db";
import { getNotificationAdapter } from "./notifications";

export interface BudgetStatus {
  allowed: boolean;
  hardStopActive: boolean;
  budgetMonthlyKes: number;
  currentSpendKes: number;
  percentage: number;
  alertLevel: "ok" | "warning_80" | "exceeded_100";
}

// Track sent alerts in memory to prevent duplicate emails during same billing cycle
const sentAlertCache = new Set<string>();

export async function checkWorkspaceBudget(
  workspaceId: string,
): Promise<BudgetStatus> {
  const fallbackStatus: BudgetStatus = {
    allowed: true,
    hardStopActive: false,
    budgetMonthlyKes: 25000.0,
    currentSpendKes: 0,
    percentage: 0,
    alertLevel: "ok",
  };

  try {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      with: {
        owner: true,
      },
    });

    if (!workspace) return fallbackStatus;

    const budgetMonthlyKes = parseFloat(
      workspace.budgetMonthlyKes || "25000.00",
    );
    const hardStopEnabled = workspace.hardStopEnabled;

    // Sum monthly usage for the current calendar month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await db
      .select({
        totalSpendKes: sql<string>`COALESCE(SUM(cost_kes), 0)`,
      })
      .from(usageEvents)
      .where(
        sql`${usageEvents.workspaceId} = ${workspaceId} AND ${usageEvents.time} >= ${firstDayOfMonth}`,
      );

    const currentSpendKes = parseFloat(result[0]?.totalSpendKes || "0");
    const percentage =
      budgetMonthlyKes > 0 ? (currentSpendKes / budgetMonthlyKes) * 100 : 0;

    let alertLevel: "ok" | "warning_80" | "exceeded_100" = "ok";
    let hardStopActive = false;

    if (percentage >= 100) {
      alertLevel = "exceeded_100";
      if (hardStopEnabled) {
        hardStopActive = true;
      }
    } else if (percentage >= 80) {
      alertLevel = "warning_80";
    }

    // Trigger alert notification if newly reached
    const alertKey = `${workspaceId}_${now.getFullYear()}_${now.getMonth()}_${alertLevel}`;
    if (alertLevel !== "ok" && !sentAlertCache.has(alertKey)) {
      sentAlertCache.add(alertKey);

      const notificationAdapter = getNotificationAdapter();
      await notificationAdapter
        .sendBudgetAlert({
          workspaceId,
          workspaceName: workspace.name,
          recipientEmail: workspace.owner?.email || "chris@inkwell.studio",
          recipientName: workspace.owner?.name || "Chris Odhiambo",
          budgetKes: budgetMonthlyKes,
          currentSpendKes,
          percentage,
          alertType: alertLevel,
        })
        .catch((err) =>
          console.warn("Failed to dispatch budget alert notification:", err),
        );
    }

    return {
      allowed: !hardStopActive,
      hardStopActive,
      budgetMonthlyKes,
      currentSpendKes,
      percentage: Number(percentage.toFixed(1)),
      alertLevel,
    };
  } catch (error) {
    console.warn(
      "Budget check encountered an error, defaulting to permissive:",
      error,
    );
    return fallbackStatus;
  }
}
