class HttpError extends Error {

  constructor(messageData) {
    super();
    this.messageData = messageData;
  }

  badRequest(message) {
    return new HttpError({status: 400, message});
  }
  unauthorize(message) {
    return new HttpError({status: 401, message: message || 'You are not allow to do this action'});
  }
}

function errorHandler(err, req, res, next) {

  console.log(err.stack);

  if(err instanceof HttpError) {
    console.log(`Error message: ${err.messageData.message}`);

    //handle user define error
    const {status, message} = err.messageData;
    res.status(Number(status) || 500)
      .json({
        status: status || 500,
        message: (message || 'Some thing went wrong')
      });
    next();
    return;
  }

  // handle system error
  res.status(500).json({
    status: 500,
    message: 'Something went wrong'
  })

}

module.exports = {httpError: new HttpError(), errorHandler}