require('dotenv').config()
import express from 'express';
import { corsOptions } from './config/corsOptions';
import { logger } from './middleware/logEvents';
import verifyJWT from './middleware/verifyJWT';
import credentials from './middleware/credentials';
import { errorHandler } from './middleware/errorHandler';
import connectDB from './config/dbConn';

const app = express();
const cors = require('cors')
const PORT = process.env.PORT || 3000;

import userRoute from './routes/api/user';
import authRoute from './routes/api/auth';
import pluginRoute from './routes/api/plugin'

//connect to MongoDb
connectDB()

//custom middleware to log all requests and their origin 
app.use(logger)

//handle options credentials check - before CORS and fetch cookies credential requirements 
 app.use(credentials)

//apply middleware for CORS options 
app.use(cors(corsOptions))

//middleware to handle url encoded data 
app.use(express.urlencoded({extended: false}))

//middleware for json 
app.use(express.json())

//Route handlers without JWT authorization 
// app.use('/api/user', userRoute);
app.use('/api/auth', authRoute);

app.use(verifyJWT)
app.use('/api/user', userRoute)
app.use('/api/plugin', pluginRoute)

//custom error handler 
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
