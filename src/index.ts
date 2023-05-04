import express from 'express';
import initDatabase from './db';
import cors from 'cors';
import setupPlayerRoutes from './routes/playerRoutes';
import logger from './logger';
import setupTeamRoutes from './routes/teamRoutes';
import setupTeamMembershipRoutes from './routes/teamMembershipRoutes';
import setupGameRoutes from './routes/gameRoutes';
import setupAttendanceRoutes from './routes/attendanceRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors);

(async () => {
  const db = await initDatabase();

  app.use('/api', setupPlayerRoutes(db));
  app.use('/api', setupTeamRoutes(db));
  app.use('/api', setupTeamMembershipRoutes(db));
  app.use('/api', setupGameRoutes(db));
  app.use('/api', setupAttendanceRoutes(db));

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})();

export default app;
