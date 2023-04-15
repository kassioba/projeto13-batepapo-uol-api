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
      time: `${now.$H < 10 ? "0" + now.$H : now.$H}:${
        now.$m < 10 ? "0" + now.$m : now.$m
      }:${now.$s < 10 ? "0" + now.$s : now.$s}`,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }

  res.sendStatus(201);
});

app.get("/participants", async (req, res) => {
  console.log("oi");

  try {
    const participants = await db.collection("participants").find().toArray();

    res.send(participants);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { from } = req.headers;

  const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.valid("private_message", "message").required(),
  });

  const validation = messageSchema.validate(req.body);

  if (validation.error) return res.status(422).send(validation.error);

  try {
    const resp = await db.collection("participants").findOne({ name: from });
    if (!resp) return res.sendStatus(422);
  } catch (err) {
    res.status(500).send(err.message);
  }

  const message = {
    from,
    to,
    text,
    type,
    time: `${now.$H < 10 ? "0" + now.$H : now.$H}:${
      now.$m < 10 ? "0" + now.$m : now.$m
    }:${now.$s < 10 ? "0" + now.$s : now.$s}`,
  };

  try {
    await db.collection("messages").insertOne(message);
    res.sendStatus(201);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(5000)