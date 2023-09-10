const express = require("express")
const app = express()
const path = require("path")
require("dotenv").config()
const port = 3000
app.use(express.static(path.join(__dirname, "../views")))

//connect to mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { error } = require("console")
const uri = process.env.uri;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      //await client.close();
    }
  }
  //run().catch(console.dir);

// parse data from forms
app.use(express.json());       
app.use(express.urlencoded({extended: true})); 


app.post("/api/users", (req,res) => {
    const uname = req.body.username;
    const createUser = async () => {
        await run().catch(console.dir)
        const result = await client.db("Exercise").collection("name_id").insertOne({username: uname, count: 0, log: []})
        await client.close()
        res.send({username: uname, _id: result.insertedId}).status(200)
    }
    createUser()
})

app.post("/api/users/:_id/exercises", (req,res) => {
    const o_id = new ObjectId(req.params._id)
    const ndate = new Date(req.body.date)
    const createExercise = async () => {
        await run().catch(console.dir)

        const result = await client.db("Exercise").collection("name_id").findOneAndUpdate({"_id": o_id}, {$inc: {count: 1}, $push: {log: {description: req.body.description, duration: req.body.duration, date: ndate}}}, {returnNewDocument: true})

        console.log(result)
        await client.close()
        res.send({_id: result._id, username: result.username, date: ndate.toDateString(), duration: req.body.duration, description: req.body.description})
    }
    createExercise()
})

app.get("/api/users/:_id/logs", (req,res) => {
  console.log(req.params)
  res.send("wow")
})

app.listen(port, () => {
    console.log('server is running on port ' + port)
})