import db from "./database-config";

const connectDB = () => {
  db.sync({ alter: true })
    .then(() => {
      console.log("Database Connected");
    })
    .catch((err) => console.log(`Database Error: ${err}`));
};

export default connectDB;