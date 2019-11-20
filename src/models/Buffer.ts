import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";
import { Advice } from "./Advice";
import { Candle } from "./Candle";
import { Indicator } from "./Indicator";

export class Buffer {
  @Edm.Key
  @Edm.String
  public time: string;

  @Edm.Key
  @Edm.String
  public sessionId: ObjectID;

  @Edm.EntityType(Edm.ForwardRef(() => Candle))
  public Candle: Candle;

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Indicator)))
  public Indicators: Indicator[];

  @Edm.EntityType(Edm.ForwardRef(() => Advice))
  public Advice: Advice;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
