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

		/* fps control */
		var fps = 30;
		var frame_delay = 1000 / fps;
		var dt = 1.0 / fps;

		var TILE_EMPTY = -1;
		var TILE_PLATFORM = 0;
		var TILE_WALL = 7;
		var KEY_UP = 38;
		var KEY_DOWN = 40;

		var wall_width = function(y){
				var d = Math.sin(y * 0.05) * Math.atan(y * 0.15 + 7) * 5 + Math.cos(y * 0.5 + 11) * 1.1;
				return Math.abs(d);
		}

		var tile_at = function(x, y){
				var w1 = wall_width(y);
				var w2 = wall_width(y+1337)+1;

				var is_wall = x < w1 || x >= (horizontal_tiles-w2);
				var is_row = y % 12 == 0;

				if ( is_wall ){
						return TILE_WALL;
				}

				if ( is_row ){
						return TILE_PLATFORM;
				}

				return TILE_EMPTY;
		}

		var update = function(){
				if ( key[KEY_UP  ] ) depth -= 40.0 * dt;
				if ( key[KEY_DOWN] ) depth += 40.0 * dt;

				/* cannot be hight that this */
				if ( depth < 1.0 ) depth = 1.0;
		};

		var render = function(){
				context.clearRect (0, 0, width, height);

				/* offset in y-axis for in-tile scrolling */
				var offset = (depth - Math.floor(depth));

				for ( var y = 0; y < vertical_tiles + 1; y++ ){
						var ty = y + Math.floor(depth);
						for ( var x = 0; x < horizontal_tiles; x++ ){
								var tile = tile_at(x, ty);
								if ( tile == TILE_EMPTY ) continue;

								var sx = tile * tile_width;
								context.drawImage(tileset,
								                  sx, 0,
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
