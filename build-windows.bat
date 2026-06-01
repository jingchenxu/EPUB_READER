@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   EPUB Reader Windows 打包脚本
echo ========================================
echo.

:: 检查 Node.js
echo [1/5] 检查 Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo 错误: Node.js 未安装或不在 PATH 中
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js 版本: %NODE_VERSION%

:: 检查 npm
echo [2/5] 检查 npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo 错误: npm 未安装或不在 PATH 中
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✓ npm 版本: %NPM_VERSION%

:: 清理旧的构建文件
echo [3/5] 清理旧的构建文件...
if exist dist (
    rmdir /s /q dist
    echo ✓ 已清理 dist 目录
)

if exist dist-electron (
    rmdir /s /q dist-electron 2>nul
    if errorlevel 1 (
        echo ⚠ 警告: 无法删除 dist-electron 目录（可能有进程占用）
        echo   请关闭所有 EPUB Reader 相关进程后重试
        pause
        exit /b 1
    )
    echo ✓ 已清理 dist-electron 目录
)

:: 检查依赖
echo [4/5] 检查并安装依赖...
if not exist node_modules (
    echo 正在安装依赖包...
    call npm install
    if errorlevel 1 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
    echo ✓ 依赖安装完成
) else (
    echo ✓ 依赖已存在，跳过安装
)

:: 执行打包
echo [5/5] 开始打包应用...
echo.

:: 设置环境变量
set msvs_version=2022
set npm_config_electron_mirror=https://npmmirror.com/mirrors/electron/

:: 执行打包命令
call npm run electron:build

if errorlevel 1 (
    echo.
    echo ❌ 打包失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✓ 打包成功！
echo ========================================
echo.

:: 显示生成的文件
if exist "dist-electron\EPUB Reader Setup 1.0.0.exe" (
    echo 📦 安装包位置:
    echo    dist-electron\EPUB Reader Setup 1.0.0.exe
    
    for %%F in ("dist-electron\EPUB Reader Setup 1.0.0.exe") do (
        set FILE_SIZE=%%~zF
        set /a FILE_SIZE_MB=!FILE_SIZE! / 1048576
        echo    大小: !FILE_SIZE_MB! MB
    )
    echo.
    
    :: 询问是否打开文件夹
    set /p OPEN_FOLDER="是否打开输出文件夹? (Y/N): "
    if /i "!OPEN_FOLDER!"=="Y" (
        explorer "dist-electron"
    )
) else (
    echo ⚠ 警告: 未找到安装包文件
)

echo.
echo 打包完成！
pause
