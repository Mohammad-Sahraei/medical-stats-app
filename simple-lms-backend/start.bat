@echo off
:: Ensure the working directory is the folder where this batch file resides
cd /d "%~dp0"

echo ==================================================
echo       Starting School & Exam Management API        
echo ==================================================
echo.

echo [1/4] Checking virtual environment...
if not exist ".venv" goto :novenv
if not exist ".venv\Scripts\activate.bat" goto :noactivate

echo [2/4] Activating virtual environment...
call .venv\Scripts\activate.bat

echo [3/4] Checking database...
if exist "instance\school.db" goto :dbfound
if exist "school.db" goto :dbfound

echo Database not found. Initializing database and default accounts...
python init_db.py
goto :dbsetup_done

:dbfound
echo Database found. Skipping initialization.

:dbsetup_done
echo.
echo [4/4] Launching Flask Server...
echo Server running at http://localhost:5000/docs/
echo Press Ctrl+C to stop the server.
echo.
python run.py

:: If the server exits for any reason, pause so the user can read any console error messages
echo.
echo ==================================================
echo Server has stopped.
echo ==================================================
pause
exit /b

:novenv
echo [ERROR] Virtual environment (.venv) folder not found.
echo Please ensure you are running this from the project root folder.
echo.
pause
exit /b

:noactivate
echo [ERROR] Virtual environment activation script not found at .venv\Scripts\activate.bat.
echo.
pause
exit /b
