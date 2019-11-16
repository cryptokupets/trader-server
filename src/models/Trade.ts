import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export class Trade {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  // tslint:disable-next-line: variable-name
  public _id: ObjectID;

  @Edm.String
  public time: string;

  @Edm.Double
  public quantity: number;

  @Edm.Double
  public amount: number;

  @Edm.String
  public parentId: ObjectID;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
