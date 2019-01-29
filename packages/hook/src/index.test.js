// @flow
import hooks from './index';

const {pre, post, find, exec, hook} = hooks();

let i = 0;

function uid() {
  return (i++).toString();
}

const nullJob = async () => null;

describe('creation', () => {
  it('should create a task with given action and job', () => {
    const action = uid();
    hook(action, nullJob);
    const task = find(action);
    if (task === undefined) throw new Error('Could not create task');
    expect(task.works.indexOf(nullJob)).not.toBe(-1);
  });

  it('should not create different task if hooked twice', () => {
    const action = uid();
    hook(action, nullJob);
    const task1 = find(action);
    hook(action, nullJob);
    const task2 = find(action);
    expect(task1).toBe(task2);
    if (task1 === undefined) throw new Error('Could not create task');
    expect(task1.works.indexOf(nullJob)).not.toBe(
      task1.works.lastIndexOf(nullJob),
    );
  });

  it('should add a pre and post tasks of a task', () => {
    const action1 = uid();
    const action2 = uid();
    const action3 = uid();
    pre(action1, action2);
    post(action1, action3);
    const task = find(action1);
    if (task === undefined) throw new Error('Could not create task');
    expect(task.pre.indexOf(action2)).not.toBe(-1);
    expect(task.post.indexOf(action3)).not.toBe(-1);
    expect(task.pre.indexOf(action3)).toBe(-1);
    expect(task.post.indexOf(action2)).toBe(-1);
  });

  it('should add a pre and post works of a task', () => {
    const action = uid();
    pre(action, nullJob);
    post(action, nullJob);
    const task = find(action);
    if (task === undefined) throw new Error('Could not create task');
    expect(task.pre.indexOf(nullJob)).not.toBe(-1);
    expect(task.post.indexOf(nullJob)).not.toBe(-1);
  });
});

describe('execution', () => {
  it('should exec a task that does not have any job and return unmodified context', async () => {
    const context = new Object();
    expect(await exec(uid(), context)).toBe(context);
    expect(exec(uid(), context, new Error('error'))).rejects.toThrow('error');
  });

  it('should throw error if any job throws error', async () => {
    const action = uid();
    const context = {counter: 0};
    pre(action, async context => {
      if (++context.counter === 1) {
        throw new Error('errorFromPreJob');
      }
      return context;
    });
    hook(action, async context => {
      if (++context.counter === 3) {
        throw new Error('errorFromJob');
      }
      return context;
    });
    post(action, async (context, err) => {
      if (err) {
        throw err;
      }
      if (++context.counter === 6) {
        throw new Error('errorFromPostJob');
      }
      return context;
    });
    await expect(exec(action, context)).rejects.toThrow('errorFromPreJob');
    expect(context).toEqual({counter: 1});
    await expect(exec(action, context)).rejects.toThrow('errorFromJob');
    expect(context).toEqual({counter: 3});
    await expect(exec(action, context)).rejects.toThrow('errorFromPostJob');
    expect(context).toEqual({counter: 6});
    expect(await exec(action, context)).toEqual({counter: 9});
  });

  it('should stop running works if a job returns null', async () => {
    const action = uid();
    const context = {counter: 0};
    pre(action, async context => {
      if (++context.counter === 1) {
        return null;
      }
      return context;
    });
    hook(action, async context => {
      if (++context.counter === 3) {
        return null;
      }
      return context;
    });
    post(action, async context => {
      if (++context.counter === 6) {
        return null;
      }
      return context;
    });
    expect(await exec(action, context)).toEqual({counter: 1});
    expect(await exec(action, context)).toEqual({counter: 3});
    expect(await exec(action, context)).toEqual({counter: 6});
    expect(await exec(action, context)).toEqual({counter: 9});
  });

  it('should catch errors only in error handler job', async () => {
    const action = uid();
    const context = {counter: 0};
    pre(action, async context => {
      if (++context.counter === 1) {
        throw new Error('errorFromPreJob');
      }
      return context;
    });
    hook(action, async context => {
      if (++context.counter === 5) {
        throw new Error('errorFromJob');
      }
      return context;
    });
    post(action, async context => {
      if (++context.counter === 10) {
        throw new Error('errorFromPostJob');
      }
      return context;
    });
    post(action, async (context, err) => {
      if (err) {
        context.counter++;
      }
      return context;
    });
    post(action, async context => {
      context.counter++;
      return context;
    });
    expect(await exec(action, context)).toEqual({counter: 3});
    expect(await exec(action, context)).toEqual({counter: 7});
    expect(await exec(action, context)).toEqual({counter: 12});
    expect(await exec(action, context)).toEqual({counter: 16});
  });

  it('should exec pre and post tasks', async () => {
    const count = '@pws/hook.test.count';
    const action = '@pws/hook.test.counter';
    const preAction = '@pws/hook.test.preCounter';
    const postAction = '@pws/hook.test.postCounter';

    function counter(context) {
      if (context.count === context.upto) {
        throw new Error('canNotCountMore');
      }
      context.count++;
    }

    hook(preAction, async context => {
      counter(context);
      context.pre++;
    });

    hook(action, async context => {
      counter(context);
      context.on++;
    });

    hook(postAction, async context => {
      counter(context);
      context.post++;
      return context;
    });

    pre(action, preAction);
    post(action, postAction);

    hook(count, async context => {
      const counterContext = {
        pre: 0,
        on: 0,
        post: 0,
        count: 0,
        ...context,
      };
      try {
        return await exec(action, counterContext);
      } catch (err) {
        return counterContext;
      }
    });

    post(count, async context => {
      if (context.upto !== context.count) {
        return exec(count, context);
      }
    });

    expect(await exec(count, {upto: 0})).toEqual({
      upto: 0,
      pre: 0,
      on: 0,
      post: 0,
      count: 0,
    });

    expect(await exec(count, {upto: 10})).toEqual({
      upto: 10,
      pre: 4,
      on: 3,
      post: 3,
      count: 10,
    });

    expect(await exec(count, {upto: 11})).toEqual({
      upto: 11,
      pre: 4,
      on: 4,
      post: 3,
      count: 11,
    });

    expect(await exec(count, {upto: 12})).toEqual({
      upto: 12,
      pre: 4,
      on: 4,
      post: 4,
      count: 12,
    });

    expect(await exec(count, {upto: 20})).toEqual({
      upto: 20,
      pre: 7,
      on: 7,
      post: 6,
      count: 20,
    });
  });
});

describe('primes', () => {
  const isPrime = '@pws/hook.test.primes.check';
  const createRequiredPrimes = '@pws/hook.test.primes.createRequiredPrimes';

  const primes = [2];

  pre(isPrime, async context => {
    const number = context.number;
    if (primes[primes.length - 1] >= number) {
      let found = false;
      let left = 0;
      let right = primes.length;
      while (left < right && !found) {
        const middle = (left + right) >>> 1;
        if (primes[middle] === number) {
          found = true;
        } else if (primes[middle] < number) {
          left = middle + 1;
        } else {
          right = middle - 1;
        }
      }
      context.is = found;
      return null;
    } else {
      return context;
    }
  });

  hook(createRequiredPrimes, async context => {
    let lastKnownPrime = primes[primes.length - 1];
    if (lastKnownPrime * lastKnownPrime >= context.number) return context;
    do {
      lastKnownPrime++;
    } while (!(await exec(isPrime, {number: lastKnownPrime})).is);
    primes.push(lastKnownPrime);
    await exec(createRequiredPrimes, context);
    return context;
  });

  hook(isPrime, createRequiredPrimes);

  post(isPrime, async context => {
    const upto = Math.ceil(Math.sqrt(context.number));
    for (let i = 0; i < primes.length; i++) {
      if (primes[i] > upto) {
        break;
      }
      if (context.number % primes[i] === 0) {
        context.is = false;
        return context;
      }
    }
    context.is = true;
    return context;
  });

  test('1 is not prime', async () => {
    expect((await exec(isPrime, {number: 1})).is).toBe(false);
  });
  test('2 is prime', async () => {
    expect((await exec(isPrime, {number: 2})).is).toBe(true);
  });
  test('3 is prime', async () => {
    expect((await exec(isPrime, {number: 3})).is).toBe(true);
  });
  test('17 is prime', async () => {
    expect((await exec(isPrime, {number: 17})).is).toBe(true);
  });
  test('18 is not prime', async () => {
    expect((await exec(isPrime, {number: 18})).is).toBe(false);
  });
  test('25 is not prime', async () => {
    expect((await exec(isPrime, {number: 25})).is).toBe(false);
  });
  test('341 is not prime', async () => {
    expect((await exec(isPrime, {number: 341})).is).toBe(false);
  });
});
