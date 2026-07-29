#!/usr/bin/env node
/* ==========================================================================
 *  Wander sync server
 *
 *  A tiny, zero-dependency world-sync backend for Wander. It stores block
 *  edits per world and lets several clients on the same world converge on the
 *  same build. Terrain is NOT stored — that stays a pure function of the seed
 *  on the client — so all this server ever moves is the sparse edit overlay.
 *
 *  Run it:   node server.js            (listens on http://localhost:8787)
 *            PORT=9000 node server.js  (or pick your own port)
 *
 *  State lives in worlds.json beside this file. Nothing else is installed.
 *
 *  Model: last-write-wins per block. Every applied edit gets a monotonic rev;
 *  a per-world change log lets a client ask "what changed since rev N" and
 *  catch up. If it has fallen further behind than the log remembers, the
 *  server tells it to resync from a full snapshot.
 * ====================================================================== */
"use strict";
var http = require("http");
var fs   = require("fs");
var path = require("path");
var crypto = require("crypto");

var PORT    = parseInt(process.env.PORT, 10) || 8787;
var DATA    = path.join(__dirname, "worlds.json");
var HTML    = path.join(__dirname, "wander.html");
var LOG_MAX = 20000;            // per-world change-log cap; older revs force a resync

/* ---- persistence: one JSON blob, written atomically and debounced ---- */
var db = loadDB();
function loadDB(){
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
  catch (e){ return { worlds: {} }; }
}
var saveTimer = null;
function saveSoon(){
  if (saveTimer) return;
  saveTimer = setTimeout(function(){
    saveTimer = null;
    try {
      fs.writeFileSync(DATA + ".tmp", JSON.stringify(db));
      fs.renameSync(DATA + ".tmp", DATA);
    } catch (e){ console.error("save failed:", e.message); }
  }, 400);
}

/* ---- world helpers ---- */
function newId(){ return crypto.randomBytes(6).toString("hex"); }
function makeWorld(name, seed){
  var id = newId();
  db.worlds[id] = { id: id, name: String(name || "world").slice(0, 60),
                    seed: (seed >>> 0) || 1, rev: 0, edits: {}, log: [] };
  saveSoon();
  return db.worlds[id];
}
function worldMeta(w){
  return { id: w.id, name: w.name, seed: w.seed, rev: w.rev,
           blocks: Object.keys(w.edits).length };
}
/* edits object -> flat [gx,gy,gz,val, ...] array the client already understands */
function editsArray(w){
  var out = [];
  for (var k in w.edits){
    var p = k.split(","); out.push(+p[0], +p[1], +p[2], w.edits[k]);
  }
  return out;
}
/* apply one batch of ops; each op is [gx,gy,gz,val], val < 0 meaning delete.
   Returns the world's new rev. */
function applyOps(w, ops){
  for (var i = 0; i < ops.length; i++){
    var o = ops[i];
    if (!o || o.length < 4) continue;
    var k = (o[0] | 0) + "," + (o[1] | 0) + "," + (o[2] | 0), v = o[3] | 0;
    if (v < 0) delete w.edits[k]; else w.edits[k] = v;
    w.rev++;
    w.log.push({ rev: w.rev, k: k, v: v });
  }
  if (w.log.length > LOG_MAX) w.log.splice(0, w.log.length - LOG_MAX);
  saveSoon();
  return w.rev;
}
/* changes strictly after `since`. If the log no longer reaches back that far,
   signal a full resync instead. */
function changesSince(w, since){
  if (since >= w.rev) return { rev: w.rev, ops: [] };
  var oldest = w.log.length ? w.log[0].rev : w.rev + 1;
  if (since < oldest - 1) return { resync: true, rev: w.rev, seed: w.seed, edits: editsArray(w) };
  var ops = [];
  for (var i = 0; i < w.log.length; i++){
    var e = w.log[i];
    if (e.rev > since) ops.push([+e.k.split(",")[0], +e.k.split(",")[1], +e.k.split(",")[2], e.v]);
  }
  return { rev: w.rev, ops: ops };
}

/* ---- HTTP plumbing ---- */
function cors(res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
function sendJSON(res, code, obj){
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}
function readBody(req, cb){
  var b = "";
  req.on("data", function(c){ b += c; if (b.length > 8e6) req.destroy(); });
  req.on("end", function(){ try { cb(b ? JSON.parse(b) : {}); } catch (e){ cb(null); } });
}

var server = http.createServer(function(req, res){
  var u = require("url").parse(req.url, true);
  var parts = u.pathname.split("/").filter(Boolean);   // e.g. ["worlds","abc","edits"]

  if (req.method === "OPTIONS"){ cors(res); res.writeHead(204); return res.end(); }

  // --- static: let people also just play at http://localhost:PORT/ ---
  if (req.method === "GET" && (u.pathname === "/" || u.pathname === "/wander.html")){
    return fs.readFile(HTML, function(err, buf){
      if (err){ res.writeHead(404); return res.end("wander.html not found beside server.js"); }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(buf);
    });
  }

  // --- GET /worlds : list ---
  if (req.method === "GET" && parts.length === 1 && parts[0] === "worlds"){
    var list = Object.keys(db.worlds).map(function(id){ return worldMeta(db.worlds[id]); });
    list.sort(function(a, b){ return a.name.localeCompare(b.name); });
    return sendJSON(res, 200, { worlds: list });
  }
  // --- POST /worlds : create ---
  if (req.method === "POST" && parts.length === 1 && parts[0] === "worlds"){
    return readBody(req, function(body){
      if (!body) return sendJSON(res, 400, { error: "bad json" });
      var w = makeWorld(body.name, body.seed);
      sendJSON(res, 200, worldMeta(w));
    });
  }

  // everything below is /worlds/:id[...]
  if (parts[0] === "worlds" && parts[1]){
    var w = db.worlds[parts[1]];
    if (!w) return sendJSON(res, 404, { error: "no such world" });

    // GET /worlds/:id : full snapshot
    if (req.method === "GET" && parts.length === 2)
      return sendJSON(res, 200, { id: w.id, name: w.name, seed: w.seed, rev: w.rev, edits: editsArray(w) });

    // GET /worlds/:id/changes?since=N
    if (req.method === "GET" && parts[2] === "changes")
      return sendJSON(res, 200, changesSince(w, parseInt(u.query.since, 10) || 0));

    // POST /worlds/:id/edits  { ops: [[gx,gy,gz,val],...] }
    if (req.method === "POST" && parts[2] === "edits")
      return readBody(req, function(body){
        if (!body || !Array.isArray(body.ops)) return sendJSON(res, 400, { error: "ops[] required" });
        sendJSON(res, 200, { rev: applyOps(w, body.ops) });
      });

    // PATCH /worlds/:id  { name }
    if (req.method === "PATCH" && parts.length === 2)
      return readBody(req, function(body){
        if (body && body.name){ w.name = String(body.name).slice(0, 60); saveSoon(); }
        sendJSON(res, 200, worldMeta(w));
      });

    // DELETE /worlds/:id
    if (req.method === "DELETE" && parts.length === 2){
      delete db.worlds[parts[1]]; saveSoon();
      return sendJSON(res, 200, { ok: true });
    }
  }

  sendJSON(res, 404, { error: "not found" });
});

server.listen(PORT, function(){
  console.log("Wander sync server on http://localhost:" + PORT);
  console.log("  worlds stored in " + DATA);
});
