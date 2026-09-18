$posts = Get-Content -Raw 'scripts/real_posts_all.json' | ConvertFrom-Json

function Parse-DownloadLinks($html) {
    $links = @()
    # Split content by <h4 or <h3
    $blocks = [regex]::Split($html, '(?=<h[34][^>]*>)')
    foreach ($block in $blocks) {
        if ($block -match '<h[34][^>]*>(.*?)<\/h[34]>') {
            $heading = $matches[1] -replace '<[^>]+>', ''
            $heading = $heading.Trim()
            
            # Find a href inside this block
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
                    if ($heading -ne 'Movie Info:' -and $heading -ne 'Series Info:' -and $heading -ne 'Storyline:' -and -not ($heading -like '*Screenshots*')) {
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

$vibeLinks = Parse-DownloadLinks $posts[0].content.rendered
Write-Host "Vibe extracted links count: $($vibeLinks.Count)"
foreach ($l in $vibeLinks) {
    Write-Host "  -> $($l.Quality) | $($l.Size) | $($l.Heading) | $($l.Url)"
}
