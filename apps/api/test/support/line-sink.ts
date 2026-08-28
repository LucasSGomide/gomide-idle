import { Writable } from 'node:stream';

// Collects NDJSON log lines for assertions.
export class LineSink extends Writable {
  readonly lines: Array<Record<string, unknown>> = [];
  private buffer = '';

  override _write(chunk: Buffer, _encoding: string, done: () => void): void {
    this.buffer += chunk.toString();
    let index = this.buffer.indexOf('\n');
    while (index !== -1) {
      const raw = this.buffer.slice(0, index).trim();
      this.buffer = this.buffer.slice(index + 1);
      if (raw) this.lines.push(JSON.parse(raw) as Record<string, unknown>);
      index = this.buffer.indexOf('\n');
    }
    done();
  }
}
