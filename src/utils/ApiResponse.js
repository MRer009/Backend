class ApiResponse{
    constructor(statusCode,data, messsage ="success"){
        this.statusCode=statusCode
        this.data = data;
        this.message=messsage;
        this.success = statusCode < 400
    }
}