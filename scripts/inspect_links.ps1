$posts = Get-Content -Raw 'scripts/real_posts_all.json' | ConvertFrom-Json
foreach ($p in $posts) {
    Write-Host "==============================="
    Write-Host "POST: $($p.title.rendered)"
    $html = $p.content.rendered
    $regex = [regex]'<h[34][^>]*>(.*?)<\/h[34]>[\s\S]*?<a\s+[^>]*href=["'']([^"'']+)["'']'
    $matches = $regex.Matches($html)
    foreach ($m in $matches) {
        $head = $m.Groups[1].Value -replace '<[^>]+>', ''
        $url = $m.Groups[2].Value
        Write-Host "  HEADING: $head"
        Write-Host "  URL: $url"
    }
}
