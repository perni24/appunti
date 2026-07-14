# Parti di una Stampante 3D e il Loro Funzionamento

Ecco le principali parti di una stampante 3D (basata sulla tecnologia FDM) e il loro funzionamento:

1.  **Telaio (Frame)**: La struttura portante che garantisce stabilità e precisione alla stampante.
2.  **Piatto di Stampa (Print Bed o Build Plate)**: La superficie su cui viene depositato il materiale fuso. Spesso è riscaldato per migliorare l'adesione e prevenire deformazioni.
3.  **Estrusore (Extruder)**: Il meccanismo che spinge il filamento di plastica verso l'hotend, controllando con precisione la quantità di materiale.
4.  **Hotend**: La parte che riscalda e fonde il filamento. È composto da:
    *   **Blocco riscaldante (Heating Block)**: Riscalda il filamento.
    *   **Termistore (Thermistor)**: Monitora e controlla la temperatura del blocco riscaldante.
    *   **Ugello (Nozzle)**: L'apertura da cui esce il filamento fuso.
5.  **Assi di Movimento (X, Y, Z)**: Sistemi che consentono il movimento della testina di stampa (o del piatto) in orizzontale (X, Y) e verticale (Z) per costruire l'oggetto strato dopo strato.
6.  **Motori Passo-Passo (Stepper Motors)**: Motori di precisione che muovono gli assi e l'estrusore per movimenti accurati.
7.  **Scheda Madre (Motherboard o Control Board)**: Il "cervello" della stampante, interpreta le istruzioni G-code e comanda tutti i componenti.
8.  **Alimentatore (Power Supply)**: Fornisce l'energia elettrica a tutti i componenti.
9.  **Filamento**: Il materiale grezzo (solitamente plastica termoplastica come PLA o ABS) che viene fuso e depositato.

## Come Funzionano Insieme

Un modello 3D digitale viene elaborato da un software (Slicer) che lo divide in strati sottili e genera un file G-code con le istruzioni per la stampante. La scheda madre legge il G-code e comanda i motori per muovere la testina di stampa, mentre l'estrusore spinge il filamento nell'hotend dove viene fuso. L'ugello deposita il materiale fuso sul piatto di stampa, strato dopo strato, fino a completare l'oggetto.
