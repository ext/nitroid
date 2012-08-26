var nitroid = new function() {
		var canvas = null;
		var context = null;
		var tileset = new Image();

		var width = 0;
		var height = 0;
		var horizontal_tiles = 0;
		var vertical_tiles = 0;
		var tile_width = 16;
		var tile_height = 16;
		var depth = 0;
		var key = [];

		/* fps control */
		var fps = 25;
		var frame_delay = 1000 / fps;
		var dt = 1.0 / fps;

		var TILE_EMPTY = 0;
		var KEY_UP = 38;
		var KEY_DOWN = 40;

		var tile_at = function(x, y){
				if ( y % 12 != 0 ) return TILE_EMPTY;

				var i = y * horizontal_tiles + x;
				return 1;
		}

		var update = function(){
				if ( key[38] ) depth -= 12.0 * dt;
				if ( key[40] ) depth += 12.0 * dt;
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

								context.drawImage(tileset,
																	0, 0,
																	16, 16,
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
				switch ( code ){
				case 38:
				case 40:
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
