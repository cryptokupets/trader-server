import es from "event-stream";
import moment from "moment";
import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import { streamTrades } from "paper-trade";
import connect from "../connect";
import { PaperTrade } from "../models/PaperTrade";
import { Trade } from "../models/Trade";

const collectionName = "paperTrade";

@odata.type(PaperTrade)
@Edm.EntitySet("PaperTrade")
export class PaperTradeController extends ODataController {
  @odata.GET
  public async get(@odata.query query: ODataQuery): Promise<PaperTrade[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);

    if (mongodbQuery.query._id) {
      mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    }

    const result: PaperTrade[] & { inlinecount?: number } =
      typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0
        ? []
        : await db
            .collection(collectionName)
            .find(mongodbQuery.query)
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .map(e => new PaperTrade(e))
            .toArray();

    if (mongodbQuery.inlinecount) {
      result.inlinecount = await db
        .collection(collectionName)
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    return result;
  }

  @odata.GET
  public async getById(
    @odata.key key: string,
    @odata.query query: ODataQuery
  ): Promise<PaperTrade> {
    const { projection } = createQuery(query);
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    const db = await connect();
    return new PaperTrade(
      await db.collection(collectionName).findOne({ _id }, { projection })
    );
  }

  @odata.POST
  public async post(
    @odata.body
    body: any
  ): Promise<PaperTrade> {
    const paperTrade = new PaperTrade(body);
    const db = await connect();
    const collection = await db.collection(collectionName);
    paperTrade._id = (await collection.insertOne(paperTrade)).insertedId;

    const {
      _id,
      asset,
      currency,
      exchange,
      period,
      indicators,
      code,
      initialBalance
    } = paperTrade;

    PaperTrade.stream = streamTrades({
      exchange,
      currency,
      asset,
      period: "" + period,
      start: moment()
        .utc()
        .toISOString(),
      indicators: JSON.parse(indicators),
      code,
      initialBalance
    });

    PaperTrade.stream.pipe(
      es.map(async (chunk: any, next: any) => {
        const doc: { amount: number; parentId?: ObjectID } = JSON.parse(chunk);
        doc.parentId = _id;
        const tradesCollection = await db.collection("trade"); // UNDONE можно ли подсократить?
        await tradesCollection.insertOne(doc, next);
        await collection.updateOne(
          { _id },
          {
            $set: {
              finalBalance: Math.abs(doc.amount)
            }
          }
        );
        console.log(doc);
      })
    );

    return paperTrade;
  }

  @odata.DELETE
  public async remove(@odata.key key: string): Promise<number> {
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    return (await connect())
      .collection(collectionName)
      .deleteOne({ _id })
      .then(result => result.deletedCount);
  }

  @odata.GET("Trades")
  public async getTrades(
    @odata.result result: PaperTrade,
    @odata.query query: ODataQuery
  ): Promise<Trade[]> {
    const db = await connect();
    const collection = db.collection("trade");
    const mongodbQuery = createQuery(query);
    const parentId = new ObjectID(result._id);
    const trades: any =
      typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0
        ? []
        : await collection
            .find({ $and: [{ parentId }, mongodbQuery.query] })
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .toArray();
    if (mongodbQuery.inlinecount) {
      trades.inlinecount = await collection
        .find({ $and: [{ parentId }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return trades;
  }
}
