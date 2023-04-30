import express from 'express'
import attendanceController from '../controllers/attendanceController'
import { authenticate } from '../auth'
import { Database } from 'sqlite'

const router = express.Router()

const setupAttendanceRoutes = (db: Database) => {
  router.post('/attendance', authenticate, (req, res) =>
    attendanceController.create(req, res, db),
  )

  router.get('/attendance', authenticate, (req, res) =>
    attendanceController.readMany(req, res, db),
  )

  router.get('/attendance/:id', authenticate, (req, res) =>
    attendanceController.readOne(req, res, db),
  )

  router.put('/attendance/:id', authenticate, (req, res) =>
    attendanceController.update(req, res, db),
  )

  router.delete('/attendance/:id', authenticate, (req, res) =>
    attendanceController.delete(req, res, db),
  )

  return router
}

export default setupAttendanceRoutes
