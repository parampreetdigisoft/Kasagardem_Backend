import express, { Router } from "express";
import auth from "../../core/middleware/authMiddleware";
import { uploadCsv } from "../../core/middleware/uploadCsv";
import { extractUsersFromCsv } from "../../core/middleware/extractUserFromCsv";
import { createProfessionlals, getAllProfessionalProfiles } from "./professionalController";
const router: Router = express.Router();

router.post("/register",auth,   uploadCsv.single("file"), extractUsersFromCsv, createProfessionlals);

router.get("/",   getAllProfessionalProfiles);

export default router;