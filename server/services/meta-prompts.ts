export const metaPromptsService = {
  getProspectAnalysisPrompt(data: any) {
    return "Analyze this prospect...";
  },
  getPersonalizedOutreachPrompt(data: any) {
    return "Write a personalized email...";
  },
  getFollowUpSequencePrompt(data: any, touch: number) {
    return "Follow up email...";
  },
  getWebsiteViolationAnalysisPrompt(violations: any[], score: number) {
    return "Analyze violations...";
  },
  getPlannerAgentInstructionsPrompt() {
    return "Planner agent instructions...";
  },
  getExecutorAgentInstructionsPrompt() {
    return "Executor agent instructions...";
  },
  getOutreachAgentInstructionsPrompt() {
    return "Outreach agent instructions...";
  },
  getMonitorAgentInstructionsPrompt() {
    return "Monitor agent instructions...";
  }
};
