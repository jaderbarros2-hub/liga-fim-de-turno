<#
  Baixa as ilustrações (art_crop) do Scryfall para as cartas de um lista-<grupo>.json.
  Premodern: a impressão mais antiga (arte original, até 2003). Pauper e Limited: a mais recente.
  Depois o Claude amplia com IA (upscale x4) e importa para o banco.

  Uso (PowerShell, na raiz do projeto):
    powershell -ExecutionPolicy Bypass -File scripts\baixar_scryfall.ps1 premodern

  Saída: artes-originais\<grupo>\_scryfall\"Carta (Artista) [Coleção].jpg"
#>
param([Parameter(Mandatory = $true)][ValidateSet("pauper", "premodern", "limited")][string]$Grupo)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$pasta = Join-Path "artes-originais" $Grupo
$lista = Join-Path $pasta "lista-$Grupo.json"
if (-not (Test-Path $lista)) { Write-Host "Não achei $lista. Baixe no Painel -> Artes e salve nessa pasta." -ForegroundColor Red; exit 1 }
$saida = Join-Path $pasta "_scryfall"
New-Item -ItemType Directory -Force -Path $saida | Out-Null

$itens = (Get-Content $lista -Raw -Encoding UTF8 | ConvertFrom-Json).itens
$h = @{ "User-Agent" = "LigaFimDeTurno/1.0 (artes do portal)"; "Accept" = "application/json" }
$filtro = '-is:digital -is:promo -st:box -st:promo -st:funny -st:memorabilia -st:masterpiece -is:universesbeyond game:paper (st:core or st:expansion or st:masters or st:draft_innovation or st:starter)'
if ($Grupo -eq "premodern") { $filtro += ' date<=2003-07-30'; $dir = "asc" } else { $dir = "desc" }

function Limpar([string]$t) { ($t -replace '[<>:"/\\|?*]', '').Trim() }
$ok = 0
foreach ($i in $itens) {
  $carta = $i.carta
  try {
    $q = "!`"$carta`" $filtro"
    $url = "https://api.scryfall.com/cards/search?unique=prints&order=released&dir=$dir&q=$([uri]::EscapeDataString($q))"
    $c = (Invoke-RestMethod -Uri $url -Headers $h -TimeoutSec 30).data[0]
    $face = if ($c.card_faces) { $c.card_faces[0] } else { $null }
    $img = if ($c.image_uris) { $c.image_uris.art_crop } else { $face.image_uris.art_crop }
    $artista = if ($c.artist) { $c.artist } else { $face.artist }
    $nome = Limpar "$carta ($artista) [$($c.set_name)].jpg"
    $destino = Join-Path $saida $nome
    if (-not (Test-Path -LiteralPath $destino)) {
      $tmp = Join-Path $saida "baixando.tmp"
      Invoke-WebRequest -Uri $img -Headers @{ "User-Agent" = $h["User-Agent"] } -OutFile $tmp -UseBasicParsing -TimeoutSec 60
      Move-Item -LiteralPath $tmp -Destination $destino -Force
    }
    Write-Host "  ok $nome" -ForegroundColor Green
    $ok++
  } catch {
    Write-Host "  x  $carta  $($_.Exception.Message)" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 150
}
Write-Host "`n$ok de $($itens.Count) baixadas em $saida" -ForegroundColor Cyan
