/* eslint-disable no-console */
import * as fs from 'fs';
import chalk from 'chalk';
import {
  resolveConfig as prettierResolveConfig,
  format as prettierFormat,
} from 'prettier';
import * as path from 'path';
import { generateOntology } from '../generateOntology.js';
import { atomicConfig } from '../config.js';
import { generateIndex } from '../generateIndex.js';
import { PropertyRecord } from '../PropertyRecord.js';
import { generateExternals } from '../generateExternals.js';
import { validateOntologies } from '../validateOntologies.js';

export const ontologiesCommand = async (_args: string[]) => {
  const propertyRecord = new PropertyRecord();

  console.log(
    chalk.blue(`Found ${chalk.red(atomicConfig.ontologies.length)} ontologies`),
  );

  const [valid, report] = await validateOntologies(atomicConfig.ontologies);

  if (!valid) {
    console.log(chalk.red('ERROR: Could not generate ontologies'));
    console.log(report);

    return;
  }

  checkOrCreateFolder(atomicConfig.outputFolder);

  for (const subject of atomicConfig.ontologies) {
    await write(await generateOntology(subject, propertyRecord));
  }

  const missingProps = propertyRecord.getMissingProperties();

  if (missingProps.length > 0) {
    console.log(
      chalk.yellow(
        'Found some properties that are not defined in any of your ontologies.\nGenerating extras.ts...',
      ),
    );

    const externalsContent = await generateExternals(missingProps);
    await write({ filename: 'externals.ts', content: externalsContent });
  }

  console.log(chalk.blue('Generating index...'));

  await write(generateIndex(atomicConfig.ontologies, missingProps.length > 0));

  console.log(chalk.green('Done!'));
  console.log(
    `\nDon't forget to call the ${chalk.blue(
      'initOntologies()',
    )} function somewhere in your app (exported from ${chalk.blue(
      `${atomicConfig.outputFolder}/index.ts`,
    )})`,
  );
};

const write = async ({
  filename,
  content,
}: {
  filename: string;
  content: string;
}) => {
  console.log(chalk.blue(`Writing ${chalk.red(filename)}...`));

  const filePath = path.join(
    process.cwd(),
    atomicConfig.outputFolder,
    filename,
  );

  let formatted = content;
  const prettierConfig = await prettierResolveConfig(filePath);

  if (prettierConfig) {
    formatted = await prettierFormat(content, {
      ...prettierConfig,
      parser: 'typescript',
    });
  }

  fs.writeFileSync(filePath, formatted);

  console.log(chalk.blue('Wrote to'), chalk.cyan(filePath));
};

const checkOrCreateFolder = (relativePath: string): void => {
  const fullPath = path.join(process.cwd(), relativePath);

  fs.mkdirSync(fullPath, { recursive: true });
};
