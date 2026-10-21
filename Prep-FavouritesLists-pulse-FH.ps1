#Requires -Modules PnP.PowerShell

[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Test', 'Production')]
    [string]$Environment,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$Tenant,

    [Parameter(Mandatory)]
    [guid]$ClientId
)

$ErrorActionPreference = 'Stop'

if ($ClientId -eq [guid]::Empty) {
    throw 'A valid application client ID is required.'
}

# Keep the target sites aligned with the application configuration.
$siteUrl = switch ($Environment) {
    'Test' {
        'https://fhatesttenant.sharepoint.com/sites/pulse-FH'
    }
    'Production' {
        'https://healthbc.sharepoint.com/sites/pulse-FH'
    }
}

Import-Module PnP.PowerShell -ErrorAction Stop

Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Target site: $siteUrl" -ForegroundColor Cyan

Connect-PnPOnline `
    -Url $siteUrl `
    -Tenant $Tenant `
    -ClientId ($ClientId.ToString()) `
    -Interactive `
    -ValidateConnection `
    -ErrorAction Stop

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
    throw 'Legacy favourites storage exists. Review it before continuing; this script does not migrate or convert existing storage.'
}
$storageTargets = @(
    @{
        Title = 'Pulse homepage quick links'
        Path = 'Lists/PulseHomepageQuickLinks'
    },
    @{
        Title = 'Pulse homepage quick links catalogue'
        Path = 'Lists/PulseHomepageQuickLinksCatalogue'
    }
)

# Validate both destinations before creating or configuring anything.
foreach ($storageTarget in $storageTargets) {
    $expectedUrl = "$webPath/$($storageTarget.Path)"

    $atUrl = @($existingLists | Where-Object {
        $_.RootFolder.ServerRelativeUrl -eq $expectedUrl
    })

    $namedLists = @($existingLists | Where-Object {
        $_.Title -eq $storageTarget.Title
    })

    if ($atUrl.Count -gt 1) {
        throw "Multiple resources were found at $expectedUrl."
    }

    if ($atUrl.Count -eq 1) {
        # Template 100 is a custom list; a document library is not suitable.
        if ([int]$atUrl[0].BaseTemplate -ne 100) {
            throw "The resource at $expectedUrl is not a custom list."
        }

        # The catalogue is still located by display name in the application.
        if ($storageTarget.Path -eq 'Lists/PulseHomepageQuickLinksCatalogue') {
            if (
                $atUrl[0].Title -ne $storageTarget.Title -or
                $namedLists.Count -ne 1
            ) {
                throw 'The catalogue name or location is ambiguous. Review it before continuing.'
            }
        }
    }
    elseif ($namedLists.Count -gt 0) {
        throw "The name '$($storageTarget.Title)' is already used at another URL. This script will not rename or convert existing storage."
    }
}

#------------------------------------------------------------
# Create or reuse the personal JSON storage list
#------------------------------------------------------------
$personalTitle = 'Pulse homepage quick links'
$personalPath = 'Lists/PulseHomepageQuickLinks'
$personalUrl = "$webPath/$personalPath"

# Resolve by URL so an old library cannot be selected by its display name.
$personalList = $existingLists | Where-Object {
    $_.RootFolder.ServerRelativeUrl -eq $personalUrl
}

if (-not $personalList) {
    Write-Host "Creating personal quick links list..." -ForegroundColor Green

    New-PnPList `
        -Title $personalTitle `
        -Template GenericList `
        -Url $personalPath `
        -OnQuickLaunch:$false | Out-Null

    $personalList = Get-PnPList -Identity $personalUrl -ErrorAction Stop
}
else {
    Write-Host "Using the existing personal quick links list." -ForegroundColor Yellow
}

# Apply the required storage settings without changing role assignments.
Set-PnPList `
    -Identity $personalList.Id `
    -EnableAttachments $true `
    -ReadSecurity AllUsersReadAccessOnItemsTheyCreate `
    -WriteSecurity WriteOnlyMyItems `
    -NoCrawl `
    -ErrorAction Stop

# Support the application's lookup by the user's GUID in Title.
Set-PnPField `
    -List $personalList.Id `
    -Identity 'Title' `
    -Values @{ Indexed = $true } `
    -ErrorAction Stop

Write-Host "Personal storage settings configured." -ForegroundColor Green

Write-Warning 'Verify the custom no-delete permission assignments before deployment. This script does not change role assignments.'
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
