process.env.PORT = process.env.PORT || 3001;
process.env.NODE_ENV = process.env.NODE_ENV || "DEV";

process.env.URL_DB =
  process.env.NODE_ENV === "DEV"
    ? "mongodb://localhost:27017/civi-conecta"
    : process.env.MONGO_URI;

process.env.TOKEN_EXPIRATION = "48h";
process.env.SEED = process.env.SEED || "dev-seed";
