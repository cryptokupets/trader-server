import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import { Readable } from "stream";
import { Trade } from "./Trade";

export class PaperTrade {
  public static stream: Readable;

  @Edm.Key
  @Edm.Computed
  @Edm.String
  // tslint:disable-next-line: variable-name
  public _id: ObjectID;

  @Edm.String
  public exchange: string;

  @Edm.String
  public currency: string;

  @Edm.String
  public asset: string;

  @Edm.Double
  public period: number;

  @Edm.String
  public begin: string;

  @Edm.String
  public end: string;

  @Edm.String
  public indicators: string;

  @Edm.String
  public code: string;

  @Edm.Double
  public initialBalance: number;

  @Edm.Double
  public finalBalance: number;

  @Edm.Double
  public profit: number;

  @Edm.Collection(Edm.EntityType(Edm.ForwardRef(() => Trade)))
  public Trades: Trade[];

  constructor(data: any) {
    Object.assign(this, data);
  }

  @Edm.Action
  public stop(@odata.result result: any) { // UNDONE можно использовать несколько стримов одновременно
    if (PaperTrade.stream) {
      PaperTrade.stream.destroy();
    }
  }
}
