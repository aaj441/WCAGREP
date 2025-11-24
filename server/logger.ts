type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data) {
      console[level](logMessage, data);
    } else {
      console[level](logMessage);
    }
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  error(message: string, error?: Error | any) {
    if (error instanceof Error) {
      this.log("error", message, {
        message: error.message,
        stack: error.stack,
      });
    } else {
      this.log("error", message, error);
    }
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV !== "production") {
      this.log("debug", message, data);
    }
  }
}

export const logger = new Logger();
