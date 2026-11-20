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
$base = "https://www.artofmtg.com/art"
$ua = @{ "User-Agent" = "LigaFimDeTurno/1.0 (artes do portal)" }
$relatorio = @()
$ok = 0

function Limpar([string]$t) { ($t -replace '[<>:"/\\|?*]', '').Trim() }
function Texto([string]$html) { [System.Net.WebUtility]::HtmlDecode(($html -replace '<[^>]+>', '')).Trim() }

Write-Host "Buscando $($itens.Count) cartas no Art of MtG..." -ForegroundColor Cyan
foreach ($i in $itens) {
  $carta = $i.carta
  try {
    # Página da arte: https://www.artofmtg.com/art/<nome-da-carta>/
    $slug = (($carta.ToLower() -replace "['’,:!.]", '') -replace '[^a-z0-9]+', '-').Trim('-')
    $html = $null
    foreach ($s in @($slug, "$slug-2")) {
      try { $html = (Invoke-WebRequest -Uri "$base/$s/" -Headers $ua -UseBasicParsing -TimeoutSec 30).Content; $pagina = "$base/$s/"; break } catch { }
    }
    if (-not $html) { $relatorio += "SEM PÁGINA  $carta  ($base/$slug/)"; Write-Host "  -  $carta (não tem no Art of MtG)" -ForegroundColor DarkYellow; continue }

    # Título: "Waterspout Warden MtG Art from Bloomburrow Set by J.P. Targete - Art of Magic: the Gathering"
    $titulo = if ($html -match '<title>([^<]+)</title>') { Texto $Matches[1] } else { "" }
    $artista = if ($titulo -match '\bby\s+(.+?)\s+-\s+Art of Magic') { $Matches[1] } elseif ($titulo -match '\bby\s+(.+?)\s*$') { $Matches[1] } else { $i.artista }
    $colecao = if ($titulo -match '\bfrom\s+(.+?)\s+Set\b') { $Matches[1] } else { $i.colecao }

    # Imagem: og:image (tamanho original); senão a maior de wp-content/uploads na página
    $img = $null
    if ($html -match '<meta[^>]+property="og:image"[^>]+content="([^"]+)"') { $img = $Matches[1] }
    elseif ($html -match '<meta[^>]+content="([^"]+)"[^>]+property="og:image"') { $img = $Matches[1] }
    if (-not $img) {
      $img = [regex]::Matches($html, 'https://[^"''\s]+/wp-content/uploads/[^"''\s]+?\.(jpe?g|png)') |
        ForEach-Object { $_.Value -replace '-\d{2,4}x\d{2,4}(?=\.(jpe?g|png)$)', '' } | Select-Object -First 1
    }
    if (-not $img) { $relatorio += "SEM IMAGEM  $carta  $pagina"; Write-Host "  -  $carta (página sem imagem)" -ForegroundColor DarkYellow; continue }

    $ext = [IO.Path]::GetExtension(($img -split '\?')[0])
    $nome = Limpar "$carta ($artista) [$colecao]$ext"
    $destino = Join-Path $pasta $nome
    # Baixa com nome provisório e renomeia: o PowerShell trata [ ] no caminho como curinga
    if (-not (Test-Path -LiteralPath $destino)) {
      $tmp = Join-Path $pasta "baixando.tmp"
      Invoke-WebRequest -Uri $img -Headers $ua -OutFile $tmp -UseBasicParsing -TimeoutSec 60
      Move-Item -LiteralPath $tmp -Destination $destino -Force
    }
    $kb = [math]::Round((Get-Item -LiteralPath $destino).Length / 1KB)
    $relatorio += "OK  $nome  ($kb KB)  $pagina"
    Write-Host "  ok $nome ($kb KB)" -ForegroundColor Green
    $ok++
  } catch {
    $relatorio += "ERRO  $carta  $($_.Exception.Message)"
    Write-Host "  x  $carta  $($_.Exception.Message)" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 400
}

$relatorio | Set-Content (Join-Path $pasta "relatorio.txt") -Encoding UTF8
Write-Host "`n$ok de $($itens.Count) baixadas. Relatório: $pasta\relatorio.txt" -ForegroundColor Cyan
