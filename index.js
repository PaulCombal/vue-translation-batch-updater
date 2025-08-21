#!/usr/bin/env node

import {autoTranslate, detectMissing} from './logic.js';
import {program} from 'commander';
import {parse} from '@vue/compiler-sfc';
import fs from 'node:fs';
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

for (const fileName of files) {
  const fileContents = fs.readFileSync(fileName).toString();
  const {descriptor, errors} = parse(fileContents);
  if (errors.length) {
    console.error('Errors occurred parsing file ' + fileName, errors);
    continue;
  }

  // There can be many i18n blocks but so far it's not a concern
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

  // What action should we take?
  if (options.printFile) {
    console.log(fileName, ':');
  }

  if (options.detectMissing) {
    detectMissing(parsed);
  }
  else if (options.autoTranslate.length) {
    const result = await autoTranslate(parsed, options.autoTranslate);
    if (!result) continue;

    let stringified = null;

    if (lang === 'json') {
      stringified = JSON.stringify(result, null, 2);
    } else if (lang === 'yaml' || lang === 'yml') {
      stringified = yaml.stringify(result);
    } else {
      console.error('Unknown language: ' + lang);
      continue;
    }

    saveFileWithNewTranslations(fileName, fileContents, i18nBlock, stringified);
  }
}

