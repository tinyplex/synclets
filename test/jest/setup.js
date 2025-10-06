jest.retryTimes(5);

afterEach(() => {
  const {assertionCalls} = expect.getState();
  global.env.tests += 1;
  global.env.assertions += assertionCalls;
});
