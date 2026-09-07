$destino = "C:\shinko-toshokan-v2"
$downloads = "$env:USERPROFILE\Downloads"
$temp = "$env:TEMP\shinko-update"

Write-Host "=== Atualizando Shinko Toshokan ===" -ForegroundColor Cyan
Write-Host ""

# Pega o zip mais recente que comeca com "shinko-toshokan-v2" na pasta Downloads
# (funciona mesmo se o Windows salvar como "shinko-toshokan-v2 (1).zip")
$zip = Get-ChildItem -Path $downloads -Filter "shinko-toshokan-v2*.zip" -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $zip) {
    Write-Host "Nao encontrei nenhum arquivo shinko-toshokan-v2*.zip em $downloads" -ForegroundColor Red
    Write-Host "Baixe o zip mais recente e rode este script de novo." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit
}

Write-Host "Usando: $($zip.Name)" -ForegroundColor Yellow
Write-Host ""

Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $zip.FullName -DestinationPath $temp -Force
$origem = Join-Path $temp "shinko-toshokan-v2"

if (-not (Test-Path $origem)) {
    Write-Host "O zip nao tem a pasta shinko-toshokan-v2 esperada dentro dele." -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit
}

Write-Host "Copiando arquivos atualizados..." -ForegroundColor Cyan
robocopy "$origem\lib" "$destino\lib" /E | Out-Null
robocopy "$origem\desktop" "$destino\desktop" /E | Out-Null
robocopy "$origem\capas" "$destino\capas" /E | Out-Null

foreach ($arquivo in @("index.html", "app.js", "style.css", "manifest.json", "icon.svg", "README.md", "package.json")) {
    $caminhoOrigem = Join-Path $origem $arquivo
    if (Test-Path $caminhoOrigem) {
        Copy-Item $caminhoOrigem (Join-Path $destino $arquivo) -Force
    }
}

# data/acervo.json e data/meta.json NUNCA sao sobrescritos por aqui (sao os seus dados reais).
# So copia meta.json se ainda nao existir (primeira vez que essa funcionalidade chega).
if (-not (Test-Path "$destino\data\meta.json")) {
    Copy-Item "$origem\data\meta.json" "$destino\data\meta.json" -Force
}

Set-Location $destino

Write-Host ""
Write-Host "Instalando dependencias..." -ForegroundColor Cyan
npm install

Write-Host ""
$mensagem = Read-Host "Mensagem do commit (Enter para usar uma padrao)"
if ([string]::IsNullOrWhiteSpace($mensagem)) {
    $mensagem = "Atualiza app - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

git add .
git commit -m "$mensagem"
git push

Write-Host ""
Write-Host "PRONTO! Seu data\acervo.json e as capas que voce ja enviou NAO foram apagados." -ForegroundColor Green
Read-Host "Pressione Enter para fechar"
