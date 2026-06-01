# EPUB Reader Windows 打包脚本
# 使用方法: .\build-windows.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EPUB Reader Windows 打包脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 是否安装
Write-Host "[1/5] 检查 Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Node.js 未安装或不在 PATH 中" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js 版本: $nodeVersion" -ForegroundColor Green

# 检查 npm 是否安装
Write-Host "[2/5] 检查 npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: npm 未安装或不在 PATH 中" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm 版本: $npmVersion" -ForegroundColor Green

# 清理旧的构建文件
Write-Host "[3/5] 清理旧的构建文件..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ 已清理 dist 目录" -ForegroundColor Green
}

if (Test-Path "dist-electron") {
    # 尝试删除，如果失败则提示用户手动删除
    try {
        Remove-Item -Recurse -Force "dist-electron" -ErrorAction Stop
        Write-Host "✓ 已清理 dist-electron 目录" -ForegroundColor Green
    } catch {
        Write-Host "⚠ 警告: 无法删除 dist-electron 目录（可能有进程占用）" -ForegroundColor Yellow
        Write-Host "  请关闭所有 EPUB Reader 相关进程后重试" -ForegroundColor Yellow
        exit 1
    }
}

# 安装依赖（如果需要）
Write-Host "[4/5] 检查并安装依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安装依赖包..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "错误: 依赖安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "✓ 依赖已存在，跳过安装" -ForegroundColor Green
}

# 执行打包
Write-Host "[5/5] 开始打包应用..." -ForegroundColor Yellow
Write-Host ""

# 设置环境变量
$env:msvs_version="2022"
$env:npm_config_electron_mirror="https://npmmirror.com/mirrors/electron/"

# 执行打包命令
npm run electron:build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 打包失败！" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ 打包成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 显示生成的文件
$setupExe = "dist-electron\EPUB Reader Setup 1.0.0.exe"
if (Test-Path $setupExe) {
    $fileSize = (Get-Item $setupExe).Length / 1MB
    Write-Host "📦 安装包位置:" -ForegroundColor Cyan
    Write-Host "   $setupExe" -ForegroundColor White
    Write-Host "   大小: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    
    # 询问是否打开文件夹
    $openFolder = Read-Host "是否打开输出文件夹? (Y/N)"
    if ($openFolder -eq "Y" -or $openFolder -eq "y") {
        explorer.exe "dist-electron"
    }
} else {
    Write-Host "Warning: Installer file not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Build completed!" -ForegroundColor Green
