# 청소타워 배포 자동화 스크립트
# 사용법: .\deploy-custom.ps1 [-SkipBuild] [-FunctionsOnly] [-HostingOnly]
param(
    [switch]$SkipBuild,
    [switch]$FunctionsOnly,
    [switch]$HostingOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  청소타워 배포 자동화" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy.MM.dd HH:mm:ss')" -ForegroundColor DarkGray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. 프로젝트 디렉토리 확인
if (-not (Test-Path "$ProjectRoot\package.json")) {
    Write-Host "[ERROR] package.json을 찾을 수 없습니다. 프로젝트 루트에서 실행하세요." -ForegroundColor Red
    exit 1
}

# 2. Functions만 배포하는 경우
if ($FunctionsOnly) {
    Write-Host "[STEP] Firebase Functions만 배포합니다..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    firebase deploy --only functions
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Functions 배포 실패!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    Write-Host ""
    Write-Host "[DONE] Functions 배포 완료!" -ForegroundColor Green
    exit 0
}

# 3. 빌드 단계
if (-not $SkipBuild) {
    # 3a. TypeScript 컴파일
    Write-Host "[STEP 1/4] TypeScript 컴파일..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    npx tsc -b
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] TypeScript 컴파일 실패!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "  -> TypeScript 컴파일 완료" -ForegroundColor Green

    # 3b. Vite 빌드
    Write-Host "[STEP 2/4] Vite 프로덕션 빌드..." -ForegroundColor Yellow
    npx vite build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Vite 빌드 실패!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "  -> Vite 빌드 완료" -ForegroundColor Green

    # 3c. 프리렌더링 (SEO)
    Write-Host "[STEP 3/4] SEO 프리렌더링 (Puppeteer)..." -ForegroundColor Yellow
    node prerender.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] 프리렌더링 실패!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "  -> 프리렌더링 완료" -ForegroundColor Green
    Pop-Location
} else {
    Write-Host "[SKIP] 빌드 건너뜀 (--SkipBuild)" -ForegroundColor DarkYellow
}

# 4. Firebase 배포
if ($HostingOnly) {
    Write-Host "[STEP 4/4] Firebase Hosting만 배포..." -ForegroundColor Yellow
} else {
    Write-Host "[STEP 4/4] Firebase 전체 배포 (Hosting + Functions)..." -ForegroundColor Yellow
}

Push-Location $ProjectRoot
if ($HostingOnly) {
    firebase deploy --only hosting
} else {
    firebase deploy --only hosting,functions
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Firebase 배포 실패!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  배포 완료!" -ForegroundColor Green
Write-Host "  https://cheongsotower.kr" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# 5. 배포 후 SEO 상태 확인
Write-Host "[POST] 배포 후 SEO 상태 점검 중..." -ForegroundColor Cyan
Push-Location $ProjectRoot
if (Test-Path "check-naver-index.mjs") {
    node check-naver-index.mjs
}
Pop-Location
