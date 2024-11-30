import dotenv from "dotenv";
import conectionDB from "./db/index.js";

dotenv.config({ path: './.env' }); 



conectionDB();

