import { Request, Response } from 'express'
import { Database } from 'sqlite'
import {
  createTeamMembership,
  deleteTeamMembershipsByTeam,
  isUserCaptainOfTeam,
} from '../dataAccess/teamMembershipData'
import {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} from '../dataAccess/teamData'

const teamController = {
  async create(req: Request, res: Response, db: Database) {
    const { name } = req.body
    const userId = req.userId

    try {
      const newTeamId = await createTeam(db, name)

      const newTeam = await getTeamById(db, newTeamId)

      const newMembership = await createTeamMembership(
        db,
        newTeamId,
        userId,
        true,
      )

      res.status(201).send(newTeam)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while creating the team.' })
    }
  },

  async readMany(req: Request, res: Response, db: Database) {
    try {
      const teams = await getTeams(db)
      res.status(200).send(teams)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching teams.' })
    }
  },

  async readOne(req: Request, res: Response, db: Database) {
    const { id } = req.params

    try {
      const team = await getTeamById(db, Number(id))

      if (!team) {
        return res.status(404).send({ message: 'Team not found.' })
      }

      res.status(200).send(team)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while fetching the team.' })
    }
  },

  async update(req: Request, res: Response, db: Database) {
    const { id } = req.params
    const { name } = req.body
    const userId = req.userId

    try {
      const isCaptain = await isUserCaptainOfTeam(db, userId, Number(id))

      if (!isCaptain) {
        return res
          .status(403)
          .send({ message: 'Only the team captain can update the team.' })
      }

      await updateTeam(db, Number(id), name)

      const updatedTeam = await getTeamById(db, Number(id))

      if (!updatedTeam) {
        return res.status(404).send({ message: 'Team not found.' })
      }

      res.status(200).send(updatedTeam)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while updating the team.' })
    }
  },

  async delete(req: Request, res: Response, db: Database) {
    const { id } = req.params
    const userId = req.userId

    try {
      const deletedTeam = await getTeamById(db, Number(id))

      if (!deletedTeam) {
        return res.status(404).send({ message: 'Team not found.' })
      }

      const isCaptainOfTeam = await isUserCaptainOfTeam(
        db,
        userId,
        deletedTeam.id,
      )

      if (!isCaptainOfTeam) {
        return res.status(403).send({
          message: 'Only the team captain can delete the team.',
        })
      }

      // Delete team memberships associated with the team
      await deleteTeamMembershipsByTeam(db, parseInt(id))

      // Delete the team
      await deleteTeam(db, parseInt(id))

      res.status(200).send(deletedTeam)
    } catch (error) {
      res
        .status(500)
        .send({ message: 'An error occurred while deleting the team.' })
    }
  },
}

export default teamController
