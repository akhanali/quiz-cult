import roomsRouter from './routes/rooms';
import questionsRouter from './routes/questions';
import authRouter from './routes/auth';
 
// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/auth', authRouter); 