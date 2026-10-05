#Requires -Modules PnP.PowerShell

$ErrorActionPreference = "Stop"

$siteUrl = "https://fhatesttenant.sharepoint.com/sites/pulse-jen-fh"

$ClientID = "4662122e-5c0b-4505-ba36-48fdfb70f1b4"
# PROD 8d03328a-0763-4912-a3c8-e0e110015be0

Connect-PnPOnline -Url $siteUrl -ClientId $ClientID -Tenant "fhatesttenant.onmicrosoft.com" -interactive

Import-Module PnP.PowerShell

# Check storage names and paths before creating anything.
$existingLists = @(Get-PnPList -Includes RootFolder -ErrorAction Stop)
$webPath = ([uri]$siteUrl).AbsolutePath.TrimEnd('/')
$legacyLists = @($existingLists | Where-Object {
    $_.Title -in @('MyFavourites', 'Pulse Favourites Catalog') -or
    $_.RootFolder.ServerRelativeUrl -in @(
        "$webPath/MyFavourites", "$webPath/Lists/PulseFavouritesCatalog"
    )
})
if ($legacyLists.Count) {
    throw 'Old favourites storage exists on this site. Rename it in place before running setup; this script will not create duplicate storage.'
}
$storageTargets = @(
    @{ Title = 'Pulse homepage quick links'; Path = 'PulseHomepageQuickLinks' },
    @{ Title = 'Pulse homepage quick links catalogue'; Path = 'Lists/PulseHomepageQuickLinksCatalogue' }
)
foreach ($storageTarget in $storageTargets) {
    $expectedUrl = "$webPath/$($storageTarget.Path)"
    $namedList = @($existingLists | Where-Object { $_.Title -eq $storageTarget.Title })
    if ($namedList.Count -and $namedList[0].RootFolder.ServerRelativeUrl -ne $expectedUrl) {
        throw "The storage title '$($storageTarget.Title)' exists at an unexpected URL. Check it before running setup."
    }
    if (@($existingLists | Where-Object {
        $_.RootFolder.ServerRelativeUrl -eq $expectedUrl -and $_.Title -ne $storageTarget.Title
    }).Count) {
        throw "The required storage URL is already used by another list: $expectedUrl"
    }
}

#------------------------------------------------------------
# Create Document Library: Pulse homepage quick links
#------------------------------------------------------------
$libraryTitle = "Pulse homepage quick links"

$library = $existingLists | Where-Object { $_.Title -eq $libraryTitle }

if (-not $library)
{
    Write-Host "Creating document library '$libraryTitle'..." -ForegroundColor Green

    New-PnpList `
        -Title $libraryTitle `
        -Template DocumentLibrary `
        -Url "PulseHomepageQuickLinks" `
        -OnQuickLaunch:$false

    $library = Get-PnPList -Identity $libraryTitle

    # Exclude from search results (NoCrawl)
    Set-PnPList -Identity $libraryTitle -NoCrawl

    Write-Host "Library created." -ForegroundColor Green
}
else
{
    Write-Host "Library '$libraryTitle' already exists." -ForegroundColor Yellow
}

#------------------------------------------------------------
# Create Custom List: Pulse homepage quick links catalogue
#------------------------------------------------------------
$listTitle = "Pulse homepage quick links catalogue"

$list = $existingLists | Where-Object { $_.Title -eq $listTitle }

if (-not $list)
{
    Write-Host "Creating custom list '$listTitle'..." -ForegroundColor Green

    New-PnpList `
        -Title $listTitle `
        -Template GenericList `
        -Url "Lists/PulseHomepageQuickLinksCatalogue" `
        -OnQuickLaunch:$false

    $list = Get-PnPList -Identity $listTitle

    # Exclude from search results (NoCrawl)
    Set-PnPList -Identity $listTitle -NoCrawl

    # URL
    Add-PnPField `
        -List $listTitle `
        -DisplayName "URL" `
        -InternalName "URL" `
        -Type Text

    # Short Description
    Add-PnPField `
        -List $listTitle `
        -DisplayName "Short Description" `
        -InternalName "Description" `
        -Type Note

    # Support Page Url
    Add-PnPField `
        -List $listTitle `
        -DisplayName "Support Page Url" `
        -InternalName "SupportPageUrl" `
        -Type Text

    # Category
    Add-PnPField `
        -List $listTitle `
        -DisplayName "Category" `
        -InternalName "Category" `
        -Type Choice `
        -Choices @(
            "Clinical",
            "Non-Clinical",
            "Others"
        )

    # Enabled
    Add-PnPField `
        -List $listTitle `
        -DisplayName "Enabled" `
        -InternalName "Enabled" `
        -Type Boolean

    Set-PnPField -List $listTitle -Identity "Enabled" -Values @{
        DefaultValue = "1"
    }

    # DisplayAsNew
    Add-PnPField `
        -List $listTitle `
        -DisplayName "DisplayAsNew" `
        -InternalName "DisplayAsNew" `
        -Type Boolean

    Set-PnPField -List $listTitle -Identity "DisplayAsNew" -Values @{
        DefaultValue = "1"
    }

    # isMobileFriendly
    Add-PnPField `
        -List $listTitle `
        -DisplayName "isMobileFriendly" `
        -InternalName "isMobileFriendly" `
        -Type Boolean

    Set-PnPField -List $listTitle -Identity "isMobileFriendly" -Values @{
        DefaultValue = "1"
    }

    # isInternal
    Add-PnPField `
        -List $listTitle `
        -DisplayName "isInternal" `
        -InternalName "isInternal" `
        -Type Boolean

    Set-PnPField -List $listTitle -Identity "isInternal" -Values @{
        DefaultValue = "0"
    }

    # Include this link in a new user's initial homepage quick links
    Add-PnPField -List $listTitle -DisplayName "isStarter" -InternalName "isStarter" -Type Boolean

    Set-PnPField -List $listTitle -Identity "isStarter" -Values @{
        DefaultValue = "0"
    }

    Write-Host "List created." -ForegroundColor Green
}
else
{
    Write-Host "List '$listTitle' already exists." -ForegroundColor Yellow
}

Write-Host "Completed." -ForegroundColor Cyan
