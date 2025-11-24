export const keywordScanner = {
  async batchScanKeywords(keywords: string[]) {
    return [];
  },
  getUsageStats() {
    return { totalAPICallsUsed: 0, cacheHits: 0 };
  },
  clearCache() {}
};
