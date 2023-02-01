const { errorResponse } = require("../helpers");

const checkIfHasFourAlternatives = (
  alternatives,
  filteredAlternativesOnlyLetter = []
) =>
  !!alternatives &&
  Array.isArray(alternatives) &&
  alternatives.length === 4 &&
  alternatives.filter(
    (a) =>
      !!a.letter &&
      typeof a.letter === "string" &&
      !!a.letter.trim().length &&
      ["a", "b", "c", "d"].includes(a.letter.toLowerCase()) &&
      !!a.description &&
      typeof a.description === "string" &&
      !!a.description.trim().length &&
      typeof a.value === "number" &&
      [0, 1, 2, 3, 4].includes(a.value) &&
      !filteredAlternativesOnlyLetter.includes(a.letter) &&
      !!filteredAlternativesOnlyLetter.push(a.letter)
  ).length === 4;

const getAlternativesWithUpperCaseLetter = (alternatives) =>
  alternatives.map((alternative) => ({
    ...alternative,
    letter: alternative.letter.toUpperCase(),
  }));

const verifyAlternatives = (req, resp, next) => {
  const { alternatives } = req.body;
  const hasFourAlternatives = checkIfHasFourAlternatives(alternatives);
  const errorMessage = "No surveys available";
  if (!hasFourAlternatives) return errorResponse(resp, 400, errorMessage);
  req.body.alternatives = getAlternativesWithUpperCaseLetter(alternatives);
  next();
};

module.exports = { verifyAlternatives };
