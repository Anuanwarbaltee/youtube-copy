import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app = express();

app.use(cors({origin:`${process.env.COR_ORIGIN}`,credentials:true}));
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(express.static("public"))
app.use(cookieParser())

// Import routers
import userRouter from './routes/user.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
import videoRouter from './routes/video.route.js'
import playlistRouter from './routes/playlist.routes.js'
import commentRouter from './routes/comment.route.js'
import likeRouter from './routes/likes.route.js'

// route Decleration
app.use('/api/v1/user', userRouter)
app.use('/api/v1/subscriptions', subscriptionRouter)
app.use('/api/v1/video', videoRouter)
app.use('/api/v1/playlist', playlistRouter)
app.use('/api/v1/comment', commentRouter)
app.use('/api/v1/like', likeRouter)

export {app}