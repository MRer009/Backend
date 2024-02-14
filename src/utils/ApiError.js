//api error in heritance from apierror

class ApiError extends Error {
  constructor(
    stastusCode,
    message = "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = stastusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if(stack){
        this.stack = stack
    }else{
        Error.captureStackTrace(this, this.constructor)
    }
  }
}



export {ApiError}