const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Users = require("../models/users");
const { errorResponse } = require("../helpers");

const signUp = (req, resp) => {
  const { email, name, password, role, workplaces } = req.body;

  new Users({ email, name, password, role, workplaces }).save((error, user) => {
    if (error) return errorResponse(resp, 500, error);
    resp.json({ ok: true, user });
  });
};

const signIn = (req, resp) => {
  const { email, password } = req.body;

  Users.findOne({ email, active: true }, (error, user) => {
    if (error) return errorResponse(resp, error);
    const wrongUser = !user || !bcrypt.compareSync(password, user.password);
    if (wrongUser) return errorResponse(resp, 400, "Incorrect credentials");
    const expiration = { expiresIn: process.env.TOKEN_EXPIRATION };
    const token = jwt.sign({ user }, process.env.SEED, expiration);
    user._doc.token = token;
    resp.cookie("token", token);
    resp.json({ ok: true, user });
  });
};

const signOut = (req, resp) => {
  resp.clearCookie("token");
  resp.json({ ok: true, message: "Sign out successful" });
};

module.exports = { signUp, signIn, signOut };
