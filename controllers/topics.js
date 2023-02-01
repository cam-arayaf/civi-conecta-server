const Surveys = require("../models/surveys");
const Topics = require("../models/topics");
const { errorResponse, nullCatch } = require("../helpers");

const getTopics = (req, resp) => {
  Topics.find({})
    .sort({ number: 1 })
    .exec((error, topics) => {
      if (error) return errorResponse(resp, 500, error);
      resp.json({ ok: true, total: topics.length, topics });
    });
};

const createTopic = (req, resp) => {
  const { number, title } = req.body;

  new Topics({ number, title }).save((error, topic) => {
    if (error) return errorResponse(resp, 500, error);
    resp.json({ ok: true, topic });
  });
};

const updateTopic = (req, resp) => {
  const queryAttr = { number: req.query.number };
  const bodyAttr = { title: req.body.title };
  const options = { new: true, runValidators: true, context: "query" };

  Topics.findOneAndUpdate(queryAttr, bodyAttr, options, (error, topic) => {
    if (error) return errorResponse(resp, 500, error);
    if (!topic) return errorResponse(resp, 400, "Topic not found");
    resp.json({ ok: true, topic });
  });
};

const deleteTopic = async (req, resp) => {
  const { number } = req.query;
  const queryTopic = { number };
  const topic = await Topics.findOne(queryTopic).exec().catch(nullCatch);
  if (!topic) return errorResponse(resp, 400, "Topic not found");
  const querySurvey = { topic: topic._id };
  const surveyFind = await Surveys.findOne(querySurvey).exec().catch(nullCatch);
  const associatedSurveysMessage = "This topic has associated surveys";
  if (surveyFind) return errorResponse(resp, 400, associatedSurveysMessage);

  Topics.findOneAndDelete(queryTopic, (error, topic) => {
    if (error) return errorResponse(resp, 500, error);
    resp.json({ ok: true, topic });
  });
};

module.exports = { getTopics, createTopic, updateTopic, deleteTopic };
