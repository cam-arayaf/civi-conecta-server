const Surveys = require("../models/surveys");
const Topics = require("../models/topics");
const { errorResponse, nullCatch } = require("../helpers");

const getSortedAlternatives = (alternatives) =>
  alternatives
    .map((alternative) => ({ ...alternative._doc, _id: undefined }))
    .sort((a, b) => (a.letter > b.letter ? 1 : a.letter < b.letter ? -1 : 0));

const getNewSurvey = (survey) => ({
  ...survey._doc,
  _id: undefined,
  __v: undefined,
  alternatives: getSortedAlternatives(survey._doc.alternatives),
});

const getNewSurveys = (surveys) =>
  surveys.map((survey) => getNewSurvey(survey));

const getSurveysByType = (req, resp) => {
  Surveys.find({ type: req.query.type })
    .sort({ number: 1 })
    .populate({ path: "topic", select: "-_id -__v" })
    .exec((error, surveys) => {
      if (error) return errorResponse(resp, 500, error);
      const newSurveys = getNewSurveys(surveys);
      resp.json({ ok: true, total: newSurveys.length, surveys: newSurveys });
    });
};

const createSurvey = async (req, resp) => {
  const { number, type, topic, question, alternatives } = req.body;
  const queryTopic = { number: topic };
  const foundTopic = await Topics.findOne(queryTopic).exec().catch(nullCatch);
  if (!foundTopic) return errorResponse(resp, 400, "Topic not found");
  const querySurvey = { number, type, topic: foundTopic._id };
  const prevSurvey = await Surveys.findOne(querySurvey).exec().catch(nullCatch);
  if (prevSurvey) return errorResponse(resp, 400, "Survey already exists");

  new Surveys({
    number,
    type,
    topic: foundTopic._id,
    question,
    alternatives,
  }).save(async (error, survey) => {
    if (error) return errorResponse(resp, 500, error);
    const popTopic = { path: "topic", select: "-_id -__v" };
    const populatedSurvey = await survey.populate(popTopic);
    const newSurvey = getNewSurvey(populatedSurvey);
    resp.json({ ok: true, survey: newSurvey });
  });
};

const updateSurvey = async (req, resp) => {
  const { query, body } = req;
  const { number, type, topic } = query;
  const { question, alternatives } = body;
  const queryTopic = { number: topic };
  const foundTopic = await Topics.findOne(queryTopic).exec().catch(nullCatch);
  if (!foundTopic) return errorResponse(resp, 400, "Topic not found");

  Surveys.findOneAndUpdate(
    { number, type, topic: foundTopic._id },
    { question, alternatives },
    { new: true, runValidators: true, context: "query" },
    async (error, survey) => {
      if (error) return errorResponse(resp, 500, error);
      if (!survey) return errorResponse(resp, 400, "Survey not found");
      const popTopic = { path: "topic", select: "-_id -__v" };
      const populatedSurvey = await survey.populate(popTopic);
      const newSurvey = getNewSurvey(populatedSurvey);
      resp.json({ ok: true, survey: newSurvey });
    }
  );
};

const deleteSurvey = async (req, resp) => {
  const { number, type, topic } = req.query;
  const queryTopic = { number: topic };
  const foundTopic = await Topics.findOne(queryTopic).exec().catch(nullCatch);
  if (!foundTopic) return errorResponse(resp, 400, "Topic not found");

  Surveys.findOneAndDelete(
    { number, type, topic: foundTopic._id },
    async (error, survey) => {
      if (error) return errorResponse(resp, 500, error);
      if (!survey) return errorResponse(resp, 400, "Survey not found");
      const popTopic = { path: "topic", select: "-_id -__v" };
      const populatedSurvey = await survey.populate(popTopic);
      const newSurvey = getNewSurvey(populatedSurvey);
      resp.json({ ok: true, survey: newSurvey });
    }
  );
};

module.exports = { getSurveysByType, createSurvey, updateSurvey, deleteSurvey };
