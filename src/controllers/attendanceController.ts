import { Request, Response } from "express";
import { Database } from "sqlite";
import {
  createAttendance,
  getAttendanceById,
  getAllAttendances,
  getAttendanceByGameId,
  updateAttendance,
  deleteAttendance,
} from "../dataAccess/attendanceData";
import { getGameById } from "../dataAccess/gameData";
import {
  getTeamMembershipByPlayerIdAndTeam,
  getTeamMembershipsByPlayerId,
} from "../dataAccess/teamMembershipData";

interface Attendance {
  playerId: number;
  gameId: number;
  status: string;
  id: number;
}

const attendanceController = {
  async create(req: Request, res: Response, db: Database): Promise<Response> {
    const { playerId, gameId, status } = req.body;
    const userId = req.userId;

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: "Unauthorized. Login before making this call." });
      }

      const game = await getGameById(db, gameId);

      if (!game) {
        return res.status(404).send({ message: "Game not found." });
      }

      const membership = await getTeamMembershipByPlayerIdAndTeam(
        db,
        userId,
        game.teamId
      );

      if (!membership) {
        return res.status(403).send({
          message:
            "You must be a member of the team associated with the game to create an attendance.",
        });
      }

      const newAttendance = await createAttendance(db, {
        playerId,
        gameId,
        status,
        id: 0, // this will be overwritten
      } as Attendance);
      return res.status(201).send(newAttendance);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send({ message: "An error occurred while creating the attendance." });
    }
  },

  async readMany(req: Request, res: Response, db: Database): Promise<void> {
    try {
      const attendances = await getAllAttendances(db);
      res.status(200).send(attendances);
    } catch (error) {
      res
        .status(500)
        .send({ message: "An error occurred while fetching attendances." });
    }
  },

  async getAttendanceByGameId(
    req: Request,
    res: Response,
    db: Database
  ): Promise<Response> {
    const { id } = req.params;
    const userId = req.userId;
    const isAdmin = req.userRole === "admin";

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: "Unauthorized. Login before making this call." });
      }

      const game = await getGameById(db, parseInt(id));
      if (!game) {
        return res.status(404).send({ message: "Game not found." });
      }

      if (!isAdmin) {
        const memberships = await getTeamMembershipsByPlayerId(db, userId);
        const isTeamMember = memberships.some(
          (membership) => membership.teamId === game.teamId
        );

        if (!isTeamMember) {
          return res
            .status(403)
            .send({ message: "You are not authorized to view this game." });
        }
      }

      // Fetch the attendance records for the provided game
      const attendances = await getAttendanceByGameId(db, Number(id));
      if (!attendances || attendances.length === 0) {
        // If there are no attendance records, return a 404 Not Found response
        return res
          .status(404)
          .send({ message: "No attendances found for this game." });
      }

      // If everything is successful, return the attendance records
      return res.status(200).send(attendances);
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send({ message: "An error occurred while fetching the attendances." });
    }
  },

  async readOne(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;

    try {
      const attendance = await getAttendanceById(db, Number(id));

      if (!attendance) {
        return res.status(404).send({ message: "Attendance not found." });
      }

      return res.status(200).send(attendance);
    } catch (error) {
      return res
        .status(500)
        .send({ message: "An error occurred while fetching the attendance." });
    }
  },

  async update(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;
    const { playerId, gameId, status } = req.body;
    const userId = req.userId;

    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: "Unauthorized. Login before making this call." });
      }
      const attendance = await getAttendanceById(db, Number(id));

      if (!attendance) {
        return res.status(404).send({ message: "Attendance not found." });
      }

      const game = await getGameById(db, gameId);

      if (!game) {
        return res.status(404).send({ message: "Game not found." });
      }

      const membership = await getTeamMembershipByPlayerIdAndTeam(
        db,
        userId,
        gameId
      );

      if (!membership) {
        return res.status(403).send({
          message:
            "You must be a member of the team associated with the game to update an attendance.",
        });
      }

      const updatedAttendance = await updateAttendance(db, Number(id), {
        playerId,
        gameId,
        status,
        id: 0, // this will be overwritten
      } as Attendance);
      return res.status(200).send(updatedAttendance);
    } catch (error) {
      return res
        .status(500)
        .send({ message: "An error occurred while updating the attendance." });
    }
  },

  async delete(req: Request, res: Response, db: Database): Promise<Response> {
    const { id } = req.params;
    const userId = req.userId;
    try {
      if (!userId) {
        return res
          .status(403)
          .send({ message: "Unauthorized. Login before making this call." });
      }
      const attendance = await getAttendanceById(db, Number(id));

      if (!attendance) {
        return res.status(404).send({ message: "Attendance not found." });
      }

      const game = await getGameById(db, attendance.gameId);

      if (!game) {
        return res.status(404).send({ message: "Game not found." });
      }

      const membership = await getTeamMembershipByPlayerIdAndTeam(
        db,
        userId,
        game.teamId
      );

      if (!membership) {
        return res.status(403).send({
          message:
            "You must be a member of the team associated with the game to delete an attendance.",
        });
      }

      const deletedAttendance = await deleteAttendance(db, Number(id));
      return res.status(200).send(deletedAttendance);
    } catch (error) {
      return res
        .status(500)
        .send({ message: "An error occurred while deleting the attendance." });
    }
  },
};

export default attendanceController;
