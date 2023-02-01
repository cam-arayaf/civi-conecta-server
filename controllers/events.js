const fs = require("fs");
const ftp = require("basic-ftp");
const Grades = require("../models/grades");
const Events = require("../models/events");

const {
  errorResponse,
  getFileUrl,
  getFtpConnectionOptions,
  nullCatch,
  getDateString,
} = require("../helpers");

const getTotalFilesByEvent = async (gradeLevel, eventNumber) => {
  const pathFind = `./grades/${gradeLevel}/events/${eventNumber}`;
  const client = new ftp.Client();

  try {
    await client.access(getFtpConnectionOptions());
    const list = await client.list(pathFind);
    client.close();
    return list.map((f) => f.name).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  } catch (error) {
    client.close();
    return [];
  }
};

const getFinalFilesByEvent = async (req, gradeLevel, eventNumber) => {
  const totalFilesByEvent = await getTotalFilesByEvent(gradeLevel, eventNumber);

  return totalFilesByEvent.map((fileName) => ({
    fileName,
    getPath: getFileUrl(
      req,
      `/getFileByEventAndGrade?event=${eventNumber}&grade=${gradeLevel}&file=${fileName}`
    ),
    deletePath: getFileUrl(
      req,
      `/deleteFileByEventAndGrade?event=${eventNumber}&grade=${gradeLevel}&file=${fileName}`
    ),
  }));
};

const getGradeAndEvent = ({
  number: eventNumber,
  grade: { level: gradeLevel },
}) => ({ gradeLevel, eventNumber });

const addFilesToEvent = async (req, eventObj) => {
  const { gradeLevel, eventNumber } = getGradeAndEvent(eventObj);
  const files = await getFinalFilesByEvent(req, gradeLevel, eventNumber);
  eventObj._doc.files = files;
};

const addFilesToEvents = async (req, eventsArr) =>
  await Promise.all(
    eventsArr.map(async (eventObj) => await addFilesToEvent(req, eventObj))
  );

const setToNormalDateEvent = (event) =>
  (event._doc.date = getDateString(event._doc.date));

const setToNormalDateEvents = (events) => events.map(setToNormalDateEvent);

const getEventsByGrade = async (req, resp) => {
  const queryGrade = { level: req.query.grade };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");

  Events.find({ grade: grade._id })
    .sort({ date: 1 })
    .populate({ path: "grade", select: "-_id -__v" })
    .exec(async (error, events) => {
      if (error) return errorResponse(resp, 500, error);
      await addFilesToEvents(req, events);
      setToNormalDateEvents(events);
      resp.json({ ok: true, total: events.length, events });
    });
};

const createEvent = async (req, resp) => {
  const {
    number,
    title,
    description,
    planning,
    date,
    grade: gradeToFind,
  } = req.body;

  const queryGrade = { level: gradeToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");
  const queryEvnt = { number, grade: grade._id };
  const prevEvnt = await Events.findOne(queryEvnt).exec().catch(nullCatch);
  if (prevEvnt) return errorResponse(resp, 400, "Event already exists");
  const body = { number, title, description, planning, date, grade: grade._id };

  new Events(body).save(async (error, event) => {
    if (error) return errorResponse(resp, 500, error);
    const popGrade = { path: "grade", select: "-_id -__v" };
    const newEvent = await event.populate(popGrade);
    await addFilesToEvent(req, newEvent);
    setToNormalDateEvent(newEvent);
    resp.json({ ok: true, event: newEvent });
  });
};

const updateEvent = async (req, resp) => {
  const { number, grade: levelToFind } = req.query;
  const { title, description, planning, date } = req.body;
  const queryGrade = { level: levelToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available in filter");

  Events.findOneAndUpdate(
    { number, grade: grade._id },
    { title, description, date, planning },
    { new: true, runValidators: true, context: "query" },
    async (error, event) => {
      if (error) return errorResponse(resp, 500, error);
      if (!event) return errorResponse(resp, 400, "Event not found");
      const popGrade = { path: "grade", select: "-_id -__v" };
      const newEvent = await event.populate(popGrade);
      await addFilesToEvent(req, newEvent);
      setToNormalDateEvent(newEvent);
      resp.json({ ok: true, event: newEvent });
    }
  );
};

const deleteEvent = async (req, resp) => {
  const { number, grade: levelToFind } = req.query;
  const queryGrade = { level: levelToFind };
  const grade = await Grades.findOne(queryGrade).exec().catch(nullCatch);
  if (!grade) return errorResponse(resp, 400, "No grade available");

  Events.findOneAndDelete(
    { number, grade: grade._id },
    async (error, event) => {
      if (error) return errorResponse(resp, 500, error);
      if (!event) return errorResponse(resp, 400, "Event not found");
      const popGrade = { path: "grade", select: "-_id -__v" };
      const newEvent = await event.populate(popGrade);
      await addFilesToEvent(req, newEvent);
      setToNormalDateEvent(newEvent);
      resp.json({ ok: true, event: newEvent });
    }
  );
};

module.exports = {
  getEventsByGrade,
  createEvent,
  updateEvent,
  deleteEvent,
};
