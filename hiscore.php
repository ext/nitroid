<?php

require_once('nitroid.php');

$valid = validate_request();
$status = $valid ? 'ok' : 'forged';

header('content-type: application/json');
echo json_encode(array('status' => $status));
