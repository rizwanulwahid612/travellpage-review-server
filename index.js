const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.port || 5000;



app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.k8jkgs6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {

    try {
        const travelCollection = client.db('traveldb').collection('travel');
        const reviewPlaceCollection = client.db('traveldb').collection('review');

        app.post('/jwt', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d'})
            res.send({token})
        })  

        app.get('/alltravel', async (req, res) => {
            const query = {};
            const cursor = travelCollection.find(query);
            const result = await cursor.limit(3).toArray();
            res.send(result);
        })
        app.get('/alltravelpages', async (req, res) => {
            const query = {};
            const cursor = travelCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/viewDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = await travelCollection.findOne(query);
            res.send(cursor);
        })
        app.post('/itemadded', async (req, res) => {
            const revw = req.body;
            const result = await travelCollection.insertOne(revw);
            res.send(result);

        })
        app.get('/itemadded',async (req, res) => {
           

            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }

            }
            const cursor = travelCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })
        app.post('/review',verifyJWT, async (req, res) => {
            const revw = req.body;
            const result = await reviewPlaceCollection.insertOne(revw);
            res.send(result);

        })
        app.get('/review',verifyJWT,async (req, res) => {
            const decoded = req.decoded;
            
            if(decoded.email !== req.query.email){
                res.status(403).send({message: 'unauthorized access'})
            }
            let query = {};

            if (req.query.email) {
                query = {
                    email: req.query.email
                }

            }
            const cursor = reviewPlaceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })
        app.delete('/deleteItem/:id',verifyJWT, async(req, res) => {
            const id = req.params.id
            const query = { _id:ObjectId(id) };
            const result = await reviewPlaceCollection.deleteOne(query);
            if (result.deletedCount === 1) {
                console.log("Successfully deleted one document.");
            } else {
                console.log("No documents matched the query. Deleted 0 documents.");
            }
            res.send(result)
        })

        app.get('/editreviewform/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const cursor = await reviewPlaceCollection.findOne(query);
            res.send(cursor);
        })

        app.put('/editreviewform/:id',async(req,res)=>{
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const user = req.body;
            const options = { upsert: true };
            const updateReview = {
                $set: {
                    name:user.name,
                    photoURL:user.photoURL,
                    email:user.email,
                    place:user.place,
                    review:user.review,
                },
              };
              const result = await reviewPlaceCollection.updateOne(query, updateReview, options);
              res.send(result)
        })

    }
    finally {

    }
}
run().catch(error => console.log(error))


app.get('/', (req, res) => {
    res.send('hlw from server')
})
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})