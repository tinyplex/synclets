import {arrayPush, arrayShift, size} from '@synclets/utils';

type Task = () => Promise<any>;

export const getQueueFunctions = (): [
  queue: (task: Task) => Promise<void>,
  getQueueState: () => [number, boolean],
] => {
  let queueRunning = false;
  const queueTasks: Task[] = [];

  return [
    async (task: Task): Promise<void> => {
      arrayPush(queueTasks, task);
      if (!queueRunning) {
        queueRunning = true;
        let action;
        while ((action = arrayShift(queueTasks)) != null) {
          await action();
        }
        queueRunning = false;
      }
    },
    () => [size(queueTasks), queueRunning],
  ];
};
