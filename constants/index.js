const schemaOptions = { timestamps: true };
const enumMessage = `{VALUE} isn't a valid`;
const required = [true, "{PATH} is required"];
const uniqueMessage = { message: "{PATH} must be unique" };
const arrayStringData = { type: [String] };
const defaultArrayStringData = { type: [String], default: [] };
const booleanData = { type: Boolean, default: true };
const stringData = { type: String, trim: true };
const numberData = { type: Number };
const dateData = { type: Date };
const requiredArrayStringData = { ...arrayStringData, required };
const requiredStringData = { ...stringData, required };
const requiredNumberData = { ...numberData, required };
const requiredDateData = { ...dateData, required };
const uniqueStringData = { ...requiredStringData, unique: true };
const uniqueNumberData = { ...requiredNumberData, unique: true };

module.exports = {
  schemaOptions,
  enumMessage,
  required,
  uniqueMessage,
  arrayStringData,
  defaultArrayStringData,
  booleanData,
  stringData,
  numberData,
  dateData,
  requiredArrayStringData,
  requiredStringData,
  requiredNumberData,
  requiredDateData,
  uniqueStringData,
  uniqueNumberData,
};
