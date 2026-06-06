import React, { useSyncExternalStore } from 'react';
import { Box, Text, render } from 'ink';
import { ProgressBar, Spinner } from '@inkjs/ui';
import { GenerateProgress, type GenerateStep } from './generate-progress.ts';

function StepRow({ step }: { step: GenerateStep }) {
  if (step.status === 'pending') {
    return React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(Text, { dimColor: true }, `○ ${step.label}`),
    );
  }

  if (step.status === 'skipped') {
    return React.createElement(
      Box,
      { flexDirection: 'column', marginBottom: 1 },
      React.createElement(Text, { dimColor: true }, `– ${step.label}`),
      step.summary
        ? React.createElement(Text, { dimColor: true }, `  ${step.summary}`)
        : null,
    );
  }

  if (step.status === 'done') {
    return React.createElement(
      Box,
      { flexDirection: 'column', marginBottom: 1 },
      React.createElement(Text, { color: 'green' }, `✓ ${step.label}`),
      step.summary
        ? React.createElement(Text, { dimColor: true }, `  ${step.summary}`)
        : null,
    );
  }

  const percent =
    step.total > 0 ? Math.min(100, Math.round((step.current / step.total) * 100)) : 0;

  return React.createElement(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    step.total > 0
      ? React.createElement(Text, { color: 'cyan' }, `● ${step.label}`)
      : React.createElement(Spinner, { label: step.label }),
    step.total > 0
      ? React.createElement(
          Box,
          { flexDirection: 'column', marginLeft: 2 },
          React.createElement(
            Box,
            { width: 36 },
            React.createElement(ProgressBar, { value: percent }),
          ),
          React.createElement(
            Text,
            { dimColor: true },
            `${step.current}/${step.total}${step.detail ? ` · ${step.detail}` : ''}`,
          ),
        )
      : step.detail
        ? React.createElement(Text, { dimColor: true }, `  ${step.detail}`)
        : null,
  );
}

function GenerateApp({ progress }: { progress: GenerateProgress }) {
  useSyncExternalStore(
    (onStoreChange) => progress.subscribe(onStoreChange),
    () => progress.getSnapshot(),
    () => progress.getSnapshot(),
  );

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, 'Generating site content'),
    React.createElement(
      Box,
      { marginTop: 1, flexDirection: 'column' },
      ...progress.steps.map((step) =>
        React.createElement(StepRow, { key: step.id, step }),
      ),
    ),
    progress.error
      ? React.createElement(Text, { color: 'red', marginTop: 1 }, progress.error)
      : progress.done
        ? React.createElement(Text, { color: 'green', marginTop: 1 }, 'Done.')
        : null,
  );
}

export async function renderInkGenerateUi(
  progress: GenerateProgress,
  task: () => Promise<void>,
) {
  const instance = render(React.createElement(GenerateApp, { progress }));

  try {
    await task();
    progress.finish();
    await new Promise((resolve) => setTimeout(resolve, 120));
  } catch (error) {
    progress.fail(error instanceof Error ? error.message : String(error));
    await new Promise((resolve) => setTimeout(resolve, 120));
    throw error;
  } finally {
    instance.unmount();
    await instance.waitUntilExit();
  }
}
