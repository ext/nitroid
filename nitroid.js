var nitroid = new function() {
		var wrapper = null;
		var canvas = null;
		var context = null;
		var tileset = new Image();
		var weapons = new Image();

		/* parameters */
		var platform_height = 12;      /* height between platforms */
		var gravity = 10;              /* player gravity */
		var player_jump = 16;          /* player jumping height per step */
		var player_jump_steps = 15;    /* how many "steps" a jump is (height = steps * jump) */
		var player_jump_threshold = 7; /* at what point the jump is floating in air */
		var player_speed = 5.0;        /* how fast the player moves horizontally */
		var bomb_lifespan = 3.0;       /* how long before a bomb explodes */
		var bomb_blast = 20;           /* blast radius */

		var width = 0;
		var height = 0;
		var horizontal_tiles = 0;
		var vertical_tiles = 0;
		var center_offset = 0;
		var tile_width = 32;
		var tile_height = 32;
		var projectile_width = 16;		 /* width of a projectile */
		var projectile_height = 16;		 /* height of a projectile */
		var projectile_spawn_offset = 1.0;
		var pos = 8;
		var depth = 0.0;
		var depth_min = 0.0;
		var depth_scale = 0.4;         /* scaling factor when showing depth on hud */
		var key = [];
		var player_width = 25;
		var player_height = 50;
		var player_width2 = player_width * 0.5;
		var player_offset  = player_width / tile_width * 0.5;

		/* level data */
		var map = [];       /* row, column */
		var map_end = -1;		/* last cached row */
		//var map_begin = -100; /* first row in cache */
		var can_jump = 0;              /* number of "steps" the player may jump */
		var bombs = [];
		var projectiles = [];	/* projectile: position, velocity, rotation, type */
		var selected_projectile_type = 0;
		var player_horizontal_direction = 1; /* -1 or 1 (left or right)  */


		var projectile_types = [
			{
				tile: 0,
				damage: 1.0,
				speed: 5.0,
				blast: 20.0
			}
		];

		/* fps control */
		var fps = 30;
		var frame_delay = 1000 / fps;
		var dt = 1.0 / fps;

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
		var KEY_DROP = KEY_DOWN;
		var KEY_JUMP = KEY_SPACE;
		var KEY_FIRE = KEY_CTRL;

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

		/**
		 * Tell what tile is at the given coordinate.
		 */
		var tile_at = function(x, y){
				var w1 = wall_width(y, 0);
				var w2 = wall_width(y, 1337);

				var is_wall = x < w1 || x >= (horizontal_tiles-w2);
				var is_row = y > 1 && y % platform_height == 0;

				if ( is_wall ){
						return TILE_WALL + Math.floor(frand(y*52 + x*19) * 6);
				}

				if ( is_row ){
						/* Use platform tiles in an incremental way */
						var t = TILE_PLATFORM + (x - w1) % 7;

						/* Locate opening for platform */
						var width = horizontal_tiles - w1 - w2 - 1;
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
				if ( !(key[KEY_LEFT] || key[KEY_RIGHT]) ) return;

				var new_pos = pos;
				if ( key[KEY_LEFT]  ) { 
					new_pos -= player_speed * dt;
					player_horizontal_direction = -1;
				}
				if ( key[KEY_RIGHT] )	{
					new_pos += player_speed * dt;
					player_horizontal_direction = 1;
				}

				if ( !player_collision_test(new_pos, depth-1e-9) ){
						pos = new_pos;
				}
		}

		var update_player_gravity = function(){
				var new_depth = depth;
				if ( can_jump > 0 && key[KEY_JUMP] ){
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
				pos: { x: pos, y: depth - (player_height * 0.5) / tile_height },
				rotation: player_horizontal_direction == -1 ? Math.PI : 0,
				velocity: { x: player_horizontal_direction, y: 0},
				explode: 0 /* Not currently exploding */
			};
			if(key[KEY_UP] && key[KEY_LEFT]) {
				p.rotation = Math.PI + Math.PI / 4.0;
				p.velocity = { x: -1, y: -1 };
			} else if(key[KEY_UP] && key[KEY_RIGHT]) {
				p.rotation = Math.PI + 3.0 *Math.PI / 4.0;
				p.velocity = { x: 1, y: -1 };
			} else if(key[KEY_UP]) {
				p.rotation = Math.PI + Math.PI / 2.0;
				p.velocity = { x: 0, y: -1 };
			}
			p.velocity = vector_normalize(p.velocity);

			p.pos = vector_add(p.pos, vector_scalar_multiply(p.velocity, projectile_spawn_offset));
			p.velocity = vector_scalar_multiply(p.velocity, projectile_types[p.type].speed);

			projectiles.push(p);
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
					p.pos = vector_add(p.pos, vector_scalar_multiply(p.velocity, dt));
					if(collision_test(p.pos.x, p.pos.y, projectile_width / tile_width, projectile_height / tile_height)) {
						projectiles[i].explode = 1.2;
						var blast = projectile_types[p.type].blast;
						sx = Math.ceil(blast / horizontal_tiles);
						sy = Math.ceil(blast / vertical_tiles);
						for ( var y = -sy; y < sy; y++ ){
								var py = Math.round(p.pos.y) + y;
								for ( var x = -sx; x < sx; x++ ){
										var px = Math.round(p.pos.x) + x;
										if ( px < 0 || py < 0 ) continue;
										var tile = map[py][px];
										if ( tile == -1 ) continue;
										if ( tile >= 8 && tile < 16 ){
												map[py][px] = -1;
										}
								}
						}
					}
				}
			}
		}

		var update = function(){
				update_player_movement();
				update_player_gravity();
				update_bombs();
				update_map();
				update_projectiles();
		};

		/**
		 * Recalculates the map cache if necessary.
		 */
		var update_map = function(){
				var d = Math.floor(depth) - center_offset;

				if(d + vertical_tiles < map_end) return;

				var w = Math.ceil(horizontal_tiles);

				for ( var y = map_end + 1; y < d + vertical_tiles + 1; y++ ){
						if(y < 0) continue;
						var row = new Array(w);

						/* raw values */
						for ( var x = 0; x < w; x++ ){
								row[x] = tile_at(x, y);
						}

						/* detect edges */
						for ( var x = 1; x < w-1; x++ ){
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
				/* offset in y-axis for in-tile scrolling ("pixelperfect") */
				var offset = (depth - Math.floor(depth));

				/* start y-offset in map */
				var d = Math.floor(depth) - center_offset;

				for ( var y = 0; y < vertical_tiles + 1; y++ ){
						var py = (y-offset) * tile_height;
						var ty = d + y;
						if(ty < 0) continue;
							

						for ( var x = 0; x < horizontal_tiles; x++ ){
								var tile = map[ty][x];
								if ( tile == TILE_EMPTY ) continue;

								var sx = (tile % 8) * tile_width;
								var sy = Math.floor(tile / 8) * tile_height;
								var px = x * tile_width;
								context.drawImage(tileset,
								                  sx, sy,                   /* src */
								                  tile_width, tile_height,  /* src size */
								                  px, py,                   /* dst */
								                  tile_width, tile_height); /* dst size */
						}
				}
		}

		var render_player = function(){
				context.fillStyle = '#f0f';
				context.fillRect(pos * tile_width - player_width2, center_offset * tile_height - player_height, player_width, player_height);
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
						context.fillRect(bombs[i].x * tile_height - size*0.5, (bombs[i].y - depth + center_offset) * tile_width - size*0.5, size, size);
				}
		}

		var render_projectiles = function() {
			for ( i in projectiles) {
				tile = projectile_types[projectiles[i].type].tile;
				var sx = (tile % 8) * projectile_width;
				var sy = Math.floor(tile / 8) * projectile_height;

				context.save();
				context.translate(projectiles[i].pos.x * tile_width, (projectiles[i].pos.y  - depth + center_offset)  * tile_height);
				if(projectiles[i].explode > 0) {
					var blast = projectile_types[projectiles[i].type].blast;
					var phase = Math.floor(Math.sin(projectiles[i].explode * 35) * 127 + 127);
					context.fillStyle = 'rgb(255,'+phase+',0)';
					context.fillRect(-blast * 0.5, -blast * 0.5, blast, blast);
				} else {
					context.rotate(projectiles[i].rotation);
					context.drawImage(weapons,
														sx, sy,                   /* src */
														projectile_width, projectile_height,  /* src size */
														-projectile_width * 0.5, -projectile_height * 0.5 ,  /* dst */
														projectile_width, projectile_height); /* dst size */
				}
				context.restore();
			}
		}

		var render_hud = function(){
				var text = "Depth: " + Math.max(Math.floor((depth + center_offset)*depth_scale), 0) + "m";
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
				render_player();
				render_bombs();
				render_projectiles();
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
				case KEY_LEFT:
				case KEY_RIGHT:
				case KEY_SPACE:
						key[code] = state;
						break;

				case KEY_DOWN:
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
						center_offset    = Math.floor(vertical_tiles / 2);
						depth = depth_min = -1;

						/* bind keys */
						$(document).keydown(keypress);
						$(document).keyup(keyrelease);
						for ( var i = 0; i < 255; i++ ){
								key.push(false);
						}

						/* preload graphics */
						tileset.src = 'tileset.png';
						weapons.src = 'weapons.png';

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

						/* start game */
						setInterval(expire, frame_delay);
						update_map();
				},
		};
}();

$(document).ready(function(){
		nitroid.init('nitroid', {
				'platform_height': 8
		});
});
