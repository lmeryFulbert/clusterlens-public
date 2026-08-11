import { HARule } from "./HARule.js";


export class HAResource {

  constructor(
    public readonly sid: string,
    public readonly vmId: number,
    public readonly state: string,
    public readonly rule?: HARule
  ) {}

}