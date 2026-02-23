
Add-Type -AssemblyName System.Drawing
$source = "c:\Users\Marcelo\Documents\nexcoin\public\assets\logos\logo_source.png"
$whiteDest = "c:\Users\Marcelo\Documents\nexcoin\public\assets\logos\logo_white.png"
$blackDest = "c:\Users\Marcelo\Documents\nexcoin\public\assets\logos\logo_black.png"

# Copy as black logo first
Copy-Item $source $blackDest

try {
    $img = New-Object System.Drawing.Bitmap($source)
    $newImg = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
    
    for ($y = 0; $y -lt $img.Height; $y++) {
        for ($x = 0; $x -lt $img.Width; $x++) {
            $pixel = $img.GetPixel($x, $y)
            if ($pixel.A -gt 0) {
                # Invert logic: If it's dark, make it white. 
                # Actually, simpler: just make every non-transparent pixel white.
                $newImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($pixel.A, 255, 255, 255))
            }
            else {
                $newImg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }
    $newImg.Save($whiteDest, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    $newImg.Dispose()
    Write-Host "White logo generated successfully."
}
catch {
    Write-Host "Error generating white logo: $_"
}
