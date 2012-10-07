var nitroid = new function() {
		var wrapper = null;
		var canvas = null;
		var context = null;
		var tileset = new Image();
		var animation_tiles = new Image();

		/* parameters */
		var platform_height = 12;                /* height between platforms */
		var gravity = 12;                        /* player gravity */
		var player_jump = 25;                    /* player jumping height per step */
		var player_jump_steps = 0.50;            /* how many "steps" a jump is (height = steps * jump) */
		var player_jump_threshold = 0.25;        /* at what point the jump is floating in air */
		var player_speed = 5.0;                  /* how fast the player moves horizontally */
		var bomb_lifespan = 2.0;                 /* how long before a bomb explodes */
		var bomb_blast = new vector(95,95);
		var bomb_dmg = 250;                      /* bomb damage */
		var depth_spawn_resource_factor = 1.25;  /* Number to multiply depth with to get spawn resources */
		var hiscore_url = null;
		var hiscore_user = null;

		var width = 0;
		var height = 0;
		var horizontal_tiles = 0;
		var vertical_tiles = 0;
		var x_screencenter = 0;
		var y_screencenter = 0;
		var tile_width = 32;
		var tile_height = 32;
		var tile_size = new vector(tile_width, tile_height);
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
		var player_max_life = 100.0;
		var player_life = player_max_life;
		var playtime = 0.0;
		var starttime = 0;
		var enemies_despawn_distance = 10; //distance from screen edge
		var player_rof = 1000 / 5;
		var last_fire = 0;
		var t = 0;
		var gameover = false;
		var is_paused = false;
		var explosion_length = 0.13; /* in seconds */

		/* camera */
		var xcam = 0;
		var ycam = 0;

		/* level data */
		var map = [];        /* row, column */
		var map_end = -1;    /* last cached row */
		var map_width = 60;  /* width of the map in tiles, can be overridden by user */
		var items = [];

		//var map_begin = -100; /* first row in cache */
		var can_jump = 0;              /* number of "steps" the player may jump */
		var bombs = [];
		var projectiles = [];	/* projectile: pos, velocity, rotation, type, frame, hostile(bool) */
		var selected_projectile_type = 0;
		var player_horizontal_direction = 1; /* -1 or 1 (left or right)  */

		/* fps control */
		var default_framerate = 30;
		var fps;
		var dt;
		var frame_delay;
		var animation_fps;
		var animation_df;
		var blink_dt;

		var set_framerate = function(v){
				fps = v;
				frame_delay = 1000 / fps;
				dt = 1.0 / fps;
				animation_fps = 10;
				animation_df = dt * animation_fps;
				blink_dt = 0.1;
		}

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
		var KEY_ALT = 18;
		var KEY_SHIFT = 16;
		var KEY_DROP = KEY_SHIFT;
		var KEY_JUMP = KEY_SPACE;
		var KEY_FIRE = KEY_CTRL;
		var KEY_HOLD = KEY_ALT;

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
			explosion: {
				tile_start: new vector(538, 256),
				tile_size: new vector(32, 32),
				frames: 6
			},
			bomb: {
				tile_start: new vector(577, 55),
				tile_size: new vector(8, 8),
				frames: 7
			},

			/**
			 * Items
			 */
			healthpack: {
				tile_start: new vector(559, 226),
				tile_size: new vector(17, 30),
				frames: 2
			},
			healthpack_empty: {
				tile_start: new vector(593, 226),
				tile_size: new vector(17, 30),
				frames: 1
			},

			/**
			 * Enemy animations
			 */

			enemy_walker1: {
				tile_start: new vector(552, 70),
				tile_size: new vector(24, 18),
				frames: 6
			},
			enemy_walker2: {
				tile_start: new vector(552, 92),
				tile_size: new vector(24, 18),
				frames: 6
			},
			space_pirate1: {
				tile_start: new vector(0, 150),
				tile_size: new vector(58, 66),
				frames: 8
			},
			space_pirate1_look: {
				tile_start: new vector(464, 150),
				tile_size: new vector(58, 66),
				frames: 1
			},
			space_pirate2: {
				tile_start: new vector(0, 150 + 66 ),
				tile_size: new vector(58, 66),
				frames: 8
			},
			space_pirate2_look: {
				tile_start: new vector(464, 150 + 66 ),
				tile_size: new vector(58, 66),
				frames: 1
			},
			space_pirate3: {
				tile_start: new vector(0, 150 + 66 * 2 ),
				tile_size: new vector(58, 66),
				frames: 8
			},
			space_pirate3_look: {
				tile_start: new vector(464, 150 + 66 * 2 ),
				tile_size: new vector(58, 66),
				frames: 1
			},
			space_pirate4: {
				tile_start: new vector(0, 150 + 66 * 3 ),
				tile_size: new vector(58, 66),
				frames: 8
			},
			space_pirate4_look: {
				tile_start: new vector(464, 150 + 66 * 3 ),
				tile_size: new vector(58, 66),
				frames: 1
			},
			space_pirate_claw1: {
				tile_start: new vector(562, 170),
				tile_size: new vector(27,27),
				frames: 6
			},
			space_pirate_claw2: {
				tile_start: new vector(562, 170 + 27),
				tile_size: new vector(27,27),
				frames: 6
			},
			space_pirate_beam1: {
				tile_start: new vector(560, 160),
				tile_size: new vector(36,10),
				frames: 2
			},
			space_pirate_beam2: {
				tile_start: new vector(560 + 36 * 2, 160),
				tile_size: new vector(36,10),
				frames: 2
			}
		};
		/* animation_data: animation, frame, facing, blink */ //blink: 0 -> 2.0 (0: solid, 1.0: transparent, 2.0: solid)

		var projectile_types = [
			{
			animation: animations.missile,
			damage: 20.0,
			speed: 13.0,
			blast: 45.0
		},
		{
			animation: animations.space_pirate_claw1,
			damage: 15.0,
			speed: 8.0,
			blast: 5.0
		},
		{
			animation: animations.space_pirate_claw2,
			damage: 20.0,
			speed: 10.0,
			blast: 5.0
		},
		{
			animation: animations.space_pirate_beam1,
			damage: 20.0,
			speed: 15.0,
			blast: 5.0
		},
		{
			animation: animations.space_pirate_beam2,
			damage: 25.0,
			speed: 20.0,
			blast: 5.0
		}
		];

		var item_type = {
			healthpack: {
				anim_normal: animations.healthpack,
				anim_grabbed: animations.healthpack_empty,
				callback: function(){
					player_life = player_max_life;
				}
			},
		};

		var enemy_animation = function(e) {
			e.animation_data.frame += animation_df;
		}

		var enemy_walker = function(e, speed) {
			if(e.direction == undefined) {
				e.direction = Math.random() < 0.5 ? -1 : 1;
			}

			{
					var size = enemy_types[e.type].animation.tile_size;
					var movement = e.direction * speed * dt;
					var new_pos = new vector(e.position.x + movement, e.position.y);
					var p = new_pos.x;
					if ( e.direction > 0 ){
							p += size.x / tile_width / 2
					} else {
							p -= size.x / tile_width / 2
					}
					var px = Math.floor(p);
					var py = Math.floor(new_pos.y);
					var tile = map[py][px];
					if ( !(tile == -1 || enemy_collision_test(e, new_pos)) ){
							e.position.x = new_pos.x;
					} else {
					 e.direction *= -1;
					 e.animation_data.facing = e.direction;
					 e.last_turn = t;
					}
			}

			/* gravitation for enemies */
			var new_pos = new vector(e.position.x, e.position.y + gravity * dt);
			if ( map_end > Math.floor(new_pos.y) && !enemy_collision_test(e, new_pos) ){
				e.position.y = new_pos.y;
			} else {
				e.position.y = Math.floor(new_pos.y);
			}
		}

		var enemy_shooter = function(e, fire_rate) {
			if ( e.last_fire != undefined && (t-e.last_fire) < fire_rate ) return;
			e.last_fire = t;
			var player_direction = new vector(pos, depth).minus(e.position).normalize();
			var player_direction_x = player_direction.x > 0 ? 1 : -1;
			if(player_direction_x == e.direction && Math.abs(player_direction.y) < 0.85 /* maximum fire angle */
				 && depth <= e.position.y && depth > (e.position.y - platform_height * 1.5)) {
				var size = enemy_types[e.type].animation.tile_size;
				var p = {
					type: enemy_types[e.type].projectile_type,
					pos: e.position.minus(new vector(0, size.y * 0.5 / tile_height)),
					rotation: Math.atan2(player_direction.y, player_direction.x),
					velocity: player_direction.normalize(),
					frame: 0,
					hostile: true,
					explode: 0
				};
				p.pos = p.pos.add(p.velocity.multiply(size.x * 0.5 / tile_width));
				p.velocity = p.velocity.multiply(projectile_types[p.type].speed);

				fire_projectile(p);
			}
		}

		var space_pirate_run = function(e) { /* e : enemy instance */
			enemy_animation(e);

			if(e.turning == undefined) {
				e.turning = 0;
				e.last_turn = 0;
			}

			if(e.turning > 0) {
				e.turning -= dt;
				if(e.turning <= 0) {
					e.direction *= -1;
					e.animation_data.facing = e.direction;
					e.animation_data.animation = enemy_types[e.type].animations[0];
					e.animation_data.frame = 0;
				}
				return;
			}

			enemy_walker(e, this.speed);

			if( (t - e.last_turn) > this.turn_delay && Math.random() < 0.15 * dt) {
				e.last_turn = t;
				//Turn
				e.animation_data.animation = enemy_types[e.type].animations[1];
				e.turning = this.turn_time;
			} else {
				enemy_shooter(e, this.fire_rate);
			}
		}

		var enemy_base_value = 5.0;

		var enemy_types = [
			{
				/* walker 1 */
				animation: animations.enemy_walker1,
				spawn_cost: 8,
				spawn_depth: [0.0, 50.0], /* depth range this enemy occur in, set max to -1 to never limit */
				life: 20,
				speed: 2.0,
				touch_damage: 10.0,
				run: function(e) { /* e : enemy instance */
					enemy_animation(e);
					enemy_walker(e, this.speed);
				}
			},
			{
				/* walker 2 */
				animation: animations.enemy_walker2,
				spawn_cost: 16,
				spawn_depth: [50.0, -1], /* depth range this enemy occur in, set max to -1 to never limit */
				life: 20,
				speed: 2.1,
				touch_damage: 15.0,
				run: function(e) { /* e : enemy instance */
					enemy_animation(e);
					enemy_walker(e, this.speed);
				}
			},
			{
				/* space pirate */
				animation: animations.space_pirate1,
				spawn_cost: 50,
				spawn_depth: [0.0, -1], /* depth range this enemy occur in, set max to -1 to never limit */
				life: 50,
				speed: 2.0,
				fire_rate: 3000,
				turn_time: 0.9,
				turn_delay: 2000,
				touch_damage: 20.0,
				projectile_type: 1,
				animations: [animations.space_pirate1, animations.space_pirate1_look],
				run: space_pirate_run
			}	,
			{
				/* space pirate */
				animation: animations.space_pirate2,
				spawn_cost: 180,
				spawn_depth: [0.0, -1], /* depth range this enemy occur in, set max to -1 to never limit */
				life: 100,
				speed: 2.0,
				fire_rate: 2500,
				turn_time: 0.9,
				turn_delay: 2000,
				touch_damage: 25.0,
				projectile_type: 2,
				animations: [animations.space_pirate2, animations.space_pirate2_look],
				run: space_pirate_run
			}	,
			{
				/* space pirate */
				animation: animations.space_pirate4,
				spawn_cost: 280,
				spawn_depth: [0.0, -1], /* depth range this enemy occur in, set max to -1 to never limit */
				life: 150,
				speed: 2.5,
				fire_rate: 2000,
				turn_time: 0.9,
				turn_delay: 2000,
				touch_damage: 30.0,
				projectile_type: 3,
				animations: [animations.space_pirate4, animations.space_pirate4_look],
				run: space_pirate_run
			}	,
			{
				/* space pirate */
				animation: animations.space_pirate3,
				spawn_cost: 500,
				spawn_depth: [0.0, -1], /* depth range this enemy occur in, set max to -1 to never limit */
				life: 200,
				speed: 2.0,
				fire_rate: 1500,
				turn_time: 0.9,
				turn_delay: 2000,
				touch_damage: 40.0,
				projectile_type: 4,
				animations: [animations.space_pirate3, animations.space_pirate3_look],
				run: space_pirate_run
			}
		]

		var enemies = []; /* position, type, life, animation_data */

		var player_animation = {animation: animations.player_aim_forward, frame: 0, facing: 1, blink: 0.0};

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
			return map_width - (wall_width(y, 1337) + wall_width(y, 0));
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
				for ( var i = 0; i <= 1.0; i += 0.5 ){
						for ( var j = 0; j <= 1.0; j += 0.25 ){
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
		 * AABB - AABB collision test between a and b
		 *
		 * @param acenter_ts: a center, in tile space
		 * @param asize: a size, in pixels
		 * @param bcenter_ts: b center, in tile space
		 * @param bsize: b size, in pixels
		 */
		var aabb_aabb = function(acenter_ts, asize, bcenter_ts, bsize) {
			var acenter = acenter_ts.vec_multiply(tile_size);
			var bcenter = bcenter_ts.vec_multiply(tile_size);

			var ahalf = asize.multiply(0.5);
			var bhalf = bsize.multiply(0.5);

			var amin = acenter.minus(ahalf);
			var bmin = bcenter.minus(bhalf);

			var amax  = acenter.add(ahalf);
			var bmax  = bcenter.add(bhalf);

			if(amax.x < bmin.x || amin.x > bmax.x) return false;
			if(amax.y < bmin.y || amin.y > bmax.y) return false;

			return true;
		}

		var player_pos = function() {
			return new vector(pos, depth - player_height2  / tile_height);
		}

		var player_size = function() {
			return player_animation.animation.tile_size;
		}

		var damage_player = function(dmg) {
			if(player_animation.blink < 0.01) {
				player_life -= dmg;
				player_animation.blink = 1.5;
			}
		}

		var projectile_aabb = function(p, bcenter_ts, bsize) {
			var asize = projectile_types[p.type].animation.tile_size
			var ahalf_ts = asize.multiply(0.5).vec_divide(tile_size);
			var acenter_ts = p.pos.add(ahalf_ts);
			return aabb_aabb(acenter_ts, asize, bcenter_ts, bsize);
		}

		/**
		 * Collision test for projectile with entities
		 *
		 * @param: p projectile
		 */
		var projectile_entity_collision_test = function(p) {
			if(p.hostile) {
				//Collision test with player
				if( projectile_aabb(p, player_pos(), player_size()) ) {
					damage_player(projectile_types[p.type].damage);
					return true;
				} else {
					return false;
				}
			} else {
				//Collision test with all enemies
				var hit = false;
				for(i in enemies) {
					var e = enemies[i];
					var size = enemy_types[e.type].animation.tile_size;
					var ep = e.position.minus(new vector(0, size.y / tile_height / 2));
					if(projectile_aabb(p, ep, size)) {
						enemies[i].life -= projectile_types[p.type].damage;
						hit = true;
					}
				}
				return hit;
			}
		}

		/**
		 * Same as collision_test but with offsets and size automatically added.
		 */
		var player_collision_test = function(x, y){
				return collision_test(x - player_width2 / tile_width, y, player_width/tile_width, -player_height/tile_height);
		}

		var player_enemy_collision_test = function(e) {
			var size = enemy_types[e.type].animation.tile_size;
			var ep = e.position.minus(new vector(0, size.y / tile_height / 2));
			return aabb_aabb(player_pos(), player_size(), ep, size);
		}

		/**
		 * Collision test for a enemy with a given position
		 */
		var enemy_collision_test = function(enemy, position) {
			var size = enemy_types[enemy.type].animation.tile_size;
			return collision_test(
				position.x - size.x / 2 / tile_width, position.y - 0.001,
				size.x/tile_width, -size.y/tile_height
			);
		}

		var toggle_pause = function(state){
			if ( gameover ) return;
			if ( typeof state === "undefined"){
				state = !is_paused;
			}
			is_paused = state;

			if ( is_paused ){
				$(wrapper).prepend('<div class="nitroid_center nitroid_msg"><p>Paused<br/><small>(press P to continue)</small></p></div>');
			} else {
				$(wrapper).children('.nitroid_msg').remove();
			}
		}

		var update_player_movement = function(){
				if (key[KEY_LEFT] || key[KEY_RIGHT]) {
					if(key[KEY_UP]) {
						player_animation.animation = animations.player_run_aim_diagonal_up;
					} else if(key[KEY_DOWN]) {
						player_animation.animation = animations.player_run_aim_diagonal_down
					} else if ( key[KEY_HOLD] ){
						player_animation.animation = animations.player_aim_forward;
					} else {
						player_animation.animation = animations.player_run_aim_forward;
					}
					if ( !key[KEY_HOLD] ){
						crouching = false;
					} else if ( crouching ){
						player_animation.animation = animations.player_crouch;
					}
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

				if ( key[KEY_HOLD] ){
					if ( key[KEY_LEFT] ){
						player_horizontal_direction = -1;
						player_animation.facing = -1;
					}
					if ( key[KEY_RIGHT] ){
						player_horizontal_direction = 1;
						player_animation.facing = 1;
					}
					return;
				}

				if ( !(key[KEY_LEFT] || key[KEY_RIGHT]) ) return;

				var new_pos = pos;
				if ( key[KEY_LEFT]  ) {
					new_pos -= player_speed * dt;
					player_horizontal_direction = -1;
					player_animation.facing = -1;
					player_animation.frame += animation_df * 1.8;
				}
				if ( key[KEY_RIGHT] )	{
					new_pos += player_speed * dt;
					player_horizontal_direction = 1;
					player_animation.facing = 1;
					player_animation.frame += animation_df * 1.8;
				}

				if ( !player_collision_test(new_pos, depth-1e-9) && new_pos >= 0 && new_pos <= (map_width - player_width/tile_width) ){
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
						can_jump -= 1 * dt;
				} else {
						new_depth += gravity * dt;
				}

				if ( !player_collision_test(pos, new_depth) ){
						depth = new_depth;
						if ( !key[KEY_JUMP] ){
								can_jump = 0;
						}
				} else {
						var dir = new_depth - depth;
						if ( dir > 0 ){
								/* landing on floor */
								depth = Math.floor(new_depth);
								if ( !key[KEY_JUMP] ){
									can_jump = player_jump_steps;
								}
						} else {
								/* jumping onto ceiling (subtracting 0.99 because 1.0 would collide with tile) */
								depth = Math.floor(new_depth) - 0.99 + player_height / tile_height;
								can_jump = player_jump_threshold;
						}
				}
		}

		var update_camera = function(){
				xcam = Math.min(Math.max(pos - x_screencenter, 0), map_width-horizontal_tiles);
		}

		var drop_bomb = function(){
				var touching_floor = player_collision_test(pos, depth);
				if ( !touching_floor || bombs.length >= 3 ) return;

				bombs.push({
						pos: new vector(pos, depth),
						lifespan: bomb_lifespan,
						exploded: false,
				});
		}

		var fire_projectile = function(p) {
			projectiles.push(p);

			var size = projectile_types[p.type].animation.tile_size;

			var hit = projectile_entity_collision_test(p)
			|| collision_test(p.pos.x, p.pos.y,
												size.x / tile_width,
												size.y / tile_height);
			if(hit) {
				explode_projectile(projectiles.length - 1);
			}
		}


		var player_fire_projectile = function() {
			if ( (t-last_fire) < player_rof ) return;
			last_fire = t;

			var p = {
				type: selected_projectile_type,
				pos: new vector(pos, depth - (player_height * (crouching ? 0.3 : 0.6)) / tile_height),
				rotation: player_horizontal_direction == -1 ? Math.PI : 0,
				velocity: new vector(player_horizontal_direction, 0),
				frame: 0,
				hostile: false,
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

			fire_projectile(p);
		}

		var update_bombs = function(){
				for ( var i in bombs ){
						bombs[i].lifespan -= dt;
						if ( !bombs[i].exploded && bombs[i].lifespan < 0.3 ){
								var sx = Math.ceil(bomb_blast.x / horizontal_tiles);
								var sy = Math.ceil(bomb_blast.y / vertical_tiles);
								var b = bombs[i];
								b.exploded = true;

								/* destroy tiles */
								for ( var y = -sy; y < sy; y++ ){
										var py = Math.round(b.pos.y) + y;
										for ( var x = -sx; x < sx; x++ ){
												var px = Math.round(b.pos.x) + x;
												var tile = map[py][px];

												if ( px < 0 || py < 0 ) continue;
												if ( tile == -1 ) continue;
												if ( tile >= 8 && tile < 16 ){
														map[py][px] = -1;
												}
										}
								}

								/* hurt enemies */
								for ( var j in enemies) {
										var e = enemies[j];
										var size = enemy_types[e.type].animation.tile_size;

										if ( aabb_aabb(b.pos, bomb_blast, e.position, size) ){
												enemies[j].life -= bomb_dmg;
										}
								}

								/* hurt player */
								if ( aabb_aabb(b.pos, bomb_blast, player_pos(), player_size()) ){
										damage_player(40);
								}
						}
						if ( bombs[i].lifespan < 0.0 ){
								bombs.splice(i, 1);
						}
				}
		}

		var explode_projectile = function(i){
				projectiles[i].explode = explosion_length;
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
			for (var i in projectiles) {
				var p = projectiles[i];
				if(projectiles[i].explode > 0) {
					projectiles[i].explode -= dt;
					if(projectiles[i].explode < 0.0) {
						//Despawn
						projectiles.splice(i, 1);
					}
				} else {
					p.frame += animation_df;
					p.pos = p.pos.add(p.velocity.multiply(dt));
					var hit = projectile_entity_collision_test(p)
					|| collision_test(p.pos.x, p.pos.y,
														animations.missile.tile_size.x / tile_width,
														animations.missile.tile_size.y / tile_height);
					if(hit) {
						explode_projectile(i);
					}
				}
			}
		}

		var update_enemies = function() {
			var despawn_depth = depth - y_screencenter - enemies_despawn_distance;
			for(var i in enemies) {
				if(enemies[i].life <= 0 || enemies[i].position.y <= despawn_depth) {
					console.log("Remove enemy at depth " + enemies[i].position.y);
					enemies.splice(i, 1);
				} else {
					if(enemies[i].animation_data.blink > 0.0) {
						enemies[i].animation_data.blink -= blink_dt;
						if(enemies[i].animation_data.blink < 0) enemies[i].animation_data.blink = 0.0;
					}
					var type = enemy_types[enemies[i].type];
					type.run(enemies[i]);
					if(player_enemy_collision_test(enemies[i])) {
						damage_player(type.touch_damage);
					}
				}
			}
		}

		var update_player = function() {
			playtime += dt;

			if(player_life <= 0) {
					gameover = true;
					$(wrapper).prepend('<div class="nitroid_center nitroid_msg"><p>Game Over</p></div>');

					/* yummy pasta */
					var adler32 = function(a,b,c,d,e,f){for(b=65521,c=1,d=e=0;f=a.charCodeAt(e++);d=(d+c)%b)c=(c+f)%b;return(d<<16)|c}

					/* data */
					var r = Math.floor(frand(3028 * depth + playtime) * 58930);
					var d = scaled_depth();
					var time = Math.floor(playtime*10)/10;
					var stuff = [hiscore_user, window.location.hostname, r, d, time, 'lol'].join('e');
					var sum = (adler32(stuff) + 2147483648) & 0xfffffff;
					if ( hiscore_url ){
							$.ajax({
									url: hiscore_url,
									type: 'POST',
									dataType: 'json',
									headers: {
											'X-Tag': r,
									},
									data: {
											user: hiscore_user,
											depth: d,
											time: time,
											sum: sum.toString(16),
									},
									success: function(data){
											if ( data.status != 'ok' ){
													alert('Failed to save highscore: ' + data.status);
													console.log(data);
											}
									},
									error: function(data, msg){
											alert('Failed to save highscore: ' + msg);
											console.log(data);
											console.log(msg);
									}
							});
					}
			}
			if(player_animation.blink > 0.0) {
				player_animation.blink -= blink_dt;
				if(player_animation.blink < 0) player_animation.blink = 0.0;
			}
		}

		var update_items = function(){
				var despawn_depth = depth - y_screencenter - enemies_despawn_distance;
				for ( var i in items ){
						var cur = items[i];

						if ( cur.position.y <= despawn_depth ){
								console.log("Remove item at depth " + enemies[i].position.y);
								items.splice(i, 1);
								continue;
						}

						cur.animation_data.frame += animation_df * 0.7;
						var size = cur.animation_data.animation.tile_size;
						var pos = cur.position.minus(new vector(0, size.y / tile_height / 2));
						if ( !cur.grabbed && aabb_aabb(player_pos(), player_size(), pos, size) ){
								cur.type.callback();
								cur.grabbed = true;
								cur.animation_data.animation = cur.type.anim_grabbed;
						}
				}
		}

		var update = function(){
				if ( gameover || is_paused ){
					return;
				}
				update_player();
				update_player_movement();
				update_player_gravity();
				update_items();
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
				var d = Math.floor(depth) - y_screencenter + 2;

				if(d + vertical_tiles < map_end) return;

				for ( var y = map_end + 1; y < d + vertical_tiles + 1; y++ ){
						if(y < 0) continue;
						var row = new Array(map_width);

						var spawn_list = [];
						if( is_row(y) ) {
							var spawn_resources = y * depth_spawn_resource_factor;
							var possible_spawns = [];
							for( var i in enemy_types) {
								var e = enemy_types[i];
								e.index = i;
								if(e.spawn_cost < spawn_resources &&
									e.spawn_depth[0] <= depth &&
									( e.spawn_depth[1] == -1 || e.spawn_depth[1] >= depth)) {
										for(var c = 0; c < e.spawn_cost / enemy_base_value; ++c) possible_spawns.push(e);
								}
							}
							var i = 0;
							while(spawn_resources > 0 && possible_spawns.length > 0) {
								var s = Math.floor(frand(y + i) * possible_spawns.length);
								if(possible_spawns[s].spawn_cost < spawn_resources) {
									spawn_resources -= possible_spawns[s].spawn_cost;
									var dir = Math.random() > 0.5 ? 1 : -1;
									spawn_list.push({
										/* position:  - set later */
										direction: dir,
										type: possible_spawns[s].index,
										life: possible_spawns[s].life,
										animation_data: {animation: possible_spawns[s].animation, frame: 0, facing: dir, blink: 0.0}
									});
								} else {
									possible_spawns.splice(s, 1);
								}
								++i;
							}

							/* spawn items */
							var level = y / platform_height;
							if ( level % 15 == 0 ){
								var dx = depth_width(y - 1) - 2
								var x = wall_width(y - 1, 0) + 1;
								items.push({
									position: new vector(x + dx * frand(y * 53.7 + 9943), y-0.5),
									animation_data: { animation: item_type.healthpack.anim_normal, frame: 0, facing: 1, blink: 0.0 },
									grabbed: false,
									type: item_type.healthpack,
								});
							}
						}

						for ( var x = 0; x < map_width; x++ ){
								row[x] = tile_at(x, y);
						}
						if( spawn_list.length > 0 ) {
							var spawn_distance = (Math.min(depth_width(y - 1), depth_width(y - 2), depth_width(y - 3))-2) / spawn_list.length;
							var x = Math.max(wall_width(y - 1, 0), wall_width(y - 2, 0), wall_width(y - 3, 0));
							for( var i in spawn_list ) {
								var e = spawn_list[i];
								/* testing both floor/ceil so it wont stand on the edge */
								if( row[Math.floor(x)] != TILE_EMPTY && row[Math.ceil(x)] != TILE_EMPTY ) {
									var size = enemy_types[e.type].animation.tile_size;
									var bias = 0.1;
									e.position = new vector(x + size.x / tile_width + bias, y);
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
			context.globalAlpha = Math.abs(1.0 - animation_data.blink);
			context.drawImage(animation_tiles,
												sx, sy,                   /* src */
												a.tile_size.x, a.tile_size.y,  /* src size */
												-a.tile_size.x * 0.5, -a.tile_size.y * 0.5,  /* dst */
												a.tile_size.x, a.tile_size.y); /* dst size */
			context.restore();
		}

		var render_items = function() {
			for ( var i in items) {
				var cur = items[i];
				context.save();
				context.translate(cur.position.x * tile_width, (cur.position.y  - depth + y_screencenter)  * tile_height);
				render_animation(cur.animation_data);
				context.restore();
			}
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
			for(var i in enemies) {
				var e = enemies[i];
				var position = new vector(e.position.x * tile_width, ( e.position.y - depth + y_screencenter) * tile_height - e.animation_data.animation.tile_size.y * 0.5);
				context.save();
				context.translate(position.x, position.y);
				render_animation(e.animation_data);
				context.restore();
/*
				context.fillStyle = '#f0f';
				context.fillRect(e.position.x * tile_width, (e.position.y - depth + y_screencenter) * tile_height, 5, 5);*/

			}
		}

		var render_bombs = function(){
				for ( var i in bombs ){
						var cur = bombs[i];
						context.save();
						context.translate(cur.pos.x * tile_width, (cur.pos.y  - depth + y_screencenter) * tile_height);

						var size = new vector(10,10);
						if ( bombs[i].lifespan < 0.3 ){
								var s = 1.0 - bombs[i].lifespan / 0.3;
								var frame = Math.floor(s * animations.explosion.frames);
								context.scale(bomb_blast.x / animations.explosion.tile_size.x, bomb_blast.y / animations.explosion.tile_size.y);
								render_animation({ animation: animations.explosion, frame: frame, facing: 1, blink: 0.0});
						} else {
								var s = 1.0 - (cur.lifespan-0.3) / (bomb_lifespan-0.3);
								var frame = Math.floor(s * animations.bomb.frames);
								render_animation({ animation: animations.bomb, frame: frame, facing: 1, blink: 0.0});
						}

						context.restore();
				}
		}

		var render_projectiles = function() {
			for ( var i in projectiles) {

				context.save();
				context.translate(projectiles[i].pos.x * tile_width, (projectiles[i].pos.y  - depth + y_screencenter)  * tile_height);
				if(projectiles[i].explode > 0) {
					var blast = projectile_types[projectiles[i].type].blast;
					var s = 1.0 - projectiles[i].explode / explosion_length;
					var frame = Math.floor(s * animations.explosion.frames);
					context.scale(blast / animations.explosion.tile_size.x, blast / animations.explosion.tile_size.y);
					render_animation({ animation: animations.explosion, frame: frame, facing: 1, blink: 0.0});
				} else {
					context.rotate(projectiles[i].rotation);
					render_animation({ animation: projectile_types[projectiles[i].type].animation, frame: projectiles[i].frame, facing: 1, blink: 0.0});
				}
				context.restore();
			}
		}

		var scaled_depth = function(){
				return Math.max(Math.floor((depth + y_screencenter)*depth_scale), 0);
		}

		var shadowtext = function(text, x, y){
			context.font = "bold 15px monospace";
			context.fillStyle = '#000';
			context.fillText(text, x+2, y+2);
			context.fillStyle = '#ff0';
			context.fillText(text, x, y);
		}

		var render_hud = function(){
			shadowtext("Depth: " + scaled_depth() + "m", 5, 15);
			shadowtext("Life: " + Math.max(player_life, 0), 5, 32);
		}

		var render = function(){
				render_clear();
				render_background();
				render_map();

				context.save();
				context.translate(-xcam * tile_width, 0);

				render_items();
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
		var key_handler = function(code, state, e){
				/* normalize wasd to arrows */
				if ( code == 83 ) code = KEY_DOWN;
				if ( code == 87 ) code = KEY_UP;
				if ( code == 65 ) code = KEY_LEFT;
				if ( code == 68 ) code = KEY_RIGHT;

				/* toggle pause */
				if ( String.fromCharCode(code) == 'P' ){
					if ( state ){
						toggle_pause();
					}
					return true;
				}

				switch ( code ){
				case KEY_UP:
				case KEY_DOWN:
				case KEY_LEFT:
				case KEY_RIGHT:
				case KEY_SPACE:
				case KEY_HOLD:
						key[code] = state;
						key[KEY_HOLD] = e.altKey;
						break;

				case KEY_DROP:
						if ( state ){
								drop_bomb();
						}
						break;
				case KEY_FIRE:
						if ( state ) {
								player_fire_projectile();
						}
						break;

				default:
						console.log('keypress: ' + code);
						return false;
				}

				return true;
		};

		var keypress = function(e){
				if ( key_handler(e.keyCode || e.which, true, e) ){
						e.preventDefault();
				}
		}

		var keyrelease = function(e){
				if ( key_handler(e.keyCode || e.which, false, e) ){
						e.preventDefault();
				}
		}

		var expire = function(){
				var sleep;

				do {
						t += frame_delay;

						update();
						render();

						var cur = (new Date().getTime());
						var delta = (cur-t);
						sleep = Math.max(frame_delay - delta, 0);
				} while ( sleep == 0 );

				setTimeout(expire, sleep);
		};

		/* om nom nom, pasta from msdn */
		// Returns the version of Internet Explorer or a -1
		// (indicating the use of another browser).
		function getInternetExplorerVersion(){
			var rv = -1; // Return value assumes failure.
			if (navigator.appName == 'Microsoft Internet Explorer'){
				var ua = navigator.userAgent;
				var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
				if (re.exec(ua) != null)
					rv = parseFloat( RegExp.$1 );
			}
			return rv;
		}

		return {
				init: function(id, params){
						/* styles */
						var $this = $('#'+id);
						width  = $this.attr('width');
						height = $this.attr('height');
						$("<style type='text/css'>.nitroid_center { width: "+width+"px; }</style>").appendTo("head");
						$("<style type='text/css'>.instructions { left: "+((width-500)/2+$this.offset().left)+"px; }</style>").appendTo("head");

						/* nitroid will not work with < IE9 */
						var ie = getInternetExplorerVersion();
						if ( ie != -1 && ie < 9 ){
							$this.parent().prepend('<div class="nitroid_center nitroid_error"><p><b>Internet Explorer '+ie+'</b></p><p>För att spela Nitroid måste du uppdatera till version IE9 eller senare, eller använda en annan webläsare.</p></div>');
							return;
						}

						/* not using jquery since it is significantly slower when it comes to canvas rendering */
						canvas = document.getElementById(id);
						context = canvas.getContext('2d');

						/* sizes */
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

						$(window).focusout(function(){
							toggle_pause(true);
						});

						/* instructions */
						$(wrapper).prepend('<div class="instructions"></div>');
						setTimeout(function(){
								$('.instructions').fadeOut();
						}, 12000);

						/* setup parameters */
						if ( 'platform_height' in params ) platform_height = parseInt(params['platform_height']);
						if ( 'map_width' in params ) map_width = parseInt(params['map_width']);
						if ( 'hiscore_url' in params ) hiscore_url = params['hiscore_url'];
						if ( 'hiscore_user' in params ) hiscore_user = params['hiscore_user'];

						/* start game */
						update_map();
						t = starttime = (new Date().getTime());
						set_framerate(default_framerate);
						setTimeout(expire, frame_delay);
				},
		};
}();
