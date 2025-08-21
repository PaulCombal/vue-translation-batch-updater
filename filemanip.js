import fs from 'node:fs';

export function replaceI18nContent(fileContent, sfcBlock, newContent)
{
  return fileContent.substring(0, sfcBlock.loc.start.offset) + 
        `\n${newContent}\n` +
        fileContent.substring(sfcBlock.loc.end.offset);
}

export function saveFileWithNewTranslations(fileName, fileContent, sfcBlock, newContent)
{
  const newFileContent = replaceI18nContent(fileContent, sfcBlock, newContent);
  fs.writeFileSync(fileName, newFileContent);
}