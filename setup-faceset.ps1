Clear-Host
Write-Host "========================================"
Write-Host "  Face++ FaceSet Setup for Windows"
Write-Host "========================================`n"

# ---- USER CONFIG ----
$apiKey     = "xGhIJ0cABz-hh3okt1N0vGjUItdwnvLk"
$apiSecret  = "KFzkTcIwKGdtO8NgzhNkaeDOVZURsA56"
$outerId    = "jostum_students_2024"

# ---- CREATE FACESET ----
Write-Host "[1/3] Creating FaceSet on Face++ servers..."

$body = @{
    api_key    = $apiKey
    api_secret = $apiSecret
    display_name = $outerId
    outer_id   = $outerId
}

try {
    $response = Invoke-RestMethod `
        -Uri "https://api-us.faceplusplus.com/facepp/v3/faceset/create" `
        -Method POST `
        -Body $body

    if ($response.faceset_token) {
        $facesetToken = $response.faceset_token
        Write-Host "FaceSet created successfully!"
    }
}
catch {
    # Check if error is FACESET_EXIST
    if ($_ -match "FACESET_EXIST") {
        Write-Host "FaceSet already exists. Retrieving token..."

        # Fetch existing faceset token
        $getBody = @{
            api_key    = $apiKey
            api_secret = $apiSecret
            outer_id   = $outerId
        }

        $getResponse = Invoke-RestMethod `
            -Uri "https://api-us.faceplusplus.com/facepp/v3/faceset/getdetail" `
            -Method POST `
            -Body $getBody

        $facesetToken = $getResponse.faceset_token
        Write-Host "Existing FaceSet token loaded: $facesetToken"
    }
    else {
        Write-Host "ERROR: Unexpected error:"
        Write-Host $_
        exit
    }
}

# ---- GENERATE CONFIG FILE ----
Write-Host "`n[2/3] Generating config file..."

$configText = @"
========================================
Face++ Configuration
Generated: $(Get-Date)
========================================

API_KEY=$apiKey
API_SECRET=$apiSecret
FACESET_TOKEN=$facesetToken
OUTER_ID=$outerId

========================================
Use these values in:
1. Supabase Edge Function secrets
2. React web app
3. ESP32-CAM firmware
========================================
"@

$configPath = "faceset-config.txt"
$configText | Out-File -FilePath $configPath -Encoding UTF8

Write-Host "Configuration saved to: $configPath"

# ---- GENERATE BAT FILE FOR SUPABASE SECRETS ----
Write-Host "`n[3/3] Creating Supabase secret setter..."

$batText = @"
@echo off
echo Setting Supabase secrets...
supabase secrets set FACEPP_API_KEY=$apiKey
supabase secrets set FACEPP_API_SECRET=$apiSecret
supabase secrets set FACEPP_FACESET_TOKEN=$facesetToken
echo Done!
pause
"@

$batPath = "set-supabase-secrets.bat"
$batText | Out-File -FilePath $batPath -Encoding ASCII

Write-Host "Batch file created: $batPath"

Write-Host "`n========================================"
Write-Host "  Setup Complete!"
Write-Host "========================================"
