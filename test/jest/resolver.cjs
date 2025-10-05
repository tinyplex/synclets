module.exports = (path, options) =>
  options.defaultResolver(path, {
    ...options,
    packageFilter: (packageJson) => {
      if (packageJson.name === 'ws') {
        delete packageJson.exports;
      }

      return packageJson;
    },
  });
