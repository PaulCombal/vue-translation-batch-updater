import {translateKeysWithAi} from './aislopfuncs.js';

export function detectMissing(keys) {
  const flat = flattenTranslations(keys);
  const missing = findMissingKeys(flat);
  console.log(missing);
}

export async function autoTranslate(keys, keysToTranslate) {
  const flat = flattenTranslations(keys);
  const recreatedValues = {}; 
  const detectedLanguages = Object.keys(flat);

  for (const k of keysToTranslate) {
    const split = k.split('.');
    if (split.length === 1) {
      console.warn('Invalid key path', k);
      continue;
    }

    const lang = split.shift();
    const keyToTranslate = split.join('.');

    if (!(lang in flat) || !(keyToTranslate in flat[lang])) {
      console.warn('Key to translate not found');
      continue;
    }

    if (!(lang in recreatedValues)) {
      recreatedValues[lang] = {};
    }

    recreatedValues[lang][keyToTranslate] = flat[lang][keyToTranslate];
  }

  const sourceLanguages = Object.keys(recreatedValues);
  if (!sourceLanguages.length) {
    console.warn('No keys to translate');
    return;
  }

  if (sourceLanguages.length === 1 && detectedLanguages.length === 1 && sourceLanguages[0] === detectedLanguages[0]) {
    console.warn('No languages to translate to');
    return;
  }

  // console.log('I must translate', recreatedValues, 'in ', detectedLanguages)
  const result = await translateKeysWithAi(recreatedValues, detectedLanguages);
  if (!result) { return; }

  // console.log('translated', result)
  const finalTranslations = deepMerge(flat, result);
  return unflattenTranslations(finalTranslations);
}

function flattenTranslations(data) {
  const flattenedData = {};

  // This is the recursive helper function
  function flatten(obj, prefix, output) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const currentKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        // Check if the value is a nested object
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // It's an object, so recurse with the new prefix
          flatten(value, currentKey, output);
        } else {
          // It's a translation string, so add it to our output hashmap
          output[currentKey] = value;
        }
      }
    }
  }

  // Iterate through each language (en, fr, etc.)
  for (const lang in data) {
    if (Object.prototype.hasOwnProperty.call(data, lang)) {
      flattenedData[lang] = {}; // Create a new hashmap for this language
      flatten(data[lang], '', flattenedData[lang]);
    }
  }

  return flattenedData;
}

/**
 * Unflattens a translation object with dot-separated keys back into a nested object.
 *
 * @param {object} flattenedData The flattened translation data.
 * @returns {object} The unflattened, nested translation data.
 */
function unflattenTranslations(flattenedData) {
  const unflattened = {};

  // Iterate over each language key
  for (const lang in flattenedData) {
    if (Object.prototype.hasOwnProperty.call(flattenedData, lang)) {
      unflattened[lang] = {};
      const currentLang = flattenedData[lang];

      // Iterate over each dot-separated key for the current language
      for (const key in currentLang) {
        if (Object.prototype.hasOwnProperty.call(currentLang, key)) {
          const value = currentLang[key];
          const parts = key.split('.');
          let currentLevel = unflattened[lang];

          // Build the nested object structure
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            // If we are at the last part of the key, set the value
            if (i === parts.length - 1) {
              currentLevel[part] = value;
            } else {
              // Otherwise, create a new object if it doesn't exist and move down
              if (!currentLevel[part]) {
                currentLevel[part] = {};
              }
              currentLevel = currentLevel[part];
            }
          }
        }
      }
    }
  }

  return unflattened;
}

/**
 * Recursively merges two objects, combining nested objects and overwriting
 * properties from the source object.
 *
 * @param {object} target - The target object to merge into.
 * @param {object} source - The source object to merge from.
 * @returns {object} The merged object.
 */
function deepMerge(target, source) {
  // Create a deep copy of the target to avoid modifying the original
  const output = { ...target };

  // Iterate over all keys in the source object
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];

      // If the value is a non-null, non-array object and the target also has a nested object
      if (
        typeof sourceValue === 'object' &&
                sourceValue !== null &&
                !Array.isArray(sourceValue) &&
                typeof output[key] === 'object' &&
                output[key] !== null
      ) {
        // Recurse to deeply merge the nested objects
        output[key] = deepMerge(output[key], sourceValue);
      } else {
        // Otherwise, simply assign or overwrite the value
        output[key] = sourceValue;
      }
    }
  }

  return output;
}

/**
 * Finds all keys that are missing from each language in a flattened translation object.
 * A key is considered missing if it exists in at least one other language.
 *
 * @param {object} flattenedData - The flattened translation data.
 * @returns {object} An object where keys are language codes and values are arrays of missing keys.
 */
function findMissingKeys(flattenedData) {
  // Step 1: Create a Set to store all unique keys from all languages.
  const allKeys = new Set();
  for (const lang in flattenedData) {
    if (Object.prototype.hasOwnProperty.call(flattenedData, lang)) {
      for (const key in flattenedData[lang]) {
        if (Object.prototype.hasOwnProperty.call(flattenedData[lang], key)) {
          allKeys.add(key);
        }
      }
    }
  }

  // Step 2: Create a hashmap to store the missing keys for each language.
  const missingKeysByLang = {};

  // Step 3: Iterate through each language again to check for missing keys.
  for (const lang in flattenedData) {
    if (Object.prototype.hasOwnProperty.call(flattenedData, lang)) {
      // Initialize an empty array for the current language's missing keys.
      missingKeysByLang[lang] = [];
      const currentKeys = flattenedData[lang];

      // Iterate through the master list of all unique keys.
      for (const key of allKeys) {
        // Check if the current language's object has the key.
        // We use hasOwnProperty to be safe and avoid inherited properties.
        if (!Object.prototype.hasOwnProperty.call(currentKeys, key)) {
          // If the key is not present, add it to the missing keys array for this language.
          missingKeysByLang[lang].push(key);
        }
      }
    }
  }

  // Step 4: Return the final object containing all missing keys.
  return missingKeysByLang;
}