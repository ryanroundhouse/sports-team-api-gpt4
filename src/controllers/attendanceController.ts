import { Request, Response } from 'express'
import { Database } from 'sqlite'
import {
  createAttendance,
  getAttendanceById,
  getAllAttendances,
  updateAttendance,
  deleteAttendance,
} from '../dataAccess/attendanceData'
import { getGameById } from '../dataAccess/gameData'
import { getTeamMembershipByPlayerIdAndTeam } from '../dataAccess/teamMembershipData'

const attendanceController = {
  async create(req: Request, res: Response, db: Database) {
    const { playerId, gameId, status } = req.body
    const userId = req.userId

    try {
      const game = await getGameById(db, gameId)

      if (!game) {
        return res.status(404).send({ message: 'Game not found.' })
      }

      const membership = await getTeamMembershipByPlayerIdAndTeam(
        db,
        userId,
        game.team_id,
      )

      if (!membership) {
        return res.status(403).send({
          message:
            'You must be a member of the team associated with the game to create an attendance.',
        })
      }

      const newAttendance = await createAttendance(db, {
        playerId,
        gameId,
        status,
        id: 0, // this will be overwritten
      })
      res.status(201).send(newAttendance)
    } catch (error) {
      console.log(error)
      res
        .status(500)
        .send({ message: 'An error occurred while creating the attendance.' })
    }
  },

  async readMany(req: Request, res: Response, db: Database) {
    try {
      const attendances = await getAllAttendances(db)
      res.status(200).send(attendances)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching attendances.' })
    }
  },

  async readOne(req: Request, res: Response, db: Database) {
    const { id } = req.params

    try {
      const attendance = await getAttendanceById(db, Number(id))

      if (!attendance) {
        return res.status(404).send({ message: 'Attendance not found.' })
      }

      res.status(200).send(attendance)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching the attendance.' })
    }
  },

  async update(req: Request, res: Response, db: Database) {
    const { id } = req.params
    const { playerId, gameId, status } = req.body
    const userId = req.userId

    try {
      const attendance = await getAttendanceById(db, Number(id))

      if (!attendance) {
        return res.status(404).send({ message: 'Attendance not found.' })
      }

      const game = await getGameById(db, gameId)

      if (!game) {
        return res.status(404).send({ message: 'Game not found.' })
      }

      const membership = await getTeamMembershipByPlayerIdAndTeam(
        db,
        userId,
        gameId,
      )

      if (!membership) {
        return res.status(403).send({
          message:
            'You must be a member of the team associated with the game to update an attendance.',
        })
      }

      const updatedAttendance = await updateAttendance(db, Number(id), {
        playerId,
        gameId,
        status,
        id: 0, // this will be overwritten
      })
      res.status(200).send(updatedAttendance)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while updating the attendance.' })
    }
  },

  async delete(req: Request, res: Response, db: Database) {
    const { id } = req.params
    const userId = req.userId

    try {
      const attendance = await getAttendanceById(db, Number(id))

      if (!attendance) {
        return res.status(404).send({ message: 'Attendance not found.' })
      }

      const game = await getGameById(db, attendance.game_id)

      if (!game) {
        return res.status(404).send({ message: 'Game not found.' })
      }

      const membership = await getTeamMembershipByPlayerIdAndTeam(
        db,
        userId,
        game.team_id,
      )

      if (!membership) {
        return res.status(403).send({
          message:
            'You must be a member of the team associated with the game to delete an attendance.',
        })
      }

      const deletedAttendance = await deleteAttendance(db, Number(id))
      res.status(200).send(deletedAttendance)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while deleting the attendance.' })
    }
  },
}

export default attendanceController
