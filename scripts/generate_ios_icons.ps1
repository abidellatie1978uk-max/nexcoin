
# Gera os ícones iOS para uso no Xcode (AppIcon.appiconset)
# Execute no Windows e depois leve o resultado para o Mac/Xcode

Add-Type -AssemblyName System.Drawing

$logoBlack = "c:\Users\Marcelo\Documents\nexcoin\logo\logo-preta.png"
$outDir = "c:\Users\Marcelo\Documents\nexcoin\ios_icons\AppIcon.appiconset"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Make-IOSIcon {
    param ([string]$Src, [string]$Dst, [int]$W, [int]$H, [string]$BgColor = "#FFFFFF")
    $r = [Convert]::ToInt32($BgColor.Substring(1, 2), 16)
    $gv = [Convert]::ToInt32($BgColor.Substring(3, 2), 16)
    $b = [Convert]::ToInt32($BgColor.Substring(5, 2), 16)

    $src_img = [System.Drawing.Image]::FromFile($Src)
    $bmp = New-Object System.Drawing.Bitmap($W, $H)
    $bmp.SetResolution(72, 72)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, $r, $gv, $b))
    $g.FillRectangle($bgBrush, 0, 0, $W, $H)
    $padding = [int]($W * 0.12)
    $inner = $W - 2 * $padding
    $g.DrawImage($src_img, $padding, $padding, $inner, $inner)
    $bmp.Save($Dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $bgBrush.Dispose(); $g.Dispose(); $bmp.Dispose(); $src_img.Dispose()
}

# iOS icon sizes (points x scale = pixels)
$icons = @(
    @{file = "Icon-20@1x.png"; w = 20 },
    @{file = "Icon-20@2x.png"; w = 40 },
    @{file = "Icon-20@3x.png"; w = 60 },
    @{file = "Icon-29@1x.png"; w = 29 },
    @{file = "Icon-29@2x.png"; w = 58 },
    @{file = "Icon-29@3x.png"; w = 87 },
    @{file = "Icon-40@1x.png"; w = 40 },
    @{file = "Icon-40@2x.png"; w = 80 },
    @{file = "Icon-40@3x.png"; w = 120 },
    @{file = "Icon-60@2x.png"; w = 120 },
    @{file = "Icon-60@3x.png"; w = 180 },
    @{file = "Icon-76@1x.png"; w = 76 },
    @{file = "Icon-76@2x.png"; w = 152 },
    @{file = "Icon-83.5@2x.png"; w = 167 },
    @{file = "Icon-1024@1x.png"; w = 1024 }
)

foreach ($icon in $icons) {
    $dst = Join-Path $outDir $icon.file
    Write-Host "➤ iOS icon $($icon.file)  →  $($icon.w)x$($icon.w)"
    Make-IOSIcon -Src $logoBlack -Dst $dst -W $icon.w -H $icon.w -BgColor "#FFFFFF"
}

Write-Host ""
Write-Host "✅ Ícones iOS gerados em: $outDir"
Write-Host "   Copie a pasta AppIcon.appiconset para dentro do seu .xcassets no Xcode."
