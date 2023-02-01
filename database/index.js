const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

mongoose.connect(process.env.DATABASE_URL, {}, (err) => {
  if (err) throw err;
  console.log("DB status: Online");
});
