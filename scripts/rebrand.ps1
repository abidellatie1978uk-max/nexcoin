
$files = @(
    "styles/globals.css",
    "setup-mobile.sh",
    "scripts/remove-bold.js",
    "scripts/remove-all-bold.py",
    "QUICK_START_MOBILE.md",
    "MOBILE_BUILD_GUIDE.md",
    "locales/pt-BR.ts",
    "locales/es.ts",
    "locales/en-US.ts",
    "lib/translations.ts",
    "lib/pixTransferUtils.ts",
    "lib/notifications.ts",
    "lib/cryptoTransferUtils.ts",
    "lib/bankAccountGenerator.ts",
    "index.html",
    "contexts/NotificationContext.tsx",
    "contexts/LocationContext.tsx",
    "contexts/AuthContext.tsx",
    "components/WithdrawReceipt.tsx",
    "components/WithdrawFiat.tsx",
    "components/WithdrawAddress.tsx",
    "components/TermsMenu.tsx",
    "components/TermsAndConditions.tsx",
    "components/SplashScreen.tsx",
    "components/Receive.tsx",
    "components/PrivacyPolicy.tsx",
    "components/PendingApproval.tsx",
    "components/NewProfile.tsx",
    "components/LocationBlocked.tsx",
    "components/LandingPage.tsx",
    "components/FirestoreRulesHelper.tsx",
    "components/FiatAddFunds.tsx",
    "components/DeleteAccount.tsx",
    "components/CountrySelection.tsx",
    "components/CameraBlocked.tsx",
    "components/AppPreferences.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Updating $file"
        (Get-Content $file) -replace 'Ethertron', 'NexCoin' | Set-Content $file
    }
}
