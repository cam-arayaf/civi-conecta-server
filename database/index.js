const mongoose = require("mongoose");

mongoose.connect(
  process.env.URL_DB,
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) throw err;
    console.log("DB status: Online");
  }
);
