@echo off
echo Verificando instalacion de Java...
echo.
java -version
echo.
echo Verificando JAVA_HOME...
if defined JAVA_HOME (
    echo JAVA_HOME esta configurado: %JAVA_HOME%
) else (
    echo JAVA_HOME NO esta configurado
)
echo.
pause
