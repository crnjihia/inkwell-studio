export interface BudgetAlertParams {
  workspaceId: string;
  workspaceName: string;
  recipientEmail: string;
  recipientName: string;
  budgetKes: number;
  currentSpendKes: number;
  percentage: number;
  alertType: "warning_80" | "exceeded_100";
}

export interface EmittedEmailNotification {
  to: string;
  subject: string;
  body: string;
  sentAt: Date;
}

// In-memory queue storing mock email emissions for verification and testing
export const mockEmailQueue: EmittedEmailNotification[] = [];

export interface NotificationAdapter {
  sendBudgetAlert(
    params: BudgetAlertParams,
  ): Promise<{ success: boolean; notificationId: string }>;
}

export class MockEmailNotificationAdapter implements NotificationAdapter {
  async sendBudgetAlert(
    params: BudgetAlertParams,
  ): Promise<{ success: boolean; notificationId: string }> {
    const isExceeded = params.alertType === "exceeded_100";
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const subject = isExceeded
      ? `🚨 [Tahadhari ya Bajeti] Workspace "${params.workspaceName}" imefikia 100% ya bajeti ya KES`
      : `⚠️ [Uangalifu wa Bajeti] Workspace "${params.workspaceName}" imefikia 80% ya bajeti ya KES`;

    const body = `Hujambo ${params.recipientName},

Hii ni taarifa ya matumizi ya AI kutoka Inkwell Studio (Nairobi, Kenya).

Workspace: ${params.workspaceName}
Bajeti ya Mwezi: KSh ${params.budgetKes.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
Kiasi Kilichotumika Sasa: KSh ${params.currentSpendKes.toLocaleString("en-KE", { minimumFractionDigits: 2 })} (${params.percentage.toFixed(1)}%)
Hali: ${isExceeded ? "Bajeti imekamilika kikamilifu (Hard-Stop Imewezeshwa)" : "Uangalifu: Umetumia asilimia 80 au zaidi ya bajeti"}

Wakati: ${new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "full", timeStyle: "medium" }).format(new Date())}

Ili kurekebisha bajeti yako au kulegeza masharti ya hard-stop, tembelea Dashibodi ya Matumizi.

Inkwell Studio Team
Nairobi, Kenya
`;

    const record: EmittedEmailNotification = {
      to: params.recipientEmail,
      subject,
      body,
      sentAt: new Date(),
    };

    mockEmailQueue.push(record);
    console.log(
      `[MockEmailAdapter] Sent budget alert to ${params.recipientEmail}: "${subject}"`,
    );

    return {
      success: true,
      notificationId,
    };
  }
}

// Factory returning the active notification adapter
export function getNotificationAdapter(): NotificationAdapter {
  return new MockEmailNotificationAdapter();
}
