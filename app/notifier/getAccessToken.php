<?php

$request_body = file_get_contents('php://input');
$decoded_json = json_decode($request_body);

$data = (array) $decoded_json;
//var_dump($request_body);
//var_dump($decoded_json);
//var_dump($data);
//die();

$url = 'https://api.flowdock.com/oauth/token';

$options = array(
    'http' => array(
        'header'  => 'Content-type: application/x-www-form-urlencoded',
        'method'  => 'POST',
        'content' => http_build_query($data)
    )
);

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
if($result === FALSE) {
    echo 'An error occurred!<br/><br/>';
    // handle errors
}

echo $result;