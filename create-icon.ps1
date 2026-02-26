Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(128, 128)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(128, 128)),
    [System.Drawing.Color]::FromArgb(255, 15, 25, 50),
    [System.Drawing.Color]::FromArgb(255, 40, 60, 100)
)
$g.FillRectangle($brush, 0, 0, 128, 128)
# Port connector dots
$dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 86, 156, 214))
$g.FillEllipse($dotBrush, 54, 20, 20, 20)
$g.FillEllipse($dotBrush, 54, 88, 20, 20)
$g.FillEllipse($dotBrush, 20, 54, 20, 20)
$g.FillEllipse($dotBrush, 88, 54, 20, 20)
# Center circle
$centerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 78, 201, 176))
$g.FillEllipse($centerBrush, 44, 44, 40, 40)
# Lines connecting
$linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 86, 156, 214), 3)
$g.DrawLine($linePen, 64, 40, 64, 64)
$g.DrawLine($linePen, 64, 64, 64, 88)
$g.DrawLine($linePen, 40, 64, 64, 64)
$g.DrawLine($linePen, 64, 64, 88, 64)
# Label
$font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 255, 255, 255))
$g.DrawString("PORT", $font, $textBrush, 38, 108)
$g.Dispose()
$bmp.Save("media/icon-128.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Icon created"
