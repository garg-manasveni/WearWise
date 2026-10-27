const express = require("express");
const {
  deleteSavedOutfit,
  getRecommendations,
  listSavedOutfits,
  saveOutfit,
} = require("../controllers/outfitController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.use(authenticate);
router.post("/recommend", getRecommendations);
router.get("/saved", listSavedOutfits);
router.post("/saved", saveOutfit);
router.delete("/saved/:id", deleteSavedOutfit);

module.exports = router;
