export const ethicalEmailGuard = {
  async validateEmailSend(data: any) {
    return { allowed: true, reason: "Valid" };
  },
  generateUnsubscribeLink(prospectId: string) {
    return `https://wcagrep.com/unsubscribe/${prospectId}`;
  },
  async recordEmailSend(data: any) {},
  async processUnsubscribe(prospectId: string, reason?: string) {},
  async addToDoNotContact(data: any) {},
  async getMetrics() {
    return { totalSent: 0, unsubscribes: 0 };
  }
};
