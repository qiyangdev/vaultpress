import React, { useMemo, useState } from 'react';
import { Box, Text, render, useInput } from 'ink';
import { MultiSelect } from '@inkjs/ui';

export type VaultEntry = {
  name: string;
  isDirectory: boolean;
};

type IncludeSelectAppProps = {
  vaultDir: string;
  entries: VaultEntry[];
  saved: string[];
  onSubmit: (selected: string[]) => void;
  onCancel: () => void;
};

function IncludeSelectApp({
  vaultDir,
  entries,
  saved,
  onSubmit,
  onCancel,
}: IncludeSelectAppProps) {
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape || (key.ctrl && _input === 'c')) {
      onCancel();
    }
  });

  const options = useMemo(
    () =>
      entries.map((entry) => ({
        label: entry.isDirectory ? `${entry.name}/` : entry.name,
        value: entry.name,
      })),
    [entries],
  );

  const defaultValue = useMemo(() => {
    const validSaved = saved.filter((name) => entries.some((entry) => entry.name === name));
    return validSaved.length > 0 ? validSaved : [];
  }, [entries, saved]);

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, 'Select top-level folders and files to include'),
    React.createElement(Text, { dimColor: true }, vaultDir),
    React.createElement(
      Box,
      { marginTop: 1, flexDirection: 'column' },
      ...entries.map((entry, index) => {
        const connector = index === entries.length - 1 ? '└── ' : '├── ';
        const suffix = entry.isDirectory ? '/' : '';
        return React.createElement(
          Text,
          { key: entry.name, dimColor: true },
          `${connector}${entry.name}${suffix}`,
        );
      }),
    ),
    React.createElement(
      Box,
      { marginTop: 1, flexDirection: 'column' },
      React.createElement(
        Text,
        { dimColor: true },
        '↑↓ navigate · space toggle · enter confirm · esc cancel',
      ),
      React.createElement(MultiSelect, {
        options,
        defaultValue,
        visibleOptionCount: Math.min(12, Math.max(options.length, 1)),
        onSubmit: (value) => {
          if (value.length === 0) {
            setError('Select at least one item');
            return;
          }
          onSubmit(value);
        },
      }),
      error ? React.createElement(Text, { color: 'red' }, error) : null,
    ),
  );
}

export function promptIncludeSelection(
  vaultDir: string,
  entries: VaultEntry[],
  saved: string[],
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const instance = render(
      React.createElement(IncludeSelectApp, {
        vaultDir,
        entries,
        saved,
        onSubmit: (selected) => {
          instance.unmount();
          void instance.waitUntilExit().then(() => resolve(selected));
        },
        onCancel: () => {
          instance.unmount();
          void instance.waitUntilExit().then(() => {
            reject(new Error('Selection cancelled'));
          });
        },
      }),
    );
  });
}
