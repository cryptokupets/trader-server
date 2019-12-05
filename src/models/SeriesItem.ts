import { Edm } from "odata-v4-server";

export class SeriesItem {
  @Edm.String
  public time: string;

  @Edm.Double
  public values: number[];

  constructor(data: any) {
    Object.assign(this, data);
  }
}
