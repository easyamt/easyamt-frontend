export const mascotCopy = {
  es: {
    responding: 'Esto es lo que encontré en tu carta.', playMotion: 'Animar gato', pauseMotion: 'Pausar gato',
    chat: {
      open: 'Preguntar sobre la carta', close: 'Cerrar preguntas', title: 'Habla con tu gato',
      question: 'Tu pregunta', send: 'Enviar pregunta', waiting: 'Leyendo tu pregunta…', you: 'Tú', messages: 'Conversación sobre la carta',
      notice: 'Las respuestas pueden contener errores. Comprueba la carta original. La conversación se borra al salir del documento.',
      notReady: 'Podrás hacer preguntas cuando termine el análisis.', notGrounded: 'Esta respuesta no tiene una cita que la respalde.',
      englishFallback: 'El chat responde en inglés o español.',
      errors: {
        request_failed: 'No se pudo conectar. Tu pregunta sigue aquí para que puedas reintentarlo.',
        quota_exceeded: 'Has alcanzado el límite diario de preguntas. Inténtalo mañana.',
        unauthorized: 'Tu sesión ha caducado. Vuelve a iniciar sesión.', not_found: 'La carta ya no está disponible.',
        document_not_ready: 'Espera a que termine el análisis.', validation_error: 'Revisa tu pregunta. El máximo es de 1000 caracteres.',
        llm_unavailable: 'El asistente no está disponible en este momento. Inténtalo de nuevo.',
        llm_invalid_output: 'No se pudo interpretar la respuesta. Puedes reintentarlo.',
        database_unavailable: 'No se puede acceder a la carta en este momento.',
      },
    },
  },
  en: {
    responding: 'Here is what I found in your letter.', playMotion: 'Animate cat', pauseMotion: 'Pause cat',
    chat: {
      open: 'Ask about the letter', close: 'Close questions', title: 'Talk to your cat',
      question: 'Your question', send: 'Send question', waiting: 'Reading your question…', you: 'You', messages: 'Letter conversation',
      notice: 'Answers may contain mistakes. Check the original letter. This conversation clears when you leave the document.',
      notReady: 'You can ask questions once the analysis finishes.', notGrounded: 'This answer has no supporting citation.',
      englishFallback: 'Chat replies are available in English or Spanish.',
      errors: {
        request_failed: 'Could not connect. Your question is still here so you can retry.',
        quota_exceeded: 'You have reached the daily question limit. Try again tomorrow.',
        unauthorized: 'Your session has expired. Sign in again.', not_found: 'This letter is no longer available.',
        document_not_ready: 'Wait for the analysis to finish.', validation_error: 'Check your question. The limit is 1000 characters.',
        llm_unavailable: 'The assistant is unavailable right now. Please try again.',
        llm_invalid_output: 'The reply could not be read. You can try again.',
        database_unavailable: 'The letter cannot be accessed right now.',
      },
    },
  },
  de: {
    responding: 'Das habe ich in Ihrem Brief gefunden.', playMotion: 'Katze animieren', pauseMotion: 'Katze pausieren',
    chat: {
      open: 'Zum Brief fragen', close: 'Fragen schließen', title: 'Mit Ihrer Katze sprechen',
      question: 'Ihre Frage', send: 'Frage senden', waiting: 'Ihre Frage wird gelesen…', you: 'Sie', messages: 'Gespräch zum Brief',
      notice: 'Antworten können Fehler enthalten. Prüfen Sie den Originalbrief. Das Gespräch wird beim Verlassen des Briefes gelöscht.',
      notReady: 'Nach der Analyse können Sie Fragen stellen.', notGrounded: 'Diese Antwort hat kein unterstützendes Zitat.',
      englishFallback: 'Der Chat antwortet auf Englisch. Für Spanisch wechseln Sie die Sprache.',
      errors: {
        request_failed: 'Keine Verbindung. Ihre Frage bleibt für einen erneuten Versuch erhalten.',
        quota_exceeded: 'Das tägliche Fragenlimit ist erreicht. Versuchen Sie es morgen erneut.',
        unauthorized: 'Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an.', not_found: 'Dieser Brief ist nicht mehr verfügbar.',
        document_not_ready: 'Warten Sie auf das Ende der Analyse.', validation_error: 'Prüfen Sie Ihre Frage. Maximal 1000 Zeichen.',
        llm_unavailable: 'Der Assistent ist gerade nicht verfügbar. Versuchen Sie es erneut.',
        llm_invalid_output: 'Die Antwort konnte nicht gelesen werden. Versuchen Sie es erneut.',
        database_unavailable: 'Auf den Brief kann gerade nicht zugegriffen werden.',
      },
    },
  },
} as const
