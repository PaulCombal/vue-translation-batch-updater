#!/usr/bin/env node

import {autoTranslate, detectMissing} from './logic.js';
import {program} from 'commander';
import {parse} from '@vue/compiler-sfc';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import {saveFileWithNewTranslations} from './filemanip.js';
import yaml from 'yaml';
 
dotenv.config();

program
  .option('-l, --default-language <char>', 'Default language if not set, json or yaml', 'json')
  .option('-f, --print-file', 'Print file name')
  .option('-d, --detect-missing', 'Detect missing translation keys')
  .option('-t, --auto-translate <key...>', 'Given existing keys, update other languages')
  .argument('<files...>', 'file names to parse');

program.parse();
const options = program.opts();
const files = program.args;

if (options.detectMissing && options.autoTranslate) {
  console.error('Incompatible args');
  process.exit(1);
}

if (!options.detectMissing && !options.autoTranslate?.length) {
  console.error('No action');
  process.exit(1);
}

for (const fileName of files) {
  const fileExtension = path.extname(fileName).toLowerCase();

  if (fileExtension === '.json') {
    try {
      const fileContents = fs.readFileSync(fileName).toString();
      const parsed = JSON.parse(fileContents);

      if (options.printFile) {
        console.log(fileName, ':');
      }

      if (options.detectMissing) {
        detectMissing(parsed);
      } else if (options.autoTranslate.length) {
        const result = await autoTranslate(parsed, options.autoTranslate);
        if (!result) continue;

        const stringified = JSON.stringify(result, null, 2);
        fs.writeFileSync(fileName, stringified);
      }
    } catch (error) {
      console.error(`Error processing JSON file ${fileName}:`, error);
    }

  }
  else if (fileExtension === '.yaml' || fileExtension === '.yml') {
    try {
      const fileContents = fs.readFileSync(fileName).toString();
      const parsed = yaml.parse(fileContents);

      if (options.printFile) {
        console.log(fileName, ':');
      }

      if (options.detectMissing) {
        detectMissing(parsed);
      } else if (options.autoTranslate.length) {
        const result = await autoTranslate(parsed, options.autoTranslate);
        if (!result) continue;

        // Directly stringify and save the updated JSON
        const stringified = yaml.stringify(result, null, 2);
        fs.writeFileSync(fileName, stringified);
      }
    } catch (error) {
      console.error(`Error processing JSON file ${fileName}:`, error);
    }

  }
  else if (fileExtension === '.vue') {
    // Existing logic for Vue files
    const fileContents = fs.readFileSync(fileName).toString();
    const { descriptor, errors } = parse(fileContents);

    if (errors.length) {
      console.error('Errors occurred parsing file ' + fileName, errors);
      continue;
    }

    // Find the i18n block
    const i18nBlock = descriptor.customBlocks.find(block => block.type === 'i18n');

    if (!i18nBlock) {
      console.error('i18n block not found');
      continue;
    }

    const i18nContent = i18nBlock.content;
    const lang = i18nBlock.attrs.lang || options.defaultLanguage;

    let parsed = null;
    if (lang === 'json') {
      parsed = JSON.parse(i18nContent);
    } else if (lang === 'yaml' || lang === 'yml') {
      parsed = yaml.parse(i18nContent);
    } else {
      console.error('Unknown language: ' + lang);
      continue;
    }

    if (options.printFile) {
      console.log(fileName, ':');
    }

    if (options.detectMissing) {
      detectMissing(parsed);
    } else if (options.autoTranslate.length) {
      const result = await autoTranslate(parsed, options.autoTranslate);
      if (!result) continue;

      let stringified = null;

      if (lang === 'json') {
        stringified = JSON.stringify(result, null, 2);
      } else if (lang === 'yaml' || lang === 'yml') {
        stringified = yaml.stringify(result, null, 2);
      } else {
        console.error('Unknown language: ' + lang);
        continue;
      }

      // Save the file with the updated i18n block
      saveFileWithNewTranslations(fileName, fileContents, i18nBlock, stringified);
    }
  } else {
    console.warn(`Skipping unsupported file type: ${fileName}`);
  }
}

