export class Patch {
  constructor({ id, description, required = false, ...rest }) {
    this.id = id;
    this.description = description;
    this.required = required;
    Object.assign(this, rest);
  }

  // Pre-flight: does the target pattern exist in the source?
  canApply(source) {
    throw new Error(`${this.id}: canApply() not implemented`);
  }

  // Transform source, return modified string
  apply(source) {
    throw new Error(`${this.id}: apply() not implemented`);
  }

  // Post-apply: did the patch actually change something?
  verify(before, after) {
    return before !== after;
  }
}
