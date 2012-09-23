var nitroid = new function() {
		var wrapper = null;
		var canvas = null;
		var context = null;
		var tileset = new Image();
		var animation_tiles = new Image();

		/* parameters */
		var platform_height = 12;      /* height between platforms */
		var gravity = 8;               /* player gravity */
		var player_jump = 16;          /* player jumping height per step */
		var player_jump_steps = 15;    /* how many "steps" a jump is (height = steps * jump) */
		var player_jump_threshold = 7; /* at what point the jump is floating in air */
		var player_speed = 5.0;        /* how fast the player moves horizontally */
		var bomb_lifespan = 3.0;       /* how long before a bomb explodes */
		var bomb_blast = 20;           /* blast radius */
		var depth_spawn_resource_factor = 1.0; /* Number to multiply depth with to get spawn resources */1.0; /* Number to multiply depth with to get spawn resources */

		var width = 0;
		var height = 0;
		var horizontal_tiles = 0;
		var vertical_tiles = 0;
		var x_screencenter = 0;
		var y_screencenter = 0;
		var tile_width = 32;
		var tile_height = 32;
		var projectile_spawn_offset = 0.5;
		var pos = 8;
		var depth = 0.0;
		var crouching = false;
		var depth_min = 0.0;
		var depth_scale = 0.4;         /* scaling factor when showing depth on hud */
		var key = [];
		var player_width = 25;
		var player_height = 50;
		var player_width2 = player_width * 0.5;
		var player_height2 = player_height * 0.5;
		var player_offset  = player_width / tile_width * 0.5;

		/* camera */
		var xcam = 0;
		var ycam = 0;

		/* level data */
		var map = [];        /* row, column */
		var map_end = -1;    /* last cached row */
		var map_width = 60;  /* width of the map in tiles, can be overridden by user */

		//var map_begin = -100; /* first row in cache */
		var can_jump = 0;              /* number of "steps" the player may jump */
		var bombs = [];
		var projectiles = [];	/* projectile: pos, velocity, rotation, type, frame */
		var selected_projectile_type = 0;
		var player_horizontal_direction = 1; /* -1 or 1 (left or right)  */


		/* fps control */
		var fps = 30;
		var frame_delay = 1000 / fps;
		var dt = 1.0 / fps;
		var animation_fps = 10;
		var animation_df = dt * animation_fps;

		/* constants */
		var TILE_EMPTY = -1;
		var TILE_PLATFORM = 0;
		var TILE_WALL = 18;
		var TILE_EDGE_RIGHT = 17;
		var TILE_EDGE_LEFT = 16;
		var KEY_UP = 38;
		var KEY_DOWN = 40;
		var KEY_LEFT = 37;
		var KEY_RIGHT = 39;
		var KEY_SPACE = 32;
		var KEY_CTRL = 17;
		var KEY_SHIFT = 16;
		var KEY_DROP = KEY_SHIFT;
		var KEY_JUMP = KEY_SPACE;
		var KEY_FIRE = KEY_CTRL;

		var animations = {
			player_run_aim_forward: {
				tile_start: new vector(0.0, 0.0),
				tile_size: new vector(49, 49),
				frames: 10
			},
			player_run_aim_diagonal_up: {
				tile_start: new vector(0.0, 49.0),
				tile_size: new vector(49, 49),
				frames: 10
			},
			player_run_aim_diagonal_down: {
				tile_start: new vector(0.0, 2*49.0),
				tile_size: new vector(49, 49),
				frames: 10
			},
			player_aim_forward: {
				tile_start: new vector(49*10, 0.0),
				tile_size: new vector(49, 49),
				frames: 1
			},
			player_aim_diagonal_up: {
				tile_start: new vector(49*12, 0.0),
				tile_size: new vector(49, 49),
				frames: 1
			},
			player_aim_diagonal_down: {
				tile_start: new vector(49*11, 0.0),
				tile_size: new vector(49, 49),
				frames: 1
			},
			player_aim_up: {
				tile_start: new vector(49*10, 49.0),
				tile_size: new vector(49, 56),
				frames: 1
			},
			player_aim_down: {
				tile_start: new vector(49*10, 108.0),
				tile_size: new vector(49, 40),
				frames: 1
			},
			player_crouch: {
				tile_start: new vector(49*11, 108.0),
				tile_size: new vector(49, 40),
				frames: 1
			},
			missile: {
				tile_start: new vector(544, 52),
				tile_size: new vector(16, 10),
				frames: 1
			},
			enemy_walker1: {
				tile_start: new vector(552, 70),
				tile_size: new vector(24, 18),
				frames: 6
			}
		};

		var projectile_types = [
			{
				animation: animations.missile,
				damage: 1.0,
				speed: 9.0,
				blast: 20.0
			}
		];

		var enemy_base_run = function(e) {
			e.animation_data.frame += animation_df;
		}

		var enemy_types = [
			{
				/* walker */
				animation: animations.enemy_walker1,
				life: 20,
				spawn_cost: 1,
				spawn_depth: [0.0, 100.0], /* depth range this enemy occur in, set max to -1 to never limit */
				run: function(e) { /* e : enemy instance */
					enemy_base_run(e);
				}
			}
		]

		var enemies = []; /* position, type, life, animation_data */

		var player_animation = {animation: animations.player_aim_forward, frame: 0, facing: 1};

		/* for constant v it returns a deterministic quasi-random number between 0.0 - 1.0 */
		var frand = function(v){
				return Math.sin(v*429384) * Math.cos(v*17493340) * 0.5 + 0.5;
		}

		var wall_width_tunnel = function(y){
				var d = Math.sin(y * 0.05) * Math.atan(y * 0.15 + 7) * 5 + Math.cos(y * 0.5 + 11) * 1.1;
				return Math.ceil(Math.abs(d));
		}

		var wall_width_top = function(y){
				return 0;
		}

		var wall_width = function(y, offset){
				return y >= 0 ? wall_width_tunnel(y+offset) : wall_width_top(y);
		}

		var depth_width = function(y) {
			return wall_width(y, 1337) - wall_width(y, 0);
		}

		var is_row = function(y) {
				return (y > 1 && y % platform_height == 0);
		}

		/**
		 * Tell what tile is at the given coordinate.
		 */
		var tile_at = function(x, y){
				var w1 = wall_width(y, 0);
				var w2 = wall_width(y, 1337);

				var is_wall = x < w1 || x >= (map_width - w2);

				if ( is_wall ){
						return TILE_WALL + Math.floor(frand(y*52 + x*19) * 6);
				}

				if ( is_row (y) ){
						/* Use platform tiles in an incremental way */
						var t = TILE_PLATFORM + (x - w1) % 7;

						/* Locate opening for platform */
						var width = map_width - w1 - w2 - 1;
						var size = Math.ceil(Math.abs(Math.sin(y * 4711)) * 3) + 3;
						var pos = w1 + Math.floor(Math.abs(Math.cos(y * 1234)) * (width-6));
						if ( x > pos && x < pos + size ){
								/* Randomize between destroyable and empty hole */
								return frand(y) > 0.8 ? TILE_EMPTY : (t+8);
						}
						return t;
				}

				return TILE_EMPTY;
		}

		/**
		 * Collision AABB test. Return true if colliding with map.
		 * x and y is in worldspace.
		 */
		var collision_test = function(x, y, w, h){
				for ( var i = 0; i < 2; i++ ){
						for ( var j = 0; j < 2; j++ ){
								var screen_x = x + w*i;
								var screen_y = y + h*j;
								var tile_x = Math.floor(screen_x);
								var tile_y = Math.floor(screen_y);
								if ( tile_x < 0 || tile_y < 0 ) continue;

								if ( map[tile_y][tile_x] != TILE_EMPTY ){
										return true;
								}
						}
				}
				return false;
		}

		/**
		 * Same as collision_test but with offsets and size automatically added.
		 */
		var player_collision_test = function(x, y){
				return collision_test(x - player_width2 / tile_width, y, player_width/tile_width, -player_height/tile_height);
		}

		var update_player_movement = function(){
				if (key[KEY_LEFT] || key[KEY_RIGHT]) {
					if(key[KEY_UP]) {
						player_animation.animation = animations.player_run_aim_diagonal_up;
					} else if(key[KEY_DOWN]) {
						player_animation.animation = animations.player_run_aim_diagonal_down
					} else {
						player_animation.animation = animations.player_run_aim_forward;
					}
					crouching = false;
				} else if(key[KEY_UP]) {
					player_animation.animation = animations.player_aim_up;
					player_animation.frame = 0;
					crouching = false;
				} else if(key[KEY_DOWN]) {
					player_animation.animation = animations.player_aim_down;
					player_animation.frame = 0;

					var touching_floor = player_collision_test(pos, depth);
					if ( player_collision_test(pos, depth) ){
						crouching = true;
					}
				} else if ( crouching ){
					player_animation.animation = animations.player_crouch;
					player_animation.frame = 0;
				} else {
					player_animation.animation = animations.player_aim_forward;
					player_animation.frame = 0;
				}

				if ( !(key[KEY_LEFT] || key[KEY_RIGHT]) ) return;

				var new_pos = pos;
				if ( key[KEY_LEFT]  ) { 
					new_pos -= player_speed * dt;
					player_horizontal_direction = -1;
					player_animation.facing = -1;
					player_animation.frame += animation_df;
				}
				if ( key[KEY_RIGHT] )	{
					new_pos += player_speed * dt;
					player_horizontal_direction = 1;
					player_animation.facing = 1;
					player_animation.frame += animation_df;
				}

				if ( !player_collision_test(new_pos, depth-1e-9) ){
						pos = new_pos;
				}
		}

		var update_player_gravity = function(){
				var new_depth = depth;
				if ( can_jump > 0 && key[KEY_JUMP] ){
						crouching = false;
						if ( can_jump > player_jump_threshold ){
								new_depth = Math.max(depth - player_jump * dt, depth_min);
						}
						can_jump--;
				} else {
						new_depth += gravity * dt;
				}

				if ( !player_collision_test(pos, new_depth) ){
						depth = new_depth;
						if ( !key[KEY_JUMP] ){
								can_jump = 0;
						}
				} else {
						depth = Math.floor(new_depth);
						can_jump = player_jump_steps;
				}
		}

		var update_camera = function(){
				xcam = Math.min(Math.max(pos - x_screencenter, 0), map_width-horizontal_tiles);
		}

		var drop_bomb = function(){
				var touching_floor = player_collision_test(pos, depth);
				if ( !touching_floor || bombs.length >= 3 ) return;

				bombs.push({
						x: pos,
						y: depth,
						lifespan: bomb_lifespan,
				});
		}

		var fire_projectile = function() {
			var p = {
				type: selected_projectile_type,
				pos: new vector(pos, depth - (player_height * (crouching ? 0.3 : 0.6)) / tile_height),
				rotation: player_horizontal_direction == -1 ? Math.PI : 0,
				velocity: new vector(player_horizontal_direction, 0),
				frame: 0,
				explode: 0 /* Not currently exploding */
			};
			if(key[KEY_UP] && key[KEY_LEFT]) {
				p.rotation = Math.PI + Math.PI / 4.0;
				p.velocity = new vector(-1, -1);
			} else if(key[KEY_UP] && key[KEY_RIGHT]) {
				p.rotation = Math.PI + 3.0 *Math.PI / 4.0;
				p.velocity = new vector(1, -1);
			} else if(key[KEY_UP]) {
				p.rotation = Math.PI + Math.PI / 2.0;
				p.velocity = new vector(0, -1);
			} else if(key[KEY_DOWN] && key[KEY_LEFT]) {
				p.rotation = 3.0 * Math.PI / 4.0;
				p.velocity = new vector(-1, 1);
			} else if(key[KEY_DOWN] && key[KEY_RIGHT]) {
				p.rotation = Math.PI / 4.0;
				p.velocity = new vector(1, 1);
			} else if(key[KEY_DOWN]) {
				p.rotation = Math.PI / 2.0;
				p.velocity = new vector(0, 1); 
			}
			p.velocity = p.velocity.normalize();

			p.pos = p.pos.add(p.velocity.multiply(projectile_spawn_offset));
			p.velocity = p.velocity.multiply(projectile_types[p.type].speed);

			projectiles.push(p);

			var hit = collision_test(p.pos.x, p.pos.y, animations.missile.tile_size.x / tile_width, animations.missile.tile_size.y / tile_height);
			if(hit) {
				explode_projectile(i);
			}
		}

		var update_bombs = function(){
				for ( i in bombs ){						
						bombs[i].lifespan -= dt;
						if ( bombs[i].lifespan < 0.0 ){
								sx = Math.ceil(bomb_blast / horizontal_tiles);
								sy = Math.ceil(bomb_blast / vertical_tiles);
								for ( var y = -sy; y < sy; y++ ){
										var py = Math.round(bombs[i].y) + y;
										for ( var x = -sx; x < sx; x++ ){
												var px = Math.round(bombs[i].x) + x;
												if ( px < 0 || py < 0 ) continue;
												var tile = map[py][px];
												if ( tile == -1 ) continue;
												if ( tile >= 8 && tile < 16 ){
														map[py][px] = -1;
												}
										}
								}

								bombs.splice(i, 1);
						}
				}
		}

		var explode_projectile = function(i){
				projectiles[i].explode = 1.2;
				var blast = projectile_types[projectiles[i].type].blast;
				sx = Math.ceil(blast / horizontal_tiles);
				sy = Math.ceil(blast / vertical_tiles);
				for ( var y = -sy; y < sy; y++ ){
						var py = Math.round(projectiles[i].pos.y) + y;
						for ( var x = -sx; x < sx; x++ ){
								var px = Math.round(projectiles[i].pos.x) + x;
								if ( px < 0 || py < 0 ) continue;
								var tile = map[py][px];
								if ( tile == -1 ) continue;
								if ( tile >= 8 && tile < 16 ){
										map[py][px] = -1;
								}
						}
				}
		}

		var update_projectiles = function() {
			for (i in projectiles) {
				var p = projectiles[i];
				if(projectiles[i].explode > 0) {
					projectiles[i].explode -= dt;
					if(projectiles[i].explode < 1.0) {
						//Despawn
						projectiles.splice(i, 1);
					}
				} else {
					p.frame += animation_df;
					p.pos = p.pos.add(p.velocity.multiply(dt));
					var hit = collision_test(p.pos.x, p.pos.y, animations.missile.tile_size.x / tile_width, animations.missile.tile_size.y / tile_height);
					if(hit) {
						explode_projectile(i);
					}
				}
			}
		}

		var update_enemies = function() {
			for(i in enemies) {
				var type = enemy_types[enemies[i].type];
				type.run(enemies[i]);
			}
		}

		var update = function(){
				update_player_movement();
				update_player_gravity();
				update_camera();
				update_bombs();
				update_map();
				update_projectiles();
				update_enemies();
		};

		/**
		 * Recalculates the map cache if necessary.
		 */
		var update_map = function(){
				var d = Math.floor(depth) - y_screencenter;

				if(d + vertical_tiles < map_end) return;

				for ( var y = map_end + 1; y < d + vertical_tiles + 1; y++ ){
						if(y < 0) continue;
						var row = new Array(map_width);

						var spawn_list = [];
						if( is_row(y) ) {
							var spawn_resources = y * depth_spawn_resource_factor;
							console.log("spawn resources: " + spawn_resources);
							var possible_spawns = [];
							for( i in enemy_types) {
								var e = enemy_types[i];
								console.log(e);
								if(e.spawn_cost < spawn_resources && 
									e.spawn_depth[0] <= depth && 
									( e.spawn_depth[1] == -1 || e.spawn_depth[1] >= depth)) {
										possible_spawns.push(e);
								}
							}
							console.log("possible_spawns: " + spawn_resources + ", " + possible_spawns);
							while(spawn_resources > 0 && possible_spawns.length > 0) {
								var s = Math.floor(frand(y) * possible_spawns.length);
								if(possible_spawns[s].spawn_cost < spawn_resources) {
									spawn_resources -= possible_spawns[i].spawn_cost;
									spawn_list.push({
										/* position:  - set later */
										type: s,
										life: possible_spawns[s].life,
										animation_data: {animation: possible_spawns[s].animation, frame: 0, facing: 1}
									});
								} else {
									possible_spawns.splice(s, 1);
								}
							}
							console.log(spawn_list);
						}

						for ( var x = 0; x < map_width; x++ ){
								row[x] = tile_at(x, y);
						}
						if( spawn_list.length > 0 ) {
							console.log("Depth width: " + depth_width(y - 1));
							var spawn_distance = depth_width(y - 1) / spawn_list.length;
							var x = wall_width(y - 1, 0);
							for( i in spawn_list ) {
								var e = spawn_list.pop();
								if(row[x] != TILE_EMPTY) {
									e.position = new vector(x + 0.5, y);
									enemies.push(e);
								}
								x += spawn_distance;
							}
						}

						/* detect edges */
						for ( var x = 1; x < map_width-1; x++ ){
								if ( row[x-1] != TILE_EMPTY && row[x] == TILE_EMPTY ){
										row[x-1] = TILE_EDGE_LEFT;
								}
								if ( row[x+1] != TILE_EMPTY && row[x] == TILE_EMPTY ){
										row[x+1] = TILE_EDGE_RIGHT;
								}
						}

						map.push(row)
				}
				map_end = d + vertical_tiles;
		};

		var render_clear = function(){
				context.clearRect (0, 0, width, height);
		}

		var render_background = function(){
				wrapper.style.backgroundPosition = '0 ' + (-depth * tile_height * 0.5) + 'px';
		}

		var render_map = function(){
				/* offset in tiles for in-tile scrolling ("pixelperfect") */
				var xoffset = (xcam - Math.floor(xcam));
				var yoffset = (depth - Math.floor(depth));

				/* start offset in map */
				var xbegin = Math.floor(xcam);
				var ybegin = Math.floor(depth) - y_screencenter;

				context.save();

				for ( var y = 0; y < vertical_tiles + 1; y++ ){
						var ty = ybegin + y;
						var py = (y-yoffset) * tile_height;
						if(ty < 0) continue;

						for ( var x = 0; x < horizontal_tiles + 1; x++ ){
								var tx = xbegin + x;
								var tile = map[ty][tx];
								if ( tile == TILE_EMPTY ) continue;

								var sx = (tile % 8) * tile_width;
								var sy = Math.floor(tile / 8) * tile_height;
								var px = (x-xoffset) * tile_width;
								context.drawImage(tileset,
								                  sx, sy,                   /* src */
								                  tile_width, tile_height,  /* src size */
								                  px, py,                   /* dst */
								                  tile_width, tile_height); /* dst size */
						}
				}

				context.restore();
		}

		var render_animation = function(animation_data) {
			var a = animation_data.animation;
			var sx = a.tile_start.x + a.tile_size.x * Math.floor(animation_data.frame % a.frames);
			var sy = a.tile_start.y;
			context.save();
			context.scale(animation_data.facing, 1);
			context.drawImage(animation_tiles,
												sx, sy,                   /* src */
												a.tile_size.x, a.tile_size.y,  /* src size */
												-a.tile_size.x * 0.5, -a.tile_size.y * 0.5,  /* dst */
												a.tile_size.x, a.tile_size.y); /* dst size */
			context.restore();
		}

		var render_player = function(){
				/*context.fillStyle = '#f0f';
				context.fillRect(pos * tile_width - player_width2, y_screencenter * tile_height - player_height, player_width, player_height);*/
			context.save();
			var position = new vector(pos * tile_width, y_screencenter * tile_height - player_animation.animation.tile_size.y * 0.5) ;
			context.translate(position.x, position.y);
			render_animation(player_animation);
			context.restore();
		}

		var render_enemies = function() {
			for(i in enemies) {
				var e = enemies[i];
				var position = new vector(e.position.x * tile_width, ( e.position.y - depth + y_screencenter) * tile_height - e.animation_data.animation.tile_size.y * 0.5);
				context.save();
				context.translate(position.x, position.y);
				render_animation(e.animation_data);
				context.restore();

			}
		}

		var render_bombs = function(){
				for ( i in bombs ){
						var size = 10;
						var phase = 0;
						if ( bombs[i].lifespan < 0.3 ){
								size = bomb_blast;
								phase = Math.floor(Math.sin(bombs[i].lifespan * 35) * 127 + 127);
						}

						context.fillStyle = 'rgb(255,'+phase+',0)';
						context.fillRect(bombs[i].x * tile_height - size*0.5, (bombs[i].y - depth + y_screencenter) * tile_width - size*0.5, size, size);
				}
		}

		var render_projectiles = function() {
			for ( i in projectiles) {

				context.save();
				context.translate(projectiles[i].pos.x * tile_width, (projectiles[i].pos.y  - depth + y_screencenter)  * tile_height);
				if(projectiles[i].explode > 0) {
					var blast = projectile_types[projectiles[i].type].blast;
					var phase = Math.floor(Math.sin(projectiles[i].explode * 35) * 127 + 127);
					context.fillStyle = 'rgb(255,'+phase+',0)';
					context.fillRect(-blast * 0.5, -blast * 0.5, blast, blast);
				} else {
					context.rotate(projectiles[i].rotation);
					render_animation({ animation: projectile_types[projectiles[i].type].animation, frame: projectiles[i].frame, facing: 1});
				}
				context.restore();
			}
		}

		var render_hud = function(){
				var text = "Depth: " + Math.max(Math.floor((depth + y_screencenter)*depth_scale), 0) + "m";
				context.font = "bold 15px monospace";
				context.fillStyle = '#000';
				context.fillText(text, 7, 17);
				context.fillStyle = '#ff0';
				context.fillText(text, 5, 15);
		}

		var render = function(){
				render_clear();
				render_background();
				render_map();

				context.save();
				context.translate(-xcam * tile_width, 0);

				render_player();
				render_enemies();
				render_bombs();
				render_projectiles();

				context.restore();

				render_hud();
		};

		/**
		 * Handle a key{press,release}.
		 * Return true if the key was handled.
		 */
		var key_handler = function(code, state){
				/* normalize wasd to arrows */
				if ( code == 83 ) code = KEY_DOWN;
				if ( code == 87 ) code = KEY_UP
;				if ( code == 65 ) code = KEY_LEFT;
				if ( code == 68 ) code = KEY_RIGHT;

				switch ( code ){
				case KEY_UP:
				case KEY_DOWN:
				case KEY_LEFT:
				case KEY_RIGHT:
				case KEY_SPACE:
						key[code] = state;
						break;

				case KEY_DROP:
						if ( state ){
								drop_bomb();
						}
						break;
				case KEY_FIRE:
						if ( state ) {
								fire_projectile();
						}
						break;

				default:
						console.log('keypress: ' + code);
						return false;
				}

				return true;
		};

		var keypress = function(e){
				if ( key_handler(e.keyCode || e.which, true) ){
						e.preventDefault();
				}
		}

		var keyrelease = function(e){
				if ( key_handler(e.keyCode || e.which, false) ){
						e.preventDefault();
				}
		}

		var expire = function(){
				update();
				render();
		};

		return {
				init: function(id, params){
						/* not using jquery since it is significantly slower when it comes to canvas rendering */
						canvas = document.getElementById(id);
						context = canvas.getContext('2d');

						/* sizes */
						var $this = $('#'+id);
						width  = $this.attr('width');
						height = $this.attr('height');
						horizontal_tiles = Math.ceil(width / tile_width);
						vertical_tiles   = Math.ceil(height / tile_height);
						x_screencenter = Math.floor(horizontal_tiles / 2);
						y_screencenter = Math.floor(vertical_tiles / 2);
						depth = depth_min = -1;

						/* bind keys */
						$(document).keydown(keypress);
						$(document).keyup(keyrelease);
						for ( var i = 0; i < 255; i++ ){
								key.push(false);
						}

						/* preload graphics */
						tileset.src = 'tileset.png';
						animation_tiles.src = 'animations.png';

						/* apply background */
						wrapper = canvas.parentNode;
						$(wrapper)
								.css('background', '#000')
								.css('background-image', 'url("cave.jpg")')
								.css('background-position', '0 0')
								.css('width', width)
								.css('height', height)
						;

						/* setup parameters */
						if ( 'platform_height' in params ) platform_height = parseInt(params['platform_height']);
						if ( 'map_width' in params ) map_width = parseInt(params['map_width']);

						/* start game */
						setInterval(expire, frame_delay);
						update_map();
				},
		};
}();

$(document).ready(function(){
		nitroid.init('nitroid', {
				'platform_height': 8,
				'map_width': 50
		});
});
