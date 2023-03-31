const axios = require('axios');

let socketClient = axios.create({
  baseURL: process.env.SOCKET_URL
});

module.exports = socketClient;