const Users = require("../models/users");
const { errorResponse } = require("../helpers");

const getUsers = async (req, resp) => {
  Users.find({})
    .sort({ active: -1, role: 1, email: 1 })
    .exec((error, users) => {
      if (error) return errorResponse(resp, 500, error);
      resp.json({ ok: true, total: users.length, users });
    });
};

const updatePasswordUser = (req, resp) => {
  Users.findOneAndUpdate(
    { email: req.query.email, active: true },
    { password: req.body.password },
    { new: true, runValidators: true, context: "query" },
    (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      resp.json({ ok: true, user });
    }
  );
};

const updateRoleUser = (req, resp) => {
  Users.findOneAndUpdate(
    { email: req.query.email, active: true },
    { role: req.body.role },
    { new: true, runValidators: true, context: "query" },
    (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      resp.json({ ok: true, user });
    }
  );
};

const inactivateUser = (req, resp) => {
  Users.findOneAndUpdate(
    { email: req.query.email, active: true },
    { active: false },
    { new: true },
    (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      resp.json({ ok: true, user });
    }
  );
};

const reactivateUser = (req, resp) => {
  Users.findOneAndUpdate(
    { email: req.query.email, active: false },
    { active: true },
    { new: true },
    (error, user) => {
      if (error) return errorResponse(resp, 500, error);
      if (!user) return errorResponse(resp, 400, "User not found");
      resp.json({ ok: true, user });
    }
  );
};

module.exports = {
  getUsers,
  updatePasswordUser,
  updateRoleUser,
  inactivateUser,
  reactivateUser,
};
