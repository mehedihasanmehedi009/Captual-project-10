const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PROT || 3000;

const admin = require("firebase-admin");
const serviceAccount = require("./capca-projects-10-firebase-adminsdk-fbsvc-840e59178c.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://Captuaproject:TUHgdeQ8iT2R6rP7@cluster0.8uqf12b.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const verifyFirebase = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
    console.log(userInfo);
    next();
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function run() {
  try {
    await client.connect();

    const my = client.db("myDB");
    const Product = my.collection("Products");
    // all  find
    app.get("/Products", async (req, res) => {
      const cursor = Product.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // find one
    app.get("/Products/:id",verifyFirebase, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Product.findOne(query);
      res.send(result);
    });

    // get leing
    app.get("/letst", async (req, res) => {
      const cursor = Product.find().sort({ created_at: -1 }).limit(8);
      const result = await cursor.toArray(cursor);
      res.send(result);
    });

    //   add
    app.post("/Products", async (req, res) => {
      const newproduct = req.body;
      const result = await Product.insertOne(newproduct);
      res.send(result);
    });
    //  put
    app.put("/Products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const updateDoc = {
        $set: data,
      };
      const result = await Product.updateOne(filter, updateDoc);
      res.send(result);
    });

    // delete
    app.delete("/Products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Product.deleteOne(query);
      res.send(result);
    });
    app.get("/my-model", verifyFirebase, async (req, res) => {
      const email = req.query.email;
      const result = await Product.find({ created_by: email }).toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
