import {writeFileSync} from 'fs';
import {TestEnvironment} from 'jest-environment-jsdom';

export default class SyncletsEnvironment extends TestEnvironment {
  static tests = 0;
  static assertions = 0;

  async setup() {
    Object.assign(this.global, {
      Uint8Array,
      TextEncoder,
      env: this.constructor,
    });
    await super.setup();
  }

  async teardown() {
    writeFileSync(
      './tmp/counts.json',
      JSON.stringify({
        tests: SyncletsEnvironment.tests,
        assertions: SyncletsEnvironment.assertions,
      }),
      'utf-8',
    );
    await super.teardown();
  }
}
