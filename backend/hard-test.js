const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, msg: "RAW NODE WORKING" }));
});

server.listen(3001, "127.0.0.1", () => {
  console.log("RAW NODE LISTENING ON 3001");
});