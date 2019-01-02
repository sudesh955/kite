import {pre, post, find, hook} from './index';

let i = 0;

function uid() {
  return (i++).toString();
}

const nullJob = () => null;

describe('creation', () => {
  it('should create with given action and job', () => {
    const id = uid();
    hook(id, nullJob);
    const h = find(id);
    expect(h.jobs.indexOf(nullJob)).not.toBe(-1);
  });

  it('should create the same hook if hooked twice', () => {
    const id = uid();
    hook(id, nullJob);
    const h1 = find(id);
    hook(id, nullJob);
    const h2 = find(id);
    expect(h1).toBe(h2);
    expect(h1.jobs.indexOf(nullJob)).not.toBe(h1.jobs.lastIndexOf(nullJob));
  });

  it('should add a pre and post relationship between hooks', () => {
    const h1 = uid();
    const h2 = uid();
    const h3 = uid();
    pre(h1, h2);
    post(h1, h3);
    const h = find(h1);
    expect(h.pre.indexOf(h2)).not.toBe(-1);
    expect(h.post.indexOf(h3)).not.toBe(-1);
    expect(h.pre.indexOf(h3)).toBe(-1);
    expect(h.post.indexOf(h2)).toBe(-1);
  });
});
