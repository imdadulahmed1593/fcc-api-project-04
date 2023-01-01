const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const MONGO_URL = process.env.MONGO_URL;

const options = {
  dbName: "exerciseTracker",
};
mongoose.connect(MONGO_URL, options);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  log: [
    {
      date: String,
      duration: Number,
      description: String,
    },
  ],
  count: Number,
});

const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app
  .route("/api/users")
  .post((req, res) => {
    const username = req.body.username;
    const user = new User({ username, count: 0 });
    user.save((err, data) => {
      if (err) {
        res.json({ error: err });
      }
      res.json(data);
    });
  })
  .get((req, res) => {
    User.find((err, data) => {
      if (data) {
        res.json(data);
      }
    });
  });

app.post("/api/users/:_id/exercises", (req, res) => {
  const { description } = req.body;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? req.body.date : new Date().toDateString();
  // ? "Mon Jan 01 1990" : "Thu Nov 04 2021";
  const id = req.params._id;

  const exercise = {
    description,
    duration,
    date,
  };

  User.findByIdAndUpdate(
    id,
    {
      $push: { log: exercise },
      $inc: { count: 1 },
    },
    { new: true },
    (err, user) => {
      if (user) {
        const updatedExercise = {
          username: user.username,
          ...exercise,
          _id: id,
        };
        res.json(updatedExercise);
      }
    }
  );
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { from, to, limit } = req.query;

  User.findById(req.params._id, (err, user) => {
    if (user) {
      if (from || to || limit) {
        const logs = user.log;
        const filteredLogs = logs.map((log) => {
          const formattedDate = new Date(log.date).toISOString().split("T")[0];
          return { ...logs, date: parseInt(formattedDate) };
        });
        const slicedLogs = limit ? filteredLogs.slice(0, limit) : filteredLogs;
        user.log = slicedLogs;
      }
      res.json(user);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
// const mySecret = process.env['MONGO_URL']
