<#
  Baixa artes em alta resolução do Art of MtG (artofmtg.com) para as cartas
  de um lista-<grupo>.json gerado em Painel -> Artes.

  Uso (PowerShell, na raiz do projeto):
    powershell -ExecutionPolicy Bypass -File scripts\baixar_artes.ps1 pauper

  Antes: salve o lista-pauper.json em artes-originais\pauper\
  Depois: as imagens ficam na mesma pasta, como "Carta (Artista) [Coleção].jpg",
  e o relatório em artes-originais\pauper\relatorio.txt.
#>
param([Parameter(Mandatory = $true)][ValidateSet("pauper", "premodern", "limited")][string]$Grupo)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$pasta = Join-Path "artes-originais" $Grupo
$lista = Join-Path $pasta "lista-$Grupo.json"
if (-not (Test-Path $lista)) { Write-Host "Não achei $lista. Baixe no Painel -> Artes e salve nessa pasta." -ForegroundColor Red; exit 1 }

$itens = (Get-Content $lista -Raw -Encoding UTF8 | ConvertFrom-Json).itens
$api = "https://www.artofmtg.com/wp-json/wp/v2/posts"
$ua = @{ "User-Agent" = "LigaFimDeTurno/1.0 (artes do portal)" }
$relatorio = @()
$ok = 0

function Limpar([string]$t) { ($t -replace '[<>:"/\\|?*]', '').Trim() }
function Texto([string]$html) { [System.Net.WebUtility]::HtmlDecode(($html -replace '<[^>]+>', '')).Trim() }

Write-Host "Buscando $($itens.Count) cartas no Art of MtG..." -ForegroundColor Cyan
foreach ($i in $itens) {
  $carta = $i.carta
  try {
    $url = "${api}?search=$([uri]::EscapeDataString($carta))&per_page=10&_fields=title,content,link"
    $posts = Invoke-RestMethod -Uri $url -Headers $ua -TimeoutSec 30
    # Só posts cujo título começa com o nome exato da carta
    $padrao = "^" + [regex]::Escape($carta) + "\s+(MtG\s+)?Art\b"
    $achados = @($posts | Where-Object { (Texto $_.title.rendered) -match $padrao })
    if (-not $achados.Count) { $relatorio += "SEM RESULTADO  $carta"; Write-Host "  -  $carta (não encontrada)" -ForegroundColor DarkYellow; continue }

    $baixou = $false
    foreach ($p in $achados) {
      $titulo = Texto $p.title.rendered
      # Ex.: "Counterspell MtG Art from Modern Horizons 2 Set by Zack Stella"
      $artista = if ($titulo -match '\bby\s+(.+?)\s*$') { $Matches[1] } else { $i.artista }
      $colecao = if ($titulo -match '\bfrom\s+(.+?)\s+Set\b') { $Matches[1] } else { $i.colecao }
      $imgs = [regex]::Matches($p.content.rendered, 'https://[^"''\s]+/wp-content/uploads/[^"''\s]+?\.(jpe?g|png)') | ForEach-Object { $_.Value }
      # Original sem o sufixo de miniatura (-1024x768)
      $img = $imgs | ForEach-Object { $_ -replace '-\d{2,4}x\d{2,4}(?=\.(jpe?g|png)$)', '' } | Select-Object -First 1
      if (-not $img) { continue }
      $ext = [IO.Path]::GetExtension($img)
      $nome = Limpar "$carta ($artista) [$colecao]$ext"
      $destino = Join-Path $pasta $nome
      if (-not (Test-Path $destino)) { Invoke-WebRequest -Uri $img -Headers $ua -OutFile $destino -UseBasicParsing -TimeoutSec 60 }
      $kb = [math]::Round((Get-Item $destino).Length / 1KB)
      $relatorio += "OK  $nome  ($kb KB)  $($p.link)"
      Write-Host "  ok $nome ($kb KB)" -ForegroundColor Green
      $ok++; $baixou = $true
      break  # uma arte por carta
    }
    if (-not $baixou) { $relatorio += "SEM IMAGEM  $carta"; Write-Host "  -  $carta (post sem imagem)" -ForegroundColor DarkYellow }
  } catch {
    $relatorio += "ERRO  $carta  $($_.Exception.Message)"
    Write-Host "  x  $carta  $($_.Exception.Message)" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 400
}

$relatorio | Set-Content (Join-Path $pasta "relatorio.txt") -Encoding UTF8
Write-Host "`n$ok de $($itens.Count) baixadas. Relatório: $pasta\relatorio.txt" -ForegroundColor Cyan
