export const emailGenerator = {
  generateColdEmail(data: any) {
    return {
      subject: "WCAG Accessibility Audit for " + data.prospectCompany,
      body: "Hi there, we noticed your website...",
    };
  },
  generateEmailSummary(data: any) {
    return "Email summary";
  }
};
