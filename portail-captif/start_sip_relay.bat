@echo off
echo === Demarrage SIP Relay ===
echo Les telephones IP doivent pointer vers 192.168.30.10:5063
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0sip_relay.ps1"
pause
