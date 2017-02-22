<?php

$request_url = null;

if (isset($_REQUEST['proxy'])) {
    $request_url = urldecode($_REQUEST['proxy']);
    $parsedUrl = parse_url($request_url);
}

$data = array();

if(isset($_GET['search'])) {
    $data['search'] = urlencode($_GET['search']);
}
if(isset($_GET['access_token'])) {
    $data['access_token'] = urlencode($_GET['access_token']);
}
if(isset($_GET['event'])) {
    $data['event'] = urlencode($_GET['event']);
}
if(isset($_GET['limit'])) {
    $data['limit'] = urlencode($_GET['limit']);
}
if(isset($_GET['sort'])) {
    $data['sort'] = urlencode($_GET['sort']);
}
if(isset($_GET['since_id '])) {
    $data['since_id '] = urlencode($_GET['since_id ']);
}
if(isset($_GET['until_id '])) {
    $data['until_id '] = urlencode($_GET['until_id ']);
}

// Only GET is supported right now
$request_method = $_SERVER['REQUEST_METHOD'];

if(is_array($data) && count($data) > 0) {
    $request_url .= '?';
    foreach($data as $key => $value) {
        $request_url .= $key . '=' . $value . '&';
    }
    $request_url = rtrim($request_url, '&');
}

$options = array(
    'http' => array(
        'header'  => 'Content-type: application/x-www-form-urlencoded',
        'method'  => 'GET',
        'content' => http_build_query($data),
        'ignore_errors' => true
    )
);

$result = file_get_contents($request_url);
if($result === FALSE) {
    echo 'An error occurred!<br/><br/>';
    // handle errors
}

echo $result;