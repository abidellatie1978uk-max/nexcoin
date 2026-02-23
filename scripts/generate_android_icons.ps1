
Add-Type -AssemblyName System.Drawing

$logoWhite = "c:\Users\Marcelo\Documents\nexcoin\logo\logo-branca.png"
$resPath = "c:\Users\Marcelo\Documents\nexcoin\android\app\src\main\res"

function Resize-Png {
    param ([string]$Src, [string]$Dst, [int]$W, [int]$H)
    $src_img = [System.Drawing.Image]::FromFile($Src)
    $bmp = New-Object System.Drawing.Bitmap($W, $H)
    $bmp.SetResolution(72, 72)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    # Transparent background (default for Bitmap)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src_img, 0, 0, $W, $H)
    $bmp.Save($Dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $src_img.Dispose()
}

function Make-LauncherIcon {
    param ([string]$Src, [string]$Dst, [int]$Size, [string]$BgColor = "#000000", [double]$PaddingRatio = 0.20)
    $r = [Convert]::ToInt32($BgColor.Substring(1, 2), 16)
    $gv = [Convert]::ToInt32($BgColor.Substring(3, 2), 16)
    $b = [Convert]::ToInt32($BgColor.Substring(5, 2), 16)

    $src_img = [System.Drawing.Image]::FromFile($Src)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $bmp.SetResolution(72, 72)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    # Fill background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, $r, $gv, $b))
    $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)

    # Draw logo with generous padding so it fits within safe zone
    $padding = [int]($Size * $PaddingRatio)
    $innerSize = $Size - 2 * $padding
    $g.DrawImage($src_img, $padding, $padding, $innerSize, $innerSize)

    $bmp.Save($Dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $bgBrush.Dispose(); $g.Dispose(); $bmp.Dispose(); $src_img.Dispose()
}

# ─────────────────────────────────────────────────────────────────
# 1) ADAPTIVE ICON FOREGROUND
#    Canvas = full mipmap size, logo uses only 50% of center
#    (Android crops ~16.7% from each side for the safe zone)
#    So logo inside foreground should not exceed ~66% of canvas
#    We use 25% padding on each side → logo = 50% of canvas ✅
# ─────────────────────────────────────────────────────────────────
$foregroundSizes = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}

foreach ($folder in $foregroundSizes.Keys) {
    $size = $foregroundSizes[$folder]
    $canvasW = $size
    $canvasH = $size

    # Make transparent canvas with logo centred at 50% size
    $padding = [int]($size * 0.25)   # 25% each side → logo = 50% of canvas
    $innerSize = $size - 2 * $padding

    $src_img = [System.Drawing.Image]::FromFile($logoWhite)
    $bmp = New-Object System.Drawing.Bitmap($canvasW, $canvasH)
    $bmp.SetResolution(72, 72)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src_img, $padding, $padding, $innerSize, $innerSize)

    $dst = Join-Path $resPath "$folder\ic_launcher_foreground.png"
    $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $src_img.Dispose()
    Write-Host "✅ Foreground [$folder] ${size}px  logo area: ${innerSize}px (padding: ${padding}px)"
}

# ─────────────────────────────────────────────────────────────────
# 2) LEGACY LAUNCHER ICON  (black bg + logo, 22% padding)
# ─────────────────────────────────────────────────────────────────
$legacySizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $legacySizes.Keys) {
    $size = $legacySizes[$folder]

    # ic_launcher.png
    $dst = Join-Path $resPath "$folder\ic_launcher.png"
    Make-LauncherIcon -Src $logoWhite -Dst $dst -Size $size -BgColor "#000000" -PaddingRatio 0.22
    Write-Host "✅ Legacy    [$folder] ${size}px"

    # ic_launcher_round.png
    $dst = Join-Path $resPath "$folder\ic_launcher_round.png"
    Make-LauncherIcon -Src $logoWhite -Dst $dst -Size $size -BgColor "#000000" -PaddingRatio 0.22
    Write-Host "✅ Round     [$folder] ${size}px"
}

Write-Host ""
Write-Host "🎉 Todos os ícones Android regenerados com padding correto!"
