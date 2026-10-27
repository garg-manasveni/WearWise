const express = require("express");
const {
  deleteSavedOutfit,
  getRecommendations,
  listSavedOutfits,
  markSavedOutfitWorn,
  saveOutfit,
} = require("../controllers/outfitController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.use(authenticate);
router.post("/recommend", getRecommendations);
router.get("/saved", listSavedOutfits);
router.post("/saved", saveOutfit);
router.post("/saved/:id/worn", markSavedOutfitWorn);
router.delete("/saved/:id", deleteSavedOutfit);

module.exports = router;
