const express = require("express")
const app = express()
const path = require("path")
const cors = require("cors")
require("dotenv").config()
const port = process.env.PORT || 3000
//prepare connect to mongodb
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const { error } = require("console")
const uri = process.env.uri;

//use

app.use(express.static(path.join(__dirname, "/views")))
app.use(cors())
// parse data from forms
app.use(express.json());       
app.use(express.urlencoded({extended: true})); 




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    }
  });

//Functions

//Connect to mongoDb server
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch(err) {
    console.log(err)
  }
};

// Close DB connection before server exit
const dbClose = async () => {
  try {
    await client.close()
  } catch(error){
    console.log(error)
  }
  
};

//start Server
const start = async () => {
  try{
    await run().catch(console.dir);
  } finally{
    app.listen(port, () => {
    console.log('server is running on port ' + port)
})
  }
}

//Routes

app.post("/api/users", (req,res) => {
    const uname = req.body.username;
    const createUser = async () => {
        const result = await client.db("Exercise").collection("name_id").insertOne({username: uname, count: 0, log: []})
        res.send({username: uname, _id: result.insertedId}).status(200)
    }
    createUser()
})

app.get("/api/users", (req,res) => {
  async function getAllUsers(){
    const data = []
    const response = await client.db("Exercise").collection("name_id").find({}).project({username: 1, "_id": 1})
      for await (const item of response){
        data.push(item)
      }
    res.send(data)
  }

  getAllUsers()
})

app.post("/api/users/:_id/exercises", (req,res) => {
    const o_id = new ObjectId(req.params._id)
    const ndate = req.body.date? new Date(req.body.date) : new Date()
    const createExercise = async () => {
      try{
        const result = await client.db("Exercise").collection("name_id").findOneAndUpdate({"_id": o_id}, {$inc: {count: 1}, $push: {log: {description: req.body.description, duration: req.body.duration, date: ndate ?? new Date()}}}, {returnNewDocument: true})
        res.send({_id: result._id, username: result.username, date: ndate.toDateString(), duration: parseInt(req.body.duration), description: req.body.description})
      } catch(err){
        console.log(err)
        res.send("something went wrong. Please check that your inputs are corret and try again")
      }
    }
    createExercise()
})

app.get("/api/users/:_id/logs", (req,res) => {

  //functions
  //return log from user based on id, From, To and Limit
  async function getLogsWithParams(){
    const nfrom = new Date(req.query.from ?? new Date("0000-00-00"))
    const nto = new Date(req.query.to ?? new Date("3000-12-12"))
    const o_id = new ObjectId(req.params._id)
    let data;

    //Send query to database
    const result = await client
    .db("Exercise")
    .collection("name_id")
    .find({"_id": o_id})
    .project({username: 1, count: 1,"_id": 1,log: {$filter: {input: "$log", cond: {$and: [{$gte: ["$$this.date", nfrom]}, {$lte: ["$$this.date", nto]}]}, limit: Number(req.query.limit ?? 500)}}})

    //Get the data from cursor
    for await (const doc of result) {
      data = doc;
    }
    //format Dates to match fcc template
    data.log.forEach(element => {
      element.date = element.date.toDateString()
      element.duration = Number(element.duration)
    });
    //Deliver data to user
    res.send({
      username : data.username,
      count : data.count,
      _id : data._id,
      log : data.log
    })
  }

  try{
    getLogsWithParams()
  } catch(err){
    console.log(err)
  }

})


//Start Server

start()

//Do before exit
process.on('SIGINT', () => {
  console.log("Exiting Server...")
  dbClose().finally(()=>{
    console.log("DB connection is closed")
    process.exit(0)})
  })