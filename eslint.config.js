import upleveled from 'eslint-config-upleveled';

const config = [
  ...upleveled,
  // Frozen pre-TypeScript reference code for the back-to-back tests
  { ignores: ['src/__legacy__/'] },
];

export default config;
