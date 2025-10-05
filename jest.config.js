export default {
  verbose: false,
  resolver: '<rootDir>/test/jest/resolver.cjs',
  transformIgnorePatterns: ['<rootDir>/node_modules'],
  modulePathIgnorePatterns: ['synclets/package.json'], // tests use ./dist
  transform: {'^.+\\.(mjs|js|jsx|ts|tsx)?$': 'babel-jest'},
};
