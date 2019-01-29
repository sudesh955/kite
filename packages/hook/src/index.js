// @flow

type Context = Object;
type Job = (Context, ?any) => Promise<Context | void | null>;
type Execution = {context: Context, err: any, done: boolean};
type Action = string;
type Work = Action | Job;
type Task = {
  pre: Array<Work>,
  works: Array<Work>,
  post: Array<Work>,
};
type TaskStore = {
  [Action]: Task,
};

export default function hookStore() {
  const tasks: TaskStore = {};

  function find(action: Action): Task | void {
    return tasks[action];
  }

  function findOrCreate(action: Action): Task {
    if (tasks.hasOwnProperty(action)) {
      return tasks[action];
    } else {
      return (tasks[action] = {
        pre: [],
        works: [],
        post: [],
      });
    }
  }

  function hook(action: Action, work: Work): void {
    findOrCreate(action).works.push(work);
  }

  function pre(action: Action, actionOrJob: Work) {
    const h = findOrCreate(action);
    h.pre.push(actionOrJob);
  }

  function post(action: Action, postAction: Work) {
    const h = findOrCreate(action);
    h.post.push(postAction);
  }

  async function doWork(
    works: Array<Work>,
    execution: Execution,
  ): Promise<void> {
    const length = works.length;
    if (length === 0) return;
    let {context, err} = execution;
    for (let i = 0; i < length; i++) {
      let oldContext = context;
      const work = works[i];
      if (typeof work === 'string') {
        try {
          context = await exec(work, context, err);
          err = null;
        } catch (e) {
          err = e;
        }
      } else if (work.length < 2) {
        if (!err) {
          try {
            context = await work.call(null, context);
          } catch (e) {
            err = e;
          }
        }
      } else {
        try {
          context = await work.call(null, context, err || null);
          err = null;
        } catch (e) {
          err = e;
        }
      }
      if (context === null) {
        execution.err = null;
        execution.done = true;
        execution.context = oldContext;
        return;
      } else if (context === undefined) {
        context = oldContext;
      }
    }
    execution.err = err;
    execution.context = context;
  }

  async function exec(
    action: Action,
    context: Context,
    err: any = null,
  ): Context {
    const task = find(action);
    if (task === undefined) {
      if (err) {
        throw err;
      } else {
        return context;
      }
    }
    let execution = {context, err, done: false};

    await doWork(task.pre, execution);
    if (!execution.done) await doWork(task.works, execution);
    if (!execution.done) await doWork(task.post, execution);

    if (execution.err) {
      throw execution.err;
    } else {
      return execution.context;
    }
  }

  return {
    find,
    hook,
    pre,
    post,
    exec,
  };
}
