Vue translation batch updater
===

Quick and dirty utility to update your translations with Google Gemini AI.

If you use an I18n loader in your SFCs, update or manually add one translation, and the command will update the
translations in other languages automatically.

### Example

Have a look at `testJson.vue` or `testYaml.vue`. Someone added the translation key `en.bye` but did not add it in the
`fr` language.

Add it with one command:

```bash
yarn exec tt -f --auto-translate=en.bye *.vue
npm exec tt -f --auto-translate=en.bye *.vue
```

Help:

```bash
yarn exec tt --help
npm exec tt --help
```

### Setup

Have a look at `.env.dist` and make sure the environment variables are loaded or in a `.env` when running the command.