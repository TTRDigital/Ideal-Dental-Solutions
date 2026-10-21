<?php
/**
 * Site search on SiteGround (/?s=term, /page/2/?s=term, /search/term/), the
 * PHP version of app/search-results + lib/site/search.ts: every word must be
 * in the title, excerpt or page content; title matches first, then newest.
 * search.json (written by export-static.mjs) holds the index and the results /
 * no-results pages with a placeholder for the words, cards and pagination.
 */
$cfg = json_decode((string) @file_get_contents(__DIR__ . '/search.json'), true);
if (!$cfg) { http_response_code(404); readfile(dirname(__DIR__) . '/404.html'); exit; }

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$page = 1;
$query = null;
if (preg_match('#^/search/([^/]+)/?(?:page/(\d+)/?)?$#', $uri, $m)) {
    $query = urldecode(str_replace('+', ' ', $m[1]));
    $page = isset($m[2]) ? (int) $m[2] : 1;
} else {
    $query = (string) ($_GET['s'] ?? '');
    if (preg_match('#^/page/(\d+)/?$#', $uri, $m)) $page = (int) $m[1];
}
$page = max(1, $page);
$q = trim($query);
$lower = function ($s) { return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s); };

// Words, like WordPress: quoted phrases kept together, "-word" dropped.
$terms = [];
if (preg_match_all('/"([^"]+)"|(\S+)/u', $q, $mm, PREG_SET_ORDER)) {
    foreach ($mm as $x) {
        $t = trim($lower(isset($x[1]) && $x[1] !== '' ? $x[1] : $x[2]));
        if ($t !== '' && $t[0] !== '-') $terms[] = $t;
    }
}
$phrase = $lower($q);

$rows = [];
foreach ($cfg['index'] as $d) {
    $title = $lower($d['title']);
    $excerpt = $lower($d['excerpt']);
    $text = $d['text'];
    $ok = true;
    foreach ($terms as $t) {
        if (strpos($title, $t) === false && strpos($excerpt, $t) === false && strpos($text, $t) === false) { $ok = false; break; }
    }
    if (!$ok) continue;
    $order = 0;
    if (count($terms) === 1) $order = strpos($title, $terms[0]) !== false ? 0 : 1;
    elseif (count($terms) > 1) {
        $all = true; $some = false;
        foreach ($terms as $t) { $in = strpos($title, $t) !== false; $all = $all && $in; $some = $some || $in; }
        $order = strpos($title, $phrase) !== false ? 1 : ($all ? 2 : ($some ? 3 : (strpos($excerpt, $phrase) !== false ? 4 : (strpos($text, $phrase) !== false ? 5 : 6))));
    }
    $rows[] = ['d' => $d, 'order' => $order];
}
usort($rows, function ($a, $b) {
    return ($a['order'] - $b['order']) ?: (strcmp($b['d']['published'], $a['d']['published']) ?: ($b['d']['wpId'] - $a['d']['wpId']));
});

$perPage = (int) $cfg['perPage'];
$pages = max(1, (int) ceil(count($rows) / $perPage));
if ($page > $pages) { http_response_code(404); readfile(dirname(__DIR__) . '/404.html'); exit; }

function search_url($query, $n) {
    $enc = str_replace('%20', '+', rawurlencode($query));
    return ($n > 1 ? "/page/$n/" : '/') . '?s' . ($enc !== '' ? "=$enc" : '');
}
function attr($s) { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

function pagination($query, $page, $pages, $prevIcon, $nextIcon) {
    if ($pages <= 1) return '';
    $items = []; $dots = false;
    for ($n = 1; $n <= $pages; $n++) {
        if ($n === $page) { $items[] = "<span aria-current=\"page\" class=\"page-numbers current\">$n</span>"; $dots = true; }
        elseif ($n <= 1 || ($n >= $page - 3 && $n <= $page + 3) || $n > $pages - 1) { $items[] = '<a class="page-numbers" href="' . attr(search_url($query, $n)) . "\">$n</a>"; $dots = true; }
        elseif ($dots) { $items[] = '<span class="page-numbers dots">&hellip;</span>'; $dots = false; }
    }
    $prev = $page > 1 ? '<a class="prev page-numbers" rel="prev" href="' . attr(search_url($query, $page - 1)) . "\">{$prevIcon}Prev</a>" : '';
    $next = $page < $pages ? '<a class="next page-numbers" rel="next" href="' . attr(search_url($query, $page + 1)) . "\">Next {$nextIcon}</a>" : '';
    return "<nav class=\"ct-pagination\" aria-label=\"Search results pagination\" data-pagination=\"simple\"  >\n\t\t\t{$prev}<div class=\"ct-hidden-sm\">" . implode("\n", $items) . "</div>{$next}\n\t\t\t\n\t\t</nav>";
}

$token = $cfg['token'];
if ($rows) {
    $html = $cfg['results'];
    $shown = array_slice($rows, ($page - 1) * $perPage, $perPage);
    $html = str_replace($cfg['cardsBlock'], implode('', array_map(function ($r) { return $r['d']['card']; }, $shown)), $html);
    $html = str_replace($cfg['paginationBlock'], pagination($q, $page, $pages, $cfg['prevIcon'], $cfg['nextIcon']), $html);
    if ($pages <= 1 && $cfg['paginationCss'] !== '') $html = str_replace($cfg['paginationCss'], '', $html);
    if ($page > 1) $html = str_replace("You searched for $token", "You searched for $token - Page $page of $pages", $html);
} else {
    $html = $cfg['empty'];
}
$html = str_replace("?s=$token", '?s=' . rawurlencode($q), $html);
$html = str_replace($token, htmlspecialchars($q, ENT_QUOTES, 'UTF-8'), $html);

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: private, no-store');
header('X-Robots-Tag: noindex, follow');
echo $html;
