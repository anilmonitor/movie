$posts = Get-Content -Raw 'scripts/real_posts_all.json' | ConvertFrom-Json
$vibe = $posts[0]
[System.IO.File]::WriteAllText('scripts/vibe_content.html', $vibe.content.rendered)
Write-Host "Wrote vibe_content.html successfully"
