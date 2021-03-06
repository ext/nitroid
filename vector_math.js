function vector(x_, y_) {
	this.x = x_;
	this.y = y_;

	this.add = function(v) {
		return new vector(this.x + v.x, this.y + v.y);
	}

	this.minus = function(v) {
		return new vector(this.x - v.x, this.y - v.y);
	}

	this.multiply = function(s) {
		return new vector(this.x * s, this.y * s);
	}

	this.vec_multiply = function(v) {
		return new vector(this.x * v.x, this.y * v.y);
	}

	this.vec_divide = function(v) {
		return new vector(this.x / v.x, this.y / v.y);
	}

	this.dot = function(v) {
		return this.x * v.x + this.y * v.y;
	}

	this.length = function() {
		return Math.sqrt(this.dot(this));
	}

	this.normalize = function() {
		var len = this.length();
		return new vector(this.x / len, this.y / len);
	}
}
