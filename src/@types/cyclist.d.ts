declare module "cyclist" {
  function Cyclist(size: number): Cyclist;

  export class Cyclist {
    constructor(size: number);

    put(index: number, val: unknown): number;
    get(index: number): unknown;
    del(index: number): unknown;
  }

  export = Cyclist;
}
