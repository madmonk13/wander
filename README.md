# Wander

*A world of your own.*

A first-person walking simulator in a single HTML file. An endless, seeded
landscape with weather, a day/night cycle, wildlife and no objective whatsoever.

Open `wander.html` in a browser. That's the whole installation.

---

## Contents

- [Running it](#running-it)
- [Controls](#controls)
- [Settings](#settings)
- [Worlds and seeds](#worlds-and-seeds)
- [What's in the world](#whats-in-the-world)
- [How it works](#how-it-works)
- [Tuning](#tuning)
- [Known limits](#known-limits)
- [Future forks](#future-forks)

---

## Running it

Double-click the file, or drag it into a browser window. It needs WebGL and an
internet connection on first load — three.js (r128) is pulled from a CDN. There
is no build step, no bundler, no dependencies to install, and nothing to
configure.

It works from `file://`. A couple of browser features degrade gracefully there
(see [Known limits](#known-limits)) but nothing breaks.

---

## Controls

**Desktop**

| | |
|---|---|
| `W` `A` `S` `D` | Walk |
| Mouse | Look around |
| `Shift` | Sprint |
| `Space` | Jump |
| `T` | Skip ahead two hours |
| `R` | Change the weather |
| `L` | Point me at the nearest landmark |
| `C` | Toggle the compass |
| `B` | Build — click to place, right-click to remove |
| `M` | Mute / unmute |
| `Esc` | Settings, and release the cursor |

**Touch** — detected automatically; the start screen shows the right set.

| | |
|---|---|
| Left half | Press and drag to walk. Partial deflection walks slowly. |
| Right half | Drag to look around |
| Stick to the rim | Breaks into a run — no separate sprint button |
| Jump button | Lower right |
| Fly button | Beside it. While flying, hold Jump to climb, ▼ to descend |
| ☰ | Settings, upper right |

---

## Settings

Reachable from the start screen, or `Esc` / ☰ once you're walking.

### Quality

Four tiers. They change **how complex things are, never where they are** — the
same seed puts the same tree on the same spot at every tier.

| | Low | Medium | High | Ultra |
|---|---|---|---|---|
| Shading | flat | flat | flat | **smooth** |
| Branches per tree | ×0.5 | ×1.0 | ×1.6 | ×2.2 |
| Grass tufts / chunk | 800 | 2200 | 3600 | 5200 |
| Terrain shader | 2-octave, no grit | 4-octave + grit | 5-octave, warped grit, rock bedding | 6-octave, cross-faded materials |
| Shadow map | 1024 | 2048 | 4096 | 4096 |
| Pixel ratio | 1.0 | 1.75 | 2.0 | 2.0 |
| Foliage / boulders | 20 tris | 20 | 20 | **80** |
| Terrain grid | 30 | 30 | 30 | **44** |

**Ultra** is the one that changes the look rather than just the density. Flat
shading — every triangle lit as a single flat plane — is what actually makes
the world read as faceted. Ultra supplies real vertex normals so the same
geometry shades as a curved surface, subdivides the round primitives, and
cross-fades materials so grass creeps into rock instead of switching abruptly.

Ultra is also the only tier that alters the ground surface: a finer grid follows
the height field more closely (mean error 0.039m → 0.020m). Objects keep their
x/z position exactly, but re-seat vertically by that much.

Touch devices default to **Low**, desktop to **Medium**. Your choice is
remembered between visits.

### Day length

5 to 60 minutes, in whole minutes, default 10. **Use current time** instead
drives the sun from your system clock, so the game reads the real time of day.
Pressing `T` to skip ahead turns that off rather than silently doing nothing.

### World seed

Any number. **New** rolls a fresh one and regenerates around you without a
reload.

---

## Worlds and seeds

The entire world is a pure function of one number. Terrain, rivers, which
species of tree grows where, where every rock sits — all of it derives from the
seed. Same seed, same world, down to the last boulder.

**The URL is the save file.** It looks like:

```
wander.html#3397752734,-793.7,-552.9,1.234,-0.321,m
             │          │      │      │      │     └── quality tier
             │          │      │      │      └──────── pitch
             │          │      │      └─────────────── yaw
             │          └──────┴────────────────────── x, z position
             └─────────────────────────────────────── seed
```

Bookmark it to come back to exactly where you were standing, facing the way you
were facing. Send it to someone and they get the same world and the same spot.

Position is saved when you leave the page and checkpointed every few seconds
while you walk, so a crashed tab doesn't lose your place.

---

## What's in the world

**Scale.** You stand 0.69m to the eye — about two and a half times smaller than
a person. Terrain and trees are *not* scaled, and that gap is the whole point:
peaks reach 145m, which is over 200× your eye height and reads like a 360m
mountain. The fog horizon at 640m reads like 1.6km.

**Terrain.** Continents from fractal noise, ridged multifractal mountains up to
~150m, and rivers carved along an isoline of a slow noise field. Rivers run
downhill and fade out as terrain climbs, so they don't run up mountainsides.

**Trees.** Five species — spruce, pine, oak, birch, and dead snags — chosen by
altitude and a regional noise field, so stands come out mixed but locally
dominated the way real forests are. They run 3m to 27m, which at your size is
4× to 39× eye height, reading as roughly 7m to 67m. Sizes follow a power law:
mostly saplings, the occasional giant. Trees won't grow inside each other's
canopies.

**Weather** drifts on its own between clear, overcast and rain, thickening the
fog, quieting the birds and roughening the water as it goes. Heavy rain brings
lightning, with thunder arriving late in proportion to how far away the strike
was — distant flashes rumble ten seconds later, close ones crack almost at once.
Rain dimples the water with scattered impacts and soaks the ground, pooling in
hollows and taking several minutes to dry out afterwards.

**The water reacts.** Wading through the shallows pushes a ring out with every
footfall, and a duck breaking cover leaves a bigger one behind. Rings spread at
about 2.6 m/s and fade as they go.

There is no snowline. These peaks top out near 150m, which is a large hill
rather than a mountain, so high ground goes to bare rock and scree.

**Landmarks** — cairns (piles of stone) and pylons: tapered four-sided obelisks
with a dark doorway on one face, standing 9–13m at your scale. Everything else
out there is organic and irregular, so the flat faces and hard edges of a pylon
read unmistakably as *placed* rather than grown. They appear about once every
twenty-five chunks on level ground. Endless terrain otherwise has no
punctuation, nowhere more worth reaching than anywhere else.

A compass strip across the top marks the nearest one, with its distance, and
clamps to the edge with a chevron when it's behind you. `L` reads out the
bearing as text, `C` hides the compass if you'd rather just wander. Landmarks
are typically only ~300m away — the hard part was never the distance, it was
knowing which way to walk.

**The night sky** has a Milky Way (a second star population crowded around one
great circle, roughly 2.3× the density of the rest of the sky) and a moon on its
own orbit, drifting a full lunar month against the sun so the phase cycles
through new and full over about thirty in-game days.

**Building.** Press `B` and a palette of ten colours appears across the bottom
of the screen. Click to place a block, right-click or `X` to delete the one
you're aiming at, and the number row (`1`–`0`) or the mouse wheel to pick a
colour. Blocks snap to a world-aligned grid at half a metre each; the first one
in a column rests on the terrain so a build starts grown into the ground rather
than floating, and you extend from there by aiming at a block's face. (`X`
deletes as well as right-click, because a trackpad's right-click doesn't always
reach a pointer-locked browser.)

The important part is what building *doesn't* touch. The seeded world stays a
pure function of its seed — same hills, same rivers, same forests, forever. Your
blocks are a separate sparse layer on top of it: stored per seed in this browser,
so each world keeps its own, and consulted whenever a chunk streams in so they
survive you walking away. Export writes a small JSON file you can share or back
up; importing it carries its own seed, so it drops your build onto exactly the
terrain it was made against. A bare seed link still hands someone the pristine
world; the file hands them your version of it.

The world is solid now — trees, boulders and your own blocks all stop you, and
you can stand on blocks and clamber onto boulders. Movement stays forgiving:
anything up to one block tall is stepped over rather than walled against, so a
stacked staircase walks naturally, but a wall of the same blocks stops you.
(Flight, the undocumented survey mode, still passes through everything.)

**Wildlife**, all in fixed-size pools that recycle around you so cost stays
constant however far you walk:

| | count | |
|---|---|---|
| Rabbits | 12 | four coats; bolt if you get within 8.5m |
| Fish | 12 | only where the water is deep enough |
| Butterflies | 22 | out in sun, gone in rain |
| Fireflies | 64 | after dark, over low damp ground |
| Ducks | 8 | ride the actual wave surface; flush if you wade close |
| Ground birds | 6 | forage in the grass, burst upward when startled |
| Raptors | 3 | circle on thermals overhead |
| Flock | 22 | wheels and banks together at middle distance |

**Birdsong** follows the time of day — a dawn chorus around 45 calls a minute,
tapering to 8 at midday, picking up again at dusk, and just the occasional owl
at night, or frogs if there's water within earshot. Rain quiets them.

**Ambient sound** responds to where you're standing: water laps when there's a
shore nearby, crickets come out after dark, and the wind hisses through tree
cover but moans across open ground. All of it is synthesised — there isn't a
single audio file.

---

## How it works

Everything is one file, organised in numbered sections you can search for:

| | |
|---|---|
| 1. Noise & terrain | the height field; everything else follows from this |
| 2. Renderer & colour pipeline | linear lighting, ACES tone mapping |
| 3. Sky | gradient dome, clouds, stars, sun and moon |
| 4. Water | wave shader, shallow-water damping |
| 5. Rain | GPU-animated streaks |
| 6. Palette | every colour in the world |
| 7. Materials | terrain shading, wind sway injection |
| 8. Prop stamping | geometry helpers |
| 8b. Trees | the five species |
| 8c. Landmarks | cairns and pylons |
| 9. Chunks | streaming, grass, flowers |
| 9b. World edits | player-placed blocks, storage, sharing |
| 10. Audio | wind, footsteps, birdsong |
| 11. Weather | the drifting state machine |
| 12. Player | movement, mouse and touch input |
| 13. Day / night | sun position, sky colour |
| 13b. Wildlife | insects, rabbits, fish |
| 13c. Birds | the shared flight system |
| 14. Loop | the frame |
| 15. World seed | save, restore, regenerate |

A few decisions worth knowing about if you're reading the code:

**The terrain stores almost nothing.** Below Ultra each vertex carries a
position and a single ambient-occlusion float — 16 bytes. No normal (flat
shading derives it from world-position derivatives) and no colour (the shader
evaluates it from height and slope). That's most of why a world this dense fits
in ~44MB of vertex data.

**`groundY()` is not `height()`.** The terrain renders as flat triangles between
grid points 4.3m apart, and on curved ground the true height field departs from
that polygon by up to 2.5m. Anything that sits on the ground uses `groundY()`,
which interpolates across the actual triangle. Using `height()` is what made
grass float in mid-air.

**Every object has its own random stream.** Trees draw from an RNG keyed to
their own position, not the chunk's. If they shared one, changing branch count
would shift the stream for every later tree and rearrange the whole forest —
which is why quality tiers used to move things about.

**Trunks are continuous tubes.** Built as separate segments they split open on
the outside of every bend, because each segment ends in a flat cross-section
square to its own axis and their rings don't line up. Interior rings now sit on
the bisector, and the frame is carried along by parallel transport.

**Sampling grids are pinned to the world, not to you.** The water mesh and the
shallow-water depth texture both follow the player, and both used to slide
continuously — so the wave surface they interpolate kept changing under a fixed
patch of water, and the depth texture's lattice shifted every time it rebuilt.
At a shoreline that shows up as an edge that will not sit still. Both now snap
to their own spacing, which makes a rebuild sample exactly the same world points
as before: measured surface wobble went from 0.05mm to zero.

**The near plane is a shoreline problem.** Water and terrain are exactly
coincident along every waterline, so depth-buffer precision decides which one
you see, pixel by pixel. Scaling the near plane down with the player took it to
0.04m, which is 61cm of depth ambiguity at the fog horizon — the two surfaces
trade places and the edge crawls. It sits at 0.12m now (20cm at the horizon,
still only 17% of a body length so nothing you can approach gets clipped), with
a small polygon offset on the water to settle the remaining ties in the
terrain's favour.

**The shoreline is soft, on purpose.** Where water meets land two coarse meshes
interpenetrate, and that intersection is a hard aliased edge no matter how much
depth precision you spend on it — the pixels themselves are what's stepping,
which is why it looks worse the further away you are. So the water fades out as
it shallows instead: a median 3.8m band, reading as about 9m of shallows at your
scale. Shallow water genuinely is more transparent, so it removes the artefact
and reads correctly at the same time.

**Water knows how deep it is.** The terrain hash uses integer bit operations,
which GLSL ES 1.0 doesn't have, so `height()` can't be ported into the shader.
Instead the CPU bakes a coarse depth field into a 64×64 texture that follows you
in 20m steps. Shallow water goes still; deep water keeps its swell.

**Wet ground is free.** Rain pools where terrain is concave — which the ambient
occlusion term already in the vertex buffer describes exactly, since hollows are
what darkens it. So puddles cost one `smoothstep` and reuse a byte that was
already being paid for.

**Shadow settings are derived, not fixed.** Two problems sat in `configureShadow`.
The `normalBias` keeps a surface from shadowing itself, but it's a world distance
— too small and slopes wrongly self-shadow into a large dark patch (acne), too
large and the shadow detaches from the base of what casts it (peter-panning).
The sweet spot is ~1.5 shadow-map texels, and a texel is `2·frustum/mapSize`,
which changes with quality; a single fixed value was 1.5 texels on Low but 14 on
High. And the shadow camera's near/far planes were 1 and 780 — the light sits
320m away with nothing near it, so most of that linear (orthographic) depth
range was wasted, tightening the tolerance a working bias had to hit. Both are
now computed from the frustum at every tier: normalBias at 1.5 texels, near/far
hugging the scene at `320 ± (1.5·half + 60)`.

**Collision is proxies, not the meshes.** Trees and rocks are stamped into a
single chunk mesh with no per-object shape to test against, so each records a
cheap proxy as it's built — a vertical cylinder for a trunk, a shorter one for a
boulder — into the chunk's data. The character controller pushes the player's
cylinder out of those and out of block boxes, and a separate query raises the
player onto whatever block or boulder is under their feet. The subtlety that
took a fix: a block only counts as a step if it's a genuine top surface (nothing
stacked on it), otherwise the step-up that lets you mount a single block would
let you climb a vertical wall one block at a time.

**Blocks are textured without a texture.** Like everything else here, the block
surface is procedural — no image files. Its material injects three effects from
world position: a fine grain across each face, a darkening toward the seams
between blocks so a wall reads as stacked units rather than one flat slab, and a
faint per-block tint so no two are identical. The face is found from the
world-position derivative, so the grain always runs in the plane you're looking
at.

**Edits are a layer, not a rewrite.** Player-placed blocks live in a sparse store
bucketed by chunk, keyed by integer lattice coordinates — three small ints and a
colour, exact to store and immune to the float drift that afflicts far-flung
positions. The seeded terrain is never modified; a chunk just consults the store
when it builds and adds a block mesh, and the store persists to `localStorage`
per seed independently of the world it decorates. Rendering culls the face
between any two adjacent blocks, so a solid wall costs only its outer shell (a
4×4×4 cube renders 192 triangles, not 768). Placing a block on a chunk border
rebuilds the neighbour chunk too, since a new block can hide a face next door.

**Props are built atomically.** Chunk geometry is assembled in a fixed scratch
buffer, and a tree that ran out of room part-way through used to be left
half-built — trunk written, canopy discarded — which renders as a bare tapering
spike. That reads as something deliberate rather than as a bug, so it went
unnoticed for a while. Each tree, rock and landmark now records its start
position and rolls the whole thing back if the buffer fills, so you get the
object or you get nothing. The buffer is sized from measurement: the worst
single chunk out of 220 sampled needs 97.5k vertices at Ultra, and the cap is
160k.

**Thunder is queued, not fired.** Each strike schedules its clap for when the
sound would actually arrive. That queue is a list rather than one slot, because
a distant strike can be twelve seconds out — long enough for the next one to
happen first and, with a single slot, erase it.

**Scale is one number, and gravity is part of it.** `SCALE` multiplies
everything creature-sized — you, the wildlife, the grass — while terrain and
trees keep their absolute size. Scaling the player rather than the world leaves
the height function untouched, so old seeds still generate the same place and
coordinates stay small enough that float32 precision is unaffected. Gravity and
jump velocity scale too: left at full strength a small body falls far too fast
for its size, which is exactly what makes miniatures read as miniatures. Scaled
together, a jump covers less ground but takes the same time.

**Rain impacts are hashed, not tiled.** The obvious way to stipple a surface is
`sin(x) * sin(z)`, but that product is separable, so its peaks land on a regular
lattice and the whole thing reads as a shaking grid. Instead each cell of a
notional grid gets one drop, placed at a hashed offset inside the cell and
started at a hashed time, so neither position nor timing lines up with its
neighbours. Measured by directional autocorrelation, that takes the pattern from
0.99 spread across angles down to 0.04 — from strongly grid-aligned to
effectively isotropic.

**Forced weather changes never repeat.** Pressing `R` picks from the states you
are *not* currently in, and moves several times faster than the natural drift.
Picking uniformly at random meant half the presses selected the weather already
in effect and appeared to do nothing at all.

---

## Undocumented

`F` suspends gravity and lets you fly in the direction you're looking — nose
down and hold forward to descend, `Space` up, `Shift` down, `E` to triple the
speed. It uses momentum rather than a fixed speed, so you build to a cruise and
coast to a stop, which makes it as useful for inspecting a treetop as for
crossing a valley. It exists mainly to make the place easy to survey while
working on it, and it isn't listed on the start screen.

---

## Tuning

Most things worth changing are near the top of their section.

| Want to change | Look for |
|---|---|
| Sense of scale | `SCALE` — one number, near the top |
| Terrain shape | `height()` — section 1 |
| River depth and reach | `RIVER_BED`, and the carve block in `height()` |
| How far you can see | `WORLD.radius` (chunks) and `WORLD.fog` — they're coupled |
| Forest density | `WORLD.forest` |
| Wave size and speed | the `WAVES` table — amplitude and speed columns |
| Quality tiers | the `QUALITY` table |
| Any colour | the `C` palette, plus `BARK` / `LEAF` / `FLOWER_COLS` |
| Walking speed | `speed` in the frame loop; `EYE`, `GRAV`, `JUMP` above it |
| Wildlife numbers | the `*_N` constants in sections 13b and 13c |

Draw distance and fog have to move together: fog must be thick enough to hide
the edge of the loaded world, so a longer view needs thinner air, and each tier
is checked to reach at least 93% opacity at its own horizon.

---

## Known limits

**The map never ends, but it does degrade.** Terrain is a pure function of
position, so chunks keep generating forever. Vertex positions are float32
though, so the grid of representable positions coarsens with distance:

| distance | float32 step | |
|---|---|---|
| 84 km | 4 mm | imperceptible |
| 840 km | 3 cm | faint shimmer on surfaces |
| 10,000 km | 0.5 m | visible jitter |

So the practical limit is somewhere past 840km — about 19 hours of continuous
sprinting. The noise itself holds up roughly 40× further than the geometry does;
precision is the binding constraint. Fixing it properly would mean rebasing the
world origin as you travel.

**Settings don't survive a hard-blocked storage API.** Quality is remembered in
`localStorage`, which throws rather than returning null in Safari private mode
and some `file://` contexts. That's caught, and it falls back to the URL and
then to the default.

**Shader injection assumes three.js r128.** The terrain and wind-sway shaders
splice into three's built-in Phong shader by matching chunk names. If you
upgrade three and something moves, you'll get a specific console error naming
the chunk rather than a silently white world.

**Animals stay faceted at Ultra.** Smooth shading covers terrain, trees and
rocks. The rabbits, fish and birds are built once at load and keep flat shading
at every tier.

---

## Future forks

**A full Minecraft-style variant with a Node backend that stores edits.**

The building here is deliberately the smallest thing that works: a sparse
client-side layer, held in `localStorage` per seed, keyed by chunk, shared only
by handing someone a JSON file. A serious sandbox — a persistent, shared,
possibly multiplayer world you dig into and build up over time — is a fork, not
a setting, because it changes where the edits live and who owns them.

The good news is the seam is already clean. Edits are a separate overlay
(section 9b), never mixed into the seeded terrain, and they're already bucketed
by chunk and scoped by seed — which is exactly the shape a server wants. The
work is roughly:

- **Backend.** A small Node service (Express/ws + SQLite or Postgres) storing
  edits keyed by `(worldId, chunkX, chunkZ)` as block deltas. The seed becomes a
  world record rather than a URL fragment.
- **Swap the storage seam.** `loadEdits` / `saveEdits` become network calls
  instead of `localStorage`. Better still, fetch edits *per chunk* as chunks
  stream in (`buildChunkEdits` already runs at exactly that moment in
  `updateChunks`), so the client only ever holds the edits near the player —
  which is what makes an unbounded shared world tractable.
- **Real-time sync.** A websocket per world; a placement broadcasts a delta,
  peers apply it and rebuild the affected chunk (`refreshBlockChunks` is already
  the "one block changed, redraw these chunks" primitive). Last-write-wins on a
  cell is probably fine to start.
- **The rest of the game is already multiplayer-shaped.** Terrain, props and
  collision are pure functions of the seed, so every client derives the same
  world with no traffic; only edits and player positions cross the wire. Avatars
  would reuse the existing critter geometry.

The things that stay hard: auth and grief protection (who may edit which world),
storage growth for a heavily-built world, and the float32 precision ceiling
(~840km) which a shared long-lived world would eventually hit and which wants
the origin-rebasing fix noted above. None of these block a prototype; a
single-world, few-players proof runs on a laptop.

---

## Credits

Built with [three.js](https://threejs.org) r128. Everything else — terrain,
shaders, geometry, audio — is generated at runtime. No textures, no models, no
sound files.
