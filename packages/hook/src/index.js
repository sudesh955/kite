// @flow

type Context = Object;
type Job = (Context, ?any) => Context | null;
type Action = string;
type Work = {
  pre: Array<Action>,
  jobs: Array<Job>,
  post: Array<Action>,
};
type WorkStore = {
  [Action]: Work,
};

const works: WorkStore = {};

export function find(action: Action): Work | void {
  return works[action];
}

export function findOrCreate(action: Action): Work {
  if (works.hasOwnProperty(action)) {
    return works[action];
  } else {
    return (works[action] = {
      pre: [],
      jobs: [],
      post: [],
    });
  }
}

export function hook(action: Action, job: Job): void {
  findOrCreate(action).jobs.push(job);
}

export function pre(action: Action, preAction: Action) {
  const h = findOrCreate(action);
  h.pre.push(preAction);
}

export function post(action: Action, preAction: Action) {
  const h = findOrCreate(action);
  h.post.push(preAction);
}
