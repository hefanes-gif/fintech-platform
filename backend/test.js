const express = require("express");
const app = express();

app.get("/api", (req, res) => {
  res.json({ ok: true, message: "CLEAN SERVER WORKING" });
});

const PORT = 3001;

app.listen(PORT, "127.0.0.1", () => {
  console.log("CLEAN SERVER RUNNING ON", PORT);
});