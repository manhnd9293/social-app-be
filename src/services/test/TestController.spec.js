const chai = require('chai');
const {assert} = require('chai');
const chaiHttp = require('chai-http');
const { app } = require("../../index");
const {connectDb} = require("../../config/db/mongo");
const mongoose = require("mongoose");
chai.use(chaiHttp);

let requester = null;
beforeEach(async () => {
  requester = chai.request(app);
  await connectDb();
  console.log(`start a test`);
});

afterEach(async () => {
  await mongoose.connection.close();
})

describe('test', function () {
  it('should return ok', () => {
    const res = 'ok';
    assert.equal(res, 'ok');
  })
  it('test api', async () => {
    const res = await requester.get('/test?lastId=0').send();
    assert.equal(JSON.stringify({items: [1,2,3,4,5,6,7,8,9,10], hasNext: true}), res.text)
  })

  it('test api', async () => {
    const res = await requester.get('/test?lastId=42').send();
    assert.equal(JSON.stringify({items: [43,44,45], hasNext: false}), res.text)
  })
});