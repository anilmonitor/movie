$posts = Get-Content -Raw 'scripts/real_posts_all.json' | ConvertFrom-Json

function Parse-DownloadLinks($html) {
    $links = @()
    $blocks = [regex]::Split($html, '(?=<h[34][^>]*>)')
    foreach ($block in $blocks) {
        if ($block -match '<h[34][^>]*>(.*?)<\/h[34]>') {
            $heading = $matches[1] -replace '<[^>]+>', ''
            $heading = $heading.Trim()
            
            if ($block -match '<a\s+[^>]*href=["'']([^"'']+)["'']') {
                $url = $matches[1].Trim()
                if ($url -and -not ($url -like '*t.me*') -and -not ($url -like '*how-to-download*') -and -not ($url -like '*movies4u.kg*')) {
                    $quality = $null
                    if ($heading -match '\b(480p|720p|1080p|2160p|4K|HEVC)\b') {
                        $quality = $matches[1]
                    }
                    $size = $null
                    if ($heading -match '\[([0-9.]+(?:MB|GB)(?:\/[A-Za-z]+)?)\]') {
                        $size = $matches[1]
                    }
                    if ($heading -ne 'Movie Info:' -and $heading -ne 'Series Info:' -and $heading -ne 'Show Info:' -and $heading -ne 'Storyline:' -and -not ($heading -like '*Screenshots*')) {
                        $links += [PSCustomObject]@{
                            Heading = $heading
                            Url = $url
                            Quality = $quality
                            Size = $size
                        }
                    }
                }
            }
        }
    }
    return $links
}

foreach ($p in $posts) {
    $links = Parse-DownloadLinks $p.content.rendered
    Write-Host "$($p.title.rendered) -> $($links.Count) links"
    foreach ($l in $links) {
        Write-Host "   $($l.Quality) | $($l.Size) | $($l.Url)"
    }
}
