<?php 
libxml_use_internal_errors(true);

if($_GET['url']) {
    $url = $_GET['url'];
} else {
    $url = "";
}

$html = file_get_contents("https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p." . $url);

$start = "<select name=\"p_time_period_id\">";
$end = "</select>";

$html = substr($html,
    strpos($html, $start) + strlen($start),
    strpos($html, $end) - (strpos($html, $start) + strlen($start))
);


header('Access-Control-Allow-Origin: *');
header('Content-type: application/json');


echo json_encode([
    'url' => "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p." . $url,
    'html' => $start . $html . $end
]);

?>
