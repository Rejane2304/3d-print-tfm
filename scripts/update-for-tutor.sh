#!/bin/bash

# Reemplazar "Preguntas del Tribunal" por "Agradecimientos"
sed -i '' 's/\*Preguntas del Tribunal\*/\*Entrega del proyecto\*/g' /Users/rejanerodrigues/MASTER/3d-print-tfm/docs/TFM-PRESENTACION.md

# Reemplazar "Notas para el Tribunal" por "Notas Adicionales"
sed -i '' 's/## Notas para el Tribunal/## Notas Adicionales/g' /Users/rejanerodrigues/MASTER/3d-print-tfm/docs/TFM-PRESENTACION.md

# Reemplazar "Fin de la Presentación" por "Conclusión"
sed -i '' 's/\*\*Fin de la Presentación\*\*/\*\*Fin del Documento\*\*/g' /Users/rejanerodrigues/MASTER/3d-print-tfm/docs/TFM-PRESENTACION.md

echo "Documento actualizado para entrega al tutor"
