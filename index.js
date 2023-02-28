const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.msatzvk.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        red.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        const userCollection = client.db('PersonalServer').collection('users')

        const productsCollection = client.db('PersonalServer').collection('Products')

        const categoryCollection = client.db('PersonalServer').collection('Categories')

        const orderCollection = client.db('PersonalServer').collection('Orders')



        app.put('/user/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const filter = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }

            const result = await userCollection.updateOne(filter, updateDoc, options)

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '7d'
            })
            console.log(token)
            res.send({
                status: 'success',
                result,
                token
            })
        })

        // Gell All Catgories 
        app.get('/categories', async (req, res) => {
            const result = await categoryCollection.find().toArray()
            res.send(result)
        })

        app.get('/products', async (req, res) => {
            const result = await productsCollection.find().toArray()
            res.send(result)
        })


        app.get('/videoproducts', async (req, res) => {
            // const videoURL = req.query.videoURL
            // const query = {
            //     videoURL : videoURL
            //  }
            // console.log(videoURL)
            
            const result = await productsCollection.find({video: {$in: ["video"]}}).toArray()
            res.send(result)
        })

        // get poducts by category
        app.get('/products/:category', async (req, res) => {
            const category = req.params.category
            const query = { category: category }
            const result = await productsCollection.find(query).toArray()
            // const result = await productsCollection.find(query).sort({$natural: -1}).toArray()
            res.send(result)
        })


        // category wise Product
        app.get('/categorywise/:category', async (req, res) => {
            const category = req.params.category
            console.log(category)
            const query = { category: category }
            const result = await productsCollection.find(query).toArray()
            // const result = await productsCollection.find(query).sort({$natural: -1}).toArray()
            res.send(result)
        })

        // get product details by _id 
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await productsCollection.findOne(query)
            res.send(result)
        })

        // placed order by customer 
        app.post('/order', async (req, res) => {
            const orderinfo = req.body
            const result = await orderCollection.insertOne(orderinfo)
            res.send(result)
        })

        app.post('/addproduct', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email
            const query = { email: decodedEmail }
            const user = await userCollection.findOne(query)

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const productData = req.body
            const result = await productsCollection.insertOne(productData)
            res.send(result)
        })


        app.put('/editproduct', async (req, res) => {
            const home = req.body
            console.log(home)

            const filter = {}
            const options = { upsert: true }
            const updateDoc = {
                $set: home,
            }
            const result = await productsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        app.put('/products/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    offered: true
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })


        //  check admin 
        // app.get('/users/admin/:email', async (req, res) => {
        //     const email = req.params.email
        //     const query = {
        //         email: email
        //     }
        //     const user = await userCollection.findOne(query)
        //     res.send({
        //         user
        //     })
        // })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        // Get search result
        app.get('/search-result', async (req, res) => {
            const query = {}
            const location = req.query.location
            if (location) query.location = location

            console.log(query)
            const cursor = homesCollection.find(query)
            const homes = await cursor.toArray()
            res.send(homes)
        })
    }
    finally {

    }

}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('Server  is Running ')
})

app.listen(port, () => {
    console.log(`Server  is Running on ${port}`)
})