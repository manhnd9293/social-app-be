// This line must come before importing any instrumented module.
const tracer = require('dd-trace').init()
const express = require("express");
require('dotenv').config();
const {connectDb} = require("./config/db/mongo");
require('./config/uploadFile')
const { configRoute } = require("./config/routes");
const cors = require('cors');
const {errorHandler} = require("./utils/HttpError");
import {rateLimit} from 'express-rate-limit';

const app = express();
app.use(express.json());
app.use(cors({origin: JSON.parse(process.env.UI_DOMAINS)}));
configRoute(app);
app.use(errorHandler);
app.set('trust proxy', true)


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
});

app.use(limiter);
app.get('/ip', (request, response) => response.send(request.ip));

app.get('/x-forwarded-for', (request, response) => response.send(request.headers['x-forwarded-for']));


async function start() {
  try {
    await connectDb();
    let port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`server running on port ${port}`);
    })
  } catch (e) {
    console.log(`fail to start server`, e);
    process.exit();
  }
}


start();

module.exports = {app};