<?php

$url = 'https://api.flowdock.com/flows/';
$data = array(
  'access_token' => $_GET['access_token']
);

$options = array(
    'http' => array(
        'header'  => 'Content-type: application/x-www-form-urlencoded',
        'method'  => 'GET',
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