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

app.post('/participants', async (req, res) => {
    const {name} = req.body

    const nameSchema = joi.object({
        name: joi.string().required()
    })

    const validation = nameSchema.validate(req.body);

    if(validation.error) return res.sendStatus(422)
    
    const resp = await db.collection('participants').findOne({ name: name })

    if(resp) return res.sendStatus(409)

    await db.collection('participants').insertOne({ name: name, lastStatus: Date.now() })

    await db.collection('messages').insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: `${now.$H}:${now.$m}:${now.$s}`})

    res.sendStatus(201)
})

app.listen(5000)