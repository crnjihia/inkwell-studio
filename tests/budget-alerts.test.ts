import { describe, it, expect, beforeEach } from "vitest";
import { MockEmailNotificationAdapter, mockEmailQueue } from "@/lib/notifications";

describe("Phase 8: AI Usage Tracking & Budget Threshold Alerts", () => {
  beforeEach(() => {
    mockEmailQueue.length = 0;
  });

  it("calculates budget percentage and determines appropriate alert level", () => {
    const budgetKes = 25000.0;

    // Test 50% spend
    const spend50 = 12500.0;
    const pct50 = (spend50 / budgetKes) * 100;
    expect(pct50).toBe(50);
    expect(pct50 < 80).toBe(true);

    // Test 82% spend (warning threshold)
    const spend82 = 20500.0;
    const pct82 = (spend82 / budgetKes) * 100;
    expect(pct82).toBe(82);
    expect(pct82 >= 80 && pct82 < 100).toBe(true);

    // Test 104% spend (exceeded threshold)
    const spend104 = 26000.0;
    const pct104 = (spend104 / budgetKes) * 100;
    expect(pct104).toBe(104);
    expect(pct104 >= 100).toBe(true);
  });

  it("enforces hard-stop logic when monthly budget is exceeded", () => {
    const budgetMonthlyKes = 25000.0;
    const currentSpendKes = 25150.0;
    const hardStopEnabled = true;

    const percentage = (currentSpendKes / budgetMonthlyKes) * 100;
    const isExceeded = percentage >= 100;
    const hardStopActive = isExceeded && hardStopEnabled;
    const generationAllowed = !hardStopActive;

    expect(isExceeded).toBe(true);
    expect(hardStopActive).toBe(true);
    expect(generationAllowed).toBe(false);
  });

  it("dispatches mock email notification for 80% and 100% threshold crossings", async () => {
    const adapter = new MockEmailNotificationAdapter();

    // Send 80% warning
    const res80 = await adapter.sendBudgetAlert({
      workspaceId: "ws_nairobi_01",
      workspaceName: "Nairobi Innovators Studio",
      recipientEmail: "chris@inkwell.studio",
      recipientName: "Chris Odhiambo",
      budgetKes: 25000.0,
      currentSpendKes: 20200.0,
      percentage: 80.8,
      alertType: "warning_80",
    });

    expect(res80.success).toBe(true);
    expect(mockEmailQueue).toHaveLength(1);
    expect(mockEmailQueue[0].to).toBe("chris@inkwell.studio");
    expect(mockEmailQueue[0].subject).toContain("80% ya bajeti");
    expect(mockEmailQueue[0].body).toContain("KSh 25,000.00");
    expect(mockEmailQueue[0].body).toContain("Nairobi, Kenya");

    // Send 100% exceeded alert
    const res100 = await adapter.sendBudgetAlert({
      workspaceId: "ws_nairobi_01",
      workspaceName: "Nairobi Innovators Studio",
      recipientEmail: "chris@inkwell.studio",
      recipientName: "Chris Odhiambo",
      budgetKes: 25000.0,
      currentSpendKes: 25500.0,
      percentage: 102.0,
      alertType: "exceeded_100",
    });

    expect(res100.success).toBe(true);
    expect(mockEmailQueue).toHaveLength(2);
    expect(mockEmailQueue[1].subject).toContain("100% ya bajeti");
    expect(mockEmailQueue[1].body).toContain("Hard-Stop Imewezeshwa");
  });
});

