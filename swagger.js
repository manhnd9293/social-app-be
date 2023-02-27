require('dotenv').config();
const swaggerAutogen = require('swagger-autogen')();
const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/rootRouter.js'];
const doc = {
  info: {
    version: `${process.env.VERSION}`,      // by default: '1.0.0'
    title: 'Rest Api',        // by default: 'REST API'
    description: 'Job app 1.0',  // by default: ''
  },
  host: `localhost:${process.env.PORT}`,      // by default: 'localhost:3000'
  basePath: '/',  // by default: '/'
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [        // by default: empty Array
    {
      name: '',         // Tag name
      description: '',  // Tag description
    },
  ],
  securityDefinitions: {},  // by default: empty object
  definitions: {},          // by default: empty object (Swagger 2.0)
  components: {}            // by default: empty object (OpenAPI 3.x)
};

const autogenDocs = swaggerAutogen(outputFile, endpointsFiles, doc);

module.exports = autogenDocs;
