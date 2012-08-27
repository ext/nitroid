var nitroid = new function() {
		var canvas = null;
		var context = null;
		var tileset = new Image();

		var width = 0;
		var height = 0;
		var horizontal_tiles = 0;
		var vertical_tiles = 0;
		var tile_width = 32;
		var tile_height = 32;
		var depth = 1.0;
		var key = [];

		/* level data */
		var map = [];       /* row, column */
		var map_begin = -1; /* first row in cache */

		/* fps control */
		var fps = 30;
		var frame_delay = 1000 / fps;
		var dt = 1.0 / fps;

		var TILE_EMPTY = -1;
		var TILE_PLATFORM = 0;
		var TILE_WALL = 7;
		var KEY_UP = 38;
		var KEY_DOWN = 40;

		/* for constant v it returns a deterministic quasi-random number between 0.0 - 1.0 */
		var frand = function(v){
				return Math.sin(v*429384) * Math.cos(v*17493340) * 0.5 + 0.5;
		}

		var wall_width = function(y){
				var d = Math.sin(y * 0.05) * Math.atan(y * 0.15 + 7) * 5 + Math.cos(y * 0.5 + 11) * 1.1;
				return Math.ceil(Math.abs(d));
		}

		var tile_at = function(x, y){
				var w1 = wall_width(y);
				var w2 = wall_width(y+1337);

				var is_wall = x < w1 || x >= (horizontal_tiles-w2);
				var is_row = y % 12 == 0;

				if ( is_wall ){
						return TILE_WALL;
				}

				if ( is_row ){
						var t = TILE_PLATFORM + (x - w1) % 7;

						var width = horizontal_tiles - w1 - w2 - 1;
						var size = Math.ceil(Math.abs(Math.sin(y * 4711)) * 3) + 3;
						var pos = w1 + Math.floor(Math.abs(Math.cos(y * 1234)) * (width-6));
						if ( x > pos && x < pos + size ){
								return frand(y) > 0.8 ? TILE_EMPTY : (t+8);
						}
						return t;
				}

				return TILE_EMPTY;
		}

		var update = function(){
				if ( key[KEY_UP  ] ) depth -= 40.0 * dt;
				if ( key[KEY_DOWN] ) depth += 40.0 * dt;

				/* cannot be hight that this */
				if ( depth < 1.0 ) depth = 1.0;

				update_map();
		};

		/**
		 * Recalculates the map cache if necessary.
		 */
		var update_map = function(){
				var d = Math.floor(depth);
				if ( d == map_begin ) return;

				var w = Math.ceil(horizontal_tiles);
				map.length = 0;
				for ( var y = 0; y < vertical_tiles + 1; y++ ){
						var row = new Array(w);
						for ( var x = 0; x < w; x++ ){
								row[x] = tile_at(x, y + d);
						}
						map.push(row)
				}
				map_begin = d;
		};

		var render = function(){
				context.clearRect (0, 0, width, height);

				/* offset in y-axis for in-tile scrolling */
				var offset = (depth - Math.floor(depth));

				for ( var y = 0; y < vertical_tiles + 1; y++ ){
						var ty = y + Math.floor(depth);
						for ( var x = 0; x < horizontal_tiles; x++ ){
								var tile = map[y][x];
								if ( tile == TILE_EMPTY ) continue;

								var sx = (tile % 8) * tile_width;
								var sy = Math.floor(tile / 8) * tile_height;
								context.drawImage(tileset,
								                  sx, sy,
								                  tile_width, tile_height,
								                  x * tile_width, (y-offset) * tile_height,
								                  tile_width, tile_height);
						}
				}
		};

		/**
		 * Handle a key{press,release}.
		 * Return true if the key was handled.
		 */
		var key_handler = function(code, state){
				/* normalize wasd to arrows */
				if ( code == 83 ) code = KEY_DOWN;
				if ( code == 87 ) code = KEY_UP;

				switch ( code ){
				case KEY_UP:
				case KEY_DOWN:
						key[code] = state;
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
				init: function(id){
						/* not using jquery since it is significantly slower when it comes to canvas rendering */
						canvas = document.getElementById(id);
						context = canvas.getContext('2d');

						/* sizes */
						var $this = $('#'+id);
						width  = $this.attr('width');
						height = $this.attr('height');
						horizontal_tiles = width / tile_width;
						vertical_tiles   = height / tile_height;

						/* bind keys */
						$(document).keydown(keypress);
						$(document).keyup(keyrelease);
						for ( var i = 0; i < 255; i++ ){
								key.push(false);
						}

						/* preload tileset */
						tileset.src = 'tileset.jpg';

						setInterval(expire, frame_delay);
				},
		};
}();

$(document).ready(function(){
		nitroid.init('nitroid');
});
