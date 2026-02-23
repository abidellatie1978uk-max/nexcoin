
Add-Type -AssemblyName System.Drawing
$sourcePath = "c:\Users\Marcelo\Documents\nexcoin\public\assets\logos\logo_source.png"
$resPath = "c:\Users\Marcelo\Documents\nexcoin\android\app\src\main\res"

function Resize-Image {
    param (
        [string]$Path,
        [string]$Destination,
        [int]$Width,
        [int]$Height
    )
    $img = [System.Drawing.Image]::FromFile($Path)
    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $Width, $Height)
    $bmp.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

$sizes = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}

foreach ($folder in $sizes.Keys) {
    $size = $sizes[$folder]
    $dest = Join-Path $resPath $folder
    $destFile = Join-Path $dest "ic_launcher_foreground.png"
    Write-Host "Resizing to $size into $destFile"
    Resize-Image -Path $sourcePath -Destination $destFile -Width $size -Height $size
}
