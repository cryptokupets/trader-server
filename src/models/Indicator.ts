import { Edm } from "odata-v4-server";

export class Indicator {
  @Edm.Collection(Edm.Double)
  public values: number[];

  constructor(data: any) {
    Object.assign(this, data);
  }
}
