$jsonPath = "C:\Users\PC\Desktop\CleaningTower\firebase.json"
$original = Get-Content $jsonPath -Raw
$updated = $original -replace '"site": "house-clean-hub"', '"site": "ssak-cle-home"'
Set-Content $jsonPath $updated -NoNewline
firebase deploy --only hosting
Set-Content $jsonPath $original -NoNewline
Write-Host "Done!"
