@echo off
powershell.exe -NoProfile -WindowStyle Hidden -File "%~dp0udp_relay.ps1" >> "%~dp0udp_relay.log" 2>&1
