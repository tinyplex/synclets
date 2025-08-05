import {arrayPush, arrayShift} from '@synclets/utils';

type Task = () => Promise<any>;

export const getQueue = (): ((task: Task) => Promise<void>) => {
  let queueRunning = false;
  const queueTasks: Task[] = [];

  const run = async (): Promise<void> => {
    if (!queueRunning) {
      queueRunning = true;
      let action;
      while ((action = arrayShift(queueTasks)) != null) {
        await action();
      }
      queueRunning = false;
    }
  };

  return async (task: Task): Promise<void> => {
    arrayPush(queueTasks, task);
    await run();
  };
};
