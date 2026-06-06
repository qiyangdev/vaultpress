export type StepStatus = 'pending' | 'running' | 'done' | 'skipped';

export type GenerateStep = {
  id: string;
  label: string;
  status: StepStatus;
  current: number;
  total: number;
  detail: string;
  summary?: string;
};

function trimDetail(detail: string, maxLength = 48) {
  if (detail.length <= maxLength) return detail;
  return `…${detail.slice(-(maxLength - 1))}`;
}

export class GenerateProgress {
  readonly plain: boolean;
  version = 0;
  steps: GenerateStep[];
  done = false;
  error: string | null = null;
  private listeners = new Set<() => void>();

  constructor(defs: { id: string; label: string }[], options?: { plain?: boolean }) {
    this.plain = options?.plain ?? !process.stdout.isTTY;
    this.steps = defs.map((def) => ({
      ...def,
      status: 'pending',
      current: 0,
      total: 0,
      detail: '',
    }));
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.version;
  }

  private bump() {
    this.version += 1;
    for (const listener of this.listeners) listener();
  }

  private getStep(id: string) {
    const step = this.steps.find((item) => item.id === id);
    if (!step) throw new Error(`Unknown generate step: ${id}`);
    return step;
  }

  startStep(id: string, total: number) {
    const step = this.getStep(id);
    step.status = 'running';
    step.total = total;
    step.current = 0;
    step.detail = '';
    step.summary = undefined;
    this.bump();
  }

  setDetail(id: string, detail: string) {
    this.getStep(id).detail = trimDetail(detail);
    this.bump();
  }

  advanceStep(id: string, detail?: string) {
    const step = this.getStep(id);
    step.current = step.total > 0 ? Math.min(step.current + 1, step.total) : step.current + 1;
    if (detail) step.detail = trimDetail(detail);
    this.bump();
  }

  completeStep(id: string, summary?: string) {
    const step = this.getStep(id);
    step.status = 'done';
    if (step.total > 0) step.current = step.total;
    if (summary) step.summary = summary;
    this.bump();
  }

  skipStep(id: string, summary?: string) {
    const step = this.getStep(id);
    step.status = 'skipped';
    if (summary) step.summary = summary;
    this.bump();
  }

  finish() {
    this.done = true;
    this.bump();
  }

  fail(message: string) {
    this.error = message;
    this.done = true;
    this.bump();
  }
}

export type StepProgress = ReturnType<typeof createStepProgress>;

export function createStepProgress(progress: GenerateProgress, id: string) {
  const getStep = () => progress.steps.find((item) => item.id === id)!;

  return {
    start(total: number) {
      progress.startStep(id, total);
      if (progress.plain) console.log(`→ ${getStep().label}`);
    },
    setDetail(detail: string) {
      progress.setDetail(id, detail);
      if (progress.plain && detail) console.log(`  ${detail}`);
    },
    advance(detail?: string) {
      progress.advanceStep(id, detail);
      if (progress.plain) {
        const step = getStep();
        const suffix = detail ? ` ${detail}` : '';
        if (step.total > 0) {
          console.log(`  ${step.current}/${step.total}${suffix}`);
        } else if (detail) {
          console.log(`  ${detail}`);
        }
      }
    },
    complete(summary?: string) {
      progress.completeStep(id, summary);
      if (progress.plain) {
        console.log(`✓ ${getStep().label}${summary ? `: ${summary}` : ''}`);
      }
    },
    skip(summary?: string) {
      progress.skipStep(id, summary);
      if (progress.plain) {
        console.log(`– ${getStep().label}${summary ? `: ${summary}` : ''}`);
      }
    },
  };
}
