import {
  createStepProgress,
  GenerateProgress,
  type StepProgress,
} from './generate-progress.ts';

export { createStepProgress, GenerateProgress, type StepProgress };

export async function runWithGenerateUi(
  progress: GenerateProgress,
  task: () => Promise<void>,
) {
  if (progress.plain) {
    await task();
    progress.finish();
    console.log('\nDone.');
    return;
  }

  const { renderInkGenerateUi } = await import('./generate-ui.ts');
  await renderInkGenerateUi(progress, task);
}
