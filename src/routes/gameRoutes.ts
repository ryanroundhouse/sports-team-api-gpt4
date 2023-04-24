import { Router } from 'express'
import { Database } from 'sqlite'
import gameController from '../controllers/gameController'
import { authenticate } from '../auth'

const setupGameRoutes = (db: Database) => {
  const router = Router()

  // Set up routes for gameController
  router.post('/games', authenticate, (req, res) =>
    gameController.create(req, res, db),
  )
  router.get('/games', authenticate, (req, res) =>
    gameController.readMany(req, res, db),
  )
  router.get('/games/:id', authenticate, (req, res) =>
    gameController.readOne(req, res, db),
  )
  router.put('/games/:id', authenticate, (req, res) =>
    gameController.update(req, res, db),
  )
  router.delete('/games/:id', authenticate, (req, res) =>
    gameController.delete(req, res, db),
  )

  return router
}

export default setupGameRoutes
