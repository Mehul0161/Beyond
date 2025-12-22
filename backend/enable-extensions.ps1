# PowerShell script to enable PHP extensions
$phpIniPath = "C:\tools\php85\php.ini"

if (Test-Path $phpIniPath) {
    $content = Get-Content $phpIniPath -Raw
    
    # Enable zip extension
    $content = $content -replace ';extension=zip', 'extension=zip'
    
    # Enable fileinfo extension
    $content = $content -replace ';extension=fileinfo', 'extension=fileinfo'
    
    # Save the file
    Set-Content -Path $phpIniPath -Value $content -NoNewline
    
    Write-Host "Extensions enabled successfully!" -ForegroundColor Green
    Write-Host "Please verify with: php -m | findstr /i 'zip fileinfo'" -ForegroundColor Yellow
} else {
    Write-Host "PHP ini file not found at: $phpIniPath" -ForegroundColor Red
}

