const express = require("express");
require('dotenv').config();
const {connectDb} = require("./config/db/mongo");
require('./config/uploadFile')
const {rootRouter} = require("./routes/rootRouter");
const cors = require('cors');
const {errorHandler} = require("./utils/HttpError");


const app = express();
app.use(express.json());
app.use(cors({origin: JSON.parse(process.env.UI_DOMAINS)}));
app.use('/', rootRouter);
app.use(errorHandler);

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