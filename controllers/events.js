const Events = require("../models/events");

const {
  errorResponse,
  addBaseUrlToFile,
  addBaseUrlToFiles,
} = require("../helpers");

const getEvents = async (req, resp) => {
  Events.find({})
    .sort({ number: 1 })
    .exec((error, events) => {
      if (error) return errorResponse(resp, 500, error);
      addBaseUrlToFiles(req, events);
      resp.json({ ok: true, total: events.length, events });
    });
};

const createEvent = async (req, resp) => {
  const { number, title, description, date } = req.body;

  new Events({ number, title, description, date }).save(
    async (error, event) => {
      if (error) return errorResponse(resp, 500, error);
      addBaseUrlToFile(req, event);
      resp.json({ ok: true, event });
    }
  );
};

const updateEvent = async (req, resp) => {
  const { title, description, date } = req.body;

  Events.findOneAndUpdate(
    { number: req.query.number },
    { title, description, date },
    { new: true, runValidators: true, context: "query" },
    async (error, event) => {
      if (error) return errorResponse(resp, 500, error);
      if (!event) return errorResponse(resp, 400, "Event not found");
      addBaseUrlToFile(req, event);
      resp.json({ ok: true, event });
    }
  );
};

const deleteEvent = async (req, resp) => {
  Events.findOneAndDelete(
    { number: req.query.number },
    async (error, event) => {
      if (error) return errorResponse(resp, 500, error);
      if (!event) return errorResponse(resp, 400, "Event not found");
      addBaseUrlToFile(req, event);
      resp.json({ ok: true, event });
    }
  );
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
