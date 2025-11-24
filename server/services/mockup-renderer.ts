import { promises as fs } from "fs";
import path from "path";

export const mockupRendererService = {
  async saveMockup(html: string, css: string, scanJobId: string) {
    const dir = path.join(process.cwd(), "mockups", scanJobId);
    await fs.mkdir(dir, { recursive: true });
    const htmlPath = path.join(dir, "index.html");
    const cssPath = path.join(dir, "styles.css");
    await fs.writeFile(htmlPath, html);
    await fs.writeFile(cssPath, css);
    return { htmlPath, cssPath };
  },
  async listMockups(scanJobId: string) {
    try {
      const dir = path.join(process.cwd(), "mockups", scanJobId);
      const files = await fs.readdir(dir);
      return files.filter(f => f.endsWith(".html")).map(f => path.join(dir, f));
    } catch {
      return [];
    }
  },
  async getMockup(filePath: string) {
    return await fs.readFile(filePath, "utf-8");
  }
};
