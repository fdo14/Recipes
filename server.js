const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const path = require('path')

require('dotenv').config({ path: 'variables.env' });

const Recipe = require('./models/Recipe');
const User = require('./models/User');

const { graphiqlExpress, graphqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools')

const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');

const schema = makeExecutableSchema({
    typeDefs,
    resolvers
})

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('DB Connected'))
    .catch(err => console.log(err));

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true
}
app.use(cors(corsOptions))

//Setup JWT Authentication Middleware
app.use(async (req, res, next) => {
    const token = req.headers['authorization'];
    if (token !== 'null' && token !== '' && token !== undefined) {
        try {
            const currentUser = await jwt.verify(token, process.env.SECRET)
            req.currentUser = currentUser
        } catch (err) {
            console.error(err)
        }
    }
    next()
})

app.use('/graphql', bodyParser.json(), 
    graphqlExpress(({ currentUser }) =>({
        schema,
        context: {
            Recipe,
            User,
            currentUser
        }
    }))
)

    app.use(express.static('client/build'))

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    })


const PORT = process.env.PORT || 4444;

app.listen(PORT, () => {
    console.log(`You suck on ${PORT}`);
})