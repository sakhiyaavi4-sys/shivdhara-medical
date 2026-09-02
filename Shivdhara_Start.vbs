Set WshShell = CreateObject("WScript.Shell")

' Step 1: Start Backend Server (hidden window)
WshShell.Run "cmd /c cd /d ""c:\Users\avisa\OneDrive\Desktop\shivdhara-medical\src\server"" && node index.js", 0, False

' Wait 3 seconds for backend to start
WScript.Sleep 3000

' Step 2: Start Frontend (hidden window)
WshShell.Run "cmd /c cd /d ""c:\Users\avisa\OneDrive\Desktop\shivdhara-medical"" && npm run dev", 0, False

' Wait 5 seconds for frontend to start
WScript.Sleep 5000

' Step 3: Open Browser
WshShell.Run "http://localhost:5173"
