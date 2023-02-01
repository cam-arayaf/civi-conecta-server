const { errorResponse } = require("../helpers");
const get404 = (req, resp) => errorResponse(resp, 404, "Page not found");
module.exports = { get404 };
