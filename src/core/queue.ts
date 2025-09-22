import {arrayPush, arrayShift} from '../common/array.ts';

type Task = () => Promise<any>;

export const getQueueFunctions = (): [
  queue: (...tasks: Task[]) => Promise<void>,
] => {
  let queueRunning = false;
  const queueTasks: Task[] = [];

  return [
    async (...tasks: Task[]): Promise<void> => {
      arrayPush(queueTasks, ...tasks);
      if (!queueRunning) {
        queueRunning = true;
        let action;
        while ((action = arrayShift(queueTasks)) != null) {
          await action();
        }
        queueRunning = false;
      }
    },
  ];
};
