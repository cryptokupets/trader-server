import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";
import { SeriesItem } from "./SeriesItem";

export class Series {
  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => SeriesItem)))
  public Items: SeriesItem[];

  constructor(data: any) {
    Object.assign(this, data);
  }
}
