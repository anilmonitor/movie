$p = Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--remote-debugging-port=9222", "--user-data-dir=C:\Users\anilm\AppData\Local\Temp\isolated_cdp", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "https://movies4u.kg/wp-json/wp/v2/posts?_embed=1" -PassThru
Start-Sleep -Seconds 3
Get-NetTCPConnection -LocalPort 9222 -ErrorAction SilentlyContinue | Format-Table -AutoSize
