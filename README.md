Vue translation batch updater
===

Quick and dirty utility to update your translations with Google Gemini AI.

If you use an I18n loader in your SFCs, update or manually add one translation, and the command will update the
translations in other languages automatically.

[A plugin is available for Jetbrains IDEs.](https://plugins.jetbrains.com/plugin/28303-vue-translation-batch-updater?noRedirect=true) [(Plugin repository)](https://github.com/PaulCombal/vue-translation-batch-updater-intellij-plugin)

### Example

Have a look at [`testJson.vue`](testJson.vue) or [`testYaml.vue`](testYaml.vue). Someone added the translation key `en.bye` but did not add it in the
`fr` language.

Ask Gemini to translate the keys in other languages and save it in your file with one command:

```bash
yarn exec tt -f --auto-translate=en.bye *.vue
```

Thi can also be used to update existing translations.
Plain YAML and JSON files are also supported. 

Help:

```bash
yarn exec tt --help
```

### Setup

Have a look at [`.env.dist`](.env.dist) and make sure the environment variables are loaded or in a `.env` when running the command.