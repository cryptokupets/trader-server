import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export class Advice {
  @Edm.Key
  @Edm.String
  public time: string;

  @Edm.Key
  @Edm.String
  public sessionId: ObjectID;

  @Edm.Int32
  public sign: number;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
