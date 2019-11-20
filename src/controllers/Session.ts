import es from "event-stream";
import moment from "moment";
import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import { streamTradesBacktest, streamTradesPaper } from "trader-service";
import connect from "../connect";
import { Session } from "../models/Session";
import { Trade } from "../models/Trade";

const collectionName = "session";

@odata.type(Session)
@Edm.EntitySet("Session")
export class SessionController extends ODataController {
  @odata.GET
  public async get(@odata.query query: ODataQuery): Promise<Session[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);

    if (mongodbQuery.query._id) {
      mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    }

    const result: Session[] & { inlinecount?: number } =
      typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0
        ? []
        : await db
            .collection(collectionName)
            .find(mongodbQuery.query)
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .map(e => new Session(e))
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
  ): Promise<Session> {
    const { projection } = createQuery(query);
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    const db = await connect();
    return new Session(
      await db.collection(collectionName).findOne({ _id }, { projection })
    );
  }

  @odata.POST
  public async post(
    @odata.body
    body: any
  ): Promise<Session> {
    const session = new Session(body);

    if (!session.begin) {
      session.begin = moment()
        .utc()
        .toISOString();
    }

    session.backtest = !!session.end;

    const db = await connect();
    const collection = await db.collection(collectionName);
    session._id = (await collection.insertOne(session)).insertedId;

    const {
      _id,
      backtest,
      asset,
      currency,
      exchange,
      period,
      begin,
      end,
      indicators,
      code,
      initialBalance
    } = session;

    if (backtest) {
      const rs = streamTradesBacktest({
        exchange,
        currency,
        asset,
        period,
        start: begin,
        end,
        indicators: JSON.parse(indicators),
        code,
        initialBalance
      });

      let finalBalance: number;
      const tradesCollection = await db.collection("trade");

      rs.pipe(
        es.map((chunk: any, next: any) => {
          const doc: { amount: number; parentId?: ObjectID } = JSON.parse(
            chunk
          );
          doc.parentId = _id;
          finalBalance = doc.amount;
          tradesCollection.insertOne(doc, next);
        })
      );

      await new Promise(resolve => {
        rs.on("end", resolve);
      });

      finalBalance = Math.abs(finalBalance);

      await collection.updateOne(
        { _id },
        {
          $set: {
            finalBalance,
            profit: finalBalance - initialBalance
          }
        }
      );
    } else {
      const stream = streamTradesPaper({
        exchange,
        currency,
        asset,
        period: "" + period,
        start: begin,
        indicators: JSON.parse(indicators),
        code,
        initialBalance
      });

      stream.pipe(
        es.map(async (chunk: any, next: any) => {
          const doc: { amount: number; parentId?: ObjectID } = JSON.parse(
            chunk
          );
          doc.parentId = _id;
          const tradesCollection = await db.collection("trade"); // UNDONE можно ли подсократить?
          await tradesCollection.insertOne(doc, next);
          await collection.updateOne(
            { _id },
            {
              $set: {
                finalBalance: Math.abs(doc.amount),
                profit: Math.abs(doc.amount) - initialBalance
              }
            }
          );
        })
      );

      Session.streams[_id.toHexString()] = stream;
    }

    return session;
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
    @odata.result result: Session,
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
