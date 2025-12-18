import dotenv from "dotenv";
import conectionDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: './.env' }); 

conectionDB().then(()=>{
    app.listen(`${process.env.PORT}`,()=>{
        console.log(`Server is running at port ${process.env.PORT}`)
    })
}).catch((error)=>{
    console.log("Connection Failed ", error)
})

