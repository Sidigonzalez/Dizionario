document.addEventListener('DOMContentLoaded', () => {
    // TUA CHIAVE API
    const API_KEY = "AIzaSyD0as3vRp97KnID3AsbbqY9ZlQQPebnI2w";
    
    // Configurazione specifica per Gemini 2.5 Flash
    // Usiamo v1beta perché la 2.5 spesso richiede l'accesso alle funzioni beta
    const MODEL = "gemini-2.5-flash"; 
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const mainBtn = document.getElementById('mainBtn');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const resultArea = document.getElementById('resultArea');
    const apiResponse = document.getElementById('apiResponse');

    mainBtn.addEventListener('click', async () => {
        const text = document.getElementById('textInput').value.trim();
        const lang = document.getElementById('langTarget').value;

        if (!text) return alert("Ehi, scrivi una parola o una frase!");

        // UI Loading
        mainBtn.disabled = true;
        btnText.innerText = "Traductor AI sta analizzando...";
        loader.style.display = "block";
        resultArea.classList.add('hidden');

        // Determiniamo se è una parola o frase per dare istruzioni precise
        const isWord = text.split(/\s+/).filter(x => x).length === 1;
        
        let istruzioni = "";
        if (isWord) {
            istruzioni = `Sei un dizionario intelligente. Per la parola "${text}":
            1. Traducila in ${lang}.
            2. Descrizione: Spiega in ITALIANO cos'è (es. se scrivo 'Cane', scrivi che è un mammifero carnivoro, amico dell'uomo, ecc).
            3. Esempio: Crea una frase in ${lang} che usi questa parola.`;
        } else {
            istruzioni = `Sei un tutor linguistico. Per la frase "${text}":
            1. Traduzione: Traducila fedelmente in ${lang}.
            2. Grammatica: Spiega in ITALIANO le regole grammaticali usate in questa frase.`;
        }

        try {
            const response = await fetch(URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: istruzioni }] }]
                })
            });

            const data = await response.json();

            if (data.error) {
                // Se il modello 2.5 non è ancora disponibile sulla tua chiave specifica,
                // il codice proverà automaticamente la 1.5-flash come backup immediato
                console.log("Tentativo con 2.5 fallito, provo backup 1.5...");
                throw new Error(data.error.message);
            }

            const output = data.candidates[0].content.parts[0].text;
            apiResponse.innerText = output;
            resultArea.classList.remove('hidden');

        } catch (err) {
            // BACKUP AUTOMATICO SE LA 2.5 DÀ ERRORE "NOT FOUND"
            try {
                const backupUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
                const resBackup = await fetch(backupUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: istruzioni }] }] })
                });
                const dataBackup = await resBackup.json();
                apiResponse.innerText = dataBackup.candidates[0].content.parts[0].text;
                resultArea.classList.remove('hidden');
            } catch (finalErr) {
                apiResponse.innerText = "⚠️ Errore critico: Google non riconosce il modello. Verifica di aver attivato 'Generative Language API' nella Google Console.";
                resultArea.classList.remove('hidden');
            }
        } finally {
            mainBtn.disabled = false;
            btnText.innerText = "Analizza Ora";
            loader.style.display = "none";
        }
    });
});