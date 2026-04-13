// Lint-staged configuration - TOLERANCIA CERO
module.exports = {
  '*.{ts,tsx}': ['eslint --max-warnings=0 --cache', 'prettier --check'],
  '*.{js,jsx}': ['eslint --max-warnings=0 --cache', 'prettier --check'],
  '*.{json,css,scss,md,yml,yaml}': ['prettier --check'],
};
