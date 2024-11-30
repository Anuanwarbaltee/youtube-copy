import mongoose from "mongoose"
import {DB_Name} from "../constant.js"

const conectionDB = async () =>{
    try {
       let conectionSting = await mongoose.connect(`${process.env.DB_URL}/${DB_Name}`)
       console.log(conectionSting.connection.host)
        
    } catch (error) {
        console.log("DataBase connection Faild ", error)
       process.exit(1)

        
    }
}

export default conectionDB