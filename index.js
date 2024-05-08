const express= require('express')
const app= express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const cors= require('cors');
require('dotenv').config()
const cookieParser = require('cookie-parser')
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))
app.use(cookieParser())
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jjznfyw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares

const logger= (req, res,next)=>{
  console.log('cookie', req.method, req.url);
  next();
}
const verifyToken= (req,res,next)=>{
  const token= req.cookies?.token;
  console.log("verify Token",token);
  next();
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const serviceCollection= client.db('carDoctor').collection('services');
    const bookingCollection= client.db('carDoctor').collection('booking');
    app.get('/services',async(req,res)=>{
      const result = await serviceCollection.find().toArray();
      res.send(result)
    })

    

    // auth relatated 
   
    app.post('/jwt',logger,async(req,res)=>{
      const user= req.body;
     const token= jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1hr'})
     res
     .cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'none'
     })
     .send({sucess: true})
    })
    app.post('/logout',async(req,res)=>{
      const user= req.body;
      console.log('loggin out',user);
      res.clearCookie('token',{maxAge: 0}).send(user);
    })
    // service relatated 

    app.get('/services/:id',async(req,res)=>{
      const id= req.params.id;
      const query={_id: new ObjectId(id)}
      const options = {
        projection: { title: 1,img: 1,price: 1, },
      };
      const result= await serviceCollection.findOne(query,options);
      res.send(result);
    })

    // bookig 
    app.post('/booking',async(req,res)=>{
      const booking=req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })

    app.get('/booking',verifyToken,async(req,res)=>{
      let query={};
      if(req.query?.email){
        query={email:req.query.email}
      }
      const result= await bookingCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/booking/:id',async(req,res)=>{
      const id= req.params.id;
      console.log(id);
      const query= {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
  res.send("Doctor server is running")
})

app.listen(port, () => {
  console.log(`Doctor server is running on port ${port}`)
})
