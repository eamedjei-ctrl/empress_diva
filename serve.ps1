$listener = New-Object System.Net.HttpListener
# Accept both localhost and 127.0.0.1 to avoid hostname mismatch issues
$listener.Prefixes.Add("http://localhost:8000/")
$listener.Prefixes.Add("http://127.0.0.1:8000/")
$listener.Start()
Write-Output "Listening at http://localhost:8000/ and http://127.0.0.1:8000/"
while ($listener.IsListening) {
    $context = $listener.GetContext()
    # Log the incoming request for debugging
    Write-Output "Request: $($context.Request.HttpMethod) $($context.Request.Url.AbsolutePath)"
    Start-Job -ScriptBlock {
        param($ctx)
        Write-Output "Handling: $($ctx.Request.HttpMethod) $($ctx.Request.Url.AbsolutePath)"
        $reqUrl = $ctx.Request.Url.AbsolutePath.TrimStart('/')
        if ($reqUrl -eq '') { $reqUrl = 'index.html' }
        $filePath = Join-Path (Get-Location) $reqUrl
        if (!(Test-Path $filePath)) {
            $ctx.Response.StatusCode = 404
            $ctx.Response.ContentType = 'text/plain'
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $ctx.Response.OutputStream.Write($buffer,0,$buffer.Length)
            $ctx.Response.Close()
            Write-Output "Responded 404 for $reqUrl"
            return
        }
        $ext = [IO.Path]::GetExtension($filePath).ToLower()
        $mime = switch ($ext) {
            '.html' { 'text/html' }
            '.css' { 'text/css' }
            '.js' { 'application/javascript' }
            '.png' { 'image/png' }
            '.jpg' { 'image/jpeg' }
            '.jpeg' { 'image/jpeg' }
            '.gif' { 'image/gif' }
            '.svg' { 'image/svg+xml' }
            '.json' { 'application/json' }
            default { 'application/octet-stream' }
        }
        $ctx.Response.ContentType = $mime
        $bytes = [IO.File]::ReadAllBytes($filePath)
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
        $ctx.Response.Close()
        Write-Output "Responded 200 for $reqUrl ($($bytes.Length) bytes)"
    } -ArgumentList $context | Out-Null
}
