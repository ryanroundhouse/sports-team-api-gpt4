import express from 'express';
import initDatabase from './db';
import cors from 'cors';
import setupPlayerRoutes from './routes/playerRoutes';
import logger from './logger';
import setupTeamRoutes from './routes/teamRoutes';
import setupTeamMembershipRoutes from './routes/teamMembershipRoutes';
import setupGameRoutes from './routes/gameRoutes';
import setupAttendanceRoutes from './routes/attendanceRoutes';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limit middleware configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(express.json());
app.use(cors());
app.use(apiLimiter);

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
