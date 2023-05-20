import express from "express";
import attendanceController from "../controllers/attendanceController";
import { authenticate } from "../auth";
import { Database } from "sqlite";
import logger from "../logger";

const router = express.Router();

const setupAttendanceRoutes = (db: Database) => {
  router.post("/attendance", authenticate, (req, res) => {
    logger.info("POST /attendance");
    attendanceController.create(req, res, db);
  });

  router.get("/attendance", authenticate, (req, res) => {
    logger.info("GET /attendance");
    attendanceController.readMany(req, res, db);
  });

  router.get("/attendance/:id", authenticate, (req, res) => {
    logger.info(`GET /attendance/:id`);
    attendanceController.readOne(req, res, db);
  });

  router.put("/attendance/:id", authenticate, (req, res) => {
    logger.info(`PUT /attendance/:id`);
    attendanceController.update(req, res, db);
  });

  router.delete("/attendance/:id", authenticate, (req, res) => {
    logger.info(`DELETE /attendance/:id`);
    attendanceController.delete(req, res, db);
  });

  return router;
};

export default setupAttendanceRoutes;
