import express from 'express'
import cors from 'cors'
import { MongoClient } from "mongodb"
import joi from "joi"
import dotenv from 'dotenv'
import dayjs from 'dayjs'

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

let db

const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
.then(() => db = mongoClient.db())
.catch((err) => console.log(err.message))

// const minute = 1000 * 60;
// const hour = minute * 60;
// const day = hour * 24;
// const year = day * 365;

const now = dayjs()

app.post("/participants", async (req, res) => {
  const { name } = req.body;

  const nameSchema = joi.object({
    name: joi.string().required(),
  });

  const validation = nameSchema.validate(req.body);

  if (validation.error) return res.sendStatus(422);
  try {
    const resp = await db.collection("participants").findOne({ name: name });

    if (resp) return res.sendStatus(409);
  } catch (err) {
    return res.status(500).send(err.message);
  }

  try {
    await db
      .collection("participants")
      .insertOne({ name: name, lastStatus: Date.now() });
  } catch (err) {
    return res.status(500).send(err.message);
  }

  try {
    await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: `${now.$H}:${now.$m}:${now.$s}`,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }

  res.sendStatus(201);
});

app.get("/paticipants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();

    res.send(participants);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.listen(5000)