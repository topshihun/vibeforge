$files = Get-ChildItem "D:\doc\vibeforge\tank-war\js\*.js"
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw
    $open = [regex]::Matches($c, '{').Count
    $close = [regex]::Matches($c, '}').Count
    Write-Host ($f.Name + ": open=" + $open + " close=" + $close + " diff=" + ($open - $close))
}
