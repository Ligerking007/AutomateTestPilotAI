import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  copyDirectoryIfExists,
  copyFileIfExists,
  listMarkdownFiles,
  readJsonFile,
  writeJsonFile,
  writeTextFile
} from '../../src/utils/fileHelper.js';

test('writeJsonFile creates parent directories and readJsonFile parses the result', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'automate-test-pilot-ai-'));
  const filePath = path.join(workspace, 'nested', 'test-cases.json');

  try {
    await writeJsonFile(filePath, [{ id: 'TC-001' }]);

    assert.deepEqual(await readJsonFile(filePath), [{ id: 'TC-001' }]);
    assert.equal((await readFile(filePath, 'utf8')).endsWith('\n'), true);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('writeTextFile creates parent directories', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'automate-test-pilot-ai-'));
  const filePath = path.join(workspace, 'reports', 'summary.md');

  try {
    await writeTextFile(filePath, '# Summary\n');

    assert.equal(await readFile(filePath, 'utf8'), '# Summary\n');
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('listMarkdownFiles returns only markdown files in a directory', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'automate-test-pilot-ai-'));

  try {
    await writeFile(path.join(workspace, 'login.requirement.md'), 'login');
    await writeFile(path.join(workspace, 'notes.txt'), 'notes');

    const files = await listMarkdownFiles(workspace);

    assert.deepEqual(files.map((file) => path.basename(file)), ['login.requirement.md']);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('copy helpers ignore missing sources and copy existing files/directories', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'automate-test-pilot-ai-'));

  try {
    await copyFileIfExists(path.join(workspace, 'missing.txt'), path.join(workspace, 'out', 'missing.txt'));
    await copyDirectoryIfExists(path.join(workspace, 'missing-dir'), path.join(workspace, 'out-dir'));

    const sourceFile = path.join(workspace, 'source.txt');
    const destinationFile = path.join(workspace, 'out', 'source.txt');
    await writeFile(sourceFile, 'content');
    await copyFileIfExists(sourceFile, destinationFile);
    assert.equal(await readFile(destinationFile, 'utf8'), 'content');

    const sourceDir = path.join(workspace, 'source-dir');
    const nestedSource = path.join(sourceDir, 'nested.txt');
    const destinationDir = path.join(workspace, 'copied-dir');
    await writeTextFile(nestedSource, 'nested');
    await copyDirectoryIfExists(sourceDir, destinationDir);
    assert.equal(await readFile(path.join(destinationDir, 'nested.txt'), 'utf8'), 'nested');
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
