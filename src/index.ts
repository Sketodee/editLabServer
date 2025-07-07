require('dotenv').config()
import express from 'express';
import { corsOptions } from './config/corsOptions';
import { logger } from './middleware/logEvents';
import verifyJWT from './middleware/verifyJWT';
import credentials from './middleware/credentials';
import { errorHandler } from './middleware/errorHandler';
import connectDB from './config/dbConn';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
const cors = require('cors')
const PORT = process.env.PORT || 3000;

import userRoute from './routes/api/user';
import authRoute from './routes/api/auth';
import pluginRoute from './routes/api/plugin'
import subscriptionRoute from './routes/api/subscription';
import subscriptionController from './controllers/subscriptionController';
import affiliateRoute from './routes/api/affiliate';

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

app.post('/api/subscription/webhook', 
  express.raw({ type: 'application/json' }), 
  subscriptionController.handleWebhook
);
app.use('/api/user', userRoute);
//middleware for json 
app.use(express.json())

//Route handlers without JWT authorization 

app.use('/api/auth', authRoute);
app.use('/api/subscription', subscriptionRoute);

app.get('/success', (req, res) => {
  res.send('Payment successful! Thank you for your purchase.');
});

app.get('/cancel', (req, res) => {
  res.send('You canceled the payment. Please try again.');
});
  
app.use(verifyJWT)
app.use('/api/user', userRoute)
app.use('/api/plugin', pluginRoute)
app.use('/api/affiliate', affiliateRoute);

//custom error handler 
app.use(errorHandler)



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
