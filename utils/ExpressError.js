class ExpressError extends Error {
    constructor(msg, statusCode) {
        //calls Error constructor
        super();
        this.message = msg;
        this.statusCode = statusCode;
    }
}

module.exports = ExpressError