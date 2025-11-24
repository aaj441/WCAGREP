export const plannerAgent = {
  async plan() {
    console.log("Planner agent running...");
  }
};

export const executorAgent = {
  async execute() {
    console.log("Executor agent running...");
  }
};

export const monitorAgent = {
  async getAgentStatus() {
    return {
      planner: { status: "idle", lastRun: new Date() },
      executor: { status: "idle", lastRun: new Date() },
      monitor: { status: "running", lastRun: new Date() }
    };
  }
};
