import express from 'express';
import config from './config';

const app = express();
const port = config.port;
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running...',
    });
});
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is healthy',
    });
});

app.listen(port, () => {
    console.log('Server is running on port: ', port);
});
