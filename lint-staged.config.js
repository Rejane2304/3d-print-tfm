// Lint-staged configuration - TOLERANCIA CERO
module.exports = {
  '*.{ts,tsx}': ['eslint --max-warnings=0 --cache', 'prettier --check'],
  '*.{js,jsx}': ['prettier --check'],
  '*.{json,css,scss,md,yml,yaml}': ['prettier --check'],
};
