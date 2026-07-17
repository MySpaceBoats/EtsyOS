export type LogSink = (line: string) => void;

/**
 * Structured step-by-step logger (one JSON object per line): requested -> tried provider X ->
 * outcome -> fallback -> ... -> success/failure.
 *
 * NOTE: writes to stderr by default, not stdout — the MCP stdio transport owns stdout for the
 * JSON-RPC stream, so log lines there would corrupt it. Sink is injectable for tests.
 */
export class Logger {
  private readonly sink: LogSink;
  constructor(sink: LogSink = (line) => process.stderr.write(line + "\n")) {
    this.sink = sink;
  }

  private emit(event: string, data: Record<string, unknown>): void {
    this.sink(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
  }

  requested(data: Record<string, unknown>): void {
    this.emit("requested", data);
  }

  skipped(provider: string, reason: string): void {
    this.emit("skipped", { provider, reason });
  }

  tried(provider: string): void {
    this.emit("tried", { provider });
  }

  succeeded(provider: string, generationTimeMs: number): void {
    this.emit("succeeded", { provider, generationTimeMs });
  }

  failed(provider: string, reason: string, message: string): void {
    this.emit("failed", { provider, reason, message });
  }

  exhausted(failures: Record<string, string>): void {
    this.emit("exhausted", { failures });
  }
}
