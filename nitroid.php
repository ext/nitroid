<?php

function validate_request(){
	$user = isset($_POST['user']) ? $_POST['user'] : '';
	$depth = isset($_POST['depth']) ? $_POST['depth'] : '';
	$time = isset($_POST['time']) ? $_POST['time'] : '';
	$tag = isset($_SERVER['HTTP_X_TAG']) ? $_SERVER['HTTP_X_TAG'] : '';
	$referer = parse_url(isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '');
	$host = isset($referer['host']) ? $referer['host'] : '';
	$salt = 'lol';
	$haystack = implode(array($user, $host, $tag, $depth, $time, $salt), 'e');
	$sum1 = isset($_POST['sum']) ? $_POST['sum'] : '';
	$sum2 = dechex(hexdec(hash('adler32', $haystack)) & 0xfffffff);

	$have_tag = isset($_SERVER['HTTP_X_TAG']);
	$valid_checksum = strcmp($sum1, $sum2) == 0;
	$valid_hostname = strcmp($host, $_SERVER['SERVER_NAME']) == 0;
	$valid = $have_tag && $valid_checksum && $valid_hostname;

	return $valid;
}

header('content-type: application/json');
