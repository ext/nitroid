function vector_add(v1, v2) {
	return { x: v1.x + v2.x, y: v1.y + v2.y }
}

function vector_subtract(v1, v2) {
	return vector_add(v1, -v2);
}

function vector_scalar_multiply(v1, scalar) {
	return { x: v1.x * scalar, y: v1.y * scalar};
}

function vector_dot(v1, v2) {
	return v1.x * v2.x + v1.y * v2.y;
}

function vector_length(v) {
	return Math.sqrt(vector_dot(v, v));
}

function vector_normalize(v) {
	var len = vector_length(v);
	return { x: v.x / len, y: v.y / len };
}
