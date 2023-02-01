const { errorResponse } = require("../helpers");

const isValidPlanning = (planning) =>
  !!planning && typeof planning === "object" && !!Object.keys(planning).length;

const getInitialPlanning = ({
  topic,
  materials,
  startActivity,
  mainActivity,
  endActivity,
}) =>
  (!!topic &&
    typeof topic === "string" &&
    !!topic.trim().length &&
    !!materials &&
    typeof materials === "object" &&
    !!Object.keys(materials).length &&
    !!materials.teacher &&
    Array.isArray(materials.teacher) &&
    !!materials.teacher.length &&
    materials.teacher.some(
      (t) => !!t && typeof t === "string" && !!t.trim().length
    ) &&
    !!materials.student &&
    Array.isArray(materials.student) &&
    !!materials.student.length &&
    materials.student.some(
      (s) => !!s && typeof s === "string" && !!s.trim().length
    ) &&
    !!startActivity &&
    typeof startActivity === "string" &&
    !!startActivity.trim().length &&
    !!mainActivity &&
    typeof mainActivity === "string" &&
    !!mainActivity.trim().length &&
    !!endActivity &&
    typeof endActivity === "string" &&
    !!endActivity.trim().length && {
      topic,
      materials,
      startActivity,
      mainActivity,
      endActivity,
    }) ||
  null;

const setPlanningData = async (req, resp, next) => {
  const { planning } = req.body;
  const validPlanning = isValidPlanning(planning);
  const initialPlanning = getInitialPlanning(planning);
  const hasPlanning = validPlanning && !!initialPlanning;
  const noPlanningMessage = "No planning available";
  if (!hasPlanning) return errorResponse(resp, 400, noPlanningMessage);
  req.body.planning = initialPlanning;
  next();
};

module.exports = { setPlanningData };
