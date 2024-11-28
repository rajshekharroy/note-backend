import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();
const port = process.env.PORT || 3001;

connectDB()
  .then(() =>
    app.listen(port, () => {
      console.log("App is listening on ", port);
    })
  )
  .catch((err) => console.log("Mongodb not connected", err));
