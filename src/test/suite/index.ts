// src/test/suite/index.ts
import * as path from 'path';
import * as Mocha from 'mocha';
import { globSync } from 'glob';

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  });

  const testsRoot = path.resolve(__dirname, '..');

  const files: string[] = globSync('**/*.test.js', { cwd: testsRoot });

  files.forEach((f: string) => {
    mocha.addFile(path.resolve(testsRoot, f));
  });

  return new Promise<void>((resolve, reject) => {
    try {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
