#!/usr/bin/env node
/* ==========================================================================
 *  Wander static server
 *
 *  Serves wander.html and the self-hosted assets under lib/ (the three.js
 *  runtime and the .glb models). Zero dependencies, nothing to install.
 *
 *  Run it:   node server.js            (http://localhost:7777)
 *            PORT=9000 node server.js  (or pick your own port)
 * ====================================================================== */
"use strict";
var http = require("http");
var fs   = require("fs");
var path = require("path");

var PORT = parseInt(process.env.PORT, 10) || 7777;
var HTML = path.join(__dirname, "wander.html");
var LIB  = path.join(__dirname, "lib");

var server = http.createServer(function(req, res){
  var u = require("url").parse(req.url, true);
  if (req.method !== "GET" && req.method !== "HEAD"){ res.writeHead(405); return res.end("method not allowed"); }

  // --- the page ---
  if (u.pathname === "/" || u.pathname === "/wander.html"){
    return fs.readFile(HTML, function(err, buf){
      if (err){ res.writeHead(404); return res.end("wander.html not found beside server.js"); }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, must-revalidate" });   // always serve the freshest build
      res.end(buf);
    });
  }

  // --- the self-hosted three.js libraries and .glb models under /lib/ ---
  if (u.pathname.indexOf("/lib/") === 0){
    var rel = path.normalize(u.pathname).replace(/^([/\\]|\.\.)+/, "");   // strip leading slash, block ../ escapes
    var file = path.join(__dirname, rel);
    if (file.indexOf(LIB) !== 0){ res.writeHead(403); return res.end("forbidden"); }
    return fs.readFile(file, function(err, buf){
      if (err){ res.writeHead(404); return res.end("not found"); }
      var ext = path.extname(file).toLowerCase();
      var ct = ext === ".glb" ? "model/gltf-binary"
             : ext === ".js"  ? "application/javascript; charset=utf-8"
             : "application/octet-stream";
      res.writeHead(200, { "Content-Type": ct, "Cache-Control": "max-age=3600" });
      res.end(buf);
    });
  }

  res.writeHead(404); res.end("not found");
});

server.listen(PORT, function(){
  console.log("Wander running at http://localhost:" + PORT);
});
